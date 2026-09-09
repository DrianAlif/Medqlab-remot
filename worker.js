// Cloudflare Worker for MEDQLAB Remote Portal powered by Cloudflare D1 (SQL Database)

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // ------------------------------------------------------------------
    // API ROUTING (Cloudflare D1 SQL)
    // ------------------------------------------------------------------
    if (pathname.startsWith('/api/')) {
      if (!env.DB) {
        return jsonResponse({ success: false, message: 'D1 Database binding (DB) is missing.' }, 500);
      }

      // 0. AUTH LOGIN
      if (pathname === '/api/auth/login' && method === 'POST') {
        try {
          const body = await request.json();
          const { username, password } = body || {};
          if (!username || !password) {
            return jsonResponse({ success: false, message: 'Username dan password wajib diisi' }, 400);
          }

          const user = await env.DB.prepare(
            'SELECT id, username, name, role FROM users WHERE LOWER(username) = LOWER(?) AND password = ?'
          ).bind(username.trim(), password).first();

          if (!user) {
            return jsonResponse({ success: false, message: 'Username atau password salah' }, 401);
          }

          const token = 'token-' + btoa(user.username + ':' + Date.now());
          return jsonResponse({
            success: true,
            message: 'Login berhasil!',
            data: {
              username: user.username,
              name: user.name,
              role: user.role,
              token,
            },
          });
        } catch (err) {
          return jsonResponse({ success: false, message: err.message }, 500);
        }
      }

      // 1. STATS
      if (pathname === '/api/stats' && method === 'GET') {
        try {
          const stats = await env.DB.prepare(`
            SELECT 
              (SELECT count(*) FROM interfaces) as totalInterfaces,
              (SELECT count(*) FROM servers) as totalServers,
              (SELECT count(*) FROM clients) as totalClients,
              (SELECT count(*) FROM apps) as totalApps,
              (SELECT count(*) FROM vpns) as totalVpns,
              (SELECT count(*) FROM ips) as totalIps
          `).first();
          return jsonResponse({ success: true, data: stats });
        } catch (err) {
          return jsonResponse({ success: false, message: err.message }, 500);
        }
      }

      // 2. CONFIG
      if (pathname === '/api/config') {
        if (method === 'GET') {
          const row = await env.DB.prepare("SELECT value FROM config WHERE key = 'rustdeskServers'").first();
          let servers = [];
          try {
            if (row && row.value) servers = JSON.parse(row.value);
          } catch (e) {}
          return jsonResponse({ success: true, data: { rustdeskServers: servers } });
        }
        if (method === 'POST') {
          const body = await request.json();
          const val = JSON.stringify(body.rustdeskServers || []);
          await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('rustdeskServers', ?)").bind(val).run();
          return jsonResponse({ success: true, message: 'Config updated' });
        }
      }

      // LAUNCH APP (Cloudflare edge responder, actual launch handled by browser URL scheme)
      if (pathname === '/api/launch' && method === 'POST') {
        return jsonResponse({ success: true, message: 'Launcher handled via browser protocol' });
      }

      // 3. INTERFACES
      if (pathname === '/api/interfaces' || pathname === '/api/sites') {
        if (method === 'GET') {
          const q = searchParams.get('q');
          const hospital = searchParams.get('hospital');
          const os = searchParams.get('os');
          const ver = searchParams.get('version');
          const remote = searchParams.get('remote');

          let sql = 'SELECT * FROM interfaces WHERE 1=1';
          const params = [];

          if (q) {
            sql += ' AND (name LIKE ? OR hospital LIKE ? OR rustdeskId LIKE ? OR anydeskId LIKE ? OR tvId LIKE ? OR ip LIKE ? OR notes LIKE ?)';
            const lq = '%' + q + '%';
            params.push(lq, lq, lq, lq, lq, lq, lq);
          }
          if (hospital && hospital !== 'all') {
            sql += ' AND hospital = ?';
            params.push(hospital);
          }
          if (os && os !== 'all') {
            sql += ' AND os LIKE ?';
            params.push('%' + os + '%');
          }
          if (ver && ver !== 'all') {
            sql += ' AND version LIKE ?';
            params.push('%' + ver + '%');
          }
          if (remote && remote !== 'all') {
            if (remote === 'rustdesk') sql += " AND rustdeskId IS NOT NULL AND rustdeskId != ''";
            else if (remote === 'anydesk') sql += " AND anydeskId IS NOT NULL AND anydeskId != ''";
            else if (remote === 'teamviewer') sql += " AND tvId IS NOT NULL AND tvId != ''";
          }
          sql += ' ORDER BY name ASC';

          const stmt = env.DB.prepare(sql);
          const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
          return jsonResponse({ success: true, total: results.length, data: results });
        }

        if (method === 'POST') {
          const body = await request.json();
          const name = (body.name || body.hospital || '').trim();
          if (!name) return jsonResponse({ success: false, message: 'Nama Site wajib diisi' }, 400);

          const item = {
            id: 'site-' + Date.now(),
            name,
            hospital: (body.hospital || name || 'Lainnya').trim(),
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
            rustdeskServer: (body.rustdeskServer || '').trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await env.DB.prepare(`
            INSERT INTO interfaces (id, name, hospital, rustdeskId, rustdeskPass, tvId, tvPass, anydeskId, anydeskPass, ip, pcUserPass, spec, os, version, notes, rustdeskServer, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            item.id, item.name, item.hospital, item.rustdeskId, item.rustdeskPass, item.tvId, item.tvPass, item.anydeskId, item.anydeskPass, item.ip, item.pcUserPass, item.spec, item.os, item.version, item.notes, item.rustdeskServer, item.createdAt, item.updatedAt
          ).run();

          return jsonResponse({ success: true, message: 'Site berhasil ditambahkan!', data: item }, 201);
        }
      }

      const ifMatch = pathname.match(/^\/api\/(?:interfaces|sites)\/([^\/]+)$/);
      if (ifMatch) {
        const id = ifMatch[1];
        if (method === 'GET') {
          const item = await env.DB.prepare('SELECT * FROM interfaces WHERE id = ?').bind(id).first();
          if (!item) return jsonResponse({ success: false, message: 'Not found' }, 404);
          return jsonResponse({ success: true, data: item });
        }
        if (method === 'PUT') {
          const body = await request.json();
          const existing = await env.DB.prepare('SELECT * FROM interfaces WHERE id = ?').bind(id).first();
          if (!existing) return jsonResponse({ success: false, message: 'Not found' }, 404);

          const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
          await env.DB.prepare(`
            UPDATE interfaces SET name=?, hospital=?, rustdeskId=?, rustdeskPass=?, tvId=?, tvPass=?, anydeskId=?, anydeskPass=?, ip=?, pcUserPass=?, spec=?, os=?, version=?, notes=?, rustdeskServer=?, updatedAt=?
            WHERE id=?
          `).bind(
            updated.name, updated.hospital, updated.rustdeskId, updated.rustdeskPass, updated.tvId, updated.tvPass, updated.anydeskId, updated.anydeskPass, updated.ip, updated.pcUserPass, updated.spec, updated.os, updated.version, updated.notes, updated.rustdeskServer, updated.updatedAt, id
          ).run();

          return jsonResponse({ success: true, message: 'Site updated', data: updated });
        }
        if (method === 'DELETE') {
          await env.DB.prepare('DELETE FROM interfaces WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Site deleted' });
        }
      }

      // 4. SERVERS
      if (pathname === '/api/servers') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM servers ORDER BY name ASC').all();
          return jsonResponse({ success: true, total: results.length, data: results });
        }
        if (method === 'POST') {
          const body = await request.json();
          const item = {
            id: 'srv-' + Date.now(),
            name: (body.name || '').trim(),
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
            rustdeskServer: (body.rustdeskServer || '').trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await env.DB.prepare(`
            INSERT INTO servers (id, name, userSsh, passSsh, sshPubkey, extraPass, rustdeskId, rustdeskPass, anydeskId, anydeskPass, tvId, tvPass, notes, rustdeskServer, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            item.id, item.name, item.userSsh, item.passSsh, item.sshPubkey, item.extraPass, item.rustdeskId, item.rustdeskPass, item.anydeskId, item.anydeskPass, item.tvId, item.tvPass, item.notes, item.rustdeskServer, item.createdAt, item.updatedAt
          ).run();
          return jsonResponse({ success: true, message: 'Server berhasil ditambahkan!', data: item }, 201);
        }
      }

      const srvMatch = pathname.match(/^\/api\/servers\/([^\/]+)$/);
      if (srvMatch) {
        const id = srvMatch[1];
        if (method === 'PUT') {
          const body = await request.json();
          const existing = await env.DB.prepare('SELECT * FROM servers WHERE id = ?').bind(id).first();
          if (!existing) return jsonResponse({ success: false, message: 'Not found' }, 404);
          const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
          await env.DB.prepare(`
            UPDATE servers SET name=?, userSsh=?, passSsh=?, sshPubkey=?, extraPass=?, rustdeskId=?, rustdeskPass=?, anydeskId=?, anydeskPass=?, tvId=?, tvPass=?, notes=?, rustdeskServer=?, updatedAt=?
            WHERE id=?
          `).bind(
            updated.name, updated.userSsh, updated.passSsh, updated.sshPubkey, updated.extraPass, updated.rustdeskId, updated.rustdeskPass, updated.anydeskId, updated.anydeskPass, updated.tvId, updated.tvPass, updated.notes, updated.rustdeskServer, updated.updatedAt, id
          ).run();
          return jsonResponse({ success: true, message: 'Server updated', data: updated });
        }
        if (method === 'DELETE') {
          await env.DB.prepare('DELETE FROM servers WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Server deleted' });
        }
      }

      // 5. CLIENTS
      if (pathname === '/api/clients') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM clients ORDER BY name ASC').all();
          return jsonResponse({ success: true, total: results.length, data: results });
        }
        if (method === 'POST') {
          const body = await request.json();
          const item = {
            id: 'cli-' + Date.now(),
            name: (body.name || '').trim(),
            hospital: (body.hospital || '').trim(),
            anydeskId: (body.anydeskId || '').trim(),
            anydeskPass: (body.anydeskPass || '').trim(),
            rustdeskId: (body.rustdeskId || '').trim(),
            rustdeskPass: (body.rustdeskPass || '').trim(),
            tvId: (body.tvId || '').trim(),
            tvPass: (body.tvPass || '').trim(),
            ip: (body.ip || '').trim(),
            notes: (body.notes || '').trim(),
            rustdeskServer: (body.rustdeskServer || '').trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await env.DB.prepare(`
            INSERT INTO clients (id, name, hospital, anydeskId, anydeskPass, rustdeskId, rustdeskPass, tvId, tvPass, ip, notes, rustdeskServer, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            item.id, item.name, item.hospital, item.anydeskId, item.anydeskPass, item.rustdeskId, item.rustdeskPass, item.tvId, item.tvPass, item.ip, item.notes, item.rustdeskServer, item.createdAt, item.updatedAt
          ).run();
          return jsonResponse({ success: true, message: 'Client berhasil ditambahkan!', data: item }, 201);
        }
      }

      const cliMatch = pathname.match(/^\/api\/clients\/([^\/]+)$/);
      if (cliMatch) {
        const id = cliMatch[1];
        if (method === 'PUT') {
          const body = await request.json();
          const existing = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
          if (!existing) return jsonResponse({ success: false, message: 'Not found' }, 404);
          const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
          await env.DB.prepare(`
            UPDATE clients SET name=?, hospital=?, anydeskId=?, anydeskPass=?, rustdeskId=?, rustdeskPass=?, tvId=?, tvPass=?, ip=?, notes=?, rustdeskServer=?, updatedAt=?
            WHERE id=?
          `).bind(
            updated.name, updated.hospital, updated.anydeskId, updated.anydeskPass, updated.rustdeskId, updated.rustdeskPass, updated.tvId, updated.tvPass, updated.ip, updated.notes, updated.rustdeskServer, updated.updatedAt, id
          ).run();
          return jsonResponse({ success: true, message: 'Client updated', data: updated });
        }
        if (method === 'DELETE') {
          await env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Client deleted' });
        }
      }

      // 6. APPS
      if (pathname === '/api/apps') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM apps ORDER BY clientName ASC').all();
          return jsonResponse({ success: true, total: results.length, data: results });
        }
        if (method === 'POST') {
          const body = await request.json();
          const item = {
            id: 'app-' + Date.now(),
            clientName: (body.clientName || '').trim(),
            version: (body.version || '').trim(),
            osVersion: (body.osVersion || '').trim(),
            appUrl: (body.appUrl || '').trim(),
            adminer: (body.adminer || '').trim(),
            grafana: (body.grafana || '').trim(),
            metabase: (body.metabase || '').trim(),
            ssh: (body.ssh || '').trim(),
            instruments: (body.instruments || '').trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await env.DB.prepare(`
            INSERT INTO apps (id, clientName, version, osVersion, appUrl, adminer, grafana, metabase, ssh, instruments, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            item.id, item.clientName, item.version, item.osVersion, item.appUrl, item.adminer, item.grafana, item.metabase, item.ssh, item.instruments, item.createdAt, item.updatedAt
          ).run();
          return jsonResponse({ success: true, message: 'App berhasil ditambahkan!', data: item }, 201);
        }
      }

      const appMatch = pathname.match(/^\/api\/apps\/([^\/]+)$/);
      if (appMatch) {
        const id = appMatch[1];
        if (method === 'PUT') {
          const body = await request.json();
          const existing = await env.DB.prepare('SELECT * FROM apps WHERE id = ?').bind(id).first();
          if (!existing) return jsonResponse({ success: false, message: 'Not found' }, 404);
          const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
          await env.DB.prepare(`
            UPDATE apps SET clientName=?, version=?, osVersion=?, appUrl=?, adminer=?, grafana=?, metabase=?, ssh=?, instruments=?, updatedAt=?
            WHERE id=?
          `).bind(
            updated.clientName, updated.version, updated.osVersion, updated.appUrl, updated.adminer, updated.grafana, updated.metabase, updated.ssh, updated.instruments, updated.updatedAt, id
          ).run();
          return jsonResponse({ success: true, message: 'App updated', data: updated });
        }
        if (method === 'DELETE') {
          await env.DB.prepare('DELETE FROM apps WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'App deleted' });
        }
      }

      // 7. VPNS
      if (pathname === '/api/vpns') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM vpns ORDER BY hospital ASC').all();
          return jsonResponse({ success: true, total: results.length, data: results });
        }
        if (method === 'POST') {
          const body = await request.json();
          const item = {
            id: 'vpn-' + Date.now(),
            hospital: (body.hospital || '').trim(),
            vpnType: (body.vpnType || '').trim(),
            username: (body.username || '').trim(),
            password: (body.password || '').trim(),
            notes: (body.notes || '').trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await env.DB.prepare(`
            INSERT INTO vpns (id, hospital, vpnType, username, password, notes, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            item.id, item.hospital, item.vpnType, item.username, item.password, item.notes, item.createdAt, item.updatedAt
          ).run();
          return jsonResponse({ success: true, message: 'VPN berhasil ditambahkan!', data: item }, 201);
        }
      }

      const vpnMatch = pathname.match(/^\/api\/vpns\/([^\/]+)$/);
      if (vpnMatch) {
        const id = vpnMatch[1];
        if (method === 'PUT') {
          const body = await request.json();
          const existing = await env.DB.prepare('SELECT * FROM vpns WHERE id = ?').bind(id).first();
          if (!existing) return jsonResponse({ success: false, message: 'Not found' }, 404);
          const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
          await env.DB.prepare(`
            UPDATE vpns SET hospital=?, vpnType=?, username=?, password=?, notes=?, updatedAt=? WHERE id=?
          `).bind(
            updated.hospital, updated.vpnType, updated.username, updated.password, updated.notes, updated.updatedAt, id
          ).run();
          return jsonResponse({ success: true, message: 'VPN updated', data: updated });
        }
        if (method === 'DELETE') {
          await env.DB.prepare('DELETE FROM vpns WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'VPN deleted' });
        }
      }

      // 8. IPS
      if (pathname === '/api/ips') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM ips ORDER BY hospital ASC').all();
          return jsonResponse({ success: true, total: results.length, data: results });
        }
        if (method === 'POST') {
          const body = await request.json();
          const item = {
            id: 'ip-' + Date.now(),
            hospital: (body.hospital || '').trim(),
            pcName: (body.pcName || '').trim(),
            ip: (body.ip || '').trim(),
            notes: (body.notes || '').trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await env.DB.prepare(`
            INSERT INTO ips (id, hospital, pcName, ip, notes, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            item.id, item.hospital, item.pcName, item.ip, item.notes, item.createdAt, item.updatedAt
          ).run();
          return jsonResponse({ success: true, message: 'IP mapping berhasil ditambahkan!', data: item }, 201);
        }
      }

      const ipMatch = pathname.match(/^\/api\/ips\/([^\/]+)$/);
      if (ipMatch) {
        const id = ipMatch[1];
        if (method === 'PUT') {
          const body = await request.json();
          const existing = await env.DB.prepare('SELECT * FROM ips WHERE id = ?').bind(id).first();
          if (!existing) return jsonResponse({ success: false, message: 'Not found' }, 404);
          const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
          await env.DB.prepare(`
            UPDATE ips SET hospital=?, pcName=?, ip=?, notes=?, updatedAt=? WHERE id=?
          `).bind(
            updated.hospital, updated.pcName, updated.ip, updated.notes, updated.updatedAt, id
          ).run();
          return jsonResponse({ success: true, message: 'IP updated', data: updated });
        }
        if (method === 'DELETE') {
          await env.DB.prepare('DELETE FROM ips WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'IP deleted' });
        }
      }

      return jsonResponse({ success: false, message: 'API endpoint not found' }, 404);
    }

    // ------------------------------------------------------------------
    // STATIC ASSETS SERVING (Frontend SPA)
    // ------------------------------------------------------------------
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Assets binding not found. Please verify wrangler.json configuration.', { status: 404 });
  },
};
