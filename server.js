const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
const FRONTEND_DIST = path.join(__dirname, 'frontend', 'dist');
const STATIC_DIR = fs.existsSync(FRONTEND_DIST) ? FRONTEND_DIST : path.join(__dirname, 'public');
app.use(express.static(STATIC_DIR));

const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Helper to read and write JSON files
function readData(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading ' + filename + ':', err);
    return [];
  }
}

function saveData(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const tempFile = filePath + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, filePath);
}

// Helper to read config
function getConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return { rustdeskServers: [] };
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8') || '{}');
  } catch (e) {
    return { rustdeskServers: [] };
  }
}

// ------------------------------------------------------------------
// AUTH API (Local Authentication)
// ------------------------------------------------------------------
const USERS = [
  { username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
  { username: 'operator', password: 'operator123', name: 'Teknisi Lab', role: 'operator' }
];

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
  }
  const user = USERS.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Username atau password salah' });
  }
  const token = 'token-' + Buffer.from(user.username + ':' + Date.now()).toString('base64');
  res.json({
    success: true,
    message: 'Login berhasil!',
    data: {
      username: user.username,
      name: user.name,
      role: user.role,
      token
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Belum login' });
  }
  res.json({ success: true, message: 'Sesi aktif' });
});

// ------------------------------------------------------------------
// 1. INTERFACES / SITES API
// ------------------------------------------------------------------
app.get('/api/sites', (req, res) => getInterfacesHandler(req, res));
app.get('/api/interfaces', (req, res) => getInterfacesHandler(req, res));

function getInterfacesHandler(req, res) {
  const { q, os, version, remote, hospital } = req.query;
  let items = readData('interfaces.json');
  if (!items || items.length === 0) items = readData('sites.json');

  if (q) {
    const query = q.toLowerCase().trim();
    items = items.filter(s => 
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.hospital && s.hospital.toLowerCase().includes(query)) ||
      (s.rustdeskId && s.rustdeskId.toLowerCase().includes(query)) ||
      (s.anydeskId && s.anydeskId.toLowerCase().includes(query)) ||
      (s.tvId && s.tvId.toLowerCase().includes(query)) ||
      (s.ip && s.ip.toLowerCase().includes(query)) ||
      (s.pcUserPass && s.pcUserPass.toLowerCase().includes(query)) ||
      (s.notes && s.notes.toLowerCase().includes(query))
    );
  }

  if (os && os !== 'all') {
    items = items.filter(s => s.os && s.os.toLowerCase().includes(os.toLowerCase()));
  }
  if (version && version !== 'all') {
    items = items.filter(s => s.version && s.version.toLowerCase().includes(version.toLowerCase()));
  }
  if (remote && remote !== 'all') {
    if (remote === 'rustdesk') items = items.filter(s => s.rustdeskId);
    else if (remote === 'anydesk') items = items.filter(s => s.anydeskId);
    else if (remote === 'teamviewer') items = items.filter(s => s.tvId);
  }
  if (hospital && hospital !== 'all') {
    items = items.filter(s => s.hospital && s.hospital.toLowerCase() === hospital.toLowerCase());
  }

  res.json({ success: true, total: items.length, data: items });
}

app.post('/api/interfaces', (req, res) => {
  const items = readData('interfaces.json');
  const body = req.body;
  const siteName = (body.name || body.hospital || '').trim();
  if (!siteName) {
    return res.status(400).json({ success: false, message: 'Nama Site wajib diisi' });
  }

  const newItem = {
    id: 'site-' + Date.now(),
    name: siteName,
    hospital: (body.hospital || siteName || 'Lainnya').trim(),
    rustdeskId: (body.rustdeskId || '').trim(),
    rustdeskPass: (body.rustdeskPass || '').trim(),
    tvId: (body.tvId || '').trim(),
    tvPass: (body.tvPass || '').trim(),
    anydeskId: (body.anydeskId || '').trim(),
    anydeskPass: (body.anydeskPass || '').trim(),
    ip: (body.ip || '').trim(),
    pcUserPass: (body.pcUserPass || '').trim(),
    spec: (body.spec || '').trim(),
    os: (body.os || '').trim(),
    version: (body.version || '').trim(),
    notes: (body.notes || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  items.unshift(newItem);
  saveData('interfaces.json', items);
  saveData('sites.json', items);

  res.status(201).json({ success: true, message: 'Site interface berhasil ditambahkan!', data: newItem });
});
app.post('/api/sites', (req, res) => app._router.handle({ ...req, url: '/api/interfaces' }, res));

app.put('/api/interfaces/:id', (req, res) => {
  const items = readData('interfaces.json');
  const idx = items.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Site tidak ditemukan' });

  const existing = items[idx];
  const body = req.body;
  items[idx] = {
    ...existing,
    ...body,
    updatedAt: new Date().toISOString()
  };
  saveData('interfaces.json', items);
  saveData('sites.json', items);
  res.json({ success: true, message: 'Site berhasil diperbarui!', data: items[idx] });
});
app.put('/api/sites/:id', (req, res) => app._router.handle({ ...req, url: '/api/interfaces/' + req.params.id }, res));

app.delete('/api/interfaces/:id', (req, res) => {
  let items = readData('interfaces.json');
  items = items.filter(s => s.id !== req.params.id);
  saveData('interfaces.json', items);
  saveData('sites.json', items);
  res.json({ success: true, message: 'Site berhasil dihapus' });
});
app.delete('/api/sites/:id', (req, res) => app._router.handle({ ...req, url: '/api/interfaces/' + req.params.id }, res));

// ------------------------------------------------------------------
// 2. SERVERS API
// ------------------------------------------------------------------
app.get('/api/servers', (req, res) => {
  const { q } = req.query;
  let items = readData('servers.json');
  if (q) {
    const query = q.toLowerCase().trim();
    items = items.filter(s =>
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.userSsh && s.userSsh.toLowerCase().includes(query)) ||
      (s.passSsh && s.passSsh.toLowerCase().includes(query)) ||
      (s.rustdeskId && s.rustdeskId.toLowerCase().includes(query)) ||
      (s.anydeskId && s.anydeskId.toLowerCase().includes(query)) ||
      (s.notes && s.notes.toLowerCase().includes(query))
    );
  }
  res.json({ success: true, total: items.length, data: items });
});

app.post('/api/servers', (req, res) => {
  const items = readData('servers.json');
  const body = req.body;
  if (!body.name || !body.name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama Server wajib diisi' });
  }
  const newItem = {
    id: 'srv-' + Date.now(),
    name: body.name.trim(),
    userSsh: (body.userSsh || '').trim(),
    passSsh: (body.passSsh || '').trim(),
    sshPubkey: (body.sshPubkey || '').trim(),
    extraPass: (body.extraPass || '').trim(),
    rustdeskId: (body.rustdeskId || '').trim(),
    rustdeskPass: (body.rustdeskPass || '').trim(),
    anydeskId: (body.anydeskId || '').trim(),
    anydeskPass: (body.anydeskPass || '').trim(),
    tvId: (body.tvId || '').trim(),
    tvPass: (body.tvPass || '').trim(),
    notes: (body.notes || '').trim(),
    createdAt: new Date().toISOString()
  };
  items.unshift(newItem);
  saveData('servers.json', items);
  res.status(201).json({ success: true, message: 'Server berhasil ditambahkan!', data: newItem });
});

app.put('/api/servers/:id', (req, res) => {
  const items = readData('servers.json');
  const idx = items.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Server tidak ditemukan' });
  items[idx] = { ...items[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveData('servers.json', items);
  res.json({ success: true, message: 'Server berhasil diperbarui!', data: items[idx] });
});

app.delete('/api/servers/:id', (req, res) => {
  let items = readData('servers.json');
  items = items.filter(s => s.id !== req.params.id);
  saveData('servers.json', items);
  res.json({ success: true, message: 'Server berhasil dihapus' });
});

// ------------------------------------------------------------------
// 3. CLIENTS API (PC Dokter, Analis, Monitoring)
// ------------------------------------------------------------------
app.get('/api/clients', (req, res) => {
  const { q, hospital } = req.query;
  let items = readData('clients.json');
  if (q) {
    const query = q.toLowerCase().trim();
    items = items.filter(c => 
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.hospital && c.hospital.toLowerCase().includes(query)) ||
      (c.anydeskId && c.anydeskId.toLowerCase().includes(query)) ||
      (c.rustdeskId && c.rustdeskId.toLowerCase().includes(query)) ||
      (c.ip && c.ip.toLowerCase().includes(query))
    );
  }
  if (hospital && hospital !== 'all') {
    items = items.filter(c => c.hospital && c.hospital.toLowerCase() === hospital.toLowerCase());
  }
  res.json({ success: true, total: items.length, data: items });
});

app.post('/api/clients', (req, res) => {
  const items = readData('clients.json');
  const body = req.body;
  if (!body.name || !body.name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama PC Client wajib diisi' });
  }
  const newItem = {
    id: 'cli-' + Date.now(),
    name: body.name.trim(),
    hospital: (body.hospital || 'Umum').trim(),
    anydeskId: (body.anydeskId || '').trim(),
    anydeskPass: (body.anydeskPass || '').trim(),
    rustdeskId: (body.rustdeskId || '').trim(),
    rustdeskPass: (body.rustdeskPass || '').trim(),
    tvId: (body.tvId || '').trim(),
    tvPass: (body.tvPass || '').trim(),
    ip: (body.ip || '').trim(),
    notes: (body.notes || '').trim(),
    createdAt: new Date().toISOString()
  };
  items.unshift(newItem);
  saveData('clients.json', items);
  res.status(201).json({ success: true, message: 'PC Client berhasil ditambahkan!', data: newItem });
});

app.put('/api/clients/:id', (req, res) => {
  const items = readData('clients.json');
  const idx = items.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Client tidak ditemukan' });
  items[idx] = { ...items[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveData('clients.json', items);
  res.json({ success: true, message: 'Client berhasil diperbarui!', data: items[idx] });
});

app.delete('/api/clients/:id', (req, res) => {
  let items = readData('clients.json');
  items = items.filter(s => s.id !== req.params.id);
  saveData('clients.json', items);
  res.json({ success: true, message: 'Client berhasil dihapus' });
});

// ------------------------------------------------------------------
// 4. APPS & ADMINER API
// ------------------------------------------------------------------
app.get('/api/apps', (req, res) => {
  const { q } = req.query;
  let items = readData('apps.json');
  if (q) {
    const query = q.toLowerCase().trim();
    items = items.filter(a => 
      (a.clientName && a.clientName.toLowerCase().includes(query)) ||
      (a.appUrl && a.appUrl.toLowerCase().includes(query)) ||
      (a.adminer && a.adminer.toLowerCase().includes(query)) ||
      (a.ssh && a.ssh.toLowerCase().includes(query))
    );
  }
  res.json({ success: true, total: items.length, data: items });
});

app.post('/api/apps', (req, res) => {
  const items = readData('apps.json');
  const body = req.body;
  if (!body.clientName || !body.clientName.trim()) {
    return res.status(400).json({ success: false, message: 'Nama Client / RS wajib diisi' });
  }
  const newItem = {
    id: 'app-' + Date.now(),
    clientName: body.clientName.trim(),
    version: (body.version || 'V2').trim(),
    osVersion: (body.osVersion || '').trim(),
    appUrl: (body.appUrl || '').trim(),
    adminer: (body.adminer || '').trim(),
    grafana: (body.grafana || '').trim(),
    metabase: (body.metabase || '').trim(),
    ssh: (body.ssh || '').trim(),
    instruments: (body.instruments || '').trim(),
    createdAt: new Date().toISOString()
  };
  items.unshift(newItem);
  saveData('apps.json', items);
  res.status(201).json({ success: true, message: 'Aplikasi berhasil ditambahkan!', data: newItem });
});

app.put('/api/apps/:id', (req, res) => {
  const items = readData('apps.json');
  const idx = items.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Aplikasi tidak ditemukan' });
  items[idx] = { ...items[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveData('apps.json', items);
  res.json({ success: true, message: 'Aplikasi berhasil diperbarui!', data: items[idx] });
});

app.delete('/api/apps/:id', (req, res) => {
  let items = readData('apps.json');
  items = items.filter(s => s.id !== req.params.id);
  saveData('apps.json', items);
  res.json({ success: true, message: 'Aplikasi berhasil dihapus' });
});

// ------------------------------------------------------------------
// 5. VPN & IP PER RS API
// ------------------------------------------------------------------
app.get('/api/vpns', (req, res) => {
  res.json({ success: true, data: readData('vpns.json') });
});

app.post('/api/vpns', (req, res) => {
  const items = readData('vpns.json');
  const newItem = { id: 'vpn-' + Date.now(), ...req.body };
  items.unshift(newItem);
  saveData('vpns.json', items);
  res.status(201).json({ success: true, message: 'VPN berhasil ditambahkan', data: newItem });
});

app.delete('/api/vpns/:id', (req, res) => {
  let items = readData('vpns.json');
  items = items.filter(v => v.id !== req.params.id);
  saveData('vpns.json', items);
  res.json({ success: true, message: 'VPN berhasil dihapus' });
});

app.get('/api/ips', (req, res) => {
  res.json({ success: true, data: readData('ips.json') });
});

app.post('/api/ips', (req, res) => {
  const items = readData('ips.json');
  const newItem = { id: 'ip-' + Date.now(), ...req.body };
  items.push(newItem);
  saveData('ips.json', items);
  res.status(201).json({ success: true, message: 'IP Mapping berhasil ditambahkan', data: newItem });
});

app.delete('/api/ips/:id', (req, res) => {
  let items = readData('ips.json');
  items = items.filter(x => x.id !== req.params.id);
  saveData('ips.json', items);
  res.json({ success: true, message: 'IP Mapping berhasil dihapus' });
});

// ------------------------------------------------------------------
// 6. GLOBAL STATS
// ------------------------------------------------------------------
app.get('/api/stats', (req, res) => {
  const interfaces = readData('interfaces.json');
  const servers = readData('servers.json');
  const clients = readData('clients.json');
  const apps = readData('apps.json');
  const vpns = readData('vpns.json');
  const ips = readData('ips.json');

  res.json({
    success: true,
    data: {
      totalInterfaces: interfaces.length,
      totalServers: servers.length,
      totalClients: clients.length,
      totalApps: apps.length,
      totalVpns: vpns.length,
      totalIps: ips.length
    }
  });
});

// Config
app.get('/api/config', (req, res) => {
  res.json({ success: true, data: getConfig() });
});

// ------------------------------------------------------------------
// APP LAUNCHER API (Local Desktop Integration)
// ------------------------------------------------------------------
app.post('/api/launch', (req, res) => {
  const { type, id } = req.body || {};
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID remote wajib diisi' });
  }

  const cleanId = String(id).replace(/\s+/g, '');
  const { exec } = require('child_process');

  if (type === 'rustdesk') {
    const localRustDesk = path.join(process.env.LOCALAPPDATA || '', 'rustdesk', 'rustdesk.exe');
    const cmd = fs.existsSync(localRustDesk)
      ? `start "" "${localRustDesk}" --connect ${cleanId}`
      : `start rustdesk://${cleanId}`;

    exec(cmd, (err) => {
      if (err) console.error('Gagal menjalankan RustDesk:', err);
    });
    return res.json({ success: true, message: `RustDesk diluncurkan untuk ID ${id}` });
  }

  if (type === 'anydesk') {
    const anydeskPath = 'C:\\Program Files (x86)\\AnyDesk\\AnyDesk.exe';
    const cmd = fs.existsSync(anydeskPath)
      ? `start "" "${anydeskPath}" ${cleanId}`
      : `start anydesk:${cleanId}`;

    exec(cmd, (err) => {
      if (err) console.error('Gagal menjalankan AnyDesk:', err);
    });
    return res.json({ success: true, message: `AnyDesk diluncurkan untuk ID ${id}` });
  }

  return res.status(400).json({ success: false, message: 'Tipe remote tidak valid' });
});

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('===================================================');
  console.log('MEDQLAB Remote Portal (All 7 Sheets) Berjalan!');
  console.log('Lokal:   http://localhost:' + PORT);
  console.log('Jaringan: http://0.0.0.0:' + PORT);
  console.log('===================================================');
});
