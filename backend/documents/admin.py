from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'patient', 'document_type', 'document_date', 'is_critical', 'created_at']
    list_filter = ['document_type', 'event_type', 'is_critical']
    search_fields = ['title', 'patient__full_name', 'tags']
