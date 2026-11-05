"""
Doomsday Sentinel — Model Training Pipeline Script
Executes full or smoke-test training of deepfake detection models using PyTorch & CUDA.
"""

import os
import sys
import argparse
import yaml
import json

# Ensure root workspace is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import torch
import pandas as pd
from src.data.dataset import create_dataloaders
from src.models.classifier import build_model
from src.training.trainer import Trainer
from src.evaluation.evaluator import ModelEvaluator, generate_evaluation_plots


def main():
    parser = argparse.ArgumentParser(description="Train Doomsday Sentinel Deepfake Detection Model")
    parser.add_argument("--config", type=str, default="configs/training.yaml")
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--batch-size", type=int, default=None)
    parser.add_argument("--architecture", type=str, default=None)
    parser.add_argument("--smoke-test", action="store_true")
    args = parser.parse_args()

    # Load Config
    with open(args.config, "r") as f:
        config = yaml.safe_load(f)["training"]

    arch = args.architecture or config["model_architecture"]
    epochs = args.epochs or (1 if args.smoke_test else config["hyperparameters"]["epochs"])
    batch_size = args.batch_size or (8 if args.smoke_test else config["hyperparameters"]["batch_size"])
    lr = float(config["hyperparameters"]["learning_rate"])
    weight_decay = float(config["hyperparameters"]["weight_decay"])

    print(f"=== Initiating Doomsday Sentinel Model Training ===")
    print(f"Architecture: {arch} | Epochs: {epochs} | Batch Size: {batch_size} | Smoke Test: {args.smoke_test}")

    # Load manifests
    train_csv = "data/manifests/train_manifest.csv"
    val_csv = "data/manifests/val_manifest.csv"
    test_csv = "data/manifests/test_manifest.csv"

    if args.smoke_test:
        train_df = pd.read_csv(train_csv).head(24)
        val_df = pd.read_csv(val_csv).head(12)
        test_df = pd.read_csv(test_csv).head(12)
    else:
        train_df = pd.read_csv(train_csv)
        val_df = pd.read_csv(val_csv)
        test_df = pd.read_csv(test_csv)

    loaders = create_dataloaders(
        train_manifest=train_df,
        val_manifest=val_df,
        test_manifest=test_df,
        batch_size=batch_size,
        num_workers=0
    )

    # Initialize Model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = build_model(architecture=arch, pretrained=True, device=device)

    # Initialize Trainer
    trainer = Trainer(
        model=model,
        dataloaders=loaders,
        device=device,
        learning_rate=lr,
        weight_decay=weight_decay,
        save_dir="artifacts/model",
        checkpoint_name="best_model.pth"
    )

    # Fit Model
    train_results = trainer.fit(
        epochs=epochs,
        warmup_epochs=1 if epochs > 1 else 0,
        early_stopping_patience=3
    )

    print(f"Training completed. Best validation loss: {train_results['best_val_loss']:.4f}")

    # Threshold Optimization on Val Split
    evaluator = ModelEvaluator(model, device=device)
    best_th, val_summary = evaluator.optimize_threshold_on_val(loaders["val"])
    print(f"Optimal Operating Threshold on Validation: {best_th:.4f} (Val F1: {val_summary['val_f1_at_optimal']:.4f})")

    # Evaluate on Untouched Test Set
    test_metrics, probs, targets, test_results_df = evaluator.evaluate_test_set(
        loaders["test"],
        threshold=best_th,
        reports_dir="reports"
    )
    print(f"Test Accuracy: {test_metrics['accuracy']:.4f} | Test AUC: {test_metrics['roc_auc']:.4f} | Test F1: {test_metrics['f1_score']:.4f}")

    # Generate Evaluation Figures
    generate_evaluation_plots(
        history=trainer.history,
        targets=targets,
        probs=probs,
        test_df=test_results_df,
        threshold=best_th,
        figures_dir="reports/figures"
    )

    # Save training experiment log
    exp_log = {
        "architecture": arch,
        "epochs_run": train_results["total_epochs"],
        "batch_size": batch_size,
        "learning_rate": lr,
        "device": device,
        "optimal_threshold": best_th,
        "validation_summary": val_summary,
        "test_metrics": test_metrics,
        "history": trainer.history
    }
    with open("reports/experiment_summary.json", "w") as f:
        json.dump(exp_log, f, indent=2)

    print("Experiment summary saved to reports/experiment_summary.json")


if __name__ == "__main__":
    main()

