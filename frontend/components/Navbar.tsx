'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  FileSearch,
  Video,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { HealthStatus } from '@/types/forensics';
import SentinelLogo from '@/components/SentinelLogo';

export default function Navbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const checkAuth = () => {
    if (typeof window === 'undefined') return;
    const unifiedSession = localStorage.getItem('sentinel_session');
    const userSession = localStorage.getItem('sentinel_user_session');
    const adminSession = localStorage.getItem('sentinel_admin_session');

    if (unifiedSession) {
      try {
        setSessionUser(JSON.parse(unifiedSession));
        return;
      } catch {}
    }
    if (adminSession) {
      try {
        const parsed = JSON.parse(adminSession);
        setSessionUser({ ...parsed.user, role: 'admin', is_admin: true });
        return;
      } catch {}
    }
    if (userSession) {
      try {
        const parsed = JSON.parse(userSession);
        setSessionUser(parsed);
        return;
      } catch {}
    }
    setSessionUser(null);
  };

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch(() => setHealth(null));

    checkAuth();
    window.addEventListener('sentinel_auth_change', checkAuth);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAnalyzeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('sentinel_auth_change', checkAuth);
    };
  }, [pathname]);

  const handleSignOut = () => {
    localStorage.removeItem('sentinel_session');
    localStorage.removeItem('sentinel_user_session');
    localStorage.removeItem('sentinel_admin_session');
    setSessionUser(null);
    window.dispatchEvent(new Event('sentinel_auth_change'));
  };

  const isAnalyzeActive = pathname.startsWith('/analyze');
  const isAdmin = Boolean(
    sessionUser?.is_superuser ||
    sessionUser?.is_admin ||
    sessionUser?.role === 'admin' ||
    sessionUser?.role?.toLowerCase().includes('admin')
  );

  return (
    <nav className="border-b border-slate-800/80 bg-[#060813]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <SentinelLogo className="w-8 h-8 transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white flex items-center">
                Veritas <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-red-600 ml-1 font-extrabold">Sentinel</span>
              </span>
              <span className="text-[9px] text-slate-400 tracking-wider uppercase font-mono font-medium">
                AI Forensics & Verification
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-7">
            <Link
              href="/"
              className={`text-xs transition-colors py-1 relative ${
                pathname === '/'
                  ? 'text-white font-semibold after:content-[""] after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-red-500'
                  : 'text-slate-300 hover:text-white font-medium'
              }`}
            >
              Home
            </Link>

            <Link
              href="/dashboard"
              className={`text-xs transition-colors py-1 relative ${
                pathname === '/dashboard'
                  ? 'text-white font-semibold after:content-[""] after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-red-500'
                  : 'text-slate-300 hover:text-white font-medium'
              }`}
            >
              Dashboard
            </Link>

            {/* Analyze Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAnalyzeOpen(!analyzeOpen)}
                className={`text-xs flex items-center gap-1 transition-colors py-1 ${
                  isAnalyzeActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white font-medium'
                }`}
              >
                <span>Analyze</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${analyzeOpen ? 'rotate-180' : ''}`} />
              </button>

              {analyzeOpen && (
                <div className="absolute top-full left-0 mt-3 w-56 rounded-xl bg-[#0a0d1a] border border-slate-800 shadow-2xl py-2 z-50">
                  <Link
                    href="/analyze/image"
                    onClick={() => setAnalyzeOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800/60 hover:text-cyan-400 transition-colors"
                  >
                    <FileSearch className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Image Forensics</span>
                  </Link>

                  <Link
                    href="/analyze/video"
                    onClick={() => setAnalyzeOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800/60 hover:text-cyan-400 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Video Forensics</span>
                  </Link>

                  <Link
                    href="/analyze/fraud"
                    onClick={() => setAnalyzeOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800/60 hover:text-red-400 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span className="font-semibold text-white">Fraud & Impersonation</span>
                  </Link>

                  <div className="my-1 border-t border-slate-800/80" />

                  <Link
                    href="/history"
                    onClick={() => setAnalyzeOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Audit Archive</span>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/models"
              className={`text-xs transition-colors py-1 relative ${
                pathname === '/models'
                  ? 'text-white font-semibold after:content-[""] after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-red-500'
                  : 'text-slate-300 hover:text-white font-medium'
              }`}
            >
              Model Performance
            </Link>

            <Link
              href="/about"
              className={`text-xs transition-colors py-1 relative ${
                pathname === '/about'
                  ? 'text-white font-semibold after:content-[""] after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-red-500'
                  : 'text-slate-300 hover:text-white font-medium'
              }`}
            >
              About
            </Link>

            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className={`text-xs transition-colors py-1 relative ${
                  pathname.startsWith('/admin')
                    ? 'text-red-400 font-semibold after:content-[""] after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-red-500'
                    : 'text-red-400/90 hover:text-red-300 font-semibold'
                }`}
              >
                Admin Console
              </Link>
            )}
          </div>

          {/* Right Section: Status Badge, User Session & Unified Sign In */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>API Online</span>
            </div>

            {sessionUser ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-300 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-red-400 animate-pulse' : 'bg-cyan-400'}`} />
                  <span className="text-white font-semibold">{sessionUser.username}</span>
                  <span className="text-slate-400 hidden md:inline">
                    ({isAdmin ? 'Admin' : 'Analyst'})
                  </span>
                </span>

                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-red-300 hover:text-white bg-red-950/40 border border-red-500/40 hover:border-red-400 transition-all font-mono"
                  >
                    <span>Admin</span>
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  className="text-[11px] font-mono text-slate-400 hover:text-red-400 transition-colors px-2 py-1"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-950/50 transition-all font-mono"
              >
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
