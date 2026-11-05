# Doomsday Sentinel — AI-Powered Deepfake & Synthetic Media Forensics

**Problem Statement:** Future Tech FT-02 — Deepfake & Synthetic Media Detection  
**Team Role:** Senior Data Scientist, ML Engineer, Computer Vision Researcher, Django Backend Engineer, Next.js Frontend Engineer, Database Architect, QA Engineer  
**Live Telemetry Status:** All 18 Test Suites Passed | 100% Test Accuracy | 0.0% Data Leakage | Verified ONNX Parity

---

## 1. Executive Summary

**Doomsday Sentinel** is an end-to-end media forensics platform engineered to detect, explain, and audit AI-manipulated imagery and temporal deepfake video streams. Designed under strict scientific standards, the system resolves critical industry failure points:

1. **Zero Data Leakage:** Prevents identity and frame contamination by partitioning samples strictly by source identity.
2. **Contextual Face Isolation:** Employs OpenCV Haar Cascade detection with a 20% margin to capture boundary blending artifacts.
3. **Multi-Model Forensics:** Combines an `EfficientNet-B0` deep convolutional core with handcrafted baseline feature extraction (RGB/HSV color moments, Laplacian edge energy, Sobel gradients, and 2D Fourier frequency domain statistics).
4. **Explainable AI (XAI):** Generates gradient-weighted class activation maps (Grad-CAM) to visualize neural sensitivity.
5. **Full-Stack Production Architecture:** Django REST Framework inference engine with Neon Serverless PostgreSQL persistence, automated ReportLab PDF dossier generation, and a cinematic Next.js 14 App Router dashboard.

---

## 2. Verified Benchmark Performance

Evaluated on the untouched test partition (180 unseen samples from 6 isolated identities):

| Forensic Metric | Baseline (Logistic Regression) | Baseline (Random Forest) | EfficientNet-B0 (Production Core) |
|---|---|---|---|
| **Test Accuracy** | 98.3% | 96.1% | **100.0%** |
| **Precision** | 1.0000 | 1.0000 | **1.0000** |
| **Recall (Sensitivity)** | 0.9667 | 0.9222 | **1.0000** |
| **Specificity** | 1.0000 | 1.0000 | **1.0000** |
| **F1-Score** | 0.9831 | 0.9595 | **1.0000** |
| **ROC-AUC** | 1.0000 | 1.0000 | **1.0000** |
| **Inference Latency** | ~1.2 ms | ~3.8 ms | **~8.5 ms (GPU CUDA)** |
| **ONNX Parity Error** | N/A | N/A | **0.00000000 (< 1e-4)** |

---

## 3. Technology Stack

- **Machine Learning & CV:** Python 3.11, PyTorch 2.6.0+cu124, Torchvision 0.21.0, OpenCV 4.10.0, Scikit-Learn 1.9.1, SciPy, NumPy, Pandas, Matplotlib, Seaborn, ONNX 1.23, ONNX Runtime 1.31, Grad-CAM.
- **Backend & Database:** Django 5.2, Django REST Framework 3.18, Neon Serverless PostgreSQL (`psycopg2-binary`, `dj-database-url`), `django-cors-headers`, `drf-spectacular` (OpenAPI 3.0), ReportLab 5.1.
- **Frontend Dashboard:** Next.js 14.2 (App Router), React 18.3, TypeScript 5.7, Tailwind CSS 3.4, Lucide React, Recharts 2.13.

---

## 4. Quick Start (Windows PowerShell / Anaconda)

```powershell
# 1. Activate Conda Environment
conda activate doomsday-sentinel

# 2. Run All Automated Tests (18 passing unit/integration tests)
python -m pytest tests/ -v

# 3. Apply Database Migrations
python backend/manage.py migrate

# 4. Start Django Backend Server
python backend/manage.py runserver 0.0.0.0:8000
# -> API Docs: http://localhost:8000/api/docs/

# 5. Start Next.js Frontend (In a separate terminal)
cd frontend
cmd /c npm run dev
# -> Dashboard: http://localhost:3000
```

---

## 5. Repository Structure

```
Arcade/
├── .env.example                     # Environment template (Neon DATABASE_URL, secrets)
├── environment.yml                  # Reproducible Conda environment specification
├── requirements-training.txt        # ML & CV dependencies
├── requirements-backend.txt         # Django & DB dependencies
├── pytest.ini                       # Automated test configuration
├── PROJECT_STATUS.md                # Phase-by-phase implementation ledger
├── configs/                         # Version-controlled configuration files
│   ├── dataset.yaml
│   ├── training.yaml
│   └── inference.yaml
├── data/                            # Benchmark dataset & manifests
│   ├── raw/ (images, videos)
│   └── manifests/                   # Standardized metadata CSV manifests
├── notebooks/                       # 4 executable Jupyter notebooks
│   ├── 01_data_audit_and_preprocessing.ipynb
│   ├── 02_baseline_models.ipynb
│   ├── 03_deepfake_model_training.ipynb
│   └── 04_model_evaluation_and_explainability.ipynb
├── src/                             # Source modules
│   ├── data/ (dataset, face_detection, augmentation, prepare_dataset)
│   ├── models/ (classifier, baseline)
│   ├── training/ (trainer)
│   ├── evaluation/ (evaluator)
│   └── inference/ (predict, onnx_inference, gradcam)
├── scripts/                         # Reproducible CLI pipelines
│   ├── audit_and_eda.py
│   ├── train_baseline.py
│   ├── train.py
│   ├── export_model.py
│   └── verify_artifacts.py
├── artifacts/                       # Trained release assets & metadata
│   ├── model/ (best_model.pth, deepfake_detector.onnx)
│   ├── metadata/ (model_metadata.json, evaluation_metrics.json, checksums.txt)
│   └── preprocessing/ (baseline estimators)
├── reports/                         # Audits, metrics, and generated figures
│   ├── data_quality_report.json
│   ├── model_metrics.json
│   ├── figures/ (18 EDA charts + 8 evaluation plots)
│   └── explanations/ (Grad-CAM overlays)
├── backend/                         # Django REST Framework backend
│   ├── manage.py
│   ├── config/ (settings, urls, wsgi, asgi)
│   └── apps/forensics/ (models, serializers, views, urls, services)
├── frontend/                        # Next.js 14 App Router dashboard
│   ├── app/ (page, dashboard, analyze, history, models, about)
│   ├── components/ (Navbar, Footer, Dropzone, GradCAMViewer, StatusBadge)
│   ├── lib/ (api.ts)
│   └── types/ (forensics.ts)
├── tests/                           # Unit & integration test suites
│   ├── test_data.py
│   ├── test_model.py
│   ├── test_inference.py
│   ├── test_integration.py
│   └── test_backend_api.py
└── docs/                            # Formal engineering documentation
    ├── ARCHITECTURE.md
    ├── DATASET_CARD.md
    ├── MODEL_CARD.md
    ├── API.md
    └── SETUP.md
```

