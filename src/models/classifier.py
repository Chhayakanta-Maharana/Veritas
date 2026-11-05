"""
Doomsday Sentinel — Deep Learning Forensic Architectures
Implements transfer-learning classifiers using EfficientNet-B0 and ResNet-18
with replaceable heads and Grad-CAM feature hooks.
"""

from typing import Tuple, Optional
import torch
import torch.nn as nn
from torchvision.models import (
    efficientnet_b0, EfficientNet_B0_Weights,
    resnet18, ResNet18_Weights,
    mobilenet_v3_small, MobileNet_V3_Small_Weights
)


class DeepfakeClassifier(nn.Module):
    """
    Forensic Neural Network Detector supporting EfficientNet-B0, ResNet-18, and MobileNet-V3.
    """
    def __init__(
        self,
        architecture: str = "efficientnet_b0",
        pretrained: bool = True,
        dropout_rate: float = 0.3,
        num_classes: int = 1
    ):
        super().__init__()
        self.architecture = architecture
        self.num_classes = num_classes

        if architecture == "efficientnet_b0":
            weights = EfficientNet_B0_Weights.DEFAULT if pretrained else None
            self.backbone = efficientnet_b0(weights=weights)
            in_features = self.backbone.classifier[1].in_features
            # Replace classifier head
            self.backbone.classifier = nn.Sequential(
                nn.Dropout(p=dropout_rate, inplace=True),
                nn.Linear(in_features, num_classes)
            )
            # Target layer for Grad-CAM
            self.gradcam_layer = self.backbone.features[-1]

        elif architecture == "resnet18":
            weights = ResNet18_Weights.DEFAULT if pretrained else None
            self.backbone = resnet18(weights=weights)
            in_features = self.backbone.fc.in_features
            self.backbone.fc = nn.Sequential(
                nn.Dropout(p=dropout_rate),
                nn.Linear(in_features, num_classes)
            )
            self.gradcam_layer = self.backbone.layer4[-1]

        elif architecture == "mobilenet_v3":
            weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
            self.backbone = mobilenet_v3_small(weights=weights)
            in_features = self.backbone.classifier[0].in_features
            self.backbone.classifier = nn.Sequential(
                nn.Linear(in_features, 256),
                nn.Hardswish(),
                nn.Dropout(p=dropout_rate),
                nn.Linear(256, num_classes)
            )
            self.gradcam_layer = self.backbone.features[-1]

        else:
            raise ValueError(f"Unsupported architecture: {architecture}")

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Computes forward pass.
        Returns raw single-unit logits (shape: [batch_size, 1] or [batch_size]).
        """
        out = self.backbone(x)
        return out.squeeze(-1)

    def freeze_backbone(self):
        """
        Freezes feature extractor for initial warm-up phase.
        """
        for name, param in self.backbone.named_parameters():
            if "classifier" not in name and "fc" not in name:
                param.requires_grad = False

    def unfreeze_backbone(self):
        """
        Unfreezes all backbone parameters for full end-to-end fine-tuning.
        """
        for param in self.backbone.parameters():
            param.requires_grad = True


def build_model(
    architecture: str = "efficientnet_b0",
    pretrained: bool = True,
    dropout_rate: float = 0.3,
    device: str = "cuda"
) -> DeepfakeClassifier:
    """
    Factory method to initialize and transfer model to compute device.
    """
    if device == "cuda" and not torch.cuda.is_available():
        device = "cpu"
    model = DeepfakeClassifier(
        architecture=architecture,
        pretrained=pretrained,
        dropout_rate=dropout_rate
    )
    return model.to(device)

