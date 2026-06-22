'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import {
  Mail,
  Lock,
  Globe,
  Settings,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  Database,
  Key
} from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
}

export default function AdministrativeSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields mapped
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  
  const [openAIKey, setOpenAIKey] = useState('');
  const [stripeKey, setStripeKey] = useState('');
  const [razorpayKey, setRazorpayKey] = useState('');
  
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/settings');
      const data = res.data as SystemSetting[];
      setSettings(data);

      // Load form maps
      const findVal = (key: string) => data.find(s => s.key === key)?.value || '';
      
      setSmtpHost(findVal('SMTP_HOST'));
      setSmtpPort(findVal('SMTP_PORT'));
      setSmtpUser(findVal('SMTP_USER'));
      setSmtpPass(findVal('SMTP_PASSWORD'));
      setOpenAIKey(findVal('OPENAI_API_KEY'));
      setStripeKey(findVal('STRIPE_API_KEY'));
      setRazorpayKey(findVal('RAZORPAY_KEY_ID'));
    } catch (err) {
      console.error('Failed to load administrative settings:', err);
      setError('Could not load administrative configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSetting = async (key: string, value: string) => {
    setSavingKey(key);
    setError('');
    setSuccess('');
    try {
      await api.post('/super-admin/settings', { key, value });
      setSuccess(`Global setting: "${key}" updated successfully.`);
      loadSettings();
    } catch (err) {
      setError(`Failed to save administrative key: ${key}`);
    } finally {
      setSavingKey(null);
    }
  };

  if (loading && settings.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
          Administrative & Platform Settings
        </h1>
        <p className="text-sm text-neutral-400">Configure mail delivery parameters, API payment connections, domain parameters, and default system endpoints.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section: SMTP Mail Configuration */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-6">
          <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Mail className="w-4.5 h-4.5 text-primary" /> SMTP Outgoing Mailer Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Outgoing Host Server</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="e.g. smtp.mailgun.org"
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 font-mono"
                />
                <button
                  onClick={() => handleSaveSetting('SMTP_HOST', smtpHost)}
                  disabled={savingKey === 'SMTP_HOST'}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-300 font-semibold text-xs flex items-center gap-1 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">SMTP Port Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="e.g. 587"
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 font-mono"
                />
                <button
                  onClick={() => handleSaveSetting('SMTP_PORT', smtpPort)}
                  disabled={savingKey === 'SMTP_PORT'}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-300 font-semibold text-xs flex items-center gap-1 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Authentication Username</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="e.g. postmaster@yourdomain.com"
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 font-mono"
                />
                <button
                  onClick={() => handleSaveSetting('SMTP_USER', smtpUser)}
                  disabled={savingKey === 'SMTP_USER'}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-300 font-semibold text-xs flex items-center gap-1 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Authentication Password</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 font-mono"
                />
                <button
                  onClick={() => handleSaveSetting('SMTP_PASSWORD', smtpPass)}
                  disabled={savingKey === 'SMTP_PASSWORD'}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-300 font-semibold text-xs flex items-center gap-1 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Third-Party APIs (OpenAI, Stripe, Razorpay) */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-6">
          <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Key className="w-4.5 h-4.5 text-primary" /> API Connections & Gateways Keys
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Default OpenAI API Token (AI Heuristics fallback)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={openAIKey}
                  onChange={(e) => setOpenAIKey(e.target.value)}
                  placeholder="sk-proj-••••••••••••••••"
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 font-mono"
                />
                <button
                  onClick={() => handleSaveSetting('OPENAI_API_KEY', openAIKey)}
                  disabled={savingKey === 'OPENAI_API_KEY'}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-300 font-semibold text-xs flex items-center gap-1 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Stripe Gateway Private Key (USD Subscriptions)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  placeholder="sk_test_••••••••••••••••"
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 font-mono"
                />
                <button
                  onClick={() => handleSaveSetting('STRIPE_API_KEY', stripeKey)}
                  disabled={savingKey === 'STRIPE_API_KEY'}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-300 font-semibold text-xs flex items-center gap-1 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Razorpay Gateway Key ID (INR Local Subscriptions)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={razorpayKey}
                  onChange={(e) => setRazorpayKey(e.target.value)}
                  placeholder="rzp_test_••••••••••••••••"
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 font-mono"
                />
                <button
                  onClick={() => handleSaveSetting('RAZORPAY_KEY_ID', razorpayKey)}
                  disabled={savingKey === 'RAZORPAY_KEY_ID'}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-300 font-semibold text-xs flex items-center gap-1 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
