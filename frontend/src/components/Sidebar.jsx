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
  Unlock
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
  isMobile = false
}) {
  const [isHovered, setIsHovered] = useState(false);

  // If on mobile or not collapsed, or if collapsed but unpinned and hovered:
  const effectivelyExpanded = isMobile ? true : (!isCollapsed || (!isLocked && isHovered));

  const menuItems = [
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
      onMouseEnter={() => {
        if (!isMobile && isCollapsed && !isLocked) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (!isMobile && isCollapsed && !isLocked) {
          setIsHovered(false);
        }
      }}
      className={`flex flex-col border-r border-border bg-card transition-all duration-300 select-none ${className}`}
    >
      {/* Brand Logo & Toggle Header */}
      <div className={`flex h-14 items-center border-b border-border px-3 lg:h-[60px] ${effectivelyExpanded ? 'justify-between px-4 lg:px-5' : 'justify-center'}`}>
        {effectivelyExpanded ? (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm">
                MQ
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold tracking-tight text-sm text-foreground truncate">MEDQLAB</span>
                  <span className="rounded border border-border px-1 py-0.2 text-[9px] font-mono text-muted-foreground shrink-0">v2.0</span>
                </div>
                <span className="text-[11px] text-muted-foreground leading-none truncate">Remote Portal</span>
              </div>
            </div>

            {/* Collapse & Lock buttons (matches image 2) */}
            {!isMobile && (
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => setIsCollapsed && setIsCollapsed(true)}
                  title="Sembunyikan / Perkecil Sidebar (<<)"
                  className="h-7 w-7 rounded-lg border-2 border-blue-500/90 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:border-blue-400 text-blue-600 dark:text-blue-300 flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (setIsLocked) {
                      const next = !isLocked;
                      setIsLocked(next);
                      toast.info(next ? 'Sidebar dikunci (tetap pada posisinya).' : 'Kunci dibuka (auto-expand saat kursor diarahkan).');
                    }
                  }}
                  title={isLocked ? "Sidebar Terkunci (Klik untuk membuka kunci hover)" : "Sidebar Tidak Terkunci (Klik untuk mengunci)"}
                  className={`h-7 w-7 rounded-lg border-2 transition-all shadow-xs flex items-center justify-center active:scale-95 cursor-pointer ${
                    isLocked
                      ? 'border-blue-500/90 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                      : 'border-muted-foreground/30 bg-muted/40 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Collapsed Mini Header: shows Expand button */
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCollapsed && setIsCollapsed(false)}
              title="Tampilkan / Perlebar Sidebar (>>)"
              className="h-8 w-8 rounded-lg border-2 border-blue-500/90 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:border-blue-400 text-blue-600 dark:text-blue-300 flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 space-y-1.5 p-2 ${effectivelyExpanded ? 'lg:p-4' : 'px-1.5 py-3'}`}>
        {effectivelyExpanded && (
          <div className="px-3 py-1 text-[11px] font-medium text-muted-foreground">
            Menu Navigasi
          </div>
        )}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (effectivelyExpanded) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                <span className="rounded-full bg-muted-foreground/10 px-2 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">
                  {item.count}
                </span>
              </button>
            );
          }

          // Compact Collapsed item
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              title={`${item.label} (${item.count})`}
              className={`relative flex w-full items-center justify-center rounded-lg p-2.5 text-xs font-medium transition-colors group cursor-pointer ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.count > 0 && (
                <span className="absolute -top-1 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-muted-foreground/20 px-1 text-[9px] font-mono font-medium text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Info */}
      <div className={`border-t border-border ${effectivelyExpanded ? 'p-3 lg:p-4' : 'p-2 flex justify-center'}`}>
        {effectivelyExpanded ? (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-[11px]">
                <Activity className="h-3 w-3 text-emerald-500" /> Rustdesk Relay
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="font-mono text-[11px] text-foreground font-medium truncate">
              103.125.181.20 (BIZNET)
            </div>
          </div>
        ) : (
          <div 
            title="Rustdesk Relay: 103.125.181.20 (BIZNET)"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:text-foreground transition-colors cursor-default"
          >
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  );
}
