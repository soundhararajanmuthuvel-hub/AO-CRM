'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import {
  Zap,
  PlusCircle,
  Trash2,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle,
  FileDown
} from 'lucide-react';

interface Rule {
  id: string;
  keyword: string;
  response: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
}

export default function AutoRepliesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  // Form input states
  const [newKeyword, setNewKeyword] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [addingRule, setAddingRule] = useState(false);

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingCatalog, setUploadingCatalog] = useState(false);

  // Global Alerts
  const [errorAlert, setErrorAlert] = useState('');
  const [successAlert, setSuccessAlert] = useState('');

  const fetchRules = async () => {
    try {
      const res = await api.get('/auto-replies');
      setRules(res.data);
    } catch (err) {
      console.error('Failed to load auto-reply rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newResponse.trim()) return;

    setAddingRule(true);
    setErrorAlert('');
    setSuccessAlert('');
    try {
      const res = await api.post('/auto-replies', {
        keyword: newKeyword.trim(),
        response: newResponse.trim()
      });
      if (res.data.success) {
        setRules(prev => [...prev, res.data.rule]);
        setNewKeyword('');
        setNewResponse('');
        setSuccessAlert(`Auto-reply rule created for keyword: "${res.data.rule.keyword}"`);
      }
    } catch (err: any) {
      setErrorAlert(err.response?.data?.error || 'Failed to create auto-reply rule.');
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this auto-reply rule?')) return;

    setErrorAlert('');
    setSuccessAlert('');
    try {
      const res = await api.delete(`/auto-replies/${ruleId}`);
      if (res.data.success) {
        setRules(prev => prev.filter(r => r.id !== ruleId));
        setSuccessAlert('Auto-reply rule deleted successfully.');
      }
    } catch (err) {
      setErrorAlert('Failed to delete auto-reply rule.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadingCatalog(true);
    setErrorAlert('');
    setSuccessAlert('');
    try {
      const formData = new FormData();
      formData.append('catalog', selectedFile);

      const res = await api.post('/auto-replies/upload-catalog', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setSuccessAlert('Product catalogue PDF uploaded successfully. Trigger keyword "catalogue" is mapped!');
        setSelectedFile(null);
        fetchRules(); // reload rules to capture updated media files
      }
    } catch (err: any) {
      setErrorAlert(err.response?.data?.error || 'Catalogue PDF upload failed.');
    } finally {
      setUploadingCatalog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
          Auto Replies & Catalogues
        </h1>
        <p className="text-sm text-neutral-400">
          Create keyword-based triggers to automatically respond to customer queries or dispatch PDFs.
        </p>
      </div>

      {/* Alerts */}
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
        
        {/* Left Column: Catalogue uploader and Rule Creator */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Document Catalogue Uploader */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-4">
            <h3 className="font-bold text-neutral-250 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" /> Catalogue PDF Uploader
            </h3>
            <p className="text-xs text-neutral-450">
              Upload your company catalogue sheet. Customers sending the keyword <span className="font-mono text-primary font-bold">"catalogue"</span> will automatically receive this file.
            </p>

            <form onSubmit={handleUploadCatalog} className="space-y-4">
              <div className="border border-dashed border-neutral-800 rounded-xl p-6 text-center hover:border-neutral-700 transition-all relative">
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileText className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <span className="block text-xs font-bold text-neutral-350">
                  {selectedFile ? selectedFile.name : 'Select catalog PDF file'}
                </span>
                <span className="block text-[10px] text-neutral-500 mt-1">
                  Only PDF sheets up to 10MB allowed.
                </span>
              </div>

              <button
                type="submit"
                disabled={uploadingCatalog || !selectedFile}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs tracking-wider uppercase hover:bg-primary/95 disabled:bg-neutral-950 disabled:border disabled:border-neutral-850 disabled:text-neutral-600 transition-all flex items-center justify-center gap-1.5"
              >
                {uploadingCatalog ? 'Uploading catalogue...' : 'Upload Catalogue'}
              </button>
            </form>
          </div>

          {/* Trigger Keyword Rule Creator */}
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10 space-y-4">
            <h3 className="font-bold text-neutral-250 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-primary" /> Add Trigger Keyword
            </h3>
            <p className="text-xs text-neutral-450">
              Add auto-responses for custom keywords (e.g. triggers on exact keyword matches).
            </p>

            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Trigger Keyword</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. price"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Response Content</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Please tell us the product name..."
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={addingRule}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs tracking-wider uppercase hover:bg-primary/95 disabled:bg-neutral-950 disabled:border disabled:border-neutral-850 disabled:text-neutral-600 transition-all flex items-center justify-center gap-1.5"
              >
                {addingRule ? 'Creating...' : 'Create Auto-Reply Trigger'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Rules list */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/10">
            <h3 className="font-bold text-neutral-200 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Active Auto Reply Rules
            </h3>

            <div className="space-y-4">
              {rules.length === 0 ? (
                <p className="text-center text-xs text-neutral-500 py-12">
                  No custom auto-reply triggers configured yet.
                </p>
              ) : (
                rules.map(rule => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl border border-neutral-850 bg-neutral-950/20 hover:border-neutral-800 transition-all flex justify-between items-start gap-4"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-primary/10 text-primary-foreground font-mono">
                          {rule.keyword}
                        </span>
                        {rule.mediaUrl && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neutral-850 text-neutral-400 flex items-center gap-1">
                            <FileDown className="w-3 h-3 text-primary" /> PDF Catalog Attachment
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-350 leading-relaxed font-sans">{rule.response}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-neutral-600 hover:text-red-400 transition-all shrink-0 p-1 rounded hover:bg-neutral-900/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
