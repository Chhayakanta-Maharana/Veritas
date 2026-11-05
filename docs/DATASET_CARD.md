# Dataset Card — Doomsday Sentinel Forensic Benchmark

## 1. Dataset Summary
The **Doomsday Sentinel Forensic Benchmark** is a multi-source, leakage-resistant dataset of facial media structured for evaluating deepfake and synthetic image detection algorithms under Future Tech FT-02.

## 2. Dataset Structure
- **Total Registered Samples:** 1,200 media files (plus synthesized multi-frame video sequences).
- **Class Balance:** Perfectly balanced 50/50:
  - `0 = REAL` (Authentic): 600 samples
  - `1 = FAKE` (Manipulated): 600 samples
- **Source Benchmarks:**
  - `FaceForensics_Benchmark`: 420 samples
  - `CelebDF_Subset`: 390 samples
  - `SyntheticDiffusion_v2`: 390 samples
- **Manipulation Archetypes:**
  - `authentic`: 600 samples (Natural camera noise, biological eye glints, consistent skin subsurface scattering)
  - `faceswap`: 210 samples (Donor identity facial replacement, boundary blending gradients, color shifts)
  - `gan_stylegan`: 195 samples (High-frequency checkerboard spectral artifacts in 2D FFT, pupil boundary irregularities)
  - `diffusion_inpainting`: 195 samples (Soft facial edge transitions, localized micro-texture blur)

## 3. Data Partitions & Anti-Leakage Protocol
Samples are split by unique `source_video_id` across 40 identities:
- **Train:** 840 samples (70%) — 28 source identities
- **Validation:** 180 samples (15%) — 6 source identities
- **Untouched Test:** 180 samples (15%) — 6 source identities

### Cross-Split Overlap Audit:
- Train ∩ Validation: **0** common identities
- Train ∩ Test: **0** common identities
- Validation ∩ Test: **0** common identities
- **Data Contamination:** **0.0%**

## 4. Metadata Manifest Specification
Stored at `data/manifests/dataset_manifest.csv`:
- `sample_id` (str): Unique alphanumeric identifier (e.g. `REAL_ID_000_00`)
- `file_path` (str): Relative storage location
- `media_type` (str): `image` or `video`
- `label` (int): `0` for REAL, `1` for FAKE
- `source_dataset` (str): Originating benchmark
- `source_video_id` (str): Identity group for zero-leakage partitioning
- `manipulation_type` (str): Specific tampering mechanism
- `split` (str): `train`, `val`, or `test`
- `face_detection_status` (str): `face_detected` or `fallback_center_crop`
- `preprocessing_status` (str): `ready`
- `failure_reason` (str): Diagnostic error log if unreadable
- `width`, `height`, `aspect_ratio`, `file_size_kb`, `laplacian_variance`, `mean_luminance`

