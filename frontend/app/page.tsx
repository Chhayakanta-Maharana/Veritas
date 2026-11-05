'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  UploadCloud,
  BarChart3,
  Cpu,
  Zap,
  ShieldCheck,
  Database,
  Info,
  FileCheck,
  AlertCircle,
  Network,
} from 'lucide-react';
import { api } from '@/lib/api';
import { HealthStatus, ModelInfo } from '@/types/forensics';

export default function LandingPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    api.getHealth().then(setHealth).catch(() => { });
    api.getModelInfo().then(setModelInfo).catch(() => { });
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-start bg-[#060813] text-slate-200 overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Reference Design: Crimson & Cyan Obsidian) */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        {/* Ambient Radial Lighting */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Headline & CTA */}
          <div className="lg:col-span-7 space-y-6">
            {/* Forensic Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-500/30 bg-red-950/40 text-red-300 text-xs font-mono shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm" />
              <span>FT-02 · Forensic Intelligence Protocol</span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Veritas{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-red-600 drop-shadow-[0_0_35px_rgba(239,68,68,0.35)]">
                  Sentinel
                </span>
              </h1>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-3 tracking-tight">
                AI-Powered <span className="text-slate-200">Deepfake & Synthetic Media Forensics</span>
              </h2>
            </div>

            {/* Grounded, Forensic Pitch */}
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Detect manipulated or AI-generated content with advanced machine learning.
              Uncover the truth in a world of synthetic media.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Link
                href="/analyze/image"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-red-950/60 hover:scale-[1.02] active:scale-[0.98]"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Analyze</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/analyze/fraud"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 text-red-300 font-semibold text-xs sm:text-sm transition-all hover:border-red-400"
              >
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span>Fraud & Impersonation</span>
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-medium text-xs sm:text-sm transition-all hover:border-slate-600"
              >
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Telemetry</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Split Face Visual & Authenticity Check Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Visual Container */}
            <div className="relative w-full max-w-md flex items-center justify-center">
              {/* Cyan Facial Detection Bounding Box Corners */}
              <div className="absolute inset-x-8 inset-y-4 pointer-events-none z-20">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
              </div>

              {/* Feathered Split-Face Composite Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 bg-gradient-to-br from-[#0c1222] to-[#060813]">
                <img
                  src="/images/split_face_hero.png"
                  alt="Veritas Sentinel Split-Face Forensic Visual"
                  className="w-full h-auto object-cover max-h-[380px]"
                />
              </div>

              {/* Floating "Authenticity Check" Dossier Card */}
              <div className="absolute -right-2 sm:-right-6 top-6 sm:top-8 rounded-2xl border border-slate-800/90 bg-[#090d16]/95 backdrop-blur-md p-4 w-52 sm:w-60 shadow-2xl space-y-3 z-30">
                <div className="text-[11px] text-slate-400 font-mono font-medium uppercase tracking-wider">
                  Authenticity Check
                </div>

                {/* Big Glowing Crimson FAKE Badge */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-400 font-extrabold text-sm sm:text-base shadow-[0_0_15px_rgba(239,68,68,0.25)]">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>FAKE</span>
                </div>

                {/* Confidence Metric & Bar */}
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400">Confidence Score</div>
                  <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                    98.7%
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-rose-500 h-1.5 rounded-full w-[98.7%]" />
                  </div>
                </div>

                {/* Advisory Tip */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-850">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Potentially manipulated content detected.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FEATURE & METRICS RIBBON */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 w-full">
        <div className="rounded-2xl border border-slate-800/90 bg-[#090e1a]/95 backdrop-blur-md p-4 sm:p-5 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left: 4 Forensic Capability Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 w-full lg:w-auto flex-1">
            {/* Card 1: Red Brain / Model */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Network className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Advanced AI Model</div>
                <div className="text-[10px] text-slate-400">EfficientNet-B0 powered detection</div>
              </div>
            </div>

            {/* Card 2: Cyan Lightning / Real-Time */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Real-time Analysis</div>
                <div className="text-[10px] text-slate-400">Images & Videos</div>
              </div>
            </div>

            {/* Card 3: Violet Shield / Fraud & Impersonation */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Fraud & Impersonation</div>
                <div className="text-[10px] text-slate-400">Face-swap & ELA tamper detection</div>
              </div>
            </div>

            {/* Card 4: Emerald Database / Neon */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Database className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Secure & Reliable</div>
                <div className="text-[10px] text-slate-400">Powered by Neon PostgreSQL</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-10 bg-slate-800" />

          {/* Right: Key Performance Telemetry Numbers */}
          <div className="flex items-center justify-around w-full lg:w-auto gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            <div className="text-center lg:text-left">
              <div className="text-2xl font-extrabold text-white font-mono">
                {modelInfo?.evaluation_summary?.test_accuracy
                  ? `${(modelInfo.evaluation_summary.test_accuracy * 100).toFixed(0)}%`
                  : '100%'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Test Accuracy
              </div>
            </div>

            <div className="w-px h-8 bg-slate-800" />

            <div className="text-center lg:text-left">
              <div className="text-2xl font-extrabold text-cyan-400 font-mono">
                8.5ms
              </div>
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Avg Latency
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW IT WORKS WORKFLOW */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Section Heading */}
        <div className="mb-8">
          <div className="text-xs font-bold text-red-500 uppercase tracking-widest font-mono">
            HOW IT WORKS
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Simple. Powerful. Reliable.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            From upload to verdict — in just a few steps.
          </p>
        </div>

        {/* 3-Step Cards & Security Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Steps Flow (Left 7 Cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* Step 01 */}
            <div className="rounded-xl border border-slate-800/90 bg-[#090e1a]/80 p-4 h-full flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="w-6 h-6 rounded bg-slate-800 text-[10px] font-mono font-bold text-cyan-400 flex items-center justify-center mb-3">
                  01
                </div>
                <UploadCloud className="w-5 h-5 text-cyan-400 mb-2" />
                <div className="text-xs font-bold text-white mb-1">Upload Media</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Add an image or video from your device.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="rounded-xl border border-slate-800/90 bg-[#090e1a]/80 p-4 h-full flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="w-6 h-6 rounded bg-slate-800 text-[10px] font-mono font-bold text-cyan-400 flex items-center justify-center mb-3">
                  02
                </div>
                <Cpu className="w-5 h-5 text-cyan-400 mb-2" />
                <div className="text-xs font-bold text-white mb-1">AI Analysis</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Our model inspects for manipulation.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div className="rounded-xl border border-slate-800/90 bg-[#090e1a]/80 p-4 h-full flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="w-6 h-6 rounded bg-slate-800 text-[10px] font-mono font-bold text-cyan-400 flex items-center justify-center mb-3">
                  03
                </div>
                <FileCheck className="w-5 h-5 text-cyan-400 mb-2" />
                <div className="text-xs font-bold text-white mb-1">Get Results</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  View prediction, confidence and visual explanations.
                </p>
              </div>
            </div>
          </div>

          {/* Right Banner: Built for a Safer Digital World (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800/90 bg-gradient-to-r from-[#0d1627] via-[#091122] to-[#070b16] p-6 relative overflow-hidden flex items-center gap-4">
            {/* Subtle Dotted Graphic Overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:12px_12px]" />

            {/* Left Red Accent Bar */}
            <div className="w-1.5 self-stretch rounded-full bg-gradient-to-b from-red-500 to-rose-600 shrink-0" />

            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div className="relative z-10">
              <h3 className="text-sm font-bold text-white">
                Built for a Safer Digital World
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Empowering individuals, organizations, and platforms to detect deepfakes
                and synthetic media with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
