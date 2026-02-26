import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    TYPE_CHOICES = [
        ('ACCESS_REQUEST', 'Access Request'),
        ('ACCESS_APPROVED', 'Access Approved'),
        ('ACCESS_REJECTED', 'Access Rejected'),
        ('ACCESS_REVOKED', 'Access Revoked'),
        ('EMERGENCY_ACCESS', 'Emergency Access Used'),
        ('ACCESS_EXPIRED', 'Access Expired'),
        ('DOCUMENT_SHARED', 'Document Shared'),
        ('SYSTEM', 'System Notification'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    actor_name = models.CharField(max_length=255, blank=True)
    reference_id = models.UUIDField(null=True, blank=True)  # related object id
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notif → {self.recipient.full_name}: {self.title}"
