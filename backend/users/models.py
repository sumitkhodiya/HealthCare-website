import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('PATIENT', 'Patient'),
        ('DOCTOR', 'Doctor'),
        ('ADMIN', 'Admin'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='PATIENT')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)  # Doctors need admin approval
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Patient-specific quick info
    patient_id = models.CharField(max_length=20, unique=True, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = UserManager()

    def __str__(self):
        return f"{self.full_name} ({self.role})"

    def save(self, *args, **kwargs):
        if self.role == 'PATIENT' and not self.patient_id:
            import random, string
            self.patient_id = 'MV' + ''.join(random.choices(string.digits, k=8))
        super().save(*args, **kwargs)


class PatientProfile(models.Model):
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-'),
        ('UNKNOWN', 'Unknown'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    blood_group = models.CharField(max_length=10, choices=BLOOD_GROUP_CHOICES, default='UNKNOWN')
    allergies = models.TextField(blank=True, help_text="Comma-separated list of allergies")
    chronic_conditions = models.TextField(blank=True, help_text="Comma-separated conditions")
    current_medications = models.TextField(blank=True)
    special_notes = models.TextField(blank=True, help_text="e.g. pacemaker, pregnant")

    # Emergency contact
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_relation = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True)
    emergency_contact_verified = models.BooleanField(default=False)

    # Consent defaults
    auto_approve_access = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.full_name}"


class DoctorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialization = models.CharField(max_length=200)
    hospital_name = models.CharField(max_length=300, blank=True)
    license_number = models.CharField(max_length=100, unique=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dr. {self.user.full_name} - {self.specialization}"


class OTPRecord(models.Model):
    """For patient OTP login simulation"""
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"OTP for {self.phone}: {self.otp}"
