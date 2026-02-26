from django.contrib import admin
from .models import AccessRequest, EmergencyAccess


@admin.register(AccessRequest)
class AccessRequestAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'patient', 'status', 'requested_at', 'expires_at']
    list_filter = ['status']


@admin.register(EmergencyAccess)
class EmergencyAccessAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'patient', 'reason_code', 'granted_at', 'expires_at', 'is_reviewed_by_admin', 'is_flagged_misuse']
    list_filter = ['reason_code', 'is_reviewed_by_admin', 'is_flagged_misuse']
