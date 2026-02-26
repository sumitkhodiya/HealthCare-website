from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_name', 'target_patient', 'patient_name',
            'action', 'document_id', 'document_title', 'is_emergency',
            'ip_address', 'extra_data', 'created_at',
        ]

    def get_actor_name(self, obj):
        return obj.actor.full_name if obj.actor else "System"

    def get_patient_name(self, obj):
        return obj.target_patient.full_name if obj.target_patient else None
