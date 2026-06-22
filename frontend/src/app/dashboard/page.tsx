'use client';

import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  Users,
  Send,
  AlertCircle,
  Megaphone,
  CheckCircle2,
  Wifi,
  WifiOff,
  Zap,
  TrendingUp,
  ShoppingCart,
  MessageSquare,
  DollarSign,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalContacts: number;
  messagesSent: number;
  messagesFailed: number;
  pendingMessages: number;
  activeCampaigns: number;
  whatsappStatus: string;
  successRate: number;
  totalSyncedMessages: number;
  ordersDetected: number;
  leadsGenerated: number;
  salesValue: number;
  conversionRate: number;
  averageResponseTime: string;
}

interface Activity {
  id: string;
  phone: string;
  message: string;
  status: 'Sent' | 'Failed';
  error?: string;
  sentAt: string;
  Contact?: { name: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLogs, setRecentLogs] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Quick Send Form
  const [quickPhone, setQuickPhone] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [sendingQuick, setSendingQuick] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState('');
  const [quickError, setQuickError] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        api.get('/analytics/stats'),
        api.get('/whatsapp/logs')
      ]);
      setStats(statsRes.data);
      setRecentLogs(logsRes.data.slice(0, 5));
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Failed to fetch dashboard metrics. Is backend server online?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone || !quickMessage) return;

    setSendingQuick(true);
    setQuickSuccess('');
    setQuickError('');
    try {
      await api.post('/whatsapp/send', {
        phone: quickPhone,
        message: quickMessage
      });
      setQuickSuccess('Message sent successfully and logged.');
      setQuickPhone('');
      setQuickMessage('');
      loadDashboardData(); // Refresh counts
    } catch (err: any) {
      setQuickError(err.response?.data?.error || 'Failed to dispatch message');
    } finally {
      setSendingQuick(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const isConnected = stats?.whatsappStatus === 'Connected';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            Workspace Hub <TrendingUp className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-sm text-neutral-400">Track and dispatch your customer outreach in real time.</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 transition-all"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/50 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Customers */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm flex items-center gap-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-foreground">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Total Contacts</span>
            <span className="block text-2xl font-bold text-neutral-100">{stats?.totalContacts || 0}</span>
          </div>
        </div>

        {/* Total Synced Messages */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm flex items-center gap-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-405">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Total Messages</span>
            <span className="block text-2xl font-bold text-neutral-100">{stats?.totalSyncedMessages || 0}</span>
          </div>
        </div>

        {/* Leads */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm flex items-center gap-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-405">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Leads Generated</span>
            <span className="block text-2xl font-bold text-neutral-100">{stats?.leadsGenerated || 0}</span>
          </div>
        </div>

        {/* Orders Detected */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm flex items-center gap-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-405">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Orders Detected</span>
            <span className="block text-2xl font-bold text-neutral-100">{stats?.ordersDetected || 0}</span>
          </div>
        </div>

        {/* Sales Value */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm flex items-center gap-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Sales Value</span>
            <span className="block text-2xl font-bold text-neutral-100">₹{parseFloat(stats?.salesValue as any || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm flex items-center gap-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Conversion Rate</span>
            <span className="block text-2xl font-bold text-neutral-100">{stats?.conversionRate || 0}%</span>
          </div>
        </div>

        {/* Response Time */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm flex items-center gap-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Response Speed</span>
            <span className="block text-2xl font-bold text-neutral-100">{stats?.averageResponseTime || '10m'}</span>
          </div>
        </div>

        {/* Message dispatch Success Rate */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm flex items-center gap-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Dispatch Success</span>
            <span className="block text-2xl font-bold text-neutral-100">{stats?.successRate || 100}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Status, Quick Dispatch & Recent History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Col Span 2): WhatsApp connection status and Quick Dispatch */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Node Connection Widget */}
          <div className={`p-6 rounded-2xl border ${isConnected ? 'border-green-500/20 bg-green-500/5' : 'border-neutral-800 bg-neutral-900/20'} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                isConnected
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-500'
              }`}>
                {isConnected ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200">WhatsApp Gateway Session</h3>
                <p className="text-xs text-neutral-400">
                  Status: <span className={`font-bold ${isConnected ? 'text-green-400' : 'text-amber-500'}`}>{stats?.whatsappStatus || 'Disconnected'}</span>
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/whatsapp"
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-center ${
                isConnected
                  ? 'bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                  : 'bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/20'
              }`}
            >
              {isConnected ? 'Manage Sessions' : 'Link Accounts (Get QR)'}
            </Link>
          </div>

          {/* Quick Individual Send Form */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
            <h3 className="font-bold text-neutral-200 mb-2 flex items-center gap-2">
              Quick Dispatch <Send className="w-4 h-4 text-primary" />
            </h3>
            <p className="text-xs text-neutral-400 mb-6">Send an immediate WhatsApp message to a single number.</p>

            <form onSubmit={handleQuickSend} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 919876543210 (with country code)"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 placeholder-neutral-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Message Box</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter message text... supports emoji"
                  value={quickMessage}
                  onChange={(e) => setQuickMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 placeholder-neutral-600 resize-none"
                />
              </div>

              {quickSuccess && <div className="text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-lg">{quickSuccess}</div>}
              {quickError && <div className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{quickError}</div>}

              <button
                type="submit"
                disabled={sendingQuick || !isConnected}
                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  !isConnected
                    ? 'bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/20'
                }`}
              >
                {sendingQuick ? 'Dispatching...' : !isConnected ? 'Gateway Disconnected (Unlock with QR)' : 'Send Message'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Outbox Logs Audit */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-neutral-200">Recent Outbox</h3>
              <Link href="/dashboard/whatsapp" className="text-xs text-primary hover:underline font-semibold">View Logs</Link>
            </div>
            <p className="text-xs text-neutral-400 mb-6">Real-time logs of messages dispatched from this workspace.</p>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-2">
              {recentLogs.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-neutral-500">
                  No outgoing logs recorded yet
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-300">
                        {log.Contact?.name || log.phone}
                      </span>
                      <span className={`px-2 py-0.5 rounded-[4px] font-semibold text-[10px] ${
                        log.status === 'Sent' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-neutral-400 line-clamp-2">{log.message}</p>
                    <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-1 border-t border-neutral-800/40">
                      <span>{new Date(log.sentAt).toLocaleTimeString()}</span>
                      {log.error && <span className="text-red-400 max-w-[150px] truncate" title={log.error}>{log.error}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
