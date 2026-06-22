'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileCode,
  Users,
  ChevronRight
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
  type: 'Marketing' | 'Follow-Up' | 'Reminder' | 'Greetings';
  templateId: string;
  targetGroup: string;
  scheduledAt?: string;
  status: 'Draft' | 'Scheduled' | 'Running' | 'Completed' | 'Cancelled';
  totalMessages: number;
  sentCount: number;
  failedCount: number;
  MessageTemplate?: { name: string };
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals & Forms
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'Marketing' | 'Follow-Up' | 'Reminder' | 'Greetings'>('Marketing');
  const [templateId, setTemplateId] = useState('');
  const [targetGroup, setTargetGroup] = useState('All');
  const [scheduledAt, setScheduledAt] = useState('');
  const [savingCampaign, setSavingCampaign] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, templatesRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/templates')
      ]);
      setCampaigns(campaignsRes.data);
      setTemplates(templatesRes.data);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setError('Could not download outreach campaigns lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !templateId) return;

    setSavingCampaign(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/campaigns', {
        name,
        type,
        templateId,
        targetGroup,
        scheduledAt: scheduledAt || null
      });

      setSuccess(`Campaign "${name}" created successfully.`);
      setIsAddModalOpen(false);
      setName('');
      setType('Marketing');
      setTemplateId('');
      setTargetGroup('All');
      setScheduledAt('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize campaign.');
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleStart = async (id: string, campaignName: string) => {
    try {
      setError('');
      setSuccess('');
      await api.post(`/campaigns/${id}/start`);
      setSuccess(`Campaign "${campaignName}" launched and queue populated.`);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to launch campaign. Verify WhatsApp status is connected.');
    }
  };

  const handlePause = async (id: string) => {
    try {
      await api.post(`/campaigns/${id}/pause`);
      loadData();
    } catch (err) {
      setError('Failed to pause campaign.');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await api.post(`/campaigns/${id}/resume`);
      loadData();
    } catch (err) {
      setError('Failed to resume campaign.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this campaign? Pending messages in queue will be discarded.')) return;
    try {
      await api.post(`/campaigns/${id}/cancel`);
      loadData();
    } catch (err) {
      setError('Failed to cancel campaign.');
    }
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            Outreach Campaigns
          </h1>
          <p className="text-sm text-neutral-400">Launch marketing promotions, customer warnings, or invoicing follow-ups in bulk.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-primary/10"
        >
          <Plus className="w-3.5 h-3.5" /> Initialize Campaign
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/50 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-950/20 border border-green-800/50 text-green-300 text-sm flex items-center gap-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Campaigns Listing */}
      <div className="space-y-6">
        {campaigns.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 border border-neutral-800 border-dashed rounded-2xl">
            No campaigns created yet. Click initialization above.
          </div>
        ) : (
          campaigns.map((camp) => {
            const processedCount = camp.sentCount + camp.failedCount;
            const progress = camp.totalMessages > 0 ? Math.round((processedCount / camp.totalMessages) * 100) : 0;
            
            return (
              <div key={camp.id} className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 hover:bg-neutral-900/15 transition-all">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  
                  {/* Info Column */}
                  <div className="space-y-2 md:col-span-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        camp.status === 'Running' ? 'bg-blue-500/10 text-blue-400' :
                        camp.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                        camp.status === 'Cancelled' ? 'bg-neutral-800 text-neutral-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {camp.status}
                      </span>
                      <span className="text-[10px] text-neutral-500">{camp.type}</span>
                    </div>
                    <h3 className="font-bold text-neutral-250 text-base">{camp.name}</h3>
                    <div className="text-[11px] text-neutral-500 space-y-0.5">
                      <p className="flex items-center gap-1"><FileCode className="w-3.5 h-3.5 text-neutral-600" /> Template: {camp.MessageTemplate?.name || 'N/A'}</p>
                      <p className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-neutral-600" /> Targets: {camp.targetGroup}</p>
                    </div>
                  </div>

                  {/* Progress Bar Column */}
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-neutral-400">Queue progress</span>
                      <span className="font-bold text-neutral-300">{camp.sentCount} / {camp.totalMessages} Sent ({camp.failedCount} failed)</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          camp.status === 'Completed' ? 'bg-green-500' : camp.status === 'Cancelled' ? 'bg-neutral-700' : 'bg-primary'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Controls Column */}
                  <div className="flex items-center justify-end gap-2 md:col-span-1">
                    {camp.status === 'Draft' && (
                      <button
                        onClick={() => handleStart(camp.id, camp.name)}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md shadow-primary/5"
                      >
                        <Play className="w-3.5 h-3.5" /> Start
                      </button>
                    )}

                    {camp.status === 'Running' && (
                      <>
                        <button
                          onClick={() => handlePause(camp.id)}
                          className="p-2.5 text-neutral-400 hover:text-amber-500 hover:bg-neutral-800 rounded-xl transition-all"
                          title="Pause campaign"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancel(camp.id)}
                          className="p-2.5 text-neutral-400 hover:text-red-400 hover:bg-destructive/10 rounded-xl transition-all"
                          title="Cancel/Stop campaign"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {camp.status === 'Cancelled' && (
                      <span className="text-xs text-neutral-600 font-semibold italic">Stopped</span>
                    )}

                    {camp.status === 'Completed' && (
                      <span className="text-xs text-green-500 font-semibold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Completed</span>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: INITIALIZE CAMPAIGN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2 mb-2">
              <Megaphone className="w-5 h-5 text-primary" /> Initialize Campaign
            </h3>
            <p className="text-xs text-neutral-400 mb-6">Setup outreach details. Once initialized, campaigns can be started from drafts.</p>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. June Product Launch Offer"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 placeholder-neutral-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Campaign Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-450"
                  >
                    <option value="Marketing">Marketing Promotion</option>
                    <option value="Follow-Up">Follow-Up Alert</option>
                    <option value="Reminder">Payment Reminder</option>
                    <option value="Greetings">Festival Greeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Target segment group</label>
                  <select
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-450"
                  >
                    <option value="All">All Contacts</option>
                    <option value="Retail Customer">Retail Customers</option>
                    <option value="Distributor">Distributors</option>
                    <option value="Supermarket">Supermarkets</option>
                    <option value="Organic Store">Organic Stores</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Message Template *</label>
                <select
                  required
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-450"
                >
                  <option value="">Select a template...</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Schedule Send Time (Optional)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-neutral-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-450"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setName('');
                    setTemplateId('');
                    setTargetGroup('All');
                    setScheduledAt('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCampaign || templates.length === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-primary/95 shadow-md shadow-primary/10 ${
                    templates.length === 0
                      ? 'bg-neutral-950 border border-neutral-800 text-neutral-600 cursor-not-allowed'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {savingCampaign ? 'Saving...' : 'Add Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
