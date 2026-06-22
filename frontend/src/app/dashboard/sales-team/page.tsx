'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import {
  Users,
  MapPin,
  Map,
  Calendar,
  Trophy,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award,
  ChevronRight,
  Clock,
  Notebook
} from 'lucide-react';

interface Executive {
  id: string;
  name: string;
  email: string;
  role: string;
  totalSales: number;
  totalOrders: number;
  conversionRate: number;
}

interface Territory {
  id: string;
  name: string;
  code: string;
}

interface Route {
  id: string;
  name: string;
  description: string;
  Territory?: Territory;
}

interface Visit {
  id: string;
  visitDate: string;
  status: 'Pending' | 'Visited' | 'Rescheduled' | 'Cancelled';
  notes: string;
  User?: { name: string };
  Contact?: { name: string; phone: string; city: string; company: string };
}

export default function SalesTeamPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'territories' | 'visits'>('leaderboard');

  // Modal forms
  const [isTerritoryModalOpen, setIsTerritoryModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  // Form states
  const [terrName, setTerrName] = useState('');
  const [terrCode, setTerrCode] = useState('');
  
  const [routeTerrId, setRouteTerrId] = useState('');
  const [routeName, setRouteName] = useState('');
  const [routeDesc, setRouteDesc] = useState('');

  const [visitExecId, setVisitExecId] = useState('');
  const [visitContactId, setVisitContactId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [execRes, terrRes, routeRes, visitRes, contactRes] = await Promise.all([
        api.get('/sales-team/leaderboard'),
        api.get('/sales-team/territories'),
        api.get('/sales-team/routes'),
        api.get('/sales-team/visits'),
        api.get('/contacts')
      ]);
      setExecutives(execRes.data);
      setTerritories(terrRes.data);
      setRoutes(routeRes.data);
      setVisits(visitRes.data);
      setContacts(contactRes.data || []);
    } catch (err) {
      console.error('Failed to load sales team metadata:', err);
      setError('Could not retrieve sales team data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTerritory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!terrName) return;

    try {
      await api.post('/sales-team/territories', { name: terrName, code: terrCode });
      setSuccess('Territory created successfully.');
      setIsTerritoryModalOpen(false);
      setTerrName('');
      setTerrCode('');
      loadData();
    } catch (err) {
      setError('Failed to create territory.');
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!routeName || !routeTerrId) return;

    try {
      await api.post('/sales-team/routes', { territoryId: routeTerrId, name: routeName, description: routeDesc });
      setSuccess('Sales route created successfully.');
      setIsRouteModalOpen(false);
      setRouteName('');
      setRouteDesc('');
      setRouteTerrId('');
      loadData();
    } catch (err) {
      setError('Failed to create route.');
    }
  };

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!visitExecId || !visitContactId || !visitDate) return;

    try {
      await api.post('/sales-team/visits', {
        executiveId: visitExecId,
        contactId: visitContactId,
        visitDate,
        notes: visitNotes
      });
      setSuccess('Visit scheduled successfully.');
      setIsVisitModalOpen(false);
      setVisitExecId('');
      setVisitContactId('');
      setVisitDate('');
      setVisitNotes('');
      loadData();
    } catch (err) {
      setError('Failed to schedule visit.');
    }
  };

  const handleToggleVisitStatus = async (visitId: string, currentStatus: string) => {
    setError('');
    setSuccess('');
    const nextStatus = currentStatus === 'Pending' ? 'Visited' : 'Pending';
    try {
      await api.put(`/sales-team/visits/${visitId}/status`, { status: nextStatus });
      setSuccess('Visit status updated successfully.');
      loadData();
    } catch (err) {
      setError('Failed to update visit status.');
    }
  };

  if (loading && executives.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Top 3 for pedestal representation
  const top1 = executives[0];
  const top2 = executives[1];
  const top3 = executives[2];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            Sales & Routes Manager <Users className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-neutral-400">Track Daily visits, map distribution routes, and manage executive leaderboards.</p>
        </div>
        
        {/* Buttons Panel */}
        <div className="flex gap-2">
          {activeTab === 'territories' && (
            <>
              <button
                onClick={() => setIsTerritoryModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-semibold text-xs hover:bg-neutral-800 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Territory
              </button>
              <button
                onClick={() => setIsRouteModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create Route
              </button>
            </>
          )}
          {activeTab === 'visits' && (
            <button
              onClick={() => setIsVisitModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Schedule Visit
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-lg bg-green-950/20 border border-green-800/50 text-green-300 text-sm flex items-center gap-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/50 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-neutral-800">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'leaderboard'
              ? 'border-primary text-neutral-100 bg-primary/5'
              : 'border-transparent text-neutral-450 hover:text-neutral-200'
          }`}
        >
          🏆 Executive Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('territories')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'territories'
              ? 'border-primary text-neutral-100 bg-primary/5'
              : 'border-transparent text-neutral-450 hover:text-neutral-200'
          }`}
        >
          📍 Territories & Routes
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'visits'
              ? 'border-primary text-neutral-100 bg-primary/5'
              : 'border-transparent text-neutral-450 hover:text-neutral-200'
          }`}
        >
          📅 Daily Outbox Visits
        </button>
      </div>

      {/* Tab content panel */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-12">
          
          {/* visual Podium pedestals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8 items-end">
            
            {/* Rank 2 Pedestal */}
            {top2 && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="w-14 h-14 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center font-bold text-neutral-300 text-xs shadow-md">
                  {top2.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="mt-3 text-center">
                  <h4 className="font-bold text-xs text-neutral-200">{top2.name}</h4>
                  <span className="text-[10px] text-green-400 font-extrabold block">₹{parseFloat(top2.totalSales as any).toFixed(2)}</span>
                </div>
                <div className="mt-4 w-full bg-neutral-900/60 border border-neutral-800/80 rounded-t-xl h-24 flex items-center justify-center flex-col space-y-1">
                  <span className="font-extrabold text-2xl text-neutral-400">2</span>
                  <span className="text-[8px] font-extrabold uppercase text-neutral-500 tracking-wider">Runner Up</span>
                </div>
              </div>
            )}

            {/* Rank 1 Pedestal (Center) */}
            {top1 && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-5 duration-500">
                <div className="relative">
                  <Award className="w-6 h-6 text-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
                  <div className="w-16 h-16 rounded-full border-2 border-amber-400 bg-neutral-900 flex items-center justify-center font-bold text-amber-400 text-sm shadow-lg shadow-amber-950/20">
                    {top1.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <h4 className="font-extrabold text-sm text-neutral-100">{top1.name}</h4>
                  <span className="text-xs text-green-400 font-black block mt-0.5">₹{parseFloat(top1.totalSales as any).toFixed(2)}</span>
                </div>
                <div className="mt-4 w-full bg-amber-500/10 border-2 border-amber-500/30 rounded-t-2xl h-36 flex items-center justify-center flex-col space-y-1 shadow-md shadow-amber-950/10">
                  <span className="font-black text-4xl text-amber-400">1</span>
                  <span className="text-[9px] font-extrabold uppercase text-amber-300 tracking-widest">Champion</span>
                </div>
              </div>
            )}

            {/* Rank 3 Pedestal */}
            {top3 && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500 delay-200">
                <div className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center font-bold text-neutral-450 text-xs shadow-md">
                  {top3.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="mt-3 text-center">
                  <h4 className="font-bold text-xs text-neutral-300">{top3.name}</h4>
                  <span className="text-[10px] text-green-400 font-extrabold block">₹{parseFloat(top3.totalSales as any).toFixed(2)}</span>
                </div>
                <div className="mt-4 w-full bg-neutral-900/60 border border-neutral-800/80 rounded-t-xl h-16 flex items-center justify-center flex-col space-y-1">
                  <span className="font-extrabold text-xl text-neutral-500">3</span>
                  <span className="text-[8px] font-extrabold uppercase text-neutral-600 tracking-wider">Third Place</span>
                </div>
              </div>
            )}

          </div>

          {/* Leaders Ledger Table */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-4">
            <h3 className="font-bold text-neutral-200 text-sm flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard Standing
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-neutral-850 text-neutral-500 uppercase text-[9px] font-bold">
                    <th className="pb-3.5 pl-2">Rank</th>
                    <th className="pb-3.5">Executive</th>
                    <th className="pb-3.5">Role</th>
                    <th className="pb-3.5 text-right">Orders</th>
                    <th className="pb-3.5 text-right">Revenue</th>
                    <th className="pb-3.5 text-right">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/50">
                  {executives.map((exec, idx) => (
                    <tr key={exec.id} className="hover:bg-neutral-900/20 transition-all text-neutral-200">
                      <td className="py-4 pl-2 font-bold text-neutral-450">{idx + 1}</td>
                      <td className="py-4">
                        <span className="font-bold text-neutral-200 block">{exec.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono mt-0.5">{exec.email}</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          exec.role === 'owner' ? 'bg-primary/10 text-primary border border-primary/20' :
                          exec.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-neutral-800 text-neutral-450'
                        }`}>
                          {exec.role}
                        </span>
                      </td>
                      <td className="py-4 text-right font-semibold">{exec.totalOrders}</td>
                      <td className="py-4 text-right font-extrabold text-green-400">₹{parseFloat(exec.totalSales as any).toFixed(2)}</td>
                      <td className="py-4 text-right font-bold text-neutral-400">{exec.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'territories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Territories lists (col-span 1) */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 h-full">
              <h3 className="font-bold text-neutral-200 text-sm flex items-center gap-1.5 mb-6">
                <MapPin className="w-4 h-4 text-primary" /> Active Territories
              </h3>
              
              {territories.length === 0 ? (
                <p className="text-center text-[10px] text-neutral-500 py-8">No territories created yet.</p>
              ) : (
                <div className="space-y-3">
                  {territories.map(t => (
                    <div key={t.id} className="p-3.5 rounded-xl border border-neutral-800/80 bg-neutral-950/20 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-neutral-250 block">{t.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono mt-0.5">Code: {t.code || 'N/A'}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-700" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Routes lists (col-span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 h-full">
              <h3 className="font-bold text-neutral-200 text-sm flex items-center gap-1.5 mb-6">
                <Map className="w-4 h-4 text-primary" /> Distribution Routes
              </h3>
              
              {routes.length === 0 ? (
                <p className="text-center text-[10px] text-neutral-500 py-12">No delivery routes designed.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {routes.map(r => (
                    <div key={r.id} className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/15 flex flex-col justify-between space-y-3 text-xs">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          📍 {r.Territory?.name || 'Unassigned'}
                        </span>
                        <h4 className="font-bold text-neutral-200 mt-2">{r.name}</h4>
                        <p className="text-neutral-450 mt-1 leading-relaxed">{r.description || 'No description.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'visits' && (
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
          <h3 className="font-bold text-neutral-200 text-sm flex items-center gap-1.5 mb-6">
            <Calendar className="w-4 h-4 text-primary" /> Schedule of Executive Visits
          </h3>
          
          {visits.length === 0 ? (
            <p className="text-center text-xs text-neutral-500 py-12">No customer visits mapped yet.</p>
          ) : (
            <div className="space-y-4">
              {visits.map(v => {
                const isPending = v.status === 'Pending';
                return (
                  <div key={v.id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-all ${
                    isPending ? 'border-amber-500/20 bg-amber-500/5' : 'border-neutral-800 bg-neutral-950/15'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          isPending ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'
                        }`}>
                          {v.status}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Visited Date: {new Date(v.visitDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div>
                        <strong>Client Outlets:</strong> <span className="text-neutral-300 font-bold">{v.Contact?.company || v.Contact?.name || 'General Outlet'}</span> (City: {v.Contact?.city || 'N/A'})
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-neutral-450 text-[11px]">
                        <Users className="w-3.5 h-3.5 text-neutral-600" /> Executive: <span className="font-bold text-neutral-350">{v.User?.name}</span>
                      </div>

                      {v.notes && (
                        <div className="text-[11px] text-neutral-400 bg-neutral-950/40 p-2 rounded border border-neutral-850 flex gap-1 items-start font-mono leading-relaxed mt-1.5 max-w-xl">
                          <Notebook className="w-3.5 h-3.5 text-neutral-650 shrink-0 mt-0.5" /> <span>{v.notes}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleVisitStatus(v.id, v.status)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all shrink-0 cursor-pointer ${
                        isPending
                          ? 'bg-amber-500 hover:bg-amber-600 text-black'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-250 hover:bg-neutral-800'
                      }`}
                    >
                      {isPending ? 'Mark as Visited' : 'Re-open Schedule'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 1. Territory Modal */}
      {isTerritoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-neutral-955 border border-neutral-800 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-xs text-neutral-200 uppercase tracking-wider">Setup Sales Territory</h3>
              <button onClick={() => setIsTerritoryModalOpen(false)} className="text-neutral-500"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddTerritory} className="p-4 space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Territory Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chennai Central"
                  value={terrName}
                  onChange={(e) => setTerrName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-200"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Territory Code</label>
                <input
                  type="text"
                  placeholder="e.g. CH-CTR-01"
                  value={terrCode}
                  onChange={(e) => setTerrCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-200 font-mono"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold uppercase rounded-lg hover:bg-primary/95">
                Register Territory
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-neutral-955 border border-neutral-800 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-xs text-neutral-200 uppercase tracking-wider">Create Route Layout</h3>
              <button onClick={() => setIsRouteModalOpen(false)} className="text-neutral-500"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddRoute} className="p-4 space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Select Territory *</label>
                <select
                  required
                  value={routeTerrId}
                  onChange={(e) => setRouteTerrId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-350 cursor-pointer font-bold"
                >
                  <option value="">-- Choose Territory --</option>
                  {territories.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Route Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T. Nagar Retail Route"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-200"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Description / Path</label>
                <textarea
                  rows={3}
                  placeholder="Describe delivery nodes or schedules..."
                  value={routeDesc}
                  onChange={(e) => setRouteDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-250 resize-none"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold uppercase rounded-lg hover:bg-primary/95">
                Save Route Layout
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Visit Modal */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-neutral-955 border border-neutral-800 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-xs text-neutral-200 uppercase tracking-wider">Schedule Client Visit</h3>
              <button onClick={() => setIsVisitModalOpen(false)} className="text-neutral-500"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddVisit} className="p-4 space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Select Sales Executive *</label>
                <select
                  required
                  value={visitExecId}
                  onChange={(e) => setVisitExecId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-350 cursor-pointer font-bold"
                >
                  <option value="">-- Choose Staff member --</option>
                  {executives.map(exec => (
                    <option key={exec.id} value={exec.id}>{exec.name} ({exec.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Select Customer Shop *</label>
                <select
                  required
                  value={visitContactId}
                  onChange={(e) => setVisitContactId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-350 cursor-pointer font-bold"
                >
                  <option value="">-- Choose Outlet --</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.company ? `${c.company} (${c.name})` : c.name} - {c.city || 'N/A'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Visit Scheduled Date *</label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-250 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Action Notes</label>
                <textarea
                  rows={2}
                  placeholder="Verification objectives, materials to carry..."
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-250 resize-none"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold uppercase rounded-lg hover:bg-primary/95">
                Schedule visit
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
