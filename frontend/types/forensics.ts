export type MediaType = 'image' | 'video';
export type PredictionLabel = 'REAL' | 'FAKE' | 'UNCERTAIN';
export type ProcessingStatus = 'pending' | 'completed' | 'failed';

export interface FaceDetectionMeta {
  face_detection_status: string;
  bounding_box: number[];
  original_shape: number[];
  crop_shape: number[];
  target_size: number[];
  margin_ratio: number;
}

export interface FrameStatistic {
  total_video_frames: number;
  processed_sample_frames: number;
  fake_frame_count: number;
  real_frame_count: number;
  video_duration_sec: number;
}

export interface FramePrediction {
  frame_index: number;
  timestamp_sec: number;
  score: number;
  prediction: PredictionLabel;
  face_detection_status: string;
}

export interface SuspiciousFrame {
  frame_index: number;
  timestamp_sec: number;
  score: number;
  thumbnail?: string;
}

export interface AnalysisArtifact {
  id: string;
  artifact_type: string;
  file_path: string;
  checksum: string;
  created_at: string;
}

export interface AnalysisResult {
  id: string;
  media_type: MediaType;
  original_filename: string;
  prediction: PredictionLabel;
  score: number;
  confidence: number;
  threshold: number;
  model_version: string;
  processing_status: ProcessingStatus;
  processing_duration: number;
  frame_statistics?: FrameStatistic;
  face_detection?: FaceDetectionMeta;
  limitations: string[];
  error_category?: string;
  artifacts?: AnalysisArtifact[];
  explanation_available?: boolean;
  explanation_image?: string;
  suspicious_frames?: SuspiciousFrame[];
  frame_predictions?: FramePrediction[];
  created_at: string;
}

export interface AnalysisSummary {
  id: string;
  media_type: MediaType;
  original_filename: string;
  prediction: PredictionLabel;
  score: number;
  confidence: number;
  threshold: number;
  processing_status: ProcessingStatus;
  processing_duration: number;
  created_at: string;
}

export interface ModelInfo {
  model_name: string;
  model_version: string;
  architecture: string;
  input_shape: number[];
  decision_threshold: number;
  labels: Record<string, string>;
  evaluation_summary: {
    test_accuracy?: number;
    test_roc_auc?: number;
    test_f1?: number;
    inference_latency_ms?: number;
  };
  onnx_available: boolean;
  device: string;
}

export interface DashboardStats {
  total_analyses: number;
  real_count: number;
  fake_count: number;
  uncertain_count: number;
  average_latency_ms: number;
  active_model_version: string;
  recent_analyses: AnalysisSummary[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  system: string;
  torch_version: string;
  cuda_available: boolean;
  gpu_device: string;
  model_version: string;
  decision_threshold: number;
  database: {
    connected: boolean;
    engine: string;
  };
}

