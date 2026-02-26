import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Document(models.Model):
    DOCUMENT_TYPES = [
        ('PRESCRIPTION', 'Prescription'),
        ('REPORT', 'Lab Report'),
        ('SCAN', 'Scan / Imaging'),
        ('DISCHARGE', 'Discharge Summary'),
        ('VACCINATION', 'Vaccination Record'),
        ('OTHER', 'Other'),
    ]
    EVENT_TYPES = [
        ('HOSPITAL_VISIT', 'Hospital Visit'),
        ('DIAGNOSIS', 'Diagnosis'),
        ('PROCEDURE', 'Procedure'),
        ('CHECKUP', 'Checkup'),
        ('EMERGENCY', 'Emergency'),
        ('OTHER', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_docs')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='OTHER')
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    hospital_name = models.CharField(max_length=300, blank=True)
    doctor_name = models.CharField(max_length=200, blank=True)
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    document_date = models.DateField()  # Date of the medical event
    file = models.FileField(upload_to='documents/%Y/%m/')
    file_size = models.PositiveBigIntegerField(default=0)
    is_critical = models.BooleanField(default=False, help_text="Accessible in emergency break-glass")
    checksum = models.CharField(max_length=64, blank=True)  # SHA-256
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-document_date', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.patient.full_name})"

    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
        super().save(*args, **kwargs)

    @property
    def tags_list(self):
        return [t.strip() for t in self.tags.split(',') if t.strip()]
