'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'superadmin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-neutral-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-neutral-400">Verifying authorization credentials...</span>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'superadmin') {
    return null; // Prevents flashing unauthorized content before redirect
  }

  return (
    <div className="flex bg-neutral-950 text-neutral-100 min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
