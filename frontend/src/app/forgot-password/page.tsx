'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { AlertCircle, CheckCircle, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setSuccess('');
    
    setTimeout(() => {
      setSuccess(`Verification email dispatched to ${email}. Check your spam folder.`);
      setLoading(false);
      setEmail('');
    }, 1500);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 py-12 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Forgot Card */}
      <div className="w-full max-w-md p-8 rounded-3xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md relative z-10 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-xl text-primary-foreground mx-auto">
            W
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-100 tracking-tight">Forgot Password</h2>
            <p className="text-xs text-neutral-500">Provide email to retrieve credentials.</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/25 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-green-950/25 border border-green-800/40 text-green-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 placeholder-neutral-650"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
          >
            {loading ? 'Dispatched request...' : 'Send Recovery Link'}
          </button>
        </form>

        <p className="text-center text-xs">
          <a href="/login" className="text-neutral-500 hover:text-neutral-300 font-semibold flex items-center justify-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </a>
        </p>

      </div>
    </main>
  );
}
