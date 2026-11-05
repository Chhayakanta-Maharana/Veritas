'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileSearch,
  Download,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AnalysisResult } from '@/types/forensics';
import Dropzone from '@/components/Dropzone';
import StatusBadge from '@/components/StatusBadge';
import GradCAMViewer from '@/components/GradCAMViewer';

export default function ImageAnalysisPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const unified = localStorage.getItem('sentinel_session');
    if (unified) { try { setCurrentUser(JSON.parse(unified)); return; } catch {} }
    const userSession = localStorage.getItem('sentinel_user_session');
    const adminSession = localStorage.getItem('sentinel_admin_session');
    if (userSession) {
      try {
        setCurrentUser(JSON.parse(userSession));
      } catch {}
    } else if (adminSession) {
      try {
        const parsed = JSON.parse(adminSession);
        setCurrentUser(parsed.user);
      } catch {}
    }
  }, []);

  const handleFileSelected = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.analyzeImage(file);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Image forensic inspection failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = async (sampleUrl: string, sampleName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      const file = new File([blob], sampleName, { type: 'image/png' });
      const data = await api.analyzeImage(file);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Sample benchmark test failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 relative overflow-hidden">
      {/* Background Veritas Sentinel Mist */}
      <div className="absolute top-10 right-1/4 w-[500px] h-[350px] bg-red-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Header */}
      <div className="border-b border-slate-800 pb-5 relative z-10">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded border border-red-500/30 bg-red-950/40 text-red-300 text-[11px] font-mono mb-2">
          <span>STATIC SPATIAL & FREQUENCY FORENSICS</span>
        </div>
        <h1 className="text-2xl font-bold font-mono text-white uppercase flex items-center gap-2">
          <FileSearch className="w-6 h-6 text-cyan-400" />
          <span>Facial Image Forensics Terminal</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Upload suspect facial photographs to execute boundary artifact analysis, face cropping, and Grad-CAM neural explainability.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-1 space-y-4">
          {!currentUser ? (
            <div className="border border-slate-800/50 rounded-xl p-6 bg-[#090d18]/90 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-sm shadow-red-950/40">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Clearance Required</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Only authorized analysts and administrators can upload media and execute neural forensic audits.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/login?redirect=/analyze/image"
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-950/60"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Sign In with Assigned Credentials</span>
                </Link>
                <Link
                  href="/admin/login"
                  className="py-2 px-3 rounded-xl border border-slate-800/60 bg-[#0c1222] hover:bg-[#0f172a] hover:border-emerald-600/50 text-slate-300 text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Admin Clearance</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="border border-slate-800/40 rounded-xl p-5 bg-[#090d18]/80 space-y-4">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
                <span className="text-slate-400 font-mono text-[10px]">OPERATOR CLEARANCE:</span>
                <span className="text-cyan-400 font-bold font-mono text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {currentUser.full_name || currentUser.username}
                </span>
              </div>
              <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Media Ingestion Portal
              </h2>
              {/* Verified Benchmark Quick Test */}
              <div className="p-3 rounded-lg border border-slate-800 bg-[#0c1222]/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    VERIFIED BENCHMARKS
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400 font-bold">1-CLICK TEST</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => loadSample('/samples/real_face_sample.png', 'real_face_benchmark.png')}
                    disabled={loading}
                    className="py-1.5 px-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real Face (Demo)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSample('/samples/fake_face_sample.png', 'fake_face_benchmark.png')}
                    disabled={loading}
                    className="py-1.5 px-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Deepfake (Demo)</span>
                  </button>
                </div>
              </div>

              <Dropzone
                mediaType="image"
                acceptedFormats=".jpg,.jpeg,.png,.webp"
                onFileSelected={handleFileSelected}
                isLoading={loading}
                maxSizeMB={50}
              />
            </div>
          )}

          {/* Operational Parameters */}
          <div className="border border-slate-800/40 rounded-xl p-4 bg-[#0c1222]/60 text-xs font-mono space-y-2 text-slate-400">
            <div className="text-cyan-400 font-bold uppercase text-[10px] tracking-wider mb-2">Forensic Protocols</div>
            <div className="flex justify-between">
              <span>Classifier:</span>
              <span className="text-cyan-400">EfficientNet-B0</span>
            </div>
            <div className="flex justify-between">
              <span>Face Detector:</span>
              <span className="text-sentinel-200">OpenCV Cascade (20% margin)</span>
            </div>
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span className="text-sentinel-200">224 x 224 Normalized</span>
            </div>
            <div className="flex justify-between">
              <span>Decision Threshold:</span>
              <span className="text-sentinel-200">{result?.threshold ?? 0.50}</span>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2">
          {error && (
            <div className="p-4 rounded-xl border border-crimson-800/80 bg-crimson-950/40 text-crimson-400 font-mono text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <b>AUDIT REJECTED:</b> {error}
              </div>
            </div>
          )}

          {loading && (
            <div className="border border-sentinel-800 rounded-xl p-12 bg-sentinel-900/50 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <div className="font-mono text-sm text-cyan-400 font-bold tracking-wider">
                PROCESSING FORENSIC NEURAL INFERENCE...
              </div>
              <p className="text-xs font-mono text-sentinel-400 max-w-sm">
                Extracting facial landmarks, computing 2D spatial gradients, and performing Grad-CAM backward propagation on RTX A2000...
              </p>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="border border-dashed border-sentinel-800 rounded-xl p-12 bg-sentinel-900/20 text-center text-xs font-mono text-sentinel-500">
              Awaiting suspect image upload. Results, confidence probabilities, and Grad-CAM activation maps will materialize here.
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Face Detection Advisory Notice */}
              {result.face_detection?.face_detection_status === 'fallback_center_crop' && (
                <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/40 text-amber-200 font-mono text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>ADVISORY: NO PRIMARY HUMAN FACE DETECTED (CENTER-CROP USED)</span>
                  </div>
                  <p className="text-[11px] text-amber-300/90 leading-relaxed">
                    Veritas Sentinel is an enterprise facial biometrics & deepfake forensics model. The system analyzed a center crop because no frontal or profile human face was detected.
                    Non-facial objects (e.g. computer mice, vehicles, scenery) yield out-of-domain feature scores. For authentic facial verification, please ensure the photograph contains a clear human face or test using the verified benchmarks on the left.
                  </p>
                </div>
              )}

              {/* Primary Decision Banner */}
              <div className={`p-6 rounded-xl border ${
                result.prediction === 'FAKE'
                  ? 'border-crimson-700 bg-crimson-950/30 shadow-glow-crimson'
                  : 'border-emerald-700 bg-emerald-950/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono text-sentinel-400 uppercase tracking-widest">
                      PRIMARY FORENSIC VERDICT
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <StatusBadge prediction={result.prediction} score={result.score} className="text-sm px-4 py-1.5" />
                      <span className="text-xs font-mono text-sentinel-300">
                        Confidence: {(result.confidence * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={api.getReportDownloadUrl(result.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sentinel-800 hover:bg-sentinel-700 border border-sentinel-700 text-xs font-mono text-sentinel-100 transition-all"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>PDF REPORT</span>
                    </a>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="mt-5 space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-cyan-400">Authentic (0.0)</span>
                    <span className="text-sentinel-400">Decision Threshold: {result.threshold}</span>
                    <span className="text-crimson-400">Synthetic Deepfake (1.0)</span>
                  </div>
                  <div className="h-3 w-full bg-sentinel-950 rounded-full overflow-hidden border border-sentinel-800 relative">
                    <div
                      className={`h-full transition-all duration-700 ${
                        result.prediction === 'FAKE'
                          ? 'bg-gradient-to-r from-amber-500 to-crimson-600'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, result.score * 100))}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-sentinel-50 shadow-sm"
                      style={{ left: `${result.threshold * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Explainable AI: Grad-CAM */}
              {result.explanation_image && (
                <GradCAMViewer
                  overlayImage={result.explanation_image}
                  prediction={result.prediction}
                  score={result.score}
                />
              )}

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg border border-sentinel-800 bg-sentinel-900/50">
                  <span className="text-sentinel-400 block text-[10px]">INFERENCE LATENCY</span>
                  <span className="text-cyan-400 font-bold">{result.processing_duration} ms</span>
                </div>

                <div className="p-3 rounded-lg border border-sentinel-800 bg-sentinel-900/50">
                  <span className="text-sentinel-400 block text-[10px]">FACE ISOLATION</span>
                  <span className="text-sentinel-200 font-bold uppercase truncate block">
                    {result.face_detection?.face_detection_status || 'DETECTED'}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-sentinel-800 bg-sentinel-900/50">
                  <span className="text-sentinel-400 block text-[10px]">MODEL VERSION</span>
                  <span className="text-sentinel-200 font-bold">{result.model_version}</span>
                </div>

                <div className="p-3 rounded-lg border border-sentinel-800 bg-sentinel-900/50">
                  <span className="text-sentinel-400 block text-[10px]">BOUNDING BOX</span>
                  <span className="text-sentinel-200 font-bold truncate block">
                    {result.face_detection?.bounding_box ? `[${result.face_detection.bounding_box.join(', ')}]` : '[0, 0, 256, 256]'}
                  </span>
                </div>
              </div>

              {/* Limitations Notice */}
              {result.limitations && result.limitations.length > 0 && (
                <div className="p-4 rounded-xl border border-sentinel-800 bg-sentinel-900/30 text-xs font-mono space-y-1 text-sentinel-400">
                  <div className="text-sentinel-300 font-bold uppercase text-[10px] tracking-wider">Forensic Limitations</div>
                  {result.limitations.map((lim, idx) => (
                    <div key={idx} className="text-[11px]">• {lim}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
