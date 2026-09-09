import React, { useState, useEffect } from 'react';
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

  const handleEdit = (item) => {
    setEditingItem(item);
    setAddModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) return;

    let endpoint = `/api/${activeTab}/${id}`;
    if (activeTab === 'vpn_ip') {
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

  // Filter items based on searchQuery
  const currentItems = () => {
    let list = [];
    if (activeTab === 'vpn_ip') {
      list = [...data.vpns.map((v) => ({ ...v, _type: 'vpn' })), ...data.ips.map((i) => ({ ...i, _type: 'ip' }))];
    } else {
      list = data[activeTab] || [];
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((item) => {
      const rowString = JSON.stringify(item).toLowerCase();
      return rowString.includes(q);
    });
  };

  const titles = {
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
      <div className={`hidden md:block relative shrink-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(t) => {
            setActiveTab(t);
            setMobileSidebarOpen(false);
          }}
          counts={stats}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
          isLocked={sidebarLocked}
          setIsLocked={setSidebarLocked}
          className={`h-screen sticky top-0 transition-all duration-300 ease-in-out ${
            sidebarCollapsed
              ? (!sidebarLocked ? 'hover:w-64 hover:shadow-2xl hover:z-50 w-16' : 'w-16')
              : 'w-64'
          }`}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-background/80 backdrop-blur-sm">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(t) => {
              setActiveTab(t);
              setMobileSidebarOpen(false);
            }}
            counts={stats}
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
        />

        <main className="flex-1 space-y-4 p-4 lg:p-6 overflow-y-auto">
          {/* KPI Stat Cards */}
          <KpiCards
            counts={stats}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          {/* Data Table */}
          <DataTable
            activeTab={activeTab}
            items={itemsToDisplay}
            totalCount={activeTab === 'vpn_ip' ? stats.vpns + stats.ips : stats[activeTab] || 0}
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
        activeTab={activeTab}
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
