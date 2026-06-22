'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import {
  FileCode,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Video
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'video';
  fileUrl?: string;
  fileType?: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'text' | 'image' | 'document' | 'video'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError('Could not download message templates catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) return;

    setSavingTemplate(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('content', content);
      formData.append('type', type);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api.post('/templates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(`Template "${name}" saved.`);
      setIsAddModalOpen(false);
      setName('');
      setContent('');
      setType('text');
      setSelectedFile(null);
      loadTemplates();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record message template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete template: ${templateName}?`)) return;
    try {
      await api.delete(`/templates/${id}`);
      setSuccess(`Template "${templateName}" deleted.`);
      loadTemplates();
    } catch (err) {
      setError('Failed to delete template.');
    }
  };

  const insertVariable = (variable: string) => {
    setContent((prev) => prev + ` {{${variable}}}`);
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            Templates Library
          </h1>
          <p className="text-sm text-neutral-400">Design dynamic text and rich-media templates for campaigns and automated rules.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-primary/10"
        >
          <Plus className="w-3.5 h-3.5" /> Create Template
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

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full py-16 text-center text-neutral-500 border border-neutral-800 border-dashed rounded-2xl">
            No templates configured yet. Click create above.
          </div>
        ) : (
          templates.map((tpl) => {
            const Icon = tpl.type === 'image' ? ImageIcon : tpl.type === 'document' ? FileText : tpl.type === 'video' ? Video : FileCode;
            return (
              <div key={tpl.id} className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/10 flex flex-col justify-between h-[280px]">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8.5 h-8.5 rounded-lg bg-neutral-850 border border-neutral-800 flex items-center justify-center shrink-0 text-primary">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h3 className="font-bold text-neutral-200 text-sm truncate">{tpl.name}</h3>
                        <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">{tpl.type}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                      className="text-neutral-500 hover:text-red-400 p-1.5 hover:bg-neutral-800 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-3 bg-neutral-950/35 rounded-xl border border-neutral-800/50 h-32 overflow-y-auto text-[11.5px] leading-relaxed text-neutral-400 whitespace-pre-wrap select-all">
                    {tpl.content}
                  </div>
                </div>

                {/* Footer Attachment */}
                {tpl.fileUrl && (
                  <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 text-[10px] font-semibold text-neutral-350 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{tpl.fileUrl.split('/').pop()}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: CREATE TEMPLATE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2 mb-2">
              <FileCode className="w-5 h-5 text-primary" /> Create Reusable Template
            </h3>
            <p className="text-xs text-neutral-400 mb-6">Build a template. Customize variables to inject user details on delivery.</p>

            <form onSubmit={handleAddTemplate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Payment Reminder"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 placeholder-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Payload Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-450"
                  >
                    <option value="text">Text only</option>
                    <option value="image">Image Attachment</option>
                    <option value="document">PDF Document</option>
                    <option value="video">Video Media</option>
                  </select>
                </div>
              </div>

              {/* Variable Injector */}
              <div>
                <span className="block text-xs font-semibold text-neutral-500 mb-1.5">Personalization Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {['name', 'phone', 'city', 'company'].map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-primary/20 hover:text-primary-foreground border border-neutral-700/80 text-[10px] font-bold text-neutral-400 transition-all"
                    >
                      +{`{{${variable}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Template Content *</label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hello {{name}}, thank you for supporting our organic stores..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 placeholder-neutral-600 resize-none font-mono"
                />
              </div>

              {/* Dynamic File Uploader */}
              {type !== 'text' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Attach {type.charAt(0).toUpperCase() + type.slice(1)} File *
                  </label>
                  <div className="border border-dashed border-neutral-800 hover:border-primary/40 rounded-xl p-4 flex items-center justify-center gap-3 bg-neutral-950/20 text-center cursor-pointer relative">
                    <Paperclip className="w-4 h-4 text-neutral-600 shrink-0" />
                    <span className="text-xs font-medium text-neutral-400 truncate max-w-[200px]">
                      {selectedFile ? selectedFile.name : 'Select attachment file'}
                    </span>
                    <input
                      type="file"
                      required
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setName('');
                    setContent('');
                    setType('text');
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/95 shadow-md shadow-primary/10"
                >
                  {savingTemplate ? 'Saving...' : 'Add Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
