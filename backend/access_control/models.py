import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AccessRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('REVOKED', 'Revoked'),
        ('EXPIRED', 'Expired'),
    ]
    SCOPE_CHOICES = [
        ('ALL', 'All Documents'),
        ('PRESCRIPTION', 'Prescriptions'),
        ('REPORT', 'Lab Reports'),
        ('SCAN', 'Scans'),
        ('DISCHARGE', 'Discharge Summaries'),
        ('VACCINATION', 'Vaccination Records'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='access_requests_made')
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='access_requests_received')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    scope = models.JSONField(default=list, help_text="List of document types doctor can access")
    reason = models.TextField()
    patient_note = models.TextField(blank=True, help_text="Patient's note when approving/rejecting")
    requested_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"Dr.{self.doctor.full_name} → {self.patient.full_name} [{self.status}]"

    def is_active(self):
        from django.utils import timezone
        return (
            self.status == 'APPROVED'
            and (self.expires_at is None or self.expires_at > timezone.now())
        )


class EmergencyAccess(models.Model):
    REASON_CHOICES = [
        ('LIFE_THREATENING', 'Life-Threatening Condition'),
        ('UNCONSCIOUS', 'Patient Unconscious / Unable to Consent'),
        ('MASS_CASUALTY', 'Mass Casualty / Disaster'),
        ('CRITICAL_PROCEDURE', 'Critical Procedure Required'),
        ('OTHER', 'Other Emergency'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_accesses')
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_accesses_received')
    reason_code = models.CharField(max_length=30, choices=REASON_CHOICES)
    reason_detail = models.TextField()
    patient_admit_id = models.CharField(max_length=100, help_text="OPD/ER token or admit ID")
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_reviewed_by_admin = models.BooleanField(default=False)
    is_flagged_misuse = models.BooleanField(default=False)
    admin_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_emergencies'
    )

    class Meta:
        ordering = ['-granted_at']

    def __str__(self):
        return f"EMERGENCY: Dr.{self.doctor.full_name} → {self.patient.full_name}"

    def is_active(self):
        from django.utils import timezone
        return timezone.now() < self.expires_at
