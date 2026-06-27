'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import {
  Settings,
  CreditCard,
  Users,
  Key,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Mail,
  ArrowRight,
  Sparkles,
  Save,
  Link2,
  RefreshCw,
  Layers,
  Database,
  Radio,
  Globe,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Activity,
  FileText,
  Check,
  Trash,
  X
} from 'lucide-react';

interface Billing {
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  messageUsage: number;
  messageLimit: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'staff';
}

export default function SettingsPage() {
  const { user, workspace, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [billing, setBilling] = useState<Billing | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local state for API key
  const [apiKey, setApiKey] = useState('wf_live_839da49b2f69e6bca2651475ad198305c2d');
  const [showKey, setShowKey] = useState(false);

  // White label states
  const [wlLogo, setWlLogo] = useState('');
  const [wlFavicon, setWlFavicon] = useState('');
  const [wlDomain, setWlDomain] = useState('');
  const [wlColorPrimary, setWlColorPrimary] = useState('#25D366');
  const [wlColorSecondary, setWlColorSecondary] = useState('#128C7E');
  const [savingWL, setSavingWL] = useState(false);

  // Integrations states
  const [activeTab, setActiveTab] = useState<'general' | 'integrations'>('general');
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any | null>(null);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);

  // AI Auto-mapping states
  const [aiPayloadInput, setAiPayloadInput] = useState('');
  const [autoMappingLoading, setAutoMappingLoading] = useState(false);
  const [autoMappedFieldsCount, setAutoMappedFieldsCount] = useState<number | null>(null);

  // Sync history & progress states
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [loadingSyncHistory, setLoadingSyncHistory] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Webhook debugger logs states
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [loadingWebhookLogs, setLoadingWebhookLogs] = useState(false);
  const [selectedPayload, setSelectedPayload] = useState<string | null>(null);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);

  // Form states for API connections
  const [connName, setConnName] = useState('');
  const [connPlatform, setConnPlatform] = useState('Shopify');
  const [connBaseUrl, setConnBaseUrl] = useState('');
  const [connFrontendUrl, setConnFrontendUrl] = useState('');
  const [connBackendApiUrl, setConnBackendApiUrl] = useState('');
  const [connApiKey, setConnApiKey] = useState('');
  const [connWebhookSecret, setConnWebhookSecret] = useState('');
  const [detectedResourcesList, setDetectedResourcesList] = useState<string[]>([]);
  const [connMapping, setConnMapping] = useState<any>({
    name: 'name',
    sku: 'sku',
    price: 'price',
    stock: 'stock',
    description: 'description',
    category: 'category',
    brand: 'brand',
    benefits: 'benefits',
    ingredients: 'ingredients',
    specifications: 'specifications',
    imageUrl: 'imageUrl',
    websiteUrl: 'websiteUrl',
    catalogueUrl: 'catalogueUrl'
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [savingConnection, setSavingConnection] = useState(false);
  const [syncingSection, setSyncingSection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [clearingLogs, setClearingLogs] = useState(false);

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      const [billingRes] = await Promise.all([
        api.get('/billing'),
      ]);
      setBilling(billingRes.data);
      
      if (workspace) {
        setWlLogo(workspace.logoUrl || '');
        setWlFavicon(workspace.faviconUrl || '');
        setWlDomain(workspace.customDomain || '');
        setWlColorPrimary(workspace.brandColorPrimary || '#25D366');
        setWlColorSecondary(workspace.brandColorSecondary || '#128C7E');
      }

      // Simulate team list since user workspace has only this user initially
      if (user) {
        setTeam([
          { id: user.id, name: user.name, email: user.email, role: user.role as any },
          { id: 'mock-1', name: 'AO Staff Member', email: 'staff@amudhasurabiy.com', role: 'staff' },
          { id: 'mock-2', name: 'AO Manager', email: 'manager@amudhasurabiy.com', role: 'admin' },
        ]);
      }
    } catch (err) {
      console.error('Failed to load settings details:', err);
      setError('Could not download workspace metadata.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWhiteLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWL(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/auth/workspace', {
        logoUrl: wlLogo || null,
        faviconUrl: wlFavicon || null,
        customDomain: wlDomain || null,
        brandColorPrimary: wlColorPrimary,
        brandColorSecondary: wlColorSecondary
      });
      setSuccess('White label configuration saved successfully.');
      await refreshProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update custom branding.');
    } finally {
      setSavingWL(false);
    }
  };


  useEffect(() => {
    loadSettingsData();
    fetchConnections();

    // Intercept checkout redirect parameters from URL
    const sessionId = searchParams.get('session_id');
    const plan = searchParams.get('plan');
    const limit = searchParams.get('limit');

    if (sessionId && plan && limit) {
      const upgradePlan = async () => {
        try {
          const res = await api.post('/billing/upgrade', { plan, limit });
          setSuccess(res.data.message);
          await refreshProfile(); // Refresh Auth Context profile
          loadSettingsData(); // Refresh page details
          
          // Clear query parameters
          router.replace('/dashboard/settings');
        } catch (err: any) {
          setError(err.response?.data?.error || 'Upgrade callback processing failed.');
        }
      };
      upgradePlan();
    }
  }, [searchParams]);

  const handleCheckout = async (plan: string) => {
    setCheckoutLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/billing/checkout', { plan });
      // Redirect to simulation checkout URL
      window.location.href = res.data.checkoutUrl;
    } catch (err) {
      setError('Checkout gateway failed to initiate.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const generateNewAPIKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'wf_live_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(key);
    setSuccess('Generated new API key successfully.');
  };

  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const res = await api.get('/integrations/status');
      setConnections(res.data.connections || []);
      setWaitingCount(res.data.waitingCount || 0);
      
      // If we have an active selectedConnection, keep it synced in details
      if (selectedConnection) {
        const updated = (res.data.connections || []).find((c: any) => c.id === selectedConnection.id);
        if (updated) setSelectedConnection(updated);
      }
    } catch (err) {
      console.error('Failed to fetch integrations connections:', err);
    } finally {
      setLoadingConnections(false);
    }
  };

  const fetchSyncHistory = async (connectionId: string) => {
    try {
      setLoadingSyncHistory(true);
      const res = await api.get(`/integrations/sync-history?connectionId=${connectionId}`);
      setSyncHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to fetch sync history:', err);
    } finally {
      setLoadingSyncHistory(false);
    }
  };

  const fetchWebhookLogs = async (connectionId: string) => {
    try {
      setLoadingWebhookLogs(true);
      const res = await api.get(`/integrations/webhook-logs?connectionId=${connectionId}`);
      setWebhookLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch webhook logs:', err);
    } finally {
      setLoadingWebhookLogs(false);
    }
  };

  useEffect(() => {
    if (selectedConnection?.id) {
      fetchSyncHistory(selectedConnection.id);
      fetchWebhookLogs(selectedConnection.id);
    } else {
      setSyncHistory([]);
      setWebhookLogs([]);
    }
  }, [selectedConnection?.id]);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    setDetectedResourcesList([]);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/integrations/test', {
        platform: connPlatform,
        baseUrl: connBackendApiUrl,
        frontendUrl: connFrontendUrl,
        backendApiUrl: connBackendApiUrl,
        apiKey: connApiKey,
        webhookSecret: connWebhookSecret
      });
      if (res.data.success) {
        setTestResult(res.data.status);
        if (res.data.status === 'Connected') {
          setSuccess('API Connection Test Successful: Connected! 🟢');
          setDetectedResourcesList(res.data.detected || []);
        } else {
          setError(`API Connection Test Failed: ${res.data.status} 🔴`);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to ping target API URL.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConnection(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/integrations/connect', {
        id: selectedConnection?.id || null,
        name: connName,
        platform: connPlatform,
        baseUrl: connBackendApiUrl,
        frontendUrl: connFrontendUrl,
        backendApiUrl: connBackendApiUrl,
        apiKey: connApiKey,
        webhookSecret: connWebhookSecret,
        fieldMapping: JSON.stringify(connMapping)
      });

      if (res.data.success) {
        setSuccess('API Connection saved and scanning auto-discovery endpoints successfully!');
        setIsConnectionModalOpen(false);
        fetchConnections();
        setSelectedConnection(res.data.connection);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save integration credentials.');
    } finally {
      setSavingConnection(false);
    }
  };

  const handleManualSync = async (type: 'products' | 'customers' | 'orders' | 'catalogues') => {
    if (!selectedConnection) return;
    setSyncingSection(type);
    setSyncProgress(10);
    setError('');
    setSuccess('');
    
    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const res = await api.post(`/integrations/sync-${type}`, {
        connectionId: selectedConnection.id
      });
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      if (res.data.success) {
        setSuccess(res.data.message);
        fetchConnections();
        refreshProfile();
        fetchSyncHistory(selectedConnection.id);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.response?.data?.error || `Synchronization check for ${type} failed.`);
    } finally {
      setTimeout(() => {
        setSyncingSection(null);
        setSyncProgress(0);
      }, 500);
    }
  };

  const handleClearErrorLogs = async () => {
    if (!selectedConnection) return;
    if (!confirm('Are you sure you want to clear the error troubleshooting log?')) return;
    setClearingLogs(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/integrations/clear-errors', {
        connectionId: selectedConnection.id
      });
      if (res.data.success) {
        setSuccess(res.data.message);
        fetchConnections();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to clear troubleshooting logs.');
    } finally {
      setClearingLogs(false);
    }
  };

  const handleAiAutoMap = async () => {
    setAutoMappingLoading(true);
    setError('');
    setSuccess('');
    setAutoMappedFieldsCount(null);
    try {
      const res = await api.post('/integrations/auto-map', {
        payload: aiPayloadInput,
        platformHint: connPlatform
      });

      if (res.data.success && res.data.mapping) {
        const mapping = res.data.mapping;
        
        let count = 0;
        const newMapping = { ...connMapping };
        const fieldsToMap = ['name', 'sku', 'price', 'stock', 'customerName', 'phone', 'city', 'catalogueUrl'];
        fieldsToMap.forEach((field) => {
          if (mapping[field] !== undefined && mapping[field] !== '') {
            newMapping[field] = mapping[field];
            count++;
          }
        });

        setConnMapping(newMapping);

        if (mapping.suggestedPlatform) {
          setConnPlatform(mapping.suggestedPlatform);
        }
        if (mapping.suggestedName) {
          setConnName(mapping.suggestedName);
        }

        setAutoMappedFieldsCount(count);
        setSuccess(`AI Auto-Mapping Successful! Automatically mapped ${count} schema field(s) and suggested integration settings. 🔮`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'AI Auto-Mapping failed. Please check the payload and try again.');
    } finally {
      setAutoMappingLoading(false);
    }
  };

  const openAddConnection = () => {
    setAiPayloadInput('');
    setAutoMappedFieldsCount(null);
    setSelectedConnection(null);
    setConnName('');
    setConnPlatform('Shopify');
    setConnBaseUrl('');
    setConnFrontendUrl('');
    setConnBackendApiUrl('');
    setConnApiKey('');
    setConnWebhookSecret('');
    setDetectedResourcesList([]);
    setConnMapping({
      name: 'name',
      sku: 'sku',
      price: 'price',
      stock: 'stock',
      description: 'description',
      category: 'category',
      brand: 'brand',
      benefits: 'benefits',
      ingredients: 'ingredients',
      specifications: 'specifications',
      imageUrl: 'imageUrl',
      websiteUrl: 'websiteUrl',
      catalogueUrl: 'catalogueUrl'
    });
    setTestResult(null);
    setIsConnectionModalOpen(true);
  };

  const openEditConnection = (conn: any) => {
    setAiPayloadInput('');
    setAutoMappedFieldsCount(null);
    setSelectedConnection(conn);
    setConnName(conn.name);
    setConnPlatform(conn.platform);
    setConnBaseUrl(conn.baseUrl);
    setConnFrontendUrl(conn.frontendUrl || '');
    setConnBackendApiUrl(conn.backendApiUrl || conn.baseUrl || '');
    setConnApiKey(conn.apiKey || '');
    setConnWebhookSecret(conn.webhookSecret || '');
    setDetectedResourcesList(conn.detectedResources ? JSON.parse(conn.detectedResources) : []);
    
    let parsedMapping = {};
    try {
      parsedMapping = JSON.parse(conn.fieldMapping);
    } catch (e) {}

    setConnMapping({
      name: 'name',
      sku: 'sku',
      price: 'price',
      stock: 'stock',
      description: 'description',
      category: 'category',
      brand: 'brand',
      benefits: 'benefits',
      ingredients: 'ingredients',
      specifications: 'specifications',
      imageUrl: 'imageUrl',
      websiteUrl: 'websiteUrl',
      catalogueUrl: 'catalogueUrl',
      ...parsedMapping
    });
    setTestResult(conn.status);
    setIsConnectionModalOpen(true);
  };

  if (loading && !billing) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const plans = [
    { name: 'free', price: '$0', limit: 1000, desc: 'Ideal for trial and basic message testing.' },
    { name: 'starter', price: '$29', limit: 10000, desc: 'Great for small retail shops and organic stores.' },
    { name: 'pro', price: '$79', limit: 50000, desc: 'Perfect for established supermarkets and distributors.' },
    { name: 'enterprise', price: 'Custom', limit: 1000000, desc: 'For large corporate groups requiring bulk campaigns.' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-850/70 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-350 bg-clip-text text-transparent flex items-center gap-2">
            Workspace Settings
          </h1>
          <p className="text-sm text-neutral-450">Configure your subscription plans, API linkages, team mappings, and SaaS connectors.</p>
        </div>

        {/* Tab switcher buttons with glassmorphism */}
        <div className="flex bg-neutral-950/60 backdrop-blur-md border border-neutral-850/80 p-1 rounded-xl shrink-0 shadow-lg shadow-black/10">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-md'
                : 'text-neutral-500 hover:text-neutral-300 bg-transparent border-transparent'
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'integrations'
                ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-md'
                : 'text-neutral-500 hover:text-neutral-300 bg-transparent border-transparent'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" /> API Connections
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/15 border border-red-900/35 text-red-300 text-sm flex items-center gap-3 shadow-md shadow-red-950/5 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-950/15 border border-green-900/35 text-green-300 text-sm flex items-center gap-3 shadow-md shadow-green-950/5 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {activeTab === 'general' ? (
        /* Renders the General Settings Grid segments */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column (Span 2): Billing & API keys */}
          <div className="xl:col-span-2 space-y-8">
            {/* Subscription Plans Card */}
            <div className="p-6 rounded-2xl border border-neutral-850/80 bg-neutral-900/20 backdrop-blur-md shadow-xl shadow-black/10 space-y-6">
              <h3 className="font-bold text-neutral-200 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Plans & Pricing tiers
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((p) => {
                  const isCurrent = billing?.plan === p.name;
                  return (
                    <div
                      key={p.name}
                      className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 ${
                        isCurrent
                          ? 'border-primary bg-primary/[0.04] shadow-lg shadow-primary/5'
                          : 'border-neutral-850 bg-neutral-950/20 hover:bg-neutral-950/40 hover:border-neutral-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs uppercase text-neutral-400 tracking-wider">{p.name}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] bg-primary border border-primary text-primary-foreground font-black uppercase tracking-wider shadow-sm">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-black text-neutral-100 mt-1">{p.price}<span className="text-xs text-neutral-500 font-medium">{p.price !== 'Custom' && '/month'}</span></p>
                        <p className="text-xs text-neutral-450 leading-relaxed pt-1">{p.desc}</p>
                      </div>

                      <div className="pt-3 border-t border-neutral-850/50 flex justify-between items-center text-xs">
                        <span className="text-neutral-500 font-semibold uppercase text-[9px] tracking-wide">Monthly limits</span>
                        <span className="font-bold text-neutral-350">{p.limit.toLocaleString()} messages</span>
                      </div>

                      {!isCurrent && p.name !== 'free' && (
                        <button
                          onClick={() => handleCheckout(p.name)}
                          disabled={checkoutLoading}
                          className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-primary hover:text-primary-foreground border border-neutral-850 hover:border-primary text-xs font-bold text-neutral-300 transition-all cursor-pointer shadow-md"
                        >
                          Upgrade Plan
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* API Credentials Card */}
            <div className="p-6 rounded-2xl border border-neutral-850/80 bg-neutral-900/20 backdrop-blur-md shadow-xl shadow-black/10 space-y-4">
              <h3 className="font-bold text-neutral-200 text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" /> API Developer Keys
              </h3>
              <p className="text-xs text-neutral-450">Integrate AO ERP automated triggers directly into Cusman CRM using auth keys.</p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type={showKey ? 'text' : 'password'}
                    readOnly
                    value={apiKey}
                    className="flex-1 px-4 py-3 rounded-xl text-xs bg-neutral-950/80 border border-neutral-850 text-mono text-neutral-350 focus:outline-none focus:border-neutral-700 font-mono shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="px-4 py-3 rounded-xl border border-neutral-850 bg-neutral-900 hover:bg-neutral-850/60 text-xs font-bold text-neutral-350 cursor-pointer transition-all"
                  >
                    {showKey ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generateNewAPIKey}
                  className="px-4 py-2 text-[11px] font-bold text-primary hover:text-primary/90 transition-all hover:underline cursor-pointer"
                >
                  Regenerate key credentials
                </button>
              </div>
            </div>

            {/* White-Label Settings Card */}
            <div className="p-6 rounded-2xl border border-neutral-850/80 bg-neutral-900/20 backdrop-blur-md shadow-xl shadow-black/10 space-y-6">
              <h3 className="font-bold text-neutral-200 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> White-Label Settings
              </h3>
              <p className="text-xs text-neutral-450">Customize your workspace branding, custom domain, and styling properties.</p>

              <form onSubmit={handleSaveWhiteLabel} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-450 mb-1.5">Branding Logo URL</label>
                    <input
                      type="text"
                      value={wlLogo}
                      onChange={(e) => setWlLogo(e.target.value)}
                      placeholder="e.g. /logo-dark.svg"
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-855 focus:outline-none focus:border-primary text-neutral-250 font-mono focus:ring-1 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-450 mb-1.5">Favicon Shortcut Icon URL</label>
                    <input
                      type="text"
                      value={wlFavicon}
                      onChange={(e) => setWlFavicon(e.target.value)}
                      placeholder="e.g. /favicon.ico"
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-855 focus:outline-none focus:border-primary text-neutral-250 font-mono focus:ring-1 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-450 mb-1.5">Custom Domain Mapping</label>
                    <input
                      type="text"
                      value={wlDomain}
                      onChange={(e) => setWlDomain(e.target.value)}
                      placeholder="e.g. crm.mybrand.com"
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-855 focus:outline-none focus:border-primary text-neutral-250 font-mono focus:ring-1 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-450 mb-1.5">Primary Color (Hex)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={wlColorPrimary}
                        onChange={(e) => setWlColorPrimary(e.target.value)}
                        className="w-8 h-8 rounded border border-neutral-800 bg-neutral-950 p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={wlColorPrimary}
                        onChange={(e) => setWlColorPrimary(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl text-xs bg-neutral-950 border border-neutral-855 focus:outline-none focus:border-primary text-neutral-250 font-mono focus:ring-1 focus:ring-primary/10 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-450 mb-1.5">Secondary Color (Hex)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={wlColorSecondary}
                        onChange={(e) => setWlColorSecondary(e.target.value)}
                        className="w-8 h-8 rounded border border-neutral-800 bg-neutral-955 p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={wlColorSecondary}
                        onChange={(e) => setWlColorSecondary(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl text-xs bg-neutral-950 border border-neutral-855 focus:outline-none focus:border-primary text-neutral-250 font-mono focus:ring-1 focus:ring-primary/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingWL}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> {savingWL ? 'Saving...' : 'Save Custom Branding'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: User Management / Team list */}
          <div className="xl:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl border border-neutral-850/80 bg-neutral-900/20 backdrop-blur-md shadow-xl shadow-black/10 h-full flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-neutral-200 text-base flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" /> Team Members
                </h3>
                <p className="text-xs text-neutral-450 mb-6">Manage users and roles inside this workspace tenant.</p>

                <div className="space-y-4">
                  {team.map((member) => (
                    <div key={member.id} className="p-3.5 rounded-xl border border-neutral-850/50 bg-neutral-950/20 text-xs space-y-2.5 hover:border-neutral-800 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-200">{member.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                          member.role === 'owner' ? 'bg-primary/10 text-primary-foreground border-primary/20' :
                          member.role === 'admin' ? 'bg-blue-500/10 text-blue-450 border-blue-500/20' : 'bg-neutral-800 text-neutral-500 border-neutral-700/50'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-500">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Integrations Tab (API Connection Center) */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Offline Buffer Warning Banner */}
          {waitingCount > 0 ? (
            <div className="p-5 rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-950/20 to-neutral-950/15 text-xs flex items-center justify-between gap-3 animate-pulse shadow-lg shadow-amber-955/5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 animate-bounce" />
                <div>
                  <span className="font-black uppercase block text-[10px] text-amber-400 tracking-wider">⚠ WhatsApp Offline</span>
                  <p className="text-neutral-450 leading-relaxed font-sans pt-0.5">
                    Cusman CRM message delivery is currently offline. <span className="font-bold text-neutral-200">{waitingCount} message(s)</span> are safely buffered in the SQL queue and will automatically send once a valid WhatsApp connection is restored.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/5 text-xs flex items-center gap-3 shadow-md shadow-emerald-950/5 animate-in slide-in-from-top-1">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-black uppercase block text-[10px] text-emerald-400 tracking-wider">✅ WhatsApp Connected</span>
                <p className="text-neutral-450 font-sans leading-relaxed pt-0.5">
                  Reliable message worker engine online. Offline buffers are fully synchronized. All automated queues cleared.
                </p>
              </div>
            </div>
          )}

          {/* Integrations Center Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Connections Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-5 rounded-2xl border border-neutral-850/80 bg-neutral-900/20 backdrop-blur-md shadow-xl shadow-black/10 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-neutral-200 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Database className="w-4 h-4 text-primary animate-pulse" /> API Connectors
                  </h3>
                  <p className="text-[11px] text-neutral-450 leading-relaxed">Link WooCommerce, Shopify, or Custom ERP systems to sync catalogues.</p>
                </div>

                <button
                  onClick={openAddConnection}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" /> Add API Connection
                </button>
              </div>

              {/* Connections List */}
              <div className="space-y-3">
                {loadingConnections ? (
                  <div className="py-8 text-center text-xs text-neutral-500">Retrieving connector profiles...</div>
                ) : connections.length === 0 ? (
                  <div className="p-6 text-center border border-neutral-850/60 rounded-2xl bg-neutral-950/10 text-xs text-neutral-500">
                    No API Connectors configured yet. Create one above to begin.
                  </div>
                ) : (
                  connections.map((conn) => {
                    const isSelected = selectedConnection?.id === conn.id;
                    const isConnected = conn.status === 'Connected';
                    return (
                      <div
                        key={conn.id}
                        onClick={() => setSelectedConnection(conn)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] duration-300 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/15 shadow-lg shadow-indigo-950/15 scale-[1.01] animate-in zoom-in-95 duration-200'
                            : 'border-neutral-850 bg-neutral-950/20 hover:bg-neutral-950/40 hover:border-neutral-800'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <span className="font-bold text-neutral-200 text-xs truncate">{conn.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                            isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {conn.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-500 space-y-1.5 pt-1">
                          <div>Platform: <span className="font-bold text-neutral-350">{conn.platform}</span></div>
                          {conn.frontendUrl && <div className="truncate">Frontend: <span className="text-neutral-400">{conn.frontendUrl}</span></div>}
                          <div className="truncate">Backend API URL: <span className="font-mono text-neutral-400 text-[9px] truncate block bg-neutral-950/40 p-1.5 rounded-lg mt-1 border border-neutral-900/60">{conn.backendApiUrl || conn.baseUrl}</span></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Connection Detail Display & Sync Engine */}
            <div className="lg:col-span-2">
              {selectedConnection ? (
                <div className="p-6 rounded-2xl border border-neutral-850/80 bg-neutral-900/20 backdrop-blur-md shadow-xl shadow-black/10 space-y-6 animate-in slide-in-from-right-3 duration-300">
                  {/* Connection Header */}
                  <div className="flex justify-between items-start border-b border-neutral-850/60 pb-4">
                    <div>
                      <h3 className="font-extrabold text-neutral-100 text-base">{selectedConnection.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-[11px] text-neutral-450">SaaS Platform: <span className="font-bold text-neutral-350">{selectedConnection.platform}</span></span>
                        <span className="w-1 h-1 rounded-full bg-neutral-700" />
                        {selectedConnection.frontendUrl && (
                          <>
                            <span className="text-[11px] text-neutral-450">Frontend URL: <span className="font-bold text-neutral-350">{selectedConnection.frontendUrl}</span></span>
                            <span className="w-1 h-1 rounded-full bg-neutral-700" />
                          </>
                        )}
                        <span className="text-[11px] text-neutral-450">Backend API URL: <span className="font-bold text-neutral-350 font-mono">{selectedConnection.backendApiUrl || selectedConnection.baseUrl}</span></span>
                        <span className="w-1 h-1 rounded-full bg-neutral-700" />
                        {selectedConnection.lastSyncAt ? (
                          <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-450" />
                            Last Synced: {new Date(selectedConnection.lastSyncAt).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-500 italic">Never Synced</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openEditConnection(selectedConnection)}
                      className="px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-750 text-[10px] font-extrabold uppercase text-neutral-300 flex items-center gap-1.5 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Credentials
                    </button>
                  </div>

                  {/* Synchronization Progress Bar */}
                  {syncingSection && (
                    <div className="p-4 rounded-xl border border-indigo-900/30 bg-indigo-950/5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synchronizing {syncingSection}...
                        </span>
                        <span className="font-mono text-neutral-455 font-bold">{syncProgress}%</span>
                      </div>
                      <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden border border-neutral-850/60 shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 h-1.5 rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/20" 
                          style={{ width: `${syncProgress}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Sync Statistics Dashboard */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Synchronization Metrics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                      {(() => {
                        const stats = (() => {
                          try { return JSON.parse(selectedConnection.syncStats || '{}'); } catch(e) { return {}; }
                        })();
                        return (
                          <>
                            <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-850/60 shadow-inner hover:border-neutral-800 transition-all">
                              <span className="block text-[8px] font-extrabold text-neutral-500 uppercase tracking-wider">Products Sync</span>
                              <span className="text-xl font-black text-neutral-100 mt-1 block">{stats.products || 0}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-850/60 shadow-inner hover:border-neutral-800 transition-all">
                              <span className="block text-[8px] font-extrabold text-neutral-500 uppercase tracking-wider">Customers Sync</span>
                              <span className="text-xl font-black text-neutral-100 mt-1 block">{stats.customers || 0}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-850/60 shadow-inner hover:border-neutral-800 transition-all">
                              <span className="block text-[8px] font-extrabold text-neutral-500 uppercase tracking-wider">Orders Sync</span>
                              <span className="text-xl font-black text-neutral-100 mt-1 block">{stats.orders || 0}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-850/60 shadow-inner hover:border-neutral-800 transition-all">
                              <span className="block text-[8px] font-extrabold text-neutral-500 uppercase tracking-wider">Catalogues Sync</span>
                              <span className="text-xl font-black text-neutral-100 mt-1 block">{stats.catalogues || 0}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Auto-Discovery Badge tags */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" /> Discovered Resources
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {(() => {
                        const resources = (() => {
                          try { return JSON.parse(selectedConnection.detectedResources || '[]'); } catch(e) { return []; }
                        })();
                        const allResources = ['Customers', 'Products', 'Categories', 'Orders', 'Invoices', 'Stock', 'Contacts', 'Suppliers'];
                        return allResources.map((res) => {
                          const isActive = resources.includes(res);
                          return (
                            <span
                              key={res}
                              className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-all ${
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-neutral-950/30 text-neutral-500 border-neutral-850/60'
                              }`}
                            >
                              {isActive ? '🟢' : '⚪'} {res}
                            </span>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Manual Data Sync controls */}
                  <div className="space-y-3.5 pt-2 border-t border-neutral-850/50">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" /> Manual Sync Control Engine
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                      <button
                        onClick={() => handleManualSync('products')}
                        disabled={syncingSection !== null}
                        className="py-3 px-3.5 rounded-xl border border-neutral-850 bg-neutral-950/20 hover:bg-neutral-950/65 text-[10px] font-bold text-neutral-350 hover:text-neutral-200 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:border-neutral-800"
                      >
                        {syncingSection === 'products' ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-455 hover:text-indigo-400" />
                        )}
                        Sync Products
                      </button>

                      <button
                        onClick={() => handleManualSync('customers')}
                        disabled={syncingSection !== null}
                        className="py-3 px-3.5 rounded-xl border border-neutral-850 bg-neutral-950/20 hover:bg-neutral-950/65 text-[10px] font-bold text-neutral-355 hover:text-neutral-200 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:border-neutral-800"
                      >
                        {syncingSection === 'customers' ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-455 hover:text-indigo-400" />
                        )}
                        Sync Customers
                      </button>

                      <button
                        onClick={() => handleManualSync('orders')}
                        disabled={syncingSection !== null}
                        className="py-3 px-3.5 rounded-xl border border-neutral-850 bg-neutral-950/20 hover:bg-neutral-950/65 text-[10px] font-bold text-neutral-355 hover:text-neutral-200 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:border-neutral-800"
                      >
                        {syncingSection === 'orders' ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-455 hover:text-indigo-400" />
                        )}
                        Sync Orders
                      </button>

                      <button
                        onClick={() => handleManualSync('catalogues')}
                        disabled={syncingSection !== null}
                        className="py-3 px-3.5 rounded-xl border border-neutral-850 bg-neutral-950/20 hover:bg-neutral-950/65 text-[10px] font-bold text-neutral-355 hover:text-neutral-200 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:border-neutral-800"
                      >
                        {syncingSection === 'catalogues' ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-455 hover:text-indigo-400" />
                        )}
                        Sync Catalogues
                      </button>
                    </div>
                  </div>

                  {/* Webhook System Mapping Setup */}
                  <div className="space-y-3 pt-2 border-t border-neutral-850/50">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-indigo-400" /> Real-time Webhook Receiver
                    </h4>
                    <p className="text-[10px] text-neutral-450 leading-relaxed font-sans">
                      Configure your SaaS platform (Shopify Webhooks / WooCommerce Webhooks) to post payloads here for instant updates.
                    </p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        readOnly
                        value={selectedConnection.webhookUrl || ''}
                        className="flex-1 px-4 py-3 rounded-xl text-xs bg-neutral-950 border border-neutral-850 text-mono text-neutral-400 font-mono focus:outline-none shadow-inner"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedConnection.webhookUrl || '');
                          setSuccess('Webhook receiver URL copied to clipboard! 📋');
                        }}
                        className="px-5 py-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-xs font-bold text-neutral-300 hover:text-neutral-100 transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>

                  {/* Synchronization History Log Table */}
                  <div className="space-y-3.5 pt-4 border-t border-neutral-850/50">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" /> Synchronization History Log
                    </h4>
                    
                    {loadingSyncHistory ? (
                      <div className="text-center py-6 text-xs text-neutral-500 font-sans">
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-2" />
                        Retrieving synchronization records...
                      </div>
                    ) : syncHistory.length === 0 ? (
                      <div className="text-[10px] text-neutral-500 italic font-sans py-1">No past synchronization operations logged.</div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-neutral-850/50 bg-neutral-950/20 shadow-inner max-h-48 overflow-y-auto">
                        <table className="w-full text-[10px] text-left border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-850/80 bg-neutral-950/50 text-neutral-500 font-black uppercase text-[8px] tracking-wider sticky top-0 backdrop-blur-md">
                              <th className="px-4 py-2.5">Run Time</th>
                              <th className="px-4 py-2.5">Resource</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5">Import Count</th>
                              <th className="px-4 py-2.5">Latency</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-850/20 text-neutral-350">
                            {syncHistory.map((item) => (
                              <tr key={item.id} className="hover:bg-neutral-900/10 transition-colors">
                                <td className="px-4 py-2 font-mono text-[9px] text-neutral-450">{new Date(item.createdAt).toLocaleString()}</td>
                                <td className="px-4 py-2 font-bold capitalize text-indigo-300">{item.syncType}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                    item.status === 'Success'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                                  }`}>
                                    {item.status}
                                  </span>
                                  {item.errorMessage && (
                                    <span className="block text-[8px] text-rose-450 mt-0.5 leading-relaxed font-sans max-w-xs truncate">{item.errorMessage}</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 font-bold text-neutral-250">{item.recordsImported} imported</td>
                                <td className="px-4 py-2 font-mono text-[9px] text-neutral-500">{item.runTimeMs}ms</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Webhook Debugger Logs Table */}
                  <div className="space-y-3.5 pt-4 border-t border-neutral-850/50">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" /> Real-time Webhook Receiver Logs
                      </h4>
                      <button
                        type="button"
                        onClick={() => selectedConnection && fetchWebhookLogs(selectedConnection.id)}
                        className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-[9px] text-neutral-400 hover:text-neutral-200 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Refresh Webhook Logs
                      </button>
                    </div>

                    {loadingWebhookLogs ? (
                      <div className="text-center py-6 text-xs text-neutral-500 font-sans">
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-2" />
                        Retrieving webhook events...
                      </div>
                    ) : webhookLogs.length === 0 ? (
                      <div className="text-[10px] text-neutral-500 italic font-sans py-1">No incoming webhook events logged for this connection.</div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-neutral-850/50 bg-neutral-950/20 shadow-inner max-h-48 overflow-y-auto">
                        <table className="w-full text-[10px] text-left border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-850/80 bg-neutral-950/50 text-neutral-500 font-black uppercase text-[8px] tracking-wider sticky top-0 backdrop-blur-md">
                              <th className="px-4 py-2.5">Received At</th>
                              <th className="px-4 py-2.5">Event Source</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5">Payload</th>
                              <th className="px-4 py-2.5">Error Message</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-850/20 text-neutral-350">
                            {webhookLogs.map((item) => (
                              <tr key={item.id} className="hover:bg-neutral-900/10 transition-colors">
                                <td className="px-4 py-2 font-mono text-[9px] text-neutral-450">{new Date(item.receivedAt).toLocaleString()}</td>
                                <td className="px-4 py-2 font-bold text-indigo-350">{item.source}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                    item.status === 'Success'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : item.status === 'Processing'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                                      : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPayload(item.payload);
                                      setIsPayloadModalOpen(true);
                                    }}
                                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[9px] font-semibold text-neutral-400 hover:text-neutral-200 cursor-pointer"
                                  >
                                    View Payload JSON
                                  </button>
                                </td>
                                <td className="px-4 py-2 font-mono text-[9px] text-rose-400 truncate max-w-xs">{item.errorMessage || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Sync error log history */}
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center pt-2 border-t border-neutral-850/50">
                      <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Error Troubleshooting Log
                      </h4>
                      {(() => {
                        const stats = (() => {
                          try { return JSON.parse(selectedConnection.syncStats || '{}'); } catch(e) { return {}; }
                        })();
                        const errors = stats.errors || [];
                        if (errors.length > 0) {
                          return (
                            <button
                              onClick={handleClearErrorLogs}
                              disabled={clearingLogs}
                              className="text-[9px] font-bold text-rose-450 hover:text-rose-300 transition-all cursor-pointer underline flex items-center gap-1 disabled:opacity-50"
                            >
                              {clearingLogs ? 'Clearing...' : 'Clear Logs'}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                      {(() => {
                        const stats = (() => {
                          try { return JSON.parse(selectedConnection.syncStats || '{}'); } catch(e) { return {}; }
                        })();
                        const errors = stats.errors || [];
                        if (errors.length === 0) {
                          return <div className="text-[10px] text-neutral-500 italic font-sans pt-1">No sync issues logged. System fully optimized.</div>;
                        }
                        return errors.map((err: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-red-950/5 border border-red-900/20 text-[10px] space-y-1 animate-in slide-in-from-top-1 duration-200">
                            <div className="flex justify-between items-center text-[8px] text-neutral-500 font-mono">
                              <span className="font-semibold text-neutral-450">Source: {err.component}</span>
                              <span>{new Date(err.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-red-300/90 font-sans leading-relaxed">{err.message}</p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-16 border border-neutral-850/60 rounded-3xl bg-neutral-900/10 backdrop-blur-md shadow-xl text-neutral-500 animate-in fade-in duration-300">
                  <Database className="w-12 h-12 mb-3 text-neutral-700 animate-pulse" />
                  <h4 className="font-bold text-sm text-neutral-400">No Connector Selected</h4>
                  <p className="text-xs text-neutral-500 mt-1.5 max-w-sm leading-relaxed">Select an active CRM platform connection on the left to review synchronization metrics or edit custom maps.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API connection modal dialog with glassmorphism */}
      {isConnectionModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-900/90 backdrop-blur-xl border border-neutral-800/80 rounded-3xl shadow-2xl p-6 space-y-5 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-850/80 pb-3.5">
              <h3 className="font-black text-xs text-neutral-250 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-400" />
                {selectedConnection ? 'Edit Integration Settings' : 'Connect SaaS Integration'}
              </h3>
              <button onClick={() => setIsConnectionModalOpen(false)} className="text-neutral-550 hover:text-neutral-350 transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-neutral-500 uppercase mb-1.5 tracking-wider">Connection Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Shopify Store"
                    value={connName}
                    onChange={(e) => setConnName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-200 transition-all focus:ring-1 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-neutral-500 uppercase mb-1.5 tracking-wider">Platform Partner *</label>
                  <select
                    value={connPlatform}
                    onChange={(e) => setConnPlatform(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-300 font-bold cursor-pointer transition-all focus:ring-1 focus:ring-primary/10"
                  >
                    {['Shopify', 'WooCommerce', 'Zoho', 'HubSpot', 'Salesforce', 'Odoo', 'ERPNext', 'QuickBooks', 'Custom REST APIs', 'Custom GraphQL APIs'].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI Auto-Map Schema Section */}
              <div className="border border-indigo-900/40 bg-indigo-950/15 backdrop-blur-md rounded-2xl p-4.5 space-y-3 shadow-lg shadow-black/10 transition-all duration-300 hover:border-indigo-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-405 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black text-neutral-200 uppercase tracking-wide flex items-center gap-1.5">
                        AI Smart Schema Mapping
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-indigo-900/60 text-indigo-300 border border-indigo-700/40">
                          Beta
                        </span>
                      </h4>
                      <p className="text-[10px] text-neutral-450 mt-0.5 leading-relaxed">
                        Paste a sample API JSON response payload or endpoint details. AI will automatically deduce mapping keys!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <textarea
                    placeholder={`e.g. {\n  "title": "Sprouted Ragi Malt",\n  "variant_sku": "RAGI-100",\n  "retail_price": 190.00,\n  "quantity": 120\n}`}
                    value={aiPayloadInput}
                    onChange={(e) => setAiPayloadInput(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-950/90 border border-neutral-850 focus:outline-none focus:border-indigo-500 text-neutral-300 font-mono focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-neutral-600 shadow-inner"
                  />

                  <div className="flex justify-between items-center">
                    <div>
                      {autoMappedFieldsCount !== null && (
                        <span className="text-[10px] font-bold text-emerald-450 bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1 rounded-lg animate-in fade-in zoom-in-95">
                          ✓ AI Auto-Mapped {autoMappedFieldsCount} field(s)!
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAiAutoMap}
                      disabled={autoMappingLoading || !aiPayloadInput.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-650 to-indigo-550 hover:from-indigo-600 hover:to-indigo-500 text-xs font-bold uppercase text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed border border-indigo-550/30 hover:border-indigo-505"
                    >
                      {autoMappingLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-white animate-bounce-slow" />
                          <span>Auto-Map with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-neutral-500 uppercase mb-1.5 tracking-wider">Frontend URL</label>
                  <input
                    type="text"
                    placeholder="https://erp.amudhasurabiy.com"
                    value={connFrontendUrl}
                    onChange={(e) => setConnFrontendUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-250 font-mono text-[11px] focus:ring-1 focus:ring-primary/10 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-neutral-500 uppercase mb-1.5 tracking-wider">Backend API URL *</label>
                  <input
                    type="text"
                    required
                    placeholder="https://ao-core-production.up.railway.app"
                    value={connBackendApiUrl}
                    onChange={(e) => setConnBackendApiUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-250 font-mono text-[11px] focus:ring-1 focus:ring-primary/10 transition-all shadow-inner"
                  />
                  {connBackendApiUrl && (connBackendApiUrl.includes('erp.amudhasurabiy.com') || connBackendApiUrl.includes('https://erp.amudhasurabiy.com')) && (
                    <div className="mt-1.5 text-xs text-amber-500 flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Frontend URL detected. Please enter Backend API URL.</span>
                    </div>
                  )}
                </div>
              </div>

              {testResult === 'Connected' && (
                <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-900/35 space-y-2 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 text-emerald-450 font-black uppercase text-[10px] tracking-wider">
                    <CheckCircle className="w-4 h-4 text-emerald-450" />
                    <span>Status Connected</span>
                  </div>
                  {detectedResourcesList.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 font-sans pt-1">
                      {detectedResourcesList.map((res) => (
                        <div key={res} className="flex items-center gap-1.5 text-emerald-300">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{res} Available</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-850/60 pt-4">
                <div>
                  <label className="block text-[9px] font-black text-neutral-500 uppercase mb-1.5 tracking-wider">API Key *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter API Key credentials"
                    value={connApiKey}
                    onChange={(e) => setConnApiKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-250 text-xs focus:ring-1 focus:ring-primary/10 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-neutral-500 uppercase mb-1.5 tracking-wider">Webhook Secret</label>
                  <input
                    type="password"
                    placeholder="Enter Webhook verification secret"
                    value={connWebhookSecret}
                    onChange={(e) => setConnWebhookSecret(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-250 text-xs focus:ring-1 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              {/* Data Field Mapper Engine */}
              <div className="border-t border-neutral-850/60 pt-4 space-y-3.5">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" /> Data Mapping Schema
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-1.5 tracking-wide">Product Name</label>
                    <input
                      type="text"
                      value={connMapping.name}
                      onChange={(e) => setConnMapping({ ...connMapping, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-250 text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-1.5 tracking-wide">SKU Key</label>
                    <input
                      type="text"
                      value={connMapping.sku}
                      onChange={(e) => setConnMapping({ ...connMapping, sku: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-250 text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-1.5 tracking-wide">Price Key</label>
                    <input
                      type="text"
                      value={connMapping.price}
                      onChange={(e) => setConnMapping({ ...connMapping, price: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-250 text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-1.5 tracking-wide">Stock Key</label>
                    <input
                      type="text"
                      value={connMapping.stock}
                      onChange={(e) => setConnMapping({ ...connMapping, stock: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-250 text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-1.5 tracking-wide">Customer Name</label>
                    <input
                      type="text"
                      value={connMapping.customerName}
                      onChange={(e) => setConnMapping({ ...connMapping, customerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-250 text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-1.5 tracking-wide">Phone Key</label>
                    <input
                      type="text"
                      value={connMapping.phone}
                      onChange={(e) => setConnMapping({ ...connMapping, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-250 text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-1.5 tracking-wide">City Key</label>
                    <input
                      type="text"
                      value={connMapping.city}
                      onChange={(e) => setConnMapping({ ...connMapping, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-250 text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-1.5 tracking-wide">Catalogue Key</label>
                    <input
                      type="text"
                      value={connMapping.catalogueUrl}
                      onChange={(e) => setConnMapping({ ...connMapping, catalogueUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-250 text-[11px] focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between border-t border-neutral-850/80 pt-4.5">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                >
                  {testingConnection ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4 text-indigo-405" />
                  )}
                  Test Connection
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsConnectionModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-xs font-bold uppercase text-neutral-500 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingConnection}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase hover:bg-primary/95 transition-all shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] cursor-pointer hover:-translate-y-0.5"
                  >
                    {savingConnection ? 'Saving...' : 'Save Connection'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Payload Debugger Modal */}
      {isPayloadModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 space-y-4 my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-neutral-850/80 pb-3">
              <h3 className="font-black text-xs text-neutral-250 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Raw Webhook Payload JSON
              </h3>
              <button onClick={() => setIsPayloadModalOpen(false)} className="text-neutral-550 hover:text-neutral-350 transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto rounded-xl bg-neutral-950/80 border border-neutral-855 p-4 font-mono text-[10px] text-neutral-300 leading-relaxed whitespace-pre-wrap select-all">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(selectedPayload || '{}'), null, 2);
                } catch (e) {
                  return selectedPayload || '{}';
                }
              })()}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-850/60">
              <button
                type="button"
                onClick={() => setIsPayloadModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
