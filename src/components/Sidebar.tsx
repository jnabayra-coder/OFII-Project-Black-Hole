import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users,
  Building2, 
  FileSpreadsheet, 
  BarChart3, 
  Trash2,
  Settings, 
  LogOut, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { NavigationTab } from '../types';
import { currentUser } from '../data/mockData';

interface SidebarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onLogout: () => void;
  unreadDispatchesCount?: number;
  deletedCount?: number;
  pendingNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  onLogout,
  unreadDispatchesCount = 8,
  deletedCount = 0,
  pendingNotificationsCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Daily overview & KPIs',
    },
    {
      id: 'dispatch' as NavigationTab,
      label: 'Daily Dispatching Monitoring',
      icon: Truck,
      badge: pendingNotificationsCount > 0 ? `🔔 ${pendingNotificationsCount} New` : (unreadDispatchesCount > 0 ? `${unreadDispatchesCount}` : null),
      badgeColor: pendingNotificationsCount > 0 ? 'bg-amber-400 text-slate-950 font-bold border border-amber-300' : undefined,
      description: 'Fleet, loading & departures',
    },
    {
      id: 'client_management' as NavigationTab,
      label: 'Client Management',
      icon: Users,
      badge: null,
      description: 'Directory & corporate profiles',
    },
    {
      id: 'clients' as NavigationTab,
      label: 'Client Shipment Monitoring',
      icon: Building2,
      badge: null,
      description: 'By client & reference numbers',
    },
    {
      id: 'forwarding_report' as NavigationTab,
      label: 'Forwarding Progressive Report',
      icon: FileSpreadsheet,
      badge: 'Active',
      description: 'Tracking, TAT & POD status',
    },
    {
      id: 'reports' as NavigationTab,
      label: 'Reports',
      icon: BarChart3,
      badge: null,
      description: 'SLA & performance analytics',
    },
    {
      id: 'trash' as NavigationTab,
      label: 'Recently Deleted',
      icon: Trash2,
      badge: deletedCount > 0 ? `${deletedCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      description: 'Trash & operational recovery',
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
      description: 'Profile & preferences',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none min-h-screen">
      {/* Brand & Corporate Header */}
      <div className="p-4 border-b border-slate-800/90 bg-slate-950/60">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-base tracking-wider border border-blue-500/40 shadow-sm shrink-0">
            OFII
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-white text-xs font-bold tracking-tight uppercase truncate">
              Orient Freight Int&apos;l
            </h1>
            <p className="text-[11px] text-blue-400 font-medium truncate">
              Monitoring System
            </p>
          </div>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700/80 text-[10px] text-slate-300 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Prototype v0.3</span>
        </div>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all group text-left cursor-pointer ${
                isActive
                  ? 'bg-blue-700 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`ml-2 px-1.5 py-0.5 text-[10px] rounded font-semibold shrink-0 ${
                    isActive
                      ? 'bg-blue-800 text-blue-100'
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Operational Status Box */}
      <div className="p-3 mx-3 mb-3 bg-slate-800/50 rounded border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between text-slate-300 mb-1.5">
          <span className="text-[11px] font-semibold text-slate-200">Terminal Dispatch</span>
          <span className="text-[10px] text-emerald-400 font-mono">NORMAL</span>
        </div>
        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '95%' }}></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>95.3% On-Time</span>
          <span>148 Shipments</span>
        </div>
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-900 border border-blue-600/50 flex items-center justify-center text-blue-200 text-xs font-bold shrink-0">
              JD
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-slate-400 truncate leading-tight">
                {currentUser.role}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign Out to Login Screen"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
