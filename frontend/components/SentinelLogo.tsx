'use client';

import React from 'react';

interface SentinelLogoProps {
  className?: string;
  glow?: boolean;
}

export default function SentinelLogo({ className = 'w-8 h-8', glow = true }: SentinelLogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {glow && (
        <div className="absolute inset-0 bg-red-600/30 rounded-full blur-md animate-pulse pointer-events-none" />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_0_12px_rgba(239,68,68,0.55)]"
      >
        <defs>
          {/* Shield Exterior Gradient */}
          <linearGradient id="shieldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="40%" stopColor="#ef4444" />
            <stop offset="80%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>

          {/* Shield Interior Gradient (Obsidian Glass) */}
          <linearGradient id="shieldInteriorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="30%" stopColor="#0f172a" />
            <stop offset="70%" stopColor="#090d16" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>

          {/* Central Ocular Sensor Glow */}
          <radialGradient id="sensorIrisGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#f87171" />
            <stop offset="60%" stopColor="#ef4444" />
            <stop offset="90%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#450a0a" />
          </radialGradient>

          {/* Cyan Biometric Crosshair Glow */}
          <linearGradient id="cyanReticleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Outer Aerodynamic Forensic Shield */}
        <path
          d="M50 7 L86 22 C86 54 71 78 50 93 C29 78 14 54 14 22 Z"
          fill="url(#shieldInteriorGrad)"
          stroke="url(#shieldBorderGrad)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* Inner High-Tech Chamfer Rim */}
        <path
          d="M50 13 L80 25.5 C80 51 67.5 72 50 85 C32.5 72 20 51 20 25.5 Z"
          fill="none"
          stroke="#ef4444"
          strokeWidth="0.75"
          strokeOpacity="0.4"
          strokeDasharray="3 2"
        />

        {/* Outer Forensic Scan Ring */}
        <circle
          cx="50"
          cy="48"
          r="24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1"
          strokeOpacity="0.35"
        />

        {/* Segmented Biometric Aperture Ring */}
        <circle
          cx="50"
          cy="48"
          r="18"
          fill="none"
          stroke="#fca5a5"
          strokeWidth="1.2"
          strokeDasharray="7 4"
          strokeOpacity="0.85"
        />

        {/* Inner Iris Enclosure */}
        <circle
          cx="50"
          cy="48"
          r="12"
          fill="#060913"
          stroke="#ef4444"
          strokeWidth="1.2"
        />

        {/* Central Optic Sensor Core */}
        <circle
          cx="50"
          cy="48"
          r="7.5"
          fill="url(#sensorIrisGrad)"
        />
        <circle
          cx="50"
          cy="48"
          r="3"
          fill="#ffffff"
          opacity="0.9"
        />

        {/* Precision Crosshair Tick Marks */}
        {/* Top Tick */}
        <line x1="50" y1="20" x2="50" y2="26" stroke="#22d3ee" strokeWidth="1.4" strokeLinecap="round" />
        {/* Bottom Tick */}
        <line x1="50" y1="70" x2="50" y2="76" stroke="#22d3ee" strokeWidth="1.4" strokeLinecap="round" />
        {/* Left Tick */}
        <line x1="22" y1="48" x2="28" y2="48" stroke="#22d3ee" strokeWidth="1.4" strokeLinecap="round" />
        {/* Right Tick */}
        <line x1="72" y1="48" x2="78" y2="48" stroke="#22d3ee" strokeWidth="1.4" strokeLinecap="round" />

        {/* Dynamic Chevron Brackets (Corner Target Anchors) */}
        <path d="M43 32 L50 28 L57 32" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75" />
        <path d="M43 64 L50 68 L57 64" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75" />
      </svg>
    </div>
  );
}

