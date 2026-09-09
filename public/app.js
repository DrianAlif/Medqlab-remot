// MEDQLAB Multi-Tab Portal App Logic

let activeTab = 'interfaces';
let datasets = {
  interfaces: [],
  servers: [],
  clients: [],
  apps: [],
  vpns: [],
  ips: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadAllData();
  setupGlobalSearch();
  setupConfigModal();
});

// Toast system
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-950 border-emerald-500/40 text-emerald-300',
    info: 'bg-slate-900 border-slate-700 text-slate-200',
    warning: 'bg-amber-950 border-amber-500/40 text-amber-300',
    error: 'bg-rose-950 border-rose-500/40 text-rose-300'
  };
  const icons = {
    success: 'fa-solid fa-circle-check text-emerald-400',
    info: 'fa-solid fa-circle-info text-cyan-400',
    warning: 'fa-solid fa-triangle-exclamation text-amber-400',
    error: 'fa-solid fa-circle-xmark text-rose-400'
  };

  toast.className = 'pointer-events-auto flex items-center space-x-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-medium transform transition-all duration-200 translate-y-2 opacity-0 ' + (colors[type] || colors.info);
  toast.innerHTML = '<i class="' + (icons[type] || icons.info) + '"></i><span>' + message + '</span>';
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 200);
  }, 2800);
}

// Clipboard helper
function copyToClipboard(text, label = 'Teks') {
  if (!text) {
    showToast(label + ' kosong!', 'warning');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    showToast(label + ' disalin!', 'success');
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast(label + ' disalin!', 'success');
  });
}

// Password eye toggle
function togglePassword(btn) {
  const span = btn.parentElement.querySelector('.pass-text');
  if (!span) return;
  const realPass = span.getAttribute('data-pass');
  const icon = btn.querySelector('i');

  if (span.textContent === '••••••••') {
    span.textContent = realPass;
    span.classList.add('text-emerald-400');
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    span.textContent = '••••••••';
    span.classList.remove('text-emerald-400');
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

// Helper: Note Icon generator
function getNoteIconHtml(title, note) {
  if (!note || !note.trim()) {
    return '<span class="text-slate-600">-</span>';
  }
  const safeTitle = (title || 'Catatan').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const safeNote = note.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const escapedNoteAttr = note.replace(/"/g, '&quot;');
  return '<button onclick="openNoteModal(\'' + safeTitle + '\', \'' + safeNote + '\')" class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition shadow-sm" title="' + escapedNoteAttr + '"><i class="fa-solid fa-note-sticky text-xs"></i></button>';
}

// Open Note Modal
function openNoteModal(title, content) {
  const modal = document.getElementById('noteModal');
  if (!modal) return;
  document.getElementById('noteModalTitle').textContent = 'Catatan: ' + title;
  document.getElementById('noteModalContent').textContent = content;
  document.getElementById('btnCopyNote').onclick = () => {
    copyToClipboard(content, 'Catatan ' + title);
  };
  modal.classList.remove('hidden');
}

// Load All Datasets
async function loadAllData() {
  try {
    const [resInt, resSrv, resCli, resApp, resVpn, resIp] = await Promise.all([
      fetch('/api/interfaces').then(r => r.json()),
      fetch('/api/servers').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/apps').then(r => r.json()),
      fetch('/api/vpns').then(r => r.json()),
      fetch('/api/ips').then(r => r.json())
    ]);

    datasets.interfaces = resInt.data || [];
    datasets.servers = resSrv.data || [];
    datasets.clients = resCli.data || [];
    datasets.apps = resApp.data || [];
    datasets.vpns = resVpn.data || [];
    datasets.ips = resIp.data || [];

    // Update tab badges
    document.getElementById('badgeInterfaces').textContent = datasets.interfaces.length;
    document.getElementById('badgeServers').textContent = datasets.servers.length;
    document.getElementById('badgeClients').textContent = datasets.clients.length;
    document.getElementById('badgeApps').textContent = datasets.apps.length;
    document.getElementById('badgeVpnIp').textContent = (datasets.vpns.length + datasets.ips.length);

    renderCurrentTab();
  } catch (err) {
    console.error('Error loading datasets:', err);
    showToast('Gagal memuat data portal', 'error');
  }
}

// Tab Switcher
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(b => {
        b.classList.remove('active', 'bg-slate-800', 'text-white', 'border-slate-700');
        b.classList.add('text-slate-400');
      });
      tabBtn.classList.add('active', 'bg-slate-800', 'text-white', 'border-slate-700');
      tabBtn.classList.remove('text-slate-400');

      activeTab = tabBtn.getAttribute('data-tab');

      // Hide all panes
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
      const activePane = document.getElementById('tabContent_' + activeTab);
      if (activePane) activePane.classList.remove('hidden');

      // Update Add Button label
      const labels = {
        interfaces: 'Tambah Site',
        servers: 'Tambah Server',
        clients: 'Tambah Client',
        apps: 'Tambah Web App',
        vpn_ip: 'Tambah Data'
      };
      document.getElementById('btnDynamicAddText').textContent = labels[activeTab] || 'Tambah Data';

      renderCurrentTab();
    });
  });

  // Dynamic Add Button trigger
  document.getElementById('btnDynamicAdd').addEventListener('click', () => {
    openAddModalForTab(activeTab);
  });
}

// Global search setup
function setupGlobalSearch() {
  const searchInput = document.getElementById('globalSearchInput');
  const btnClear = document.getElementById('btnClearSearch');

  searchInput.addEventListener('input', () => {
    btnClear.classList.toggle('hidden', !searchInput.value);
    renderCurrentTab();
  });

  btnClear.addEventListener('click', () => {
    searchInput.value = '';
    btnClear.classList.add('hidden');
    renderCurrentTab();
  });
}

function getSearchQuery() {
  return document.getElementById('globalSearchInput').value.toLowerCase().trim();
}

// Render Current Tab
function renderCurrentTab() {
  const q = getSearchQuery();

  if (activeTab === 'interfaces') renderInterfacesTab(q);
  else if (activeTab === 'servers') renderServersTab(q);
  else if (activeTab === 'clients') renderClientsTab(q);
  else if (activeTab === 'apps') renderAppsTab(q);
  else if (activeTab === 'vpn_ip') renderVpnIpTab(q);
}

// ----------------------------------------------------
// 1. RENDER INTERFACES TAB
// ----------------------------------------------------
function renderInterfacesTab(q) {
  let items = datasets.interfaces;
  if (q) {
    items = items.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.hospital && s.hospital.toLowerCase().includes(q)) ||
      (s.rustdeskId && s.rustdeskId.toLowerCase().includes(q)) ||
      (s.anydeskId && s.anydeskId.toLowerCase().includes(q)) ||
      (s.ip && s.ip.toLowerCase().includes(q)) ||
      (s.os && s.os.toLowerCase().includes(q)) ||
      (s.notes && s.notes.toLowerCase().includes(q))
    );
  }

  document.getElementById('tabCountText').textContent = 'Menampilkan ' + items.length + ' dari ' + datasets.interfaces.length + ' site';
  const tbody = document.getElementById('interfaceTableBody');

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-10 text-slate-500">Tidak ada data site interface yang cocok</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(site => {
    return '<tr class="hover:bg-slate-800/40 transition border-b border-slate-800/60">' +
      '<td class="py-3 px-4">' +
        '<div class="font-sans font-semibold text-slate-100 text-xs">' + site.name + '</div>' +
        '<div class="text-[10px] px-1.5 py-0.5 mt-0.5 rounded bg-slate-800 text-slate-400 inline-block">' + (site.hospital || 'Umum') + '</div>' +
      '</td>' +
      '<td class="py-3 px-4">' +
        (site.rustdeskId ? 
          '<div class="space-y-0.5">' +
            '<div class="flex items-center space-x-1.5">' +
              '<span class="text-blue-400 font-bold font-mono">' + site.rustdeskId + '</span>' +
              '<button onclick="copyToClipboard(\'' + site.rustdeskId.replace(/'/g, "\\'") + '\', \'Rustdesk ID\')" class="text-slate-500 hover:text-blue-400"><i class="fa-regular fa-copy"></i></button>' +
            '</div>' +
            (site.rustdeskPass ? 
              '<div class="flex items-center space-x-1 text-[11px] text-slate-400">' +
                '<span class="text-slate-500">P:</span><span class="pass-text" data-pass="' + site.rustdeskPass.replace(/"/g, '&quot;') + '">••••••••</span>' +
                '<button onclick="togglePassword(this)" class="text-slate-500 hover:text-white text-[10px]"><i class="fa-solid fa-eye"></i></button>' +
                '<button onclick="copyToClipboard(\'' + site.rustdeskPass.replace(/'/g, "\\'") + '\', \'Password Rustdesk\')" class="text-slate-500 hover:text-emerald-400"><i class="fa-regular fa-copy"></i></button>' +
              '</div>' : '') +
          '</div>' : '<span class="text-slate-600">-</span>') +
      '</td>' +
      '<td class="py-3 px-4">' +
        (site.anydeskId ? 
          '<div class="space-y-0.5">' +
            '<div class="flex items-center space-x-1.5">' +
              '<span class="text-amber-400 font-bold font-mono">' + site.anydeskId + '</span>' +
              '<button onclick="copyToClipboard(\'' + site.anydeskId.replace(/'/g, "\\'") + '\', \'AnyDesk ID\')" class="text-slate-500 hover:text-amber-400"><i class="fa-regular fa-copy"></i></button>' +
            '</div>' +
            (site.anydeskPass ? 
              '<div class="flex items-center space-x-1 text-[11px] text-slate-400">' +
                '<span class="text-slate-500">P:</span><span class="pass-text" data-pass="' + site.anydeskPass.replace(/"/g, '&quot;') + '">••••••••</span>' +
                '<button onclick="togglePassword(this)" class="text-slate-500 hover:text-white text-[10px]"><i class="fa-solid fa-eye"></i></button>' +
                '<button onclick="copyToClipboard(\'' + site.anydeskPass.replace(/'/g, "\\'") + '\', \'Password AnyDesk\')" class="text-slate-500 hover:text-emerald-400"><i class="fa-regular fa-copy"></i></button>' +
              '</div>' : '') +
          '</div>' : '<span class="text-slate-600">-</span>') +
      '</td>' +
      '<td class="py-3 px-4">' +
        (site.tvId ? 
          '<div class="flex items-center space-x-1.5"><span class="text-cyan-400 font-mono">' + site.tvId + '</span><button onclick="copyToClipboard(\'' + site.tvId + '\', \'TV ID\')" class="text-slate-500 hover:text-cyan-400"><i class="fa-regular fa-copy"></i></button></div>' : '<span class="text-slate-600">-</span>') +
      '</td>' +
      '<td class="py-3 px-4">' +
        (site.ip ? '<div class="text-slate-200 cursor-pointer hover:text-cyan-400" onclick="copyToClipboard(\'' + site.ip + '\', \'IP\')">' + site.ip + '</div>' : '') +
        (site.pcUserPass ? '<div class="text-slate-400 text-[11px] cursor-pointer hover:text-yellow-400" onclick="copyToClipboard(\'' + site.pcUserPass.replace(/'/g, "\\'") + '\', \'Login\')">' + site.pcUserPass + '</div>' : '') +
      '</td>' +
      '<td class="py-3 px-4">' +
        (site.os ? '<span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">' + site.os + '</span> ' : '') +
        (site.version ? '<span class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">' + site.version + '</span>' : '') +
      '</td>' +
      '<td class="py-3 px-4 text-center">' + getNoteIconHtml(site.name, site.notes) + '</td>' +
      '<td class="py-3 px-4 text-right whitespace-nowrap">' +
        '<button onclick="editInterface(\'' + site.id + '\')" class="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition" title="Edit Site"><i class="fa-regular fa-pen-to-square"></i></button>' +
        '<button onclick="deleteInterface(\'' + site.id + '\')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition" title="Hapus Site"><i class="fa-regular fa-trash-can"></i></button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// ----------------------------------------------------
// 2. RENDER SERVERS TAB (Includes Rustdesk & AnyDesk Passwords + Note Icon)
// ----------------------------------------------------
function renderServersTab(q) {
  let items = datasets.servers;
  if (q) {
    items = items.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.userSsh && s.userSsh.toLowerCase().includes(q)) ||
      (s.rustdeskId && s.rustdeskId.toLowerCase().includes(q)) ||
      (s.anydeskId && s.anydeskId.toLowerCase().includes(q))
    );
  }

  document.getElementById('tabCountText').textContent = 'Menampilkan ' + items.length + ' dari ' + datasets.servers.length + ' server';
  const tbody = document.getElementById('serverTableBody');

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-10 text-slate-500">Tidak ada data server yang cocok</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(srv => {
    return '<tr class="hover:bg-slate-800/40 transition border-b border-slate-800/60">' +
      '<td class="py-3 px-4">' +
        '<div class="font-sans font-bold text-white text-xs">' + srv.name + '</div>' +
      '</td>' +
      '<td class="py-3 px-4">' +
        (srv.userSsh ? 
          '<div class="flex items-center space-x-1.5 font-mono text-cyan-300">' +
            '<span class="select-all">' + srv.userSsh + '</span>' +
            '<button onclick="copyToClipboard(\'' + srv.userSsh.replace(/'/g, "\\'") + '\', \'SSH Command\')" class="text-slate-400 hover:text-cyan-300"><i class="fa-regular fa-copy"></i></button>' +
          '</div>' : '<span class="text-slate-600">-</span>') +
      '</td>' +
      '<td class="py-3 px-4">' +
        (srv.passSsh ? 
          '<div class="flex items-center space-x-1.5 text-[11px] text-slate-400">' +
            '<span class="font-mono pass-text" data-pass="' + srv.passSsh.replace(/"/g, '&quot;') + '">••••••••</span>' +
            '<button onclick="togglePassword(this)" class="text-slate-500 hover:text-white text-[10px]"><i class="fa-solid fa-eye"></i></button>' +
            '<button onclick="copyToClipboard(\'' + srv.passSsh.replace(/'/g, "\\'") + '\', \'Password SSH\')" class="text-slate-500 hover:text-emerald-400"><i class="fa-regular fa-copy"></i></button>' +
          '</div>' : '<span class="text-slate-600">-</span>') +
      '</td>' +
      '<td class="py-3 px-4">' +
        (srv.rustdeskId ? 
          '<div class="space-y-0.5">' +
            '<div class="flex items-center space-x-1.5">' +
              '<span class="text-blue-400 font-bold font-mono">' + srv.rustdeskId + '</span>' +
              '<button onclick="copyToClipboard(\'' + srv.rustdeskId + '\', \'Rustdesk\')" class="text-slate-500 hover:text-blue-400"><i class="fa-regular fa-copy"></i></button>' +
            '</div>' +
            (srv.rustdeskPass ? 
              '<div class="flex items-center space-x-1 text-[11px] text-slate-400">' +
                '<span class="text-slate-500">P:</span><span class="pass-text" data-pass="' + srv.rustdeskPass.replace(/"/g, '&quot;') + '">••••••••</span>' +
                '<button onclick="togglePassword(this)" class="text-slate-500 hover:text-white text-[10px]"><i class="fa-solid fa-eye"></i></button>' +
                '<button onclick="copyToClipboard(\'' + srv.rustdeskPass.replace(/'/g, "\\'") + '\', \'Password Rustdesk\')" class="text-slate-500 hover:text-emerald-400"><i class="fa-regular fa-copy"></i></button>' +
              '</div>' : '') +
          '</div>' : '<span class="text-slate-600">-</span>') +
      '</td>' +
      '<td class="py-3 px-4">' +
        (srv.anydeskId ? 
          '<div class="space-y-0.5">' +
            '<div class="flex items-center space-x-1.5">' +
              '<span class="text-amber-400 font-mono font-bold">' + srv.anydeskId + '</span>' +
              '<button onclick="copyToClipboard(\'' + srv.anydeskId + '\', \'AnyDesk\')" class="text-slate-500 hover:text-amber-400"><i class="fa-regular fa-copy"></i></button>' +
            '</div>' +
            (srv.anydeskPass ? 
              '<div class="flex items-center space-x-1 text-[11px] text-slate-400">' +
                '<span class="text-slate-500">P:</span><span class="pass-text" data-pass="' + srv.anydeskPass.replace(/"/g, '&quot;') + '">••••••••</span>' +
                '<button onclick="togglePassword(this)" class="text-slate-500 hover:text-white text-[10px]"><i class="fa-solid fa-eye"></i></button>' +
                '<button onclick="copyToClipboard(\'' + srv.anydeskPass.replace(/'/g, "\\'") + '\', \'Password AnyDesk\')" class="text-slate-500 hover:text-emerald-400"><i class="fa-regular fa-copy"></i></button>' +
              '</div>' : '') +
          '</div>' : '') +
        (srv.tvId ? 
          '<div class="space-y-0.5 mt-1 pt-1 border-t border-slate-800">' +
            '<div class="flex items-center space-x-1.5">' +
              '<span class="text-cyan-400 font-mono text-[11px]">TV: ' + srv.tvId + '</span>' +
              '<button onclick="copyToClipboard(\'' + srv.tvId + '\', \'TV ID\')" class="text-slate-500 hover:text-cyan-400 text-[10px]"><i class="fa-regular fa-copy"></i></button>' +
            '</div>' +
            (srv.tvPass ? 
              '<div class="flex items-center space-x-1 text-[10px] text-slate-400">' +
                '<span class="text-slate-500">P:</span><span class="pass-text" data-pass="' + srv.tvPass.replace(/"/g, '&quot;') + '">••••••••</span>' +
                '<button onclick="togglePassword(this)" class="text-slate-500 hover:text-white text-[9px]"><i class="fa-solid fa-eye"></i></button>' +
                '<button onclick="copyToClipboard(\'' + srv.tvPass.replace(/'/g, "\\'") + '\', \'Password TV\')" class="text-slate-500 hover:text-emerald-400"><i class="fa-regular fa-copy"></i></button>' +
              '</div>' : '') +
          '</div>' : '') +
        (!srv.anydeskId && !srv.tvId ? '<span class="text-slate-600">-</span>' : '') +
      '</td>' +
      '<td class="py-3 px-4 text-center">' + getNoteIconHtml(srv.name, srv.notes) + '</td>' +
      '<td class="py-3 px-4 text-right whitespace-nowrap">' +
        '<button onclick="editServer(\'' + srv.id + '\')" class="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition" title="Edit Server"><i class="fa-regular fa-pen-to-square"></i></button>' +
        '<button onclick="deleteServer(\'' + srv.id + '\')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition" title="Hapus Server"><i class="fa-regular fa-trash-can"></i></button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// ----------------------------------------------------
// 3. RENDER CLIENTS TAB (Includes Note Icon)
// ----------------------------------------------------
function renderClientsTab(q) {
  let items = datasets.clients;
  if (q) {
    items = items.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.hospital && c.hospital.toLowerCase().includes(q)) ||
      (c.anydeskId && c.anydeskId.toLowerCase().includes(q)) ||
      (c.rustdeskId && c.rustdeskId.toLowerCase().includes(q)) ||
      (c.ip && c.ip.toLowerCase().includes(q))
    );
  }

  document.getElementById('tabCountText').textContent = 'Menampilkan ' + items.length + ' dari ' + datasets.clients.length + ' PC client';
  const tbody = document.getElementById('clientTableBody');

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-10 text-slate-500">Tidak ada data client yang cocok</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(c => {
    return '<tr class="hover:bg-slate-800/40 transition border-b border-slate-800/60">' +
      '<td class="py-3 px-4">' +
        '<div class="font-sans font-semibold text-white text-xs">' + c.name + '</div>' +
        '<div class="text-[10px] px-1.5 py-0.5 mt-0.5 rounded bg-slate-800 text-slate-400 inline-block">' + (c.hospital || 'Umum') + '</div>' +
      '</td>' +
      '<td class="py-3 px-4">' +
        (c.anydeskId ? 
          '<div class="space-y-0.5">' +
            '<div class="flex items-center space-x-1.5"><span class="text-amber-400 font-bold font-mono">' + c.anydeskId + '</span><button onclick="copyToClipboard(\'' + c.anydeskId + '\', \'AnyDesk\')" class="text-slate-500 hover:text-amber-400"><i class="fa-regular fa-copy"></i></button></div>' +
            (c.anydeskPass ? '<div class="text-[11px] text-slate-400 flex items-center space-x-1"><span>P:</span><span class="pass-text" data-pass="' + c.anydeskPass.replace(/"/g, '&quot;') + '">••••••••</span><button onclick="togglePassword(this)" class="text-slate-500 hover:text-white text-[10px]"><i class="fa-solid fa-eye"></i></button><button onclick="copyToClipboard(\'' + c.anydeskPass.replace(/'/g, "\\'") + '\', \'Password AnyDesk\')" class="text-slate-500 hover:text-emerald-400"><i class="fa-regular fa-copy"></i></button></div>' : '') +
          '</div>' : '<span class="text-slate-600">-</span>') +
      '</td>' +
      '<td class="py-3 px-4">' +
        (c.rustdeskId ? 
          '<div class="space-y-0.5">' +
            '<div class="flex items-center space-x-1.5">' +
              '<span class="text-blue-400 font-bold font-mono">' + c.rustdeskId + '</span>' +
              '<button onclick="copyToClipboard(\'' + c.rustdeskId + '\', \'Rustdesk\')" class="text-slate-500 hover:text-blue-400"><i class="fa-regular fa-copy"></i></button>' +
            '</div>' +
            (c.rustdeskPass ? 
              '<div class="text-[11px] text-slate-400 flex items-center space-x-1">' +
                '<span>P:</span><span class="pass-text" data-pass="' + c.rustdeskPass.replace(/"/g, '&quot;') + '">••••••••</span>' +
                '<button onclick="togglePassword(this)" class="text-slate-500 hover:text-white text-[10px]"><i class="fa-solid fa-eye"></i></button>' +
                '<button onclick="copyToClipboard(\'' + c.rustdeskPass.replace(/'/g, "\\'") + '\', \'Password Rustdesk\')" class="text-slate-500 hover:text-emerald-400"><i class="fa-regular fa-copy"></i></button>' +
              '</div>' : '') +
          '</div>' : '<span class="text-slate-600">-</span>') +
      '</td>' +
      '<td class="py-3 px-4">' + (c.tvId ? '<span class="text-cyan-400 font-mono">' + c.tvId + '</span>' : '<span class="text-slate-600">-</span>') + '</td>' +
      '<td class="py-3 px-4">' + (c.ip ? '<span class="text-slate-200 cursor-pointer hover:text-cyan-400" onclick="copyToClipboard(\'' + c.ip + '\', \'IP\')">' + c.ip + '</span>' : '<span class="text-slate-600">-</span>') + '</td>' +
      '<td class="py-3 px-4 text-center">' + getNoteIconHtml(c.name, c.notes) + '</td>' +
      '<td class="py-3 px-4 text-right whitespace-nowrap">' +
        '<button onclick="editClient(\'' + c.id + '\')" class="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition" title="Edit Client"><i class="fa-regular fa-pen-to-square"></i></button>' +
        '<button onclick="deleteClient(\'' + c.id + '\')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition" title="Hapus Client"><i class="fa-regular fa-trash-can"></i></button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// ----------------------------------------------------
// 4. RENDER APPS & ADMINER TAB
// ----------------------------------------------------
function renderAppsTab(q) {
  let items = datasets.apps;
  if (q) {
    items = items.filter(a =>
      (a.clientName && a.clientName.toLowerCase().includes(q)) ||
      (a.appUrl && a.appUrl.toLowerCase().includes(q)) ||
      (a.adminer && a.adminer.toLowerCase().includes(q)) ||
      (a.ssh && a.ssh.toLowerCase().includes(q))
    );
  }

  document.getElementById('tabCountText').textContent = 'Menampilkan ' + items.length + ' dari ' + datasets.apps.length + ' aplikasi';
  const container = document.getElementById('appsCardsContainer');

  if (items.length === 0) {
    container.innerHTML = '<div class="col-span-3 text-center py-10 text-slate-500">Tidak ada aplikasi yang cocok</div>';
    return;
  }

  container.innerHTML = items.map(app => {
    return '<div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm">' +
      '<div class="space-y-3">' +
        '<div class="flex items-start justify-between">' +
          '<div>' +
            '<span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">' + (app.version || 'V2') + '</span>' +
            '<h3 class="font-bold text-white text-sm mt-1.5">' + app.clientName + '</h3>' +
            (app.osVersion ? '<p class="text-[11px] text-amber-400 mt-0.5"><i class="fa-brands fa-linux mr-1"></i>' + app.osVersion + '</p>' : '') +
          '</div>' +
          '<div class="flex items-center space-x-1">' +
            '<button onclick="editApp(\'' + app.id + '\')" class="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800" title="Edit Aplikasi"><i class="fa-regular fa-pen-to-square"></i></button>' +
            '<button onclick="deleteApp(\'' + app.id + '\')" class="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800" title="Hapus Aplikasi"><i class="fa-regular fa-trash-can"></i></button>' +
          '</div>' +
        '</div>' +

        // Action Links
        '<div class="space-y-2 pt-1">' +
          (app.appUrl ? 
            '<a href="' + app.appUrl + '" target="_blank" class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 group transition">' +
              '<span class="flex items-center space-x-2 text-xs text-slate-300 group-hover:text-emerald-400"><i class="fa-solid fa-globe text-emerald-400"></i><span class="font-semibold">Web Aplikasi LIS</span></span>' +
              '<i class="fa-solid fa-arrow-up-right-from-square text-xs text-slate-500 group-hover:text-emerald-400"></i>' +
            '</a>' : '') +

          (app.adminer ? 
            '<a href="' + app.adminer + '" target="_blank" class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 group transition">' +
              '<span class="flex items-center space-x-2 text-xs text-slate-300 group-hover:text-cyan-400"><i class="fa-solid fa-database text-cyan-400"></i><span class="font-semibold">Adminer Database</span></span>' +
              '<i class="fa-solid fa-arrow-up-right-from-square text-xs text-slate-500 group-hover:text-cyan-400"></i>' +
            '</a>' : '') +

          (app.grafana ? 
            '<div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">' +
              '<span class="flex items-center space-x-2 text-slate-400"><i class="fa-solid fa-chart-line text-amber-400"></i><span>Grafana:</span></span>' +
              '<span class="font-mono text-slate-200 select-all">' + app.grafana + '</span>' +
            '</div>' : '') +

          (app.ssh ? 
            '<div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">' +
              '<span class="text-slate-300 truncate max-w-[220px] select-all"><i class="fa-solid fa-terminal text-emerald-400 mr-1.5 font-sans"></i>' + app.ssh + '</span>' +
              '<button onclick="copyToClipboard(\'' + app.ssh.replace(/'/g, "\\'") + '\', \'SSH Host\')" class="text-slate-500 hover:text-emerald-400 text-xs"><i class="fa-regular fa-copy"></i></button>' +
            '</div>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ----------------------------------------------------
// 5. RENDER VPN & IP TAB (Includes Note Icon)
// ----------------------------------------------------
function renderVpnIpTab(q) {
  // VPN Cards
  const vpnContainer = document.getElementById('vpnCardsContainer');
  let vpns = datasets.vpns;
  if (q) vpns = vpns.filter(v => (v.hospital && v.hospital.toLowerCase().includes(q)) || (v.vpnType && v.vpnType.toLowerCase().includes(q)));

  vpnContainer.innerHTML = vpns.map(v => {
    return '<div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">' +
      '<div class="flex items-center justify-between">' +
        '<h4 class="font-bold text-white text-xs">' + v.hospital + '</h4>' +
        '<div class="flex items-center space-x-1.5">' +
          '<span class="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">' + (v.vpnType || 'VPN') + '</span>' +
          '<button onclick="editVpn(\'' + v.id + '\')" class="p-1 text-slate-400 hover:text-cyan-400"><i class="fa-regular fa-pen-to-square"></i></button>' +
          '<button onclick="deleteVpn(\'' + v.id + '\')" class="p-1 text-slate-400 hover:text-rose-400"><i class="fa-regular fa-trash-can"></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="space-y-1.5 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-850">' +
        (v.username ? 
          '<div class="flex items-center justify-between">' +
            '<span class="text-slate-400 font-sans">User:</span>' +
            '<div class="flex items-center space-x-1.5"><span class="text-white">' + v.username + '</span><button onclick="copyToClipboard(\'' + v.username + '\', \'User VPN\')" class="text-slate-500 hover:text-emerald-400"><i class="fa-regular fa-copy"></i></button></div>' +
          '</div>' : '') +
        (v.password ? 
          '<div class="flex items-center justify-between">' +
            '<span class="text-slate-400 font-sans">Pass:</span>' +
            '<div class="flex items-center space-x-1.5"><span class="pass-text" data-pass="' + v.password.replace(/"/g, '&quot;') + '">••••••••</span><button onclick="togglePassword(this)" class="text-slate-500 hover:text-white text-[10px]"><i class="fa-solid fa-eye"></i></button><button onclick="copyToClipboard(\'' + v.password + '\', \'Pass VPN\')" class="text-slate-500 hover:text-emerald-400"><i class="fa-regular fa-copy"></i></button></div>' +
          '</div>' : '') +
      '</div>' +
      (v.notes ? '<div class="pt-1">' + getNoteIconHtml(v.hospital + ' VPN', v.notes) + '</div>' : '') +
    '</div>';
  }).join('');

  // IP Table
  const ipTbody = document.getElementById('ipTableBody');
  let ips = datasets.ips;
  if (q) ips = ips.filter(ip => (ip.hospital && ip.hospital.toLowerCase().includes(q)) || (ip.pcName && ip.pcName.toLowerCase().includes(q)) || (ip.ip && ip.ip.toLowerCase().includes(q)));

  ipTbody.innerHTML = ips.map(ip => {
    return '<tr class="hover:bg-slate-800/40 border-b border-slate-800/60">' +
      '<td class="py-2.5 px-4 font-sans font-semibold text-white">' + ip.hospital + '</td>' +
      '<td class="py-2.5 px-4 text-slate-300">' + ip.pcName + '</td>' +
      '<td class="py-2.5 px-4 font-mono text-cyan-400 font-bold">' +
        '<span class="cursor-pointer hover:underline" onclick="copyToClipboard(\'' + ip.ip + '\', \'IP\')">' + ip.ip + '</span>' +
      '</td>' +
      '<td class="py-2.5 px-4 text-center">' + getNoteIconHtml(ip.hospital + ' - ' + ip.pcName, ip.notes) + '</td>' +
      '<td class="py-2.5 px-4 text-right whitespace-nowrap">' +
        '<button onclick="editIp(\'' + ip.id + '\')" class="p-1 text-slate-400 hover:text-cyan-400 mr-1"><i class="fa-regular fa-pen-to-square"></i></button>' +
        '<button onclick="deleteIp(\'' + ip.id + '\')" class="p-1 text-slate-400 hover:text-rose-400"><i class="fa-regular fa-trash-can"></i></button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// ----------------------------------------------------
// EDIT HANDLERS
// ----------------------------------------------------
function editInterface(id) {
  const item = datasets.interfaces.find(x => x.id === id);
  if (!item) return;
  openAddModalForTab('interfaces');
  document.getElementById('dynamicModalTitle').textContent = 'Edit Site: ' + item.name;
  document.getElementById('dynFormId').value = item.id;
  document.getElementById('btnSaveDynamicModal').textContent = 'Perbarui Data';

  const form = document.getElementById('dynamicForm');
  form.elements['name'].value = item.name || '';
  form.elements['hospital'].value = item.hospital || '';
  form.elements['rustdeskId'].value = item.rustdeskId || '';
  form.elements['rustdeskPass'].value = item.rustdeskPass || '';
  form.elements['anydeskId'].value = item.anydeskId || '';
  form.elements['anydeskPass'].value = item.anydeskPass || '';
  form.elements['ip'].value = item.ip || '';
  form.elements['os'].value = item.os || '';
  form.elements['version'].value = item.version || '';
  form.elements['notes'].value = item.notes || '';
}

function editServer(id) {
  const item = datasets.servers.find(x => x.id === id);
  if (!item) return;
  openAddModalForTab('servers');
  document.getElementById('dynamicModalTitle').textContent = 'Edit Server: ' + item.name;
  document.getElementById('dynFormId').value = item.id;
  document.getElementById('btnSaveDynamicModal').textContent = 'Perbarui Data';

  const form = document.getElementById('dynamicForm');
  form.elements['name'].value = item.name || '';
  form.elements['userSsh'].value = item.userSsh || '';
  form.elements['passSsh'].value = item.passSsh || '';
  form.elements['rustdeskId'].value = item.rustdeskId || '';
  form.elements['rustdeskPass'].value = item.rustdeskPass || '';
  form.elements['anydeskId'].value = item.anydeskId || '';
  form.elements['anydeskPass'].value = item.anydeskPass || '';
  form.elements['notes'].value = item.notes || '';
}

function editClient(id) {
  const item = datasets.clients.find(x => x.id === id);
  if (!item) return;
  openAddModalForTab('clients');
  document.getElementById('dynamicModalTitle').textContent = 'Edit PC Client: ' + item.name;
  document.getElementById('dynFormId').value = item.id;
  document.getElementById('btnSaveDynamicModal').textContent = 'Perbarui Data';

  const form = document.getElementById('dynamicForm');
  form.elements['name'].value = item.name || '';
  form.elements['hospital'].value = item.hospital || '';
  form.elements['anydeskId'].value = item.anydeskId || '';
  form.elements['anydeskPass'].value = item.anydeskPass || '';
  form.elements['rustdeskId'].value = item.rustdeskId || '';
  form.elements['rustdeskPass'].value = item.rustdeskPass || '';
  form.elements['ip'].value = item.ip || '';
  form.elements['notes'].value = item.notes || '';
}

function editApp(id) {
  const item = datasets.apps.find(x => x.id === id);
  if (!item) return;
  openAddModalForTab('apps');
  document.getElementById('dynamicModalTitle').textContent = 'Edit Aplikasi: ' + item.clientName;
  document.getElementById('dynFormId').value = item.id;
  document.getElementById('btnSaveDynamicModal').textContent = 'Perbarui Data';

  const form = document.getElementById('dynamicForm');
  form.elements['clientName'].value = item.clientName || '';
  form.elements['version'].value = item.version || '';
  form.elements['appUrl'].value = item.appUrl || '';
  form.elements['adminer'].value = item.adminer || '';
  form.elements['ssh'].value = item.ssh || '';
  form.elements['grafana'].value = item.grafana || '';
}

function editVpn(id) {
  const item = datasets.vpns.find(x => x.id === id);
  if (!item) return;
  openAddVpnModal();
  document.getElementById('dynamicModalTitle').textContent = 'Edit VPN: ' + item.hospital;
  document.getElementById('dynFormId').value = item.id;
  document.getElementById('btnSaveDynamicModal').textContent = 'Perbarui Data';

  const form = document.getElementById('dynamicForm');
  form.elements['hospital'].value = item.hospital || '';
  form.elements['vpnType'].value = item.vpnType || '';
  form.elements['username'].value = item.username || '';
  form.elements['password'].value = item.password || '';
  form.elements['notes'].value = item.notes || '';
}

function editIp(id) {
  const item = datasets.ips.find(x => x.id === id);
  if (!item) return;
  openAddIpModal();
  document.getElementById('dynamicModalTitle').textContent = 'Edit Pemetaan IP: ' + item.hospital;
  document.getElementById('dynFormId').value = item.id;
  document.getElementById('btnSaveDynamicModal').textContent = 'Perbarui Data';

  const form = document.getElementById('dynamicForm');
  form.elements['hospital'].value = item.hospital || '';
  form.elements['pcName'].value = item.pcName || '';
  form.elements['ip'].value = item.ip || '';
  form.elements['notes'].value = item.notes || '';
}

// ----------------------------------------------------
// DYNAMIC MODAL BUILDER (Add for any tab)
// ----------------------------------------------------
function openAddModalForTab(tab) {
  const modal = document.getElementById('dynamicModal');
  const title = document.getElementById('dynamicModalTitle');
  const formBody = document.getElementById('dynamicFormBody');
  document.getElementById('dynFormId').value = '';
  document.getElementById('dynFormType').value = tab;
  document.getElementById('btnSaveDynamicModal').textContent = 'Simpan';

  if (tab === 'interfaces') {
    title.textContent = 'Tambah Site Interface Lab';
    formBody.innerHTML = 
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">Nama Site *</label><input type="text" name="name" required class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Rumah Sakit</label><input type="text" name="hospital" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">Rustdesk ID</label><input type="text" name="rustdeskId" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Password Rustdesk</label><input type="text" name="rustdeskPass" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">AnyDesk ID</label><input type="text" name="anydeskId" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Password AnyDesk</label><input type="text" name="anydeskPass" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div class="grid grid-cols-3 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">IP Address</label><input type="text" name="ip" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">OS</label><input type="text" name="os" value="Microsoft Windows" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Versi Service</label><input type="text" name="version" value="V2 LINUX" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div><label class="block text-slate-300 mb-1">Catatan</label><textarea name="notes" rows="2" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></textarea></div>';
  } else if (tab === 'servers') {
    title.textContent = 'Tambah Server Utama & SSH';
    formBody.innerHTML = 
      '<div><label class="block text-slate-300 mb-1">Nama Server *</label><input type="text" name="name" required placeholder="Contoh: SERVER CIS TUV" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">User / Command SSH</label><input type="text" name="userSsh" placeholder="ssh tuv@10.162.79.71" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Password SSH</label><input type="text" name="passSsh" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">Rustdesk ID</label><input type="text" name="rustdeskId" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Password Rustdesk</label><input type="text" name="rustdeskPass" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">AnyDesk ID</label><input type="text" name="anydeskId" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Password AnyDesk</label><input type="text" name="anydeskPass" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div><label class="block text-slate-300 mb-1">Catatan</label><textarea name="notes" rows="2" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></textarea></div>';
  } else if (tab === 'clients') {
    title.textContent = 'Tambah PC Client / Dokter';
    formBody.innerHTML = 
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">Nama PC *</label><input type="text" name="name" required placeholder="PC Dokter 1" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Rumah Sakit</label><input type="text" name="hospital" placeholder="RSUD Margono" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">AnyDesk ID</label><input type="text" name="anydeskId" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Password AnyDesk</label><input type="text" name="anydeskPass" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">Rustdesk ID</label><input type="text" name="rustdeskId" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Password Rustdesk</label><input type="text" name="rustdeskPass" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">IP Address</label><input type="text" name="ip" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Keterangan</label><input type="text" name="notes" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>';
  } else if (tab === 'apps') {
    title.textContent = 'Tambah Aplikasi Web & Database';
    formBody.innerHTML = 
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">Nama Rumah Sakit / Client *</label><input type="text" name="clientName" required placeholder="RSUD Hj. Anna Lasmanah" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Versi LIS</label><input type="text" name="version" value="V2" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">URL Web Aplikasi</label><input type="url" name="appUrl" placeholder="https://rshalv2.medqlab.my.id/login" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">URL Database Adminer</label><input type="url" name="adminer" placeholder="https://db-rshal.medqlab.my.id" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div><label class="block text-slate-300 mb-1">SSH Command</label><input type="text" name="ssh" placeholder="ssh applimetis@ssh-rshal.medqlab.my.id" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
        '<div><label class="block text-slate-300 mb-1">Grafana / Prometheus</label><input type="text" name="grafana" placeholder="192.168.1.15:88" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '</div>';
  } else if (tab === 'vpn_ip') {
    openAddVpnModal();
    return;
  }

  modal.classList.remove('hidden');
}

function openAddVpnModal() {
  const modal = document.getElementById('dynamicModal');
  document.getElementById('dynamicModalTitle').textContent = 'Tambah Akun VPN RS';
  document.getElementById('dynFormId').value = '';
  document.getElementById('dynFormType').value = 'vpns';
  document.getElementById('btnSaveDynamicModal').textContent = 'Simpan';
  document.getElementById('dynamicFormBody').innerHTML = 
    '<div><label class="block text-slate-300 mb-1">Nama RS *</label><input type="text" name="hospital" required placeholder="RSUI" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
    '<div><label class="block text-slate-300 mb-1">Tipe VPN</label><input type="text" name="vpnType" placeholder="CiscoAnyconnect / Forticlient" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
    '<div class="grid grid-cols-2 gap-3">' +
      '<div><label class="block text-slate-300 mb-1">Username</label><input type="text" name="username" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '<div><label class="block text-slate-300 mb-1">Password</label><input type="text" name="password" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
    '</div>' +
    '<div><label class="block text-slate-300 mb-1">Catatan</label><textarea name="notes" rows="2" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></textarea></div>';
  modal.classList.remove('hidden');
}

function openAddIpModal() {
  const modal = document.getElementById('dynamicModal');
  document.getElementById('dynamicModalTitle').textContent = 'Tambah Pemetaan IP Per RS';
  document.getElementById('dynFormId').value = '';
  document.getElementById('dynFormType').value = 'ips';
  document.getElementById('btnSaveDynamicModal').textContent = 'Simpan';
  document.getElementById('dynamicFormBody').innerHTML = 
    '<div><label class="block text-slate-300 mb-1">Nama RS *</label><input type="text" name="hospital" required placeholder="RSUD MUARA TEWEH" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
    '<div class="grid grid-cols-2 gap-3">' +
      '<div><label class="block text-slate-300 mb-1">Nama PC / Unit</label><input type="text" name="pcName" placeholder="PC Server / PC SMI 1" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
      '<div><label class="block text-slate-300 mb-1">IP Address</label><input type="text" name="ip" placeholder="10.10.2.1" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>' +
    '</div>' +
    '<div><label class="block text-slate-300 mb-1">Catatan</label><input type="text" name="notes" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></div>';
  modal.classList.remove('hidden');
}

// Handle dynamic form submit
document.getElementById('dynamicForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const payload = {};
  formData.forEach((val, key) => payload[key] = val.trim());

  const id = document.getElementById('dynFormId').value;
  const type = document.getElementById('dynFormType').value;

  const endpointMap = {
    interfaces: '/api/interfaces',
    servers: '/api/servers',
    clients: '/api/clients',
    apps: '/api/apps',
    vpns: '/api/vpns',
    ips: '/api/ips'
  };

  const endpoint = endpointMap[type] || '/api/interfaces';
  const url = id ? endpoint + '/' + id : endpoint;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Data berhasil disimpan!', 'success');
      document.getElementById('dynamicModal').classList.add('hidden');
      loadAllData();
    } else {
      showToast(data.message || 'Gagal menyimpan', 'error');
    }
  } catch (err) {
    console.error('Save error:', err);
    showToast('Terjadi kesalahan saat menyimpan', 'error');
  }
});

// Cancel & Close Modal
document.getElementById('btnCloseDynamicModal').addEventListener('click', () => {
  document.getElementById('dynamicModal').classList.add('hidden');
});
document.getElementById('btnCancelDynamicModal').addEventListener('click', () => {
  document.getElementById('dynamicModal').classList.add('hidden');
});

// Delete helpers
async function deleteInterface(id) {
  const item = datasets.interfaces.find(x => x.id === id);
  const name = item ? item.name : 'site ini';
  if (!confirm('Apakah Anda yakin ingin menghapus ' + name + '?')) return;
  try {
    const res = await fetch('/api/interfaces/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Site berhasil dihapus', 'success');
      loadAllData();
    } else {
      showToast(data.message || 'Gagal menghapus', 'error');
    }
  } catch (e) {
    showToast('Gagal menghapus: ' + e.message, 'error');
  }
}

async function deleteServer(id) {
  const item = datasets.servers.find(x => x.id === id);
  const name = item ? item.name : 'server ini';
  if (!confirm('Apakah Anda yakin ingin menghapus ' + name + '?')) return;
  try {
    const res = await fetch('/api/servers/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Server berhasil dihapus', 'success');
      loadAllData();
    } else {
      showToast(data.message || 'Gagal menghapus', 'error');
    }
  } catch (e) {
    showToast('Gagal menghapus: ' + e.message, 'error');
  }
}

async function deleteClient(id) {
  const item = datasets.clients.find(x => x.id === id);
  const name = item ? item.name : 'client ini';
  if (!confirm('Apakah Anda yakin ingin menghapus ' + name + '?')) return;
  try {
    const res = await fetch('/api/clients/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('PC client berhasil dihapus', 'success');
      loadAllData();
    } else {
      showToast(data.message || 'Gagal menghapus', 'error');
    }
  } catch (e) {
    showToast('Gagal menghapus: ' + e.message, 'error');
  }
}

async function deleteApp(id) {
  const item = datasets.apps.find(x => x.id === id);
  const name = item ? item.clientName : 'aplikasi ini';
  if (!confirm('Apakah Anda yakin ingin menghapus ' + name + '?')) return;
  try {
    const res = await fetch('/api/apps/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Aplikasi berhasil dihapus', 'success');
      loadAllData();
    } else {
      showToast(data.message || 'Gagal menghapus', 'error');
    }
  } catch (e) {
    showToast('Gagal menghapus: ' + e.message, 'error');
  }
}

async function deleteVpn(id) {
  const item = datasets.vpns.find(x => x.id === id);
  const name = item ? item.hospital : 'VPN ini';
  if (!confirm('Apakah Anda yakin ingin menghapus VPN ' + name + '?')) return;
  try {
    const res = await fetch('/api/vpns/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('VPN berhasil dihapus', 'success');
      loadAllData();
    } else {
      showToast(data.message || 'Gagal menghapus', 'error');
    }
  } catch (e) {
    showToast('Gagal menghapus: ' + e.message, 'error');
  }
}

async function deleteIp(id) {
  const item = datasets.ips.find(x => x.id === id);
  const name = item ? (item.hospital + ' - ' + item.pcName) : 'IP ini';
  if (!confirm('Apakah Anda yakin ingin menghapus ' + name + '?')) return;
  try {
    const res = await fetch('/api/ips/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('IP mapping berhasil dihapus', 'success');
      loadAllData();
    } else {
      showToast(data.message || 'Gagal menghapus', 'error');
    }
  } catch (e) {
    showToast('Gagal menghapus: ' + e.message, 'error');
  }
}

// Config Modal Setup
function setupConfigModal() {
  document.getElementById('btnOpenConfig').addEventListener('click', () => {
    document.getElementById('configModal').classList.remove('hidden');
  });
  document.getElementById('btnCloseConfigModal').addEventListener('click', () => {
    document.getElementById('configModal').classList.add('hidden');
  });
}
