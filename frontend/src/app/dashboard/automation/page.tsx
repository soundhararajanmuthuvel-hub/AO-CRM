'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import {
  GitBranch,
  Play,
  CheckCircle,
  AlertCircle,
  Settings2,
  Calendar,
  UserPlus,
  Moon,
  ToggleLeft,
  ToggleRight,
  HelpCircle
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
}

interface Rule {
  id: string;
  name: string;
  triggerType: 'ContactAdded' | 'Birthday' | 'Inactive30Days' | 'Inactive60Days' | 'Festival' | 'NewProduct';
  templateId?: string;
  isActive: boolean;
  MessageTemplate?: { name: string };
}

export default function AutomationWorkspacePage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesRes, templatesRes] = await Promise.all([
        api.get('/automation'),
        api.get('/templates')
      ]);
      setRules(rulesRes.data);
      setTemplates(templatesRes.data);
    } catch (err) {
      console.error('Failed to load automation settings:', err);
      setError('Could not load automated workflows configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setUpdatingId(id);
    setError('');
    setSuccess('');
    try {
      const res = await api.put(`/automation/${id}`, {
        isActive: !currentActive
      });
      
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: res.data.isActive } : r))
      );
      setSuccess(`Updated rule state successfully.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update rule.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTemplateChange = async (id: string, templateId: string) => {
    setUpdatingId(id);
    setError('');
    setSuccess('');
    try {
      const res = await api.put(`/automation/${id}`, {
        templateId: templateId || null
      });
      
      setRules((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, templateId: res.data.templateId, MessageTemplate: res.data.MessageTemplate }
            : r
        )
      );
      setSuccess(`Updated message template mapping.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to map template to rule.');
    } finally {
      setUpdatingId(null);
    }
  };

  const triggerSimulation = async () => {
    setSimulating(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/automation/simulate');
      setSuccess(res.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Automation checks simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  if (loading && rules.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'Birthday':
        return <Calendar className="w-5 h-5 text-pink-400" />;
      case 'ContactAdded':
        return <UserPlus className="w-5 h-5 text-blue-400" />;
      case 'Inactive30Days':
      case 'Inactive60Days':
        return <Moon className="w-5 h-5 text-amber-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            Automations Console
          </h1>
          <p className="text-sm text-neutral-400">Configure background workflows that automatically send follow-ups and greetings based on customer behavior.</p>
        </div>
        <button
          onClick={triggerSimulation}
          disabled={simulating}
          className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold flex items-center gap-2 text-neutral-350 transition-all"
        >
          <Play className="w-3.5 h-3.5 text-primary" /> {simulating ? 'Processing Rule Checks...' : 'Force Run Checks'}
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

      {/* Rules list cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule) => {
          const isToggled = rule.isActive;
          return (
            <div key={rule.id} className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 flex flex-col justify-between space-y-6">
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-850 border border-neutral-800 flex items-center justify-center">
                    {getTriggerIcon(rule.triggerType)}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-200 text-base">{rule.name}</h3>
                    <span className="text-[10px] text-neutral-500 font-semibold tracking-wide uppercase">Trigger Type: {rule.triggerType}</span>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => handleToggleActive(rule.id, rule.isActive)}
                  disabled={updatingId === rule.id}
                  className="focus:outline-none transition-all"
                >
                  {isToggled ? (
                    <ToggleRight className="w-11 h-11 text-primary cursor-pointer hover:opacity-95" />
                  ) : (
                    <ToggleLeft className="w-11 h-11 text-neutral-600 cursor-pointer hover:text-neutral-550" />
                  )}
                </button>
              </div>

              {/* Template Mapper Dropdown */}
              <div className="p-4 rounded-xl bg-neutral-950/30 border border-neutral-800/50 space-y-3">
                <label className="block text-xs font-bold text-neutral-450 uppercase flex items-center gap-1.5"><Settings2 className="w-3.5 h-3.5 text-primary" /> Outgoing Message Template</label>
                <select
                  value={rule.templateId || ''}
                  disabled={updatingId === rule.id}
                  onChange={(e) => handleTemplateChange(rule.id, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-400"
                >
                  <option value="">No template mapped (Rule won&apos;t trigger)...</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                  ))}
                </select>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
