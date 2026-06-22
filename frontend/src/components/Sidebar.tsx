'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  FileCode,
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
  BarChart3
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, workspace, logout, exitImpersonation, isImpersonating } = useAuth();

  const isSuperAdmin = user?.role === 'superadmin';

  const tenantMenuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'WhatsApp Link', href: '/dashboard/whatsapp', icon: MessageSquare },
    { name: 'Team Inbox', href: '/dashboard/inbox', icon: Inbox },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Sales Orders', href: '/dashboard/orders', icon: ShoppingCart },
    { name: 'Sales Team', href: '/dashboard/sales-team', icon: Award },
    { name: 'Auto Replies', href: '/dashboard/auto-replies', icon: Zap },
    { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
    { name: 'Templates', href: '/dashboard/templates', icon: FileCode },
    { name: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
    { name: 'Automations', href: '/dashboard/automation', icon: GitBranch },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings & Billing', href: '/dashboard/settings', icon: Settings },
  ];

  const adminMenuItems = [
    { name: 'Analytics Stats', href: '/super-admin', icon: LayoutDashboard },
    { name: 'Company Control', href: '/super-admin/companies', icon: Users },
    { name: 'Billing Records', href: '/super-admin/billing', icon: ShoppingCart },
    { name: 'WhatsApp Monitor', href: '/super-admin/whatsapp', icon: MessageSquare },
    { name: 'Support Tickets', href: '/super-admin/support', icon: Inbox },
    { name: 'System Settings', href: '/super-admin/settings', icon: Settings },
    { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: FileCode },
  ];

  const menuItems = isSuperAdmin ? adminMenuItems : tenantMenuItems;

  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-900/50 backdrop-blur-md flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-950/20">
        <div className="flex items-center">
          <img src="/logo-dark.svg" alt="WhatsFlow CRM" className="h-9 w-auto" />
        </div>
      </div>

      {/* Tenant Indicator */}
      <div className="px-6 py-4 border-b border-neutral-800/50 bg-neutral-950/20">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <span className="text-[10px] text-neutral-500 uppercase font-semibold">
              {isSuperAdmin ? 'Platform Management' : 'Workspace'}
            </span>
            <span className="block font-medium text-xs text-neutral-300 truncate">
              {isSuperAdmin ? 'InboxIQ System' : (workspace?.name || 'Loading...')}
            </span>
          </div>
          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-primary/25 border border-primary text-primary-foreground uppercase">
            {isSuperAdmin ? 'ADMIN' : (workspace?.subscriptionPlan || 'FREE')}
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-neutral-800 flex flex-col gap-2">
        {isImpersonating && (
          <button
            onClick={exitImpersonation}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all"
            title="Exit Impersonation Mode"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Exit Impersonation
          </button>
        )}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-sm text-neutral-300 border border-neutral-700">
            {user?.name?.slice(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="truncate">
            <span className="block font-medium text-sm text-neutral-200 truncate">{user?.name || 'User'}</span>
            <span className="block text-xs text-neutral-500 truncate capitalize">{user?.role || 'Staff'}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-xs font-medium text-neutral-400 hover:bg-destructive/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
