# INDEPENDENT ML AUDIT & FULL-STACK QA REPORT
## Project: Doomsday Sentinel — AI-Powered Deepfake & Synthetic Media Forensics (FT-02)

**Audit Conducted By:** Senior ML Auditor & Full-Stack QA Engineer  
**Audit Date:** November 3, 2026  
**Target Workspace:** `C:\Arcade`  
**Execution Environment:** Python 3.11.14 (`doomsday-sentinel`), PyTorch 2.6.0+cu124, CUDA 12.4, NVIDIA RTX A2000 12GB  
**Primary Artifacts Inspected:**  
- Model Checkpoint: `artifacts/model/best_model.pth` (MD5: `1f38e3e4a36f32e2be289197c36a461b`)
- ONNX Graph: `artifacts/model/deepfake_detector.onnx` (MD5: `8b8ff7cf8ce69e5d4cb0b23ce5a21df6`)
- Manifest: `data/manifests/dataset_manifest.csv` (1,200 samples)
- Backend: Django 5.2.18 / Django REST Framework
- Frontend: Next.js 14.2.24 (App Router, Tailwind CSS, TypeScript, Recharts)

---

## 1. Executive Summary & Audit Scorecard

| Check # | Audit Area | Verification Status | Key Evidence / Finding |
| :---: | :--- | :---: | :--- |
| **01** | Dataset Manifest & Leakage | **PASS** | 1,200 unique samples, 40 identities, 0 split overlap, zero identity contamination. |
| **02** | Dataset Provenance | **FAIL (Caveat)** | Procedurally synthesized via OpenCV; not official FaceForensics++/Celeb-DF downloads. |
| **03** | Training Pipeline Isolation | **PASS** | Test set completely untouched during training, early stopping, and threshold calibration. |
| **04** | Test Set Metric Re-Evaluation | **PASS** | 100.0% test accuracy independently replicated on 180 samples; Wilson 95% CI: [0.9791, 1.0000]. |
| **05** | Root Cause of 100% Accuracy | **PASS** | Mathematical procedural artifacts (sinusoidal grid, bilateral blur) easily separated by CNN. |
| **06** | Baseline Models Audit | **PASS** | `StandardScaler` fitted on `X_train` only; baseline protocol strictly matches deep learning. |
| **07** | Grad-CAM Explainability | **PASS** | Localized on faceswap & diffusion edges; diffuse on StyleGAN; target_class=1 nuances verified. |
| **08** | PyTorch vs ONNX Parity | **PASS** | Max logit diff: $2.29 \times 10^{-5}$, max prob diff: $6.70 \times 10^{-8}$, 50/50 decision agreement on real test inputs. |
| **09** | Automated Test Suite (18/18) | **PASS** | 0 mocks used; real PyTorch forward passes & video decoding executed; all 18 tests pass. |
| **10** | Database & Neon Configuration | **PASS** | Graceful fallback to SQLite when `DATABASE_URL` unset; migrations 100% applied; CRUD verified. |
| **11** | Frontend Integration | **PASS** | Zero hardcoded demo metrics; Next.js directly consumes live Django REST endpoints. |
| **12** | Resilience & Edge Handling | **PASS** | 50MB limit enforced; corrupted video returns 400 Bad Request; safe disk cleanup added. |
| **13** | Independent Dataset & Domain Shift | **FAIL (Domain Shift)** | Protected external access documented; model predicts `0.7254 FAKE` on authentic real photography. |

---

## 2. Detailed Audit Inspections

### Audit 1: Dataset Manifest, Class Balance, & Contamination Analysis
- **Status:** **PASS**
- **Inspection Command:**
  ```python
  import pandas as pd
  df = pd.read_csv("data/manifests/dataset_manifest.csv")
  train_ids = set(df[df["split"] == "train"]["source_video_id"])
  val_ids = set(df[df["split"] == "val"]["source_video_id"])
  test_ids = set(df[df["split"] == "test"]["source_video_id"])
  ```
- **Findings:**
  - Total Samples: 1,200 images across 40 video sequences.
  - Class Distribution: Exactly 600 REAL (50.0%) and 600 FAKE (50.0%).
  - Split Proportions:
    - Train: 840 samples (420 Real, 420 Fake; 28 identities `ID_000` to `ID_027`).
    - Validation: 180 samples (90 Real, 90 Fake; 6 identities `ID_028` to `ID_033`).
    - Test: 180 samples (90 Real, 90 Fake; 6 identities `ID_034` to `ID_039`).
  - Identity Leakage Check:
    $$\text{Train} \cap \text{Val} = \emptyset, \quad \text{Train} \cap \text{Test} = \emptyset, \quad \text{Val} \cap \text{Test} = \emptyset$$
  - Byte-Level Duplicates: All 1,200 files have unique MD5 checksums. Zero duplicate images exist.

---

### Audit 2: Dataset Provenance & Synthesis Limitations
- **Status:** **FAIL (Provenance Designation Discrepancy)**
- **Source Code Inspected:** `src/data/prepare_dataset.py` lines 80–230.
- **Findings:**
  - The dataset generator synthesizes face-like geometrical structures using OpenCV canvas drawing primitives (`cv2.ellipse`, `cv2.fillPoly`, `cv2.circle`, `cv2.line`).
  - Manipulations are procedural mathematical transformations:
    - **Faceswap:** Canvas affine rotation, eye/mouth substitution, and alpha blending.
    - **StyleGAN:** 2D sinusoidal periodic grid modulation:
      $$I(x, y) = I(x, y) + A \cdot \sin(x \cdot \omega_x) \cdot \cos(y \cdot \omega_y)$$
    - **Synthetic Diffusion:** Bilateral smoothing (`cv2.bilateralFilter`) followed by Gaussian noise injection.
  - **Critical Finding:** The dataset manifests label sources as `FaceForensics_Benchmark`, `CelebDF_Subset`, and `SyntheticDiffusion_v2`. These are **procedural tags** created in Python rather than direct downloads from the Technical University of Munich (FaceForensics++) or SUNY Albany (Celeb-DF).
  - **Implication:** The project must not claim direct consortium provenance. The dataset is a reproducible synthetic benchmark.

---

### Audit 3: Training Protocol & Test Set Isolation
- **Status:** **PASS**
- **Inspected Files:** `scripts/train.py`, `src/training/trainer.py`, `src/evaluation/evaluator.py`, `notebooks/02_model_training_and_evaluation.ipynb`.
- **Verification Evidence:**
  - `loaders['test']` is generated via `create_dataloaders()` but is **never passed** to `trainer.fit()`.
  - `EarlyStopping` strictly tracks `val_loss`.
  - Optimal threshold selection (`evaluator.optimize_threshold_on_val()`) operates exclusively on `loaders['val']`, finding threshold $\tau = 0.10$ where $|\text{FPR} - (1 - \text{TPR})|$ is minimized.
  - Zero test manifest leakage occurred during model optimization.

---

### Audit 4: Re-Evaluation on Untouched Test Set
- **Status:** **PASS**
- **Executed Command:** Direct forward pass of `DeepfakeClassifier` using weights `best_model.pth` on the 180 test samples (`test_manifest.csv`).
- **Recalculated Confusion Matrix ($\tau = 0.10$):**
  $$\begin{bmatrix} \text{TN} = 90 & \text{FP} = 0 \\ \text{FN} = 0 & \text{TP} = 90 \end{bmatrix}$$
- **Recalculated Metrics:**
  - **Accuracy:** $1.0000$ (100.0%)
  - **95% Wilson Score Confidence Interval:** $[0.9791, 1.0000]$
  - **Balanced Accuracy:** $1.0000$
  - **Precision:** $1.0000$
  - **Recall / Sensitivity:** $1.0000$
  - **Specificity:** $1.0000$
  - **F1-Score:** $1.0000$
  - **ROC-AUC:** $1.0000$
  - **PR-AUC:** $1.0000$
- **Probability Distribution Separation:**
  - **Real Samples ($N=90$):** Mean Fake Prob $= 0.000314$ (Min $= 0.000005$, Max $= 0.001642$)
  - **Fake Samples ($N=90$):** Mean Fake Prob $= 0.997263$ (Min $= 0.993952$, Max $= 0.999044$)
  - **Separation Margin:** $\Delta_{\min} = 0.993952 - 0.001642 = 0.992310$ ($>99.2\%$ probability gap).
  - The reported 100% test accuracy is mathematically genuine for this test manifest.

---

### Audit 5: Root Cause of 100% Accuracy (Shortcuts vs Artifacts)
- **Status:** **PASS**
- **Investigation into Potential Shortcuts:**
  1. *Filename Leakage:* Negated. Input tensor is loaded from disk bytes via `Image.open()`; filenames are excluded from tensor construction.
  2. *Spatial Dimensions:* Negated. Both real and fake raw frames are generated at $256 \times 256$ and normalized to $224 \times 224$.
  3. *JPEG Compression Quality:* Negated. Both classes use `cv2.imwrite` with identical JPEG quality factor $95$.
  4. *Identity Contamination:* Negated. All 6 test identities are completely absent from training.
- **Root Cause Conclusion:**
  - The 100% accuracy is caused by the **procedural nature of the synthetic generation pipeline**.
  - The convolutional filters of EfficientNet-B0 easily separate the high-frequency sinusoidal grid of StyleGAN, the bilateral edge-smoothing of Diffusion, and the affine seam boundaries of Faceswap from the uniform Gaussian sensor noise of Real images.
  - While mathematically sound, this high accuracy reflects in-distribution mastery of procedural rules rather than general deepfake detection.

---

### Audit 6: Baseline Models Audit
- **Status:** **PASS**
- **Inspected Files:** `src/models/baseline.py`, `scripts/train.py`.
- **Findings:**
  - Feature Extractor: 24-bin RGB Color Histograms + 26-bin Local Binary Patterns (LBP) $= 50$-dimensional feature vectors.
  - Preprocessing Isolation: `StandardScaler` is fitted on `X_train` only (`scaler.fit_transform(X_train)`). Validation and test sets are normalized via `scaler.transform()`.
  - Protocol Parity: Baseline evaluation strictly shares the identical train/val/test splits and evaluation metrics.
  - Reported Metrics:
    - Logistic Regression: Test Accuracy $= 0.9889$, F1 $= 0.9888$
    - Random Forest: Test Accuracy $= 0.9944$, F1 $= 0.9944$
  - Near-perfect baseline performance independently confirms that the procedural generation artifacts are readily detectable even by linear and tree-based estimators.

---

### Audit 7: Grad-CAM Explainability Audit
- **Status:** **PASS**
- **Inspected File:** `src/inference/gradcam.py`.
- **Target Layer:** `features.8` (final convolutional stage of EfficientNet-B0, $7 \times 7$ feature maps).
- **Attribution Analysis Across Classes:**
  - **Faceswap:** Activations concentrate heavily around facial boundary contours and mouth/eye swap seams (mean activation $= 0.091$).
  - **Synthetic Diffusion:** Localized activation on smoothed internal facial features (mean activation $= 0.108$).
  - **StyleGAN:** Diffuse, high-intensity activation spanning the entire feature grid (mean activation $= 0.342$), confirming network reliance on the full-frame sinusoidal checkerboard pattern.
  - **Real Images:** Computing gradients for `target_class=1` highlights background and edge regions with low baseline activation, while the final sigmoid output remains near zero ($0.0003$).

---

### Audit 8: PyTorch vs ONNX Parity Testing
- **Status:** **PASS**
- **Executed Script:** Tested 50 real preprocessed test samples through `cv2.imread -> detect_and_crop -> get_inference_tensor -> PyTorch vs ONNXRuntime`.
- **Parity Results:**
  - **Max Raw Logit Disparity:** $2.2888 \times 10^{-5}$
  - **Max Probability Disparity:** $6.6987 \times 10^{-8}$
  - **Decision Agreement:** $50 / 50$ ($100.0\%$)
- Preprocessing pipelines, tensor layouts (`Float32`, ImageNet mean/std normalization), and threshold comparisons are fully equivalent between runtimes.

---

### Audit 9: Automated Test Suite (18/18)
- **Status:** **PASS**
- **Execution Command:** `python -m pytest -v` in `doomsday-sentinel` environment.
- **Results:** 18 passed in 10.50 seconds.
- **Suite Breakdown:**
  - `test_backend_api.py` (8 tests): API health, model info, image inference, video inference, list/detail views, dashboard telemetry, PDF report export, invalid upload rejection.
  - `test_data.py` (4 tests): Manifest completeness, zero cross-split identity leakage, Haar cascade detector fallback, tensor shape verification.
  - `test_model.py` (3 tests): Forward pass tensor dimensionality, Grad-CAM heatmap generation, PyTorch-ONNX parity.
  - `test_inference.py` (2 tests): End-to-end image inference pipeline, video frame temporal analysis.
  - `test_integration.py` (1 test): Complete lifecycle from image ingest to database persistence and PDF stream generation.
- **Mock Audit:** No mock objects (`unittest.mock.patch`) are used; all tests execute actual neural forward passes, image transforms, and database transactions.

---

### Audit 10: Django Configuration & Neon Database Connectivity
- **Status:** **PASS with Deployment Caveat**
- **Settings Inspected:** `backend/config/settings.py` lines 85–111.
- **Findings:**
  - When `DATABASE_URL` is configured with a valid Neon connection string (`postgresql://...sslmode=require`), `dj_database_url` configures Neon Serverless PostgreSQL with SSL and connection pooling.
  - In local development without an active `.env` secret, the application logs:
    `[Database] DATABASE_URL not set or contains placeholder. Defaulting to local SQLite.`
    and falls back safely to `backend/db.sqlite3`.
  - Migrations: 100% applied (`admin`, `auth`, `contenttypes`, `sessions`, `forensics.0001_initial`).
  - CRUD Persistence: Verified creating, reading, and deleting `Analysis` and `AnalysisArtifact` records.

---

### Audit 11: Frontend Integration & Live Telemetry
- **Status:** **PASS**
- **Inspected Files:** `frontend/lib/api.ts`, `frontend/app/dashboard/page.tsx`, `frontend/app/analyze/image/page.tsx`, `frontend/app/analyses/[id]/page.tsx`.
- **Findings:**
  - The Next.js frontend contains zero hardcoded metrics.
  - `DashboardPage` queries `api.getDashboardStats()` (`/api/dashboard/stats/`) to dynamically populate KPI cards, recent analysis history, and Recharts donut visualizations.
  - Upload terminals dynamically dispatch multipart payloads to `/api/analyze/image/` and `/api/analyze/video/`.
  - Dossier view `/analyses/[id]` retrieves records via `/api/analyses/[id]/` and provides on-demand PDF report downloads.

---

### Audit 12: Resilience, Edge Cases & Safe Cleanup
- **Status:** **PASS (Remediated During Audit)**
- **Edge Testing Summary:**
  - Invalid File Extensions (`.exe`, `.sh`): Correctly rejected with `400 Bad Request`.
  - Corrupted Images: Correctly rejected with `400 Bad Request`.
  - Oversized Files ($>50\text{MB}$): Correctly rejected with `400 Bad Request` ("File size exceeds 50MB limit").
  - Non-Existent UUID: Correctly responds with `404 Not Found`.
  - Corrupted Video Decoding: Remediated `views.py` to return `400 Bad Request` (client input error) rather than unhandled `500`.
  - Safe Deletion Cleanup: Implemented a Django `post_delete` signal on `AnalysisArtifact` to unlink physical files in `media/uploads/` upon analysis deletion, preventing disk storage leakage.

---

### Audit 13: Independent Public Dataset Evaluation & Domain Shift
- **Status:** **FAIL (Severe Domain Shift on Natural Photography)**
- **Public Consortium Constraints:** Official FaceForensics++ and Celeb-DF datasets require signed institutional agreements and multi-gigabyte downloads, which are inaccessible via unauthenticated local scripts.
- **Empirical Domain Shift Experiment:**
  - Evaluated the trained model against an authentic real-world photographic portrait (`lena.jpg` from the OpenCV official repository).
  - Face Detection: Haar Cascade successfully identified the face at coordinates `[185, 169, 420, 404]`.
  - Model Verdict: **PREDICTION: FAKE**, Score: **0.7254 (72.5% manipulation probability)**.
- **Scientific Finding:**
  - The model incorrectly flags authentic natural photography as synthetic because natural camera sensor noise, lens vignetting, and standard JPEG quantization artifacts differ from the synthetic Gaussian noise used in the procedural training set.
  - Generalization to in-the-wild web deepfakes is low without fine-tuning on real FaceForensics++ compression benchmarks.

---

## 3. Prioritized Engineering Recommendations

1. **Dataset Realism (P0 - Critical for Production):**
   - Acquire authentic FaceForensics++ (c23 and c40 compression levels) and Celeb-DF v2 subsets.
   - Mix genuine camera captures with real GAN (StyleGAN3) and Diffusion (Stable Diffusion XL, Flux) samples to train out procedural shortcut reliance.
2. **Model Missing-Weight Hard Failure (P1):**
   - In `src/inference/predict.py`, raise `FileNotFoundError` if `best_model.pth` is missing instead of silently falling back to uncalibrated random weights.
3. **Database URL Validation in UI (P2):**
   - Add a subtle status indicator in the frontend footer displaying whether the active storage engine is Neon PostgreSQL or Local SQLite.
4. **Video Temporal Smoothing (P2):**
   - Incorporate a recurrent LSTM or temporal transformer head across sampled video frame features to replace simple mean-aggregation.

---

## 4. Final Hackathon Readiness Verdict

- **Overall Architectural Quality:** **9.5 / 10** (Clean separation of concerns, complete Next.js UI, fully documented DRF API, ONNX export, Grad-CAM integration, 18 passing tests).
- **Data Science Integrity:** **8.5 / 10** (Strict identity grouping, zero leakage, calibrated threshold, honest CI bounds).
- **Production Out-of-Distribution Robustness:** **5.0 / 10** (Susceptible to natural camera domain shift due to procedural training data).
- **Recommended Hackathon Presentation Pitch:**
  *Emphasize the production-ready full-stack architecture, real-time ONNX inference, mathematical explainability (Grad-CAM), and rigorous identity-isolated benchmarking. Be scientifically transparent that the current model was evaluated on a procedural synthetic benchmark, and present FaceForensics++ fine-tuning as your immediate post-hackathon roadmap.*

