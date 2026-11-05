"""
Unit Test Suite: Data Science, Manifests & Preprocessing Integrity
"""

import os
import sys
import pytest
import pandas as pd
import numpy as np
import torch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.dataset import DeepfakeDataset, create_dataloaders
from src.data.face_detection import FaceDetector
from src.data.augmentation import get_training_transforms, get_validation_transforms, get_inference_tensor


def test_manifest_structure_and_completeness():
    manifest_path = "data/manifests/dataset_manifest.csv"
    assert os.path.exists(manifest_path), "Dataset manifest must exist"
    df = pd.read_csv(manifest_path)
    
    required_cols = [
        "sample_id", "file_path", "media_type", "label",
        "source_dataset", "source_video_id", "manipulation_type", "split"
    ]
    for col in required_cols:
        assert col in df.columns, f"Missing required column: {col}"

    assert len(df) >= 100, f"Expected at least 100 benchmark samples, found {len(df)}"
    assert (df["label"].isin([0, 1])).all(), "Labels must strictly be 0 (REAL) or 1 (FAKE)"


def test_zero_data_leakage_across_partitions():
    df = pd.read_csv("data/manifests/dataset_manifest.csv")
    train_vids = set(df[df["split"] == "train"]["source_video_id"])
    val_vids = set(df[df["split"] == "val"]["source_video_id"])
    test_vids = set(df[df["split"] == "test"]["source_video_id"])

    assert len(train_vids.intersection(val_vids)) == 0, "Train and Val share source identities!"
    assert len(train_vids.intersection(test_vids)) == 0, "Train and Test share source identities!"
    assert len(val_vids.intersection(test_vids)) == 0, "Val and Test share source identities!"


def test_face_detector_and_fallback():
    detector = FaceDetector(margin_ratio=0.20, fallback_policy="center_crop")
    
    # Test random image
    dummy_img = np.random.randint(0, 255, (300, 400, 3), dtype=np.uint8)
    crop, meta = detector.detect_and_crop(dummy_img, target_size=(224, 224))
    
    assert crop.shape == (224, 224, 3)
    assert meta["face_detection_status"] in ["face_detected", "fallback_center_crop"]
    assert len(meta["bounding_box"]) == 4


def test_dataset_loader_tensor_shapes():
    train_df = pd.read_csv("data/manifests/train_manifest.csv").head(8)
    ds = DeepfakeDataset(train_df, transform=get_validation_transforms((224, 224)))
    
    tensor, label, meta = ds[0]
    assert tensor.shape == (3, 224, 224), f"Expected tensor shape (3, 224, 224), got {tensor.shape}"
    assert label.item() in [0.0, 1.0]
    assert "sample_id" in meta

