from rest_framework import serializers
from .models import Document
from users.serializers import UserSerializer


class DocumentSerializer(serializers.ModelSerializer):
    tags_list = serializers.ReadOnlyField()
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'patient', 'uploaded_by', 'uploaded_by_name',
            'document_type', 'event_type', 'title', 'description',
            'hospital_name', 'doctor_name', 'tags', 'tags_list',
            'document_date', 'file', 'file_url', 'file_size',
            'is_critical', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'patient', 'uploaded_by', 'file_size', 'created_at', 'updated_at']

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.full_name if obj.uploaded_by else None

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            'document_type', 'event_type', 'title', 'description',
            'hospital_name', 'doctor_name', 'tags', 'document_date',
            'file', 'is_critical',
        ]

    def create(self, validated_data):
        request = self.context['request']
        validated_data['patient'] = request.user
        validated_data['uploaded_by'] = request.user
        return super().create(validated_data)


class TimelineSerializer(serializers.ModelSerializer):
    """Grouped for timeline view"""
    month_year = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'document_type', 'event_type', 'title',
            'hospital_name', 'doctor_name', 'document_date',
            'month_year', 'tags', 'is_critical', 'file_url',
        ]

    def get_month_year(self, obj):
        return obj.document_date.strftime('%B %Y')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
