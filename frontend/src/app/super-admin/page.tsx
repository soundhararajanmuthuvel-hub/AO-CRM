'use client';

import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import {
  Users,
  Building,
  CreditCard,
  MessageSquare,
  TrendingUp,
  Inbox,
  AlertCircle,
  Clock,
  Sparkles,
  DollarSign
} from 'lucide-react';

interface Stats {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  expiredCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  totalWhatsAppAccounts: number;
  totalLeads: number;
  totalOrders: number;
  totalRevenue: number;
  mrr: number;
  newSignupsToday: number;
}

interface CompanyGrowthPoint {
  month: string;
  count: number;
}

interface RevenueGrowthPoint {
  month: string;
  amount: number;
}

interface MessageUsagePoint {
  name: string;
  sent: number;
  limit: number;
}

interface SubscriptionTrendPoint {
  name: string;
  value: number;
}

interface Charts {
  companyGrowth: CompanyGrowthPoint[];
  revenueGrowth: RevenueGrowthPoint[];
  messageUsage: MessageUsagePoint[];
  subscriptionTrends: SubscriptionTrendPoint[];
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/super-admin/stats');
        setStats(res.data.stats);
        setCharts(res.data.charts);
      } catch (err) {
        console.error('Failed to load super admin stats:', err);
        setError('Failed to fetch platform analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats || !charts) {
    return (
      <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/50 text-red-300 text-sm flex items-center gap-3">
        <AlertCircle className="w-4 h-4" />
        <span>{error || 'Failed to initialize administrative data.'}</span>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Companies', value: stats.totalCompanies, subtitle: `${stats.activeCompanies} Active, ${stats.trialCompanies} Trial`, icon: Building, color: 'text-emerald-400 bg-emerald-500/10' },
    { title: 'Total Active Users', value: stats.totalUsers, subtitle: `${stats.newSignupsToday} registered today`, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
    { title: 'Linked WA Channels', value: stats.totalWhatsAppAccounts, subtitle: 'Live WhatsApp Sessions', icon: MessageSquare, color: 'text-cyan-400 bg-cyan-500/10' },
    { title: 'Monthly Recurring Revenue', value: `₹${stats.mrr.toLocaleString('en-IN')}`, subtitle: 'Active MRR Estimate', icon: DollarSign, color: 'text-amber-400 bg-amber-500/10' },
    { title: 'Gross Revenue Recieved', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, subtitle: 'Lifetime success payments', icon: CreditCard, color: 'text-pink-400 bg-pink-500/10' },
    { title: 'Platform CRM Leads', value: stats.totalLeads, subtitle: 'Synced contacts database', icon: Users, color: 'text-purple-400 bg-purple-500/10' },
    { title: 'Total Orders Handled', value: stats.totalOrders, subtitle: 'Processed via Kanban Board', icon: Inbox, color: 'text-indigo-400 bg-indigo-500/10' },
    { title: 'Expired Plans', value: stats.expiredCompanies, subtitle: 'Requires attention', icon: Clock, color: 'text-red-400 bg-red-500/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
          InboxIQ Admin Control <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Super Admin</span>
        </h1>
        <p className="text-sm text-neutral-400">Complete multi-tenant operations, billing audits, system configuration, and support monitoring.</p>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/20 backdrop-blur hover:border-neutral-700 transition-all space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-neutral-150 block">{card.value}</span>
                <span className="text-[10px] text-neutral-500 font-medium block mt-1">{card.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid of Custom Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Company & Subscription Trends (Line Graph + Bar Graph mock layout with beautiful SVG) */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-neutral-200">Company Growth & Plan Shares</h3>
            <p className="text-[11px] text-neutral-500">Track registration growth curves and plan tiers.</p>
          </div>
          
          <div className="space-y-6">
            {/* SVG Line Graph for Company Growth */}
            <div className="relative h-48 bg-neutral-950/40 rounded-xl p-4 border border-neutral-800/60">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Horizontal grid lines */}
                <line x1="0" y1="10" x2="100" y2="10" stroke="#262626" strokeWidth="0.2" />
                <line x1="0" y1="20" x2="100" y2="20" stroke="#262626" strokeWidth="0.2" />
                <line x1="0" y1="30" x2="100" y2="30" stroke="#262626" strokeWidth="0.2" />
                {/* Area under the line */}
                <path d="M 0 40 L 0 35 L 20 28 L 40 22 L 60 15 L 80 8 L 100 5 L 100 40 Z" fill="url(#growthGrad)" />
                {/* Trend line */}
                <path d="M 0 35 L 20 28 L 40 22 L 60 15 L 80 8 L 100 5" fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
                {/* Dots at data points */}
                <circle cx="0" cy="35" r="1.5" fill="#10b981" />
                <circle cx="20" cy="28" r="1.5" fill="#10b981" />
                <circle cx="40" cy="22" r="1.5" fill="#10b981" />
                <circle cx="60" cy="15" r="1.5" fill="#10b981" />
                <circle cx="80" cy="8" r="1.5" fill="#10b981" />
                <circle cx="100" cy="5" r="1.5" fill="#10b981" />
              </svg>
              <div className="absolute inset-0 flex justify-between px-4 pt-4 text-[9px] text-neutral-600 pointer-events-none">
                <span>0 Companies</span>
                <span>{stats.totalCompanies} Companies</span>
              </div>
              <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[8px] text-neutral-500 font-semibold uppercase tracking-wider">
                {charts.companyGrowth.map((point, idx) => (
                  <span key={idx}>{point.month}</span>
                ))}
              </div>
            </div>

            {/* Plan distribution bars */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-neutral-400 block mb-2">Subscription Share</span>
              {charts.subscriptionTrends.map((trend, i) => {
                const totalVal = charts.subscriptionTrends.reduce((sum, item) => sum + item.value, 0) || 1;
                const percentage = Math.round((trend.value / totalVal) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-neutral-350">{trend.name} Plan</span>
                      <span className="text-neutral-500">{trend.value} active ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded bg-neutral-900 border border-neutral-800/80 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Platform Revenue & Message Traffic (SVG Line Chart & Usage Table) */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-neutral-200">Revenue Streams & API Usage</h3>
            <p className="text-[11px] text-neutral-500">Verify monthly transactions and messaging counts.</p>
          </div>
          
          <div className="space-y-6">
            {/* SVG Line Graph for Revenue growth */}
            <div className="relative h-48 bg-neutral-950/40 rounded-xl p-4 border border-neutral-800/60">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                <line x1="0" y1="10" x2="100" y2="10" stroke="#262626" strokeWidth="0.2" />
                <line x1="0" y1="20" x2="100" y2="20" stroke="#262626" strokeWidth="0.2" />
                <line x1="0" y1="30" x2="100" y2="30" stroke="#262626" strokeWidth="0.2" />
                <path d="M 0 40 L 0 38 L 20 32 L 40 25 L 60 18 L 80 12 L 100 6 L 100 40 Z" fill="url(#revGrad)" />
                <path d="M 0 38 L 20 32 L 40 25 L 60 18 L 80 12 L 100 6" fill="none" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="0" cy="38" r="1.5" fill="#3b82f6" />
                <circle cx="20" cy="32" r="1.5" fill="#3b82f6" />
                <circle cx="40" cy="25" r="1.5" fill="#3b82f6" />
                <circle cx="60" cy="18" r="1.5" fill="#3b82f6" />
                <circle cx="80" cy="12" r="1.5" fill="#3b82f6" />
                <circle cx="100" cy="6" r="1.5" fill="#3b82f6" />
              </svg>
              <div className="absolute inset-0 flex justify-between px-4 pt-4 text-[9px] text-neutral-600 pointer-events-none">
                <span>₹0</span>
                <span>₹{stats.totalRevenue} Gross</span>
              </div>
              <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[8px] text-neutral-500 font-semibold uppercase tracking-wider">
                {charts.revenueGrowth.map((point, idx) => (
                  <span key={idx}>{point.month}</span>
                ))}
              </div>
            </div>

            {/* Message Usage Diagnostics */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-neutral-400 block mb-2">High-Volume Tenancy Workspaces</span>
              <div className="border border-neutral-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-900 border-b border-neutral-800 text-neutral-500 font-semibold">
                      <th className="px-4 py-2 font-semibold text-[10px]">Workspace Name</th>
                      <th className="px-4 py-2 font-semibold text-[10px] text-right">Messages Sent</th>
                      <th className="px-4 py-2 font-semibold text-[10px] text-right">Plan Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40 text-neutral-400 font-medium">
                    {charts.messageUsage.map((m, i) => (
                      <tr key={i} className="hover:bg-neutral-900/20">
                        <td className="px-4 py-2.5 text-neutral-300 font-semibold">{m.name}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-primary">{m.sent.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{m.limit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
