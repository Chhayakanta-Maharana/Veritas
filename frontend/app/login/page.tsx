'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Key,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import SentinelLogo from '@/components/SentinelLogo';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.userLogin(username, password);
      const isAdmin = Boolean(
        data.user.is_superuser ||
        data.user.role?.toLowerCase().includes('admin')
      );

      // Save unified session
      const sessionPayload = {
        ...data.user,
        token: data.token,
        is_admin: isAdmin,
      };
      localStorage.setItem('sentinel_session', JSON.stringify(sessionPayload));
      localStorage.setItem('sentinel_user_session', JSON.stringify(data.user));

      if (isAdmin) {
        localStorage.setItem(
          'sentinel_admin_session',
          JSON.stringify({ token: data.token, user: data.user })
        );
      }

      window.dispatchEvent(new Event('sentinel_auth_change'));

      if (redirectTarget) {
        router.push(redirectTarget);
      } else if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/analyze/image');
      }
    } catch (err: any) {
      setError(
        err.message || 'Login failed. Verify your assigned credentials with your Administrator.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 bg-[#060813] text-slate-200 relative overflow-hidden">
      {/* Background Ambient Cyberpunk Glow */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-[0_0_25px_rgba(239,68,68,0.2)] mb-1">
            <SentinelLogo className="w-12 h-12" glow={true} />
          </div>
          <div>
            <div className="inline-block px-3 py-0.5 rounded-full bg-red-950/40 border border-red-500/30 text-[10px] font-mono text-red-300 font-bold uppercase tracking-widest mb-1.5 shadow-sm">
              Veritas Sentinel · Authentication Gateway
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Enterprise Forensics Portal
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Single sign-in for Administrators, Forensic Investigators, and Intelligence Analysts.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800/90 bg-[#090e1a]/95 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-950/40 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 leading-relaxed font-mono text-[11px]">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Operator Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or assigned_user"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0c1222] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0c1222] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs tracking-wide uppercase transition-all shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 disabled:opacity-50 font-mono"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Clearance...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Access Governance Notice */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-center space-y-1">
          <div className="text-[11px] font-semibold text-slate-300 font-mono">
            Role-Based Access Governance
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
            User credentials and permissions are created and assigned exclusively by the Administrator. 
            Once assigned, investigators can authenticate to run image, video, and fraud diagnostics.
          </p>
        </div>
      </div>
    </div>
  );
}
