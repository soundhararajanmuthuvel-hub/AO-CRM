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
  Clock,
  Briefcase,
  AlertTriangle,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Activity,
  Flame,
  CheckSquare
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalCustomers: number;
  newLeads: number;
  hotLeads: number;
  ordersToday: number;
  revenueToday: number;
  revenueThisMonth: number;
  unreadMessages: number;
  pendingFollowUps: number;
  openTasks: number;
  whatsappStatus: string;
  successRate: number;
  totalSyncedMessages: number;
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

interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  Contact?: { name: string; phone: string };
}

interface OrderItem {
  id: string;
  customerName: string;
  totalValue: number;
  status: string;
  createdAt: string;
}

interface ChatHead {
  id: string;
  chatId: string;
  name: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  customerStatus: string;
}

interface ContactItem {
  id: string;
  name: string;
  phone: string;
  leadStage: string;
  leadScore: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLogs, setRecentLogs] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [chats, setChats] = useState<ChatHead[]>([]);
  const [newLeadsList, setNewLeadsList] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Charts data states
  const [revenueTrend, setRevenueTrend] = useState<{ date: string; revenue: number }[]>([]);
  const [salesTrend, setSalesTrend] = useState<{ date: string; sales: number }[]>([]);
  const [leadConversion, setLeadConversion] = useState<{ stage: string; count: number }[]>([]);
  const [customerGrowth, setCustomerGrowth] = useState<{ date: string; customers: number }[]>([]);
  const [productPerformance, setProductPerformance] = useState<{ name: string; sales: number; value: number }[]>([]);

  // Quick Send Form
  const [quickPhone, setQuickPhone] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [sendingQuick, setSendingQuick] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState('');
  const [quickError, setQuickError] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes, tasksRes, ordersRes, chatsRes, contactsRes, trendRes] = await Promise.all([
        api.get('/analytics/stats'),
        api.get('/whatsapp/logs'),
        api.get('/tasks'),
        api.get('/orders'),
        api.get('/whatsapp/chats'),
        api.get('/contacts'),
        api.get('/analytics/logs')
      ]);

      setStats(statsRes.data);
      setRecentLogs(logsRes.data.slice(0, 5));
      setTasks(tasksRes.data.filter((t: any) => t.status === 'Pending').slice(0, 4));
      setRecentOrders(ordersRes.data.slice(0, 5));
      setChats(chatsRes.data.slice(0, 5));
      setNewLeadsList(contactsRes.data.contacts.filter((c: any) => c.leadStage === 'New').slice(0, 4));

      // Charts datasets
      setRevenueTrend(trendRes.data.revenueTrend || []);
      setSalesTrend(trendRes.data.salesTrend || []);
      setLeadConversion(trendRes.data.leadConversion || []);
      setCustomerGrowth(trendRes.data.customerGrowth || []);
      setProductPerformance(trendRes.data.productPerformance || []);

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
      <div className="flex h-screen w-full items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs text-neutral-400 font-medium font-mono uppercase tracking-widest">Loading Cusman CRM...</span>
        </div>
      </div>
    );
  }

  const isConnected = stats?.whatsappStatus === 'Connected' || stats?.whatsappStatus === 'READY';

  // AI Recommendation Engine Generator
  const getAIRecommendations = () => {
    const list = [];
    if (stats && stats.unreadMessages > 0) {
      list.push(`You have ${stats.unreadMessages} unread WhatsApp messages. Answer them promptly to maintain a high conversion rate.`);
    }
    if (stats && stats.pendingFollowUps > 0) {
      list.push(`You have ${stats.pendingFollowUps} pending follow ups scheduled today. Follow up to push qualified leads to the negotiation phase.`);
    }
    if (productPerformance.length > 0) {
      const topProd = productPerformance[0];
      list.push(`"${topProd.name}" is your best performing product this month. Consider launching an upsell campaign targeting recent buyers.`);
    }
    // Low stock warning recommendation
    list.push("Beetroot Malt stock is down to 90 units. Alert your manufacturing unit or prepare a replenishment PO.");
    return list;
  };

  const aiRecs = getAIRecommendations();

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-100 flex items-center gap-2">
            CUSMAN GROWTH HUB <Activity className="w-5 h-5 text-primary animate-pulse" />
          </h1>
          <p className="text-sm text-neutral-400">AI-Powered Customer Growth Platform by DK's Technologies</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-350 hover:bg-neutral-800 transition-all cursor-pointer shadow"
        >
          Refresh Live Metrics
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/50 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
          <span>{error}</span>
        </div>
      )}

      {/* 9 KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-4">
        
        {/* Total Customers */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/10 backdrop-blur-sm flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wide">Total Customers</span>
            <Users className="w-4 h-4 text-emerald-450 shrink-0" />
          </div>
          <span className="text-xl font-black text-neutral-100">{stats?.totalCustomers || 0}</span>
        </div>

        {/* New Leads */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/10 backdrop-blur-sm flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wide">New Leads</span>
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          </div>
          <span className="text-xl font-black text-neutral-100">{stats?.newLeads || 0}</span>
        </div>

        {/* Hot Leads */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/10 backdrop-blur-sm flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wide">Hot Leads</span>
            <Flame className="w-4 h-4 text-red-400 shrink-0" />
          </div>
          <span className="text-xl font-black text-neutral-100">{stats?.hotLeads || 0}</span>
        </div>

        {/* Today's Orders */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/10 backdrop-blur-sm flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wide">Today's Orders</span>
            <ShoppingCart className="w-4 h-4 text-blue-400 shrink-0" />
          </div>
          <span className="text-xl font-black text-neutral-100">{stats?.ordersToday || 0}</span>
        </div>

        {/* Revenue Today */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/10 backdrop-blur-sm flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wide">Revenue Today</span>
            <DollarSign className="w-4 h-4 text-green-400 shrink-0" />
          </div>
          <span className="text-md font-black text-neutral-100 truncate">₹{parseFloat(stats?.revenueToday as any || 0).toFixed(0)}</span>
        </div>

        {/* Revenue This Month */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/10 backdrop-blur-sm flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wide">Rev. Month</span>
            <DollarSign className="w-4 h-4 text-teal-400 shrink-0" />
          </div>
          <span className="text-md font-black text-neutral-100 truncate">₹{parseFloat(stats?.revenueThisMonth as any || 0).toFixed(0)}</span>
        </div>

        {/* Unread Messages */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/10 backdrop-blur-sm flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wide">Unread Chats</span>
            <MessageSquare className="w-4 h-4 text-purple-400 shrink-0" />
          </div>
          <span className="text-xl font-black text-neutral-100">{stats?.unreadMessages || 0}</span>
        </div>

        {/* Pending Follow Ups */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/10 backdrop-blur-sm flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wide">Follow Ups</span>
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <span className="text-xl font-black text-neutral-100">{stats?.pendingFollowUps || 0}</span>
        </div>

        {/* Open Tasks */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/10 backdrop-blur-sm flex flex-col justify-between h-28 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wide">Open Tasks</span>
            <CheckSquare className="w-4 h-4 text-pink-400 shrink-0" />
          </div>
          <span className="text-xl font-black text-neutral-100">{stats?.openTasks || 0}</span>
        </div>

      </div>

      {/* 5 SVG Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        
        {/* Revenue Trend - Area Line Chart (Col span 3) */}
        <div className="lg:col-span-3 p-6 rounded-2xl border border-neutral-800 bg-neutral-900/5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-450" /> Revenue Growth Trend (30 Days)
            </h3>
            <span className="text-[9px] font-bold text-green-400">₹{revenueTrend.reduce((a, b) => a + b.revenue, 0).toFixed(0)} Sum</span>
          </div>

          <div className="relative bg-neutral-950/30 p-4 rounded-xl border border-neutral-900/50">
            {revenueTrend.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-neutral-600">Generating revenue trend logs...</div>
            ) : (
              <div>
                <svg viewBox="0 0 600 160" className="w-full h-44 overflow-visible">
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="40" x2="600" y2="40" stroke="#1f1f1f" strokeDasharray="3,3" />
                  <line x1="0" y1="80" x2="600" y2="80" stroke="#1f1f1f" strokeDasharray="3,3" />
                  <line x1="0" y1="120" x2="600" y2="120" stroke="#1f1f1f" strokeDasharray="3,3" />

                  {/* Area fill */}
                  <path
                    d={`M0,160 L${revenueTrend.map((r, idx) => `${(idx / (revenueTrend.length - 1)) * 600},${160 - (r.revenue / Math.max(...revenueTrend.map(d=>d.revenue), 1000)) * 140}`).join(' ')} L600,160 Z`}
                    fill="url(#revGrad)"
                  />
                  
                  {/* Stroke path */}
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    points={revenueTrend.map((r, idx) => `${(idx / (revenueTrend.length - 1)) * 600},${160 - (r.revenue / Math.max(...revenueTrend.map(d=>d.revenue), 1000)) * 140}`).join(' ')}
                  />

                  {/* Grid base line */}
                  <line x1="0" y1="160" x2="600" y2="160" stroke="#333" />
                </svg>
                <div className="flex justify-between text-[8px] text-neutral-500 font-mono mt-1 pt-1 border-t border-neutral-900">
                  <span>30 DAYS AGO</span>
                  <span>15 DAYS AGO</span>
                  <span>TODAY</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Growth - Area Line Chart (Col span 3) */}
        <div className="lg:col-span-3 p-6 rounded-2xl border border-neutral-800 bg-neutral-900/5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Customer Growth Cumulative
            </h3>
            <span className="text-[9px] font-bold text-indigo-400">↑ Cumulative Accounts</span>
          </div>

          <div className="relative bg-neutral-950/30 p-4 rounded-xl border border-neutral-900/50">
            {customerGrowth.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-neutral-600">Analyzing subscriber growth...</div>
            ) : (
              <div>
                <svg viewBox="0 0 600 160" className="w-full h-44 overflow-visible">
                  <defs>
                    <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  <line x1="0" y1="40" x2="600" y2="40" stroke="#1f1f1f" strokeDasharray="3,3" />
                  <line x1="0" y1="80" x2="600" y2="80" stroke="#1f1f1f" strokeDasharray="3,3" />
                  <line x1="0" y1="120" x2="600" y2="120" stroke="#1f1f1f" strokeDasharray="3,3" />

                  {/* Area fill */}
                  <path
                    d={`M0,160 L${customerGrowth.map((c, idx) => `${(idx / (customerGrowth.length - 1)) * 600},${160 - (c.customers / Math.max(...customerGrowth.map(d=>d.customers), 10)) * 140}`).join(' ')} L600,160 Z`}
                    fill="url(#custGrad)"
                  />
                  
                  {/* Stroke path */}
                  <polyline
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="2.5"
                    points={customerGrowth.map((c, idx) => `${(idx / (customerGrowth.length - 1)) * 600},${160 - (c.customers / Math.max(...customerGrowth.map(d=>d.customers), 10)) * 140}`).join(' ')}
                  />

                  <line x1="0" y1="160" x2="600" y2="160" stroke="#333" />
                </svg>
                <div className="flex justify-between text-[8px] text-neutral-500 font-mono mt-1 pt-1 border-t border-neutral-900">
                  <span>30 DAYS AGO</span>
                  <span>15 DAYS AGO</span>
                  <span>TODAY</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sales Trend - Bar Chart (Col span 2) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-800 bg-neutral-900/5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-450" /> Orders Placed Volumetrics
          </h3>

          <div className="relative bg-neutral-950/30 p-4 rounded-xl border border-neutral-900/50 h-[190px] flex items-end justify-between">
            {salesTrend.length === 0 ? (
              <div className="w-full text-center text-xs text-neutral-600 pb-16">Loading orders logs...</div>
            ) : (
              salesTrend.map((s, idx) => {
                const maxVal = Math.max(...salesTrend.map(x => x.sales), 5);
                const heightPercent = (s.sales / maxVal) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 w-[2.5%] group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded text-[8px] font-mono text-neutral-200 hidden group-hover:block z-20 whitespace-nowrap">
                      {s.sales} Orders ({s.date.split('-')[2]})
                    </div>
                    <div 
                      className="w-full bg-blue-500/80 hover:bg-blue-400 rounded-t transition-all cursor-pointer"
                      style={{ height: `${Math.max(heightPercent, 8)}%` }}
                    />
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-between text-[8px] text-neutral-500 font-mono">
            <span>30 DAYS AGO</span>
            <span>TODAY</span>
          </div>
        </div>

        {/* Lead Conversion - Funnel Chart (Col span 2) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-800 bg-neutral-900/5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" /> Pipeline Deal Funnel
          </h3>

          <div className="space-y-2 pt-1">
            {leadConversion.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-neutral-600">Calculating deal pipelines...</div>
            ) : (
              leadConversion.map((l, idx) => {
                const maxCount = Math.max(...leadConversion.map(x => x.count), 5);
                const widthPercent = (l.count / maxCount) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-neutral-350">
                      <span>{l.stage}</span>
                      <span className="font-mono text-neutral-500">{l.count}</span>
                    </div>
                    <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden border border-neutral-900">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-450 rounded-full"
                        style={{ width: `${Math.max(widthPercent, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Product Performance - Horizontal Rank Chart (Col span 2) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-800 bg-neutral-900/5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-400" /> Product Performance
          </h3>

          <div className="space-y-3.5 pt-1">
            {productPerformance.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-neutral-600">Compiling best selling lists...</div>
            ) : (
              productPerformance.map((p, idx) => {
                const maxSales = Math.max(...productPerformance.map(x => x.sales), 1);
                const widthPercent = (p.sales / maxSales) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-neutral-300">
                      <span className="truncate max-w-[130px]">{p.name}</span>
                      <span className="font-mono text-green-400 text-[9px]">₹{p.value.toFixed(0)} ({p.sales}u)</span>
                    </div>
                    <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden border border-neutral-900">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.max(widthPercent, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Main Grid: Status, Quick Send, and 5 Action Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side (Col Span 2): Connection, Quick Send & Live Widgets */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Connection Gateway Widget */}
          <div className={`p-6 rounded-2xl border ${isConnected ? 'border-green-500/25 bg-green-500/5' : 'border-neutral-800 bg-neutral-900/20'} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                isConnected
                  ? 'bg-green-500/10 border-green-500/30 text-green-400 animate-pulse'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-500'
              }`}>
                {isConnected ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200 text-sm">WhatsApp Business Gateway</h3>
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
              {isConnected ? 'Manage Devices' : 'Link Device (Get QR)'}
            </Link>
          </div>

          {/* AI Recommendations Widget */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 backdrop-blur-sm space-y-4">
            <h3 className="font-bold text-neutral-200 text-xs uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Cusman AI Growth Recommendations
            </h3>
            <div className="space-y-3">
              {aiRecs.map((rec, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-neutral-850 bg-neutral-950/20 text-xs flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{idx + 1}</span>
                  <p className="text-neutral-400 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Send Message Box */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
            <h3 className="font-bold text-neutral-200 mb-2 text-sm flex items-center gap-2">
              Quick Outreach Dispatch <Send className="w-4 h-4 text-primary" />
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
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-200 placeholder-neutral-600 focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Message Box</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter message text... supports emoji"
                  value={quickMessage}
                  onChange={(e) => setQuickMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-200 placeholder-neutral-600 resize-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {quickSuccess && <div className="text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-lg">{quickSuccess}</div>}
              {quickError && <div className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{quickError}</div>}

              <button
                type="submit"
                disabled={sendingQuick || !isConnected}
                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  !isConnected
                    ? 'bg-neutral-900 border border-neutral-850 text-neutral-600 cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/20'
                }`}
              >
                {sendingQuick ? 'Dispatching...' : !isConnected ? 'Gateway Offline (Link WhatsApp to Send)' : 'Send Outbound Message'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Dynamic Lists (Today's Follow Ups, New Leads, Recent Orders, Conversations) */}
        <div className="space-y-6">
          
          {/* Today's Follow Ups Widget */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
            <h3 className="font-bold text-neutral-200 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" /> Pending Follow Ups
            </h3>
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-600">No pending follow-ups today.</div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-xl border border-neutral-850 bg-neutral-950/20 text-xs space-y-1 hover:border-neutral-750 transition-colors">
                    <span className="font-bold text-neutral-250 block">{task.title}</span>
                    <div className="flex justify-between items-center text-[10px] text-neutral-500">
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      {task.Contact && <span className="text-primary font-medium">{task.Contact.name}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New Leads Widget */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
            <h3 className="font-bold text-neutral-200 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> New Leads Pipeline
            </h3>
            <div className="space-y-3">
              {newLeadsList.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-600">No new pipeline leads.</div>
              ) : (
                newLeadsList.map((lead) => (
                  <div key={lead.id} className="p-3 rounded-xl border border-neutral-850 bg-neutral-950/20 text-xs flex justify-between items-center hover:border-neutral-750 transition-colors">
                    <div>
                      <span className="font-bold text-neutral-250 block">{lead.name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">{lead.phone}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      lead.leadScore === 'Hot' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {lead.leadScore}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Orders Widget */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
            <h3 className="font-bold text-neutral-200 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-400" /> Recent Sales Orders
            </h3>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-600">No recent orders placed.</div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="p-3 rounded-xl border border-neutral-850 bg-neutral-950/20 text-xs flex justify-between items-center hover:border-neutral-750 transition-colors">
                    <div>
                      <span className="font-bold text-neutral-250 block">{order.customerName}</span>
                      <span className="text-[10px] text-neutral-500">Status: <span className="font-bold uppercase text-neutral-450">{order.status}</span></span>
                    </div>
                    <span className="font-black text-green-400 text-xs">₹{parseFloat(order.totalValue as any || 0).toFixed(0)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Conversations Widget */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
            <h3 className="font-bold text-neutral-200 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" /> Recent Conversations
            </h3>
            <div className="space-y-3">
              {chats.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-600">No conversations synced.</div>
              ) : (
                chats.map((chat) => (
                  <div key={chat.id} className="p-3 rounded-xl border border-neutral-850 bg-neutral-950/20 text-xs flex justify-between items-center hover:border-neutral-750 transition-colors">
                    <div className="truncate max-w-[170px]">
                      <span className="font-bold text-neutral-250 block truncate">{chat.name}</span>
                      <span className="text-[10px] text-neutral-500 block truncate">{chat.lastMessage || 'Connected'}</span>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground font-black text-[9px] flex items-center justify-center animate-bounce">{chat.unreadCount}</span>
                    )}
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
