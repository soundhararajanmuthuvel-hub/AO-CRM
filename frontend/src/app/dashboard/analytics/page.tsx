'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  MessageSquare,
  Users,
  Percent,
  Megaphone,
  Activity,
  BarChart3,
  Calendar,
  Layers3,
  Flame
} from 'lucide-react';

interface DailyLog {
  date: string;
  sent: number;
  failed: number;
}

interface CampaignReport {
  name: string;
  type: string;
  sent: number;
  failed: number;
  successRate: number;
  status: string;
}

interface SegmentReport {
  name: string;
  value: number;
}

export default function AnalyticsPage() {
  const [dailyData, setDailyData] = useState<DailyLog[]>([]);
  const [campaignData, setCampaignData] = useState<CampaignReport[]>([]);
  const [segmentData, setSegmentData] = useState<SegmentReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats cards (synced with general KPIs for dashboard alignment)
  const [stats, setStats] = useState<any>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        api.get('/analytics/logs'),
        api.get('/analytics/stats')
      ]);
      setDailyData(logsRes.data.dailyReport || []);
      setCampaignData(logsRes.data.campaignReport || []);
      setSegmentData(logsRes.data.segmentReport || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load analytics logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Pure SVG Line Graph Math
  // Get max values for height normalization
  const maxMessages = Math.max(...dailyData.map(d => d.sent + d.failed), 10);
  const chartHeight = 120;
  const chartWidth = 600;
  
  // Create points coordinate string
  const points = dailyData.map((d, index) => {
    const x = (index / (dailyData.length - 1 || 1)) * chartWidth;
    const val = d.sent;
    const y = chartHeight - (val / maxMessages) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Lead stages Funnel simulation
  const funnelStages = [
    { stage: 'New Leads', count: stats?.newLeads || 4, pct: 100, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    { stage: 'Contacted', count: Math.round((stats?.newLeads || 4) * 0.7), pct: 70, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { stage: 'Qualified', count: Math.round((stats?.newLeads || 4) * 0.5), pct: 50, color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
    { stage: 'Proposal Sent', count: Math.round((stats?.newLeads || 4) * 0.4), pct: 40, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { stage: 'Negotiation', count: Math.round((stats?.newLeads || 4) * 0.3), pct: 30, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
    { stage: 'Won (Orders)', count: stats?.ordersDetected || 2, pct: 20, color: 'bg-green-500/20 text-green-400 border-green-500/30' }
  ];

  // Best Selling Products simulation
  const topProducts = [
    { name: 'ABC Malt', sales: 45, value: 6750, stock: '150 left', color: 'bg-primary' },
    { name: 'Organic Honey', sales: 24, value: 3240, stock: '80 left', color: 'bg-blue-500' },
    { name: 'Beetroot Malt', sales: 18, value: 3510, stock: '90 left', color: 'bg-indigo-500' },
    { name: 'Nendran Banana Malt', sales: 12, value: 2580, stock: '45 left', color: 'bg-purple-500' }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            Intelligence Analytics <Activity className="w-6 h-6 text-primary animate-pulse" />
          </h1>
          <p className="text-sm text-neutral-400">Deep dive into conversion funnels, product metrics, and WhatsApp outbox ratios.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 transition-all"
        >
          Refresh Analytics
        </button>
      </div>

      {/* Grid of details summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Sales metric card */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Total Revenue</span>
            <span className="block text-xl font-bold text-neutral-100 mt-0.5">₹{parseFloat(stats?.salesValue || 0).toFixed(2)}</span>
            <span className="text-[10px] text-green-400 font-bold block mt-1">↑ 18.2% from last month</span>
          </div>
        </div>

        {/* Conversion metric card */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Conversion Rate</span>
            <span className="block text-xl font-bold text-neutral-100 mt-0.5">{stats?.conversionRate || 35}%</span>
            <span className="text-[10px] text-neutral-450 block mt-1">Standard industry avg: 22%</span>
          </div>
        </div>

        {/* Chats volume card */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Chat Volume</span>
            <span className="block text-xl font-bold text-neutral-100 mt-0.5">{stats?.totalSyncedMessages || 0} msgs</span>
            <span className="text-[10px] text-blue-400 font-bold block mt-1">Active sync: Online</span>
          </div>
        </div>

        {/* Active customers card */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Active Customers</span>
            <span className="block text-xl font-bold text-neutral-100 mt-0.5">{stats?.activeCustomers || 0}</span>
            <span className="text-[10px] text-purple-400 font-bold block mt-1">0 At Risk of churn</span>
          </div>
        </div>

      </div>

      {/* Graphs splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Span 2): SVG Line charts for messages and Campaigns list */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Custom SVG Line graph */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-neutral-200 text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" /> Daily Outbound Traffic (30 Days)
              </h3>
              <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> June - July 2026
              </span>
            </div>

            {/* Line chart wrapper */}
            <div className="w-full bg-neutral-950/40 p-4 rounded-xl border border-neutral-900/60 overflow-hidden">
              {dailyData.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-neutral-600 text-xs">No daily logs compiled yet</div>
              ) : (
                <div className="relative">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40 overflow-visible">
                    {/* Fill Area Gradient */}
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#25D366" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#25D366" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <path
                      d={`M0,${chartHeight} L${points} L${chartWidth},${chartHeight} Z`}
                      fill="url(#gradient)"
                    />
                    
                    {/* Stroke line */}
                    <polyline
                      fill="none"
                      stroke="#25D366"
                      strokeWidth="2.5"
                      points={points}
                      className="transition-all duration-500"
                    />

                    {/* Simple Y grid markers */}
                    <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#333" strokeDasharray="3,3" />
                    <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#444" />
                  </svg>
                  
                  {/* Timeline labels */}
                  <div className="flex justify-between text-[8px] text-neutral-500 mt-2 font-mono uppercase">
                    <span>30 Days Ago</span>
                    <span>15 Days Ago</span>
                    <span>Today</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Campaign metrics ledger */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-4">
            <h3 className="font-bold text-neutral-200 text-sm flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-primary" /> Campaigns Performance
            </h3>
            
            <div className="space-y-3">
              {campaignData.length === 0 ? (
                <p className="text-center text-[10px] text-neutral-500 py-6">No outbound campaigns run yet.</p>
              ) : (
                campaignData.map((c, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-neutral-850 bg-neutral-950/20 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                        {c.type}
                      </span>
                      <h4 className="font-bold text-neutral-250 mt-1">{c.name}</h4>
                      <span className="text-[10px] text-neutral-500 mt-0.5 block">Status: <span className="font-bold text-neutral-400">{c.status}</span></span>
                    </div>

                    <div className="flex gap-6 items-center shrink-0">
                      <div className="text-right">
                        <span className="block text-[10px] text-neutral-500 font-semibold uppercase">Dispatched</span>
                        <span className="font-bold text-neutral-300">{c.sent} msgs</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-neutral-500 font-semibold uppercase">Success</span>
                        <span className="font-extrabold text-green-400">{c.successRate}%</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Lead stages Funnel and Best selling products */}
        <div className="space-y-8">
          
          {/* Lead conversion funnel widget */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-4">
            <h3 className="font-bold text-neutral-200 text-sm flex items-center gap-1.5">
              <Layers3 className="w-4 h-4 text-indigo-400" /> Conversion Lead Funnel
            </h3>
            
            <div className="space-y-3.5 pt-2">
              {funnelStages.map((stage, index) => (
                <div key={index} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-neutral-350">{stage.stage}</span>
                    <span className="font-mono text-neutral-500">{stage.count} ({stage.pct}%)</span>
                  </div>
                  {/* Funnel width simulation bar */}
                  <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-900">
                    <div
                      className={`h-full bg-indigo-500 transition-all duration-500`}
                      style={{ width: `${stage.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Selling Products */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-4">
            <h3 className="font-bold text-neutral-200 text-sm flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500 animate-pulse" /> Hot Products
            </h3>
            
            <div className="space-y-3.5">
              {topProducts.map((p, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-neutral-850 bg-neutral-950/20 text-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-200 block">{p.name}</span>
                    <span className="text-[10px] text-neutral-500 block">Stock: {p.stock}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-green-400 block">₹{p.value.toFixed(2)}</span>
                    <span className="text-[9px] text-neutral-500 block">{p.sales} orders</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
