"""
Doomsday Sentinel — Augmentation & Transform Pipelines
Engineered to preserve subtle forensic compression artifacts and boundary artifacts
while regularizing training across real and synthetic distributions.
"""

import io
import random
from typing import Tuple
import torch
import torchvision.transforms as T
from PIL import Image


class RandomJPEGCompression:
    """
    Simulates real-world video & web recompression to prevent forensic domain shift.
    """
    def __init__(self, quality_range: Tuple[int, int] = (60, 95), p: float = 0.5):
        self.quality_range = quality_range
        self.p = p

    def __call__(self, img_pil: Image.Image) -> Image.Image:
        if random.random() < self.p:
            quality = random.randint(self.quality_range[0], self.quality_range[1])
            buf = io.BytesIO()
            img_pil.save(buf, format="JPEG", quality=quality)
            buf.seek(0)
            return Image.open(buf).convert("RGB")
        return img_pil


def get_training_transforms(image_size: Tuple[int, int] = (224, 224)) -> T.Compose:
    """
    Returns data transforms for training with forensic compression regularization.
    """
    return T.Compose([
        T.ToPILImage(),
        T.Resize(image_size),
        T.RandomHorizontalFlip(p=0.5),
        T.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1, hue=0.05),
        RandomJPEGCompression(quality_range=(65, 95), p=0.4),
        T.ToTensor(),
        T.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])


def get_validation_transforms(image_size: Tuple[int, int] = (224, 224)) -> T.Compose:
    """
    Returns deterministic transforms for validation, test, and production inference.
    """
    return T.Compose([
        T.ToPILImage(),
        T.Resize(image_size),
        T.ToTensor(),
        T.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])


def get_inference_tensor(image_rgb, image_size: Tuple[int, int] = (224, 224), device: str = "cpu") -> torch.Tensor:
    """
    Converts a processed RGB numpy array (H, W, 3) into a normalized (1, 3, H, W) tensor.
    """
    transform = get_validation_transforms(image_size)
    tensor = transform(image_rgb)
    tensor = tensor.unsqueeze(0).to(device)
    return tensor
