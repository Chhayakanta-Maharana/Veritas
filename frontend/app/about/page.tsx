'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Lock,
  GitBranch,
  Terminal,
  ExternalLink,
  Info,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10 font-sans relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-10 right-1/4 w-[500px] h-[350px] bg-red-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-40 left-1/4 w-[400px] h-[300px] bg-cyan-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Header */}
      <div className="border-b border-slate-800 pb-5 relative z-10">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-red-500/30 bg-red-950/40 text-red-300 text-[11px] mb-2 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>FORENSIC STANDARDS & PLATFORM METHODOLOGY</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Info className="w-6 h-6 text-cyan-400" />
          <span>Platform Architecture & Operational Scope</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Technical specifications, identity-isolated validation protocols, and documented model boundaries.
        </p>
      </div>

      {/* Critical Zero Data Leakage Section */}
      <div className="border border-slate-800 rounded-2xl p-6 bg-[#090d18]/90 space-y-4 relative z-10 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider font-mono">
          <GitBranch className="w-4 h-4" />
          <span>The Zero Data Leakage Imperative</span>
        </div>
        <h2 className="text-base font-bold text-white">
          Why Frame-Level Random Splitting Fails in Video Forensics
        </h2>
        <div className="text-xs text-slate-300 font-sans leading-relaxed space-y-3">
          <p>
            In published deepfake detection literature, an acute point of failure is random cross-frame splitting. When frames from the same source video appear in both training and test partitions, models overfit on background artifacts, subject identity, room acoustics, or camera sensor noise rather than genuine manipulation signals.
          </p>
          <p className="bg-[#0c1222] p-4 rounded-xl border border-slate-800 text-slate-200 font-mono text-[11px]">
            <b className="text-white">Veritas Sentinel Protocol:</b> All 40 source video identities are grouped strictly by <code className="text-cyan-400">source_video_id</code>. All frames, face crops, and manipulated variants belonging to an identity are strictly allocated to one partition (70% Train, 15% Validation, 15% Test). Cross-split contamination is mathematically 0.0%.
          </p>
        </div>
      </div>

      {/* Forensic Limitations */}
      <div className="border border-red-950/60 rounded-2xl p-6 bg-red-950/20 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider font-mono">
          <AlertTriangle className="w-4 h-4" />
          <span>Documented Model Limitations & Domain Shifts</span>
        </div>
        <h2 className="text-base font-bold text-slate-100">
          Operational Boundaries & Forensic Scope
        </h2>
        <ul className="space-y-3 text-xs text-slate-300 font-sans leading-relaxed">
          <li className="flex gap-2">
            <span className="text-red-400 font-mono font-bold">•</span>
            <div>
              <b className="text-white">Severe Re-compression & Social Media Transcoding:</b> Repeated lossy compression (such as WhatsApp/X/Instagram transcodes) smooths high-frequency spatial gradients, potentially lowering detection confidence.
            </div>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400 font-mono font-bold">•</span>
            <div>
              <b className="text-white">Novel / Zero-Day Generative Architectures:</b> While trained across GAN (StyleGAN2/3), FaceSwap, and Diffusion inpainting, previously unseen diffusion architectures with novel latent samplers may introduce unseen artifact distributions.
            </div>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400 font-mono font-bold">•</span>
            <div>
              <b className="text-white">Sub-Scale Facial Crops:</b> Images where faces occupy fewer than 64x64 pixels trigger center crop fallbacks and provide insufficient micro-texture detail for high-certainty conclusions.
            </div>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400 font-mono font-bold">•</span>
            <div>
              <b className="text-white">Explainability Boundaries:</b> Grad-CAM heatmaps illustrate neural receptive field sensitivity, not verifiable legal proof of pixel tampering.
            </div>
          </li>
        </ul>
      </div>

      {/* Ethical Forensics Disclaimer */}
      <div className="border border-slate-800 rounded-2xl p-6 bg-[#090d18]/90 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wider font-mono">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Decision Support Evidence Guidance</span>
        </div>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          Veritas Sentinel is intended as a high-throughput algorithmic decision-support tool for intelligence analysts, journalists, and legal researchers. Its findings should always be evaluated alongside verifiable provenance (C2PA metadata, cryptographic signatures, and forensic chain-of-custody).
        </p>
      </div>

      {/* System Specifications Quick Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-slate-800 rounded-xl p-4 bg-[#090d18] space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-mono">Model Backbone</div>
          <div className="text-xs font-bold text-white font-mono">EfficientNet-B0</div>
          <div className="text-[10px] text-slate-400">5.3M parameters, 224x224 RGB input</div>
        </div>

        <div className="border border-slate-800 rounded-xl p-4 bg-[#090d18] space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-mono">Runtime Parity</div>
          <div className="text-xs font-bold text-cyan-400 font-mono">PyTorch ↔ ONNX Runtime</div>
          <div className="text-[10px] text-slate-400">Strict logit deviation &lt; 1e-4</div>
        </div>

        <div className="border border-slate-800 rounded-xl p-4 bg-[#090d18] space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-mono">Persistence</div>
          <div className="text-xs font-bold text-emerald-400 font-mono">Neon Serverless PostgreSQL</div>
          <div className="text-[10px] text-slate-400">Automated SQLite disaster fallback</div>
        </div>
      </div>
    </div>
  );
}
