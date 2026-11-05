'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  UploadCloud,
  FileCheck2,
  FileSearch,
  Lock,
  Layers,
  ArrowRight,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import SentinelLogo from '@/components/SentinelLogo';

export default function FraudForensicsPage() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Form & Execution State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fraudMode, setFraudMode] = useState<'identity_impersonation' | 'kyc_forgery' | 'biometric_spoof'>('identity_impersonation');
  const [analyzing, setAnalyzing] = useState(false);
  const [activeVisualTab, setActiveVisualTab] = useState<'original' | 'ela' | 'gradcam'>('ela');
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unified = localStorage.getItem('sentinel_session');
    const user = localStorage.getItem('sentinel_user_session');
    const admin = localStorage.getItem('sentinel_admin_session');

    if (unified) {
      try {
        setSessionUser(JSON.parse(unified));
      } catch {}
    } else if (admin) {
      try {
        const parsed = JSON.parse(admin);
        setSessionUser({ ...parsed.user, role: 'admin' });
      } catch {}
    } else if (user) {
      try {
        setSessionUser(JSON.parse(user));
      } catch {}
    }
    setAuthChecked(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      loadMedia(selected);
    }
  };

  const loadMedia = (selected: File) => {
    setFile(selected);
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select or drop an image or document to inspect.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.analyzeFraud(file, fraudMode);
      setResult(data);
      if (data.ela_visualization) {
        setActiveVisualTab('ela');
      } else if (data.explanation_image) {
        setActiveVisualTab('gradcam');
      } else {
        setActiveVisualTab('original');
      }
    } catch (err: any) {
      setError(err.message || 'Fraud analysis failed. Check file dimensions and format.');
    } finally {
      setAnalyzing(false);
    }
  };

  const loadDemoSample = async (type: 'fake' | 'real') => {
    try {
      const imgPath = type === 'fake' 
        ? '/samples/fake_face_sample.png' 
        : '/samples/real_face_sample.png';
      
      const res = await fetch(imgPath);
      const blob = await res.blob();
      const demoFile = new File([blob], `demo_${type}_evidence.png`, { type: 'image/png' });
      loadMedia(demoFile);
    } catch (e) {
      setError('Failed to load demo sample file.');
    }
  };

  if (!authChecked) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-[#060813]">
        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // =========================================================================
  // Clearance Gate: If not authenticated
  // =========================================================================
  if (!sessionUser) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-20 bg-[#060813] text-slate-200 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="w-full max-w-lg relative z-10 space-y-6 text-center">
          <div className="inline-flex p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
            <Lock className="w-12 h-12 text-red-500" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-full bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-mono font-bold uppercase tracking-wider">
              Investigator Clearance Required
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Fraud & Impersonation Terminal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Execution of synthetic identity impersonation forensics, document Error Level Analysis (ELA), 
              and biometric liveness audits requires authorized operator clearance assigned by your Administrator.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-[#090e1a]/95 backdrop-blur-md shadow-2xl space-y-4">
            <div className="text-xs text-slate-300 font-mono flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Authentication Gate Active</span>
            </div>

            <Link
              href="/login?redirect=/analyze/fraud"
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 font-mono"
            >
              <span>Sign In with Assigned Credentials</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="text-[11px] text-slate-500 font-sans">
              Need credentials? Contact the Lead Administrator to be provisioned in the Admin Command Console.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // Authorized Workspace: Full Fraud & Impersonation Terminal
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 font-sans relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-40 left-1/4 w-[400px] h-[300px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Terminal Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-950/40 text-red-300 text-xs font-mono mb-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>FT-02 · MULTI-VECTOR FRAUD & IMPERSONATION SUITE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-red-500" />
            <span>Fraud & Identity Impersonation Forensics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Detect digital identity cloning, executive face-swap impersonations, forged KYC credentials, 
            and spliced documents using dual neural classification and spatial Error Level Analysis (ELA).
          </p>
        </div>

        {/* Operator Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl border border-slate-800 bg-[#090d18] text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-white font-semibold">{sessionUser.username}</span>
            <span className="text-slate-500">({sessionUser.role || 'Investigator'})</span>
          </div>
        </div>
      </div>

      {/* Forensic Inspection Vector Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setFraudMode('identity_impersonation')}
          className={`p-4 rounded-xl border text-left transition-all ${
            fraudMode === 'identity_impersonation'
              ? 'border-red-500/60 bg-red-950/30 shadow-lg shadow-red-950/30'
              : 'border-slate-800 bg-[#090d18]/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Identity Impersonation</span>
            </div>
            {fraudMode === 'identity_impersonation' && (
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase">ACTIVE</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Detects deepfake face-swaps, synthetic executive avatars, and unauthorized biometric identity cloning.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFraudMode('kyc_forgery')}
          className={`p-4 rounded-xl border text-left transition-all ${
            fraudMode === 'kyc_forgery'
              ? 'border-red-500/60 bg-red-950/30 shadow-lg shadow-red-950/30'
              : 'border-slate-800 bg-[#090d18]/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Document & KYC Forgery</span>
            </div>
            {fraudMode === 'kyc_forgery' && (
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase">ACTIVE</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Performs Error Level Analysis (ELA) to detect altered IDs, doctored certificates, and spliced contracts.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFraudMode('biometric_spoof')}
          className={`p-4 rounded-xl border text-left transition-all ${
            fraudMode === 'biometric_spoof'
              ? 'border-red-500/60 bg-red-950/30 shadow-lg shadow-red-950/30'
              : 'border-slate-800 bg-[#090d18]/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Biometric Spoof Defense</span>
            </div>
            {fraudMode === 'biometric_spoof' && (
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase">ACTIVE</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Inspects specular reflectance, moiré interference, and 2D screen presentation replay attacks.
          </p>
        </button>
      </div>

      {/* Main Analysis Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Media Uploader & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#090d18]/90 p-5 space-y-4 shadow-xl">
            <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center justify-between">
              <span>Evidence Ingestion</span>
              <span className="text-slate-500 text-[10px]">JPG · PNG · WEBP</span>
            </div>

            {/* Drop Zone */}
            <div className="relative border-2 border-dashed border-slate-700 hover:border-red-500/60 rounded-2xl p-6 text-center transition-all bg-[#0c1222]/80 group">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {preview ? (
                <div className="space-y-3">
                  <div className="relative max-h-56 rounded-xl overflow-hidden border border-slate-700 mx-auto">
                    <img src={preview} alt="Evidence Preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-xs text-slate-300 font-mono truncate">
                    {file?.name} ({((file?.size || 0) / 1024).toFixed(1)} KB)
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                    className="text-[11px] text-red-400 hover:text-red-300 font-mono underline"
                  >
                    Remove and choose another
                  </button>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Drop suspected media or <span className="text-cyan-400 underline">browse files</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Max file size: 50MB. Analyzed locally in GPU memory.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Pre-load Samples */}
            <div className="pt-2 flex items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-500 text-[11px]">Quick Tests:</span>
              <button
                type="button"
                onClick={() => loadDemoSample('fake')}
                className="px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-950/30 hover:bg-red-900/40 text-red-300 text-[11px] transition-colors"
              >
                Suspected Face-Swap
              </button>
              <button
                type="button"
                onClick={() => loadDemoSample('real')}
                className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              >
                Suspected Document
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl border border-red-500/40 bg-red-950/40 text-red-400 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || !file}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 font-mono disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing ELA & Neural Invariants...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Execute Multi-Vector Fraud Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Forensic Protocol Explainer Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#090d18]/80 p-5 space-y-3 text-xs text-slate-400 font-mono">
            <div className="text-white font-bold flex items-center gap-1.5 uppercase text-[11px]">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Inspection Methodology</span>
            </div>
            <p className="text-[11px] leading-relaxed font-sans">
              <b>Error Level Analysis (ELA):</b> Highlights compression grid discrepancies. Spliced regions, replaced facial features, or altered document text resave with distinct error densities compared to native camera sensors.
            </p>
            <p className="text-[11px] leading-relaxed font-sans">
              <b>Spatial Receptive Fields:</b> EfficientNet-B0 maps high-frequency boundary gradients to verify identity authenticity.
            </p>
          </div>
        </div>

        {/* Right Column: Visual Findings & Threat Dossier (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="space-y-4">
              {/* Face Detection Advisory Notice */}
              {result.face_detection?.face_detection_status === 'fallback_center_crop' && (
                <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/40 text-amber-200 font-mono text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>ADVISORY: NO PRIMARY HUMAN FACE DETECTED (CENTER-CROP USED)</span>
                  </div>
                  <p className="text-[11px] text-amber-300/90 leading-relaxed">
                    Veritas Sentinel evaluated a center-crop fallback because no frontal or profile human face was detected. Non-facial objects (e.g. computer mice, vehicles, scenery) yield out-of-domain feature scores. For authentic facial verification, please ensure the photograph contains a clear human face or test using the verified benchmarks on the left.
                  </p>
                </div>
              )}

              {/* Threat Dossier Header Card */}
              <div className="rounded-2xl border border-slate-800 bg-[#090d18]/90 p-5 sm:p-6 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      Case Dossier Identifier
                    </div>
                    <div className="text-base font-bold text-white font-mono">
                      {result.case_id}
                    </div>
                  </div>

                  {/* Threat Level Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Threat Level:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase shadow-sm ${
                        result.threat_level === 'CRITICAL'
                          ? 'bg-red-950/80 border border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                          : result.threat_level === 'HIGH'
                          ? 'bg-orange-950/80 border border-orange-500 text-orange-400'
                          : result.threat_level === 'MODERATE'
                          ? 'bg-yellow-950/80 border border-yellow-500 text-yellow-400'
                          : 'bg-emerald-950/80 border border-emerald-500 text-emerald-400'
                      }`}
                    >
                      {result.threat_level} ALERT
                    </span>
                  </div>
                </div>

                {/* KPI Metrics Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-slate-800 bg-[#0c1222] space-y-1">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Fraud Risk</div>
                    <div className="text-xl font-extrabold text-white font-mono">
                      {(result.fraud_risk_score * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-800 bg-[#0c1222] space-y-1">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Impersonation</div>
                    <div className="text-xl font-extrabold text-red-400 font-mono">
                      {(result.impersonation_probability * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-800 bg-[#0c1222] space-y-1">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">ELA Tamper</div>
                    <div className="text-xl font-extrabold text-cyan-400 font-mono">
                      {(result.document_tampering_score * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-800 bg-[#0c1222] space-y-1">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Liveness Index</div>
                    <div className="text-xl font-extrabold text-emerald-400 font-mono">
                      {(result.liveness_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Visualizer Tabs */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setActiveVisualTab('ela')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeVisualTab === 'ela'
                          ? 'bg-red-950/70 text-red-300 border border-red-500/40 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Error Level Analysis (ELA)
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveVisualTab('gradcam')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeVisualTab === 'gradcam'
                          ? 'bg-red-950/70 text-red-300 border border-red-500/40 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Grad-CAM Heatmap
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveVisualTab('original')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeVisualTab === 'original'
                          ? 'bg-red-950/70 text-red-300 border border-red-500/40 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Original Media
                    </button>
                  </div>

                  {/* Rendered View */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black max-h-[360px] flex items-center justify-center p-2">
                    {activeVisualTab === 'ela' && result.ela_visualization && (
                      <img
                        src={result.ela_visualization}
                        alt="Error Level Analysis Visualization"
                        className="max-h-[340px] w-auto object-contain"
                      />
                    )}
                    {activeVisualTab === 'gradcam' && result.explanation_image && (
                      <img
                        src={result.explanation_image}
                        alt="Grad-CAM Neural Sensitivity"
                        className="max-h-[340px] w-auto object-contain"
                      />
                    )}
                    {activeVisualTab === 'original' && preview && (
                      <img
                        src={preview}
                        alt="Original Uploaded Evidence"
                        className="max-h-[340px] w-auto object-contain"
                      />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono text-center">
                    {activeVisualTab === 'ela' && 'Bright pixel clusters indicate high error variance from splicing or selective re-saving.'}
                    {activeVisualTab === 'gradcam' && 'Red & yellow zones highlight neural layers responding to deepfake facial manipulation.'}
                    {activeVisualTab === 'original' && 'Raw submitted evidence file.'}
                  </div>
                </div>

                {/* 4-Point Forensic Integrity Checklist */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Forensic Integrity Audit Checklist
                  </div>

                  <div className="space-y-1.5">
                    {result.forensic_checks?.map((check: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-800 bg-[#0c1222] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {check.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                          <span className="text-slate-200 font-medium">{check.name}</span>
                        </div>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            check.passed ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {check.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Official Verdict / Recommended Action */}
                <div className="p-4 rounded-xl border border-slate-800 bg-[#0c1222] space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Official Forensic Recommendation</span>
                  </div>
                  <p className="text-xs text-white leading-relaxed font-sans">
                    {result.recommended_action}
                  </p>
                </div>

                {/* Report Download */}
                <div className="pt-2 flex justify-end">
                  <a
                    href={api.getReportDownloadUrl(result.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 hover:text-white font-mono transition-all"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Download Certified Forensic PDF Report</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Standby Card */
            <div className="rounded-2xl border border-slate-800 bg-[#090d18]/60 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-slate-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-white font-mono">
                  Awaiting Suspicious Media Ingestion
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Upload an executive photo, KYC credential, or suspected synthetic avatar on the left to initialize the multi-vector audit.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

