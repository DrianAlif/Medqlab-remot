import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Server, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  LogOut, 
  PanelLeftClose, 
  PanelLeftOpen, 
  ExternalLink,
  Monitor,
  Stethoscope,
  Globe,
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Header({
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onOpenConfigModal,
  activeTabTitle,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  isDarkMode,
  setIsDarkMode,
  user,
  onLogout,
  isSidebarCollapsed,
  onToggleSidebar,
  globalResults = { all: [], byCategory: {}, total: 0 },
  onSelectGlobalItem,
  onViewAllGlobalResults,
  onLaunchRemote,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categoryConfigs = {
    interfaces: { label: 'Interface Lab', icon: Monitor, color: 'text-blue-500' },
    servers: { label: 'Server Utama & SSH', icon: Server, color: 'text-amber-500' },
    clients: { label: 'PC Client & Dokter', icon: Stethoscope, color: 'text-emerald-500' },
    apps: { label: 'Aplikasi Web & DB', icon: Globe, color: 'text-purple-500' },
    vpn_ip: { label: 'VPN & Pemetaan IP', icon: ShieldCheck, color: 'text-cyan-500' },
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:h-[60px] lg:px-6">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground hover:text-foreground"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      >
        {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop sidebar toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex text-muted-foreground hover:text-foreground h-9 w-9"
        onClick={onToggleSidebar}
        title={isSidebarCollapsed ? "Tampilkan / Perlebar Sidebar (>>)" : "Sembunyikan / Perkecil Sidebar (<<)"}
      >
        {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : <PanelLeftClose className="h-4 w-4" />}
      </Button>

      {/* Title info */}
      <div className="hidden xl:flex flex-col min-w-0">
        <h1 className="text-sm font-semibold tracking-tight text-foreground truncate">{activeTabTitle}</h1>
        <span className="text-xs text-muted-foreground">Kelola remote access dan kredensial</span>
      </div>

      {/* Search Input with Instant Global Search Dropdown (Option 2) */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-lg mx-auto sm:mx-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Ketik untuk mencari di semua menu (site, RS, IP, ID, user)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) setIsDropdownOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setIsDropdownOpen(false);
                if (onViewAllGlobalResults) onViewAllGlobalResults();
              } else if (e.key === 'Escape') {
                setIsDropdownOpen(false);
              }
            }}
            className="pl-9 pr-8 text-xs h-9 bg-background focus-visible:ring-1 focus-visible:ring-primary shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsDropdownOpen(false);
              }}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Instant Search Dropdown Results (Option 2) */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl overflow-hidden max-h-[440px] flex flex-col animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Header Summary */}
            <div className="px-3.5 py-2 border-b border-border bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Hasil Pencarian: <strong className="text-foreground">{globalResults.total}</strong> data ditemukan
              </span>
              <span className="text-[10px] font-mono opacity-70 hidden sm:inline">
                [Enter] untuk tabel lengkap
              </span>
            </div>

            {/* Results grouped by category */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
              {globalResults.total === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Tidak ada data yang cocok dengan "{searchQuery}"
                </div>
              ) : (
                Object.entries(categoryConfigs).map(([catKey, config]) => {
                  const items = globalResults.byCategory[catKey] || [];
                  if (items.length === 0) return null;
                  const Icon = config.icon;

                  return (
                    <div key={catKey} className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <Icon className={`h-3 w-3 ${config.color}`} />
                        <span>{config.label}</span>
                        <span className="ml-auto rounded-full bg-muted-foreground/15 px-1.5 py-0.2 font-mono text-[9px] text-foreground">
                          {items.length}
                        </span>
                      </div>

                      {/* Display top 3 matching items */}
                      {items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            if (onSelectGlobalItem) onSelectGlobalItem(item);
                          }}
                          className="group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs hover:bg-muted/80 transition-colors cursor-pointer"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {item.name || item.site || item.app || item.router || item.user || 'Item'}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {item.hospital ? `🏥 ${item.hospital}` : ''}
                              {item.ip ? ` • IP: ${item.ip}` : ''}
                              {item.host ? ` • Host: ${item.host}` : ''}
                              {item.doctor ? ` • Dr: ${item.doctor}` : ''}
                              {!item.hospital && !item.ip && !item.host && !item.doctor && item.notes ? item.notes : ''}
                            </span>
                          </div>

                          {/* 1-Click Launch Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {item.rustdeskId && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onLaunchRemote) {
                                    onLaunchRemote('rustdesk', item.rustdeskId, item.rustdeskPass, item);
                                  }
                                }}
                                title={`Buka RustDesk (${item.rustdeskId})`}
                                className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                <span>RustDesk</span>
                              </button>
                            )}
                            {item.anydeskId && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onLaunchRemote) {
                                    onLaunchRemote('anydesk', item.anydeskId, item.anydeskPass, item);
                                  }
                                }}
                                title={`Buka AnyDesk (${item.anydeskId})`}
                                className="inline-flex items-center gap-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 px-1.5 py-0.5 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                <span>AnyDesk</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Action: Option 1 Trigger */}
            {globalResults.total > 0 && (
              <div className="p-2 border-t border-border bg-muted/30">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (onViewAllGlobalResults) onViewAllGlobalResults();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2 px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs active:scale-98 cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Lihat Semua {globalResults.total} Hasil di Tabel Global (Enter)</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme Toggle (Light/Dark) */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenConfigModal}
          className="h-9 gap-1.5"
        >
          <Server className="h-4 w-4" />
          <span className="hidden sm:inline">Config Rustdesk</span>
        </Button>

        <Button
          size="sm"
          onClick={onOpenAddModal}
          className="h-9 gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Data</span>
        </Button>

        {/* User Info & Logout Button */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-border ml-1">
            <div className="hidden xl:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-foreground leading-tight">{user.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{user.role}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              title="Keluar / Logout dari sistem"
              className="h-9 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/40"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}