# Panduan Lengkap Instalasi WebGIS Map Perizinan DPMPTSP dari Nol
**Target Pembaca:** Developer / DevOps Engineer / System Administrator yang baru pertama kali menyiapkan lingkungan proyek.

Dokumen ini memandu proses instalasi dan konfigurasi proyek **Map Perizinan DPMPTSP** dari komputer kosong hingga aplikasi dapat dijalankan penuh di lingkungan lokal maupun server staging.

---

## Tahap 1 — Persiapan Software & Prasyarat Sistem

Sebelum memulai, pastikan perangkat kerja atau server Anda telah terpasang perangkat lunak berikut:

### 1. Lingkungan Pengembangan Windows (Laragon atau Standalone)
Jika Anda menggunakan **Laragon** di Windows:
- Unduh dan instal Laragon (disarankan Laragon Full).
- Laragon secara bawaan menyediakan web server Apache/Nginx, PHP, dan Composer.
- **PENTING:** Map Perizinan menggunakan database **PostgreSQL + PostGIS**, bukan MySQL bawaan Laragon. Pastikan PostgreSQL terpasang (bisa ditambahkan ke Laragon via menu *Menu > PostgreSQL* atau diinstal sebagai service standalone resmi PostgreSQL untuk Windows).

### 2. Spesifikasi Versi Software Teruji:
1. **PHP:** Versi `>= 8.1` (Diuji pada **PHP 8.3.33**).
   - Ekstensi PHP yang wajib diaktifkan pada berkas `php.ini`:
     ```ini
     extension=pdo_pgsql
     extension=pgsql
     extension=mbstring
     extension=fileinfo
     extension=gd
     extension=zip
     extension=xml
     extension=curl
     extension=intl
     extension=bcmath
     extension=openssl
     ```
   - Verifikasi melalui terminal:
     ```bash
     php -v
     php -m | findstr -i "pgsql"
     ```
2. **Composer:** Versi `>= 2.2` (Diuji pada **Composer 2.8.3**).
   - Verifikasi: `composer --version`
3. **Node.js & NPM:** Node.js `>= 18.0` dan NPM `>= 9.0` (Diuji pada **Node.js v24.18.0 & NPM 11.16.0**).
   - Verifikasi: `node -v` dan `npm -v`
4. **PostgreSQL & PostGIS:**
   - PostgreSQL versi `>= 13.0` (Diuji pada **PostgreSQL 16.6**).
   - Ekstensi **PostGIS** versi `>= 3.0` (Diuji pada **PostGIS 3.6.2**).
   - Tambahkan direktori binary PostgreSQL (misal: `C:\Program Files\PostgreSQL\16\bin`) ke dalam Environment Variables `PATH` sistem agar perintah `psql` dan `pg_dump` dapat dieksekusi dari terminal.
5. **Git Client:** Untuk kloning dan manajemen versi.

---

## Tahap 2 — Kloning Repository

Buka terminal (PowerShell, Command Prompt, atau Git Bash), masuk ke folder direktori root server Anda (misal: `C:\laragon\www`), lalu jalankan:

```bash
cd C:\laragon\www
git clone https://github.com/Raapllii/Map_Perizinan.git
cd Map_Perizinan
```

Pastikan Anda berada di branch utama (`main`):
```bash
git status
# Output harus menunjukkan: On branch main
```

---

## Tahap 3 — Instalasi Dependensi Backend (Laravel)

### 1. Salin File Konfigurasi Lingkungan
```bash
cp .env.example .env
```
*(Pada Windows PowerShell tanpa alias `cp`: `Copy-Item .env.example .env`)*

### 2. Install Dependensi PHP via Composer
Jalankan perintah instalasi Composer dengan optimasi autoloader:
```bash
composer install --optimize-autoloader
```
> [!NOTE]
> Jangan menjalankan `composer update` saat pertama kali setup untuk memastikan pustaka yang terpasang identik dengan `composer.lock`.

### 3. Generate Kunci Enkripsi Aplikasi (Application Key)
```bash
php artisan key:generate
```
Perintah ini akan mengisi variabel `APP_KEY` pada file `.env`.

### 4. Buat Simlink Direktori Storage
```bash
php artisan storage:link
```
Perintah ini menghubungkan direktori `storage/app/public` ke folder publik `public/storage` untuk kebutuhan akses berkas unduhan dan avatar.

### 5. Pengaturan Hak Akses Direktori (Khusus Linux Server)
Jika melakukan instalasi pada server Linux (Ubuntu/Debian):
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

---

## Tahap 4 — Setup Basis Data PostgreSQL & PostGIS

### 1. Masuk ke Shell PostgreSQL (`psql`)
Buka terminal dan login sebagai pengguna superuser PostgreSQL (default: `postgres`):
```bash
psql -U postgres -h 127.0.0.1
```
*(Masukkan password akun `postgres` Anda saat diminta).*

### 2. Buat Database Baru
Jalankan perintah SQL berikut:
```sql
CREATE DATABASE map_perizinan;
```

### 3. Hubungkan ke Database & Aktifkan Ekstensi PostGIS
Pindah ke database `map_perizinan` dan pasang ekstensi spasial PostGIS:
```sql
\c map_perizinan
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 4. Verifikasi Keberhasilan PostGIS
Jalankan query verifikasi:
```sql
SELECT PostGIS_Full_Version();
```
Contoh respons sukses:
```
POSTGIS="3.6.2 3.6.2" [EXTENSION] PGSQL="160" GEOS="3.14.1dev" PROJ="8.2.1" ...
```
Ketik `\q` untuk keluar dari psql.

### 5. Sesuaikan Konfigurasi `.env`
Buka berkas `.env` menggunakan teks editor dan sesuaikan kredensial koneksi:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=map_perizinan
DB_USERNAME=postgres
DB_PASSWORD=password_postgres_anda
```

### 6. Jalankan Migrasi dan Seeder Awal
Jalankan migrasi skema tabel dan pembuatan akun bawaan:
```bash
php artisan migrate --seed
```
> [!IMPORTANT]
> Jangan menjalankan `php artisan migrate:fresh` pada basis data yang sudah memiliki data operasional. Gunakan migrasi reguler `php artisan migrate`.

---

## Tahap 5 — Instalasi Dependensi Frontend & Kompilasi Asset

### 1. Install Paket Node.js
```bash
npm install
```
*(Atau gunakan `npm.cmd install` pada PowerShell jika policy script Windows aktif).*

### 2. Kompilasi Asset Frontend
- **Untuk Lingkungan Pengembangan (Development Mode):**
  Tidak wajib build sekarang, cukup jalankan `npm run dev` pada Tahap 6.
- **Untuk Lingkungan Produksi / Staging (Production Build):**
  ```bash
  npm run build
  ```
  Asset terkompilasi akan disimpan di direktori `public/build/`.

---

## Tahap 6 — Menjalankan Aplikasi

Aplikasi WebGIS Map Perizinan menggunakan arsitektur Laravel sebagai penyaji REST API & Blade Container dan React SPA sebagai antarmuka pengguna.

### 1. Menjalankan Server Lokal (Development)

Buka dua jendela terminal terpisah:

**Terminal 1 — Backend Server Laravel:**
```bash
php artisan serve --port=8000
```
Server backend akan aktif di: `http://localhost:8000`.

**Terminal 2 — Frontend Hot-Module Replacement (Vite):**
```bash
npm run dev
```
Vite dev server akan aktif di: `http://localhost:5173` dan otomatis terhubung dengan Laravel via plugin `@vitejs/plugin-react`.

### 2. Membuka Aplikasi di Browser
Buka peramban (Chrome / Edge / Firefox) dan kunjungi:
- **Peta Publik:** `http://localhost:8000/`
- **Login Dashboard Administrator:** `http://localhost:8000/admin/login`

---

## Tahap 7 — Setup & Manajemen Akun Administrator

Sistem telah dilengkapi seeder bawaan (`AdminUserSeeder`) yang dieksekusi saat langkah `php artisan migrate --seed`.

### 1. Daftar Akun Bawaan (Default Seeded Users)
Seluruh akun bawaan diinisialisasi dengan kata sandi default: `password`.

| Peran (Role) | Alamat Email | Deskripsi & Hak Akses |
| :--- | :--- | :--- |
| **Super Admin** | `andi.k@pemkab.go.id` | Akses penuh seluruh sistem, backup & restore database, manajemen pengguna. |
| **Administrator** | `siti.r@pemkab.go.id` | Manajemen pengguna tingkat bawah, ekspor/impor data perizinan, verifikasi. |
| **Verifier** | `budi.h@pemkab.go.id` | Verifikasi status kelayakan izin usaha dan kelengkapan dokumen. |
| **Surveyor** | `fitri.d@pemkab.go.id` | Petugas lapangan untuk penambahan data usaha baru dan geotagging koordinat. |
| **Akun Uji Nonaktif** | `putri.a@pemkab.go.id` | Akun berstatus *Nonaktif* khusus untuk menguji pemblokiran akses login. |

### 2. Prosedur Keamanan Wajib Setelah Instalasi
> [!CAUTION]
> Segera ganti kata sandi akun default setelah instalasi selesai!

1. Login sebagai Super Admin (`andi.k@pemkab.go.id` / `password`).
2. Masuk ke menu **Profil Saya** atau **Manajemen Pengguna**.
3. Perbarui kata sandi menjadi kombinasi yang kuat dan unik.
4. Buat akun personal untuk masing-masing petugas sesuai peran tugasnya.
5. Nonaktifkan atau hapus akun uji coba yang tidak diperlukan.

---

## Tahap 8 — Checklist Verifikasi Keberhasilan Instalasi

Lakukan pengujian berikut untuk memastikan seluruh sistem berfungsi normal:

- [ ] **Akses Peta Publik:** Halaman `http://localhost:8000/` terbuka dan peta OpenStreetMap berhasil memuat ubin (*tiles*).
- [ ] **Verifikasi NIK:** Modal verifikasi identitas tampil dengan Google reCAPTCHA v2 Checkbox.
- [ ] **Koneksi PostGIS:** Query spasial berfungsi tanpa error `ST_MakeEnvelope` atau `geometry`.
- [ ] **Login Administrator:** Halaman `http://localhost:8000/admin/login` dapat diakses dan berhasil login ke Dashboard.
- [ ] **Dashboard KPI:** Statistik jumlah usaha dan ringkasan investasi tampil tanpa error JavaScript di console.
- [ ] **Unduh Dokumen:** Fitur download ringkasan izin usaha menghasilkan file PDF yang rapi.
- [ ] **Ekspor Excel:** Menu Rekapitulasi Survei dan Data Usaha dapat mengunduh file `.xlsx` 3-sheet.
- [ ] **Automated Tests:** Seluruh automated test suite lulus 100%:
  ```bash
  node --test tests/js/*.mjs
  php artisan test
  ```

Selamat! Aplikasi **Map Perizinan DPMPTSP** kini telah siap digunakan untuk tahap operasional maupun pengembangan lanjutan.
