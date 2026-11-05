'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Cpu,
  Database,
  Sliders,
  Layers,
  Activity,
  Trash2,
  ExternalLink,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  Check,
  FileSearch,
  Video,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AnalysisSummary } from '@/types/forensics';
import StatusBadge from '@/components/StatusBadge';
import SentinelLogo from '@/components/SentinelLogo';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState<number>(0.10);
  const [updatingThreshold, setUpdatingThreshold] = useState(false);
  const [thresholdSuccess, setThresholdSuccess] = useState<string | null>(null);
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'threshold' | 'analyses' | 'system'>('overview');

  // New user form state
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'investigator',
    is_active: true,
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Verify authentication session
  useEffect(() => {
    const sessionStr = localStorage.getItem('sentinel_admin_session');
    if (!sessionStr) {
      router.push('/admin/login');
      return;
    }

    try {
      const parsed = JSON.parse(sessionStr);
      setAdminUser(parsed.user);
    } catch {
      router.push('/admin/login');
      return;
    }

    fetchAdminData();
  }, [router]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [sysStats, analysesData, usersData] = await Promise.all([
        api.getAdminSystemStats(),
        api.getAnalyses({ page: 1 }),
        api.getAdminUsers(),
      ]);
      setStats(sysStats);
      setAnalyses(analysesData.results || []);
      setUsers(usersData || []);
      if (sysStats.runtime?.decision_threshold) {
        setThreshold(sysStats.runtime.decision_threshold);
      }
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      setUserMsg({ type: 'error', text: 'Username and password are required.' });
      return;
    }

    setCreatingUser(true);
    setUserMsg(null);
    try {
      const res = await api.createAdminUser(newUser);
      setUserMsg({ type: 'success', text: `Operator '${newUser.username}' provisioned successfully!` });
      setNewUser({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'investigator',
        is_active: true,
      });
      fetchAdminData();
      setTimeout(() => setUserMsg(null), 5000);
    } catch (err: any) {
      setUserMsg({ type: 'error', text: err.message || 'Failed to create user.' });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const res = await api.toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: res.is_active } : u))
      );
      setUserMsg({ type: 'success', text: res.message });
      setTimeout(() => setUserMsg(null), 4000);
    } catch (err: any) {
      alert(`Status toggle failed: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Permanently delete operator account '${username}'?`)) return;
    try {
      await api.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setUserMsg({ type: 'success', text: `Operator '${username}' deleted.` });
      setTimeout(() => setUserMsg(null), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sentinel_admin_session');
    router.push('/admin/login');
  };

  const handleUpdateThreshold = async () => {
    setUpdatingThreshold(true);
    setThresholdSuccess(null);
    try {
      const res = await api.setAdminThreshold(threshold);
      setThresholdSuccess(`Threshold successfully updated to ${res.decision_threshold.toFixed(2)} on live neural engine.`);
      setTimeout(() => setThresholdSuccess(null), 5000);
      fetchAdminData();
    } catch (err: any) {
      alert(`Threshold update failed: ${err.message}`);
    } finally {
      setUpdatingThreshold(false);
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    if (!confirm('Permanently delete this analysis record and all underlying media artifacts?')) return;
    try {
      await api.deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      if (stats) {
        setStats({
          ...stats,
          database: {
            ...stats.database,
            total_analyses: Math.max(0, stats.database.total_analyses - 1),
          },
        });
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (!adminUser) {
    return null;
  }

  return (
    <div className="flex-1 bg-[#040806] text-slate-200 py-8 px-4 sm:px-6 lg:px-8 w-full relative overflow-hidden">
      {/* Background Mist */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[400px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER & OPERATOR IDENTITY */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-slate-800/40 bg-[#090d18]/90 backdrop-blur-md p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
              <SentinelLogo className="w-9 h-9" glow={true} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Administrative Command Console
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider">
                  ROOT CLEARANCE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sentinel Forensic Protocol · Operator: <span className="text-emerald-300 font-semibold">{adminUser.username}</span> ({adminUser.role}) · Host: 127.0.0.1:8000
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800/60 bg-[#0c1222] text-xs text-slate-300 hover:text-white hover:border-emerald-600/50 transition-all font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>REFRESH</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-cyan-400 text-xs font-semibold transition-all font-mono"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>TERMINATE SESSION</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. ADMIN NAVIGATION TABS */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto font-mono text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-950/70 text-cyan-400 border border-emerald-500/40 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071910]'
            }`}
          >
            System Overview
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-emerald-950/70 text-cyan-400 border border-emerald-500/40 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071910]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Operator & Clearance Management ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('threshold')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'threshold'
                ? 'bg-emerald-950/70 text-cyan-400 border border-emerald-500/40 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071910]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Threshold Calibration</span>
          </button>

          <button
            onClick={() => setActiveTab('analyses')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'analyses'
                ? 'bg-emerald-950/70 text-cyan-400 border border-emerald-500/40 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071910]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Audit Management ({stats?.database?.total_analyses ?? analyses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'system'
                ? 'bg-emerald-950/70 text-cyan-400 border border-emerald-500/40 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#071910]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Hardware & DB Telemetry</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 3. TAB 1: SYSTEM OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-slate-800/40 bg-[#090d18]/80 space-y-1">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Total Processed Scans
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {stats?.database?.total_analyses ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {stats?.database?.image_analyses ?? 0} Images · {stats?.database?.video_analyses ?? 0} Videos
                </div>
              </div>

              <div className="p-5 rounded-xl border border-red-900/30 bg-red-950/20 space-y-1">
                <div className="text-[11px] font-mono text-red-400 uppercase tracking-wider">
                  Deepfakes Intercepted
                </div>
                <div className="text-3xl font-extrabold text-red-400 font-mono">
                  {stats?.database?.fake_flagged ?? 0}
                </div>
                <div className="text-[10px] text-red-500/80 font-mono">
                  Manipulated / Synthetic signatures
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-800/30 bg-emerald-950/20 space-y-1">
                <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                  Authentic Real Verified
                </div>
                <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                  {stats?.database?.real_flagged ?? 0}
                </div>
                <div className="text-[10px] text-emerald-500/80 font-mono">
                  Camera sensor & biometric integrity
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-800/40 bg-[#090d18]/80 space-y-1">
                <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                  Active Decision Threshold
                </div>
                <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                  {stats?.runtime?.decision_threshold ? stats.runtime.decision_threshold.toFixed(2) : '0.10'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Calibrated on zero-leakage validation
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hardware Quick Summary */}
              <div className="rounded-xl border border-slate-800/40 bg-[#090d18]/80 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Inference Engine State</span>
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Accelerator:</span>
                    <span className="text-white">{stats?.gpu?.name || 'NVIDIA GPU'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total VRAM:</span>
                    <span className="text-cyan-400">{stats?.gpu?.total_vram_gb || '12'} GB GDDR6</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Architecture:</span>
                    <span className="text-white">{stats?.runtime?.architecture || 'EfficientNet-B0'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Database Engine:</span>
                    <span className="text-cyan-400 uppercase">{stats?.database?.engine || 'SQLite'}</span>
                  </div>
                </div>
              </div>

              {/* Administrative Quick Actions */}
              <div className="rounded-xl border border-slate-800/40 bg-[#090d18]/80 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Operational Shortcuts</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    onClick={() => setActiveTab('threshold')}
                    className="p-3 rounded-lg border border-slate-800/60 bg-[#0c1222] hover:border-emerald-500/50 text-left transition-all"
                  >
                    <div className="font-bold text-white">Adjust Threshold</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Tune Sensitivity / Specificity</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('analyses')}
                    className="p-3 rounded-lg border border-slate-800/60 bg-[#0c1222] hover:border-emerald-500/50 text-left transition-all"
                  >
                    <div className="font-bold text-white">Manage Analyses</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Inspect & purge dossiers</div>
                  </button>

                  <Link
                    href="/analyze/image"
                    className="p-3 rounded-lg border border-slate-800/60 bg-[#0c1222] hover:border-emerald-500/50 text-left transition-all block"
                  >
                    <div className="font-bold text-white">New Image Audit</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Upload suspicious frame</div>
                  </Link>

                  <a
                    href="http://127.0.0.1:8000/api/docs/"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-lg border border-slate-800/60 bg-[#0c1222] hover:border-emerald-500/50 text-left transition-all block"
                  >
                    <div className="font-bold text-white flex items-center gap-1">
                      <span>Swagger OpenAPI</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Interactive DRF Docs</div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3B. TAB: OPERATOR CREDENTIALS & CLEARANCE MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {userMsg && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 font-mono ${
                  userMsg.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-cyan-400'
                    : 'border-red-500/40 bg-red-950/40 text-red-400'
                }`}
              >
                {userMsg.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0 text-cyan-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                )}
                <span>{userMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Provisioning Form (Left 5 Cols) */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-800/40 bg-[#090d18]/90 p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span>Provision New Operator Account</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate login credentials for investigators. Once created and granted clearance, they can authenticate and execute forensic tools.
                </p>

                <form onSubmit={handleCreateUser} className="space-y-3 pt-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-mono">Username *</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="e.g. analyst_john"
                      className="w-full px-3 py-2 rounded-lg border border-slate-800/60 bg-[#0c1222] text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-mono">Temporary Password *</label>
                    <input
                      type="text"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 rounded-lg border border-slate-800/60 bg-[#0c1222] text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-mono">Full Name</label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 rounded-lg border border-slate-800/60 bg-[#0c1222] text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-mono">Email Address</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="john@sentinel.ai"
                      className="w-full px-3 py-2 rounded-lg border border-slate-800/60 bg-[#0c1222] text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-mono">Clearance Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-800/60 bg-[#0c1222] text-white focus:outline-none focus:border-red-500 font-mono"
                    >
                      <option value="investigator">Forensic Investigator (Standard Clearance)</option>
                      <option value="analyst">Senior Forensic Analyst (Staff)</option>
                      <option value="admin">System Administrator (Root)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="is_active_cb"
                      checked={newUser.is_active}
                      onChange={(e) => setNewUser({ ...newUser, is_active: e.target.checked })}
                      className="rounded border-slate-800 bg-[#0c1222] text-emerald-500 focus:ring-0"
                    />
                    <label htmlFor="is_active_cb" className="text-slate-300 cursor-pointer select-none">
                      Grant Active Clearance Immediately
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-950/60 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{creatingUser ? 'Provisioning...' : 'Provision Operator'}</span>
                  </button>
                </form>
              </div>

              {/* Operator Directory Table (Right 7 Cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-800/40 bg-[#090d18]/90 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Authorized Operator Directory</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Total: {users.length} Operators
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 pb-2">
                        <th className="py-2.5">OPERATOR</th>
                        <th className="py-2.5">ROLE</th>
                        <th className="py-2.5">STATUS</th>
                        <th className="py-2.5 text-right">CLEARANCE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="py-2.5">
                            <div className="text-white font-bold">{u.full_name}</div>
                            <div className="text-[10px] text-slate-400">@{u.username} · {u.email || 'no-email'}</div>
                          </td>
                          <td className="py-2.5">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1 text-cyan-400 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                ACTIVE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-yellow-400 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                REVOKED
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-right space-x-2">
                            {u.username !== 'admin' ? (
                              <>
                                <button
                                  onClick={() => handleToggleUserStatus(u.id)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                    u.is_active
                                      ? 'bg-yellow-950/40 hover:bg-yellow-900/60 text-yellow-400 border border-yellow-500/30'
                                      : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-cyan-400 border border-emerald-500/30'
                                  }`}
                                  title={u.is_active ? 'Revoke User Access' : 'Grant User Access'}
                                >
                                  {u.is_active ? 'REVOKE' : 'AUTHORIZE'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="text-red-400 hover:text-red-300 transition-colors p-1"
                                  title="Delete User Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5 inline" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold">ROOT PROTECTED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TAB 2: LIVE THRESHOLD CALIBRATION */}
        {/* ========================================================================= */}
        {activeTab === 'threshold' && (
          <div className="rounded-2xl border border-slate-800/40 bg-[#090d18]/90 p-6 sm:p-8 space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <span>Live Decision Threshold Dynamic Calibration</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Dynamically adjust the probability cutoff $\tau$. Scores $\ge \tau$ classify media as <b>FAKE</b>;
                scores $&lt; \tau$ classify media as <b>REAL</b>. Changes apply instantly to all active inference workers without restarting.
              </p>
            </div>

            {thresholdSuccess && (
              <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-cyan-400 text-xs flex items-center gap-2 font-mono">
                <Check className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>{thresholdSuccess}</span>
              </div>
            )}

            {/* Slider Control */}
            <div className="space-y-4 p-5 rounded-xl border border-slate-800/50 bg-[#0c1222]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">Decision Threshold ($\tau$):</span>
                <span className="text-2xl font-bold font-mono text-cyan-400">
                  {threshold.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min="0.01"
                max="0.99"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-red-500"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0.01 (High Sensitivity / Aggressive)</span>
                <span>0.10 (Validated Optimal)</span>
                <span>0.50 (Standard)</span>
                <span>0.99 (High Specificity / Conservative)</span>
              </div>
            </div>

            {/* Scientific Explanation */}
            <div className="p-4 rounded-xl border border-slate-800/40 bg-[#0c1222]/60 text-xs text-slate-400 space-y-2">
              <div className="font-bold text-slate-300">Calibration Guidance:</div>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li><b>$\tau = 0.10$ (Optimal Benchmark):</b> Calibrated on the 180-sample validation set. Yields 100% sensitivity and 100% specificity on identity-isolated splits.</li>
                <li><b>$\tau &lt; 0.10$:</b> Recommended for high-stakes intelligence screening where any subtle synthetic artifact must trigger analyst review.</li>
                <li><b>$\tau &gt; 0.50$:</b> Conservative setting to minimize false alarms on heavily compressed or low-quality camera uploads.</li>
              </ul>
            </div>

            {/* Save Button */}
            <button
              onClick={handleUpdateThreshold}
              disabled={updatingThreshold}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs font-mono uppercase transition-all shadow-lg shadow-red-950/60 flex items-center gap-2 disabled:opacity-50"
            >
              {updatingThreshold ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Deploying Threshold...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Deploy Threshold to Live Neural Engine</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. TAB 3: AUDIT RECORD MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'analyses' && (
          <div className="rounded-2xl border border-slate-800 bg-[#090e1a]/90 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Forensic Audit Records Database</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Inspect recorded forensic dossiers, download evidence packages, or permanently delete records and physical media artifacts.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 pb-2">
                    <th className="py-2.5">TIMESTAMP</th>
                    <th className="py-2.5">MEDIA</th>
                    <th className="py-2.5">FILENAME</th>
                    <th className="py-2.5">VERDICT</th>
                    <th className="py-2.5">SCORE</th>
                    <th className="py-2.5">LATENCY</th>
                    <th className="py-2.5 text-right">OPERATIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {analyses.length > 0 ? (
                    analyses.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-2.5 text-slate-400">
                          {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 text-slate-300 uppercase">
                          {item.media_type === 'image' ? (
                            <span className="flex items-center gap-1"><FileSearch className="w-3.5 h-3.5 text-cyan-400" /> IMG</span>
                          ) : (
                            <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-red-400" /> VID</span>
                          )}
                        </td>
                        <td className="py-2.5 text-white max-w-[140px] truncate">
                          {item.original_filename || 'anonymous_media'}
                        </td>
                        <td className="py-2.5">
                          <StatusBadge prediction={item.prediction} showScore={false} />
                        </td>
                        <td className="py-2.5 text-slate-300 font-bold">
                          {item.score.toFixed(4)}
                        </td>
                        <td className="py-2.5 text-slate-400">
                          {item.processing_duration.toFixed(1)} ms
                        </td>
                        <td className="py-2.5 text-right space-x-3">
                          <Link
                            href={`/analyses/${item.id}`}
                            className="text-cyan-400 hover:text-cyan-300 font-bold"
                          >
                            Dossier →
                          </Link>
                          <button
                            onClick={() => handleDeleteAnalysis(item.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No inspection records currently persisted in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. TAB 4: SYSTEM TELEMETRY */}
        {/* ========================================================================= */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-[#090e1a]/80 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>NVIDIA CUDA Hardware Telemetry</span>
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">GPU Device:</span>
                  <span className="text-white">{stats?.gpu?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Total Dedicated VRAM:</span>
                  <span className="text-cyan-400">{stats?.gpu?.total_vram_gb} GB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">CUDA Device Count:</span>
                  <span className="text-white">{stats?.gpu?.device_count}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">CUDA In-Use Memory:</span>
                  <span className="text-cyan-400">{stats?.gpu?.allocated_vram_mb} MB</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#090e1a]/80 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Database & Model Registry</span>
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Storage Engine:</span>
                  <span className="text-white uppercase">{stats?.database?.engine}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Physical Artifacts:</span>
                  <span className="text-white">{stats?.database?.artifacts_count} files</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Registered Users:</span>
                  <span className="text-white">{stats?.database?.users_count} operators</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Model Version Checkpoint:</span>
                  <span className="text-cyan-400">{stats?.runtime?.active_model}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

