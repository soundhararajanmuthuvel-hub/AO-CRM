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
  ClipboardList,
  Database,
  ShieldCheck,
  Zap,
  Check
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
  const { user } = useAuth();
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

  // Error/Success Alerts
  const [errorAlert, setErrorAlert] = useState('');
  const [successAlert, setSuccessAlert] = useState('');

  // Test Message Form States
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Bulk Message Form States
  const [bulkCampaignName, setBulkCampaignName] = useState('');
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [schedulingBulk, setSchedulingBulk] = useState(false);

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
      console.error('Failed to load initial connection profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchSessionStatusAndLogs();

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
        // Refresh status to grab number and pushname
        api.get('/whatsapp/status').then(res => {
          setPhoneNumber(res.data.phoneNumber);
          setPushname(res.data.pushname);
        }).catch(() => {});
        api.get('/whatsapp/logs').then(res => setLogs(res.data)).catch(() => {});
      } else if (data.status === 'Disconnected') {
        // Re-check if files exist on disk
        api.get('/whatsapp/session').then(res => setSessionExists(res.data.exists)).catch(() => {});
        setPhoneNumber(null);
        setPushname(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

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
      setSessionExists(false); // Creating a new connection wipes old session folder
      setPhoneNumber(null);
      setPushname(null);
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
        setTestPhone('');
        setTestMessage('');
        fetchSessionStatusAndLogs(); // Reload logs
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
        fetchSessionStatusAndLogs(); // Refresh logs
      }
    } catch (err: any) {
      setErrorAlert(err.response?.data?.error || 'Failed to initialize bulk campaign.');
    } finally {
      setSchedulingBulk(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
          WhatsApp Messaging Console
        </h1>
        <p className="text-sm text-neutral-400">Configure real-time integrations, scan QRs, and execute text campaigns.</p>
      </div>

      {/* Global Alerts */}
      {errorAlert && (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/50 text-red-300 text-sm flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>Error: <span className="font-bold">{errorAlert}</span></span>
        </div>
      )}

      {successAlert && (
        <div className="p-4 rounded-lg bg-green-950/20 border border-green-800/50 text-green-300 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{successAlert}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Device Connection Panel */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Connection Status Card */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-6">
            <h3 className="font-bold text-neutral-200">WhatsApp Connection</h3>

            <div className="space-y-4">
              {/* Status Row */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/20">
                <span className="text-xs font-semibold text-neutral-400">Current Status</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : isInitializing || isAuthenticating ? 'bg-amber-500 animate-spin' : 'bg-red-500'
                  }`} />
                  <span className={`text-xs font-bold capitalize ${
                    isConnected ? 'text-green-400' : isInitializing || isAuthenticating ? 'text-amber-500' : 'text-neutral-450'
                  }`}>{status === 'READY' ? 'Connected' : status}</span>
                </div>
              </div>

              {/* Number and Pushname Row if connected */}
              {isConnected && (
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 text-left text-xs space-y-2 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Current Number</span>
                    <span className="font-bold text-neutral-200">
                      {phoneNumber ? `+${phoneNumber.replace(/[^\d]/g, '')}` : '+91XXXXXXXXXX'}
                    </span>
                  </div>
                  {pushname && (
                    <div className="flex justify-between items-center border-t border-neutral-800/50 pt-2">
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold">Device Profile</span>
                      <span className="text-neutral-300 font-medium">{pushname}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connection Methods Options */}
            <div className="space-y-4 border-t border-neutral-800/60 pt-6">
              
              {/* Option 1: Connect via QR Code */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/20 hover:bg-neutral-950/40 transition-all space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary shrink-0" />
                  <h4 className="text-xs font-bold text-neutral-200">Connect with QR Code</h4>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Scan a new WhatsApp account using QR code.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={actionLoading}
                  className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs tracking-wider uppercase hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"
                >
                  Connect with QR Code
                </button>
              </div>

              {/* Option 2: Use Existing Logged-In Device */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/20 hover:bg-neutral-950/40 transition-all space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary shrink-0" />
                  <h4 className="text-xs font-bold text-neutral-200">Use Existing Session</h4>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Connect using previously saved LocalAuth session.
                </p>
                
                {/* Warning message if session doesn't exist */}
                {!sessionExists && (
                  <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-300 text-[10px] leading-relaxed">
                    No existing session found. Please connect using QR Code.
                  </div>
                )}

                <button
                  onClick={handleRestoreSession}
                  disabled={actionLoading}
                  className={`w-full py-2 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                    sessionExists 
                      ? 'bg-neutral-950 border border-neutral-800 text-neutral-300 hover:bg-neutral-900' 
                      : 'bg-neutral-950/50 border border-neutral-900 text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  Use Existing Session
                </button>
              </div>
            </div>

            {/* Disconnect Action if connected */}
            {isConnected && (
              <div className="pt-2 border-t border-neutral-800/60">
                <button
                  onClick={handleLogout}
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-red-950/20 border border-red-800/50 hover:bg-red-900/20 text-red-300 font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Disconnect Current WhatsApp
                </button>
              </div>
            )}
          </div>

          {/* Active QR Code Display Card */}
          {isQR && (
            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-4 animate-in fade-in duration-300">
              <h3 className="font-bold text-neutral-250 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <QrCode className="w-4 h-4 text-primary" /> Active QR Code Scan
              </h3>
              <div className="flex flex-col items-center gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-950/30">
                <div className="p-3 bg-white rounded-lg shadow-inner">
                  <img
                    src={qrCode}
                    alt="WhatsApp Login QR Code"
                    className="w-48 h-48 block"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 text-center">
                  Open WhatsApp &gt; Menu &gt; Linked Devices &gt; Link a Device.
                </p>
                <button
                  onClick={handleLogout}
                  className="text-[11px] text-neutral-500 hover:text-red-400 underline transition-all"
                >
                  Cancel Connection Sequence
                </button>
              </div>
            </div>
          )}

          {/* Test Message Form */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-4">
            <h3 className="font-bold text-neutral-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Test Message Dispatcher
            </h3>
            <p className="text-xs text-neutral-400">Send an immediate individual test message to verify the connection.</p>
            
            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Message Text</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter test message contents..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sendingTest || !isConnected}
                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  !isConnected
                    ? 'bg-neutral-950 border border-neutral-850 text-neutral-600 cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/95'
                }`}
              >
                {sendingTest ? 'Sending...' : 'Test Message'}
              </button>
            </form>
          </div>

        </div>

        {/* Center / Right Columns: Bulk Messaging & Logs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Bulk Messaging Form */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-4">
            <h3 className="font-bold text-neutral-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Bulk Campaign Creator
            </h3>
            <p className="text-xs text-neutral-400">Queue messages to be sent sequentially with randomized delay intervals.</p>

            <form onSubmit={handleSendBulk} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Campaign Reference Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bulk Invoice Dispatch"
                    value={bulkCampaignName}
                    onChange={(e) => setBulkCampaignName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Phone Numbers (Comma or Newline separated)</label>
                  <textarea
                    rows={1}
                    required
                    placeholder="919876543210, 919876543211..."
                    value={bulkNumbers}
                    onChange={(e) => setBulkNumbers(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Bulk Message Template Text (Supports {"`{{name}}`"} variables)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Hello {{name}}, thank you for being a customer..."
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 resize-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={schedulingBulk || !isConnected}
                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  !isConnected
                    ? 'bg-neutral-950 border border-neutral-850 text-neutral-600 cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/95'
                }`}
              >
                {schedulingBulk ? 'Scheduling Queue...' : 'Queue Bulk Messages'}
              </button>
            </form>
          </div>

          {/* Audit Logs Table */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
            <h3 className="font-bold text-neutral-200 mb-2 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" /> Transmission logs
            </h3>
            <p className="text-xs text-neutral-400 mb-6">Complete record of sent and failed dispatches.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500 uppercase font-semibold">
                    <th className="pb-3 font-semibold">Recipient</th>
                    <th className="pb-3 font-semibold">Message Content</th>
                    <th className="pb-3 font-semibold">Time</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-neutral-500">
                        No logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-900/25">
                        <td className="py-3 font-bold text-neutral-300 pr-4">
                          <span className="block text-neutral-200">{log.Contact?.name || 'Quick Dispatch'}</span>
                          <span className="block text-[10px] text-neutral-500 font-semibold">+{log.phone}</span>
                        </td>
                        <td className="py-3 text-neutral-400 max-w-[300px] truncate pr-4" title={log.message}>
                          {log.message}
                        </td>
                        <td className="py-3 text-neutral-500 whitespace-nowrap pr-4">
                          {new Date(log.sentAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                              log.status === 'Sent' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {log.status}
                            </span>
                            {log.error && (
                              <span className="text-[9px] text-red-400 block mt-1 max-w-[120px] truncate" title={log.error}>
                                {log.error}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
