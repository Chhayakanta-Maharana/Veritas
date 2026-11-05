"""
End-to-End System Integration Tests
Validates the complete lifecycle:
Upload Media -> Face Detection -> Neural Inference -> Artifact & DB Serialization -> PDF Report Export
"""

import os
import sys
import io
import uuid
import pytest
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.forensics.models import Analysis, AnalysisArtifact
from apps.forensics.services.pdf_service import generate_forensic_pdf_report
from src.inference.predict import ForensicInferenceEngine


@pytest.mark.django_db
def test_end_to_end_image_analysis_and_pdf_generation():
    engine = ForensicInferenceEngine.get_instance()
    
    # 1. Synthesize image
    img = Image.new('RGB', (256, 256), color=(140, 180, 210))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    raw_bytes = buf.getvalue()

    # 2. Execute inference
    inference_result = engine.analyze_image(raw_bytes, generate_explanation=True)
    assert inference_result["status"] == "completed"

    # 3. Persist to database
    analysis_record = Analysis.objects.create(
        id=uuid.UUID(inference_result["analysis_id"]),
        media_type="image",
        original_filename="integration_test.png",
        prediction=inference_result["prediction"],
        score=inference_result["score"],
        confidence=inference_result["confidence"],
        threshold=inference_result["threshold"],
        model_version=inference_result["model_version"],
        processing_status="completed",
        processing_duration=inference_result["processing_duration_ms"],
        face_detection=inference_result["face_detection"],
        limitations=inference_result["limitations"]
    )
    assert Analysis.objects.filter(id=analysis_record.id).exists()

    # 4. Generate PDF Report
    pdf_bytes = generate_forensic_pdf_report(inference_result)
    assert len(pdf_bytes) > 2000, "Forensic PDF report must contain structured data and graphics"
    assert pdf_bytes.startswith(b'%PDF'), "Output must be valid PDF stream"

    # Cleanup test record
    analysis_record.delete()
    assert not Analysis.objects.filter(id=analysis_record.id).exists()
