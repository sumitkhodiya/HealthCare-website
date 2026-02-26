from django.contrib import admin
from .models import User, PatientProfile, DoctorProfile, OTPRecord


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'phone', 'role', 'patient_id', 'is_active', 'is_approved', 'date_joined']
    list_filter = ['role', 'is_active', 'is_approved']
    search_fields = ['full_name', 'email', 'phone', 'patient_id']


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'blood_group', 'allergies', 'emergency_contact_name']
    search_fields = ['user__full_name']


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'specialization', 'hospital_name', 'license_number', 'is_verified']


@admin.register(OTPRecord)
class OTPRecordAdmin(admin.ModelAdmin):
    list_display = ['phone', 'otp', 'created_at', 'is_used']
