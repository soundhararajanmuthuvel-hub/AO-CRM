'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  QrCode,
  CheckCircle,
  Clock,
  AlertTriangle,
  History,
  Send,
  Users,
  AlertCircle,
  Sparkles,
  Database,
  ShieldCheck,
  Zap,
  Check,
  Terminal,
  Key,
  Copy,
  Sliders,
  Battery,
  Smartphone,
  CheckSquare
} from 'lucide-react';

interface Log {
  id: string;
  phone: string;
  message: string;
  status: 'Sent' | 'Failed';
  error?: string;
  sentAt: string;
  Contact?: { name: string };
}

export default function WhatsAppDashboardPage() {
  const { user, workspace, refreshProfile } = useAuth();
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'device' | 'credentials' | 'console' | 'webhooks' | 'logs'>('device');

  // WhatsApp connection states
  const [status, setStatus] = useState('Disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionExists, setSessionExists] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [pushname, setPushname] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  // API Explorer Console States
  const [testPhone, setTestPhone] = useState('1234567890');
  const [testMessage, setTestMessage] = useState('Hello from WhatsFlow AI!');
  const [sendingTest, setSendingTest] = useState(false);

  // Bulk campaign form
  const [bulkCampaignName, setBulkCampaignName] = useState('');
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [schedulingBulk, setSchedulingBulk] = useState(false);

  // Webhooks configs
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('wf_sec_9a7c3b8e1f0c2a5');
  const [ignoreGroups, setIgnoreGroups] = useState(true);
  const [subscribedEvents, setSubscribedEvents] = useState({
    'messages.received': true,
    'message.sent': true,
    'session.status': true,
    'qrcode.updated': false,
    'messages.upsert': false
  });

  // Key rotation and security
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [rotatingKeys, setRotatingKeys] = useState(false);

  // Success/Error status alerts
  const [errorAlert, setErrorAlert] = useState('');
  const [successAlert, setSuccessAlert] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchSessionStatusAndLogs = async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        api.get('/whatsapp/status'),
        api.get('/whatsapp/logs')
      ]);
      setStatus(statusRes.data.status);
      setQrCode(statusRes.data.qrCode);
      setSessionExists(statusRes.data.sessionExists);
      setPhoneNumber(statusRes.data.phoneNumber);
      setPushname(statusRes.data.pushname);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load WhatsApp session status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchSessionStatusAndLogs();

    if (workspace) {
      setApiKey(workspace.apiKey || '');
      setApiSecret(workspace.apiSecret || '');
      setWebhookUrl(workspace.webhookUrl || '');
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') 
        ? window.location.origin 
        : 'http://localhost:5000');
    const socket: Socket = io(socketUrl, {
      query: { workspaceId: user.workspaceId }
    });

    socket.on('status_change', (data: { status: string; qrCode: string | null; sessionExists?: boolean; phoneNumber?: string | null; pushname?: string | null }) => {
      console.log('[WebSocket Status Notification]:', data);
      setStatus(data.status);
      setQrCode(data.qrCode);
      if (data.sessionExists !== undefined) {
        setSessionExists(data.sessionExists);
      }
      if (data.phoneNumber !== undefined) {
        setPhoneNumber(data.phoneNumber);
      }
      if (data.pushname !== undefined) {
        setPushname(data.pushname);
      }
      if (data.status === 'Connected' || data.status === 'READY') {
        setSessionExists(true);
        api.get('/whatsapp/status').then(res => {
          setPhoneNumber(res.data.phoneNumber);
          setPushname(res.data.pushname);
        }).catch(() => {});
        api.get('/whatsapp/logs').then(res => setLogs(res.data)).catch(() => {});
      } else if (data.status === 'Disconnected') {
        api.get('/whatsapp/session').then(res => setSessionExists(res.data.exists)).catch(() => {});
        setPhoneNumber(null);
        setPushname(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, workspace]);

  const handleConnect = async () => {
    const isConnected = status === 'Connected' || status === 'READY';
    if (isConnected) {
      if (!confirm('Connecting a new account will disconnect and clear your current session. Do you want to proceed?')) {
        return;
      }
    }
    setActionLoading(true);
    setErrorAlert('');
    setSuccessAlert('');
    setQrCode(null);
    try {
      await api.post('/whatsapp/connect-qr');
      setStatus('Initializing');
      setSessionExists(false);
      setPhoneNumber(null);
      setPushname(null);
      setSuccessAlert('Triggered QR connection sequence. Scan to link device.');
    } catch (err: any) {
      setErrorAlert(err.response?.data?.error || 'Failed to start browser session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreSession = async () => {
    if (!sessionExists) {
      setErrorAlert('No existing session found. Please connect using QR Code.');
      return;
    }
    setActionLoading(true);
    setErrorAlert('');
    setSuccessAlert('');
    try {
      await api.post('/whatsapp/restore-session');
      setStatus('Initializing');
      setSuccessAlert('Attempting to restore session from LocalAuth cache.');
    } catch (err: any) {
      setErrorAlert(err.response?.data?.error || 'Failed to restore existing session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp connection? All saved session data will be deleted.')) return;
    setActionLoading(true);
    setErrorAlert('');
    setSuccessAlert('');
    try {
      await api.post('/whatsapp/disconnect');
      setStatus('Disconnected');
      setQrCode(null);
      setSessionExists(false);
      setPhoneNumber(null);
      setPushname(null);
      setSuccessAlert('Disconnected device and cleared session files.');
    } catch (err: any) {
      setErrorAlert(err.response?.data?.error || 'Failed to disconnect.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyConnection = async () => {
    setVerifying(true);
    setErrorAlert('');
    setSuccessAlert('');
    setConnectionInfo(null);
    try {
      const res = await api.post('/whatsapp/verify-connection');
      if (res.data.success) {
        setSuccessAlert('WhatsApp integration is active and healthy!');
        setConnectionInfo(res.data.info);
        if (res.data.info) {
          setPushname(res.data.info.pushname);
          if (res.data.info.wid) {
            setPhoneNumber(res.data.info.wid.user || res.data.info.wid);
          }
        }
      }
    } catch (err: any) {
      setErrorAlert(err.response?.data?.error || 'WhatsApp is not connected or ready.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;

    setSendingTest(true);
    setErrorAlert('');
    setSuccessAlert('');
    try {
      const res = await api.post('/whatsapp/test', {
        phone: testPhone,
        message: testMessage
      });
      if (res.data.success) {
        setSuccessAlert('Test message successfully sent.');
        fetchSessionStatusAndLogs();
      }
    } catch (err: any) {
      setErrorAlert(err.response?.data?.error || err.response?.data?.message || err.message || 'Test message failed.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCampaignName || !bulkNumbers || !bulkMessage) return;

    setSchedulingBulk(true);
    setErrorAlert('');
    setSuccessAlert('');
    try {
      const numbersList = bulkNumbers
        .split(/[,\n]/)
        .map(num => num.trim())
        .filter(num => num.length > 0);

      const res = await api.post('/whatsapp/send-bulk', {
        name: bulkCampaignName,
        numbers: numbersList,
        message: bulkMessage
      });

      if (res.data.success) {
        setSuccessAlert(res.data.message);
        setBulkCampaignName('');
        setBulkNumbers('');
        setBulkMessage('');
        fetchSessionStatusAndLogs();
      }
    } catch (err: any) {
      setErrorAlert(err.response?.data?.error || 'Failed to initialize bulk campaign.');
    } finally {
      setSchedulingBulk(false);
    }
  };

  const generateNewAPIKey = async () => {
    if (!confirm('Warning: Rotating keys will immediately invalidate your current API requests. Do you want to proceed?')) return;
    setRotatingKeys(true);
    setErrorAlert('');
    setSuccessAlert('');
    try {
      const res = await api.post('/auth/workspace/rotate-api-keys');
      setApiKey(res.data.apiKey);
      setApiSecret(res.data.apiSecret);
      setSuccessAlert('Rotated and generated new API credentials successfully.');
      await refreshProfile();
    } catch (err: any) {
      setErrorAlert(err.response?.data?.error || 'Failed to rotate API credentials.');
    } finally {
      setRotatingKeys(false);
    }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWebhook(true);
    setErrorAlert('');
    setSuccessAlert('');
    try {
      await api.put('/auth/workspace', {
        webhookUrl: webhookUrl || null
      });
      setSuccessAlert('Webhook URL configuration saved successfully.');
      await refreshProfile();
    } catch (err: any) {
      setErrorAlert(err.response?.data?.error || 'Failed to update Webhook URL.');
    } finally {
      setSavingWebhook(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getCurlSnippet = () => {
    return `curl -X POST https://api.whatsflow.ai/api/whatsapp/send \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: ${apiKey || 'YOUR_API_KEY'}" \\
  -H "X-API-SECRET: ${apiSecret || 'YOUR_API_SECRET'}" \\
  -d '{
    "phone": "${testPhone}",
    "message": "${testMessage}"
  }'`;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isConnected = status === 'Connected' || status === 'READY';
  const isInitializing = status === 'Initializing' || status === 'Reconnecting';
  const isAuthenticating = status === 'Authenticating';
  const isQR = status === 'QR Ready' && qrCode;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
          WhatsApp Sessions Manager
        </h1>
        <p className="text-sm text-neutral-400">Configure your linked devices, inspect real-time webhooks, check API credentials, and run test broadcasts.</p>
      </div>

      {/* Global Alerts */}
      {errorAlert && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/40 text-red-300 text-xs flex items-center gap-3 animate-in fade-in text-left">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>Error: <span className="font-bold">{errorAlert}</span></span>
        </div>
      )}

      {successAlert && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/45 text-emerald-400 text-xs flex items-center gap-3 animate-in fade-in text-left">
          <CheckCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{successAlert}</span>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex border-b border-neutral-900 gap-2">
        {([
          { id: 'device', label: 'Linked Device', icon: Smartphone },
          { id: 'credentials', label: 'API Credentials', icon: Key },
          { id: 'console', label: 'Developer Console', icon: Terminal },
          { id: 'webhooks', label: 'Webhooks Config', icon: Sliders },
          { id: 'logs', label: 'Session Logs', icon: History }
        ] as const).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: LINKED DEVICE */}
      {activeTab === 'device' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status card */}
            <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-neutral-200">Session Status</h3>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : isInitializing || isAuthenticating ? 'bg-amber-500 animate-spin' : 'bg-red-500'
                  }`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isConnected ? 'text-emerald-400' : isInitializing || isAuthenticating ? 'text-amber-500' : 'text-neutral-500'
                  }`}>{status === 'READY' ? 'Connected' : status}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/20 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Health Score</span>
                  <span className="text-lg font-black text-neutral-200 block">{isConnected ? '98%' : 'N/A'}</span>
                </div>
                <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/20 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Messages Today</span>
                  <span className="text-lg font-black text-neutral-200 block">{isConnected ? logs.length : '0'}</span>
                </div>
                <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/20 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">API Calls</span>
                  <span className="text-lg font-black text-neutral-200 block">{workspace?.messageUsageThisMonth || 0}</span>
                </div>
                <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/20 space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Device Battery</span>
                  <span className="text-lg font-black text-neutral-200 block flex items-center gap-1.5">
                    <Battery className="w-4 h-4 text-emerald-400" /> {isConnected ? '92%' : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Info details */}
              {isConnected && (
                <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 text-xs space-y-2.5 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Linked Phone Number</span>
                    <span className="font-bold text-neutral-200">
                      {phoneNumber ? `+${phoneNumber.replace(/[^\d]/g, '')}` : '+91XXXXXXXXXX'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-neutral-900 pt-2.5">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Device User Name</span>
                    <span className="text-neutral-300 font-bold">{pushname || 'Primary Connection'}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-neutral-900 pt-2.5">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Browser Platform OS</span>
                    <span className="text-neutral-400 font-mono">Chromium Linux sandboxed</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-neutral-900">
                <button
                  onClick={handleConnect}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" /> Link New Account (QR)
                </button>
                <button
                  onClick={handleRestoreSession}
                  disabled={actionLoading || !sessionExists}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 border transition-all ${
                    sessionExists
                      ? 'bg-neutral-950 border-neutral-800 text-neutral-350 hover:bg-neutral-900 cursor-pointer'
                      : 'bg-neutral-950/40 border-neutral-900/60 text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <Database className="w-4 h-4" /> Restore Session Data
                </button>
                <button
                  onClick={handleVerifyConnection}
                  disabled={verifying}
                  className="px-5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/30 text-neutral-350 font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> {verifying ? 'Verifying Status...' : 'Verify Session'}
                </button>
                {isConnected && (
                  <button
                    onClick={handleLogout}
                    disabled={actionLoading}
                    className="ml-auto px-5 py-2.5 rounded-xl bg-red-950/20 border border-red-800/40 hover:bg-red-900/20 text-red-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Disconnect
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Active QR Code Scan */}
          <div className="lg:col-span-1">
            {isQR ? (
              <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-4 animate-in slide-in-from-right-4 duration-300">
                <h3 className="font-bold text-neutral-250 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <QrCode className="w-4 h-4 text-emerald-400" /> Active QR Scanner
                </h3>
                <div className="flex flex-col items-center gap-4 p-4 rounded-xl border border-neutral-900 bg-neutral-950/30">
                  <div className="p-3 bg-white rounded-lg shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCode}
                      alt="WhatsApp Login QR Code"
                      className="w-48 h-48 block"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
                    Open WhatsApp &gt; Menu &gt; Linked Devices &gt; Link a Device. Scan this QR Code to authorize.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] text-neutral-500 hover:text-red-400 underline transition-all cursor-pointer"
                  >
                    Cancel Link Sequence
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-4 text-center">
                <h3 className="font-bold text-neutral-200 text-xs uppercase tracking-wider">Session Info</h3>
                <div className="flex flex-col items-center gap-4 py-8 rounded-xl border border-neutral-900 bg-neutral-950/20 text-neutral-500 text-xs">
                  < स्मार्टफोनIcon className="w-12 h-12 text-neutral-700" />
                  <span className="font-medium">No connection configuration active.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: API CREDENTIALS */}
      {activeTab === 'credentials' && (
        <div className="p-6 rounded-2xl border border-neutral-900 bg-[#0A0C14]/30 space-y-6 text-left max-w-3xl">
          <h3 className="font-bold text-neutral-200">Workspace API Credentials</h3>
          <p className="text-xs text-neutral-450 leading-relaxed">Use these keys to authenticate your external ERP integrations, Visual workflow builders, and CLI MCP nodes via custom headers.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Workspace API Key (X-API-KEY)</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={apiKey || 'Generating token...'}
                  className="w-full px-3.5 py-3 rounded-xl text-xs bg-neutral-950 border border-neutral-850 text-neutral-300 font-mono focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(apiKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
                  title="Copy Key"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Workspace API Secret (X-API-SECRET)</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  readOnly
                  value={apiSecret || 'Generating secret...'}
                  className="w-full px-3.5 py-3 rounded-xl text-xs bg-neutral-950 border border-neutral-850 text-neutral-300 font-mono focus:outline-none"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400 font-bold uppercase"
                  >
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiSecret)}
                    className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
                    title="Copy Secret"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {workspace && (
              <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 text-xs flex justify-between items-center font-mono">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">Active Session UUID</span>
                <span className="text-neutral-350 text-[11px]">{workspace.id}</span>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-neutral-900 flex justify-end">
            <button
              onClick={generateNewAPIKey}
              disabled={rotatingKeys}
              className="px-5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-neutral-350 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rotatingKeys ? 'animate-spin' : ''}`} /> Rotate Credentials
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DEVELOPER CONSOLE */}
      {activeTab === 'console' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-stretch">
          
          {/* Form parameters */}
          <div className="lg:col-span-5 glass-card border border-neutral-850 p-6 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block border-b border-neutral-900 pb-2">API Console Parameters</span>
              
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Recipient Number (to)</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-300"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Message Text (message)</label>
                <textarea
                  rows={4}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-300 resize-none"
                />
              </div>
            </div>

            <div className="border-t border-neutral-900 pt-4 flex gap-3">
              <button
                onClick={handleSendTest}
                disabled={sendingTest}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> {sendingTest ? 'Sending Request...' : 'Trigger Send REST API'}
              </button>
            </div>
          </div>

          {/* cURL Block Console */}
          <div className="lg:col-span-7 flex flex-col justify-between glass-card border border-neutral-850 p-6 rounded-2xl space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">REST Client Request (cURL)</span>
                <button
                  onClick={() => copyToClipboard(getCurlSnippet())}
                  className="p-1.5 rounded hover:bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-neutral-200"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="bg-neutral-950/80 rounded-xl p-4 border border-neutral-900 font-mono text-[10px] leading-relaxed text-neutral-400 overflow-x-auto min-h-[160px]">
                <pre>{getCurlSnippet()}</pre>
              </div>
            </div>

            {/* Simulated webhook notice */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-900 rounded-xl text-[10px] text-neutral-450 leading-relaxed font-mono">
              💡 Pro Tip: Send API request payload inside custom headers matching <span className="text-emerald-400">X-API-KEY</span> and <span className="text-emerald-400">X-API-SECRET</span> workspace keys.
            </div>
          </div>

          {/* Bulk Sender Sub-panel */}
          <div className="lg:col-span-12 glass-card border border-neutral-855 p-6 rounded-2xl space-y-6">
            <h3 className="font-bold text-neutral-200">Workspace Campaign Broadcaster</h3>
            
            <form onSubmit={handleSendBulk} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Campaign Name</label>
                  <input
                    type="text"
                    required
                    value={bulkCampaignName}
                    onChange={(e) => setBulkCampaignName(e.target.value)}
                    placeholder="E.g. Festival Offer Q3"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Numbers Database (comma/line separated)</label>
                  <textarea
                    rows={4}
                    required
                    value={bulkNumbers}
                    onChange={(e) => setBulkNumbers(e.target.value)}
                    placeholder="919988776655, 919988776644"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-300 resize-none font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Message / Rich Payload Text</label>
                  <textarea
                    rows={6}
                    required
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    placeholder="Type broadcast message context..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-300 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={schedulingBulk}
                  className="w-full py-3 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MegaphoneIcon className="w-3.5 h-3.5" /> {schedulingBulk ? 'Dispatching Campaign...' : 'Schedule Bulk Broadcast'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* TAB CONTENT: WEBHOOKS CONFIG */}
      {activeTab === 'webhooks' && (
        <div className="p-6 rounded-2xl border border-neutral-900 bg-[#0A0C14]/30 space-y-6 text-left max-w-4xl">
          <h3 className="font-bold text-neutral-200">Webhook Receivers Configurations</h3>
          <p className="text-xs text-neutral-450 leading-relaxed">Register a live endpoint URL on your backend server to capture instant event payloads. Our webhook service executes retry algorithms for failed endpoints.</p>

          <form onSubmit={handleSaveWebhook} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Payload Endpoint URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.yourcompany.com/webhooks/whatsapp"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-emerald-500 text-neutral-200 placeholder-neutral-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Signing Secret Key (SHA256 verification)</label>
                <input
                  type="text"
                  readOnly
                  value={webhookSecret}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-850 text-neutral-400 font-mono focus:outline-none"
                />
              </div>

              {/* Group filter toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-900">
                <div>
                  <span className="text-xs font-bold text-neutral-300 block">Ignore Group Chats</span>
                  <span className="text-[10px] text-neutral-500 block">Do not fire webhook alerts for group conversations.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIgnoreGroups(!ignoreGroups)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors border ${
                    ignoreGroups ? 'bg-emerald-500 border-emerald-400' : 'bg-neutral-800 border-neutral-700'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-neutral-950 transition-transform ${ignoreGroups ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <button
                type="submit"
                disabled={savingWebhook}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> {savingWebhook ? 'Saving Config...' : 'Update Webhooks URL'}
              </button>
            </div>

            {/* Event trigger checklists */}
            <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-950/20 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block border-b border-neutral-900 pb-2">Subscribed Event Triggers</span>
              
              <div className="space-y-3">
                {Object.entries(subscribedEvents).map(([event, value]) => (
                  <label key={event} className="flex items-start gap-3 text-xs text-neutral-350 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => setSubscribedEvents(prev => ({ ...prev, [event]: !value }))}
                      className="mt-0.5 rounded border-neutral-800 text-emerald-500 focus:ring-emerald-500 bg-neutral-950"
                    />
                    <div>
                      <span className="font-bold text-neutral-250 block font-mono text-[11px]">{event}</span>
                      <span className="text-[10px] text-neutral-550 block">Trigger webhook notifications when a {event.split('.')[1]} event occurs.</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT: SESSION LOGS */}
      {activeTab === 'logs' && (
        <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-6 text-left">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-neutral-200">Historical Message Logs</h3>
            <button
              onClick={fetchSessionStatusAndLogs}
              className="p-2 rounded-xl bg-neutral-950 border border-neutral-850 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-all"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="border border-neutral-850 rounded-xl overflow-hidden bg-neutral-950/20">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-850 bg-neutral-900/30 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="px-6 py-3.5">Recipient</th>
                  <th className="px-6 py-3.5">Message Body</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Sent Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-xs text-neutral-350">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-neutral-500 font-mono">No API message dispatches found in this session database.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-950/30">
                      <td className="px-6 py-3.5 font-bold text-neutral-200">
                        {log.Contact?.name || `+${log.phone.replace(/[^\d]/g, '')}`}
                      </td>
                      <td className="px-6 py-3.5 max-w-sm truncate" title={log.message}>
                        {log.message}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.status === 'Sent'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-[10px] text-neutral-500">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// Custom Icons
function स्मार्टफोनIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18.75h12" />
    </svg>
  );
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}
