"""
Unit Test Suite: Forensic Inference Engine (Image & Video Forensics)
"""

import os
import sys
import pytest
import numpy as np
import cv2

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.inference.predict import ForensicInferenceEngine


def test_inference_engine_image_pipeline():
    engine = ForensicInferenceEngine.get_instance()
    
    # Create test synthetic image
    test_img = np.random.randint(0, 255, (256, 256, 3), dtype=np.uint8)
    res = engine.analyze_image(test_img, generate_explanation=True)
    
    assert res["status"] == "completed"
    assert res["prediction"] in ["REAL", "FAKE"]
    assert 0.0 <= res["score"] <= 1.0
    assert 0.0 <= res["confidence"] <= 1.0
    assert res["explanation_available"] is True
    assert res["explanation_image"] is not None
    assert "face_detection" in res


def test_inference_engine_video_pipeline():
    engine = ForensicInferenceEngine.get_instance()
    vid_path = "data/raw/videos/fake_vid_ID_000.mp4"
    if not os.path.exists(vid_path):
        pytest.skip("Test video file does not exist")
        
    vid_res = engine.analyze_video(vid_path, sampling_fps=2.0, max_frames=10)
    assert vid_res["status"] == "completed"
    assert vid_res["media_type"] == "video"
    assert vid_res["prediction"] in ["REAL", "FAKE", "UNCERTAIN"]
    assert "frame_statistics" in vid_res
    assert vid_res["frame_statistics"]["processed_sample_frames"] > 0

