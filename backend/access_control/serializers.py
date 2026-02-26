from rest_framework import serializers
from .models import AccessRequest, EmergencyAccess
from users.serializers import PatientSearchSerializer


class AccessRequestSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    patient_id_code = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = AccessRequest
        fields = [
            'id', 'doctor', 'doctor_name', 'patient', 'patient_name', 'patient_id_code',
            'status', 'scope', 'reason', 'patient_note',
            'requested_at', 'responded_at', 'expires_at', 'is_active',
        ]
        read_only_fields = ['id', 'doctor', 'status', 'requested_at', 'responded_at']

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.full_name}"

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_patient_id_code(self, obj):
        return obj.patient.patient_id

    def get_is_active(self, obj):
        return obj.is_active()


class AccessRequestCreateSerializer(serializers.ModelSerializer):
    patient_id = serializers.CharField(write_only=True)
    duration_hours = serializers.IntegerField(write_only=True, default=24, min_value=1, max_value=720)

    class Meta:
        model = AccessRequest
        fields = ['patient_id', 'scope', 'reason', 'duration_hours']

    def validate_patient_id(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(patient_id=value, role='PATIENT')
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError("No patient found with this ID.")

    def create(self, validated_data):
        from django.utils import timezone
        from datetime import timedelta
        patient = validated_data.pop('patient_id')
        duration = validated_data.pop('duration_hours', 24)
        doctor = self.context['request'].user
        expires_at = timezone.now() + timedelta(hours=duration)
        return AccessRequest.objects.create(
            doctor=doctor,
            patient=patient,
            expires_at=expires_at,
            **validated_data
        )


class AccessResponseSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject', 'revoke'])
    patient_note = serializers.CharField(required=False, allow_blank=True)
    duration_hours = serializers.IntegerField(required=False, default=24)


class EmergencyAccessSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = EmergencyAccess
        fields = [
            'id', 'doctor', 'doctor_name', 'patient', 'patient_name',
            'reason_code', 'reason_detail', 'patient_admit_id',
            'granted_at', 'expires_at', 'is_active',
            'is_reviewed_by_admin', 'is_flagged_misuse', 'admin_note',
        ]
        read_only_fields = ['id', 'doctor', 'granted_at', 'expires_at']

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.full_name}"

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_is_active(self, obj):
        return obj.is_active()


class EmergencyAccessCreateSerializer(serializers.ModelSerializer):
    patient_id = serializers.CharField(write_only=True)

    class Meta:
        model = EmergencyAccess
        fields = ['patient_id', 'reason_code', 'reason_detail', 'patient_admit_id']

    def validate_patient_id(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            return User.objects.get(patient_id=value, role='PATIENT')
        except User.DoesNotExist:
            raise serializers.ValidationError("No patient found with this ID.")

    def create(self, validated_data):
        from django.utils import timezone
        from datetime import timedelta
        patient = validated_data.pop('patient_id')
        doctor = self.context['request'].user
        expires_at = timezone.now() + timedelta(hours=1)  # 1 hour emergency access
        return EmergencyAccess.objects.create(
            doctor=doctor, patient=patient, expires_at=expires_at, **validated_data
        )
