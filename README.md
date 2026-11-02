# WebGIS Map Perizinan & Pemetaan Usaha DPMPTSP

Aplikasi Sistem Informasi Geografis Berbasis Web (**WebGIS**) untuk pengelolaan, visualisasi spasial, dan monitoring perizinan usaha berbasis Nomor Induk Berusaha (NIB) terintegrasi data Online Single Submission (OSS) pada Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP).

---

## A. Project Overview

### 1. Tujuan Aplikasi
Aplikasi **Map Perizinan DPMPTSP** dirancang sebagai platform satu pintu pemetaan geografis dan pengawasan perizinan usaha daerah. Sistem ini menghubungkan data perizinan OSS dengan koordinat spasial akurat di wilayah kabupaten/kota, menyajikan peta sebaran risiko investasi, memudahkan verifikasi lapangan, serta menyediakan sarana transparansi informasi bagi publik secara terukur dan akuntabel.

### 2. Permasalahan yang Diselesaikan
- **Data Spasial Terfragmentasi:** Mengintegrasikan data tabular OSS (format Excel/CSV) ke dalam basis data spasial PostGIS sehingga sebaran usaha dapat divisualisasikan secara geografis.
- **Validasi Akses Publik & Perlindungan Data Pribadi:** Menerapkan sistem verifikasi identitas pemohon informasi (NIK & reCAPTCHA) sebelum dapat mengakses data detail perizinan atau mengunduh ringkasan PDF, sesuai prinsip perlindungan data pribadi.
- **Kepatuhan Penilaian Kinerja Pelayanan (SKM):** Mengintegrasikan instrumen Survei Kepuasan Pelayanan (SKM) terstandarisasi sebagai mekanisme wajib sebelum pengunjung mengunduh dokumen perizinan di portal publik.
- **Monitoring & Rekapitulasi Berjenjang:** Menyediakan ringkasan KPI, distribusi skala usaha, profil risiko proyek, rekapitulasi gender pemohon, serta riwayat akses publik untuk kebutuhan pelaporan pimpinan.

### 3. Pengguna yang Dituju
1. **Masyarakat / Pelaku Usaha (Publik):** Mengakses Peta Publik, mencari lokasi usaha berizin, mengisi survei pelayanan, memberikan umpan balik, dan mengunduh ringkasan perizinan resmi.
2. **Surveyor / Petugas Lapangan:** Melakukan pendataan usaha baru, memperbarui titik koordinat (geotagging), dan mencatat hasil survei lapangan.
3. **Verifier (Petugas Verifikasi):** Memvalidasi kelayakan izin usaha dan kelengkapan indikator kepatuhan teknis.
4. **Administrator:** Mengelola data pengguna, konfigurasi sistem, impor data massal OSS, serta ekspor laporan berkala.
5. **Super Admin / Pimpinan DPMPTSP:** Memantau dashboard eksekutif, mengakses audit log aktivitas, serta mengelola pencadangan (backup) dan pemulihan (restore) database.

---

## B. Fitur-Fitur Utama (Features)

Seluruh fitur di bawah ini telah diimplementasikan, diaudit, dan diverifikasi melalui pengujian otomatis:

- **1. Peta Publik (Public Map WebGIS):**
  - Tampilan peta interaktif menggunakan pustaka Leaflet dan layer OpenStreetMap (OSM).
  - Visualisasi marker dinamis dengan clustering performa tinggi (`leaflet.markercluster`).
  - Pewarnaan marker berbasis kategori tingkat risiko OSS: **Rendah** (Hijau), **Menengah Rendah** (Ungu), **Menengah Tinggi** (Oranye), dan **Tinggi** (Merah).
  - Filter interaktif berbasis Kecamatan, Kelurahan, Tingkat Risiko, KBLI, dan Status Pemetaan.
- **2. Verifikasi Identitas Pengunjung (Public Access Gate):**
  - Pemeriksaan NIK 16 digit terproteksi Google reCAPTCHA v2 Checkbox (*"Saya bukan robot"*) untuk menangkal bot scraper.
  - Lapisan abstraksi integrasi API Dukcapil Kemendagri (`official_api`, `simulation`, `disabled`) dengan mekanisme penguncian aman (*fail-closed*).
  - Perlindungan privasi pengunjung: NIK ditransmisikan dalam token verifikasi bertanda tangan (*single-use token*) dan di-masking saat ditampilkan ke publik.
- **3. Detail Informasi & Unduh Ringkasan Izin Usaha:**
  - Panel rincian informasi usaha komprehensif menampilkan 27 atribut OSS, indikator kepatuhan izin, serta koordinat lokasi.
  - **Mekanisme Peta Publik:** Pengunjung wajib mengisi Survei Kepuasan Pelayanan (SKM) sebelum file PDF ringkasan izin usaha dapat diunduh.
  - **Mekanisme Dashboard Admin:** Petugas internal yang telah terautentikasi dapat langsung mengunduh PDF tanpa melalui survei.
- **4. Survei Kepuasan Pelayanan (SKM) & Feedback Publik:**
  - Formulir SKM interaktif terstandarisasi PermenPAN-RB untuk mengukur kepuasan layanan perizinan.
  - Widget feedback bintang (rating) dan catatan masukan masyarakat terhadap kemudahan penggunaan peta.
  - Dashboard rekapitulasi nilai survei, rekap per indikator pelayanan, dan ekspor laporan Excel 3-sheet.
- **5. Dashboard Eksekutif & Statistik Laporan:**
  - Metrik KPI real-time: Total Usaha, Investasi Terealisasi, Tenaga Kerja Indonesia (TKI), dan Usaha Terpetakan.
  - Visualisasi grafik batang (*Bar Chart*) tren tahunan dan grafik lingkaran (*Pie Chart*) distribusi skala/risiko usaha via Recharts.
  - Rekapitulasi pemohon berdasarkan gender (Laki-laki, Perempuan, Tidak Diketahui) dengan normalisasi string otomatis.
- **6. Manajemen Data Usaha & Impor Massal OSS:**
  - Tabel data usaha responsif dengan pencarian teks penuh (*Full-Text Search* PostgreSQL GIN index).
  - Fitur tambah, ubah, dan hapus data usaha dengan validasi batas koordinat geografis (-90 s/d 90 Lat, -180 s/d 180 Lng).
  - Background CLI Import processor (`businesses:import` & `oss:import`) yang mampu memproses puluhan ribu baris data OSS tanpa batasan memory web server.
- **7. Ekspor Laporan Excel Multi-Sheet Profesional:**
  - Ekspor Rekapitulasi Survei Pelayanan (Sheet: Ringkasan Survei, Rekapitulasi Indikator, Detail Responden).
  - Ekspor Rekapitulasi Data Perizinan (Sheet: Ringkasan Usaha, Rekapitulasi Gender, Detail Usaha).
  - Ekspor Riwayat Akses Peta Publik dengan masking NIK dan penyamaran alamat IP.
- **8. Keamanan, RBAC & Backup Database:**
  - Role-Based Access Control 4 tingkat: **Super Admin**, **Administrator**, **Verifier**, dan **Surveyor**.
  - Pemblokiran login dan invalidasi sesi instan bagi akun berstatus *Nonaktif*.
  - Modul Backup & Restore basis data PostgreSQL mandiri dari web dashboard dengan sanitasi path traversal dan isolasi privilege Super Admin.
  - Proteksi Rate Limiting ketat pada endpoint publik `/api/verify-nik` dan `/api/admin/login`.

---

## C. Technology Stack

Berikut adalah teknologi yang digunakan pada aplikasi berdasarkan verifikasi lingkungan pengujian aktual:

| Komponen / Lapisan | Pustaka / Software | Versi Terverifikasi | Fungsi Utama | Cara Memeriksa Versi |
| :--- | :--- | :---: | :--- | :--- |
| **Runtime Backend** | PHP | `8.3.33` (disarankan `>= 8.1`) | Eksekutor backend server dan script Artisan | `php -v` |
| **Backend Framework** | Laravel Framework | `8.83.29` (`^8.75`) | Web application MVC, REST API, ORM Eloquent, RBAC | `php artisan --version` |
| **Package Manager PHP** | Composer | `2.8.3` | Pengelola dependensi pustaka PHP | `composer --version` |
| **Database Server** | PostgreSQL | `16.6` (kompatibel 13 - 16) | Database relasional utama | `psql --version` atau query `SELECT version();` |
| **Spatial Engine** | PostGIS | `3.6.2` (kompatibel `>= 3.0`) | Ekstensi spasial geospasial, GiST index, bounding box | Query `SELECT PostGIS_Full_Version();` |
| **Runtime Frontend** | Node.js | `v24.18.0` (disarankan `>= 18.0`) | Lingkungan runtime build frontend | `node -v` |
| **Package Manager JS**| NPM | `11.16.0` (disarankan `>= 9.0`) | Pengelola paket dependensi JavaScript | `npm -v` |
| **Build Tool / Bundler**| Vite | `6.3.5` | Bundler modul modern dan Fast Refresh server | `npx vite --version` |
| **Frontend Library** | React & React DOM | `18.3.1` | Antarmuka pengguna berbasis komponen (SPA) | Cek file `package.json` |
| **Bahasa Frontend** | TypeScript | `7.0.2` | Tipe data statis untuk keandalan kode React | `npx tsc --version` |
| **CSS Framework** | Tailwind CSS | `4.1.12` | Utilitas styling responsif dan tema antarmuka | Cek file `package.json` |
| **Peta Digital** | Leaflet | `1.9.4` | Rendering peta interaktif di peramban | Cek file `package.json` |
| **Marker Clustering** | Leaflet.markercluster | `1.5.3` | Pengelompokan marker titik koordinat ribuan data | Cek file `package.json` |
| **Visualisasi Grafik** | Recharts | `2.15.2` | Grafik statistik batang dan lingkaran pada Dashboard | Cek file `package.json` |
| **Ekspor Dokumen** | Maatwebsite Excel | `3.1` (`^3.1`) | Pembuatan dokumen spreadsheet Excel multi-sheet | Cek file `composer.json` |
| **Generator PDF** | Barryvdh DomPDF | `2.2` (`^2.2`) | Pembuatan lembar ringkasan detail izin format PDF | Cek file `composer.json` |

---

## D. Kebutuhan Sistem (System Requirements)

### 1. Kebutuhan Wajib (Prerequisites)
- **Web Server:** Nginx, Apache HTTP Server, atau Laragon bawaan pengembang lokal.
- **PHP `>= 8.1`** (Diuji pada PHP 8.3) dengan ekstensi aktif:
  - `pdo_pgsql` dan `pgsql` (Koneksi basis data PostgreSQL/PostGIS)
  - `mbstring`, `fileinfo`, `gd`, `zip`, `xml`, `curl`, `json`, `intl`, `bcmath`, `openssl`, `tokenizer`
- **PostgreSQL Database Server `>= 13.0`** (Diuji pada PostgreSQL 16.6).
- **Ekstensi PostGIS `>= 3.0`** (Diuji pada PostGIS 3.6.2).
- **Node.js `>= 18.0`** dan **NPM `>= 9.0`** (Diuji pada Node.js v24 & NPM 11).
- **Composer `>= 2.2`** (Diuji pada Composer 2.8.3).

### 2. Kebutuhan Opsional & Tooling Tambahan
- **CLI Utilities PostgreSQL (`pg_dump` dan `psql`):** Wajib terdaftar pada System `PATH` jika fitur backup & restore database dari antarmuka admin ingin diaktifkan.
- **Git Client:** Untuk kloning dan sinkronisasi source code repository.

### 3. Integrasi Eksternal (Perlu Konfigurasi Tambahan)
- **Google reCAPTCHA v2 Checkbox:** Membutuhkan *Site Key* dan *Secret Key* resmi dari [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin).
- **API Dukcapil Kemendagri:** Memerlukan Perjanjian Kerja Sama (PKS) resmi antara DPMPTSP dengan Ditjen Dukcapil Kemendagri sebelum `DUKCAPIL_ENABLED=true` diaktifkan di production.

---

## E. Struktur Direktori Proyek

```
Map_Perizinan/
├── app/
│   ├── Console/Commands/       # Perintah Artisan (CleanDummyData, OssImport, ProcessBusinessImport)
│   ├── Exceptions/Handler.php  # Penanganan exception & response error global
│   ├── Exports/                # Engine ekspor Excel multi-sheet (Survei, Perizinan, Akses)
│   │   └── Sheets/             # Sub-sheet terpisah (Ringkasan, Rekap Gender, Detail Data)
│   ├── Http/
│   │   ├── Controllers/Api/    # REST API Controllers (Auth, Business, Dashboard, Survei, dll)
│   │   ├── Middleware/         # Middleware RBAC (EnsureUserRole), Akun Aktif (EnsureUserIsActive)
│   │   └── Requests/           # Validasi form request (StoreBusinessRequest, UpdateBusinessRequest)
│   ├── Imports/
│   │   └── BusinessesImport.php# Pipeline import Excel/CSV 27 kolom OSS & trigger spasial PostGIS
│   ├── Models/                 # Eloquent Model (Business, User, ServiceSurvey, AccessLog, Feedback)
│   ├── Providers/              # Service providers sistem (Route, Auth, App)
│   ├── Repositories/           # Layer akses data spasial (BusinessRepository dengan ST_MakeEnvelope)
│   ├── Services/               # Business logic (BusinessService, DukcapilService, RecaptchaService)
│   └── Support/                # Utility pendukung (GenderNormalizer multi-format)
├── config/                     # Konfigurasi sistem (app, database, map, recaptcha, dukcapil)
├── database/
│   ├── factories/              # Factory model untuk automated testing (UserFactory)
│   ├── migrations/             # 19 berkas migrasi skema tabel PostgreSQL & PostGIS triggers
│   └── seeders/                # Seeder bawaan resmi (DatabaseSeeder, AdminUserSeeder)
├── docs/                       # Dokumentasi resmi proyek
│   ├── INSTALLATION.md         # Panduan instalasi langkah-demi-langkah dari nol
│   ├── DEVELOPMENT.md          # Panduan workflow, standar kode, dan git commit
│   └── DEPLOYMENT.md           # Panduan deployment server produksi & arsitektur
├── public/
│   ├── build/                  # Asset produksi terkompilasi (JavaScript, CSS, gambar marker)
│   ├── favicon.svg             # Favicon WebGIS DPMPTSP
│   └── index.php               # Front controller Laravel
├── resources/
│   ├── js/
│   │   ├── app/App.tsx         # Routing SPA utama dan provider autentikasi
│   │   ├── components/         # Komponen antarmuka (CityMapLeaflet, Charts, BusinessPanel, Layout)
│   │   ├── hooks/              # Custom React hooks (useDocumentTitle, useBusinessSearch)
│   │   ├── lib/                # Utility fungsional (riskUtils, visitorSession, exportExcel)
│   │   ├── pages/              # Halaman SPA (PublicMap, Dashboard, DataUsaha, Laporan, dll)
│   │   └── styles/             # Stylesheet Tailwind CSS v4 dan token tema
│   └── views/
│       └── app.blade.php       # Template induk container React SPA
├── storage/                    # Penyimpanan berkas lokal, cache framework, dan log
├── tests/
│   ├── Feature/                # 15 suite pengujian integrasi fitur Laravel
│   ├── Unit/                   # 3 suite pengujian unit backend
│   └── js/                     # 11 berkas pengujian logika frontend (Node.js test runner)
├── .env.example                # Template konfigurasi variabel lingkungan yang aman
├── .gitignore                  # Aturan isolasi data mentah, backup, dan berkas temporer
├── composer.json               # Konfigurasi dependensi dan autoloading PHP
├── package.json                # Konfigurasi dependensi dan script npm
├── phpunit.xml                 # Konfigurasi lingkungan pengujian otomatis PHPUnit
├── README.md                   # Dokumentasi utama proyek
└── vite.config.ts              # Konfigurasi bundler Vite dan plugin React
```

---

## F. Panduan Instalasi Cepat (Quick Installation)

> [!NOTE]
> Panduan instalasi langkah-demi-langkah yang mendalam dari nol untuk developer baru tersedia di [docs/INSTALLATION.md](file:///c:/laragon/www/Map_Perizinan/docs/INSTALLATION.md).

### Langkah 1: Kloning Repository
```bash
git clone https://github.com/Raapllii/Map_Perizinan.git
cd Map_Perizinan
```

### Langkah 2: Salin File Konfigurasi
```bash
cp .env.example .env
```

### Langkah 3: Install Dependensi PHP & JavaScript
```bash
composer install --optimize-autoloader
npm install
```

### Langkah 4: Generate Application Key & Storage Link
```bash
php artisan key:generate
php artisan storage:link
```

### Langkah 5: Setup Database PostgreSQL & PostGIS
Buat basis data di PostgreSQL, lalu aktifkan ekstensi PostGIS:
```sql
CREATE DATABASE map_perizinan;
\c map_perizinan
CREATE EXTENSION IF NOT EXISTS postgis;
```
Sesuaikan parameter koneksi di `.env`, lalu jalankan migrasi tabel dan seeding administrator:
```bash
php artisan migrate --seed
```

### Langkah 6: Kompilasi Asset & Jalankan Aplikasi
```bash
# Build asset produksi:
npm run build

# Jalankan server aplikasi:
php artisan serve
```
Buka browser dan akses aplikasi melalui `http://localhost:8000`.

---

## G. Konfigurasi Variabel Lingkungan (`.env`)

Konfigurasi disiapkan melalui file `.env`. Jangan pernah melakukan commit file `.env` ke Git repository.

```env
APP_NAME="Map Perizinan DPMPTSP"
APP_ENV=local
APP_KEY=base64:GeneratedKeyDiSini...
APP_DEBUG=true
APP_URL=http://localhost:8000

# Basis Data PostgreSQL dengan Ekstensi PostGIS
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=map_perizinan
DB_USERNAME=postgres
DB_PASSWORD=password_postgres_anda

# Driver Session, Cache, & Queue
BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DRIVER=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

# Google reCAPTCHA v2 Checkbox ("Saya bukan robot")
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_ALLOWED_HOSTNAMES=localhost,127.0.0.1,testkey.google.com
RECAPTCHA_VERIFY_URL=https://www.google.com/recaptcha/api/siteverify
RECAPTCHA_TIMEOUT=10

# Integrasi API Verifikasi NIK Dukcapil
# DUKCAPIL_ENABLED=false (default aman sebelum memiliki PKS resmi)
DUKCAPIL_ENABLED=false
DUKCAPIL_SIMULATION_ENABLED=false
DUKCAPIL_ENDPOINT=
DUKCAPIL_API_KEY=
DUKCAPIL_USER_ID=
DUKCAPIL_TIMEOUT=10
DUKCAPIL_AUTH_SCHEME=bearer
DUKCAPIL_AUTH_HEADER=Authorization
```

---

## H. Setup Database PostgreSQL & PostGIS

Aplikasi membutuhkan PostgreSQL dengan ekstensi **PostGIS** aktif karena menggunakan tipe data `geometry(Point, 4326)`, spatial index GiST, dan fungsi `ST_MakeEnvelope` untuk query bounding box peta.

1. **Pembuatan Basis Data via `psql`:**
   ```bash
   psql -U postgres -h 127.0.0.1
   ```
   ```sql
   CREATE DATABASE map_perizinan;
   \c map_perizinan
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
2. **Verifikasi Instalasi PostGIS:**
   ```sql
   SELECT PostGIS_Full_Version();
   ```
   *Pastikan query mengembalikan versi PostGIS (misal: POSTGIS="3.x.x").*
3. **Menjalankan Migrasi & Seeder:**
   ```bash
   php artisan migrate --seed
   ```
   > [!WARNING]
   > Jangan menjalankan `php artisan migrate:fresh` atau `db:wipe` pada server produksi atau basis data yang telah berisi data operasional riil.

---

## I. Menjalankan Aplikasi (Running the Application)

### Mode Pengembangan (Development)
Jalankan dua terminal terpisah:

**Terminal 1 (Backend API & Server):**
```bash
php artisan serve --port=8000
```

**Terminal 2 (Frontend Hot-Reload / Vite):**
```bash
npm run dev
```

### Mode Produksi (Production)
Pada lingkungan server produksi:
```bash
# 1. Kompilasi asset statis
npm run build

# 2. Optimasi cache framework Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 3. Jalankan melalui Web Server (Nginx / Apache + PHP-FPM)
```

---

## J. Prosedur Pengujian (Testing)

Aplikasi memiliki pengujian menyeluruh (100% lulus pada audit akhir):

```bash
# 1. Menjalankan Pengujian Unit & Logika Frontend (60 test)
node --test tests/js/*.mjs

# 2. Menjalankan Seluruh Pengujian Backend PHPUnit (124 test)
php artisan test

# 3. Menjalankan Pengujian Spesifik Modul Tertentu
php artisan test --filter=NikVerificationTest
php artisan test --filter=BusinessDownloadFlowTest
php artisan test --filter=ServiceSurveyExportTest

# 4. Memverifikasi Keberhasilan Build Frontend Produksi
npm run build

# 5. Memvalidasi Integritas File Composer
composer validate --no-check-publish
```

---

## K. Troubleshooting Masalah Umum

1. **Error: `Undefined function ST_MakeEnvelope()` atau `type geometry does not exist`**
   - **Penyebab:** Ekstensi PostGIS belum aktif pada database target.
   - **Solusi:** Jalankan `CREATE EXTENSION IF NOT EXISTS postgis;` pada database `map_perizinan`.
2. **Error: `Permission denied (0x0000271D/10013)` saat koneksi database**
   - **Penyebab:** Port PostgreSQL 5432 terhalang oleh firewall lokal, atau service PostgreSQL belum berjalan.
   - **Solusi:** Pastikan service PostgreSQL aktif di task manager/Laragon dan dengarkan port 5432.
3. **Error: `File npm.ps1 cannot be loaded because running scripts is disabled`**
   - **Penyebab:** Kebijakan eksekusi PowerShell di Windows membatasi script `.ps1`.
   - **Solusi:** Gunakan perintah `npm.cmd` (contoh: `npm.cmd run build`) atau jalankan `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.
4. **Error: `The process cannot access the file because it is being used by another process`**
   - **Penyebab:** File sedang dikunci oleh text editor, file watcher, atau background process.
   - **Solusi:** Tutup software pengunci atau restart service web server.

---

## L. Catatan Keamanan (Security Notes)

- **Sanitasi Kredensial:** Repositori ini telah dibersihkan dari seluruh file log, database dump, dan file upload lokal. Kredensial rahasia hanya boleh disimpan di file `.env` lokal server.
- **Proteksi Akun Administrator:** Kata sandi bawaan seeder wajib segera diganti setelah instalasi awal melalui menu Manajemen Pengguna atau profil pengguna.
- **Isolasi Path Traversal:** Fitur backup dan restore basis data pada [DatabaseController.php](file:///c:/laragon/www/Map_Perizinan/app/Http/Controllers/Api/DatabaseController.php) menggunakan validasi nama file berbasis regex ketat (`^[a-zA-Z0-9_\-\.]+$`) dan `basename()` untuk memblokir eksploitasi traversal direktori.
- **Perlindungan NIK Publik:** Sistem tidak pernah menyimpan NIK atau biodata sensitif pengunjung pada `sessionStorage` peramban publik. NIK dienkripsi dalam verification token di sisi server.

---

## M. Pemeliharaan Sistem (Maintenance)

- **Mode Perawatan (Maintenance Mode):**
  ```bash
  php artisan down --secret="akses-khusus-admin"
  php artisan up
  ```
- **Membersihkan dan Memperbarui Cache:**
  ```bash
  php artisan optimize:clear
  ```
- **Pembersihan Data Temporer Import & Export:**
  Secara berkala, periksa dan bersihkan subfolder `storage/app/imports/` dan `storage/framework/cache/laravel-excel/` untuk menjaga ruang penyimpanan server.

---

## N. Batasan Sistem yang Diketahui (Known Limitations)

1. **Integrasi Resmi API Dukcapil Kemendagri:**
   - Fitur saat ini beroperasi dalam mode `DUKCAPIL_ENABLED=false` (mode aman) atau simulasi internal karena DPMPTSP masih dalam tahap administrasi pengajuan hak akses resmi (PKS) ke Ditjen Dukcapil.
   - Setelah PKS resmi terbit, pengelola cukup mengisi `DUKCAPIL_ENDPOINT`, `DUKCAPIL_API_KEY`, dan `DUKCAPIL_USER_ID` di file `.env` produksi tanpa perlu mengubah kode sumber aplikasi.
2. **Kunci Google reCAPTCHA Lokal:**
   - Secara bawaan, konfigurasi pengujian menyertakan referensi key pengujian resmi Google yang hanya dapat digunakan pada domain `localhost`, `127.0.0.1`, dan `testkey.google.com`.
   - Untuk deployment domain instansi (misal: `perizinan.pemkab.go.id`), administrator wajib mendaftarkan domain resmi pada konsol Google reCAPTCHA.

---
*Dokumentasi Resmi Sistem WebGIS Map Perizinan — Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP).*
