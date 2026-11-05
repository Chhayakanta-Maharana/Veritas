# Setup & Execution Guide — Doomsday Sentinel

## 1. System Requirements & Verification
- **Operating System:** Windows 11 Pro 64-bit (or Windows 10)
- **Memory:** 16 GB+ RAM (64 GB verified on dev machine)
- **Compute:** NVIDIA CUDA GPU recommended (NVIDIA RTX A2000 12GB verified) or CPU fallback
- **Storage:** ~2 GB for model weights, dataset manifests, and virtual environment

---

## 2. Environment Setup (Anaconda / Windows PowerShell)

### Step 2.1 — Clone or Navigate to Project
```powershell
cd c:\Arcade
```

### Step 2.2 — Activate Verified Conda Environment
```powershell
conda activate doomsday-sentinel
```

*(To recreate from environment definition:)*
```powershell
conda env create -f environment.yml
conda activate doomsday-sentinel
```

### Step 2.3 — Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```powershell
Copy-Item .env.example .env
```
To connect to Neon PostgreSQL, set your connection string in `.env`:
```ini
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```
*(If `DATABASE_URL` is omitted, the backend automatically defaults to local SQLite for seamless offline testing).*

---

## 3. Pipeline Execution Commands

### 3.1 Dataset Synthesis & Manifest Generation
```powershell
python -m src.data.prepare_dataset
```

### 3.2 Data Quality Audit & 18 EDA Visualizations
```powershell
python scripts/audit_and_eda.py
```

### 3.3 Conventional ML Baseline Training
```powershell
python scripts/train_baseline.py
```

### 3.4 Deep Learning Model Training (EfficientNet-B0)
```powershell
python scripts/train.py --epochs 6 --batch-size 32
```

### 3.5 Model Export & Checksum Generation
```powershell
python scripts/export_model.py
```

### 3.6 ONNX Parity Verification
```powershell
python scripts/verify_artifacts.py
```

### 3.7 Run Full Automated Test Suite (18 Tests)
```powershell
python -m pytest tests/ -v
```

---

## 4. Starting the Application

### 4.1 Apply Django Migrations
```powershell
python backend/manage.py migrate
```

### 4.2 Start Django Backend Server
```powershell
python backend/manage.py runserver 0.0.0.0:8000
```
- API Base: `http://localhost:8000/api/`
- Swagger Documentation: `http://localhost:8000/api/docs/`

### 4.3 Start Next.js Frontend Server (In a new terminal)
```powershell
cd frontend
cmd /c npm run dev
```
- Dashboard Interface: `http://localhost:3000`

