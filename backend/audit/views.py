from rest_framework import generics, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return AuditLog.objects.filter(target_patient=user)
        elif user.role == 'DOCTOR':
            return AuditLog.objects.filter(actor=user)
        elif user.role == 'ADMIN':
            return AuditLog.objects.all()
        return AuditLog.objects.none()
