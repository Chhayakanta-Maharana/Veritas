/**
 * Typed API Client for Veritas Sentinel Forensics API
 */

import {
  AnalysisResult,
  AnalysisSummary,
  DashboardStats,
  HealthStatus,
  ModelInfo,
} from '@/types/forensics';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      let errorMsg = `API Error: ${res.status} ${res.statusText}`;
      try {
        const errorJson = await res.json();
        errorMsg = errorJson.detail || errorJson.error || errorJson.message || JSON.stringify(errorJson);
      } catch {
        // Fallback to status text
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health/');
  }

  async getModelInfo(): Promise<ModelInfo> {
    return this.request<ModelInfo>('/model/info/');
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats/');
  }

  async analyzeImage(file: File): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${this.baseUrl}/analyze/image/`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.image?.[0] || 'Image analysis failed.');
    }

    return res.json();
  }

  async analyzeVideo(file: File): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('video', file);

    const res = await fetch(`${this.baseUrl}/analyze/video/`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.video?.[0] || 'Video analysis failed.');
    }

    return res.json();
  }

  async analyzeFraud(file: File, fraudCategory: string = 'identity_impersonation'): Promise<{
    id: string;
    case_id: string;
    media_type: string;
    fraud_category: string;
    prediction: string;
    fraud_risk_score: number;
    threat_level: string;
    confidence: number;
    impersonation_probability: number;
    document_tampering_score: number;
    liveness_score: number;
    metadata_status: string;
    metadata_details: string[];
    ela_visualization?: string;
    explanation_image?: string;
    forensic_checks: Array<{
      name: string;
      passed: boolean;
      score: string;
      detail: string;
    }>;
    recommended_action: string;
    processing_duration_ms: number;
    timestamp: number;
  }> {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('fraud_category', fraudCategory);

    const res = await fetch(`${this.baseUrl}/analyze/fraud/`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.media?.[0] || 'Fraud forensic analysis failed.');
    }

    return res.json();
  }

  async getAnalyses(params?: { media_type?: string; prediction?: string; page?: number }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: AnalysisSummary[];
  }> {
    const query = new URLSearchParams();
    if (params?.media_type) query.append('media_type', params.media_type);
    if (params?.prediction) query.append('prediction', params.prediction);
    if (params?.page) query.append('page', params.page.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/analyses/${qs}`);
  }

  async getAnalysisDetail(id: string): Promise<AnalysisResult> {
    return this.request<AnalysisResult>(`/analyses/${id}/`);
  }

  async deleteAnalysis(id: string): Promise<void> {
    const url = `${this.baseUrl}/analyses/${id}/`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('Failed to delete analysis record.');
    }
  }

  getReportDownloadUrl(id: string): string {
    return `${this.baseUrl}/reports/${id}/`;
  }

  async adminLogin(username: string, password: string): Promise<{
    status: string;
    token: string;
    user: {
      username: string;
      email: string;
      is_staff: boolean;
      is_superuser: boolean;
      role: string;
    };
  }> {
    const res = await fetch(`${this.baseUrl}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication failed.');
    }

    return res.json();
  }

  async getAdminSystemStats(): Promise<{
    gpu: {
      available: boolean;
      name: string;
      device_count: number;
      total_vram_gb: number;
      allocated_vram_mb: number;
    };
    database: {
      engine: string;
      total_analyses: number;
      image_analyses: number;
      video_analyses: number;
      fake_flagged: number;
      real_flagged: number;
      uncertain_flagged: number;
      artifacts_count: number;
      users_count: number;
    };
    runtime: {
      platform: string;
      python_version: string;
      torch_version: string;
      active_model: string;
      architecture: string;
      decision_threshold: number;
      device: string;
    };
  }> {
    return this.request('/admin/system-stats/');
  }

  async setAdminThreshold(threshold: number): Promise<{
    status: string;
    message: string;
    decision_threshold: number;
  }> {
    const res = await fetch(`${this.baseUrl}/admin/set-threshold/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update threshold.');
    }

    return res.json();
  }

  async userLogin(username: string, password: string): Promise<{
    status: string;
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
      full_name: string;
      is_staff: boolean;
      is_superuser: boolean;
      role: string;
    };
  }> {
    const res = await fetch(`${this.baseUrl}/auth/user-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'User authentication failed.');
    }

    return res.json();
  }

  async getAdminUsers(): Promise<Array<{
    id: number;
    username: string;
    email: string;
    full_name: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    role: string;
    date_joined: string;
    last_login: string | null;
  }>> {
    return this.request('/admin/users/');
  }

  async createAdminUser(userData: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role: string;
    is_active: boolean;
  }): Promise<any> {
    const res = await fetch(`${this.baseUrl}/admin/users/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to provision operator.');
    }

    return res.json();
  }

  async toggleUserStatus(userId: number): Promise<{
    status: string;
    message: string;
    is_active: boolean;
  }> {
    const res = await fetch(`${this.baseUrl}/admin/users/${userId}/toggle-status/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to toggle operator status.');
    }

    return res.json();
  }

  async deleteUser(userId: number): Promise<{
    status: string;
    message: string;
  }> {
    const res = await fetch(`${this.baseUrl}/admin/users/${userId}/delete/`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete operator.');
    }

    return res.json();
  }
}

export const api = new ApiClient();
