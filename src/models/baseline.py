"""
Doomsday Sentinel — Baseline Classifier Subsystem
Provides reproducible baseline classification using conventional computer vision
feature extraction (color moments, texture gradients, and frequency metrics)
coupled with Logistic Regression and Random Forest classifiers.
"""

import os
import joblib
import numpy as np
import pandas as pd
import cv2
from typing import Tuple, Dict, Any
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.preprocessing import StandardScaler


def extract_forensic_handcrafted_features(image_bgr: np.ndarray) -> np.ndarray:
    """
    Extracts forensic hand-crafted feature vector from image:
    - Color channel moments (mean, std, skew for B, G, R, HSV)
    - Laplacian texture variance (sharpness and edge blur)
    - Sobel gradient energy (horizontal and vertical gradient transitions)
    - Local frequency domain statistics (DFT magnitude mean and std)
    """
    img_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    img_hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    img_gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    
    # 1. Color statistics (RGB and HSV)
    r, g, b = img_rgb[:, :, 0], img_rgb[:, :, 1], img_rgb[:, :, 2]
    h, s, v = img_hsv[:, :, 0], img_hsv[:, :, 1], img_hsv[:, :, 2]
    
    color_feats = [
        np.mean(r), np.std(r),
        np.mean(g), np.std(g),
        np.mean(b), np.std(b),
        np.mean(h), np.std(h),
        np.mean(s), np.std(s),
        np.mean(v), np.std(v),
    ]
    
    # 2. Laplacian edge energy
    lap = cv2.Laplacian(img_gray, cv2.CV_64F)
    lap_var = float(lap.var())
    lap_mean = float(np.mean(np.abs(lap)))
    
    # 3. Sobel gradient magnitude
    sobelx = cv2.Sobel(img_gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(img_gray, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = np.sqrt(sobelx**2 + sobely**2)
    grad_mean = float(np.mean(grad_mag))
    grad_std = float(np.std(grad_mag))
    
    # 4. Fourier Transform frequency distribution
    f_transform = np.fft.fft2(img_gray)
    f_shift = np.fft.fftshift(f_transform)
    mag_spectrum = 20 * np.log(np.abs(f_shift) + 1e-9)
    dft_mean = float(np.mean(mag_spectrum))
    dft_std = float(np.std(mag_spectrum))
    
    features = color_feats + [lap_var, lap_mean, grad_mean, grad_std, dft_mean, dft_std]
    return np.array(features, dtype=np.float32)


def build_dataset_features(manifest_df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    """
    Extracts features for all samples in a manifest dataframe.
    """
    X_list = []
    y_list = []
    for _, row in manifest_df.iterrows():
        fpath = row["file_path"]
        img = cv2.imread(fpath)
        if img is None:
            # Fallback zeros
            feats = np.zeros(18, dtype=np.float32)
        else:
            img = cv2.resize(img, (224, 224))
            feats = extract_forensic_handcrafted_features(img)
        X_list.append(feats)
        y_list.append(int(row["label"]))
    return np.array(X_list), np.array(y_list)


class BaselinePipeline:
    """
    End-to-end baseline pipeline with StandardScaler and Logistic Regression / Random Forest.
    """
    def __init__(self, model_type: str = "logistic_regression", random_state: int = 42):
        self.scaler = StandardScaler()
        self.model_type = model_type
        if model_type == "logistic_regression":
            self.classifier = LogisticRegression(max_iter=1000, random_state=random_state)
        elif model_type == "random_forest":
            self.classifier = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=random_state)
        else:
            raise ValueError(f"Unknown model type: {model_type}")

    def fit(self, X: np.ndarray, y: np.ndarray):
        X_scaled = self.scaler.fit_transform(X)
        self.classifier.fit(X_scaled, y)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        X_scaled = self.scaler.transform(X)
        return self.classifier.predict_proba(X_scaled)[:, 1]

    def evaluate(self, X: np.ndarray, y: np.ndarray, threshold: float = 0.5) -> Dict[str, float]:
        probs = self.predict_proba(X)
        preds = (probs >= threshold).astype(int)
        
        return {
            "accuracy": float(accuracy_score(y, preds)),
            "precision": float(precision_score(y, preds, zero_division=0)),
            "recall": float(recall_score(y, preds, zero_division=0)),
            "f1": float(f1_score(y, preds, zero_division=0)),
            "roc_auc": float(roc_auc_score(y, probs)),
        }

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({"scaler": self.scaler, "classifier": self.classifier, "model_type": self.model_type}, filepath)

    @classmethod
    def load(cls, filepath: str):
        data = joblib.load(filepath)
        instance = cls(model_type=data["model_type"])
        instance.scaler = data["scaler"]
        instance.classifier = data["classifier"]
        return instance

