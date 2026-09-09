import React from 'react';
import { FileText, Copy, Server } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function NoteDialog({ open, onOpenChange, title, note, item, onCopy }) {
  const isBiznet = note && note.includes('Server Biznet');
  const isDO = note && note.includes('Server Digital Ocean');

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

  const getFullString = (serverType) => {
    if (!item?.rustdeskId) return '';
    const cfg = RUSTDESK_CONFIG[serverType];
    return `${item.rustdeskId}@${cfg.server}?key=${cfg.key}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-foreground" />
            <DialogTitle className="truncate text-sm font-semibold">Catatan: {title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* Visual Server Banner with Copy Action */}
          {isBiznet && (
            <div
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-white font-medium text-xs shadow-xs border border-[#528ea8]"
              style={{ backgroundColor: '#66A3BF' }}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white/90 animate-pulse"></span>
                <Server className="h-3.5 w-3.5" />
                <span>Konfigurasi: <strong>Server BIZNET (Baru)</strong></span>
              </div>
              {item?.rustdeskId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] font-bold text-white hover:bg-white/20"
                  onClick={() => onCopy(getFullString('Biznet'), 'String Rustdesk Biznet')}
                  title={`Salin: ${getFullString('Biznet')}`}
                >
                  <Copy className="h-3 w-3 mr-1" /> Salin String
                </Button>
              )}
            </div>
          )}

          {isDO && (
            <div
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[#2d2924] border border-[#d8d3c5] font-medium text-xs shadow-xs"
              style={{ backgroundColor: '#F2EFE7' }}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#8c8577]"></span>
                <Server className="h-3.5 w-3.5" />
                <span>Konfigurasi: <strong>Server DIGITAL OCEAN (Lama)</strong></span>
              </div>
              {item?.rustdeskId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] font-bold text-[#2d2924] hover:bg-black/10"
                  onClick={() => onCopy(getFullString('Digital Ocean'), 'String Rustdesk Digital Ocean')}
                  title={`Salin: ${getFullString('Digital Ocean')}`}
                >
                  <Copy className="h-3 w-3 mr-1" /> Salin String
                </Button>
              )}
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/50 p-3.5 font-mono text-xs leading-relaxed text-foreground select-all whitespace-pre-wrap max-h-60 overflow-y-auto">
            {note}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy(note, 'Catatan ' + title)}
            className="gap-1.5"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Salin Catatan
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
