# API Documentation — Doomsday Sentinel Forensics REST API

**Base URL:** `http://localhost:8000/api`  
**OpenAPI Specification:** `http://localhost:8000/api/docs/` (Swagger UI)

---

## 1. Health & Model Specifications

### `GET /api/health/`
Returns the operational health of the backend, PyTorch engine, GPU acceleration, and Neon PostgreSQL database.

**Response `200 OK`:**
```json
{
  "status": "healthy",
  "system": "Doomsday Sentinel Forensics API",
  "torch_version": "2.6.0+cu124",
  "cuda_available": true,
  "gpu_device": "NVIDIA RTX A2000 12GB",
  "model_version": "doomsday-sentinel-v1.0",
  "decision_threshold": 0.1,
  "database": {
    "connected": true,
    "engine": "django.db.backends.sqlite3"
  }
}
```

### `GET /api/model/info/`
Returns active neural model architecture, input tensor expectations, and verified benchmark metrics.

---

## 2. Media Forensics Analysis

### `POST /api/analyze/image/`
Performs end-to-end facial deepfake analysis on an uploaded image.

**Request:** `multipart/form-data`
- `image` (binary): Image file (JPG, PNG, WEBP), max 50 MB.

**Response `201 Created`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "media_type": "image",
  "original_filename": "suspect.png",
  "prediction": "FAKE",
  "score": 0.9981,
  "confidence": 0.9981,
  "threshold": 0.1,
  "model_version": "doomsday-sentinel-v1.0",
  "processing_status": "completed",
  "processing_duration": 8.74,
  "face_detection": {
    "face_detection_status": "face_detected",
    "bounding_box": [35, 20, 220, 235],
    "margin_ratio": 0.2
  },
  "explanation_available": true,
  "explanation_image": "data:image/jpeg;base64,...",
  "limitations": [
    "Forensic sensitivity maps indicate anomalous regions, not definitive legal tampering proof."
  ]
}
```

### `POST /api/analyze/video/`
Extracts frames at 2 FPS, executes neural inference, and aggregates temporal tail scores.

**Request:** `multipart/form-data`
- `video` (binary): Video file (MP4, AVI, MOV), max 50 MB.

---

## 3. History, Telemetry & Reporting

### `GET /api/analyses/`
Returns paginated audit records. Supports optional query filters:
- `media_type`: `image` or `video`
- `prediction`: `REAL` or `FAKE`
- `page`: integer page number

### `GET /api/analyses/{id}/`
Retrieves a complete analysis dossier, including stored Grad-CAM base64 data.

### `DELETE /api/analyses/{id}/`
Deletes analysis record and purges associated media artifacts.

### `GET /api/dashboard/stats/`
Returns summary telemetry: total analyses, real count, fake count, average latency, and recent audits.

### `GET /api/reports/{id}/`
Downloads a formal forensic PDF inspection report compiled via ReportLab.

