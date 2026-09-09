import React from 'react';
import { Monitor, Server, Stethoscope, Globe, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function KpiCards({ counts, activeTab, setActiveTab }) {
  const cards = [
    {
      id: 'interfaces',
      title: 'Interface Lab',
      value: counts.interfaces,
      desc: 'PC SMI & Instrument',
      icon: Monitor,
    },
    {
      id: 'servers',
      title: 'Server Utama',
      value: counts.servers,
      desc: 'CIS, TUV, Biofit & SSH',
      icon: Server,
    },
    {
      id: 'clients',
      title: 'PC Client & Dokter',
      value: counts.clients,
      desc: 'Dokter, Analis, Monitoring',
      icon: Stethoscope,
    },
    {
      id: 'apps',
      title: 'Aplikasi Web & DB',
      value: counts.apps,
      desc: 'Web LIS & Adminer',
      icon: Globe,
    },
    {
      id: 'vpn_ip',
      title: 'VPN & IP RS',
      value: counts.vpns + counts.ips,
      desc: 'Akun VPN & Pemetaan IP',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeTab === card.id;
        return (
          <Card
            key={card.id}
            onClick={() => setActiveTab(card.id)}
            className={`cursor-pointer transition-all hover:border-foreground/20 ${
              isActive ? 'border-primary ring-1 ring-primary/20 bg-muted/30' : 'bg-card'
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">{card.value}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{card.desc}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
