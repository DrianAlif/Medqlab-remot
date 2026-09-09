import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { KpiCards } from '@/components/KpiCards';
import { DataTable } from '@/components/DataTable';
import { DataModal } from '@/components/DataModal';
import { NoteDialog } from '@/components/NoteDialog';
import { RustdeskConfigDialog } from '@/components/RustdeskConfigDialog';
import { LoginPage } from '@/components/LoginPage';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medqlab_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('medqlab_user');
    setUser(null);
    toast.info('Anda telah berhasil keluar (logout).');
  };
  const [activeTab, setActiveTab] = useState('interfaces');
  const [data, setData] = useState({
    interfaces: [],
    servers: [],
    clients: [],
    apps: [],
    vpns: [],
    ips: [],
  });
  const [stats, setStats] = useState({
    interfaces: 0,
    servers: 0,
    clients: 0,
    apps: 0,
    vpns: 0,
    ips: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Theme State: default to light or read localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Sidebar Collapse & Lock states (Desktop)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('medqlab_sidebar_collapsed') === 'true';
  });
  const [sidebarLocked, setSidebarLocked] = useState(() => {
    const saved = localStorage.getItem('medqlab_sidebar_locked');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('medqlab_sidebar_collapsed', sidebarCollapsed ? 'true' : 'false');
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('medqlab_sidebar_locked', sidebarLocked ? 'true' : 'false');
  }, [sidebarLocked]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Reset activeTab from global back to interfaces when search is cleared
  useEffect(() => {
    if (activeTab === 'global' && !searchQuery.trim()) {
      setActiveTab('interfaces');
    }
  }, [activeTab, searchQuery]);

  // Dialog states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [noteDialog, setNoteDialog] = useState({ open: false, title: '', note: '', item: null });

  // Fetch stats & active tab data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statRes, ifRes, srvRes, cliRes, appRes, vpnRes, ipRes] = await Promise.all([
        fetch('/api/stats').then((r) => r.json()),
        fetch('/api/interfaces').then((r) => r.json()),
        fetch('/api/servers').then((r) => r.json()),
        fetch('/api/clients').then((r) => r.json()),
        fetch('/api/apps').then((r) => r.json()),
        fetch('/api/vpns').then((r) => r.json()),
        fetch('/api/ips').then((r) => r.json()),
      ]);

      if (statRes.success) {
        setStats({
          interfaces: statRes.data.totalInterfaces || 0,
          servers: statRes.data.totalServers || 0,
          clients: statRes.data.totalClients || 0,
          apps: statRes.data.totalApps || 0,
          vpns: statRes.data.totalVpns || 0,
          ips: statRes.data.totalIps || 0,
        });
      }

      setData({
        interfaces: ifRes.data || [],
        servers: srvRes.data || [],
        clients: cliRes.data || [],
        apps: appRes.data || [],
        vpns: vpnRes.data || [],
        ips: ipRes.data || [],
      });
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Gagal mengambil data dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label || 'Teks'} berhasil disalin!`);
  };

  const handleOpenNote = (title, note) => {
    setNoteDialog({ open: true, title, note });
  };

  const handleEdit = (item, categoryOverride) => {
    setEditingItem({ ...item, _category: categoryOverride || item._category || activeTab });
    setAddModalOpen(true);
  };

  const handleDelete = async (id, name, categoryOverride) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) return;

    const tabToUse = categoryOverride || activeTab;
    let endpoint = `/api/${tabToUse}/${id}`;
    if (tabToUse === 'vpn_ip') {
      endpoint = id.startsWith('vpn-') ? `/api/vpns/${id}` : `/api/ips/${id}`;
    }

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message || 'Data berhasil dihapus');
        fetchData();
      } else {
        toast.error(result.message || 'Gagal menghapus data');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const handleLaunchRemote = async (type, rawId, password, item) => {
    if (!rawId) return;
    const cleanId = String(rawId).replace(/\s+/g, '');
    const appName = type === 'rustdesk' ? 'RustDesk' : 'AnyDesk';

    let targetConnection = cleanId;
    let serverLabel = '';

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

    if (type === 'rustdesk' && item) {
      let serverType = item.rustdeskServer;
      if (!serverType && item.notes) {
        if (item.notes.includes('Server Biznet')) serverType = 'Biznet';
        else if (item.notes.includes('Server Digital Ocean')) serverType = 'Digital Ocean';
      }
      if (serverType && RUSTDESK_CONFIG[serverType]) {
        const cfg = RUSTDESK_CONFIG[serverType];
        targetConnection = `${cleanId}@${cfg.server}?key=${cfg.key}`;
        serverLabel = ` [Server ${serverType}]`;
      }
    }

    if (password) {
      try {
        await navigator.clipboard.writeText(password);
        toast.success(`Membuka ${appName}${serverLabel} (${rawId}) — Password otomatis disalin ke clipboard!`, { duration: 4000 });
      } catch (err) {
        toast.info(`Membuka ${appName}${serverLabel} (${rawId})...`);
      }
    } else {
      toast.info(`Membuka ${appName}${serverLabel} (${rawId})...`);
    }

    try {
      fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: targetConnection, rawId: cleanId, password }),
      }).catch(() => {});
    } catch (e) {}

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

  const handleSaveData = async (tab, formData, itemId) => {
    try {
      let endpoint = `/api/${tab}`;
      let method = itemId ? 'PUT' : 'POST';

      if (itemId) {
        endpoint += `/${itemId}`;
      }

      if (tab === 'vpn_ip') {
        const isVpn = formData.type === 'vpn' || (itemId && itemId.startsWith('vpn-'));
        endpoint = isVpn ? '/api/vpns' : '/api/ips';
        if (itemId) endpoint += `/${itemId}`;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();

      if (result.success) {
        toast.success(result.message || 'Data berhasil disimpan!');
        setAddModalOpen(false);
        setEditingItem(null);
        fetchData();
      } else {
        toast.error(result.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menyimpan data');
    }
  };

  const matchesSearch = (item, q) => {
    if (!q) return true;
    const qLower = q.toLowerCase().trim();
    const fields = [
      item.name,
      item.hospital,
      item.host,
      item.ip,
      item.sshPort,
      item.rustdeskId,
      item.anydeskId,
      item.user,
      item.username,
      item.notes,
      item.url,
      item.dbName,
      item.os,
      item.service,
      item.doctor,
      item.unit,
      item.site,
      item.router,
    ];
    return fields.some((f) => f && String(f).toLowerCase().includes(qLower));
  };

  const globalResults = useMemo(() => {
    if (!searchQuery.trim()) return { all: [], byCategory: {}, total: 0 };
    const q = searchQuery.toLowerCase().trim();

    const filterList = (list, categoryKey, categoryLabel) =>
      (list || [])
        .filter((item) => matchesSearch(item, q))
        .map((item) => ({ ...item, _category: categoryKey, _categoryLabel: categoryLabel }));

    const ifaces = filterList(data.interfaces, 'interfaces', 'Interface Lab');
    const srvs = filterList(data.servers, 'servers', 'Server Utama & SSH');
    const cls = filterList(data.clients, 'clients', 'PC Client & Dokter');
    const apps = filterList(data.apps, 'apps', 'Aplikasi Web & DB');
    const vpns = filterList(data.vpns.map((v) => ({ ...v, _type: 'vpn' })), 'vpn_ip', 'VPN & Pemetaan IP');
    const ips = filterList(data.ips.map((i) => ({ ...i, _type: 'ip' })), 'vpn_ip', 'VPN & Pemetaan IP');

    const allVpnIp = [...vpns, ...ips];
    const all = [...ifaces, ...srvs, ...cls, ...apps, ...allVpnIp];

    return {
      all,
      byCategory: {
        interfaces: ifaces,
        servers: srvs,
        clients: cls,
        apps: apps,
        vpn_ip: allVpnIp,
      },
      total: all.length,
    };
  }, [data, searchQuery]);

  const sidebarCounts = useMemo(() => {
    if (!searchQuery.trim()) return stats;
    return {
      interfaces: globalResults.byCategory.interfaces?.length || 0,
      servers: globalResults.byCategory.servers?.length || 0,
      clients: globalResults.byCategory.clients?.length || 0,
      apps: globalResults.byCategory.apps?.length || 0,
      vpns: (globalResults.byCategory.vpn_ip?.filter((i) => i._type === 'vpn') || []).length,
      ips: (globalResults.byCategory.vpn_ip?.filter((i) => i._type === 'ip') || []).length,
      global: globalResults.total,
    };
  }, [stats, searchQuery, globalResults]);

  // Filter items based on searchQuery and activeTab
  const currentItems = () => {
    if (activeTab === 'global') {
      return globalResults.all;
    }
    let list = [];
    if (activeTab === 'vpn_ip') {
      list = [...data.vpns.map((v) => ({ ...v, _type: 'vpn' })), ...data.ips.map((i) => ({ ...i, _type: 'ip' }))];
    } else {
      list = data[activeTab] || [];
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((item) => matchesSearch(item, q));
  };

  const handleSelectGlobalItem = (item) => {
    setActiveTab(item._category || 'interfaces');
  };

  const handleViewAllGlobalResults = () => {
    setActiveTab('global');
  };

  const titles = {
    global: searchQuery ? `Pencarian Global: "${searchQuery}"` : 'Pencarian Global',
    interfaces: 'PC Interface Laboratorium',
    servers: 'Server Utama & SSH',
    clients: 'PC Client & Dokter',
    apps: 'Aplikasi Web & Database',
    vpn_ip: 'Akun VPN & Pemetaan IP RS',
  };

  if (!user) {
    return (
      <>
        <LoginPage onLoginSuccess={(userData) => setUser(userData)} />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  const itemsToDisplay = currentItems();

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Toaster position="top-right" richColors />

      {/* Sidebar for Desktop */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          setMobileSidebarOpen(false);
        }}
        counts={sidebarCounts}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        isLocked={sidebarLocked}
        setIsLocked={setSidebarLocked}
        className="hidden md:flex shrink-0 sticky top-0 h-screen"
      />

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-background/80 backdrop-blur-sm">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(t) => {
              setActiveTab(t);
              setMobileSidebarOpen(false);
            }}
            counts={sidebarCounts}
            isMobile={true}
            className="w-72 h-full shadow-2xl animate-in slide-in-from-left"
          />
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          user={user}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAddModal={() => {
            setEditingItem(null);
            setAddModalOpen(true);
          }}
          onOpenConfigModal={() => setConfigModalOpen(true)}
          activeTabTitle={titles[activeTab]}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          globalResults={globalResults}
          onSelectGlobalItem={handleSelectGlobalItem}
          onViewAllGlobalResults={handleViewAllGlobalResults}
          onLaunchRemote={handleLaunchRemote}
        />

        <main className="flex-1 space-y-4 p-4 lg:p-6 overflow-y-auto">
          {/* KPI Stat Cards (hide or show when on global search) */}
          <KpiCards
            counts={stats}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          {/* Data Table */}
          <DataTable
            activeTab={activeTab}
            items={itemsToDisplay}
            totalCount={
              activeTab === 'global'
                ? globalResults.total
                : activeTab === 'vpn_ip'
                ? stats.vpns + stats.ips
                : stats[activeTab] || 0
            }
            onCopy={copyToClipboard}
            onOpenNote={handleOpenNote}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onQuickSwitchServer={handleSaveData}
          />
        </main>
      </div>

      {/* Add / Edit Modal */}
      <DataModal
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) setEditingItem(null);
        }}
        activeTab={editingItem?._category || (activeTab === 'global' ? 'interfaces' : activeTab)}
        editingItem={editingItem}
        onSave={handleSaveData}
      />

      {/* Note View Dialog */}
      <NoteDialog
        open={noteDialog.open}
        onOpenChange={(open) => setNoteDialog((prev) => ({ ...prev, open }))}
        title={noteDialog.title}
        note={noteDialog.note}
        onCopy={copyToClipboard}
      />

      {/* Rustdesk Config Dialog */}
      <RustdeskConfigDialog
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        onCopy={copyToClipboard}
      />
    </div>
  );
}
