import React from 'react';
import { ShieldCheck, ShieldAlert, HelpCircle } from 'lucide-react';
import { PredictionLabel } from '@/types/forensics';

interface StatusBadgeProps {
  prediction: PredictionLabel;
  score?: number;
  className?: string;
  showScore?: boolean;
}

export default function StatusBadge({ prediction, score, className = '', showScore = true }: StatusBadgeProps) {
  if (prediction === 'FAKE') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-crimson-950/80 text-crimson-400 border border-crimson-600/50 shadow-glow-crimson ${className}`}>
        <ShieldAlert className="w-3.5 h-3.5 text-crimson-500 animate-pulse" />
        <span>FAKE / MANIPULATED</span>
        {showScore && score !== undefined && (
          <span className="text-crimson-300 font-normal">({(score * 100).toFixed(1)}%)</span>
        )}
      </span>
    );
  }

  if (prediction === 'REAL') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-600/50 ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>AUTHENTIC / REAL</span>
        {showScore && score !== undefined && (
          <span className="text-emerald-300 font-normal">({((1.0 - score) * 100).toFixed(1)}%)</span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-600/50 ${className}`}>
      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
      <span>UNCERTAIN</span>
      {showScore && score !== undefined && (
        <span className="text-amber-300 font-normal">({(score * 100).toFixed(1)}%)</span>
      )}
    </span>
  );
}

