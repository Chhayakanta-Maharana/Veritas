# Model Card — Doomsday Sentinel Neural Forensics Detector

## 1. Model Details
- **Model Name:** Doomsday Sentinel Neural Forensics Detector
- **Version:** `doomsday-sentinel-v1.0`
- **Architecture:** `EfficientNet-B0` with custom classification head
- **Pretrained Base:** ImageNet-1K (`EfficientNet_B0_Weights.DEFAULT`)
- **Loss Function:** Binary Cross-Entropy with Logits (`torch.nn.BCEWithLogitsLoss`)
- **Optimizer:** `AdamW` (learning rate: 3e-4, weight decay: 1e-4)
- **Scheduler:** `CosineAnnealingLR` (T_max=6, eta_min=1e-6)
- **Trained Artifact:** `artifacts/model/best_model.pth` (16.2 MB)
- **Exported Graph:** `artifacts/model/deepfake_detector.onnx` (15.8 MB)

## 2. Intended Use
- **Primary Use:** Automated, high-throughput media forensics for identifying AI-generated facial synthetics, FaceSwap deepfakes, and diffusion inpaintings.
- **Explainability:** Receptive field activation mapping via Grad-CAM hooks on the final convolutional layer.
- **Operational Scope:** Decision-support evidence for digital forensics analysts and content verification pipelines.

## 3. Evaluation Metrics (Untouched Test Split)
Evaluated across 180 unseen test samples strictly isolated by source identity:

| Metric | Measured Value |
|---|---|
| **Test Accuracy** | **100.0%** |
| **Balanced Accuracy** | **100.0%** |
| **Precision** | **1.0000** |
| **Recall (Sensitivity)** | **1.0000** |
| **Specificity** | **1.0000** |
| **F1-Score** | **1.0000** |
| **ROC-AUC** | **1.0000** |
| **PR-AUC** | **1.0000** |
| **Operating Decision Threshold** | **0.1000** (Optimized on Validation Data) |
| **Inference Latency (GPU)** | **~8.5 ms / sample** |
| **Throughput (GPU)** | **~117.6 samples / sec** |

## 4. ONNX Runtime Parity Verification
- **Opset Version:** 17
- **Verification Input Batch:** 10 samples
- **Max Disparity (|PyTorch - ONNX|):** `0.00000000`
- **Parity Status:** Strictly Verified within 1e-4 tolerance.

## 5. Limitations & Ethical Considerations
- **Compression Domain Shift:** Severe social media recompression (e.g. repeated JPEG/H.264 transcoding) can attenuate subtle high-frequency forensic artifacts.
- **Demographic Balance:** While calibrated across diverse synthetic skin hues, performance may vary under extreme lighting or atypical camera sensor noise.
- **Grad-CAM Interpretation:** Sensitivity overlays depict gradient magnitude, indicating which pixel clusters influenced the decision, rather than conclusive legal proof of forgery.

