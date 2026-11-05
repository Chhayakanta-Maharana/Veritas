'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Video,
  Download,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Film,
  Eye,
  Lock,
  Key,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AnalysisResult } from '@/types/forensics';
import Dropzone from '@/components/Dropzone';
import StatusBadge from '@/components/StatusBadge';

export default function VideoAnalysisPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

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
    setVideoPreviewUrl(URL.createObjectURL(file));

    try {
      const data = await api.analyzeVideo(file);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Video forensic analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 relative overflow-hidden">
      {/* Background Cyberpunk Ambient Glows */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[350px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-[500px] h-[350px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="border-b border-slate-800 pb-5 relative z-10">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded border border-red-500/30 bg-red-950/40 text-red-400 text-[11px] font-mono mb-2">
          <span>TEMPORAL MULTI-FRAME FORENSICS</span>
        </div>
        <h1 className="text-2xl font-bold font-mono text-white uppercase flex items-center gap-2">
          <Video className="w-6 h-6 text-red-400" />
          <span>Temporal Video Forensics Terminal</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Sample frames at regular temporal intervals, isolate facial regions, compute frame-level anomaly vectors, and pool suspicious tail distributions.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-1 space-y-4">
          {!currentUser ? (
            <div className="border border-slate-800 rounded-xl p-6 bg-[#090e1a]/95 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Clearance Required</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Video temporal inference is restricted to approved forensic investigators and administrators.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/login?redirect=/analyze/video"
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-950/60"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Sign In with Assigned Credentials</span>
                </Link>
                <Link
                  href="/admin/login"
                  className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Admin Clearance</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl p-5 bg-[#090e1a]/95 space-y-4">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
                <span className="text-slate-400 font-mono text-[10px]">OPERATOR CLEARANCE:</span>
                <span className="text-cyan-400 font-bold font-mono text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {currentUser.full_name || currentUser.username}
                </span>
              </div>
              <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Video Media Portal
              </h2>
              <Dropzone
                mediaType="video"
                acceptedFormats=".mp4,.avi,.mov"
                onFileSelected={handleFileSelected}
                isLoading={loading}
                maxSizeMB={50}
              />
            </div>
          )}

          {videoPreviewUrl && (
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
              <div className="text-xs font-mono text-slate-300 font-bold mb-2">VIDEO PLAYBACK PREVIEW</div>
              <video src={videoPreviewUrl} controls className="w-full rounded-lg max-h-48 bg-black" />
            </div>
          )}

          {/* Operational Parameters */}
          <div className="border border-slate-800/40 rounded-xl p-4 bg-[#0c1222]/60 text-xs font-mono space-y-2 text-slate-400">
            <div className="text-sentinel-300 font-bold uppercase text-[10px] tracking-wider mb-2">Temporal Settings</div>
            <div className="flex justify-between">
              <span>Sampling Rate:</span>
              <span className="text-cyan-400">2.0 FPS</span>
            </div>
            <div className="flex justify-between">
              <span>Pooling Policy:</span>
              <span className="text-sentinel-200">Top-20% Suspicious Mean</span>
            </div>
            <div className="flex justify-between">
              <span>Max Sampled Frames:</span>
              <span className="text-sentinel-200">60 Frames</span>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2">
          {error && (
            <div className="p-4 rounded-xl border border-crimson-800/80 bg-crimson-950/40 text-crimson-400 font-mono text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <b>VIDEO AUDIT REJECTED:</b> {error}
              </div>
            </div>
          )}

          {loading && (
            <div className="border border-sentinel-800 rounded-xl p-12 bg-sentinel-900/50 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-crimson-400 border-t-transparent animate-spin" />
              <div className="font-mono text-sm text-crimson-400 font-bold tracking-wider">
                SAMPLING & ANALYZING TEMPORAL VIDEO FRAMES...
              </div>
              <p className="text-xs font-mono text-sentinel-400 max-w-sm">
                Decompressing video stream, detecting faces across sampled frames, and evaluating neural anomaly scores on GPU...
              </p>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="border border-dashed border-sentinel-800 rounded-xl p-12 bg-sentinel-900/20 text-center text-xs font-mono text-sentinel-500">
              Awaiting video media upload. Frame telemetry and aggregated forensic decisions will appear here.
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Verdict Banner */}
              <div className={`p-6 rounded-xl border ${
                result.prediction === 'FAKE'
                  ? 'border-crimson-700 bg-crimson-950/30 shadow-glow-crimson'
                  : 'border-emerald-700 bg-emerald-950/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono text-sentinel-400 uppercase tracking-widest">
                      AGGREGATED VIDEO FORENSIC VERDICT
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <StatusBadge prediction={result.prediction} score={result.score} className="text-sm px-4 py-1.5" />
                      <span className="text-xs font-mono text-sentinel-300">
                        Tail Risk Confidence: {(result.confidence * 100).toFixed(2)}%
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
                    <span className="text-crimson-400">Deepfake Manipulated (1.0)</span>
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

              {/* Video Frame Statistics */}
              {result.frame_statistics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg border border-sentinel-800 bg-sentinel-900/50">
                    <span className="text-sentinel-400 block text-[10px]">TOTAL FRAMES</span>
                    <span className="text-sentinel-200 font-bold">{result.frame_statistics.total_video_frames}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-sentinel-800 bg-sentinel-900/50">
                    <span className="text-sentinel-400 block text-[10px]">SAMPLED FRAMES</span>
                    <span className="text-cyan-400 font-bold">{result.frame_statistics.processed_sample_frames}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-sentinel-800 bg-sentinel-900/50">
                    <span className="text-sentinel-400 block text-[10px]">SUSPECT FRAMES</span>
                    <span className="text-crimson-400 font-bold">{result.frame_statistics.fake_frame_count}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-sentinel-800 bg-sentinel-900/50">
                    <span className="text-sentinel-400 block text-[10px]">DURATION</span>
                    <span className="text-sentinel-200 font-bold">{result.frame_statistics.video_duration_sec}s</span>
                  </div>
                </div>
              )}

              {/* Suspicious Frame Thumbnails */}
              {result.suspicious_frames && result.suspicious_frames.length > 0 && (
                <div className="border border-sentinel-800 rounded-xl p-5 bg-sentinel-900/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-crimson-400" />
                    <span className="text-xs font-mono font-bold text-sentinel-200 uppercase">
                      Suspicious Frame Heatmaps (High Anomaly Concentration)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {result.suspicious_frames.map((sf, idx) => (
                      <div key={idx} className="border border-sentinel-700 rounded-lg overflow-hidden bg-sentinel-950 p-1.5 flex flex-col items-center">
                        {sf.thumbnail ? (
                          <img src={sf.thumbnail} alt={`Frame ${sf.frame_index}`} className="w-full h-24 object-cover rounded" />
                        ) : (
                          <div className="w-full h-24 bg-sentinel-900 flex items-center justify-center text-[10px] text-sentinel-500">
                            No Thumbnail
                          </div>
                        )}
                        <div className="mt-1.5 text-[10px] font-mono text-sentinel-300 flex justify-between w-full px-1">
                          <span>{sf.timestamp_sec}s</span>
                          <span className="text-crimson-400 font-bold">{(sf.score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
