"""
Doomsday Sentinel — Artifact Parity & Verification Pipeline
Verifies numerical equivalence between PyTorch weights and exported ONNX runtime models.
"""

import os
import sys
import numpy as np

# Ensure root workspace is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import torch
import onnxruntime as ort
from src.models.classifier import DeepfakeClassifier


def verify_model_artifacts(
    pytorch_path: str = "artifacts/model/best_model.pth",
    onnx_path: str = "artifacts/model/deepfake_detector.onnx",
    tolerance: float = 1e-4
) -> bool:
    print("=== Initiating Model Artifact Parity Verification ===")

    if not os.path.exists(pytorch_path):
        raise FileNotFoundError(f"PyTorch checkpoint not found: {pytorch_path}")
    if not os.path.exists(onnx_path):
        raise FileNotFoundError(f"ONNX model not found: {onnx_path}")

    # 1. Load PyTorch model
    ckpt = torch.load(pytorch_path, map_location="cpu")
    arch = ckpt.get("architecture", "efficientnet_b0")
    state_dict = ckpt.get("model_state_dict", ckpt)

    pt_model = DeepfakeClassifier(architecture=arch, pretrained=False, num_classes=1)
    pt_model.load_state_dict(state_dict)
    pt_model.eval()

    # 2. Load ONNX model
    session = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    # 3. Test on randomized synthetic verification batches
    np.random.seed(42)
    test_inputs = np.random.randn(10, 3, 224, 224).astype(np.float32)

    max_diff = 0.0
    with torch.no_grad():
        for i in range(10):
            sample = test_inputs[i:i+1]
            # PyTorch inference
            pt_tensor = torch.from_numpy(sample)
            pt_logit = pt_model(pt_tensor).item()
            pt_prob = 1.0 / (1.0 + np.exp(-pt_logit))

            # ONNX inference
            onnx_out = session.run([output_name], {input_name: sample})
            onnx_logit = float(onnx_out[0][0])
            onnx_prob = 1.0 / (1.0 + np.exp(-onnx_logit))

            diff = abs(pt_prob - onnx_prob)
            if diff > max_diff:
                max_diff = diff

    print(f"Max Absolute Output Probability Disparity: {max_diff:.8f}")
    if max_diff < tolerance:
        print(f"VERIFICATION SUCCESSFUL: PyTorch and ONNX outputs match within tolerance ({tolerance})!")
        return True
    else:
        print(f"VERIFICATION FAILED: Disparity exceeds tolerance ({max_diff:.8f} > {tolerance})")
        return False


if __name__ == "__main__":
    verify_model_artifacts()

