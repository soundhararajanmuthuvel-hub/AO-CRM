'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import {
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Activity,
  Phone,
  Signal,
  SignalZero,
  Clock
} from 'lucide-react';

interface WhatsAppSession {
  id: string;
  workspaceName: string;
  status: string;
  phoneNumber: string;
  updatedAt: string;
}

export default function WhatsAppChannelsPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/whatsapp');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load WhatsApp monitoring sessions:', err);
      setError('Could not load active WhatsApp channels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const connectedCount = sessions.filter(s => s.status.toLowerCase() === 'connected' || s.status.toLowerCase() === 'ready').length;
  const disconnectedCount = sessions.filter(s => s.status.toLowerCase() === 'disconnected' || s.status.toLowerCase() === 'uninitialized').length;
  const qrPendingCount = sessions.filter(s => s.status.toLowerCase() === 'qr_ready' || s.status.toLowerCase() === 'qr').length;

  const filtered = sessions.filter(s => 
    s.workspaceName.toLowerCase().includes(search.toLowerCase()) || 
    s.phoneNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            WhatsApp Gateway Monitor
          </h1>
          <p className="text-sm text-neutral-400">Track connected client session instances, socket states, and phone number links across tenants.</p>
        </div>
        <button
          onClick={loadSessions}
          className="p-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-neutral-400 self-start md:self-auto transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/50 text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <Signal className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block">Connected Nodes</span>
            <span className="text-2xl font-extrabold text-neutral-150 block">{connectedCount} Channels</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <SignalZero className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block">Offline Nodes</span>
            <span className="text-2xl font-extrabold text-neutral-150 block">{disconnectedCount} Channels</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block">Awaiting QR Scan</span>
            <span className="text-2xl font-extrabold text-neutral-150 block">{qrPendingCount} Channels</span>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md w-full">
        <Search className="w-4.5 h-4.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by company name or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 placeholder-neutral-600"
        />
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && sessions.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center text-neutral-500 text-xs">
            No active WhatsApp channels matched search.
          </div>
        ) : (
          filtered.map((s) => {
            const isReady = s.status.toLowerCase() === 'connected' || s.status.toLowerCase() === 'ready';
            const isQR = s.status.toLowerCase() === 'qr_ready' || s.status.toLowerCase() === 'qr';

            return (
              <div key={s.id} className="p-5 rounded-2xl border border-neutral-850 bg-neutral-900/10 space-y-4 hover:border-neutral-805 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200">{s.workspaceName}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                    isReady
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : isQR
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {s.status}
                  </span>
                </div>

                <div className="space-y-2 border-t border-neutral-850/60 pt-3">
                  <div className="flex items-center gap-2 text-xs text-neutral-450 font-medium">
                    <Phone className="w-3.5 h-3.5 text-neutral-500" />
                    <span>+{s.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Sync: {new Date(s.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
