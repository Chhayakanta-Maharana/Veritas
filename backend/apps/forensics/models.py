"""
Doomsday Sentinel — Database Architecture (Neon PostgreSQL / Local SQLite)
"""

import uuid
from django.db import models


class Analysis(models.Model):
    """
    Forensic analysis record storing prediction metrics, processing status, and metadata.
    """
    MEDIA_TYPE_CHOICES = [
        ('image', 'Image Media'),
        ('video', 'Video Media'),
    ]

    PREDICTION_CHOICES = [
        ('REAL', 'Authentic / Real Media'),
        ('FAKE', 'Deepfake / Manipulated Media'),
        ('UNCERTAIN', 'Inconclusive / Uncertain Evidence'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending Analysis'),
        ('completed', 'Analysis Completed'),
        ('failed', 'Processing Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES, db_index=True)
    original_filename = models.CharField(max_length=255, blank=True, default='')
    prediction = models.CharField(max_length=20, choices=PREDICTION_CHOICES, db_index=True)
    score = models.FloatField(help_text="Predicted probability of synthetic manipulation (0.0 to 1.0)")
    confidence = models.FloatField(default=0.0, help_text="Calibrated classification confidence")
    threshold = models.FloatField(default=0.50, help_text="Validated decision threshold")
    model_version = models.CharField(max_length=64, db_index=True)
    processing_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    processing_duration = models.FloatField(default=0.0, help_text="Latency in ms (images) or seconds (videos)")
    frame_statistics = models.JSONField(null=True, blank=True, help_text="Video frame-level aggregations")
    face_detection = models.JSONField(null=True, blank=True, help_text="Bounding box and face detection metadata")
    limitations = models.JSONField(default=list, help_text="Forensic uncertainty or limitation statements")
    error_category = models.CharField(max_length=64, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['media_type', 'prediction']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"[{self.prediction}] {self.media_type} - {self.id} ({self.score:.4f})"


class AnalysisArtifact(models.Model):
    """
    Physical or base64 forensic artifacts linked to an analysis record.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    analysis = models.ForeignKey(Analysis, on_delete=models.CASCADE, related_name='artifacts')
    artifact_type = models.CharField(max_length=64, db_index=True)
    file_path = models.CharField(max_length=512)
    checksum = models.CharField(max_length=64, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.artifact_type} ({self.analysis.id})"


class ModelVersion(models.Model):
    """
    Registry of trained neural and baseline models with checksums and validated thresholds.
    """
    version_id = models.CharField(max_length=64, primary_key=True)
    architecture = models.CharField(max_length=64)
    artifact_checksum = models.CharField(max_length=64)
    input_configuration = models.JSONField(default=dict)
    label_mapping = models.JSONField(default=dict)
    selected_threshold = models.FloatField(default=0.50)
    evaluation_summary = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.version_id} ({self.architecture}) - Active: {self.is_active}"


# ==============================================================================
# Signals for Safe File Cleanup on Model Deletion
# ==============================================================================
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.conf import settings
import os


@receiver(post_delete, sender=AnalysisArtifact)
def cleanup_artifact_file_on_delete(sender, instance, **kwargs):
    """
    Ensures media and artifact files on disk are removed when an analysis artifact is deleted.
    """
    if instance.file_path:
        full_path = os.path.join(settings.BASE_DIR, instance.file_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except OSError:
                pass

