# Rencana Implementasi: Fitur Akses Publik, Rekapitulasi Akses, & 10 Indikator Fleksibel Data Usaha

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan 3 fitur utama pada project WebGIS Map Perizinan: (1) Form Akses Publik (Nama & Instansi) sebelum masuk Peta PB, (2) Sistem pencatatan & Menu Admin Rekapitulasi Akses, dan (3) 10 indikator fleksibel generic pada Data Usaha (database, backend, Tambah, Edit, Detail).

**Architecture:** 
- **Visitor Access**: Menggunakan tabel `public_map_access_logs` yang terpisah dari tabel admin `activity_logs`. Menyediakan endpoint publik `POST /api/public-access` dan endpoint terproteksi admin `GET /api/admin/public-map-access-logs`. Di frontend, pengunjung diidentifikasi via gate/modal sebelum berinteraksi dengan peta, dan status disimpan di `sessionStorage` dengan opsi ganti identitas.
- **Admin Rekapitulasi**: Menu baru di sidebar admin (`/admin/rekapitulasi-akses`) dengan kartu ringkasan KPI, filter pencarian & instansi/tanggal, tabel riwayat akses (No, Nama, Instansi, Waktu Akses), dan paginasi.
- **10 Indikator Fleksibel**: Menambahkan kolom `indicator_1` s/d `indicator_10` tipe `text` nullable pada tabel `businesses`. Mengintegrasikan ke `StoreBusinessRequest`, `UpdateBusinessRequest`, `BusinessService`, serta antarmuka `DataUsahaFormModal` (Tambah & Edit) dan `DataUsahaDetailModal` (Detail) dengan placeholder `-` saat kosong.

**Tech Stack:** Laravel 8, PostgreSQL + PostGIS, React 18, TypeScript, Tailwind CSS, TanStack Table, Vite.

## Global Constraints
- Jangan mengganti framework atau arsitektur utama.
- Jangan merusak fitur existing (clustering, hover preview vs selected panel, 27 field OSS, routing, dsb).
- 10 indikator bukan menu terpisah, melainkan melekat pada Data Usaha (Tambah, Edit, Detail).
- Indikator tidak di-hardcode ke domain tertentu (harus generik: `indicator_1`..`indicator_10`).
- Visitor publik bukan user admin (tidak memerlukan password, username, email, atau role).
- Build/lint/test harus benar-benar dijalankan dan lolos tanpa error.

---

### Task 1: Database Migration & Model for Public Map Access Logs
**Files:**
- Create: `database/migrations/2026_09_15_000001_create_public_map_access_logs_table.php`
- Create: `app/Models/PublicMapAccessLog.php`

- [ ] **Step 1: Write migration for public_map_access_logs**
- [ ] **Step 2: Create PublicMapAccessLog model**
- [ ] **Step 3: Run migration via php artisan migrate**

---

### Task 2: Database Migration for 10 Flexible Indicators on Businesses
**Files:**
- Create: `database/migrations/2026_09_15_000002_add_indicators_to_businesses_table.php`
- Modify: `app/Models/Business.php`

- [ ] **Step 1: Write migration to add indicator_1 through indicator_10**
- [ ] **Step 2: Run migration via php artisan migrate**
- [ ] **Step 3: Update dummy seeder with sample data**

---

### Task 3: Backend API for Public Access Log & Rekapitulasi
**Files:**
- Create: `app/Http/Controllers/Api/PublicMapAccessLogController.php`
- Modify: `routes/api.php`
- Modify: `routes/web.php`
- Create: `tests/Feature/PublicMapAccessTest.php`

- [ ] **Step 1: Write failing test in PublicMapAccessTest.php**
- [ ] **Step 2: Implement PublicMapAccessLogController (store & index)**
- [ ] **Step 3: Register routes in api.php and web.php**
- [ ] **Step 4: Run tests with phpunit and verify all pass**

---

### Task 4: Backend Support for 10 Indicators on Business CRUD
**Files:**
- Modify: `app/Http/Requests/StoreBusinessRequest.php`
- Modify: `app/Http/Requests/UpdateBusinessRequest.php`
- Modify: `tests/Feature/BusinessCrudTest.php`

- [ ] **Step 1: Add indicator tests to BusinessCrudTest.php**
- [ ] **Step 2: Update StoreBusinessRequest and UpdateBusinessRequest validation rules**
- [ ] **Step 3: Run phpunit tests and verify pass**

---

### Task 5: Frontend TypeScript Types & Public Access Gate
**Files:**
- Modify: `resources/js/types/index.ts`
- Create: `resources/js/components/PublicAccessModal.tsx`
- Modify: `resources/js/pages/PublicMapPage.tsx`

- [ ] **Step 1: Update TypeScript definitions**
- [ ] **Step 2: Create PublicAccessModal component**
- [ ] **Step 3: Integrate gate check in PublicMapPage.tsx**

---

### Task 6: Admin Rekapitulasi Akses Page & Navigation
**Files:**
- Create: `resources/js/pages/RekapitulasiAksesPage.tsx`
- Modify: `resources/js/constants/index.ts`
- Modify: `resources/js/components/layout/AdminLayout.tsx`

- [ ] **Step 1: Add Rekapitulasi Akses to MENU_ITEMS & PAGE_TITLES**
- [ ] **Step 2: Implement RekapitulasiAksesPage with KPI cards, filters, and access table**
- [ ] **Step 3: Register page in AdminLayout switch-case**

---

### Task 7: 10 Indicators in DataUsahaFormModal & DataUsahaDetailModal
**Files:**
- Modify: `resources/js/components/DataUsahaFormModal.tsx`
- Modify: `resources/js/components/DataUsahaDetailModal.tsx`

- [ ] **Step 1: Update DataUsahaFormModal for Tambah & Edit modes**
- [ ] **Step 2: Update DataUsahaDetailModal to display all 10 indicators with '-' default**

---

### Task 8: Build Verification & Regression Check
- [ ] **Step 1: Run `cmd.exe /c "npm run build"` to verify full TypeScript & Vite compilation**
- [ ] **Step 2: Run all PHPUnit test suites**
- [ ] **Step 3: Review acceptance criteria**
