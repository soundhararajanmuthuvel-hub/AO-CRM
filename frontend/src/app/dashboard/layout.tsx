'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, workspace, loading, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Sync profile details occasionally
  useEffect(() => {
    if (user) {
      refreshProfile();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm font-medium text-neutral-400">Securing your session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate usage percentages
  const usagePercentage = workspace
    ? Math.min(Math.round((workspace.messageUsageThisMonth / workspace.messageLimit) * 100), 100)
    : 0;

  const isLimitReached = usagePercentage >= 100;
  const isLimitWarning = usagePercentage >= 80;

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      {/* Shared Dashboard Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Panel */}
        <header className="h-16 border-b border-neutral-800/80 bg-neutral-900/20 backdrop-blur-md px-8 flex items-center justify-between z-10 sticky top-0">
          <div>
            <h2 className="text-sm font-semibold text-neutral-200">
              Welcome back, <span className="text-primary-foreground font-bold">{user.name}</span>
            </h2>
            <p className="text-xs text-neutral-500">AO ERP Integrated Messaging Service</p>
          </div>

          {/* Usage Meter */}
          {workspace && (
            <div className="flex items-center gap-4 max-w-xs w-full">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-neutral-400">Monthly Usage</span>
                  <span className={`font-bold ${isLimitReached ? 'text-red-400' : isLimitWarning ? 'text-amber-400' : 'text-neutral-300'}`}>
                    {workspace.messageUsageThisMonth} / {workspace.messageLimit}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLimitReached ? 'bg-red-500 animate-pulse' : isLimitWarning ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              </div>

              {isLimitReached && (
                <span title="Quota Exceeded! Upgrades Needed.">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                </span>
              )}
              {!isLimitReached && isLimitWarning && (
                <span title="Approaching message limit!">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                </span>
              )}
            </div>
          )}
        </header>

        {/* Dynamic Route Pages */}
        <main className="flex-1 p-8 overflow-y-auto bg-neutral-950">
          {children}
        </main>
      </div>
    </div>
  );
}
