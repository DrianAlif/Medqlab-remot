import React, { useState } from 'react';
import { 
  Monitor, 
  Server, 
  Stethoscope, 
  Globe, 
  ShieldCheck, 
  Activity,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  Unlock,
  Search,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  counts, 
  className = '',
  isCollapsed = false,
  setIsCollapsed,
  isLocked = true,
  setIsLocked,
  isMobile = false,
  onCloseMobile
}) {
  const menuItems = [
    ...(counts.global !== undefined || activeTab === 'global'
      ? [
          {
            id: 'global',
            label: 'Semua Hasil Global',
            icon: Search,
            count: counts.global ?? 0,
            isSpecial: true,
          },
        ]
      : []),
    {
      id: 'interfaces',
      label: 'Interface Lab',
      icon: Monitor,
      count: counts.interfaces,
    },
    {
      id: 'servers',
      label: 'Server Utama & SSH',
      icon: Server,
      count: counts.servers,
    },
    {
      id: 'clients',
      label: 'PC Client & Dokter',
      icon: Stethoscope,
      count: counts.clients,
    },
    {
      id: 'apps',
      label: 'Aplikasi Web & DB',
      icon: Globe,
      count: counts.apps,
    },
    {
      id: 'vpn_ip',
      label: 'VPN & Pemetaan IP',
      icon: ShieldCheck,
      count: counts.vpns + counts.ips,
    },
  ];

  return (
    <aside 
      className={`flex flex-col border-r border-border bg-card select-none transition-[width] duration-200 ease-in-out overflow-hidden ${
        isMobile ? 'w-72' : isCollapsed ? 'w-[70px]' : 'w-64'
      } ${className}`}
    >
      {/* Brand Logo & Header Controls (Image 2 style) */}
      <div className="flex h-14 items-center border-b border-border px-3 lg:h-[60px] overflow-hidden justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div 
            onClick={() => isCollapsed && setIsCollapsed && setIsCollapsed(false)}
            title={isCollapsed ? "Klik untuk melebarkan sidebar" : undefined}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm ${
              isCollapsed ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-transform' : ''
            }`}
          >
            MQ
          </div>
          <div className={`flex flex-col min-w-0 transition-all duration-200 overflow-hidden ${
            isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[140px]'
          }`}>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-semibold tracking-tight text-sm text-foreground">MEDQLAB</span>
              <span className="rounded border border-border px-1 py-0.2 text-[9px] font-mono text-muted-foreground">v2.0</span>
            </div>
            <span className="text-[11px] text-muted-foreground leading-none whitespace-nowrap">Remote Portal</span>
          </div>
        </div>

        {/* Action Buttons */}
        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            title="Tutup Menu"
            className="h-8 w-8 rounded-lg border border-border bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsCollapsed && setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Tampilkan / Perlebar Sidebar (>>)" : "Sembunyikan / Perkecil Sidebar (<<)"}
              className="h-7 w-7 rounded-lg border-2 border-blue-500/90 bg-blue-50/90 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:border-blue-400 text-blue-600 dark:text-blue-300 flex items-center justify-center transition-all shadow-xs active:scale-90 cursor-pointer"
            >
              {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>

            {!isCollapsed && (
              <button
                type="button"
                onClick={() => {
                  if (setIsLocked) {
                    const next = !isLocked;
                    setIsLocked(next);
                    toast.info(next ? 'Sidebar dikunci.' : 'Kunci sidebar dibuka.');
                  }
                }}
                title={isLocked ? "Sidebar Terkunci (Klik untuk buka kunci)" : "Sidebar Tidak Terkunci (Klik untuk mengunci)"}
                className={`h-7 w-7 rounded-lg border-2 transition-all shadow-xs flex items-center justify-center active:scale-90 cursor-pointer ${
                  isLocked
                    ? 'border-blue-500/90 bg-blue-50/90 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                    : 'border-muted-foreground/30 bg-muted/40 hover:bg-muted text-muted-foreground'
                }`}
              >
                {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 p-2 overflow-y-auto overflow-x-hidden">
        <div className={`px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-all duration-200 whitespace-nowrap overflow-hidden ${
          isCollapsed ? 'opacity-0 max-w-0 py-0 h-0 pointer-events-none' : 'opacity-100'
        }`}>
          Menu Navigasi
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? `${item.label} (${item.count})` : undefined}
              className={`group relative flex w-full items-center rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150 cursor-pointer select-none ${
                isActive
                  ? 'bg-muted text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex items-center justify-center shrink-0 w-6 h-6">
                  <Icon className={`h-4.5 w-4.5 transition-transform duration-150 group-hover:scale-110 ${isActive ? 'text-primary' : ''}`} />
                  {isCollapsed && item.count > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-primary-foreground px-1 text-[9px] font-mono font-bold shadow-xs">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className={`truncate whitespace-nowrap transition-all duration-200 overflow-hidden ${
                  isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[140px]'
                }`}>
                  {item.label}
                </span>
              </div>
              <span className={`rounded-full bg-muted-foreground/10 px-2 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0 transition-all duration-200 ${
                isCollapsed ? 'opacity-0 max-w-0 px-0 pointer-events-none' : 'opacity-100 ml-auto'
              }`}>
                {item.count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Info */}
      <div className="border-t border-border p-2 overflow-hidden shrink-0">
        {isCollapsed ? (
          <div 
            title="Rustdesk Relay: 103.125.181.20 (BIZNET)"
            className="flex h-9 w-full items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:text-foreground transition-colors cursor-default"
          >
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs space-y-1 transition-all duration-200">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-[11px] whitespace-nowrap">
                <Activity className="h-3 w-3 text-emerald-500 shrink-0" /> Rustdesk Relay
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <div className="font-mono text-[11px] text-foreground font-medium truncate">
              103.125.181.20 (BIZNET)
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
