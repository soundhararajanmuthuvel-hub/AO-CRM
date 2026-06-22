'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import {
  FileText,
  Search,
  RefreshCw,
  Clock,
  ShieldAlert,
  UserCheck,
  Zap,
  Info
} from 'lucide-react';

interface AuditLog {
  id: string;
  workspaceId: string | null;
  userId: string | null;
  userEmail: string | null;
  action: string;
  details: any;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Could not load audit logging entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) || 
    (l.userEmail && l.userEmail.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            Audit logs & System Events
          </h1>
          <p className="text-sm text-neutral-400">Review security records, plan upgrades, manual adjustments, and user login logs.</p>
        </div>
        <button
          onClick={loadLogs}
          className="p-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-neutral-400 self-start md:self-auto transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/50 text-red-300 text-sm flex items-center gap-3">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="relative max-w-md w-full">
        <Search className="w-4.5 h-4.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by action name or user email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 placeholder-neutral-600"
        />
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500 uppercase font-semibold">
                <th className="pb-3 font-semibold">Action Type</th>
                <th className="pb-3 font-semibold">Initiated By</th>
                <th className="pb-3 font-semibold">Metadata details</th>
                <th className="pb-3 font-semibold text-right">Event Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-500">
                    No matching audit events logged.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const isAuth = l.action.includes('LOGIN');
                  const isChange = l.action.includes('CHANGE') || l.action.includes('UPDATE');
                  const isDelete = l.action.includes('DELETION');

                  return (
                    <tr key={l.id} className="hover:bg-neutral-900/25 group font-medium text-neutral-350">
                      {/* Action */}
                      <td className="py-4 pr-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          isAuth
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : isChange
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : isDelete
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-neutral-850 text-neutral-400 border-neutral-800'
                        }`}>
                          {l.action.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-4 pr-4 text-neutral-200">
                        {l.userEmail || 'System Automatic'}
                      </td>

                      {/* Details */}
                      <td className="py-4 pr-4 text-xs font-mono text-neutral-450 leading-relaxed max-w-sm truncate">
                        {l.details ? (
                          <span className="flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                            {JSON.stringify(l.details)}
                          </span>
                        ) : (
                          <span className="text-neutral-600">-</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 text-right text-neutral-550 font-mono text-[10px]">
                        {new Date(l.createdAt).toLocaleString()}
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
