import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Trash2,
  ExternalLink,
  Globe,
  Database,
  Terminal,
  Monitor,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function DataTable({
  activeTab,
  items,
  totalCount,
  onCopy,
  onOpenNote,
  onEdit,
  onDelete,
  onQuickSwitchServer,
}) {
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [globalCategoryFilter, setGlobalCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, globalCategoryFilter, items.length]);

  const togglePass = (key) => {
    setRevealedPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [switchDialog, setSwitchDialog] = useState({
    open: false,
    item: null,
    newServer: 'Biznet',
    newId: '',
    newPass: '',
  });

  const openSwitchServer = (item, targetServer = 'Biznet') => {
    setSwitchDialog({
      open: true,
      item,
      newServer: targetServer,
      newId: item.rustdeskId || '',
      newPass: item.rustdeskPass || '',
    });
  };

  const handleConfirmSwitch = async (e) => {
    e?.preventDefault?.();
    const { item, newServer, newId, newPass } = switchDialog;
    if (!item) return;

    let notes = item.notes || '';
    if (newServer === 'Biznet') {
      notes = notes.replace(/\[Rustdesk:\s*Server Digital Ocean\]/gi, '[Rustdesk: Server Biznet]');
      if (!notes.includes('[Rustdesk: Server Biznet]')) {
        notes = notes ? `[Rustdesk: Server Biznet]\n${notes}` : '[Rustdesk: Server Biznet]';
      }
    } else if (newServer === 'Digital Ocean') {
      notes = notes.replace(/\[Rustdesk:\s*Server Biznet\]/gi, '[Rustdesk: Server Digital Ocean]');
      if (!notes.includes('[Rustdesk: Server Digital Ocean]')) {
        notes = notes ? `[Rustdesk: Server Digital Ocean]\n${notes}` : '[Rustdesk: Server Digital Ocean]';
      }
    }

    const updated = {
      ...item,
      rustdeskServer: newServer,
      rustdeskId: newId.trim(),
      rustdeskPass: newPass.trim(),
      notes,
    };

    try {
      if (onQuickSwitchServer) {
        await onQuickSwitchServer(activeTab, updated, item.id);
      } else {
        await fetch(`/api/${activeTab}/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      }
      toast.success(`Server RustDesk berhasil dialihkan ke ${newServer}!`);
    } catch (err) {
      toast.error('Gagal mengalihkan server RustDesk');
    } finally {
      setSwitchDialog({ open: false, item: null, newServer: 'Biznet', newId: '', newPass: '' });
    }
  };

  const RUSTDESK_CONFIG = {
    Biznet: {
      server: '103.125.181.20',
      key: 'qEfoyMqK5hq4sgD3XTNXxM5UajNKjDbyoYwElYUFgss=',
    },
    'Digital Ocean': {
      server: '188.166.222.59',
      key: 'jYPX4oy5pNgjpUNjNHALElYULR+OGLR0Sw9Hi1k4M5Q=',
    },
  };

  const getRustdeskServer = (item) => {
    if (!item) return null;
    if (item.rustdeskServer === 'Biznet' || (item.notes && item.notes.includes('Server Biznet'))) {
      return 'Biznet';
    }
    if (item.rustdeskServer === 'Digital Ocean' || (item.notes && item.notes.includes('Server Digital Ocean'))) {
      return 'Digital Ocean';
    }
    return null;
  };

  const handleLaunch = async (type, rawId, password, item) => {
    if (!rawId) return;
    const cleanId = String(rawId).replace(/\s+/g, '');
    const appName = type === 'rustdesk' ? 'RustDesk' : 'AnyDesk';

    let targetConnection = cleanId;
    let serverLabel = '';

    if (type === 'rustdesk' && item) {
      const serverType = getRustdeskServer(item);
      if (serverType && RUSTDESK_CONFIG[serverType]) {
        const cfg = RUSTDESK_CONFIG[serverType];
        // Format otomatis: <ID>@<SERVER>?key=<KEY>
        targetConnection = `${cleanId}@${cfg.server}?key=${cfg.key}`;
        serverLabel = ` [Server ${serverType}]`;
      }
    }

    // 1. Salin password secara otomatis ke clipboard jika ada
    if (password) {
      try {
        await navigator.clipboard.writeText(password);
        toast.success(
          `Membuka ${appName}${serverLabel} (${rawId}) — Password otomatis disalin ke clipboard!`,
          { duration: 4000 }
        );
      } catch (err) {
        toast.info(`Membuka ${appName}${serverLabel} (${rawId})...`);
      }
    } else {
      toast.info(`Membuka ${appName}${serverLabel} (${rawId})...`);
    }

    // 2. Kirim sinyal ke API backend lokal (start.bat / node server.js)
    try {
      fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: targetConnection, rawId: cleanId, password }),
      }).catch(() => {});
    } catch (e) {}

    // 3. Panggil Browser Protocol Scheme (Deep Link)
    const uri = type === 'rustdesk' ? `rustdesk://${targetConnection}` : `anydesk:${cleanId}`;
    const link = document.createElement('a');
    link.href = uri;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
    }, 1000);
  };

  const getOsBadge = (os) => {
    if (!os) return null;
    return <Badge variant="outline" className="font-mono text-[10px] font-normal">{os}</Badge>;
  };

  const getVersionBadge = (ver) => {
    if (!ver) return null;
    return <Badge variant="secondary" className="font-mono text-[10px] font-normal">{ver}</Badge>;
  };

  const copyRustdeskFullString = (e, item, serverType) => {
    e.stopPropagation();
    const id = item.rustdeskId;
    if (!id) return;
    const cfg = RUSTDESK_CONFIG[serverType] || RUSTDESK_CONFIG['Biznet'];
    const fullString = `${id}@${cfg.server}?key=${cfg.key}`;
    onCopy(fullString, `String koneksi Rustdesk ${serverType}`);
  };

  const getRustdeskServerBadge = (item) => {
    const isBiznet = item.rustdeskServer === 'Biznet' || (item.notes && item.notes.includes('Server Biznet'));
    const isDO = item.rustdeskServer === 'Digital Ocean' || (item.notes && item.notes.includes('Server Digital Ocean'));
    if (isBiznet) {
      const cfg = RUSTDESK_CONFIG['Biznet'];
      const previewStr = `${item.rustdeskId}@${cfg.server}?key=${cfg.key}`;
      return (
        <div className="pt-0.5 flex items-center flex-wrap gap-1">
          <button
            type="button"
            onClick={(e) => copyRustdeskFullString(e, item, 'Biznet')}
            title={`Klik untuk salin string koneksi: ${previewStr}`}
            className="group inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs border border-[#528ea8] hover:opacity-90 active:scale-95 transition-all cursor-pointer select-none"
            style={{ backgroundColor: '#66A3BF' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/90 animate-pulse" />
            <span>Server Biznet</span>
            <Copy className="h-2.5 w-2.5 opacity-70 group-hover:opacity-100 transition-opacity ml-0.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openSwitchServer(item, 'Digital Ocean');
            }}
            title="Ganti / Kelola Server RustDesk"
            className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border transition-all cursor-pointer"
          >
            <ArrowRightLeft className="h-2.5 w-2.5" />
            Ganti
          </button>
        </div>
      );
    }
    if (isDO) {
      const cfg = RUSTDESK_CONFIG['Digital Ocean'];
      const previewStr = `${item.rustdeskId}@${cfg.server}?key=${cfg.key}`;
      return (
        <div className="pt-0.5 flex items-center flex-wrap gap-1">
          <button
            type="button"
            onClick={(e) => copyRustdeskFullString(e, item, 'Digital Ocean')}
            title={`Klik untuk salin string koneksi: ${previewStr}`}
            className="group inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold text-[#2d2924] border border-[#d8d3c5] shadow-2xs hover:opacity-90 active:scale-95 transition-all cursor-pointer select-none"
            style={{ backgroundColor: '#F2EFE7' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#8c8577]" />
            <span>Server Digital Ocean</span>
            <Copy className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openSwitchServer(item, 'Biznet');
            }}
            title="Pindahkan site ini ke Server Biznet (Baru)"
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all cursor-pointer shadow-2xs animate-pulse"
          >
            <ArrowRightLeft className="h-2.5 w-2.5" />
            Ke Biznet
          </button>
        </div>
      );
    }
    return (
      <div className="pt-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openSwitchServer(item, 'Biznet');
          }}
          title="Pilih Server Relay RustDesk"
          className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] text-muted-foreground hover:text-foreground border border-dashed border-border hover:bg-muted transition-all cursor-pointer"
        >
          <ArrowRightLeft className="h-2.5 w-2.5" />
          + Set Server
        </button>
      </div>
    );
  };


  const renderNoteIcon = (title, note, item) => {
    if (!note || !note.trim()) return <span className="text-muted-foreground/40">-</span>;
    const isBiznet = note.includes('Server Biznet');
    const isDO = note.includes('Server Digital Ocean');

    let btnStyle = {};
    let btnClass = "text-muted-foreground hover:text-foreground hover:bg-muted border border-border";

    if (isBiznet) {
      btnStyle = { backgroundColor: '#66A3BF20', borderColor: '#66A3BF', color: '#3f7894' };
      btnClass = "border hover:opacity-85";
    } else if (isDO) {
      btnStyle = { backgroundColor: '#F2EFE7', borderColor: '#d8d3c5', color: '#4a443b' };
      btnClass = "border hover:opacity-85";
    }

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onOpenNote(title, note, item)}
        className={`h-7 w-7 rounded-md ${btnClass} transition-colors shadow-2xs`}
        style={btnStyle}
        title="Lihat Catatan"
      >
        <FileText className="h-4 w-4" />
      </Button>
    );
  };

  const displayedGlobalItems = activeTab === 'global'
    ? (globalCategoryFilter === 'all' ? items : items.filter((i) => i._category === globalCategoryFilter))
    : items;

  const currentList = activeTab === 'global' ? displayedGlobalItems : items;
  const totalItemsCount = currentList.length;

  const totalPages = pageSize === 'all'
    ? 1
    : Math.max(1, Math.ceil(totalItemsCount / Number(pageSize)));

  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    if (pageSize === 'all') return currentList;
    const size = Number(pageSize);
    const start = (safePage - 1) * size;
    return currentList.slice(start, start + size);
  }, [currentList, safePage, pageSize]);

  return (
    <>
      <Card className="shadow-sm border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 lg:p-6 lg:pb-3">
        <div>
          <CardTitle className="text-base font-semibold">
            {activeTab === 'global' ? 'Hasil Pencarian Global' : 'Daftar Data'}
          </CardTitle>
          <CardDescription className="text-xs">
            Menampilkan{' '}
            {totalItemsCount === 0
              ? '0'
              : pageSize === 'all'
              ? `1 - ${totalItemsCount}`
              : `${(safePage - 1) * Number(pageSize) + 1} - ${Math.min(safePage * Number(pageSize), totalItemsCount)}`}{' '}
            dari {totalItemsCount} data
            {totalCount > totalItemsCount && ` (difilter dari ${totalCount} total)`}
          </CardDescription>
        </div>
      </CardHeader>

      {/* Category Filter Pills for Global Search View */}
      {activeTab === 'global' && items.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap px-4 py-2.5 border-b border-border bg-muted/20">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Filter Kategori:</span>
          <Button
            type="button"
            variant={globalCategoryFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGlobalCategoryFilter('all')}
            className="h-7 text-xs rounded-full px-3 cursor-pointer"
          >
            Semua ({items.length})
          </Button>
          {[
            { id: 'interfaces', label: 'Interface Lab' },
            { id: 'servers', label: 'Server Utama' },
            { id: 'clients', label: 'PC Client' },
            { id: 'apps', label: 'Web & DB' },
            { id: 'vpn_ip', label: 'VPN / IP' },
          ].map((cat) => {
            const count = items.filter((i) => i._category === cat.id).length;
            if (count === 0) return null;
            return (
              <Button
                key={cat.id}
                type="button"
                variant={globalCategoryFilter === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGlobalCategoryFilter(cat.id)}
                className="h-7 text-xs rounded-full px-3 cursor-pointer"
              >
                {cat.label} ({count})
              </Button>
            );
          })}
        </div>
      )}

      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs">
            Tidak ada data yang sesuai dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* 0. GLOBAL SEARCH RESULTS TABLE (OPSI 1) */}
            {activeTab === 'global' && (
              <Table className="min-w-[850px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-64">Kategori & Nama / Site</TableHead>
                    <TableHead>Rustdesk ID & Pass</TableHead>
                    <TableHead>AnyDesk ID & Pass</TableHead>
                    <TableHead>IP / SSH / URL</TableHead>
                    <TableHead>Info & Detail</TableHead>
                    <TableHead className="text-center w-20">Catatan</TableHead>
                    <TableHead className="text-right w-16">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.id + '_' + (item._category || '')}>
                      {/* 1. Kategori & Nama / Site */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 mb-1">
                          {item._category === 'interfaces' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300 dark:border-blue-800 text-[10px]">
                              Interface Lab
                            </Badge>
                          )}
                          {item._category === 'servers' && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[10px]">
                              Server Utama
                            </Badge>
                          )}
                          {item._category === 'clients' && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[10px]">
                              PC Client
                            </Badge>
                          )}
                          {item._category === 'apps' && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-300 dark:border-purple-800 text-[10px]">
                              Web & DB
                            </Badge>
                          )}
                          {item._category === 'vpn_ip' && (
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800 text-[10px]">
                              {item._type === 'vpn' ? 'VPN' : 'IP RS'}
                            </Badge>
                          )}
                        </div>
                        <div className="font-semibold text-foreground text-xs">
                          {item.name || item.site || item.app || item.router || item.user || 'Item'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.hospital ? `🏥 ${item.hospital}` : item.unit || item.doctor ? `🩺 ${item.unit || item.doctor}` : '-'}
                        </div>
                      </TableCell>

                      {/* 2. Rustdesk ID & Pass */}
                      <TableCell>
                        {item.rustdeskId ? (
                          <div className="flex flex-col gap-1.5 py-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                                {item.rustdeskId}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Salin ID"
                                onClick={() => onCopy(item.rustdeskId, 'Rustdesk ID')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] font-medium gap-1 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 shadow-none cursor-pointer"
                                title="Buka langsung di aplikasi RustDesk (Password otomatis disalin)"
                                onClick={() => handleLaunch('rustdesk', item.rustdeskId, item.rustdeskPass, item)}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Buka
                              </Button>
                            </div>
                            {item.rustdeskPass && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-[11px] text-muted-foreground font-sans">Pass:</span>
                                <span className="font-mono font-medium text-foreground tracking-wider text-xs">
                                  {revealedPasswords['rd_' + item.id] ? item.rustdeskPass : '••••••••'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={() => togglePass('rd_' + item.id)}
                                >
                                  {revealedPasswords['rd_' + item.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Salin Password"
                                  onClick={() => onCopy(item.rustdeskPass, 'Password')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            {getRustdeskServerBadge(item)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">-</span>
                        )}
                      </TableCell>

                      {/* 3. AnyDesk ID & Pass */}
                      <TableCell>
                        {item.anydeskId ? (
                          <div className="flex flex-col gap-1.5 py-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                                {item.anydeskId}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Salin AnyDesk ID"
                                onClick={() => onCopy(item.anydeskId, 'AnyDesk ID')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] font-medium gap-1 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900 border border-red-200 dark:border-red-800 shadow-none cursor-pointer"
                                title="Buka langsung di aplikasi AnyDesk (Password otomatis disalin)"
                                onClick={() => handleLaunch('anydesk', item.anydeskId, item.anydeskPass, item)}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Buka
                              </Button>
                            </div>
                            {item.anydeskPass && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-[11px] text-muted-foreground font-sans">Pass:</span>
                                <span className="font-mono font-medium text-foreground tracking-wider text-xs">
                                  {revealedPasswords['ad_' + item.id] ? item.anydeskPass : '••••••••'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={() => togglePass('ad_' + item.id)}
                                >
                                  {revealedPasswords['ad_' + item.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Salin Password"
                                  onClick={() => onCopy(item.anydeskPass, 'Password')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">-</span>
                        )}
                      </TableCell>

                      {/* 4. IP / SSH / URL */}
                      <TableCell>
                        {item.ip && (
                          <div
                            onClick={() => onCopy(item.ip, 'IP Address')}
                            className="cursor-pointer font-mono text-xs text-foreground hover:underline"
                          >
                            IP: {item.ip}
                          </div>
                        )}
                        {item.sshPort && (
                          <div className="font-mono text-[11px] text-muted-foreground">
                            SSH: {item.sshPort}
                          </div>
                        )}
                        {item.url && (
                          <a
                            href={item.url.startsWith('http') ? item.url : `http://${item.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" /> {item.url}
                          </a>
                        )}
                        {item.host && !item.ip && (
                          <div className="font-mono text-xs text-foreground">{item.host}</div>
                        )}
                        {!item.ip && !item.sshPort && !item.url && !item.host && (
                          <span className="text-muted-foreground/40 text-xs">-</span>
                        )}
                      </TableCell>

                      {/* 5. Info / OS / Detail */}
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {getOsBadge(item.os)}
                          {getVersionBadge(item.version)}
                          {item.dbName && (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              DB: {item.dbName}
                            </Badge>
                          )}
                          {item.doctor && (
                            <span className="text-[11px] text-muted-foreground">
                              Dr: {item.doctor}
                            </span>
                          )}
                          {item.username && (
                            <span className="text-[11px] font-mono text-muted-foreground">
                              User: {item.username}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* 6. Catatan */}
                      <TableCell className="text-center">
                        {renderNoteIcon(item.name || 'Detail', item.notes, item)}
                      </TableCell>

                      {/* 7. Aksi */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(item, item._category)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Data
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(item.id, item.name || 'Data', item._category)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus Data
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* 1. INTERFACES TABLE */}
            {activeTab === 'interfaces' && (
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-64">Nama Site & RS</TableHead>
                    <TableHead>Rustdesk ID & Pass</TableHead>
                    <TableHead>AnyDesk ID & Pass</TableHead>
                    <TableHead>TeamViewer</TableHead>
                    <TableHead>IP & Login PC</TableHead>
                    <TableHead>OS & Service</TableHead>
                    <TableHead className="text-center w-20">Catatan</TableHead>
                    <TableHead className="text-right w-16">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell>
                        <div className="font-medium text-foreground text-xs">{site.name}</div>
                        <div className="text-[11px] text-muted-foreground">{site.hospital || 'Umum'}</div>
                      </TableCell>
                      <TableCell>
                        {site.rustdeskId ? (
                          <div className="flex flex-col gap-1.5 py-0.5">
                            {/* Baris 1: ID Utama (Font lebih besar & tebal) */}
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                                {site.rustdeskId}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Salin ID"
                                onClick={() => onCopy(site.rustdeskId, 'Rustdesk ID')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] font-medium gap-1 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 shadow-none"
                                title="Buka langsung di aplikasi RustDesk (Password otomatis disalin)"
                                onClick={() => handleLaunch('rustdesk', site.rustdeskId, site.rustdeskPass, site)}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Buka
                              </Button>
                            </div>
                            {/* Baris 2: Password (Data utama, font jelas) */}
                            {site.rustdeskPass ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-[11px] text-muted-foreground font-sans">Pass:</span>
                                <span className="font-mono font-medium text-foreground tracking-wider text-xs">
                                  {revealedPasswords['rd_' + site.id] ? site.rustdeskPass : '••••••••'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => togglePass('rd_' + site.id)}
                                >
                                  {revealedPasswords['rd_' + site.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => onCopy(site.rustdeskPass, 'Password Rustdesk')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : null}
                            {/* Baris 3: Note Server Biznet / Digital Ocean (Kecil dibanding ID) */}
                            {getRustdeskServerBadge(site)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {site.anydeskId ? (
                          <div className="flex flex-col gap-1.5 py-0.5">
                            {/* Baris 1: AnyDesk ID Utama */}
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                                {site.anydeskId}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Salin ID"
                                onClick={() => onCopy(site.anydeskId, 'AnyDesk ID')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] font-medium gap-1 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 shadow-none"
                                title="Buka langsung di aplikasi AnyDesk (Password otomatis disalin)"
                                onClick={() => handleLaunch('anydesk', site.anydeskId, site.anydeskPass)}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Buka
                              </Button>
                            </div>
                            {/* Baris 2: AnyDesk Pass */}
                            {site.anydeskPass ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-[11px] text-muted-foreground font-sans">Pass:</span>
                                <span className="font-mono font-medium text-foreground tracking-wider text-xs">
                                  {revealedPasswords['ad_' + site.id] ? site.anydeskPass : '••••••••'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => togglePass('ad_' + site.id)}
                                >
                                  {revealedPasswords['ad_' + site.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => onCopy(site.anydeskPass, 'Password AnyDesk')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {site.tvId ? <span className="font-mono text-xs">{site.tvId}</span> : '-'}
                      </TableCell>
                      <TableCell>
                        {site.ip && (
                          <div
                            onClick={() => onCopy(site.ip, 'IP Address')}
                            className="cursor-pointer font-mono text-xs text-foreground hover:underline"
                          >
                            {site.ip}
                          </div>
                        )}
                        {site.pcUserPass && (
                          <div
                            onClick={() => onCopy(site.pcUserPass, 'Login PC')}
                            className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground"
                          >
                            {site.pcUserPass}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {getOsBadge(site.os)}
                          {getVersionBadge(site.version)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {renderNoteIcon(site.name, site.notes, site)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(site)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Site
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(site.id, site.name)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus Site
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* 2. SERVERS TABLE */}
            {activeTab === 'servers' && (
              <Table className="min-w-[850px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-64">Nama Server</TableHead>
                    <TableHead>Command SSH</TableHead>
                    <TableHead>Password SSH</TableHead>
                    <TableHead>Rustdesk ID & Pass</TableHead>
                    <TableHead>AnyDesk & TV</TableHead>
                    <TableHead className="text-center w-20">Catatan</TableHead>
                    <TableHead className="text-right w-16">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((srv) => (
                    <TableRow key={srv.id}>
                      <TableCell className="font-medium text-foreground text-xs">{srv.name}</TableCell>
                      <TableCell>
                        {srv.userSsh ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                            <span className="select-all">{srv.userSsh}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-foreground"
                              onClick={() => onCopy(srv.userSsh, 'SSH Command')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {srv.passSsh ? (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span className="font-mono text-foreground">
                              {revealedPasswords['ssh_' + srv.id] ? srv.passSsh : '••••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-foreground"
                              onClick={() => togglePass('ssh_' + srv.id)}
                            >
                              {revealedPasswords['ssh_' + srv.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-foreground"
                              onClick={() => onCopy(srv.passSsh, 'Password SSH')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {srv.rustdeskId ? (
                          <div className="flex flex-col gap-1.5 py-0.5">
                            {/* Baris 1: ID Utama */}
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                                {srv.rustdeskId}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Salin ID"
                                onClick={() => onCopy(srv.rustdeskId, 'Rustdesk ID')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] font-medium gap-1 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 shadow-none"
                                title="Buka langsung di aplikasi RustDesk (Password otomatis disalin)"
                                onClick={() => handleLaunch('rustdesk', srv.rustdeskId, srv.rustdeskPass, srv)}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Buka
                              </Button>
                            </div>
                            {/* Baris 2: Password */}
                            {srv.rustdeskPass ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-[11px] text-muted-foreground font-sans">Pass:</span>
                                <span className="font-mono font-medium text-foreground tracking-wider text-xs">
                                  {revealedPasswords['rd_' + srv.id] ? srv.rustdeskPass : '••••••••'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => togglePass('rd_' + srv.id)}
                                >
                                  {revealedPasswords['rd_' + srv.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => onCopy(srv.rustdeskPass, 'Password Rustdesk')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : null}
                            {/* Baris 3: Note Server Biznet / Digital Ocean */}
                            {getRustdeskServerBadge(srv)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {srv.anydeskId && (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-medium font-mono text-foreground">
                              <span>{srv.anydeskId}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                title="Salin ID"
                                onClick={() => onCopy(srv.anydeskId, 'AnyDesk ID')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-5 px-1.5 text-[10px] font-medium gap-1 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 shadow-none"
                                title="Buka langsung di aplikasi AnyDesk (Password otomatis disalin)"
                                onClick={() => handleLaunch('anydesk', srv.anydeskId, srv.anydeskPass)}
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                Buka
                              </Button>
                            </div>
                            {srv.anydeskPass && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <span>Pass:</span>
                                <span className="font-mono text-foreground">
                                  {revealedPasswords['ad_' + srv.id] ? srv.anydeskPass : '••••••••'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => togglePass('ad_' + srv.id)}
                                >
                                  {revealedPasswords['ad_' + srv.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => onCopy(srv.anydeskPass, 'Password AnyDesk')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        {!srv.anydeskId && !srv.tvId && '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderNoteIcon(srv.name, srv.notes, srv)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(srv)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Server
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(srv.id, srv.name)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus Server
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* 3. CLIENTS TABLE */}
            {activeTab === 'clients' && (
              <Table className="min-w-[850px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-80">Nama PC & Rumah Sakit</TableHead>
                    <TableHead>AnyDesk ID & Pass</TableHead>
                    <TableHead>Rustdesk ID & Pass</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-center w-20">Catatan</TableHead>
                    <TableHead className="text-right w-16">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((cli) => (
                    <TableRow key={cli.id}>
                      <TableCell>
                        <div className="font-medium text-foreground text-xs">{cli.name}</div>
                        <div className="text-[11px] text-muted-foreground">{cli.hospital || 'Umum'}</div>
                      </TableCell>
                      <TableCell>
                        {cli.anydeskId ? (
                          <div className="flex flex-col gap-1.5 py-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                                {cli.anydeskId}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Salin ID"
                                onClick={() => onCopy(cli.anydeskId, 'AnyDesk ID')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] font-medium gap-1 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 shadow-none"
                                title="Buka langsung di aplikasi AnyDesk (Password otomatis disalin)"
                                onClick={() => handleLaunch('anydesk', cli.anydeskId, cli.anydeskPass)}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Buka
                              </Button>
                            </div>
                            {cli.anydeskPass ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-[11px] text-muted-foreground font-sans">Pass:</span>
                                <span className="font-mono font-medium text-foreground tracking-wider text-xs">
                                  {revealedPasswords['ad_' + cli.id] ? cli.anydeskPass : '••••••••'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => togglePass('ad_' + cli.id)}
                                >
                                  {revealedPasswords['ad_' + cli.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => onCopy(cli.anydeskPass, 'Password AnyDesk')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {cli.rustdeskId ? (
                          <div className="flex flex-col gap-1.5 py-0.5">
                            {/* Baris 1: ID Utama */}
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                                {cli.rustdeskId}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Salin ID"
                                onClick={() => onCopy(cli.rustdeskId, 'Rustdesk ID')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] font-medium gap-1 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 shadow-none"
                                title="Buka langsung di aplikasi RustDesk (Password otomatis disalin)"
                                onClick={() => handleLaunch('rustdesk', cli.rustdeskId, cli.rustdeskPass, cli)}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Buka
                              </Button>
                            </div>
                            {/* Baris 2: Password */}
                            {cli.rustdeskPass ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-[11px] text-muted-foreground font-sans">Pass:</span>
                                <span className="font-mono font-medium text-foreground tracking-wider text-xs">
                                  {revealedPasswords['rd_' + cli.id] ? cli.rustdeskPass : '••••••••'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => togglePass('rd_' + cli.id)}
                                >
                                  {revealedPasswords['rd_' + cli.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => onCopy(cli.rustdeskPass, 'Password Rustdesk')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : null}
                            {/* Baris 3: Note Server Biznet / Digital Ocean */}
                            {getRustdeskServerBadge(cli)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {cli.ip ? (
                          <span
                            onClick={() => onCopy(cli.ip, 'IP')}
                            className="cursor-pointer font-mono text-xs hover:underline"
                          >
                            {cli.ip}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderNoteIcon(cli.name, cli.notes, cli)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(cli)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit PC
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(cli.id, cli.name)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus PC
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* 4. APPS CARDS GRID */}
            {activeTab === 'apps' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 lg:p-6">
                {paginatedItems.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="secondary">{app.version || 'V2'}</Badge>
                          <h4 className="font-semibold text-sm text-foreground mt-1.5">{app.clientName}</h4>
                          {app.osVersion && (
                            <span className="text-[11px] text-muted-foreground font-mono">{app.osVersion}</span>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(app)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(app.id, app.clientName)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {app.appUrl && (
                          <a
                            href={app.appUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background hover:bg-muted transition"
                          >
                            <span className="flex items-center gap-2 text-foreground font-medium">
                              <Globe className="h-4 w-4 text-muted-foreground" /> Web Aplikasi LIS
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </a>
                        )}

                        {app.adminer && (
                          <a
                            href={app.adminer}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background hover:bg-muted transition"
                          >
                            <span className="flex items-center gap-2 text-foreground font-medium">
                              <Database className="h-4 w-4 text-muted-foreground" /> Adminer Database
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </a>
                        )}

                        {app.ssh && (
                          <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/40 font-mono text-xs">
                            <span className="truncate max-w-[200px] text-muted-foreground flex items-center gap-1.5">
                              <Terminal className="h-3.5 w-3.5 text-foreground" /> {app.ssh}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-foreground"
                              onClick={() => onCopy(app.ssh, 'SSH Host')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. VPN & IP TAB */}
            {activeTab === 'vpn_ip' && (
              <div className="p-4 lg:p-6 space-y-6">
                {/* VPN Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Akun VPN Rumah Sakit
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.filter(x => x.vpnType !== undefined).map((v) => (
                      <div key={v.id} className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground text-xs">{v.hospital}</span>
                          <Badge variant="outline">{v.vpnType || 'VPN'}</Badge>
                        </div>
                        <div className="space-y-1 bg-muted/40 p-2.5 rounded-lg border border-border font-mono text-xs">
                          {v.username && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground font-sans">User:</span>
                              <div className="flex items-center gap-1.5 text-foreground font-medium">
                                <span>{v.username}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={() => onCopy(v.username, 'User VPN')}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          {v.password && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground font-sans">Pass:</span>
                              <div className="flex items-center gap-1.5 text-foreground font-medium">
                                <span>{revealedPasswords['vpn_' + v.id] ? v.password : '••••••••'}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={() => togglePass('vpn_' + v.id)}>
                                  {revealedPasswords['vpn_' + v.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={() => onCopy(v.password, 'Pass VPN')}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* IP Mapping Section */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5" /> Daftar Pemetaan IP Komputer RS
                  </h4>
                  <Table className="min-w-[650px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rumah Sakit</TableHead>
                        <TableHead>Nama Komputer / Unit</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead className="text-center w-20">Catatan</TableHead>
                        <TableHead className="text-right w-16">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.filter(x => x.pcName !== undefined).map((ip) => (
                        <TableRow key={ip.id}>
                          <TableCell className="font-medium text-foreground text-xs">{ip.hospital}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{ip.pcName}</TableCell>
                          <TableCell className="font-mono text-xs font-medium text-foreground">
                            <span className="cursor-pointer hover:underline" onClick={() => onCopy(ip.ip, 'IP')}>
                              {ip.ip}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{renderNoteIcon(ip.hospital, ip.notes, ip)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(ip)}>
                                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDelete(ip.id, ip.hospital)} className="text-destructive">
                                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Pagination Footer */}
      {activeTab !== 'vpn_ip' && totalItemsCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-card/60 text-xs text-muted-foreground select-none">
          {/* Info & Rows per page */}
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <span>
              Menampilkan{' '}
              <strong className="text-foreground font-semibold">
                {pageSize === 'all'
                  ? `1 - ${totalItemsCount}`
                  : `${(safePage - 1) * Number(pageSize) + 1} - ${Math.min(safePage * Number(pageSize), totalItemsCount)}`}
              </strong>{' '}
              dari <strong className="text-foreground font-semibold">{totalItemsCount}</strong> data
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">Semua ({totalItemsCount})</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(1)}
                title="Halaman Pertama"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1 px-2 text-xs font-medium text-foreground">
                <span>Hal</span>
                <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 font-mono">
                  {safePage}
                </span>
                <span>/</span>
                <span className="font-semibold font-mono">{totalPages}</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Halaman Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Halaman Terakhir"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>

    {/* Quick Switch RustDesk Server Dialog */}
    <Dialog open={switchDialog.open} onOpenChange={(open) => setSwitchDialog((prev) => ({ ...prev, open }))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            Ganti / Migrasi Server RustDesk
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pindahkan server koneksi untuk <strong className="text-foreground">{switchDialog.item?.name}</strong>. String koneksi dan relay server akan otomatis disesuaikan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirmSwitch} className="space-y-3.5 py-2 text-xs">
          <div className="space-y-1.5">
            <Label>Pilih Server Tujuan</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSwitchDialog((prev) => ({ ...prev, newServer: 'Biznet' }))}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  switchDialog.newServer === 'Biznet'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                    : 'border-border hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Server Biznet
                </div>
                <span className="text-[10px] opacity-80 mt-0.5">Baru (103.125.181.20)</span>
                <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">★ Rekomendasi</span>
              </button>

              <button
                type="button"
                onClick={() => setSwitchDialog((prev) => ({ ...prev, newServer: 'Digital Ocean' }))}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  switchDialog.newServer === 'Digital Ocean'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                    : 'border-border hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Digital Ocean
                </div>
                <span className="text-[10px] opacity-80 mt-0.5">Lama (188.166.222.59)</span>
                <span className="text-[9px] font-medium text-amber-600 mt-1">Deprecated</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label>RustDesk ID</Label>
            <Input
              value={switchDialog.newId}
              onChange={(e) => setSwitchDialog((prev) => ({ ...prev, newId: e.target.value }))}
              placeholder="Contoh: 123 456 789"
              className="font-mono text-xs"
              required
            />
            <p className="text-[10px] text-muted-foreground">
              Jika saat beralih ke server Biznet ID komputer berubah, masukkan ID baru di sini.
            </p>
          </div>

          <div className="space-y-1">
            <Label>Password RustDesk (Opsional)</Label>
            <Input
              value={switchDialog.newPass}
              onChange={(e) => setSwitchDialog((prev) => ({ ...prev, newPass: e.target.value }))}
              placeholder="Password koneksi"
              className="font-mono text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSwitchDialog((prev) => ({ ...prev, open: false }))}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>
  );
}
