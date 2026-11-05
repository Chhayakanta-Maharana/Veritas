"""
Doomsday Sentinel — Comprehensive Model Evaluation & Error Analysis Suite
Evaluates trained models on the untouched test split, optimizes decision thresholds
using validation data exclusively, computes forensic metrics, and renders all evaluation charts.
"""

import os
import json
import time
from typing import Dict, Any, Tuple, List
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import torch
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, average_precision_score, confusion_matrix,
    classification_report, roc_curve, precision_recall_curve
)
from sklearn.calibration import calibration_curve


class ModelEvaluator:
    """
    Forensic Model Evaluator adhering to strict scientific zero-leakage protocols.
    """
    def __init__(
        self,
        model: torch.nn.Module,
        device: str = "cuda"
    ):
        self.device = torch.device(device if (device == "cuda" and torch.cuda.is_available()) else "cpu")
        self.model = model.to(self.device)
        self.model.eval()

    @torch.no_grad()
    def predict_loader(self, dataloader) -> Tuple[np.ndarray, np.ndarray, List[Dict[str, Any]], float]:
        """
        Runs batch inference, recording predictions, probabilities, and precise latency.
        """
        all_probs = []
        all_targets = []
        all_metas = []
        
        t0 = time.perf_counter()
        for images, targets, metas in dataloader:
            images = images.to(self.device)
            logits = self.model(images)
            probs = torch.sigmoid(logits).cpu().numpy()
            
            all_probs.extend(probs)
            all_targets.extend(targets.numpy())
            
            # Format metadata
            batch_size = len(targets)
            for i in range(batch_size):
                all_metas.append({k: v[i] if isinstance(v, (list, tuple)) else v for k, v in metas.items()})

        total_time = time.perf_counter() - t0
        latency_ms_per_sample = (total_time / len(all_targets)) * 1000.0
        
        return np.array(all_probs), np.array(all_targets), all_metas, latency_ms_per_sample

    def optimize_threshold_on_val(self, val_loader) -> Tuple[float, Dict[str, float]]:
        """
        Selects the optimal operating threshold that maximizes F1-score
        using VALIDATION DATA ONLY.
        """
        probs, targets, _, _ = self.predict_loader(val_loader)
        thresholds = np.linspace(0.1, 0.9, 81)
        best_f1 = -1.0
        best_th = 0.50
        
        for th in thresholds:
            preds = (probs >= th).astype(int)
            f1 = f1_score(targets, preds, zero_division=0)
            if f1 > best_f1:
                best_f1 = f1
                best_th = float(th)

        val_preds = (probs >= best_th).astype(int)
        val_metrics = {
            "optimal_threshold": round(best_th, 4),
            "val_f1_at_optimal": round(best_f1, 4),
            "val_accuracy": round(float(accuracy_score(targets, val_preds)), 4),
            "val_roc_auc": round(float(roc_auc_score(targets, probs)), 4)
        }
        return best_th, val_metrics

    def evaluate_test_set(
        self,
        test_loader,
        threshold: float = 0.50,
        reports_dir: str = "reports"
    ) -> Dict[str, Any]:
        """
        Performs exhaustive test-set evaluation using the pre-tuned threshold.
        """
        os.makedirs(reports_dir, exist_ok=True)
        figures_dir = os.path.join(reports_dir, "figures")
        os.makedirs(figures_dir, exist_ok=True)

        probs, targets, metas, latency_ms = self.predict_loader(test_loader)
        preds = (probs >= threshold).astype(int)
        
        cm = confusion_matrix(targets, preds)
        tn, fp, fn, tp = cm.ravel()
        
        acc = accuracy_score(targets, preds)
        b_acc = balanced_accuracy_score(targets, preds)
        prec = precision_score(targets, preds, zero_division=0)
        rec = recall_score(targets, preds, zero_division=0) # sensitivity / TPR
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0 # Specificity / TNR
        f1 = f1_score(targets, preds, zero_division=0)
        roc_auc = roc_auc_score(targets, probs)
        pr_auc = average_precision_score(targets, probs)
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0
        throughput = 1000.0 / latency_ms if latency_ms > 0 else 0.0

        metrics = {
            "test_sample_count": len(targets),
            "decision_threshold": round(threshold, 4),
            "accuracy": round(float(acc), 4),
            "balanced_accuracy": round(float(b_acc), 4),
            "precision": round(float(prec), 4),
            "recall_sensitivity": round(float(rec), 4),
            "specificity": round(float(spec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc_auc), 4),
            "pr_auc": round(float(pr_auc), 4),
            "confusion_matrix": {
                "true_negatives": int(tn),
                "false_positives": int(fp),
                "false_negatives": int(fn),
                "true_positives": int(tp)
            },
            "false_positive_rate": round(float(fpr), 4),
            "false_negative_rate": round(float(fnr), 4),
            "inference_latency_ms": round(float(latency_ms), 2),
            "throughput_samples_per_sec": round(float(throughput), 1)
        }

        # Save metrics json
        with open(os.path.join(reports_dir, "model_metrics.json"), "w") as f:
            json.dump(metrics, f, indent=2)

        # Classification report text
        target_names = ["0: REAL", "1: FAKE"]
        cr = classification_report(targets, preds, target_names=target_names, digits=4)
        with open(os.path.join(reports_dir, "classification_report.txt"), "w") as f:
            f.write("DOOMSDAY SENTINEL — TEST CLASSIFICATION REPORT\n")
            f.write(f"Threshold: {threshold:.4f}\n\n")
            f.write(cr)

        # Per-source and Per-manipulation breakdown
        test_df = pd.DataFrame(metas)
        test_df["ground_truth"] = targets
        test_df["predicted_prob"] = probs
        test_df["predicted_class"] = preds

        per_source = {}
        for src, grp in test_df.groupby("source_dataset"):
            per_source[src] = {
                "count": len(grp),
                "accuracy": round(float(accuracy_score(grp["ground_truth"], grp["predicted_class"])), 4),
                "f1": round(float(f1_score(grp["ground_truth"], grp["predicted_class"], zero_division=0)), 4)
            }
        metrics["per_source_evaluation"] = per_source

        per_manip = {}
        for manip, grp in test_df[test_df["ground_truth"] == 1].groupby("manipulation_type"):
            per_manip[manip] = {
                "count": len(grp),
                "detection_rate_recall": round(float(recall_score(grp["ground_truth"], grp["predicted_class"], zero_division=0)), 4)
            }
        metrics["per_manipulation_evaluation"] = per_manip

        return metrics, probs, targets, test_df


def generate_evaluation_plots(
    history: Dict[str, List[float]],
    targets: np.ndarray,
    probs: np.ndarray,
    test_df: pd.DataFrame,
    threshold: float,
    figures_dir: str = "reports/figures"
):
    """
    Renders all mandatory evaluation figures (ROC, PR, Confusion Matrix, Calibration, etc.)
    """
    os.makedirs(figures_dir, exist_ok=True)
    preds = (probs >= threshold).astype(int)

    # 1. Training vs Validation Loss
    if "train_loss" in history and len(history["train_loss"]) > 0:
        plt.figure(figsize=(7, 5))
        epochs = range(1, len(history["train_loss"]) + 1)
        plt.plot(epochs, history["train_loss"], label="Train Loss", color="#06b6d4", linewidth=2)
        plt.plot(epochs, history["val_loss"], label="Val Loss", color="#ef4444", linewidth=2)
        plt.title("Eval 1: Training vs Validation Loss Curve", fontsize=12, fontweight='bold')
        plt.xlabel("Epoch")
        plt.ylabel("BCE Loss")
        plt.legend()
        plt.tight_layout()
        plt.savefig(f"{figures_dir}/eval_01_loss_curve.png", dpi=150)
        plt.close()

    # 2. Training vs Validation Accuracy
    if "train_acc" in history and len(history["train_acc"]) > 0:
        plt.figure(figsize=(7, 5))
        epochs = range(1, len(history["train_acc"]) + 1)
        plt.plot(epochs, history["train_acc"], label="Train Accuracy", color="#06b6d4", linewidth=2)
        plt.plot(epochs, history["val_acc"], label="Val Accuracy", color="#10b981", linewidth=2)
        plt.title("Eval 2: Training vs Validation Accuracy", fontsize=12, fontweight='bold')
        plt.xlabel("Epoch")
        plt.ylabel("Accuracy")
        plt.legend()
        plt.tight_layout()
        plt.savefig(f"{figures_dir}/eval_02_accuracy_curve.png", dpi=150)
        plt.close()

    # 4. Confusion Matrix
    cm = confusion_matrix(targets, preds)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=["Pred REAL", "Pred FAKE"],
                yticklabels=["Actual REAL", "Actual FAKE"])
    plt.title(f"Eval 4: Test Confusion Matrix (Threshold={threshold:.2f})", fontsize=12, fontweight='bold')
    plt.ylabel("Ground Truth")
    plt.tight_layout()
    plt.savefig(f"{figures_dir}/eval_04_confusion_matrix.png", dpi=150)
    plt.close()

    # 5. ROC Curve
    fpr, tpr, _ = roc_curve(targets, probs)
    auc_val = roc_auc_score(targets, probs)
    plt.figure(figsize=(7, 5))
    plt.plot(fpr, tpr, color="#38bdf8", lw=2, label=f"ROC Curve (AUC = {auc_val:.4f})")
    plt.plot([0, 1], [0, 1], color="#475569", linestyle="--")
    plt.title("Eval 5: Receiver Operating Characteristic (ROC)", fontsize=12, fontweight='bold')
    plt.xlabel("False Positive Rate (FPR)")
    plt.ylabel("True Positive Rate (Sensitivity)")
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(f"{figures_dir}/eval_05_roc_curve.png", dpi=150)
    plt.close()

    # 6. Precision-Recall Curve
    prec_pts, rec_pts, _ = precision_recall_curve(targets, probs)
    ap = average_precision_score(targets, probs)
    plt.figure(figsize=(7, 5))
    plt.plot(rec_pts, prec_pts, color="#10b981", lw=2, label=f"PR Curve (PR-AUC = {ap:.4f})")
    plt.title("Eval 6: Precision-Recall Curve", fontsize=12, fontweight='bold')
    plt.xlabel("Recall (Detection Sensitivity)")
    plt.ylabel("Precision")
    plt.legend(loc="lower left")
    plt.tight_layout()
    plt.savefig(f"{figures_dir}/eval_06_pr_curve.png", dpi=150)
    plt.close()

    # 7. Threshold vs Metric Plot
    th_range = np.linspace(0.05, 0.95, 50)
    accs, f1s, precs, recs = [], [], [], []
    for t in th_range:
        p = (probs >= t).astype(int)
        accs.append(accuracy_score(targets, p))
        f1s.append(f1_score(targets, p, zero_division=0))
        precs.append(precision_score(targets, p, zero_division=0))
        recs.append(recall_score(targets, p, zero_division=0))
    
    plt.figure(figsize=(8, 5))
    plt.plot(th_range, accs, label="Accuracy", color="#38bdf8")
    plt.plot(th_range, f1s, label="F1-Score", color="#f59e0b", lw=2)
    plt.plot(th_range, precs, label="Precision", color="#10b981")
    plt.plot(th_range, recs, label="Recall", color="#ef4444")
    plt.axvline(threshold, color="#ffffff", linestyle="--", label=f"Selected Threshold ({threshold:.2f})")
    plt.title("Eval 7: Operating Threshold vs Forensic Metrics", fontsize=12, fontweight='bold')
    plt.xlabel("Decision Threshold")
    plt.ylabel("Metric Score")
    plt.legend()
    plt.tight_layout()
    plt.savefig(f"{figures_dir}/eval_07_threshold_analysis.png", dpi=150)
    plt.close()

    # 8. Calibration Plot
    prob_true, prob_pred = calibration_curve(targets, probs, n_bins=10)
    plt.figure(figsize=(7, 5))
    plt.plot(prob_pred, prob_true, marker="o", linewidth=2, color="#a855f7", label="Model Calibration")
    plt.plot([0, 1], [0, 1], linestyle="--", color="#64748b", label="Perfect Calibration")
    plt.title("Eval 8: Probability Calibration Reliability Curve", fontsize=12, fontweight='bold')
    plt.xlabel("Mean Predicted Probability")
    plt.ylabel("Fraction of Positives (Observed Fakes)")
    plt.legend()
    plt.tight_layout()
    plt.savefig(f"{figures_dir}/eval_08_calibration_curve.png", dpi=150)
    plt.close()

    # 10. Per-source Performance Comparison
    plt.figure(figsize=(8, 5))
    src_data = test_df.groupby("source_dataset").apply(
        lambda g: accuracy_score(g["ground_truth"], g["predicted_class"])
    ).reset_index(name="Accuracy")
    sns.barplot(data=src_data, x="source_dataset", y="Accuracy", palette=["#06b6d4", "#3b82f6", "#8b5cf6"])
    plt.title("Eval 10: Test Accuracy Across Benchmark Datasets", fontsize=12, fontweight='bold')
    plt.ylim([0, 1.05])
    plt.tight_layout()
    plt.savefig(f"{figures_dir}/eval_10_source_performance.png", dpi=150)
    plt.close()

    # 11. Per-manipulation Performance Comparison
    fakes_only = test_df[test_df["ground_truth"] == 1]
    if len(fakes_only) > 0:
        plt.figure(figsize=(8, 5))
        manip_data = fakes_only.groupby("manipulation_type").apply(
            lambda g: recall_score(g["ground_truth"], g["predicted_class"], zero_division=0)
        ).reset_index(name="Detection_Recall")
        sns.barplot(data=manip_data, x="manipulation_type", y="Detection_Recall", palette=["#f43f5e", "#fb923c", "#facc15"])
        plt.title("Eval 11: Deepfake Detection Recall by Manipulation Architecture", fontsize=12, fontweight='bold')
        plt.ylim([0, 1.05])
        plt.tight_layout()
        plt.savefig(f"{figures_dir}/eval_11_manipulation_recall.png", dpi=150)
        plt.close()

