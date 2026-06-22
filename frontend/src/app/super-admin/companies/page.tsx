'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import {
  Search,
  Building,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Key,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  MapPin,
  CheckCircle,
  Globe,
  Settings,
  AlertCircle
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  subscriptionPlan: string;
  users: number;
  whatsappAccounts: number;
  status: string;
  planExpiryDate: string | null;
  userLimit: number;
  contactLimit: number;
  leadLimit: number;
  whatsappLimit: number;
  storageLimit: number;
  customDomain: string | null;
}

export default function CompaniesManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing state
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editUserLimit, setEditUserLimit] = useState(5);
  const [editContactLimit, setEditContactLimit] = useState(1000);
  const [editWhatsAppLimit, setEditWhatsAppLimit] = useState(1);
  const [editStorageLimit, setEditStorageLimit] = useState(100);
  const [editCustomDomain, setEditCustomDomain] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const { impersonate } = useAuth();

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/companies');
      setCompanies(res.data);
    } catch (err) {
      console.error('Failed to load companies:', err);
      setError('Could not load company tenants directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleEditClick = (c: Company) => {
    setEditingCompany(c);
    setEditName(c.name);
    setEditPlan(c.subscriptionPlan);
    setEditStatus(c.status);
    setEditUserLimit(c.userLimit);
    setEditContactLimit(c.contactLimit);
    setEditWhatsAppLimit(c.whatsappLimit);
    setEditStorageLimit(c.storageLimit);
    setEditCustomDomain(c.customDomain || '');
    setEditExpiryDate(c.planExpiryDate ? c.planExpiryDate.split('T')[0] : '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/super-admin/companies/${editingCompany.id}`, {
        name: editName,
        subscriptionPlan: editPlan,
        status: editStatus,
        userLimit: editUserLimit,
        contactLimit: editContactLimit,
        leadLimit: editContactLimit, // aligns lead limits with contacts limit
        whatsappLimit: editWhatsAppLimit,
        storageLimit: editStorageLimit,
        customDomain: editCustomDomain || null,
        planExpiryDate: editExpiryDate ? new Date(editExpiryDate) : null
      });

      setSuccess(`Workspace limits for "${editName}" updated successfully.`);
      setEditingCompany(null);
      loadCompanies();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async (id: string, name: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const actionWord = nextStatus === 'suspended' ? 'suspend' : 'activate';
    
    if (!confirm(`Are you sure you want to ${actionWord} company: "${name}"?`)) return;

    try {
      await api.put(`/super-admin/companies/${id}`, { status: nextStatus });
      setSuccess(`Company "${name}" ${nextStatus === 'suspended' ? 'suspended' : 'activated'}.`);
      loadCompanies();
    } catch (err) {
      setError(`Failed to adjust subscription status.`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`CRITICAL WARNING: This will permanently delete the tenant "${name}" and all associated CRM contacts, WhatsApp messages, order cards, and sessions logs. This action CANNOT be undone. Proceed?`)) return;

    try {
      await api.delete(`/super-admin/companies/${id}`);
      setSuccess(`Company "${name}" successfully deleted from the platform.`);
      loadCompanies();
    } catch (err) {
      setError('Failed to delete company tenant.');
    }
  };

  const handleImpersonate = async (id: string, name: string) => {
    try {
      const res = await api.post(`/super-admin/companies/${id}/impersonate`);
      setSuccess(`Impersonation initialized. Accessing: ${name}`);
      impersonate(res.data.token, res.data.user, res.data.workspace);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize login delegation.');
    }
  };

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            Company Directory
          </h1>
          <p className="text-sm text-neutral-400">View registered workspaces, adjust plans, manage usage locks, and login as tenant owners.</p>
        </div>
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

      {/* Search and Filters */}
      <div className="relative max-w-md w-full">
        <Search className="w-4.5 h-4.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by company name, owner, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 placeholder-neutral-600"
        />
      </div>

      {/* Companies Table */}
      <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500 uppercase font-semibold">
                <th className="pb-3 font-semibold">Company Profile</th>
                <th className="pb-3 font-semibold">Subscription Plan</th>
                <th className="pb-3 font-semibold">Tenancy Scope</th>
                <th className="pb-3 font-semibold">Domain Mapping</th>
                <th className="pb-3 font-semibold">Status / Expiry</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40">
              {loading && companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    No matching companies found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const planColors: Record<string, string> = {
                    free: 'bg-neutral-800 text-neutral-400 border-neutral-700',
                    starter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    pro: 'bg-primary/10 text-primary border-primary/25',
                    enterprise: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  };

                  const statusColors: Record<string, string> = {
                    active: 'text-green-400 bg-green-500/5 border-green-500/10',
                    trial: 'text-amber-400 bg-amber-500/5 border-amber-500/10',
                    expired: 'text-red-400 bg-red-500/5 border-red-500/10',
                    suspended: 'text-neutral-500 bg-neutral-900 border-neutral-850'
                  };

                  return (
                    <tr key={c.id} className="hover:bg-neutral-900/25 group">
                      {/* Name & Owner */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-foreground font-bold font-mono">
                            {c.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-neutral-250 text-sm leading-tight">{c.name}</span>
                            <span className="block text-[10px] text-neutral-500 font-medium mt-0.5">
                              Owner: {c.ownerName} ({c.email})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-4 pr-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${planColors[c.subscriptionPlan] || planColors.free}`}>
                          {c.subscriptionPlan}
                        </span>
                      </td>

                      {/* Usage details */}
                      <td className="py-4 pr-4 text-neutral-450 font-medium font-mono text-[10px]">
                        <div>Users: {c.users} / {c.userLimit}</div>
                        <div>WA Channels: {c.whatsappAccounts} / {c.whatsappLimit}</div>
                        <div>Contacts: {c.contactLimit.toLocaleString()} limit</div>
                      </td>

                      {/* Custom Domain */}
                      <td className="py-4 pr-4 text-neutral-400">
                        {c.customDomain ? (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-blue-400">
                            <Globe className="w-3.5 h-3.5 shrink-0" /> {c.customDomain}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-600">Default Sandbox</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 pr-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[c.status] || statusColors.trial}`}>
                          {c.status}
                        </span>
                        {c.planExpiryDate && (
                          <span className="block text-[10px] text-neutral-500 font-medium mt-1">
                            Expires: {new Date(c.planExpiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleImpersonate(c.id, c.name)}
                            className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700 text-[10px] font-bold flex items-center gap-1 text-primary-foreground shadow-sm transition-all"
                            title="Login As Company Owner"
                          >
                            <Key className="w-3.5 h-3.5 text-primary" /> Login As
                          </button>
                          <button
                            onClick={() => handleEditClick(c)}
                            className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-all"
                            title="Edit Limits & Plan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSuspend(c.id, c.name, c.status)}
                            className={`p-2 rounded-lg transition-all ${
                              c.status === 'suspended'
                                ? 'text-green-500 hover:bg-green-500/10'
                                : 'text-neutral-550 hover:text-amber-400 hover:bg-amber-500/10'
                            }`}
                            title={c.status === 'suspended' ? 'Activate Company' : 'Suspend Company'}
                          >
                            {c.status === 'suspended' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="p-2 text-neutral-550 hover:text-red-400 hover:bg-destructive/10 rounded-lg transition-all"
                            title="Delete Company"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-primary" /> Adjust Tenancy Lock & Plan
            </h3>
            <p className="text-xs text-neutral-400 mb-6">Modify platform configuration limits for workspace: <span className="font-bold text-neutral-200">"{editingCompany.name}"</span></p>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Workspace Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Custom Domain Mapping</label>
                  <input
                    type="text"
                    value={editCustomDomain}
                    onChange={(e) => setEditCustomDomain(e.target.value)}
                    placeholder="e.g. crm.domain.com"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Subscription Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-400"
                  >
                    <option value="free">Free sandbox</option>
                    <option value="starter">Starter tier</option>
                    <option value="pro">Professional tier</option>
                    <option value="enterprise">Enterprise VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-400"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial status</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Expiry Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-neutral-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={editExpiryDate}
                      onChange={(e) => setEditExpiryDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Max Users Allowed</label>
                  <input
                    type="number"
                    required
                    value={editUserLimit}
                    onChange={(e) => setEditUserLimit(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Max WhatsApp accounts</label>
                  <input
                    type="number"
                    required
                    value={editWhatsAppLimit}
                    onChange={(e) => setEditWhatsAppLimit(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Max Contacts</label>
                  <input
                    type="number"
                    required
                    value={editContactLimit}
                    onChange={(e) => setEditContactLimit(parseInt(e.target.value) || 100)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Storage Limit (MB)</label>
                  <input
                    type="number"
                    required
                    value={editStorageLimit}
                    onChange={(e) => setEditStorageLimit(parseInt(e.target.value) || 10)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/95 shadow-md shadow-primary/10"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
