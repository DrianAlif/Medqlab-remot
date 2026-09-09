import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function DataModal({ open, onOpenChange, activeTab, editingItem, onSave }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (editingItem) {
      setFormData({ ...editingItem });
    } else {
      // Default empty
      setFormData({
        os: 'Microsoft Windows',
        version: 'V2 LINUX',
      });
    }
  }, [editingItem, open]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(activeTab, formData, editingItem?.id);
  };

  const titles = {
    interfaces: editingItem ? 'Edit Site Interface' : 'Tambah Site Interface Lab',
    servers: editingItem ? 'Edit Server Utama' : 'Tambah Server Utama & SSH',
    clients: editingItem ? 'Edit PC Client' : 'Tambah PC Client / Dokter',
    apps: editingItem ? 'Edit Aplikasi Web' : 'Tambah Aplikasi Web & DB',
    vpn_ip: editingItem ? 'Edit VPN / IP' : 'Tambah Akun VPN RS',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{titles[activeTab] || 'Tambah Data'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {activeTab === 'interfaces' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nama Site *</Label>
                  <Input name="name" required value={formData.name || ''} onChange={handleChange} placeholder="Contoh: RSUD Banjar HEMA" />
                </div>
                <div className="space-y-1">
                  <Label>Rumah Sakit</Label>
                  <Input name="hospital" value={formData.hospital || ''} onChange={handleChange} placeholder="RSUD Banjar" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Rustdesk ID</Label>
                  <Input name="rustdeskId" value={formData.rustdeskId || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>Password Rustdesk</Label>
                  <Input name="rustdeskPass" value={formData.rustdeskPass || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>AnyDesk ID</Label>
                  <Input name="anydeskId" value={formData.anydeskId || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>Password AnyDesk</Label>
                  <Input name="anydeskPass" value={formData.anydeskPass || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>IP Address</Label>
                  <Input name="ip" value={formData.ip || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>OS</Label>
                  <Input name="os" value={formData.os || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>Versi Service</Label>
                  <Input name="version" value={formData.version || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Catatan</Label>
                <Textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} />
              </div>
            </>
          )}

          {activeTab === 'servers' && (
            <>
              <div className="space-y-1">
                <Label>Nama Server *</Label>
                <Input name="name" required value={formData.name || ''} onChange={handleChange} placeholder="SERVER CIS TUV" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Command SSH</Label>
                  <Input name="userSsh" value={formData.userSsh || ''} onChange={handleChange} placeholder="ssh tuv@10.162.79.71" />
                </div>
                <div className="space-y-1">
                  <Label>Password SSH</Label>
                  <Input name="passSsh" value={formData.passSsh || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Rustdesk ID</Label>
                  <Input name="rustdeskId" value={formData.rustdeskId || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>Password Rustdesk</Label>
                  <Input name="rustdeskPass" value={formData.rustdeskPass || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>AnyDesk ID</Label>
                  <Input name="anydeskId" value={formData.anydeskId || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>Password AnyDesk</Label>
                  <Input name="anydeskPass" value={formData.anydeskPass || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Catatan</Label>
                <Textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} />
              </div>
            </>
          )}

          {activeTab === 'clients' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nama PC *</Label>
                  <Input name="name" required value={formData.name || ''} onChange={handleChange} placeholder="PC Dokter 1" />
                </div>
                <div className="space-y-1">
                  <Label>Rumah Sakit</Label>
                  <Input name="hospital" value={formData.hospital || ''} onChange={handleChange} placeholder="RSUD Margono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>AnyDesk ID</Label>
                  <Input name="anydeskId" value={formData.anydeskId || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>Password AnyDesk</Label>
                  <Input name="anydeskPass" value={formData.anydeskPass || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Rustdesk ID</Label>
                  <Input name="rustdeskId" value={formData.rustdeskId || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>Password Rustdesk</Label>
                  <Input name="rustdeskPass" value={formData.rustdeskPass || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>IP Address</Label>
                  <Input name="ip" value={formData.ip || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>Keterangan</Label>
                  <Input name="notes" value={formData.notes || ''} onChange={handleChange} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'apps' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nama Rumah Sakit / Client *</Label>
                  <Input name="clientName" required value={formData.clientName || ''} onChange={handleChange} placeholder="RSUD Hj. Anna Lasmanah" />
                </div>
                <div className="space-y-1">
                  <Label>Versi LIS</Label>
                  <Input name="version" value={formData.version || 'V2'} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>URL Web Aplikasi</Label>
                  <Input name="appUrl" value={formData.appUrl || ''} onChange={handleChange} placeholder="https://rshalv2.medqlab.my.id/login" />
                </div>
                <div className="space-y-1">
                  <Label>URL Database Adminer</Label>
                  <Input name="adminer" value={formData.adminer || ''} onChange={handleChange} placeholder="https://db-rshal.medqlab.my.id" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>SSH Command</Label>
                  <Input name="ssh" value={formData.ssh || ''} onChange={handleChange} placeholder="ssh applimetis@ssh-rshal..." />
                </div>
                <div className="space-y-1">
                  <Label>Grafana / Prometheus</Label>
                  <Input name="grafana" value={formData.grafana || ''} onChange={handleChange} placeholder="192.168.1.15:88" />
                </div>
              </div>
            </>
          )}

          {activeTab === 'vpn_ip' && (
            <>
              <div className="space-y-1">
                <Label>Nama Rumah Sakit *</Label>
                <Input name="hospital" required value={formData.hospital || ''} onChange={handleChange} placeholder="RSUI" />
              </div>
              <div className="space-y-1">
                <Label>Tipe VPN</Label>
                <Input name="vpnType" value={formData.vpnType || ''} onChange={handleChange} placeholder="CiscoAnyconnect / Forticlient" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Username</Label>
                  <Input name="username" value={formData.username || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>Password</Label>
                  <Input name="password" value={formData.password || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Catatan</Label>
                <Textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} />
              </div>
            </>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" className="font-bold">
              {editingItem ? 'Perbarui Data' : 'Simpan Data'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
