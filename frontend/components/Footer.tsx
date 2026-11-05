import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import SentinelLogo from '@/components/SentinelLogo';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#04060d] text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Mission (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <SentinelLogo className="w-8 h-8" glow={true} />
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-white flex items-center">
                  Veritas <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500 ml-1 font-extrabold">Sentinel</span>
                </span>
                <span className="text-[10px] text-slate-400 tracking-wider font-mono">
                  Enterprise Deepfake & Synthetic Media Forensics
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Empowering organizations, newsrooms, and platforms to verify media authenticity,
              detect generative manipulations, and safeguard digital truth.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Forensic Services Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Forensic Tools
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/analyze/image" className="hover:text-cyan-400 transition-colors">
                  Facial Image Forensics
                </Link>
              </li>
              <li>
                <Link href="/analyze/video" className="hover:text-red-400 transition-colors">
                  Temporal Video Analysis
                </Link>
              </li>
              <li>
                <Link href="/analyze/fraud" className="hover:text-red-400 transition-colors text-white font-medium">
                  Fraud & Impersonation Suite
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
                  Intelligence Dashboard
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-slate-300 transition-colors">
                  Dossier Archive
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Science */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Platform & Science
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/models" className="hover:text-cyan-400 transition-colors">
                  Model Specifications
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-cyan-400 transition-colors">
                  Detection Methodology
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-cyan-400 transition-colors">
                  Explainability (Grad-CAM)
                </Link>
              </li>
              <li>
                <a
                  href="http://127.0.0.1:8000/api/docs/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>REST API Specs</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Trust & Security
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-slate-300 transition-colors">
                  Ethical AI Standards
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-slate-300 transition-colors">
                  Privacy & Data Isolation
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-slate-300 transition-colors">
                  Evidence Guidelines
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-slate-300 transition-colors">
                  Terms & Disclaimers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
          <div>
            © {new Date().getFullYear()} Veritas Sentinel. Engineered for Digital Authenticity & Forensic Trust.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/about" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/about" className="hover:text-slate-300 transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
