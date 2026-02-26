from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from .models import Document
from .serializers import DocumentSerializer, DocumentUploadSerializer, TimelineSerializer
from audit.models import AuditLog

User = get_user_model()


def log_action(actor, action, patient=None, document=None, is_emergency=False, request=None, extra=None):
    ip = None
    if request:
        x_ff = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_ff.split(',')[0] if x_ff else request.META.get('REMOTE_ADDR')
    AuditLog.objects.create(
        actor=actor,
        target_patient=patient,
        action=action,
        document_id=document.id if document else None,
        document_title=document.title if document else '',
        is_emergency=is_emergency,
        ip_address=ip,
        extra_data=extra or {},
    )


class IsPatientOrDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['PATIENT', 'DOCTOR', 'ADMIN']


class DocumentUploadView(generics.CreateAPIView):
    serializer_class = DocumentUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        doc = serializer.save()
        log_action(
            actor=self.request.user,
            action='DOCUMENT_UPLOAD',
            patient=doc.patient,
            document=doc,
            request=self.request
        )


class PatientDocumentListView(generics.ListAPIView):
    """Patient views their own documents. Doctors see approved scope only."""
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['document_type', 'event_type', 'is_critical']
    search_fields = ['title', 'hospital_name', 'doctor_name', 'tags']
    ordering_fields = ['document_date', 'created_at']

    def get_queryset(self):
        user = self.request.user

        if user.role == 'PATIENT':
            return Document.objects.filter(patient=user)

        elif user.role == 'DOCTOR':
            patient_id = self.request.query_params.get('patient_id')
            if not patient_id:
                return Document.objects.none()

            try:
                patient = User.objects.get(patient_id=patient_id, role='PATIENT')
            except User.DoesNotExist:
                return Document.objects.none()

            # Check normal access
            from access_control.models import AccessRequest, EmergencyAccess
            from django.utils import timezone

            approved = AccessRequest.objects.filter(
                doctor=user, patient=patient, status='APPROVED',
                expires_at__gt=timezone.now()
            ).first()

            if approved:
                scope = approved.scope
                if 'ALL' in scope:
                    return Document.objects.filter(patient=patient)
                return Document.objects.filter(patient=patient, document_type__in=scope)

            # Check emergency access
            emergency = EmergencyAccess.objects.filter(
                doctor=user, patient=patient, expires_at__gt=timezone.now()
            ).first()
            if emergency:
                return Document.objects.filter(patient=patient, is_critical=True)

            return Document.objects.none()

        elif user.role == 'ADMIN':
            patient_id = self.request.query_params.get('patient_id')
            if patient_id:
                return Document.objects.filter(patient__patient_id=patient_id)
            return Document.objects.all()

        return Document.objects.none()


class DocumentDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return Document.objects.filter(patient=user)
        return Document.objects.all()

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        doc = self.get_object()
        log_action(
            actor=request.user,
            action='DOCUMENT_VIEW',
            patient=doc.patient,
            document=doc,
            request=request
        )
        return response

    def destroy(self, request, *args, **kwargs):
        doc = self.get_object()
        log_action(
            actor=request.user,
            action='DOCUMENT_DELETE',
            patient=doc.patient,
            document=doc,
            request=request
        )
        return super().destroy(request, *args, **kwargs)


class HealthTimelineView(generics.ListAPIView):
    """Patient gets their health timeline"""
    serializer_class = TimelineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return Document.objects.filter(patient=user).order_by('-document_date')
        return Document.objects.none()


class EmergencySummaryView(APIView):
    """Quick summary card for emergency situations"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, patient_id=None):
        try:
            if patient_id:
                patient = User.objects.get(patient_id=patient_id, role='PATIENT')
            else:
                patient = request.user
        except User.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=404)

        profile = getattr(patient, 'patient_profile', None)
        critical_docs = Document.objects.filter(
            patient=patient, is_critical=True
        ).values('id', 'title', 'document_type', 'document_date')[:5]

        return Response({
            'patient_id': patient.patient_id,
            'full_name': patient.full_name,
            'blood_group': profile.blood_group if profile else 'UNKNOWN',
            'allergies': profile.allergies if profile else '',
            'chronic_conditions': profile.chronic_conditions if profile else '',
            'special_notes': profile.special_notes if profile else '',
            'current_medications': profile.current_medications if profile else '',
            'emergency_contact': {
                'name': profile.emergency_contact_name if profile else '',
                'relation': profile.emergency_contact_relation if profile else '',
                'phone': profile.emergency_contact_phone if profile else '',
            },
            'critical_documents': list(critical_docs),
        })
