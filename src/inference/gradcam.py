"""
Doomsday Sentinel — Explainable AI (Grad-CAM) Subsystem
Generates gradient-weighted class activation maps illustrating convolutional feature
sensitivity, overlaid on authentic and deepfake facial regions.
"""

from typing import Tuple, Dict, Any, Optional
import cv2
import numpy as np
import torch
import torch.nn.functional as F


class GradCAM:
    """
    Gradient-weighted Class Activation Mapping (Grad-CAM) for deepfake detection.
    Computes gradients of target output logit with respect to the final convolutional feature maps.
    """
    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register hooks
        self.hook_fwd = self.target_layer.register_forward_hook(self._save_activations)
        self.hook_bwd = self.target_layer.register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate_heatmap(
        self,
        input_tensor: torch.Tensor,
        target_class: int = 1
    ) -> Tuple[np.ndarray, float]:
        """
        Executes forward & backward pass to compute normalized Grad-CAM heatmap.
        
        Args:
            input_tensor: (1, 3, H, W) normalized tensor
            target_class: 1 for FAKE, 0 for REAL
            
        Returns:
            heatmap: (H, W) float32 in [0, 1]
            prob: model predicted probability of being FAKE
        """
        self.model.zero_grad()
        logits = self.model(input_tensor)
        prob = float(torch.sigmoid(logits).item())

        # For binary classification: logit is scalar per sample
        if target_class == 1:
            score = logits
        else:
            score = -logits

        score.backward(retain_graph=False)

        # Global average pooling of gradients
        # activations: [1, C, H', W'], gradients: [1, C, H', W']
        weights = torch.mean(self.gradients, dim=[2, 3], keepdim=True)
        cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
        cam = F.relu(cam) # Retain features that positively correlate

        cam = cam.squeeze().cpu().numpy()
        # Normalize between 0 and 1
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-8:
            heatmap = (cam - cam_min) / (cam_max - cam_min)
        else:
            heatmap = np.zeros_like(cam)

        return heatmap, prob

    def create_overlay(
        self,
        original_rgb: np.ndarray,
        heatmap: np.ndarray,
        alpha: float = 0.5,
        colormap: int = cv2.COLORMAP_JET
    ) -> np.ndarray:
        """
        Resizes heatmap to match image dimensions and blends using color map.
        
        Args:
            original_rgb: (H, W, 3) uint8 image
            heatmap: (H', W') float32 in [0, 1]
            
        Returns:
            overlay_rgb: (H, W, 3) uint8 composite
        """
        h, w = original_rgb.shape[:2]
        heatmap_resized = cv2.resize(heatmap, (w, h))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        
        # Apply OpenCV colormap (BGR output)
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, colormap)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
        
        # Blend
        overlay = cv2.addWeighted(original_rgb, 1.0 - alpha, heatmap_colored, alpha, 0)
        return overlay

    def remove_hooks(self):
        self.hook_fwd.remove()
        self.hook_bwd.remove()

