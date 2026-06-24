'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { user, login, googleLogin, loading } = useAuth();
  const router = useRouter();
  
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
    if (!email || !password) return;

    setLocalLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Verify credentials.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalLoading(true);
    setError('');
    try {
      // Simulate Google Login callback payload
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
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 py-12 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md p-8 rounded-3xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-md relative z-10 shadow-2xl space-y-6">
        
        {/* Brand logo header */}
        <div className="text-center space-y-2">
          <img src="/logo-dark.svg" alt="Cusman CRM" className="h-10 w-auto mx-auto" />
          <p className="text-xs text-neutral-500">Sign in to manage your WhatsApp sales relationships.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/25 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
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

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-neutral-400">Password</label>
              <Link href="/forgot-password" className="text-[10px] text-primary hover:underline font-bold">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 placeholder-neutral-650"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={localLoading || loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
          >
            {localLoading || loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] bg-neutral-850 flex-1" />
          <span className="text-[10px] text-neutral-600 font-bold uppercase">Or use</span>
          <div className="h-[1px] bg-neutral-850 flex-1" />
        </div>

        {/* Google SSO Login */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={localLoading || loading}
          className="w-full py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 transition-all font-semibold text-xs text-neutral-300 flex items-center justify-center gap-2"
        >
          {/* Flat Google logo */}
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

        {/* Link to signup */}
        <p className="text-center text-xs text-neutral-500">
          New to Cusman CRM?{' '}
          <Link href="/signup" className="text-primary hover:underline font-bold">
            Create Free Workspace
          </Link>
        </p>

      </div>
    </main>
  );
}
