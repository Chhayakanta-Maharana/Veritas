'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  History,
  FileSearch,
  Video,
  Download,
  Filter,
  RefreshCw,
  ArrowRight,
  Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AnalysisSummary } from '@/types/forensics';
import StatusBadge from '@/components/StatusBadge';

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<string>('');
  const [predictionFilter, setPredictionFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalyses({
        media_type: mediaFilter || undefined,
        prediction: predictionFilter || undefined,
      });
      setAnalyses(data.results || []);
    } catch (err) {
      console.error(err);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [mediaFilter, predictionFilter]);

  const filtered = analyses.filter((item) =>
    item.original_filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sentinel-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-mono text-sentinel-50 uppercase flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Forensic Audit Archive</span>
          </h1>
          <p className="text-xs text-sentinel-400 mt-1 font-mono">
            Persistent ledger of all completed image and video forensic audits with cryptographic verification.
          </p>
        </div>

        <button
          onClick={fetchAnalyses}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-sentinel-700 bg-sentinel-900 text-xs font-mono text-sentinel-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH ARCHIVE</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between font-mono text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-sentinel-500" />
          <input
            type="text"
            placeholder="Search by filename or analysis ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-sentinel-900 border border-sentinel-800 rounded-lg pl-9 pr-4 py-2 text-sentinel-200 placeholder-sentinel-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-sentinel-900 border border-sentinel-800 rounded-lg p-1">
            <button
              onClick={() => setMediaFilter('')}
              className={`px-2.5 py-1 rounded ${mediaFilter === '' ? 'bg-sentinel-800 text-cyan-400 font-bold' : 'text-sentinel-400'}`}
            >
              All Media
            </button>
            <button
              onClick={() => setMediaFilter('image')}
              className={`px-2.5 py-1 rounded ${mediaFilter === 'image' ? 'bg-sentinel-800 text-cyan-400 font-bold' : 'text-sentinel-400'}`}
            >
              Images
            </button>
            <button
              onClick={() => setMediaFilter('video')}
              className={`px-2.5 py-1 rounded ${mediaFilter === 'video' ? 'bg-sentinel-800 text-cyan-400 font-bold' : 'text-sentinel-400'}`}
            >
              Videos
            </button>
          </div>

          <div className="flex items-center gap-1 bg-sentinel-900 border border-sentinel-800 rounded-lg p-1">
            <button
              onClick={() => setPredictionFilter('')}
              className={`px-2.5 py-1 rounded ${predictionFilter === '' ? 'bg-sentinel-800 text-cyan-400 font-bold' : 'text-sentinel-400'}`}
            >
              All Verdicts
            </button>
            <button
              onClick={() => setPredictionFilter('REAL')}
              className={`px-2.5 py-1 rounded ${predictionFilter === 'REAL' ? 'bg-emerald-950 text-emerald-400 font-bold' : 'text-sentinel-400'}`}
            >
              Real
            </button>
            <button
              onClick={() => setPredictionFilter('FAKE')}
              className={`px-2.5 py-1 rounded ${predictionFilter === 'FAKE' ? 'bg-crimson-950 text-crimson-400 font-bold' : 'text-sentinel-400'}`}
            >
              Fake
            </button>
          </div>
        </div>
      </div>

      {/* Audit Archive Table */}
      <div className="border border-sentinel-800 rounded-xl bg-sentinel-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-sentinel-800 bg-sentinel-950/70 text-sentinel-400">
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4">MEDIA TYPE</th>
                <th className="py-3 px-4">IDENTIFIER / FILENAME</th>
                <th className="py-3 px-4">VERDICT</th>
                <th className="py-3 px-4">SCORE</th>
                <th className="py-3 px-4">LATENCY</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sentinel-850">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sentinel-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Querying audit archive from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sentinel-500">
                    No matching forensic audit dossiers found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-sentinel-850/50 transition-colors">
                    <td className="py-3 px-4 text-sentinel-400">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sentinel-200 uppercase">
                      {item.media_type === 'image' ? (
                        <span className="flex items-center gap-1.5"><FileSearch className="w-3.5 h-3.5 text-cyan-400" /> IMAGE</span>
                      ) : (
                        <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-crimson-400" /> VIDEO</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sentinel-200 max-w-xs truncate">
                      {item.original_filename || item.id.substring(0, 18) + '...'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge prediction={item.prediction} showScore={false} />
                    </td>
                    <td className="py-3 px-4 text-sentinel-300">
                      {(item.score * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-sentinel-400">
                      {item.processing_duration.toFixed(1)} ms
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        href={`/analyses/${item.id}`}
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        <span>Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <a
                        href={api.getReportDownloadUrl(item.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sentinel-400 hover:text-sentinel-200"
                        title="Download PDF Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

