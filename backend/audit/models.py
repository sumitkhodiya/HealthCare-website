import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('DOCUMENT_VIEW', 'Viewed Document'),
        ('DOCUMENT_DOWNLOAD', 'Downloaded Document'),
        ('DOCUMENT_UPLOAD', 'Uploaded Document'),
        ('DOCUMENT_DELETE', 'Deleted Document'),
        ('ACCESS_REQUEST', 'Sent Access Request'),
        ('ACCESS_APPROVE', 'Approved Access'),
        ('ACCESS_REJECT', 'Rejected Access'),
        ('ACCESS_REVOKE', 'Revoked Access'),
        ('EMERGENCY_ACCESS', 'Emergency Break-Glass Access'),
        ('PROFILE_UPDATE', 'Updated Profile'),
        ('LOGIN', 'User Login'),
        ('LOGOUT', 'User Logout'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_actions')
    target_patient = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_events'
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    document_id = models.UUIDField(null=True, blank=True)
    document_title = models.CharField(max_length=300, blank=True)
    is_emergency = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    extra_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.action}] {self.actor} at {self.created_at}"
