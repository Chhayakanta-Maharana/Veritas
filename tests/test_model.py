"""
Unit Test Suite: Model Architectures, Training Hooks & ONNX Equivalence
"""

import os
import sys
import pytest
import torch
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.models.classifier import build_model, DeepfakeClassifier
from src.inference.gradcam import GradCAM
from scripts.verify_artifacts import verify_model_artifacts


def test_classifier_forward_pass():
    model = build_model(architecture="efficientnet_b0", pretrained=False, device="cpu")
    model.eval()
    
    dummy_input = torch.randn(2, 3, 224, 224)
    with torch.no_grad():
        output = model(dummy_input)
    
    assert output.shape == (2,), f"Expected scalar logit per sample, got {output.shape}"


def test_gradcam_computation():
    model = build_model(architecture="efficientnet_b0", pretrained=False, device="cpu")
    model.eval()
    
    gradcam = GradCAM(model, model.gradcam_layer)
    dummy_input = torch.randn(1, 3, 224, 224)
    
    heatmap, prob = gradcam.generate_heatmap(dummy_input, target_class=1)
    assert heatmap.shape == (7, 7) or len(heatmap.shape) == 2
    assert 0.0 <= prob <= 1.0
    assert heatmap.min() >= 0.0 and heatmap.max() <= 1.0
    
    # Test overlay
    dummy_rgb = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    overlay = gradcam.create_overlay(dummy_rgb, heatmap)
    assert overlay.shape == (224, 224, 3)
    gradcam.remove_hooks()


def test_onnx_pytorch_parity():
    pth_path = "artifacts/model/best_model.pth"
    onnx_path = "artifacts/model/deepfake_detector.onnx"
    if os.path.exists(pth_path) and os.path.exists(onnx_path):
        is_parity_ok = verify_model_artifacts(pth_path, onnx_path, tolerance=1e-4)
        assert is_parity_ok, "PyTorch and ONNX predictions must match within 1e-4 tolerance."

