import React from 'react';
import { Server, Copy, Check, Wrench } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function RustdeskConfigDialog({ open, onOpenChange, onCopy }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-foreground" />
            <DialogTitle className="text-base font-semibold">Konfigurasi Relay & ID Server Rustdesk</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          {/* Biznet Server (Active) */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-xs">BIZNET (Server Baru - Direkomendasikan)</span>
              <Badge variant="secondary">AKTIF</Badge>
            </div>
            <div className="space-y-2 pt-1 font-mono text-xs">
              <div className="flex items-center justify-between rounded border border-border bg-muted/40 p-2">
                <span className="text-muted-foreground font-sans">ID / Relay Server:</span>
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <span>103.125.181.20</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => onCopy('103.125.181.20', 'Server Biznet')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded border border-border bg-muted/40 p-2">
                <span className="text-muted-foreground font-sans">Public Key:</span>
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="truncate max-w-[200px]">qEfoyMqK5hq4sgD3XTNXxM5UajNKjDbyoYwElYUFgss=</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => onCopy('qEfoyMqK5hq4sgD3XTNXxM5UajNKjDbyoYwElYUFgss=', 'Public Key Biznet')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Digital Ocean Server (Old) */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground text-xs">Digital Ocean (Server Lama)</span>
              <Badge variant="outline">SEGERA DIHAPUS</Badge>
            </div>
            <div className="space-y-2 pt-1 font-mono text-xs">
              <div className="flex items-center justify-between rounded border border-border bg-muted/40 p-2">
                <span className="text-muted-foreground font-sans">ID / Relay Server:</span>
                <div className="flex items-center gap-2 text-foreground">
                  <span>188.166.222.59</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => onCopy('188.166.222.59', 'Server Digital Ocean')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded border border-border bg-muted/40 p-2">
                <span className="text-muted-foreground font-sans">Public Key (Lama):</span>
                <div className="flex items-center gap-2 text-foreground">
                  <span className="truncate max-w-[200px]">jYPX4oy5pNgjpUNjNHALElYULR+OGLR0Sw9Hi1k4M5Q=</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => onCopy('jYPX4oy5pNgjpUNjNHALElYULR+OGLR0Sw9Hi1k4M5Q=', 'Public Key Digital Ocean')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Client Setup Guide */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-muted-foreground space-y-1 text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5" /> Cara Setting di Komputer Client:
            </span>
            <p>
              Buka aplikasi Rustdesk &rarr; <strong>Settings</strong> &rarr; <strong>Network</strong> &rarr; Masukkan ID Server dan Public Key di atas.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
