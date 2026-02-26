from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from .models import AccessRequest, EmergencyAccess
from .serializers import (
    AccessRequestSerializer, AccessRequestCreateSerializer,
    AccessResponseSerializer, EmergencyAccessSerializer,
    EmergencyAccessCreateSerializer,
)
from audit.models import AuditLog
from notifications.models import Notification
from users.email_utils import (
    email_access_requested, email_access_approved,
    email_access_rejected, email_access_revoked,
    email_emergency_access, email_emergency_access_admin,
)

User = get_user_model()


def notify(recipient, notif_type, title, message, actor_name='', reference_id=None):
    Notification.objects.create(
        recipient=recipient,
        notification_type=notif_type,
        title=title,
        message=message,
        actor_name=actor_name,
        reference_id=reference_id,
    )


class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'DOCTOR'


class IsPatient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'PATIENT'


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


# ---- Doctor: Create access request ----
class AccessRequestCreateView(generics.CreateAPIView):
    serializer_class = AccessRequestCreateSerializer
    permission_classes = [IsDoctor]

    def perform_create(self, serializer):
        req = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            target_patient=req.patient,
            action='ACCESS_REQUEST',
        )
        notify(
            recipient=req.patient,
            notif_type='ACCESS_REQUEST',
            title='Access Request from Doctor',
            message=f"Dr. {req.doctor.full_name} has requested access to your medical records. Reason: {req.reason}",
            actor_name=req.doctor.full_name,
            reference_id=req.id,
        )
        # Send real email to patient
        if req.patient.email:
            email_access_requested(
                doctor_name=req.doctor.full_name,
                reason=req.reason,
                patient_email=req.patient.email,
                patient_name=req.patient.full_name,
            )


# ---- Patient: View their incoming requests ----
class PatientAccessRequestListView(generics.ListAPIView):
    serializer_class = AccessRequestSerializer
    permission_classes = [IsPatient]

    def get_queryset(self):
        status_filter = self.request.query_params.get('status')
        qs = AccessRequest.objects.filter(patient=self.request.user)
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        return qs


# ---- Patient: Approve/Reject/Revoke a request ----
class AccessRequestResponseView(APIView):
    permission_classes = [IsPatient]

    def post(self, request, pk):
        try:
            req = AccessRequest.objects.get(pk=pk, patient=request.user)
        except AccessRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=404)

        serializer = AccessResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        patient_note = serializer.validated_data.get('patient_note', '')

        if action == 'approve':
            if req.status not in ['PENDING']:
                return Response({'error': 'Can only approve pending requests'}, status=400)
            duration = serializer.validated_data.get('duration_hours', 24)
            req.status = 'APPROVED'
            req.expires_at = timezone.now() + timedelta(hours=duration)
            req.responded_at = timezone.now()
            req.patient_note = patient_note
            req.save()
            AuditLog.objects.create(
                actor=request.user, target_patient=request.user,
                action='ACCESS_APPROVE',
                extra_data={'doctor': req.doctor.full_name}
            )
            notify(
                recipient=req.doctor,
                notif_type='ACCESS_APPROVED',
                title='Access Request Approved',
                message=f"Patient {req.patient.full_name} approved your access to their records. Access expires in {duration} hours.",
                actor_name=req.patient.full_name,
                reference_id=req.id,
            )
            if req.doctor.email:
                email_access_approved(
                    patient_name=req.patient.full_name,
                    duration_hours=duration,
                    doctor_email=req.doctor.email,
                    doctor_name=req.doctor.full_name,
                )

        elif action == 'reject':
            req.status = 'REJECTED'
            req.responded_at = timezone.now()
            req.patient_note = patient_note
            req.save()
            AuditLog.objects.create(
                actor=request.user, target_patient=request.user,
                action='ACCESS_REJECT',
                extra_data={'doctor': req.doctor.full_name}
            )
            notify(
                recipient=req.doctor, notif_type='ACCESS_REJECTED',
                title='Access Request Rejected',
                message=f"Patient {req.patient.full_name} rejected your access request.",
                actor_name=req.patient.full_name,
                reference_id=req.id,
            )
            if req.doctor.email:
                email_access_rejected(
                    patient_name=req.patient.full_name,
                    doctor_email=req.doctor.email,
                    doctor_name=req.doctor.full_name,
                )

        elif action == 'revoke':
            if req.status != 'APPROVED':
                return Response({'error': 'Can only revoke approved access'}, status=400)
            req.status = 'REVOKED'
            req.save()
            AuditLog.objects.create(
                actor=request.user, target_patient=request.user,
                action='ACCESS_REVOKE',
                extra_data={'doctor': req.doctor.full_name}
            )
            notify(
                recipient=req.doctor, notif_type='ACCESS_REVOKED',
                title='Access Revoked',
                message=f"Patient {req.patient.full_name} has revoked your access to their records.",
                actor_name=req.patient.full_name,
                reference_id=req.id,
            )
            if req.doctor.email:
                email_access_revoked(
                    patient_name=req.patient.full_name,
                    doctor_email=req.doctor.email,
                    doctor_name=req.doctor.full_name,
                )

        return Response(AccessRequestSerializer(req).data)


# ---- Doctor: See their own access requests ----
class DoctorAccessListView(generics.ListAPIView):
    serializer_class = AccessRequestSerializer
    permission_classes = [IsDoctor]

    def get_queryset(self):
        return AccessRequest.objects.filter(doctor=self.request.user)


# ---- Emergency Break-Glass ----
class EmergencyAccessView(generics.CreateAPIView):
    serializer_class = EmergencyAccessCreateSerializer
    permission_classes = [IsDoctor]

    def perform_create(self, serializer):
        access = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            target_patient=access.patient,
            action='EMERGENCY_ACCESS',
            is_emergency=True,
            extra_data={
                'reason_code': access.reason_code,
                'reason_detail': access.reason_detail,
                'patient_admit_id': access.patient_admit_id,
            }
        )
        # Notify patient (in-app + email)
        notify(
            recipient=access.patient,
            notif_type='EMERGENCY_ACCESS',
            title='⚠️ Emergency Access Used',
            message=f"Dr. {access.doctor.full_name} used emergency break-glass access to your records at {timezone.now().strftime('%I:%M %p')}. Reason: {access.reason_detail}. Access expires in 1 hour.",
            actor_name=access.doctor.full_name,
            reference_id=access.id,
        )
        if access.patient.email:
            email_emergency_access(
                doctor_name=access.doctor.full_name,
                reason_detail=access.reason_detail,
                patient_email=access.patient.email,
                patient_name=access.patient.full_name,
            )
        # Notify all admins (in-app + email)
        admins = User.objects.filter(role='ADMIN', is_active=True)
        for admin in admins:
            notify(
                recipient=admin,
                notif_type='EMERGENCY_ACCESS',
                title='⚠️ Emergency Access Triggered',
                message=f"Dr. {access.doctor.full_name} triggered emergency access on patient {access.patient.full_name} ({access.patient.patient_id}). Review required.",
                actor_name=access.doctor.full_name,
                reference_id=access.id,
            )
            if admin.email:
                email_emergency_access_admin(
                    doctor_name=access.doctor.full_name,
                    patient_name=access.patient.full_name,
                    patient_id=str(access.patient.patient_id),
                    reason_detail=access.reason_detail,
                    admin_email=admin.email,
                )


class EmergencyAccessListView(generics.ListAPIView):
    """Admin: see all emergency accesses"""
    serializer_class = EmergencyAccessSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return EmergencyAccess.objects.all()


class EmergencyAccessReviewView(APIView):
    """Admin reviews and flags emergency access"""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            access = EmergencyAccess.objects.get(pk=pk)
        except EmergencyAccess.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        access.is_reviewed_by_admin = True
        access.is_flagged_misuse = request.data.get('flag_misuse', False)
        access.admin_note = request.data.get('admin_note', '')
        access.reviewed_by = request.user
        access.save()
        return Response(EmergencyAccessSerializer(access).data)


class DoctorEmergencyListView(generics.ListAPIView):
    """Doctor sees their own emergency access history"""
    serializer_class = EmergencyAccessSerializer
    permission_classes = [IsDoctor]

    def get_queryset(self):
        return EmergencyAccess.objects.filter(doctor=self.request.user)
