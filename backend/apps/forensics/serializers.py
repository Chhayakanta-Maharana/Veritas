"""
Doomsday Sentinel — REST API Serializers
"""

from rest_framework import serializers
from apps.forensics.models import Analysis, AnalysisArtifact, ModelVersion


class AnalysisArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisArtifact
        fields = ['id', 'artifact_type', 'file_path', 'checksum', 'created_at']


class AnalysisSerializer(serializers.ModelSerializer):
    artifacts = AnalysisArtifactSerializer(many=True, read_only=True)
    explanation_available = serializers.SerializerMethodField()

    class Meta:
        model = Analysis
        fields = [
            'id',
            'media_type',
            'original_filename',
            'prediction',
            'score',
            'confidence',
            'threshold',
            'model_version',
            'processing_status',
            'processing_duration',
            'frame_statistics',
            'face_detection',
            'limitations',
            'error_category',
            'artifacts',
            'explanation_available',
            'created_at'
        ]

    def get_explanation_available(self, obj):
        return obj.artifacts.filter(artifact_type='explanation_gradcam').exists()


class AnalysisSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Analysis
        fields = [
            'id',
            'media_type',
            'original_filename',
            'prediction',
            'score',
            'confidence',
            'threshold',
            'processing_status',
            'processing_duration',
            'created_at'
        ]


class ImageUploadSerializer(serializers.Serializer):
    image = serializers.ImageField(required=True, help_text="Image file (JPG, PNG, WEBP) max 50MB")

    def validate_image(self, value):
        valid_extensions = ('.jpg', '.jpeg', '.png', '.webp')
        ext = value.name.lower()
        if not ext.endswith(valid_extensions):
            raise serializers.ValidationError("Unsupported image format. Allowed formats: JPG, PNG, WEBP.")
        if value.size > 52428800:
            raise serializers.ValidationError("File size exceeds 50MB limit.")
        return value


class VideoUploadSerializer(serializers.Serializer):
    video = serializers.FileField(required=True, help_text="Video file (MP4, AVI, MOV) max 50MB")

    def validate_video(self, value):
        valid_extensions = ('.mp4', '.avi', '.mov')
        ext = value.name.lower()
        if not ext.endswith(valid_extensions):
            raise serializers.ValidationError("Unsupported video format. Allowed formats: MP4, AVI, MOV.")
        if value.size > 52428800:
            raise serializers.ValidationError("File size exceeds 50MB limit.")
        return value


class ModelInfoSerializer(serializers.Serializer):
    model_name = serializers.CharField()
    model_version = serializers.CharField()
    architecture = serializers.CharField()
    input_shape = serializers.ListField()
    decision_threshold = serializers.FloatField()
    labels = serializers.DictField()
    evaluation_summary = serializers.DictField()
    onnx_available = serializers.BooleanField()
    device = serializers.CharField()


class DashboardStatsSerializer(serializers.Serializer):
    total_analyses = serializers.IntegerField()
    real_count = serializers.IntegerField()
    fake_count = serializers.IntegerField()
    uncertain_count = serializers.IntegerField()
    average_latency_ms = serializers.FloatField()
    active_model_version = serializers.CharField()
    recent_analyses = AnalysisSummarySerializer(many=True)

