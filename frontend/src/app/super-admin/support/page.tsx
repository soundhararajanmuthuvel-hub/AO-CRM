'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Flag,
  User,
  Building,
  RefreshCw,
  Search,
  CheckCircle
} from 'lucide-react';

interface Reply {
  sender: string;
  message: string;
  time: string;
}

interface SupportTicket {
  id: string;
  workspaceName: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  replies: Reply[];
  createdAt: string;
  resolvedAt: string | null;
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Ticket detail view
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [closeOnReply, setCloseOnReply] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/tickets');
      setTickets(res.data);
      
      // Update active ticket state if currently viewing one
      if (activeTicket) {
        const updated = res.data.find((t: SupportTicket) => t.id === activeTicket.id);
        if (updated) setActiveTicket(updated);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Could not load active support tickets catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    setSendingReply(true);
    setError('');
    setSuccess('');
    try {
      await api.post(`/super-admin/tickets/${activeTicket.id}/reply`, {
        message: replyText,
        closeTicket: closeOnReply
      });

      setSuccess(closeOnReply ? 'Ticket marked resolved & closed.' : 'Reply sent successfully.');
      setReplyText('');
      setCloseOnReply(false);
      await loadTickets();
    } catch (err) {
      setError('Failed to dispatch support reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const filtered = tickets.filter(t => {
    const matchesSearch = t.workspaceName.toLowerCase().includes(search.toLowerCase()) || 
                          t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            Support Center
          </h1>
          <p className="text-sm text-neutral-400">Review ticket tickets raised by company teams and communicate in real-time.</p>
        </div>
        <button
          onClick={loadTickets}
          className="p-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-neutral-400 self-start md:self-auto transition-all"
        >
          <RefreshCw className="w-4 h-4" />
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

      {/* Main Grid: Ticket list on left, chat thread on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tickets directory */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 placeholder-neutral-600"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-400"
            >
              <option value="All">All Tickets</option>
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[550px] pr-2">
            {loading && tickets.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-550 border border-dashed border-neutral-850 rounded-xl">
                No tickets matches filters.
              </div>
            ) : (
              filtered.map((t) => {
                const isActive = activeTicket?.id === t.id;
                const isHigh = t.priority === 'high';
                const isResolved = t.status === 'resolved';

                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTicket(t)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                        : 'border-neutral-850 hover:border-neutral-800 bg-neutral-900/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-1">
                        <Building className="w-3 h-3" /> {t.workspaceName}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                        isResolved
                          ? 'bg-neutral-800 text-neutral-450 border-neutral-700'
                          : isHigh
                          ? 'bg-red-500/10 text-red-400 border-red-500/25 animate-pulse'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="block font-bold text-xs text-neutral-200 truncate">{t.subject}</span>
                      <span className="block text-[11px] text-neutral-550 truncate">{t.description}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono mt-1 border-t border-neutral-850/60 pt-2">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-neutral-600" /> {t.replies.length} replies
                      </span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation Thread */}
        <div className="lg:col-span-7 border border-neutral-800 bg-neutral-900/10 rounded-2xl p-6 flex flex-col justify-between min-h-[500px]">
          {activeTicket ? (
            <div className="flex flex-col h-full justify-between gap-6">
              
              {/* Ticket details header */}
              <div className="border-b border-neutral-800/80 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                    {activeTicket.subject}
                  </h3>
                  <span className="text-[10px] font-medium text-neutral-550">
                    Raised: {new Date(activeTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <div className="p-3.5 bg-neutral-950/40 border border-neutral-850 rounded-xl text-xs text-neutral-400 leading-relaxed">
                  <span className="text-[10px] font-bold text-neutral-500 block mb-1">CUSTOMER DESCRIPTION</span>
                  {activeTicket.description}
                </div>
              </div>

              {/* Chat replies log */}
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] pr-2">
                {activeTicket.replies.length === 0 ? (
                  <div className="text-center py-12 text-[11px] text-neutral-650 font-medium">
                    No conversation logs recorded on this ticket yet.
                  </div>
                ) : (
                  activeTicket.replies.map((reply, index) => {
                    const isStaff = reply.sender === 'Super Admin';
                    return (
                      <div
                        key={index}
                        className={`flex flex-col max-w-[85%] gap-1 ${
                          isStaff ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                          {reply.sender}
                        </span>
                        <div className={`p-3 rounded-2xl text-xs ${
                          isStaff 
                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                            : 'bg-neutral-900 border border-neutral-850 text-neutral-300 rounded-tl-none'
                        }`}>
                          {reply.message}
                        </div>
                        <span className="text-[8px] text-neutral-550 font-mono">
                          {new Date(reply.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Form */}
              {activeTicket.status !== 'resolved' ? (
                <form onSubmit={handleSendReply} className="border-t border-neutral-800/80 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-neutral-450 uppercase">Type Administrative Reply</label>
                    <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={closeOnReply}
                        onChange={(e) => setCloseOnReply(e.target.checked)}
                        className="rounded border-neutral-800 bg-neutral-950 text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      Resolve & Close Ticket
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Write response message..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 text-xs flex items-center gap-1 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-neutral-900/20 border border-neutral-800/50 rounded-xl text-center flex items-center justify-center gap-2 text-xs text-neutral-500 font-semibold">
                  <CheckCircle className="w-4 h-4 text-neutral-600" />
                  This support ticket is closed. Resolved at: {activeTicket.resolvedAt ? new Date(activeTicket.resolvedAt).toLocaleDateString() : 'N/A'}
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full gap-3 py-16">
              <Inbox className="w-8 h-8 text-neutral-700" />
              <div className="space-y-1">
                <span className="block text-xs font-bold text-neutral-400">No ticket selected</span>
                <span className="block text-[11px] text-neutral-600">Select any ticket from the sidebar lists to view conversations.</span>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
