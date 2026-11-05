"""
Doomsday Sentinel — Training Subsystem
Executes rigorous deepfake detector training with warmup, fine-tuning,
mixed precision, early stopping, and metric tracking.
"""

import os
import time
import copy
from typing import Dict, Any, Optional
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import roc_auc_score, accuracy_score

from src.models.classifier import DeepfakeClassifier


class Trainer:
    """
    Manages the training, validation, early stopping, and checkpointing lifecycle.
    """
    def __init__(
        self,
        model: DeepfakeClassifier,
        dataloaders: Dict[str, DataLoader],
        device: str = "cuda",
        learning_rate: float = 3e-4,
        weight_decay: float = 1e-4,
        pos_weight: Optional[float] = None,
        use_amp: bool = True,
        save_dir: str = "artifacts/model",
        checkpoint_name: str = "best_model.pth"
    ):
        self.device = torch.device(device if (device == "cuda" and torch.cuda.is_available()) else "cpu")
        self.model = model.to(self.device)
        self.dataloaders = dataloaders
        self.use_amp = use_amp and (self.device.type == "cuda")
        self.save_dir = save_dir
        self.checkpoint_name = checkpoint_name
        os.makedirs(save_dir, exist_ok=True)

        # Loss function
        if pos_weight is not None:
            pw_tensor = torch.tensor([pos_weight], device=self.device)
            self.criterion = nn.BCEWithLogitsLoss(pos_weight=pw_tensor)
        else:
            self.criterion = nn.BCEWithLogitsLoss()

        self.optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=learning_rate,
            weight_decay=weight_decay
        )

        self.scaler = torch.amp.GradScaler('cuda') if self.use_amp else None
        self.history = {
            "train_loss": [], "val_loss": [],
            "train_acc": [], "val_acc": [],
            "train_auc": [], "val_auc": [],
            "epoch_times": []
        }

    def train_epoch(self) -> Dict[str, float]:
        self.model.train()
        running_loss = 0.0
        all_targets = []
        all_preds = []

        for batch_idx, (images, targets, _) in enumerate(self.dataloaders["train"]):
            images = images.to(self.device, non_blocking=True)
            targets = targets.to(self.device, non_blocking=True)

            self.optimizer.zero_grad()

            if self.use_amp:
                with torch.amp.autocast('cuda'):
                    logits = self.model(images)
                    loss = self.criterion(logits, targets)
                self.scaler.scale(loss).backward()
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                logits = self.model(images)
                loss = self.criterion(logits, targets)
                loss.backward()
                self.optimizer.step()

            running_loss += loss.item() * images.size(0)
            probs = torch.sigmoid(logits).detach().cpu().numpy()
            all_preds.extend(probs)
            all_targets.extend(targets.cpu().numpy())

        total_samples = len(self.dataloaders["train"].dataset)
        epoch_loss = running_loss / total_samples
        bin_preds = (np.array(all_preds) >= 0.5).astype(int)
        epoch_acc = accuracy_score(all_targets, bin_preds)
        try:
            epoch_auc = roc_auc_score(all_targets, all_preds)
        except Exception:
            epoch_auc = 0.5

        return {"loss": float(epoch_loss), "accuracy": float(epoch_acc), "auc": float(epoch_auc)}

    @torch.no_grad()
    def validate_epoch(self) -> Dict[str, float]:
        self.model.eval()
        running_loss = 0.0
        all_targets = []
        all_preds = []

        for images, targets, _ in self.dataloaders["val"]:
            images = images.to(self.device, non_blocking=True)
            targets = targets.to(self.device, non_blocking=True)

            if self.use_amp:
                with torch.amp.autocast('cuda'):
                    logits = self.model(images)
                    loss = self.criterion(logits, targets)
            else:
                logits = self.model(images)
                loss = self.criterion(logits, targets)

            running_loss += loss.item() * images.size(0)
            probs = torch.sigmoid(logits).cpu().numpy()
            all_preds.extend(probs)
            all_targets.extend(targets.cpu().numpy())

        total_samples = len(self.dataloaders["val"].dataset)
        epoch_loss = running_loss / total_samples
        bin_preds = (np.array(all_preds) >= 0.5).astype(int)
        epoch_acc = accuracy_score(all_targets, bin_preds)
        try:
            epoch_auc = roc_auc_score(all_targets, all_preds)
        except Exception:
            epoch_auc = 0.5

        return {"loss": float(epoch_loss), "accuracy": float(epoch_acc), "auc": float(epoch_auc)}

    def fit(
        self,
        epochs: int = 10,
        warmup_epochs: int = 2,
        early_stopping_patience: int = 3,
        verbose: bool = True
    ) -> Dict[str, Any]:
        """
        Executes end-to-end training cycle with warmup and early stopping.
        """
        best_val_loss = float("inf")
        best_model_state = None
        patience_counter = 0

        # Learning rate scheduler
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            self.optimizer,
            T_max=epochs,
            eta_min=1e-6
        )

        if verbose:
            print(f"Starting training on {self.device.type.upper()} ({self.model.architecture}) for {epochs} epochs...")

        # 1. Warm-up Phase: Freeze backbone
        if warmup_epochs > 0:
            if verbose:
                print(f"[Warm-up] Freezing backbone feature extractor for {warmup_epochs} epochs...")
            self.model.freeze_backbone()

        for epoch in range(1, epochs + 1):
            t0 = time.time()

            # Unfreeze backbone after warmup
            if warmup_epochs > 0 and epoch == warmup_epochs + 1:
                if verbose:
                    print(f"[Fine-tuning] Unfreezing all backbone weights for end-to-end tuning...")
                self.model.unfreeze_backbone()

            train_metrics = self.train_epoch()
            val_metrics = self.validate_epoch()
            scheduler.step()

            duration = time.time() - t0
            self.history["train_loss"].append(train_metrics["loss"])
            self.history["val_loss"].append(val_metrics["loss"])
            self.history["train_acc"].append(train_metrics["accuracy"])
            self.history["val_acc"].append(val_metrics["accuracy"])
            self.history["train_auc"].append(train_metrics["auc"])
            self.history["val_auc"].append(val_metrics["auc"])
            self.history["epoch_times"].append(duration)

            if verbose:
                print(
                    f"Epoch [{epoch:02d}/{epochs:02d}] "
                    f"Train Loss: {train_metrics['loss']:.4f} | Train Acc: {train_metrics['accuracy']:.4f} | Train AUC: {train_metrics['auc']:.4f} || "
                    f"Val Loss: {val_metrics['loss']:.4f} | Val Acc: {val_metrics['accuracy']:.4f} | Val AUC: {val_metrics['auc']:.4f} "
                    f"({duration:.1f}s)"
                )

            # Check for best validation loss
            if val_metrics["loss"] < best_val_loss:
                best_val_loss = val_metrics["loss"]
                best_model_state = copy.deepcopy(self.model.state_dict())
                patience_counter = 0
                
                # Save checkpoint
                ckpt_path = os.path.join(self.save_dir, self.checkpoint_name)
                torch.save({
                    "epoch": epoch,
                    "architecture": self.model.architecture,
                    "model_state_dict": best_model_state,
                    "val_loss": val_metrics["loss"],
                    "val_accuracy": val_metrics["accuracy"],
                    "val_auc": val_metrics["auc"],
                    "timestamp": time.time()
                }, ckpt_path)
            else:
                patience_counter += 1
                if patience_counter >= early_stopping_patience:
                    if verbose:
                        print(f"Early stopping triggered after {epoch} epochs (Patience = {early_stopping_patience}).")
                    break

        # Restore best model state
        if best_model_state is not None:
            self.model.load_state_dict(best_model_state)
            if verbose:
                print(f"Restored best weights (Best Val Loss: {best_val_loss:.4f})")

        return {
            "best_val_loss": float(best_val_loss),
            "total_epochs": epoch,
            "history": self.history
        }


import numpy as np

