'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ArrowLeft,
  Download,
  Trash2,
  Clock,
  Layers,
  FileSearch,
  Video,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AnalysisResult } from '@/types/forensics';
import StatusBadge from '@/components/StatusBadge';
import GradCAMViewer from '@/components/GradCAMViewer';

export default function AnalysisDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.getAnalysisDetail(params.id)
      .then(setAnalysis)
      .catch((err) => setError(err.message || 'Failed to retrieve analysis dossier.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this forensic analysis dossier?')) return;
    setDeleting(true);
    try {
      await api.deleteAnalysis(params.id);
      router.push('/history');
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center font-mono">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
        <span className="text-xs text-sentinel-400">RETRIEVING FORENSIC DOSSIER FROM NEON DATABASE...</span>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 font-mono">
        <div className="p-6 rounded-xl border border-crimson-800 bg-crimson-950/40 text-crimson-400 text-xs">
          <b>DOSSIER NOT FOUND:</b> {error || 'Record does not exist.'}
        </div>
        <Link href="/history" className="inline-flex items-center gap-2 mt-4 text-xs text-cyan-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Audit Archive
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-sentinel-800 pb-4">
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-sentinel-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO ARCHIVE</span>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href={api.getReportDownloadUrl(analysis.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-sentinel-950 text-xs font-mono font-bold transition-all shadow-glow-cyan"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT PDF REPORT</span>
          </a>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-crimson-950/80 hover:bg-crimson-900 border border-crimson-700/60 text-crimson-400 text-xs font-mono transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'DELETING...' : 'PURGE'}</span>
          </button>
        </div>
      </div>

      {/* Primary Dossier Header */}
      <div className={`p-6 rounded-xl border ${
        analysis.prediction === 'FAKE'
          ? 'border-crimson-700 bg-crimson-950/30'
          : 'border-emerald-700 bg-emerald-950/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono text-sentinel-400 uppercase tracking-widest">
              DOSSIER ID: {analysis.id}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge prediction={analysis.prediction} score={analysis.score} className="text-base px-4 py-1.5" />
              <span className="text-xs font-mono text-sentinel-300">
                Confidence: {(analysis.confidence * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="text-right font-mono text-xs text-sentinel-400">
            <div>Timestamp: {new Date(analysis.created_at).toLocaleString()}</div>
            <div className="text-cyan-400 mt-0.5">Media: {analysis.media_type.toUpperCase()}</div>
          </div>
        </div>

        {/* Score Visual Bar */}
        <div className="mt-6 space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-emerald-400">Authentic (0.0)</span>
            <span className="text-sentinel-400">Decision Threshold: {analysis.threshold}</span>
            <span className="text-crimson-400">Synthetic Deepfake (1.0)</span>
          </div>
          <div className="h-3 w-full bg-sentinel-950 rounded-full overflow-hidden border border-sentinel-800 relative">
            <div
              className={`h-full transition-all duration-700 ${
                analysis.prediction === 'FAKE'
                  ? 'bg-gradient-to-r from-amber-500 to-crimson-600'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, analysis.score * 100))}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-sentinel-50 shadow-sm"
              style={{ left: `${analysis.threshold * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grad-CAM Heatmap Section */}
      {analysis.explanation_image && (
        <GradCAMViewer
          overlayImage={analysis.explanation_image}
          prediction={analysis.prediction}
          score={analysis.score}
        />
      )}

      {/* Video Statistics Section */}
      {analysis.frame_statistics && (
        <div className="border border-sentinel-800 rounded-xl p-5 bg-sentinel-900/40 space-y-3 font-mono">
          <h3 className="text-xs font-bold text-sentinel-200 uppercase tracking-wider">Video Frame Telemetry</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-sentinel-950 rounded border border-sentinel-800">
              <span className="text-sentinel-500 block text-[10px]">TOTAL FRAMES</span>
              <span className="font-bold text-sentinel-200">{analysis.frame_statistics.total_video_frames}</span>
            </div>
            <div className="p-3 bg-sentinel-950 rounded border border-sentinel-800">
              <span className="text-sentinel-500 block text-[10px]">SAMPLED FRAMES</span>
              <span className="font-bold text-cyan-400">{analysis.frame_statistics.processed_sample_frames}</span>
            </div>
            <div className="p-3 bg-sentinel-950 rounded border border-sentinel-800">
              <span className="text-sentinel-500 block text-[10px]">FAKE FRAMES</span>
              <span className="font-bold text-crimson-400">{analysis.frame_statistics.fake_frame_count}</span>
            </div>
            <div className="p-3 bg-sentinel-950 rounded border border-sentinel-800">
              <span className="text-sentinel-500 block text-[10px]">DURATION</span>
              <span className="font-bold text-sentinel-200">{analysis.frame_statistics.video_duration_sec}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Technical Metadata */}
      <div className="border border-sentinel-800 rounded-xl p-5 bg-sentinel-900/30 text-xs font-mono space-y-3">
        <h3 className="text-xs font-bold text-sentinel-200 uppercase tracking-wider">Forensic Audit Log & Artifacts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sentinel-400">
          <div>
            <div className="text-sentinel-500 text-[10px]">ORIGINAL FILENAME</div>
            <div className="text-sentinel-200">{analysis.original_filename || 'Direct Upload'}</div>
          </div>
          <div>
            <div className="text-sentinel-500 text-[10px]">MODEL VERSION</div>
            <div className="text-sentinel-200">{analysis.model_version}</div>
          </div>
          <div>
            <div className="text-sentinel-500 text-[10px]">PROCESSING DURATION</div>
            <div className="text-cyan-400">{analysis.processing_duration} ms</div>
          </div>
          <div>
            <div className="text-sentinel-500 text-[10px]">STATUS</div>
            <div className="text-emerald-400 uppercase">{analysis.processing_status}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

