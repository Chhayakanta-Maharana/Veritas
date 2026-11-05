"""
Doomsday Sentinel — PyTorch Dataset & DataLoader Infrastructure
Integrates manifest-driven metadata with online or cached forensic preprocessing.
"""

import os
from typing import Optional, Callable, Dict, Any, Tuple
import pandas as pd
import numpy as np
import cv2
import torch
from torch.utils.data import Dataset, DataLoader
from PIL import Image

from src.data.face_detection import FaceDetector
from src.data.augmentation import get_training_transforms, get_validation_transforms


class DeepfakeDataset(Dataset):
    """
    Forensic Deepfake Detection Dataset using a standardized metadata manifest.
    Safely reads images, applies face cropping with fallback, and normalizes into tensors.
    """
    def __init__(
        self,
        manifest_df_or_path: pd.DataFrame | str,
        root_dir: str = "",
        transform: Optional[Callable] = None,
        face_detector: Optional[FaceDetector] = None,
        target_size: Tuple[int, int] = (224, 224),
    ):
        if isinstance(manifest_df_or_path, str):
            if not os.path.exists(manifest_df_or_path):
                raise FileNotFoundError(f"Manifest not found: {manifest_df_or_path}")
            self.df = pd.read_csv(manifest_df_or_path)
        else:
            self.df = manifest_df_or_path.copy().reset_index(drop=True)

        self.root_dir = root_dir
        self.transform = transform
        self.face_detector = face_detector
        self.target_size = target_size

        # Validate mandatory columns
        required_cols = {"sample_id", "file_path", "label"}
        missing = required_cols - set(self.df.columns)
        if missing:
            raise ValueError(f"Manifest missing required columns: {missing}")

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, Dict[str, Any]]:
        row = self.df.iloc[idx]
        file_path = row["file_path"]
        if self.root_dir and not os.path.isabs(file_path):
            full_path = os.path.join(self.root_dir, file_path)
        else:
            full_path = file_path

        # Load image via OpenCV
        img_bgr = cv2.imread(full_path)
        if img_bgr is None:
            # Fallback to pure black image if file is corrupt/unreadable
            img_rgb = np.zeros((self.target_size[1], self.target_size[0], 3), dtype=np.uint8)
            det_meta = {"face_detection_status": "file_read_error", "bounding_box": [0, 0, 0, 0]}
        else:
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            if self.face_detector is not None:
                img_rgb, det_meta = self.face_detector.detect_and_crop(img_rgb, target_size=self.target_size)
            else:
                img_rgb = cv2.resize(img_rgb, self.target_size)
                det_meta = {"face_detection_status": "not_applied", "bounding_box": []}

        # Transform to tensor
        if self.transform is not None:
            tensor = self.transform(img_rgb)
        else:
            # Basic fallback to tensor
            tensor = torch.from_numpy(img_rgb.transpose(2, 0, 1)).float() / 255.0

        label = torch.tensor(float(row["label"]), dtype=torch.float32)

        meta = {
            "sample_id": str(row["sample_id"]),
            "file_path": str(file_path),
            "label": int(row["label"]),
            "source_dataset": str(row.get("source_dataset", "unknown")),
            "source_video_id": str(row.get("source_video_id", "none")),
            "manipulation_type": str(row.get("manipulation_type", "unknown")),
            "split": str(row.get("split", "unknown")),
            "face_detection_status": det_meta.get("face_detection_status", "ok")
        }

        return tensor, label, meta


def create_dataloaders(
    train_manifest: pd.DataFrame | str,
    val_manifest: pd.DataFrame | str,
    test_manifest: Optional[pd.DataFrame | str] = None,
    batch_size: int = 32,
    num_workers: int = 0,
    target_size: Tuple[int, int] = (224, 224),
    root_dir: str = "",
) -> Dict[str, DataLoader]:
    """
    Creates reproducible DataLoaders with leak-resistant transforms.
    """
    train_transforms = get_training_transforms(target_size)
    val_transforms = get_validation_transforms(target_size)
    detector = FaceDetector(margin_ratio=0.20)

    train_ds = DeepfakeDataset(
        manifest_df_or_path=train_manifest,
        root_dir=root_dir,
        transform=train_transforms,
        face_detector=detector,
        target_size=target_size,
    )
    val_ds = DeepfakeDataset(
        manifest_df_or_path=val_manifest,
        root_dir=root_dir,
        transform=val_transforms,
        face_detector=detector,
        target_size=target_size,
    )

    loaders = {
        "train": DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers, pin_memory=True),
        "val": DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=True),
    }

    if test_manifest is not None:
        test_ds = DeepfakeDataset(
            manifest_df_or_path=test_manifest,
            root_dir=root_dir,
            transform=val_transforms,
            face_detector=detector,
            target_size=target_size,
        )
        loaders["test"] = DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=True)

    return loaders
