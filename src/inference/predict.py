"""
Doomsday Sentinel — Production Inference Service
Loads the trained PyTorch forensic checkpoint, coordinates face detection,
runs neural inference, generates Grad-CAM overlays, and executes multi-frame video forensics.
"""

import os
import io
import time
import uuid
import base64
from typing import Dict, Any, List, Optional, Tuple
import cv2
import numpy as np
import torch
from PIL import Image

from src.models.classifier import DeepfakeClassifier
from src.data.face_detection import FaceDetector
from src.data.augmentation import get_inference_tensor
from src.inference.gradcam import GradCAM


class ForensicInferenceEngine:
    """
    Production-grade Forensic Inference Engine with PyTorch & Grad-CAM integration.
    """
    _instance: Optional['ForensicInferenceEngine'] = None

    def __init__(
        self,
        model_path: str = "artifacts/model/best_model.pth",
        metadata_path: str = "artifacts/metadata/model_metadata.json",
        device: str = "cuda"
    ):
        self.device = torch.device(device if (device == "cuda" and torch.cuda.is_available()) else "cpu")
        self.model_path = model_path
        self.metadata_path = metadata_path
        
        # Load metadata if present
        self.metadata = self._load_metadata()
        self.architecture = self.metadata.get("architecture", "efficientnet_b0")
        self.threshold = float(self.metadata.get("decision_threshold", 0.50))
        self.model_version = self.metadata.get("model_version", "doomsday-sentinel-v1.0")

        # Initialize Model
        self.model = DeepfakeClassifier(
            architecture=self.architecture,
            pretrained=False,
            num_classes=1
        )

        if os.path.exists(model_path):
            checkpoint = torch.load(model_path, map_location=self.device)
            state_dict = checkpoint.get("model_state_dict", checkpoint)
            self.model.load_state_dict(state_dict)
            print(f"[InferenceEngine] Successfully loaded model weights from: {model_path}")
        else:
            print(f"[InferenceEngine] WARNING: Model artifact not found at {model_path}. Running with initialized weights.")

        self.model.to(self.device)
        self.model.eval()

        self.detector = FaceDetector(margin_ratio=0.20, fallback_policy="center_crop")
        self.gradcam = GradCAM(self.model, self.model.gradcam_layer)

    def _load_metadata(self) -> Dict[str, Any]:
        if os.path.exists(self.metadata_path):
            try:
                import json
                with open(self.metadata_path, "r") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading metadata: {e}")
        return {}

    @classmethod
    def get_instance(cls, model_path: str = "artifacts/model/best_model.pth") -> 'ForensicInferenceEngine':
        if cls._instance is None:
            cls._instance = cls(model_path=model_path)
        return cls._instance

    def analyze_image(
        self,
        image_input: str | np.ndarray | bytes,
        generate_explanation: bool = True
    ) -> Dict[str, Any]:
        """
        Analyzes a single image for deepfake / synthetic facial manipulation.
        """
        t0 = time.perf_counter()
        
        # 1. Decode input into RGB numpy array
        if isinstance(image_input, str):
            if not os.path.exists(image_input):
                raise FileNotFoundError(f"Image path not found: {image_input}")
            img_bgr = cv2.imread(image_input)
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        elif isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        elif isinstance(image_input, np.ndarray):
            img_rgb = image_input
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        # 2. Face Detection & Preprocessing
        face_crop, det_meta = self.detector.detect_and_crop(img_rgb, target_size=(224, 224))
        
        # 3. Model Inference
        tensor = get_inference_tensor(face_crop, image_size=(224, 224), device=self.device)
        
        explanation_b64 = None
        if generate_explanation:
            heatmap, prob = self.gradcam.generate_heatmap(tensor, target_class=1)
            overlay = self.gradcam.create_overlay(face_crop, heatmap, alpha=0.45)
            
            # Encode overlay as base64 JPEG
            is_success, buffer = cv2.imencode(".jpg", cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
            if is_success:
                explanation_b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")
        else:
            with torch.no_grad():
                logit = self.model(tensor)
                prob = float(torch.sigmoid(logit).item())

        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        
        prediction = "FAKE" if prob >= self.threshold else "REAL"
        confidence = prob if prediction == "FAKE" else (1.0 - prob)

        limitations = [
            "Forensic sensitivity maps indicate anomalous regions, not definitive legal tampering proof.",
            "Heavy re-compression or low-resolution capture (<64px face) can reduce forensic confidence."
        ]
        if det_meta["face_detection_status"] == "fallback_center_crop":
            limitations.append("No primary face isolated via Haar cascades; analyzed via center crop fallback. Veritas Sentinel is specialized for facial manipulation; non-facial objects (equipment, vehicles, scenery) produce out-of-domain feature scores.")

        return {
            "analysis_id": str(uuid.uuid4()),
            "media_type": "image",
            "prediction": prediction,
            "score": round(prob, 4),
            "confidence": round(confidence, 4),
            "threshold": self.threshold,
            "model_version": self.model_version,
            "explanation_available": explanation_b64 is not None,
            "explanation_image": explanation_b64,
            "face_detection": det_meta,
            "processing_duration_ms": round(elapsed_ms, 2),
            "status": "completed",
            "limitations": limitations
        }

    def analyze_video(
        self,
        video_path: str,
        sampling_fps: float = 2.0,
        max_frames: int = 60
    ) -> Dict[str, Any]:
        """
        Processes a video file by sampling frames at regular temporal intervals,
        running facial inference, and computing aggregated forensic decisions.
        """
        t0 = time.perf_counter()
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not decode video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        frame_interval = max(1, int(fps / sampling_fps))
        
        frame_idx = 0
        processed_frames = []
        suspicious_frames = []
        
        while cap.isOpened() and len(processed_frames) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_idx % frame_interval == 0:
                img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                # Analyze single frame
                frame_res = self.analyze_image(img_rgb, generate_explanation=False)
                
                frame_info = {
                    "frame_index": frame_idx,
                    "timestamp_sec": round(frame_idx / fps, 2),
                    "score": frame_res["score"],
                    "prediction": frame_res["prediction"],
                    "face_detection_status": frame_res["face_detection"]["face_detection_status"]
                }
                processed_frames.append(frame_info)
                
                # If score is suspicious, save thumbnail
                if frame_res["score"] >= self.threshold:
                    # Generate small thumbnail with Grad-CAM
                    thumb_meta = self.analyze_image(img_rgb, generate_explanation=True)
                    suspicious_frames.append({
                        "frame_index": frame_idx,
                        "timestamp_sec": round(frame_idx / fps, 2),
                        "score": frame_res["score"],
                        "thumbnail": thumb_meta.get("explanation_image")
                    })
            frame_idx += 1

        cap.release()
        elapsed_sec = time.perf_counter() - t0

        if len(processed_frames) == 0:
            return {
                "analysis_id": str(uuid.uuid4()),
                "media_type": "video",
                "prediction": "UNCERTAIN",
                "score": 0.50,
                "threshold": self.threshold,
                "model_version": self.model_version,
                "status": "failed",
                "failure_reason": "No valid frames could be decoded from video.",
                "limitations": ["Video stream was empty or unsupported."]
            }

        scores = [f["score"] for f in processed_frames]
        # Forensic aggregation: Top 20% most suspicious frames (tail mean)
        sorted_scores = sorted(scores, reverse=True)
        top_k = max(1, int(len(sorted_scores) * 0.20))
        video_score = float(np.mean(sorted_scores[:top_k]))
        
        prediction = "FAKE" if video_score >= self.threshold else "REAL"
        confidence = video_score if prediction == "FAKE" else (1.0 - video_score)

        return {
            "analysis_id": str(uuid.uuid4()),
            "media_type": "video",
            "prediction": prediction,
            "score": round(video_score, 4),
            "confidence": round(confidence, 4),
            "threshold": self.threshold,
            "model_version": self.model_version,
            "explanation_available": len(suspicious_frames) > 0,
            "status": "completed",
            "frame_statistics": {
                "total_video_frames": frame_idx,
                "processed_sample_frames": len(processed_frames),
                "fake_frame_count": sum(1 for f in processed_frames if f["prediction"] == "FAKE"),
                "real_frame_count": sum(1 for f in processed_frames if f["prediction"] == "REAL"),
                "video_duration_sec": round(frame_idx / fps, 2)
            },
            "suspicious_frames": suspicious_frames[:5],
            "frame_predictions": processed_frames,
            "processing_duration_sec": round(elapsed_sec, 2),
            "limitations": [
                "Video decision derived from top-20% suspicious temporal frame pooling.",
                "Subtle single-frame glitches may trigger high localized sensitivity."
            ]
        }
