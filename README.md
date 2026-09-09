# MEDQLAB Remote Client & Interface Manager

Aplikasi web modern untuk mengelola, mencatat, dan menambah data remote client serta PC Interface laboratorium rumah sakit (Rustdesk, AnyDesk, TeamViewer, IP, kredensial PC, spesifikasi, OS, dan versi service).

---

## 🚀 Cara Menjalankan Aplikasi (1-Klik)

### Cara Termudah (Windows):
Cukup **double-click** file:
```
start.bat
```
Browser akan otomatis terbuka di `http://localhost:3030` dan server lokal langsung aktif.

### Cara Manual via Terminal:
```bash
cd "C:\Users\HYPE AMD\.gemini\antigravity\scratch\medqlab-remote-client-web"
node server.js
```
Lalu buka browser di:
- **Lokal**: http://localhost:3030
- **Jaringan LAN**: `http://<IP-Komputer-Anda>:3030` (dapat diakses oleh teknisi lain di jaringan yang sama)

---

## 📋 Fitur-Fitur Utama

1. **88+ Data Site Eksisting Pre-loaded**:
   - Seluruh data dari Google Sheet sudah dipindahkan lengkap ke file database lokal `data/sites.json`.
2. **Form Tambah Site Baru**:
   - Klik tombol **+ Tambah Site** di kanan atas.
   - Isi form lengkap (Nama Site, RS, ID & Password Rustdesk/AnyDesk/TV, IP, PC login, OS, Versi Service, Catatan).
   - Klik **Simpan Data Site**, data langsung tersimpan secara permanen.
3. **1-Klik Salin (Copy to Clipboard)**:
   - Tombol copy cepat untuk Rustdesk ID, Password, AnyDesk ID, IP Address, dan kredensial login PC.
   - Tombol **Eye Toggle** untuk mengintip / menyembunyikan password.
   - Tombol **Copy Ringkasan Info** (format rapi untuk dikirim ke chat WhatsApp / Discord).
4. **Pencarian Instan & Multi-Filter**:
   - Pencarian real-time berdasarkan nama site, RS, IP, ID remote, OS, atau user.
   - Filter dropdown: Rumah Sakit / Lab, Sistem Operasi (Windows / Linux), Versi Service Interface, dan Aplikasi Remote aktif.
5. **Widget Konfigurasi Server Rustdesk**:
   - Menampilkan setting Relay/ID Server & Public Key Biznet (baru) dan Digital Ocean (lama) dengan tombol copy cepat.
6. **Ekspor & Impor (Backup)**:
   - **Download CSV**: Backup seluruh database ke format file spreadsheet CSV (bisa langsung dibuka di Microsoft Excel).
   - **Impor Data**: Bisa mengimpor file CSV/JSON sewaktu-waktu (mode tambah atau timpa).
