'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Megaphone,
  GitBranch,
  Settings,
  LogOut,
  Sparkles,
  ShoppingCart,
  Zap,
  Inbox,
  Package,
  Award,
  BarChart3,
  Bot,
  Terminal,
  Cpu,
  Clock,
  Workflow
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, workspace, logout, exitImpersonation, isImpersonating } = useAuth();

  const isSuperAdmin = user?.role === 'superadmin';

  // Grouped Menu Items for Cusman CRM
  const sections = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'WhatsApp Hub',
      items: [
        { name: 'Sessions', href: '/dashboard/whatsapp', icon: MessageSquare },
        { name: 'Team Inbox', href: '/dashboard/inbox', icon: Inbox },
        { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
        { name: 'Catalog / Products', href: '/dashboard/products', icon: Package },
        { name: 'Sales Orders', href: '/dashboard/orders', icon: ShoppingCart }
      ]
    },
    {
      title: 'Automation & AI Studio',
      items: [
        { name: 'Flow Builder', href: '/dashboard/automations', icon: GitBranch },
        { name: 'AI Studio Agents', href: '/dashboard/ai-agents', icon: Bot },
        { name: 'Broadcasts', href: '/dashboard/campaigns', icon: Megaphone },
        { name: 'Scheduler Triggers', href: '/dashboard/automation', icon: Workflow }
      ]
    },
    {
      title: 'Developer Gateway',
      items: [
        { name: 'API Explorer', href: '/dashboard/api-explorer', icon: Terminal },
        { name: 'MCP Integration', href: '/dashboard/mcp', icon: Cpu },
        { name: 'Settings & Billing', href: '/dashboard/settings', icon: Settings }
      ]
    }
  ];

  const adminMenuItems = [
    { name: 'Analytics Stats', href: '/super-admin', icon: LayoutDashboard },
    { name: 'Company Control', href: '/super-admin/companies', icon: Users },
    { name: 'Billing Records', href: '/super-admin/billing', icon: ShoppingCart },
    { name: 'WhatsApp Monitor', href: '/super-admin/whatsapp', icon: MessageSquare },
    { name: 'Support Tickets', href: '/super-admin/support', icon: Inbox },
    { name: 'System Settings', href: '/super-admin/settings', icon: Settings },
    { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: Terminal },
  ];

  return (
    <aside className="w-64 border-r border-neutral-900 bg-[#0A0D14] flex flex-col h-screen sticky top-0">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-neutral-900 flex flex-col gap-1.5 bg-[#070A0F]/30">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-neutral-950 font-black text-xs">C</span>
          <span className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">CUSMAN CRM</span>
        </div>
        <span className="text-[8px] text-neutral-500 font-bold tracking-wider uppercase">Turn conversations into customers.</span>
      </div>

      {/* Tenant Indicator */}
      <div className="px-6 py-4 border-b border-neutral-900/60 bg-[#070A0F]/20">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">
              {isSuperAdmin ? 'Platform Admin' : 'Workspace'}
            </span>
            <span className="block font-medium text-xs text-neutral-300 truncate">
              {isSuperAdmin ? 'WhatsFlow Admin' : (workspace?.name || 'Loading...')}
            </span>
          </div>
          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 uppercase tracking-wide">
            {isSuperAdmin ? 'ADMIN' : (workspace?.subscriptionPlan || 'FREE')}
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {isSuperAdmin ? (
          <div className="space-y-1">
            {adminMenuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/10 font-bold'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-250'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ) : (
          sections.map((sec, idx) => (
            <div key={idx} className="space-y-1.5 text-left">
              <span className="block text-[9px] font-bold text-neutral-600 uppercase tracking-widest pl-3.5 mb-1.5">{sec.title}</span>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/10 font-bold'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-250'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-neutral-900 bg-[#070A0F]/20 flex flex-col gap-2">
        {isImpersonating && (
          <button
            onClick={exitImpersonation}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all uppercase tracking-wide"
            title="Exit Impersonation Mode"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Exit Impersonation
          </button>
        )}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8.5 h-8.5 rounded-full bg-neutral-900 flex items-center justify-center font-bold text-xs text-neutral-300 border border-neutral-850">
            {user?.name?.slice(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="truncate text-left">
            <span className="block font-semibold text-xs text-neutral-200 truncate">{user?.name || 'User'}</span>
            <span className="block text-[10px] text-neutral-500 truncate capitalize">{user?.role || 'Staff'}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3.5 py-2 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
