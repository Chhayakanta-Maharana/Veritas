'use client';

import React, { useState } from 'react';
import { Layers, Eye, Zap, Info } from 'lucide-react';

interface GradCAMViewerProps {
  originalImage?: string;
  overlayImage?: string;
  prediction: string;
  score: number;
}

export default function GradCAMViewer({
  originalImage,
  overlayImage,
  prediction,
  score,
}: GradCAMViewerProps) {
  const [activeView, setActiveView] = useState<'overlay' | 'original' | 'split'>('overlay');

  if (!overlayImage) {
    return (
      <div className="border border-sentinel-800 rounded-xl p-6 bg-sentinel-900/50 text-center font-mono text-xs text-sentinel-400">
        <Info className="w-5 h-5 mx-auto mb-2 text-sentinel-500" />
        No Grad-CAM explanation map available for this media analysis.
      </div>
    );
  }

  return (
    <div className="border border-sentinel-800 rounded-xl bg-sentinel-900/90 overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-sentinel-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-sentinel-100 uppercase tracking-wider">
            Explainable AI: Neural Gradient Sensitivity (Grad-CAM)
          </span>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 bg-sentinel-950 p-1 rounded-lg border border-sentinel-800 text-[11px] font-mono">
          <button
            onClick={() => setActiveView('overlay')}
            className={`px-2.5 py-1 rounded transition-all ${
              activeView === 'overlay'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold'
                : 'text-sentinel-400 hover:text-sentinel-200'
            }`}
          >
            Overlay
          </button>
          <button
            onClick={() => setActiveView('split')}
            className={`px-2.5 py-1 rounded transition-all ${
              activeView === 'split'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold'
                : 'text-sentinel-400 hover:text-sentinel-200'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeView === 'overlay' ? (
          <div className="flex flex-col items-center">
            <div className="relative rounded-lg overflow-hidden border border-sentinel-700 shadow-glow-cyan max-w-md w-full">
              <img
                src={overlayImage}
                alt="Grad-CAM Activation Map Overlay"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="mt-3 text-[11px] font-mono text-sentinel-400 flex items-center gap-2 text-center">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500 inline-block" />
              <span>Colormap Spectrum: Warm hues (Red/Yellow) highlight regions driving classification score.</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col items-center">
              <div className="text-xs font-mono text-sentinel-400 mb-2 font-semibold">TARGET FACE CROP</div>
              <div className="rounded-lg overflow-hidden border border-sentinel-700 w-full max-w-sm">
                <img
                  src={originalImage || overlayImage}
                  alt="Original Face Crop"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-xs font-mono text-cyan-400 mb-2 font-semibold">GRAD-CAM ACTIVATION MAP</div>
              <div className="rounded-lg overflow-hidden border border-cyan-700/60 shadow-glow-cyan w-full max-w-sm">
                <img
                  src={overlayImage}
                  alt="Grad-CAM Activation Overlay"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-3 bg-sentinel-950 border-t border-sentinel-800 text-[10px] font-mono text-sentinel-400 flex items-center justify-between">
        <div>GRAD-CAM BACKBONE HOOK: EfficientNet-B0 (features[-1])</div>
        <div className="text-cyan-400">ANOMALY RECEPTIVE FIELD ISOLATED</div>
      </div>
    </div>
  );
}

