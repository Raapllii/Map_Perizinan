# Panduan Pengembangan (Developer Guide) — WebGIS Map Perizinan DPMPTSP

Panduan ini ditujukan bagi Software Engineer dan Contributor yang akan melakukan pemeliharaan, penambahan fitur, atau refaktorisasi pada proyek **Map Perizinan DPMPTSP**.

---

## 1. Alur Kerja Pengembangan (Development Workflow)

Proyek ini mengadopsi standar alur kerja berbasis fitur (*Feature-Branch Workflow*):

```
main (Produksi Stabil)
  └── dev (Integrasi / Staging)
       ├── feat/nama-fitur-baru
       ├── fix/perbaikan-bug
       └── chore/tugas-pemeliharaan
```

1. **Selalu Tarik Perubahan Terbaru:**
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Buat Branch Baru untuk Setiap Tugas:**
   Gunakan format penamaan yang deskriptif:
   - Fitur baru: `feat/nama-fitur` (contoh: `feat/rekapitulasi-survei-chart`)
   - Perbaikan bug: `fix/nama-bug` (contoh: `fix/coordinate-boundary-validation`)
   - Refaktor / Pembersihan: `chore/nama-tugas` (contoh: `chore/cleanup-old-imports`)
   ```bash
   git checkout -b feat/tambah-filter-sektor
   ```
3. **Jalankan Automated Tests Sebelum dan Sesudah Perubahan:**
   Pastikan tidak ada regresi pada fitur yang sudah berjalan:
   ```bash
   node --test tests/js/*.mjs
   php artisan test
   ```

---

## 2. Konvensi Direktori & Arsitektur Kode

### A. Struktur Frontend (React 18 + TypeScript + Tailwind)
- **`resources/js/pages/`**: Komponen halaman tingkat rute (contoh: `DashboardPage.tsx`, `PublicMapPage.tsx`, `DataUsahaPage.tsx`). Halaman harus mengatur judul tab peramban via hook `useDocumentTitle`.
- **`resources/js/components/`**: Komponen UI fungsional dan modular (contoh: `CityMapLeaflet.tsx`, `DashboardBarChart.tsx`, `PublicAccessModal.tsx`).
- **`resources/js/components/ui/`**: Komponen atomik antarmuka (Button, Badge, Card, Dialog, Table, Input). Hindari menduplikasi komponen di subdirektori lain.
- **`resources/js/hooks/`**: Custom React Hooks untuk logika stateful yang dapat digunakan ulang (contoh: `useDebounce`, `useDocumentTitle`, `useBusinessSearch`).
- **`resources/js/lib/`**: Fungsi utilitas murni tanpa efek samping React (contoh: `riskUtils.ts`, `visitorSession.ts`, `exportExcel.ts`).
- **`resources/js/types/`**: Definisi tipe TypeScript global untuk model domain (`Business`, `User`, `SurveyResponse`).

### B. Struktur Backend (Laravel 8 / PHP 8.3)
- **`app/Http/Controllers/Api/`**: REST API Controllers. Bertanggung jawab memvalidasi input HTTP dan mengembalikan JSON Response terstruktur.
- **`app/Services/`**: Lapisan business logic murni (contoh: kalkulasi KPI di `DashboardService`, komunikasi gateway di `DukcapilService`, validasi captcha di `RecaptchaService`).
- **`app/Repositories/`**: Lapisan isolasi query basis data, khususnya query spasial PostGIS (`BusinessRepository`).
- **`app/Exports/` & `app/Imports/`**: Engine berkas Excel menggunakan `Maatwebsite\Excel`.
- **`app/Http/Middleware/`**: Kontrol akses otorisasi, status akun aktif, dan proteksi sesi.

---

## 3. Panduan Menambahkan Halaman Baru di React

1. **Buat Berkas Halaman:**
   Buat berkas komponen di `resources/js/pages/NamaHalamanPage.tsx`:
   ```tsx
   import React from 'react';
   import { useDocumentTitle } from '../hooks/useDocumentTitle';

   export default function NamaHalamanPage() {
     useDocumentTitle('Nama Halaman');

     return (
       <div className="p-6 space-y-6">
         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nama Halaman</h1>
         {/* Konten antarmuka */}
       </div>
     );
   }
   ```
2. **Daftarkan Rute pada React Router:**
   Buka `resources/js/components/layout/AdminLayout.tsx` (untuk rute admin) atau `resources/js/app/App.tsx` (untuk rute publik):
   ```tsx
   <Route path="nama-fitur" element={<NamaHalamanPage />} />
   ```
3. **Tambahkan Menu Navigasi:**
   Buka `resources/js/components/layout/Sidebar.tsx` dan tambahkan entri item navigasi dengan ikon Lucide yang relevan.

---

## 4. Panduan Menambahkan Endpoint API di Laravel

1. **Buat Form Request (Validasi Input):**
   ```bash
   php artisan make:request StoreNamaRequest
   ```
   Definisikan aturan validasi yang ketat di method `rules()`.
2. **Buat Method di Controller:**
   Buka controller yang relevan di `app/Http/Controllers/Api/`:
   ```php
   public function store(StoreNamaRequest $request)
   {
       $validated = $request->validated();
       $data = $this->namaService->create($validated);

       return response()->json([
           'status' => 'success',
           'message' => 'Data berhasil disimpan.',
           'data' => $data
       ], 201);
   }
   ```
3. **Daftarkan Route:**
   - Jika route publik: Daftarkan di [routes/api.php](file:///c:/laragon/www/Map_Perizinan/routes/api.php).
   - Jika route admin terlindungi RBAC: Daftarkan di [routes/web.php](file:///c:/laragon/www/Map_Perizinan/routes/web.php) di dalam grup middleware `['auth', 'active']` dan `role:...`.

---

## 5. Panduan Migrasi Basis Data dengan Aman

PostgreSQL pada proyek ini memiliki trigger spasial dan spatial index. Saat membuat migrasi baru:

1. **Buat Berkas Migrasi:**
   ```bash
   php artisan make:migration nama_tabel_atau_kolom_baru
   ```
2. **Kaidah Penulisan Migrasi:**
   - Selalu sertakan method `down()` yang dapat mengembalikan skema ke kondisi semula (*reversible migration*).
   - Untuk kolom teks yang sering dicari, pertahankan pencarian case-insensitive menggunakan indeks PostgreSQL.
   - Jangan menghapus kolom spasial `location` pada tabel `businesses` karena terhubung langsung dengan trigger `trg_businesses_location`.
3. **Uji Coba Migrasi:**
   ```bash
   php artisan migrate
   php artisan migrate:rollback --step=1
   php artisan migrate
   ```

---

## 6. Panduan Menambahkan Fitur Ekspor & Impor Excel

Aplikasi menggunakan pustaka `maatwebsite/excel`.

### Menambahkan Ekspor Excel Multi-Sheet:
1. Buat class utama di `app/Exports/` yang mengimplementasikan `WithMultipleSheets`.
2. Buat sub-sheet di `app/Exports/Sheets/` yang mengimplementasikan `FromCollection` / `FromQuery`, `WithTitle`, `WithHeadings`, `WithStyles`, dan `ShouldAutoSize`.
3. Gunakan styling resmi DPMPTSP: Header berwarna navy `#1E3A8A` atau `#1E40AF` dengan font tebal dan teks putih.

### Menambahkan Validasi Impor Data:
Gunakan `app/Imports/BusinessesImport.php` sebagai referensi. Pastikan kolom yang memuat data sensitif NIK / pemilik diverifikasi, dan validasi koordinat latitude (-90 s/d 90) serta longitude (-180 s/d 180) diterapkan sebelum data disimpan ke database.

---

## 7. Menjalankan Rangkaian Pengujian (Automated Testing)

Setiap kontribusi wajib mempertahankan persentase kelulusan pengujian **100%**:

```bash
# 1. Menjalankan Unit Test Frontend
node --test tests/js/*.mjs

# 2. Menjalankan PHPUnit Backend (membutuhkan koneksi PostgreSQL lokal)
php artisan test

# 3. Menjalankan Analisis Validitas Composer
composer validate --no-check-publish

# 4. Verifikasi Kompilasi Frontend
npm run build
```

Jika menambahkan fitur baru, buat berkas pengujian pendamping di:
- `tests/Feature/NamaFiturTest.php` untuk integrasi backend API.
- `tests/js/namaFitur.test.mjs` untuk logika komputasi frontend.

---

## 8. Standar Commit Git (Conventional Commits)

Format pesan commit yang wajib digunakan:
```
<tipe>(<lingkup>): <deskripsi singkat dalam bahasa indonesia atau inggris>
```

**Tipe Commit:**
- `feat`: Penambahan fitur baru (contoh: `feat(survey): add excel export for service survey`)
- `fix`: Perbaikan bug atau celah keamanan (contoh: `fix(security): sanitize backup filenames against path traversal`)
- `docs`: Perubahan atau penambahan dokumentasi (contoh: `docs(readme): update system requirements and architecture`)
- `chore`: Tugas pemeliharaan, dependensi, atau pembersihan file (contoh: `chore: cleanup obsolete components`)
- `test`: Penambahan atau penyesuaian automated test suite (contoh: `test(nik): add rate limit verification test`)
- `build`: Perubahan sistem kompilasi, build frontend, atau dependensi paket.

---

## 9. Penanganan Branch, Pull Request, & Konflik Git

### A. Membuat Pull Request (PR)
1. Push branch kerja ke remote repository:
   ```bash
   git push origin feat/nama-fitur
   ```
2. Buka GitHub repository `Raapllii/Map_Perizinan` dan klik **New Pull Request**.
3. Berikan deskripsi ringkas yang memuat:
   - Fitur atau bug yang diselesaikan.
   - Perubahan file penting.
   - Bukti hasil pengujian (`php artisan test` dan `npm run build` lulus).

### B. Menangani Konflik Git (Merge Conflict)
Jika branch Anda tertinggal dari `main`:
1. Ambil commit terbaru dari `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout feat/nama-fitur
   git merge main
   ```
2. Buka file yang berkonflik, perbaiki bagian yang bertabrakan secara manual.
3. Jalankan pengujian ulang untuk memastikan kode berfungsi:
   ```bash
   npm run build
   php artisan test
   ```
4. Commit penyelesaian konflik:
   ```bash
   git add -A
   git commit -m "chore: resolve merge conflicts with main"
   git push origin feat/nama-fitur
   ```

---
*Panduan Pengembang Map Perizinan DPMPTSP.*
