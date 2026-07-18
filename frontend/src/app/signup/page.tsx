'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Lock, Mail, Building, User, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const { user, signup, googleLogin, loading } = useAuth();
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !name || !email || !password) return;

    setLocalLoading(true);
    setError('');
    try {
      await signup(companyName, name, email, password);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Verify input details.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalLoading(true);
    setError('');
    try {
      const mockGoogleId = 'google_12948719284710293';
      const mockEmail = 'admin@amudhasurabiy.com';
      const mockName = 'Amudhasurabiy Admin';
      await googleLogin(mockGoogleId, mockEmail, mockName);
    } catch (err: any) {
      setError(err.message || 'Google Auth simulation failed.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0A0C14] px-4 py-12 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] aurora-glow-emerald rounded-full blur-[140px] pointer-events-none filter" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] aurora-glow-indigo rounded-full blur-[140px] pointer-events-none filter" />

      {/* Signup Card */}
      <div className="w-full max-w-md p-8 rounded-3xl glass-card border border-neutral-850 relative z-10 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-neutral-950 font-black text-sm">W</span>
            <span className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">WHATSFLOW AI</span>
          </div>
          <p className="text-xs text-neutral-400">Initialize a free multi-tenant workspace environment.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Company / Workspace Name</label>
            <div className="relative">
              <Building className="w-4 h-4 text-neutral-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Amudhasurabiy Organics"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-200 placeholder-neutral-700 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dineshkumar"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-200 placeholder-neutral-700 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dinesh@amudhasurabiy.com"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-200 placeholder-neutral-700 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-200 placeholder-neutral-700 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={localLoading || loading}
            className="w-full py-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {localLoading || loading ? 'Registering...' : 'Register Workspace'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] bg-neutral-850 flex-1" />
          <span className="text-[10px] text-neutral-600 font-bold uppercase">Or use</span>
          <div className="h-[1px] bg-neutral-850 flex-1" />
        </div>

        {/* Google SSO */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={localLoading || loading}
          className="w-full py-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 transition-all font-semibold text-xs text-neutral-300 flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.74 14.93 1 12 1 7.37 1 3.4 3.66 1.48 7.54l3.77 2.92C6.18 7.15 8.87 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.47h6.44c-.28 1.47-1.11 2.71-2.35 3.54l3.66 2.84c2.14-1.97 3.74-4.88 3.74-8.5z"
            />
            <path
              fill="#FBBC05"
              d="M5.25 14.78a6.97 6.97 0 0 1 0-4.44L1.48 7.42a11.96 11.96 0 0 0 0 10.28l3.77-2.92z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.96-1.08 7.95-2.92l-3.66-2.84c-1.01.68-2.31 1.09-3.79 1.09-3.13 0-5.82-2.11-6.77-5.02L1.48 16.14C3.4 20.02 7.37 23 12 23z"
            />
          </svg>
          Google Single Sign-On
        </button>

        {/* Link to login */}
        <p className="text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline font-bold">
            Sign In Here
          </Link>
        </p>

      </div>
    </main>
  );
}
