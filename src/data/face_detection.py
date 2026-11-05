"""
Veritas Sentinel — Forensic Face Detection & Preprocessing Subsystem
Provides robust, reproducible face extraction with forensic boundary margins,
multi-scale pyramid downsampling for high-megapixel images, and cascade ensembles.
"""

import os
from typing import Tuple, Optional, Dict, Any
import cv2
import numpy as np


class FaceDetector:
    """
    Forensic Face Detector utilizing OpenCV Haar Cascades with configurable
    contextual margins, multi-scale pyramid downsampling, and cascade ensembles.
    """
    def __init__(
        self,
        margin_ratio: float = 0.20,
        fallback_policy: str = "center_crop",
        min_face_size: Tuple[int, int] = (64, 64),
    ):
        self.margin_ratio = margin_ratio
        self.fallback_policy = fallback_policy
        self.min_face_size = min_face_size
        
        # Load Primary Haar Cascade
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        if not os.path.exists(cascade_path):
            raise FileNotFoundError(f"OpenCV cascade classifier not found at: {cascade_path}")
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

        # Load Robust Secondary Cascades
        alt2_path = cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml"
        self.alt2_cascade = cv2.CascadeClassifier(alt2_path) if os.path.exists(alt2_path) else None

        prof_path = cv2.data.haarcascades + "haarcascade_profileface.xml"
        self.prof_cascade = cv2.CascadeClassifier(prof_path) if os.path.exists(prof_path) else None

    def detect_and_crop(
        self,
        image_rgb: np.ndarray,
        target_size: Tuple[int, int] = (224, 224)
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Detects primary face in RGB image, expands bounding box by margin_ratio,
        and crops & resizes to target_size. If detection fails, executes fallback policy.
        
        Args:
            image_rgb: Input RGB image as numpy uint8 array (H, W, 3).
            target_size: Desired output dimensions (width, height).
            
        Returns:
            cropped_face: Processed RGB image ready for tensor conversion (H, W, 3).
            metadata: Dictionary containing detection coordinates, status, and fallback info.
        """
        h, w = image_rgb.shape[:2]
        gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)

        # Multi-scale pyramid for high-res smartphone/camera images
        # Haar cascades perform best when face features are in the 50-600px range
        max_dim = 1000
        if max(h, w) > max_dim:
            scale = float(max_dim) / float(max(h, w))
            scaled_gray = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        else:
            scale = 1.0
            scaled_gray = gray

        # 1. Try Primary Default Frontal Cascade
        faces = self.face_cascade.detectMultiScale(
            scaled_gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(max(24, int(self.min_face_size[0] * scale)), max(24, int(self.min_face_size[1] * scale))),
            flags=cv2.CASCADE_SCALE_IMAGE
        )

        # 2. Try Secondary Alt2 Cascade (robust to lighting & slight angles)
        if len(faces) == 0 and self.alt2_cascade is not None:
            faces = self.alt2_cascade.detectMultiScale(
                scaled_gray,
                scaleFactor=1.08,
                minNeighbors=4,
                minSize=(24, 24),
                flags=cv2.CASCADE_SCALE_IMAGE
            )

        # 3. Try Profile Cascade (for angled/profile faces)
        if len(faces) == 0 and self.prof_cascade is not None:
            faces = self.prof_cascade.detectMultiScale(
                scaled_gray,
                scaleFactor=1.1,
                minNeighbors=4,
                minSize=(24, 24),
                flags=cv2.CASCADE_SCALE_IMAGE
            )

        if len(faces) > 0:
            # Select largest detected face (area = w * h)
            best_face = max(faces, key=lambda rect: rect[2] * rect[3])
            sfx, sfy, sfw, sfh = best_face

            # Map coordinates back to original image scale
            fx = int(sfx / scale)
            fy = int(sfy / scale)
            fw = int(sfw / scale)
            fh = int(sfh / scale)
            
            # Expand bounding box with forensic context margin
            dw = int(fw * self.margin_ratio)
            dh = int(fh * self.margin_ratio)
            
            x1 = max(0, fx - dw)
            y1 = max(0, fy - dh)
            x2 = min(w, fx + fw + dw)
            y2 = min(h, fy + fh + dh)
            
            face_crop = image_rgb[y1:y2, x1:x2]
            status = "face_detected"
            bbox = [int(x1), int(y1), int(x2), int(y2)]
        else:
            status = "fallback_center_crop"
            # Fallback: square center crop preserving aspect ratio
            min_dim = min(h, w)
            cy, cx = h // 2, w // 2
            half = min_dim // 2
            x1, y1 = max(0, cx - half), max(0, cy - half)
            x2, y2 = min(w, x1 + min_dim), min(h, y1 + min_dim)
            face_crop = image_rgb[y1:y2, x1:x2]
            bbox = [int(x1), int(y1), int(x2), int(y2)]
            
        # Resize to target size using high-quality bilinear interpolation
        resized = cv2.resize(face_crop, target_size, interpolation=cv2.INTER_LINEAR)
        
        metadata = {
            "face_detection_status": status,
            "bounding_box": bbox,
            "original_shape": [int(h), int(w), int(image_rgb.shape[2]) if len(image_rgb.shape) > 2 else 1],
            "crop_shape": [int(face_crop.shape[0]), int(face_crop.shape[1]), 3],
            "target_size": list(target_size),
            "margin_ratio": self.margin_ratio
        }
        return resized, metadata
