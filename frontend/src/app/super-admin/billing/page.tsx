'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface BillingRecord {
  id: string;
  workspaceName: string;
  amount: number;
  currency: string;
  paymentGateway: string;
  gatewayPaymentId: string | null;
  status: string;
  planName: string;
  type: string;
  createdAt: string;
}

export default function BillingManagementPage() {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState('');

  const loadBilling = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/billing');
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to load billing records:', err);
      setError('Could not load transaction archives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const totalCollected = records
    .filter(r => r.status === 'success')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const pendingCollected = records
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const failedCollected = records
    .filter(r => r.status === 'failed')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const filtered = records.filter(r => {
    const matchesSearch = r.workspaceName.toLowerCase().includes(search.toLowerCase()) || 
                          (r.gatewayPaymentId && r.gatewayPaymentId.toLowerCase().includes(search.toLowerCase()));
    const matchesGateway = gatewayFilter === 'All' || r.paymentGateway === gatewayFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter.toLowerCase();
    
    return matchesSearch && matchesGateway && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
          Billing & Payments Audit
        </h1>
        <p className="text-sm text-neutral-400">Track lifetime company payments, pending renewals, and transactional histories.</p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-3">
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Total Success Income</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-green-400">₹{totalCollected.toLocaleString('en-IN')}</span>
            <span className="text-xs text-neutral-400 font-semibold font-mono">INR</span>
          </div>
          <span className="text-[10px] text-neutral-500 block">Cleared Stripe/Razorpay invoices</span>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-3">
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Pending Collections</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">₹{pendingCollected.toLocaleString('en-IN')}</span>
            <span className="text-xs text-neutral-400 font-semibold font-mono">INR</span>
          </div>
          <span className="text-[10px] text-neutral-500 block">Awaiting webhook callback alerts</span>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-3">
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Declined / Failed Totals</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-400">₹{failedCollected.toLocaleString('en-IN')}</span>
            <span className="text-xs text-neutral-400 font-semibold font-mono">INR</span>
          </div>
          <span className="text-[10px] text-neutral-500 block">Requires renewal retry notification</span>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="w-4.5 h-4.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company or gateway reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 placeholder-neutral-600"
          />
        </div>

        {/* Gateways */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-400"
          >
            <option value="All">All Gateways</option>
            <option value="Stripe">Stripe</option>
            <option value="Razorpay">Razorpay</option>
            <option value="Manual">Manual overrides</option>
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-400"
          >
            <option value="All">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <button
          onClick={loadBilling}
          className="p-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-neutral-400 transition-all ml-auto"
          title="Refresh Invoices"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500 uppercase font-semibold">
                <th className="pb-3 font-semibold">Workspace Name</th>
                <th className="pb-3 font-semibold">Transaction Reference</th>
                <th className="pb-3 font-semibold">Amount / Gateway</th>
                <th className="pb-3 font-semibold">Type & Plan</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Payment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40">
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    No transactions matched your filter conditions.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isSuccess = r.status === 'success';
                  const isFailed = r.status === 'failed';
                  
                  return (
                    <tr key={r.id} className="hover:bg-neutral-900/25 group font-medium text-neutral-350">
                      <td className="py-4 pr-4 font-bold text-neutral-200 text-sm">{r.workspaceName}</td>
                      <td className="py-4 pr-4 font-mono text-[10px] text-neutral-450">{r.gatewayPaymentId || 'REF-N/A'}</td>
                      <td className="py-4 pr-4">
                        <span className="block font-bold text-neutral-200 font-mono text-xs">
                          ₹{Number(r.amount).toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[10px] text-neutral-550 capitalize mt-0.5">{r.paymentGateway}</span>
                      </td>
                      <td className="py-4 pr-4 text-[11px]">
                        <span className="block uppercase font-bold text-[10px] text-primary">{r.planName} plan</span>
                        <span className="block text-neutral-500 text-[10px] mt-0.5 capitalize">{r.type.replace('_', ' ')}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          isSuccess
                            ? 'bg-green-500/10 text-green-450 border-green-500/20'
                            : isFailed
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 text-right text-neutral-500 font-mono text-[10px]">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
