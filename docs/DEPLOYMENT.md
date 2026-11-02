# Panduan Deployment Server Produksi — WebGIS Map Perizinan DPMPTSP

> [!NOTE]
> **Status Panduan:** Dokumen ini merupakan panduan arsitektur dan langkah-langkah implementasi standar untuk deployment server produksi. Prosedur ini dirancang berdasarkan konfigurasi kode sumber aktual proyek Map Perizinan dan belum diuji coba pada server hosting produksi tertentu. Uji coba menyeluruh di lingkungan staging sangat dianjurkan sebelum perilisan resmi.

---

## 1. Arsitektur Server Produksi

Aplikasi WebGIS Map Perizinan dirancang untuk beroperasi pada arsitektur server Linux (misalnya Ubuntu Server 22.04 LTS / 24.04 LTS atau Rocky Linux 9):

```
                       [ Pengunjung Publik / Administrator ]
                                         │
                                         ▼ (HTTPS Port 443)
                         ┌──────────────────────────────┐
                         │   Reverse Proxy / Nginx      │
                         │   (SSL Termination & Static) │
                         └──────────────┬───────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        ┌───────────────────────┐               ┌───────────────────────┐
        │ Asset Statis Terbina  │               │   PHP-FPM 8.2 / 8.3   │
        │ (/public/build)       │               │   (Laravel Backend)   │
        └───────────────────────┘               └───────────┬───────────┘
                                                            │
                                                            ▼
                                                ┌───────────────────────┐
                                                │ PostgreSQL 14+        │
                                                │ + PostGIS 3.x         │
                                                └───────────────────────┘
```

---

## 2. Prasyarat Perangkat Keras & Perangkat Lunak Server

### A. Spesifikasi Minimal Server (Hardware Recommendations)
- **CPU:** 2 vCPU atau lebih
- **RAM:** 4 GB RAM (minimal 2 GB dengan Swap 2 GB aktif)
- **Penyimpanan:** 40 GB SSD (NVMe disarankan untuk performa query spasial PostGIS dan proses impor berkas besar)
- **OS:** Ubuntu 22.04 LTS / 24.04 LTS x86_64

### B. Paket Perangkat Lunak Server yang Wajib Terpasang
- **Nginx Web Server**
- **PHP 8.2 atau 8.3** beserta paket ekstensi:
  ```bash
  sudo apt install -y php8.3-fpm php8.3-cli php8.3-pgsql php8.3-mbstring \
      php8.3-xml php8.3-curl php8.3-gd php8.3-zip php8.3-intl php8.3-bcmath
  ```
- **PostgreSQL 14 / 16** dan modul spasial **PostGIS**:
  ```bash
  sudo apt install -y postgresql postgresql-contrib postgis postgresql-16-postgis-3
  ```
- **Composer 2.x**
- **Certbot** (untuk penyediaan sertifikat SSL Let's Encrypt gratis)

---

## 3. Langkah-Langkah Deployment

### Langkah 1: Kloning Source Code ke Direktori Web Server
```bash
sudo mkdir -p /var/www/map-perizinan
sudo chown -R $USER:$USER /var/www/map-perizinan
cd /var/www/map-perizinan
git clone https://github.com/Raapllii/Map_Perizinan.git .
```

### Langkah 2: Konfigurasi Basis Data PostgreSQL & PostGIS Produksi
Masuk ke user postgres di server:
```bash
sudo -u postgres psql
```
Jalankan perintah SQL:
```sql
CREATE DATABASE map_perizinan_prod;
CREATE USER dpmptsp_user WITH ENCRYPTED PASSWORD 'GunakanPasswordSangatKuatDiSini';
GRANT ALL PRIVILEGES ON DATABASE map_perizinan_prod TO dpmptsp_user;

\c map_perizinan_prod
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT ALL ON SCHEMA public TO dpmptsp_user;
\q
```

### Langkah 3: Konfigurasi Variabel Lingkungan (`.env`)
Salin berkas template dan atur parameter produksi:
```bash
cp .env.example .env
nano .env
```

**Pengaturan Kunci di File `.env` Produksi:**
```env
APP_NAME="Map Perizinan DPMPTSP"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://perizinan.pemkab.go.id

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=map_perizinan_prod
DB_USERNAME=dpmptsp_user
DB_PASSWORD=GunakanPasswordSangatKuatDiSini

# Driver Produksi
BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DRIVER=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true

# Google reCAPTCHA v2 Kredensial Produksi (Daftarkan domain instansi)
RECAPTCHA_SITE_KEY=SiteKeyResmiInstansi
RECAPTCHA_SECRET_KEY=SecretKeyResmiInstansi
VITE_RECAPTCHA_SITE_KEY=SiteKeyResmiInstansi
RECAPTCHA_ALLOWED_HOSTNAMES=perizinan.pemkab.go.id

# Integrasi Dukcapil (Diaktifkan jika sudah ada PKS resmi)
DUKCAPIL_ENABLED=false
DUKCAPIL_SIMULATION_ENABLED=false
```

### Langkah 4: Install Dependensi & Build Asset
```bash
# 1. Install dependensi PHP tanpa paket development
composer install --no-dev --optimize-autoloader

# 2. Generate Application Key jika belum ada
php artisan key:generate --force

# 3. Hubungkan direktori storage publik
php artisan storage:link

# 4. Install Node dependencies & build asset frontend
npm ci
npm run build
```

### Langkah 5: Eksekusi Migrasi & Seeding Awal
```bash
php artisan migrate --seed --force
```

### Langkah 6: Optimasi Cache Framework
Jalankan kompilasi cache konfigurasi dan routing Laravel:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Langkah 7: Pengaturan Hak Akses File (Permissions)
```bash
sudo chown -R www-data:www-data /var/www/map-perizinan/storage /var/www/map-perizinan/bootstrap/cache
sudo chmod -R 775 /var/www/map-perizinan/storage /var/www/map-perizinan/bootstrap/cache
```

---

## 4. Konfigurasi Nginx Web Server

Buat berkas konfigurasi Nginx baru:
```bash
sudo nano /etc/nginx/sites-available/map-perizinan.conf
```

Tambahkan konfigurasi berikut:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name perizinan.pemkab.go.id;

    # Redirect seluruh HTTP ke HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name perizinan.pemkab.go.id;

    root /var/www/map-perizinan/public;
    index index.php index.html;

    # SSL Certificates (Dikonfigurasi via Certbot)
    ssl_certificate /etc/letsencrypt/live/perizinan.pemkab.go.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/perizinan.pemkab.go.id/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Batas ukuran upload berkas Excel/CSV OSS (Maksimal 50 MB)
    client_max_body_size 50M;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    # Caching untuk asset statis terkompilasi Vite
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }

    # Penanganan Script PHP melalui PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_read_timeout 300;
    }

    # Blokir akses ke berkas sensitif atau hidden file (.env, .git)
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Aktifkan konfigurasi dan restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/map-perizinan.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Prosedur Update Kode di Server Produksi (Deployment Update Routine)

Ketika ada update kode baru dari Git:

```bash
cd /var/www/map-perizinan

# 1. Aktifkan mode maintenance
php artisan down --message="Sedang dilakukan pembaruan sistem berkala."

# 2. Ambil perubahan kode terbaru
git pull origin main

# 3. Perbarui dependensi jika ada perubahan
composer install --no-dev --optimize-autoloader
npm ci
npm run build

# 4. Jalankan migrasi basis data (jika ada file migrasi baru)
php artisan migrate --force

# 5. Segarkan cache Laravel
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. Pastikan izin direktori tetap aman
sudo chown -R www-data:www-data storage bootstrap/cache

# 7. Nonaktifkan mode maintenance
php artisan up
```

---

## 6. Prosedur Pencadangan (Backup) Otomatis di Server

Gunakan utilitas `cron` Linux untuk melakukan backup harian database PostgreSQL:

```bash
sudo crontab -e
```
Tambahkan perintah backup otomatis setiap hari pukul 02:00 dini hari:
```cron
0 2 * * * PGPASSWORD='GunakanPasswordSangatKuatDiSini' pg_dump -U dpmptsp_user -h 127.0.0.1 -F c -b -v -f /var/backups/map_perizinan_$(date +\%Y\%m\%d_\%H\%M\%S).dump map_perizinan_prod
```
Rotasi backup lama (menghapus backup yang berusia lebih dari 30 hari):
```cron
30 2 * * * find /var/backups/ -type f -name "map_perizinan_*.dump" -mtime +30 -exec rm {} \;
```

---
*Panduan Deployment Produksi WebGIS Map Perizinan DPMPTSP.*
