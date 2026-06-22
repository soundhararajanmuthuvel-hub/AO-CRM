'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import {
  Search,
  Plus,
  Download,
  Upload,
  UserPlus,
  Trash2,
  Tag,
  MapPin,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  TrendingUp,
  Heart,
  DollarSign,
  Briefcase
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  city?: string;
  company?: string;
  tags?: string;
  birthday?: string;
  leadSource?: string;
  leadStage?: string;
  leadScore?: string;
  conversionProbability?: number;
  outstandingAmount?: number;
  healthScore?: string;
}

export default function ContactsCenterPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // New Contact form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [newSource, setNewSource] = useState('Manual Entry');
  const [newStage, setNewStage] = useState('New');
  const [newScore, setNewScore] = useState('Cold');
  const [newProb, setNewProb] = useState('0.0');
  const [newOutstanding, setNewOutstanding] = useState('0.00');
  const [newHealth, setNewHealth] = useState('Active');
  
  const [savingContact, setSavingContact] = useState(false);

  // CSV upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingCSV, setUploadingCSV] = useState(false);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const tagParam = activeTab === 'All' ? '' : activeTab;
      const res = await api.get(`/contacts?search=${encodeURIComponent(search)}&tag=${encodeURIComponent(tagParam)}&limit=100`);
      setContacts(res.data.contacts);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setError('Could not download contacts catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadContacts();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, activeTab]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    setSavingContact(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: newName,
        phone: newPhone,
        city: newCity,
        company: newCompany,
        tags: newTags,
        birthday: newBirthday || null,
        leadSource: newSource,
        leadStage: newStage,
        leadScore: newScore,
        conversionProbability: parseFloat(newProb) || 0.0,
        outstandingAmount: parseFloat(newOutstanding) || 0.00,
        healthScore: newHealth
      };

      await api.post('/contacts', payload);

      setSuccess(`Contact "${newName}" added successfully.`);
      setIsAddModalOpen(false);
      
      // Clear inputs
      setNewName('');
      setNewPhone('');
      setNewCity('');
      setNewCompany('');
      setNewTags('');
      setNewBirthday('');
      setNewSource('Manual Entry');
      setNewStage('New');
      setNewScore('Cold');
      setNewProb('0.0');
      setNewOutstanding('0.00');
      setNewHealth('Active');
      
      loadContacts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register customer contact.');
    } finally {
      setSavingContact(false);
    }
  };

  const handlePromoteStage = async (contactId: string, currentStage: string) => {
    const stages = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
    const idx = stages.indexOf(currentStage);
    if (idx === -1 || idx === stages.length - 1) return;
    
    const nextStage = stages[idx + 1];
    
    // Auto adjust conversion probabilities based on stage
    let prob = 0.1;
    if (nextStage === 'Contacted') prob = 0.25;
    if (nextStage === 'Qualified') prob = 0.50;
    if (nextStage === 'Proposal Sent') prob = 0.70;
    if (nextStage === 'Negotiation') prob = 0.85;
    if (nextStage === 'Won') prob = 1.0;
    if (nextStage === 'Lost') prob = 0.0;

    try {
      await api.put(`/contacts/${contactId}`, {
        leadStage: nextStage,
        conversionProbability: prob
      });
      loadContacts();
    } catch (err) {
      setError('Failed to transition lead stage.');
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete contact: ${name}?`)) return;
    try {
      await api.delete(`/contacts/${id}`);
      setSuccess(`Contact "${name}" deleted.`);
      loadContacts();
    } catch (err) {
      setError('Failed to delete contact.');
    }
  };

  const handleCSVImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadingCSV(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.post('/contacts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(`CSV processed: Imported ${res.data.imported} contacts successfully.`);
      setIsImportModalOpen(false);
      setSelectedFile(null);
      loadContacts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import CSV file.');
    } finally {
      setUploadingCSV(false);
    }
  };

  const handleCSVExport = async () => {
    try {
      const response = await api.get('/contacts/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contacts_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export CSV database.');
    }
  };

  const filterTabs = ['All', 'VIP', 'Retail', 'Wholesale', 'Distributor', 'Supermarket', 'Organic Store'];
  const kanbanStages = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            CRM Customer Center
          </h1>
          <p className="text-sm text-neutral-400">Manage customer tags, health scores, sales pipelines, and lead stages.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-xs font-semibold flex items-center gap-2 text-neutral-300 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-primary" /> Import CSV
          </button>
          <button
            onClick={handleCSVExport}
            className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-xs font-semibold flex items-center gap-2 text-neutral-300 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-primary" /> Export CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Customer
          </button>
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

      {/* Filter and View Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/60 pb-4">
        
        {/* Search & Tabs */}
        <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 placeholder-neutral-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                  activeTab === tab
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-neutral-900/40 border-neutral-800 text-neutral-450 hover:text-neutral-250 hover:bg-neutral-800/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 self-start md:self-auto shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            📋 Grid List
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
              viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            🗂️ Leads Kanban
          </button>
        </div>

      </div>

      {viewMode === 'list' ? (
        /* GRID TABLE LIST */
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-850 text-neutral-500 uppercase text-[9px] font-bold">
                  <th className="pb-3.5 font-bold">Contact Details</th>
                  <th className="pb-3.5 font-bold">Location / Company</th>
                  <th className="pb-3.5 font-bold">Tags</th>
                  <th className="pb-3.5 font-bold">Stage & Source</th>
                  <th className="pb-3.5 font-bold">Score & Health</th>
                  <th className="pb-3.5 font-bold text-right">Outstanding</th>
                  <th className="pb-3.5 font-bold text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/40">
                {loading && contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      No contacts found in this group segment.
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-neutral-900/25 group text-neutral-200">
                      {/* Name & Phone */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-foreground font-bold font-mono">
                            {contact.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-neutral-200 text-sm leading-snug">{contact.name}</span>
                            <span className="block text-[10px] text-neutral-500 font-mono">+{contact.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Location & Company */}
                      <td className="py-4 pr-4">
                        {contact.company && (
                          <span className="flex items-center gap-1 font-semibold text-neutral-300">
                            <Building className="w-3.5 h-3.5 text-neutral-600 shrink-0" /> {contact.company}
                          </span>
                        )}
                        {contact.city && (
                          <span className="flex items-center gap-1 text-[10px] text-neutral-500 mt-1">
                            <MapPin className="w-3 h-3 text-neutral-600 shrink-0" /> {contact.city}
                          </span>
                        )}
                      </td>

                      {/* Tags */}
                      <td className="py-4 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags ? (
                            contact.tags.split(',').map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-450 text-[9px] font-semibold flex items-center gap-1 shrink-0"
                              >
                                <Tag className="w-2.5 h-2.5 text-primary" /> {tag.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-neutral-600">No Tags</span>
                          )}
                        </div>
                      </td>

                      {/* Pipeline Stage */}
                      <td className="py-4 pr-4">
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {contact.leadStage || 'New'}
                        </span>
                        <span className="block text-[9px] text-neutral-500 font-medium mt-1">Source: {contact.leadSource || 'Manual'}</span>
                      </td>

                      {/* Score & Churn Health */}
                      <td className="py-4 pr-4 space-y-1">
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            contact.leadScore === 'Hot' ? 'bg-red-500' : contact.leadScore === 'Warm' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <span className="font-bold text-[10px] text-neutral-350">{contact.leadScore || 'Cold'} Lead</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-neutral-500 font-semibold">
                          <Heart className="w-3 h-3 text-neutral-600" /> Health: {contact.healthScore || 'Active'}
                        </div>
                      </td>

                      {/* Outstanding */}
                      <td className="py-4 pr-4 text-right font-extrabold text-neutral-250">
                        {contact.outstandingAmount && contact.outstandingAmount > 0 ? (
                          <span className="text-red-400">₹{parseFloat(contact.outstandingAmount as any).toFixed(2)}</span>
                        ) : (
                          <span className="text-neutral-500">₹0.00</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right pr-2">
                        <button
                          onClick={() => handleDeleteContact(contact.id, contact.name)}
                          className="p-2 text-neutral-500 hover:text-red-400 hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* LEADS KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4 overflow-x-auto pb-6">
          {kanbanStages.map(stage => {
            const stageLeads = contacts.filter(c => (c.leadStage || 'New') === stage);
            
            return (
              <div key={stage} className="bg-neutral-900/10 border border-neutral-800/80 rounded-2xl p-4 min-w-[200px] flex flex-col space-y-4">
                
                {/* Column header */}
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                  <h4 className="font-bold text-xs text-neutral-300">{stage}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-550 font-bold">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards list */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px]">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/20 text-xs space-y-2.5 shadow-sm group hover:border-neutral-700 transition-all"
                    >
                      <div>
                        <span className="font-bold text-neutral-200 block truncate" title={lead.name}>{lead.name}</span>
                        <span className="text-[10px] text-neutral-550 font-mono mt-0.5 block">+{lead.phone}</span>
                      </div>

                      {/* Prob & score badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-neutral-900/60">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          lead.leadScore === 'Hot' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-neutral-800 text-neutral-450'
                        }`}>
                          {lead.leadScore || 'Cold'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neutral-900 text-neutral-450 border border-neutral-850">
                          {Math.round((lead.conversionProbability || 0) * 100)}% Prob
                        </span>
                      </div>

                      {/* Promote Action */}
                      {stage !== 'Won' && stage !== 'Lost' && (
                        <button
                          onClick={() => handlePromoteStage(lead.id, lead.leadStage || 'New')}
                          className="w-full py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-400 text-[9px] font-extrabold uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                        >
                          Promote Stage <ChevronRight className="w-3 h-3" />
                        </button>
                      )}

                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-[10px] text-neutral-600">
                      Empty stage
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD CONTACT WITH LEAD DETAILS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2 mb-2 uppercase tracking-wider text-primary">
              <UserPlus className="w-5 h-5 text-primary" /> Register CRM Customer
            </h3>
            <p className="text-xs text-neutral-450 mb-6">Create a new customer profile inside this multi-tenant database.</p>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter name"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Mobile * (e.g. 919876543210)</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. 919876543210"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Chennai"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Amudhasurabiy"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g. VIP, Distributor, Wholesale"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Birthday</label>
                  <input
                    type="date"
                    value={newBirthday}
                    onChange={(e) => setNewBirthday(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-neutral-900/60">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Lead Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-350 cursor-pointer"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Manual Entry">Manual Entry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Lead Stage</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-350 cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Lead Score</label>
                  <select
                    value={newScore}
                    onChange={(e) => setNewScore(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-350 cursor-pointer"
                  >
                    <option value="Cold">Cold</option>
                    <option value="Warm">Warm</option>
                    <option value="Hot">Hot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Health Score</label>
                  <select
                    value={newHealth}
                    onChange={(e) => setNewHealth(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-350 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Conversion Probability (0.0 to 1.0)</label>
                  <input
                    type="text"
                    value={newProb}
                    onChange={(e) => setNewProb(e.target.value)}
                    placeholder="e.g. 0.75"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Outstanding Balance (₹)</label>
                  <input
                    type="text"
                    value={newOutstanding}
                    onChange={(e) => setNewOutstanding(e.target.value)}
                    placeholder="e.g. 150.00"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
                >
                  {savingContact ? 'Registering...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" /> Import Contacts from CSV
            </h3>
            <p className="text-xs text-neutral-400 mb-6">Select a comma-separated CSV file containing contact list headers: `name`, `phone` (or `mobile`), `city`, `company`, `tags`, `birthday`.</p>

            <form onSubmit={handleCSVImport} className="space-y-6">
              <div className="border-2 border-dashed border-neutral-800 hover:border-primary/40 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-neutral-950/20 text-center cursor-pointer transition-all">
                <Upload className="w-8 h-8 text-neutral-600" />
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-neutral-300">
                    {selectedFile ? selectedFile.name : 'Choose CSV File'}
                  </span>
                  <span className="block text-[10px] text-neutral-500">Max size 5MB</span>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-0 h-0"
                  id="csv-file-picker"
                />
                <label htmlFor="csv-file-picker" className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-[10px] font-semibold text-neutral-400 mt-1 cursor-pointer">
                  Browse Files
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingCSV || !selectedFile}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    !selectedFile
                      ? 'bg-neutral-950 border border-neutral-800 text-neutral-600 cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10'
                  }`}
                >
                  {uploadingCSV ? 'Importing File...' : 'Start Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
