import React, { useState } from 'react';
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
}) {
  const [revealedPasswords, setRevealedPasswords] = useState({});

  const togglePass = (key) => {
    setRevealedPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLaunch = async (type, rawId, password) => {
    if (!rawId) return;
    const cleanId = String(rawId).replace(/\s+/g, '');
    const appName = type === 'rustdesk' ? 'RustDesk' : 'AnyDesk';

    // 1. Salin password secara otomatis ke clipboard jika ada
    if (password) {
      try {
        await navigator.clipboard.writeText(password);
        toast.success(
          `Membuka ${appName} (${rawId}) — Password otomatis disalin ke clipboard!`,
          { duration: 4000 }
        );
      } catch (err) {
        toast.info(`Membuka ${appName} (${rawId})...`);
      }
    } else {
      toast.info(`Membuka ${appName} (${rawId})...`);
    }

    // 2. Kirim sinyal ke API backend lokal (start.bat / node server.js)
    try {
      fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: cleanId, password }),
      }).catch(() => {});
    } catch (e) {}

    // 3. Panggil Browser Protocol Scheme (Deep Link)
    const uri = type === 'rustdesk' ? `rustdesk://${cleanId}` : `anydesk:${cleanId}`;
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
        <div className="pt-0.5">
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
        </div>
      );
    }
    if (isDO) {
      const cfg = RUSTDESK_CONFIG['Digital Ocean'];
      const previewStr = `${item.rustdeskId}@${cfg.server}?key=${cfg.key}`;
      return (
        <div className="pt-0.5">
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
        </div>
      );
    }
    return null;
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

  return (
    <Card className="shadow-sm border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 lg:p-6 lg:pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Daftar Data</CardTitle>
          <CardDescription className="text-xs">
            Menampilkan {items.length} dari {totalCount} data
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs">
            Tidak ada data yang sesuai dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* 1. INTERFACES TABLE */}
            {activeTab === 'interfaces' && (
              <Table>
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
                  {items.map((site) => (
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
                                onClick={() => handleLaunch('rustdesk', site.rustdeskId, site.rustdeskPass)}
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
              <Table>
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
                  {items.map((srv) => (
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
                                onClick={() => handleLaunch('rustdesk', srv.rustdeskId, srv.rustdeskPass)}
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
              <Table>
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
                  {items.map((cli) => (
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
                                onClick={() => handleLaunch('rustdesk', cli.rustdeskId, cli.rustdeskPass, cli.rustdeskServer)}
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
                {items.map((app) => (
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
                  <Table>
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
    </Card>
  );
}
