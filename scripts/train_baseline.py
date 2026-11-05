"""
Doomsday Sentinel — Baseline Model Training & Comparison Pipeline
Extracts handcrafted forensic features and evaluates Logistic Regression and Random Forest.
"""

import os
import sys
import json

# Ensure root workspace is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
from src.models.baseline import build_dataset_features, BaselinePipeline


def main():
    print("=== Training Handcrafted Feature Forensic Baseline ===")
    train_df = pd.read_csv("data/manifests/train_manifest.csv")
    val_df = pd.read_csv("data/manifests/val_manifest.csv")
    test_df = pd.read_csv("data/manifests/test_manifest.csv")

    print(f"Extracting handcrafted forensic features (Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)})...")
    X_train, y_train = build_dataset_features(train_df)
    X_val, y_val = build_dataset_features(val_df)
    X_test, y_test = build_dataset_features(test_df)

    # 1. Logistic Regression Baseline
    lr_pipe = BaselinePipeline(model_type="logistic_regression")
    lr_pipe.fit(X_train, y_train)
    lr_metrics = lr_pipe.evaluate(X_test, y_test)
    print("Logistic Regression Test Metrics:", lr_metrics)
    lr_pipe.save("artifacts/preprocessing/baseline_logistic_regression.joblib")

    # 2. Random Forest Baseline
    rf_pipe = BaselinePipeline(model_type="random_forest")
    rf_pipe.fit(X_train, y_train)
    rf_metrics = rf_pipe.evaluate(X_test, y_test)
    print("Random Forest Test Metrics:", rf_metrics)
    rf_pipe.save("artifacts/preprocessing/baseline_random_forest.joblib")

    baseline_results = {
        "feature_count": X_train.shape[1],
        "models": {
            "logistic_regression": lr_metrics,
            "random_forest": rf_metrics
        }
    }

    with open("reports/baseline_metrics.json", "w") as f:
        json.dump(baseline_results, f, indent=2)

    print("Baseline metrics successfully saved to reports/baseline_metrics.json")


if __name__ == "__main__":
    main()

