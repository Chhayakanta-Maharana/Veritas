"""
Doomsday Sentinel — ONNX Runtime Inference Engine
Provides optimized, cross-platform neural inference using exported ONNX computation graphs.
"""

import os
from typing import Tuple, Dict, Any, Optional
import numpy as np
import onnxruntime as ort
import cv2

from src.data.face_detection import FaceDetector


class ONNXForensicEngine:
    """
    Inference runtime powered by ONNX Runtime for accelerated CPU/GPU deployment.
    """
    def __init__(
        self,
        onnx_model_path: str = "artifacts/model/deepfake_detector.onnx",
        threshold: float = 0.50
    ):
        self.onnx_model_path = onnx_model_path
        self.threshold = threshold
        
        if not os.path.exists(onnx_model_path):
            raise FileNotFoundError(f"ONNX artifact not found: {onnx_model_path}")

        # Initialize session with optimal providers
        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] if 'CUDAExecutionProvider' in ort.get_available_providers() else ['CPUExecutionProvider']
        self.session = ort.InferenceSession(onnx_model_path, providers=providers)
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        self.detector = FaceDetector(margin_ratio=0.20)

    def preprocess_image(self, image_rgb: np.ndarray) -> np.ndarray:
        """
        Preprocesses RGB numpy array (H, W, 3) into normalized NCHW float32 tensor (1, 3, 224, 224).
        """
        face_crop, _ = self.detector.detect_and_crop(image_rgb, target_size=(224, 224))
        img_norm = face_crop.astype(np.float32) / 255.0
        
        # ImageNet normalization: (x - mean) / std
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_norm = (img_norm - mean) / std
        
        # HWC to CHW and add batch dimension
        tensor = np.transpose(img_norm, (2, 0, 1))
        tensor = np.expand_dims(tensor, axis=0)
        return tensor

    def predict(self, image_rgb: np.ndarray) -> Dict[str, Any]:
        """
        Executes ONNX forward pass.
        """
        input_tensor = self.preprocess_image(image_rgb)
        raw_outputs = self.session.run([self.output_name], {self.input_name: input_tensor})
        logit = float(raw_outputs[0][0])
        prob = 1.0 / (1.0 + np.exp(-logit)) # sigmoid
        
        pred = "FAKE" if prob >= self.threshold else "REAL"
        return {
            "prediction": pred,
            "score": round(prob, 4),
            "logit": round(logit, 4),
            "threshold": self.threshold,
            "runtime": "ONNXRuntime"
        }

