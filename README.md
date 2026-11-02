# WebGIS Map Perizinan & Pemetaan Usaha DPMPTSP

Aplikasi Sistem Informasi Geografis Berbasis Web (**WebGIS**) untuk pengelolaan, visualisasi spasial, dan monitoring perizinan usaha berbasis Nomor Induk Berusaha (NIB) terintegrasi Online Single Submission (OSS).

---

## 1. Stack Teknologi & Arsitektur

- **Backend Framework:** Laravel 10 (PHP 8.1+)
- **Frontend SPA:** React 18, TypeScript, Vite 6, Tailwind CSS v4
- **Database Engine:** PostgreSQL 14+ dengan ekstensi spasial **PostGIS**
- **Peta Digital & Spasial:** Leaflet, OpenStreetMap, PostGIS Bounding Box Query (`ST_MakeEnvelope`)
- **Autentikasi & Keamanan:** Laravel Session Authentication, Role-Based Access Control (RBAC), Rate Limiting, Google reCAPTCHA v2 Checkbox
- **Verifikasi Identitas:** Service Integrasi API Dukcapil Kemendagri (`official_api` / `simulation` / `disabled`)
- **Dokumen & Laporan:** Ekspor Excel 3-Sheet Profesional (`maatwebsite/excel`), Unduh Ringkasan PDF Usaha (`barryvdh/laravel-dompdf`)

---

## 2. Prasyarat Sistem & Dependensi Server

Sebelum menjalankan instalasi di server lokal maupun server produksi, pastikan server telah memenuhi spesifikasi berikut:

1. **PHP:** Versi `>= 8.1` (disarankan PHP 8.2 atau 8.3)
   - Ekstensi PHP yang wajib aktif: `pdo_pgsql`, `pgsql`, `mbstring`, `fileinfo`, `gd`, `zip`, `xml`, `curl`, `json`.
2. **PostgreSQL & PostGIS:**
   - PostgreSQL versi 13, 14, 15, atau 16.
   - Ekstensi **PostGIS** terpasang pada PostgreSQL (`CREATE EXTENSION IF NOT EXISTS postgis;`).
3. **CLI Tools:**
   - Binary `pg_dump` dan `psql` harus terdaftar dalam variabel lingkungan sistem (`PATH`) untuk mendukung fitur Backup dan Restore Database otomatis dari dashboard admin.
4. **Composer & Node.js:**
   - Composer versi `>= 2.2`.
   - Node.js versi `>= 18.0` dan npm versi `>= 9.0`.

---

## 3. Langkah Instalasi & Konfigurasi

### Langkah 1: Kloning Repository & Masuk ke Direktori
```bash
git clone https://github.com/Raapllii/Map_Perizinan.git
cd Map_Perizinan
```

### Langkah 2: Salin File Konfigurasi Lingkungan
```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan parameter basis data PostgreSQL serta kredensial lainnya:
```env
APP_NAME="Map Perizinan"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=map_perizinan
DB_USERNAME=postgres
DB_PASSWORD=rahasia_anda

# Konfigurasi Google reCAPTCHA v2 Checkbox
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

### Langkah 3: Install Dependensi Backend & Frontend
```bash
# Install paket PHP
composer install --optimize-autoloader

# Install paket JavaScript
npm install
```

### Langkah 4: Generate Application Key & Storage Link
```bash
php artisan key:generate
php artisan storage:link
```

### Langkah 5: Jalankan Migrasi Basis Data & Seeder
Pastikan database PostgreSQL `map_perizinan` telah dibuat di database server Anda:
```sql
CREATE DATABASE map_perizinan;
```
Lalu jalankan migrasi tabel dan seeding data awal:
```bash
php artisan migrate --seed
```

### Langkah 6: Kompilasi Frontend
- **Mode Development:**
  ```bash
  npm run dev
  ```
- **Mode Produksi (Build Asset):**
  ```bash
  npm run build
  ```

### Langkah 7: Menjalankan Server Aplikasi
```bash
php artisan serve
```
Akses aplikasi melalui browser di `http://localhost:8000`.

---

## 4. Matriks Peran Pengguna (Role-Based Access Control)

Sistem menerapkan pembatasan hak akses berbasis peran (RBAC) pada backend dan antarmuka:

| Menu & Modul Fitur | Super Admin | Administrator | Verifier | Surveyor |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard Utama & Statistik** | Ya | Ya | Ya | Ya |
| **Peta Spasial Usaha & Pencarian** | Ya | Ya | Ya | Ya |
| **Registrasi & Ubah Data Usaha** | Ya | Ya | Ya | Ya |
| **Hapus & Hapus Massal Data Usaha** | Ya | Ya | Tidak | Tidak |
| **Verifikasi Pengajuan Izin Usaha** | Ya | Ya | Ya | Tidak |
| **Manajemen Pengguna (User Management)** | Ya | Ya (non-Super Admin) | Tidak | Tidak |
| **Pengaturan Sistem & Konfigurasi** | Ya | Ya | Tidak | Tidak |
| **Database Backup & Restore** | Ya | Tidak | Tidak | Tidak |
| **Ekspor & Impor Data Usaha** | Ya | Ya | Tidak | Tidak |
| **Laporan & Rekapitulasi Akses** | Ya | Ya | Ya | Ya |

### Akun Bawaan (Default Seeded Users)
Seluruh akun bawaan menggunakan kata sandi default: `password`.

1. **Super Admin:** `andi.k@pemkab.go.id` (Akses Penuh termasuk Backup & Restore Database)
2. **Administrator:** `siti.r@pemkab.go.id` (Manajemen Pengguna, Ekspor/Impor, Data Usaha)
3. **Verifier:** `budi.h@pemkab.go.id` (Verifikasi Status Izin Usaha)
4. **Surveyor:** `fitri.d@pemkab.go.id` (Petugas Lapangan / Registrasi Usaha)
5. **Akun Uji Nonaktif:** `putri.a@pemkab.go.id` (Untuk pengujian pemblokiran akses akun nonaktif)

---

## 5. Konfigurasi Integrasi Eksternal

### A. Google reCAPTCHA v2 Checkbox ("Saya bukan robot")
1. Daftarkan domain di [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin) dengan tipe **reCAPTCHA v2 Checkbox**.
2. Masukkan kredensial ke dalam file `.env`:
   - `RECAPTCHA_SITE_KEY` dan `VITE_RECAPTCHA_SITE_KEY`
   - `RECAPTCHA_SECRET_KEY`

### B. Integrasi API Dukcapil Kemendagri
Fitur verifikasi NIK pengunjung Peta Publik mendukung 3 mode operasional:
1. **Disabled (`DUKCAPIL_ENABLED=false`):** Mode default aman sebelum DPMPTSP memperoleh PKS resmi dari Ditjen Dukcapil.
2. **Official API (`DUKCAPIL_ENABLED=true` & `DUKCAPIL_SIMULATION_ENABLED=false`):** Mode resmi untuk produksi menggunakan endpoint, key, dan user ID resmi DPMPTSP.
3. **Simulation Mode (`DUKCAPIL_SIMULATION_ENABLED=true`):** Hanya dapat diaktifkan pada lingkungan `local` / `testing` untuk keperluan pengujian internal. Mode ini secara otomatis diblokir jika `APP_ENV=production`.

---

## 6. Prosedur Pengujian (QA & Automated Testing)

Aplikasi dilengkapi dengan rangkaian pengujian otomatis lengkap:

```bash
# 1. Jalankan Unit Test Backend (Dukcapil, Gender Flow, Model)
php artisan test --testsuite=Unit

# 2. Jalankan Pengujian Validasi & Logika Frontend
node --test tests/js/*.mjs

# 3. Verifikasi Status Validitas Composer
composer validate --no-check-publish

# 4. Verifikasi Kompilasi Frontend
npm run build
```

---

## 7. Pemeliharaan & Deployment Produksi

Saat melakukan deployment ke server produksi:
1. Pastikan `APP_ENV=production` dan `APP_DEBUG=false` pada file `.env`.
2. Jalankan optimasi cache Laravel:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```
3. Pastikan direktori `storage/` dan `bootstrap/cache/` memiliki izin tulis yang sesuai oleh web server:
   ```bash
   chmod -R 775 storage bootstrap/cache
   ```
4. Pastikan direktori `storage/app/backups` dan `storage/app/imports` dapat diakses oleh proses web server.

---
*Dikembangkan untuk Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP).*
