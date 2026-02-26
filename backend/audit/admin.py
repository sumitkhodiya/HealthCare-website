from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['actor', 'action', 'target_patient', 'is_emergency', 'created_at']
    list_filter = ['action', 'is_emergency']
    search_fields = ['actor__full_name', 'target_patient__full_name']
