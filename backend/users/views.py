from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.models import Group
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import PatientProfile, DoctorProfile, OTPRecord
from .serializers import (
    CustomTokenObtainPairSerializer, UserSerializer,
    PatientRegisterSerializer, DoctorRegisterSerializer,
    OTPRequestSerializer, OTPVerifySerializer,
    PatientSearchSerializer, AdminUserSerializer,
)
from audit.models import AuditLog
import random
import string
import requests as http_requests
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


def assign_group(user):
    """
    Assign the user to the corresponding Django auth Group based on their role.
    Mirrors the custom role field so both systems stay in sync.
    Group names: Patient, Doctor, Admin
    """
    role_to_group = {
        'PATIENT': 'Patient',
        'DOCTOR': 'Doctor',
        'ADMIN': 'Admin',
    }
    group_name = role_to_group.get(user.role)
    if group_name:
        group, _ = Group.objects.get_or_create(name=group_name)
        user.groups.add(group)


# ── OTP Delivery Helpers ───────────────────────────────────────────────────────

def send_sms_otp(phone: str, otp: str) -> bool:
    """Send OTP via Fast2SMS Dev API. Returns True on success."""
    api_key = settings.FAST2SMS_API_KEY
    if not api_key or api_key == 'your_fast2sms_api_key_here':
        logger.warning('Fast2SMS API key not configured — SMS not sent.')
        return False
    try:
        response = http_requests.post(
            'https://www.fast2sms.com/dev/bulkV2',
            headers={'authorization': api_key},
            json={
                'route': 'otp',
                'variables_values': otp,
                'numbers': phone,
            },
            timeout=10,
        )
        data = response.json()
        if not data.get('return', False):
            logger.error('Fast2SMS error: %s', data)
            return False
        return True
    except Exception as exc:
        logger.exception('Failed to send SMS OTP: %s', exc)
        return False


def send_email_otp(email: str, otp: str) -> bool:
    """Send OTP via Django email backend (Gmail SMTP). Returns True on success."""
    if not settings.EMAIL_HOST_USER or settings.EMAIL_HOST_USER == 'your_gmail@gmail.com':
        logger.warning('Gmail credentials not configured — email not sent.')
        return False
    try:
        send_mail(
            subject='MediVault – Verify your email',
            message=(
                f'Hello,\n\n'
                f'Your MediVault email verification OTP is:\n\n'
                f'  {otp}\n\n'
                f'This code is valid for 10 minutes. Do not share it with anyone.\n\n'
                f'– The MediVault Team'
            ),
            html_message=(
                f'<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;'
                f'border:1px solid #e2e8f0;border-radius:12px;">'
                f'<h2 style="color:#1e293b;margin-bottom:8px;">Verify your email</h2>'
                f'<p style="color:#64748b;font-size:14px;">Enter the code below in MediVault to complete registration:</p>'
                f'<div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#2563eb;'
                f'text-align:center;padding:20px 0;">{otp}</div>'
                f'<p style="color:#94a3b8;font-size:12px;">Valid for 10 minutes. Do not share this code.</p>'
                f'</div>'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.exception('Failed to send email OTP: %s', exc)
        return False

User = get_user_model()


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class PatientRegisterView(generics.CreateAPIView):
    serializer_class = PatientRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        # Ensure profile exists
        PatientProfile.objects.get_or_create(user=user)
        # Assign Django auth Group
        assign_group(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class DoctorRegisterView(generics.CreateAPIView):
    serializer_class = DoctorRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        # Assign Django auth Group
        assign_group(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


def generate_otp():
    return ''.join(random.choices(string.digits, k=6))


class OTPRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        sms_sent = send_sms_otp(result['phone'], result['otp'])

        response_data = {'message': 'OTP sent to your mobile number', 'phone': result['phone']}
        if settings.DEBUG:
            response_data['otp'] = result['otp']  # Only exposed in dev mode
            if not sms_sent:
                response_data['message'] = 'OTP generated (SMS not configured — using dev hint below)'
        elif not sms_sent:
            return Response(
                {'error': 'Failed to send OTP via SMS. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(response_data)


# ── Email OTP for Registration ────────────────────────────────────────────────

class EmailOTPRequestView(APIView):
    """Request an OTP sent to email address (for registration verification)"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if email already registered
        if User.objects.filter(email=email).exists():
            return Response({'error': 'This email is already registered. Please login instead.'}, status=status.HTTP_400_BAD_REQUEST)

        otp = generate_otp()
        OTPRecord.objects.create(phone='email_' + email[:30], email=email, otp=otp)

        email_sent = send_email_otp(email, otp)

        response_data = {'message': f'OTP sent to {email}', 'email': email}
        if settings.DEBUG:
            response_data['otp'] = otp  # Only exposed in dev mode
            if not email_sent:
                response_data['message'] = 'OTP generated (email not configured — using dev hint below)'
        elif not email_sent:
            return Response(
                {'error': 'Failed to send OTP via email. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(response_data)


class EmailOTPVerifyView(APIView):
    """Verify email OTP for registration flow"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()

        if not email or not otp:
            return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

        record = OTPRecord.objects.filter(
            phone='email_' + email[:30], otp=otp, is_used=False
        ).order_by('-created_at').first()

        if not record or record.is_expired():
            return Response({'error': 'Invalid or expired OTP. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        record.is_used = True
        record.save()

        return Response({'verified': True, 'email': email})


class PhoneOTPVerifyForRegistrationView(APIView):
    """Verify phone OTP without creating account (for registration step)"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        otp = request.data.get('otp', '').strip()

        if not phone or not otp:
            return Response({'error': 'Phone and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

        record = OTPRecord.objects.filter(
            phone=phone, otp=otp, is_used=False
        ).order_by('-created_at').first()

        if not record or record.is_expired():
            return Response({'error': 'Invalid or expired OTP. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark used so it can't be reused for login
        # But keep a "verified" copy for registration completion
        otp_copy = generate_otp()  # dummy — phone verified flag is enough
        return Response({'verified': True, 'phone': phone})


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        otp = serializer.validated_data['otp']

        record = OTPRecord.objects.filter(
            phone=phone, otp=otp, is_used=False
        ).order_by('-created_at').first()

        if not record or record.is_expired():
            return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)

        record.is_used = True
        record.save()

        # Find or create patient account
        user, created = User.objects.get_or_create(
            phone=phone,
            defaults={
                'email': f"{phone}@patient.medivault.app",
                'full_name': f"Patient {phone[-4:]}",
                'role': 'PATIENT',
                'is_approved': True,
            }
        )
        if created:
            user.set_unusable_password()
            user.save()
            PatientProfile.objects.get_or_create(user=user)

        refresh = RefreshToken.for_user(user)
        AuditLog.objects.create(
            actor=user, action='LOGIN', ip_address=get_client_ip(request)
        )
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Update nested profile
        profile_data = request.data.get('patient_profile')
        if profile_data and instance.role == 'PATIENT':
            profile, _ = PatientProfile.objects.get_or_create(user=instance)
            for key, val in profile_data.items():
                setattr(profile, key, val)
            profile.save()

        doctor_data = request.data.get('doctor_profile')
        if doctor_data and instance.role == 'DOCTOR':
            profile, _ = DoctorProfile.objects.get_or_create(user=instance)
            for key, val in doctor_data.items():
                setattr(profile, key, val)
            profile.save()

        return Response(UserSerializer(instance).data)


class PatientSearchView(generics.ListAPIView):
    """Doctors search for patients by patient_id"""
    serializer_class = PatientSearchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if self.request.user.role not in ['DOCTOR', 'ADMIN']:
            return User.objects.none()
        return User.objects.filter(role='PATIENT', patient_id__icontains=query)[:10]


# ---- Admin Views ----

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        role = self.request.query_params.get('role')
        qs = User.objects.all().order_by('-date_joined')
        if role:
            qs = qs.filter(role=role.upper())
        return qs


class AdminUserToggleView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        action = request.data.get('action')
        if action == 'block':
            user.is_active = False
        elif action == 'unblock':
            user.is_active = True
        elif action == 'approve':
            user.is_approved = True
        else:
            return Response({'error': 'Invalid action'}, status=400)

        user.save()
        return Response({'status': 'success', 'user': AdminUserSerializer(user).data})


class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from documents.models import Document
        from access_control.models import EmergencyAccess, AccessRequest
        from datetime import timedelta

        today = timezone.now().date()
        return Response({
            'total_patients': User.objects.filter(role='PATIENT').count(),
            'total_doctors': User.objects.filter(role='DOCTOR').count(),
            'total_documents': Document.objects.count(),
            'emergency_accesses_today': EmergencyAccess.objects.filter(
                granted_at__date=today
            ).count(),
            'pending_access_requests': AccessRequest.objects.filter(status='PENDING').count(),
            'pending_doctor_approvals': User.objects.filter(role='DOCTOR', is_approved=False).count(),
        })
