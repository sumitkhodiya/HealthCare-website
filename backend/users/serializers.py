from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import PatientProfile, DoctorProfile, OTPRecord
import random

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['full_name'] = user.full_name
        token['role'] = user.role
        token['patient_id'] = user.patient_id
        return token


class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        exclude = ['user']


class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        exclude = ['user']


class UserSerializer(serializers.ModelSerializer):
    patient_profile = PatientProfileSerializer(read_only=True)
    doctor_profile = DoctorProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'role',
            'patient_id', 'is_active', 'is_approved', 'date_joined',
            'patient_profile', 'doctor_profile',
        ]
        read_only_fields = ['id', 'patient_id', 'date_joined']


class PatientRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    patient_profile = PatientProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone', 'password', 'patient_profile']

    def create(self, validated_data):
        profile_data = validated_data.pop('patient_profile', {})
        user = User.objects.create_user(
            role='PATIENT', **validated_data
        )
        PatientProfile.objects.create(user=user, **profile_data)
        return user


class DoctorRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    doctor_profile = DoctorProfileSerializer()

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone', 'password', 'doctor_profile']

    def create(self, validated_data):
        profile_data = validated_data.pop('doctor_profile')
        user = User.objects.create_user(
            role='DOCTOR', is_approved=True, **validated_data
        )
        DoctorProfile.objects.create(user=user, **profile_data)
        return user


class OTPRequestSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)

    def create(self, validated_data):
        phone = validated_data['phone']
        otp = str(random.randint(100000, 999999))
        OTPRecord.objects.create(phone=phone, otp=otp)
        return {'phone': phone, 'otp': otp}  # Return OTP (dev mode only)


class OTPVerifySerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)


class PatientSearchSerializer(serializers.ModelSerializer):
    """Minimal patient info for doctor search"""
    class Meta:
        model = User
        fields = ['id', 'full_name', 'patient_id']


class AdminUserSerializer(serializers.ModelSerializer):
    patient_profile = PatientProfileSerializer(read_only=True)
    doctor_profile = DoctorProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'role',
            'patient_id', 'is_active', 'is_approved', 'date_joined',
            'patient_profile', 'doctor_profile',
        ]
