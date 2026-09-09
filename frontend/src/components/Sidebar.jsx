import React from 'react';
import { 
  Monitor, 
  Server, 
  Stethoscope, 
  Globe, 
  ShieldCheck, 
  Activity,
  Layers
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Sidebar({ activeTab, setActiveTab, counts, className = '' }) {
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
    <aside className={`flex flex-col border-r border-border bg-card ${className}`}>
      {/* Brand Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-border px-4 lg:h-[60px] lg:px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm">
          MQ
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold tracking-tight text-sm text-foreground">MEDQLAB</span>
            <span className="rounded border border-border px-1 py-0.2 text-[9px] font-mono text-muted-foreground">v2.0</span>
          </div>
          <span className="text-[11px] text-muted-foreground leading-none">Remote Portal</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-2 lg:p-4">
        <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
          Menu Navigasi
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              <span className="rounded-full bg-muted-foreground/10 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                {item.count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Info */}
      <div className="border-t border-border p-3 lg:p-4">
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-[11px]">
              <Activity className="h-3 w-3 text-foreground" /> Rustdesk Relay
            </span>
            <span className="h-2 w-2 rounded-full bg-foreground/70" />
          </div>
          <div className="font-mono text-[11px] text-foreground font-medium truncate">
            103.125.181.20 (BIZNET)
          </div>
        </div>
      </div>
    </aside>
  );
}
