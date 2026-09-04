# Hapus Data & Import Data (CSV + Excel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Perbaiki fitur Hapus Data (single & bulk delete aman dan atomik) serta Import Data (dukungan CSV dan XLSX, pemisahan upload vs processing progress riil, normalisasi 27 kolom OSS, dan eksekusi asynchronous).

**Architecture:** 
- Bulk delete menggunakan endpoint backend dedicated `POST /api/admin/businesses/bulk-delete` dengan query `whereIn` dalam transaksi atomik.
- Import data beralih ke arsitektur asynchronous: HTTP request upload mengembalikan `import_id` segera setelah file disimpan, sedangkan parsing dan upsert database berjalan di background (didukung queue atau background artisan runner) dengan progress tersimpan di Cache.
- Frontend modal memisahkan status Upload (Axios `onUploadProgress`) dan Processing (polling 800ms) dengan perhitungan speed, ETA riil, dan cleanup interval yang aman tanpa memory leak.

**Tech Stack:** Laravel 8.x, PostgreSQL/PostGIS, Maatwebsite Excel 3.1, PhpSpreadsheet, React, TypeScript, TanStack Table, Axios, Tailwind CSS.

## Global Constraints
- JANGAN membuat project baru atau mengganti framework.
- JANGAN mengubah skema 27 kolom OSS pada database `businesses`.
- JANGAN mengubah atau merusak fitur lain pada `DataUsahaPage.tsx` (pencarian, filter kecamatan/kelurahan/status/risiko/tahun, sorting, pagination, column visibility, edit, detail, atau export).
- Format file import harus mendukung `.csv` dan `.xlsx` (maks 50MB).
- Progress bar harus mencerminkan data aktual, bukan animasi palsu (`animate-pulse w-[100%]`).

---

### Task 1: Backend Bulk Delete Endpoint & Service
**Files:**
- Modify: `routes/web.php:55-60`
- Modify: `app/Http/Controllers/Api/BusinessController.php:55-61`
- Modify: `app/Services/BusinessService.php:145-155`

**Interfaces:**
- Consumes: HTTP POST `/api/admin/businesses/bulk-delete` with `{ ids: number[] }`
- Produces: JSON response `{ status: 'success', message: string, count: number }`

- [ ] **Step 1: Tambahkan method `bulkDestroy` pada `BusinessService`**
```php
    public function bulkDestroy(array $ids)
    {
        $count = \App\Models\Business::whereIn('id', $ids)->delete();
        $this->clearCaches();
        return $count;
    }
```

- [ ] **Step 2: Tambahkan method `bulkDestroy` pada `BusinessController`**
```php
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
        ]);

        $count = $this->businessService->bulkDestroy($request->input('ids'));

        return response()->json([
            'status' => 'success',
            'message' => "{$count} data usaha berhasil dihapus",
            'count' => $count
        ]);
    }
```

- [ ] **Step 3: Daftarkan route pada `routes/web.php`**
```php
Route::post('/businesses/bulk-delete', [BusinessController::class, 'bulkDestroy']);
```

- [ ] **Step 4: Test endpoint dengan curl atau artisan test script**
Verifikasi bahwa `POST /api/admin/businesses/bulk-delete` memvalidasi `ids` dan menghapus data dengan benar.

---

### Task 2: Backend Background Import Command & Queue Support
**Files:**
- Create: `app/Console/Commands/ProcessBusinessImportCommand.php`
- Modify: `app/Imports/BusinessesImport.php`
- Modify: `app/Http/Controllers/Api/DatabaseController.php`

**Interfaces:**
- Consumes: CLI command `php artisan businesses:import {importId} {filePath} {userId}`
- Produces: Progress cache updates in `import_progress_{importId}` (`status: processing -> completed / failed`)

- [ ] **Step 1: Perbaiki `BusinessesImport.php`**
  - Tambahkan auto-detection delimiter untuk CSV (`;` atau `,`).
  - Sempurnakan normalisasi header & row mapping simetris untuk ke-27 field kanonikal OSS.
  - Sempurnakan parsing angka desimal Indonesia (`10.000.000` / `10.000.000,50`) dan format tanggal `d/m/Y`, `d-m-Y`, string ISO, serta Excel serial.
  - Perbarui cache `import_progress_{importId}` di setiap chunk (500 baris) dengan `processed_rows`, `percentage`, `rows_per_second`, `estimated_remaining_seconds`.
  - Bersihkan cache aplikasi (`dashboard_data`, `map_markers_all`) setelah import selesai.

- [ ] **Step 2: Buat Artisan Command `ProcessBusinessImportCommand`**
  - Menerima argumen: `importId`, `filePath`, `userId`.
  - Menjalankan `Excel::import(new BusinessesImport($importId), $filePath)`.
  - Menangani error secara graceful: jika gagal, set status cache `failed` dengan pesan error.
  - Menghapus file sementara di `storage/app/imports/` setelah selesai atau gagal.
  - Mencatat log aktivitas jika `userId` tersedia.

- [ ] **Step 3: Update `DatabaseController::import` & `importProgress`**
  - Update validasi file menerima `mimes:csv,txt,xlsx,xls|max:51200`.
  - Simpan file ke `storage/app/imports/import_{importId}.{ext}`.
  - Hitung total baris sebenarnya:
    - Jika CSV: baris fisik dikurangi 1.
    - Jika XLSX/XLS: `PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile($path)->listWorksheetInfo($path)` dikurangi 1.
  - Inisialisasi cache progress dengan `status: 'processing'`.
  - Jalankan proses background:
    - Jika non-sync queue: dispatch job.
    - Jika sync queue: pclose popen artisan command detached (`start /B` di Windows, `&` di Linux).
  - Return HTTP 200 segera: `{ status: 'success', message: '...', import_id: '...' }`.
  - Pastikan `importProgress($id)` mengembalikan data progress lengkap sesuai rumus.

- [ ] **Step 4: Test background execution dengan file CSV dan XLSX dummy**
Jalankan tes command dan verifikasi cache progress terupdate dari 0% ke 100%.

---

### Task 3: Frontend DataUsahaImportModal.tsx (Real Progress & Format Support)
**Files:**
- Modify: `resources/js/components/DataUsahaImportModal.tsx`

**Interfaces:**
- Consumes: File CSV/XLSX dari file input, backend API `/database/import` & `/database/import-progress/{id}`
- Produces: UI modal dengan upload progress bar riil, import processing bar riil dengan ETA, cleanup timer, toast/alert feedback

- [ ] **Step 1: Update input file & validasi format**
  - `accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"`
  - Validasi file: cek ekstensi `.csv`, `.xlsx`, `.xls` dan MIME types terkait.
  - Ubah teks judul dan instruksi menjadi "Import Data OSS (CSV / Excel)".

- [ ] **Step 2: Implementasi Phase 1 (Upload dengan `onUploadProgress`)**
  - Simpan state `uploadPercent: number`.
  - Di Axios POST config:
    ```ts
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadPercent(percent);
      }
    }
    ```
  - Tampilkan teks "Uploading..." dan persentase riil tanpa animasi statis palsu.

- [ ] **Step 3: Implementasi Phase 2 (Processing dengan Polling 800ms)**
  - Begitu Axios POST return response sukses (file terupload):
    - Transisi phase ke `"importing"`.
    - Mulai interval polling `GET /api/admin/database/import-progress/${importId}` setiap 800ms.
    - UI menampilkan persentase backend, baris terproses dari total baris, kecepatan data/detik, dan estimasi waktu sisa (atau "Memperkirakan waktu...").

- [ ] **Step 4: Implementasi Phase 3 (Completed) & Phase 4 (Failed)**
  - Saat `status === 'completed'`:
    - Hentikan interval polling (`clearInterval`).
    - Set phase `"completed"`. Tampilkan 100%, total baris, durasi pengerjaan.
    - Beri tombol "Selesai" / "Tutup" dan panggil `onSuccess()`.
  - Saat `status === 'failed'`:
    - Hentikan interval polling.
    - Set phase `"error"`. Tampilkan pesan error spesifik dari backend (`res.data.message`).

- [ ] **Step 5: Memory Leak & Timer Cleanup**
  - Bersihkan timer di `useEffect` cleanup.
  - Bersihkan timer di `handleClose`.
  - Bersihkan timer saat selesai/gagal.

---

### Task 4: Frontend DataUsahaPage.tsx (Integrasi Bulk Delete & Refresh Import)
**Files:**
- Modify: `resources/js/pages/DataUsahaPage.tsx`

**Interfaces:**
- Consumes: Backend `/api/admin/businesses/bulk-delete`
- Produces: Safe atomic bulk deletion, auto table refresh on import/delete, selection reset

- [ ] **Step 1: Perbarui `handleBulkDelete` di `DataUsahaPage.tsx`**
  - Ganti `Promise.all(ids.map(...))` dengan satu request `axios.post('/api/admin/businesses/bulk-delete', { ids })`.
  - Tangani response sukses: reset `rowSelection`, increment `refreshTrigger`, tutup modal konfirmasi, tampilkan toast sukses.
  - Tangani error: tampilkan pesan error backend, matikan loading.

- [ ] **Step 2: Pastikan `onSuccess` dari `DataUsahaImportModal` mereset selection & refresh tabel**
  - Reset `setRowSelection({})`.
  - Refresh data tabel (`setRefreshTrigger(p => p + 1)` atau reset page jika diperlukan).
  - Pertahankan filter/search/sort aktif.

---

### Task 5: Comprehensive Testing & Verification
**Files:**
- Test scripts: `tests/Feature/...` atau manual test fixtures pada root (`DP.Proyek OSS 2024.csv`, `DP.Proyek.xlsx`, `dummy.csv`)

- [ ] **Step 1: Test Import CSV valid (dummy.csv & canonical headers)**
- [ ] **Step 2: Test Import XLSX valid (DP.Proyek.xlsx)**
- [ ] **Step 3: Test CSV dengan alias `klsektor_pembina` dan kolom tambahan `no`**
- [ ] **Step 4: Test file dengan missing required column & verifikasi pesan error**
- [ ] **Step 5: Test Single Delete & verifikasi DB + UI**
- [ ] **Step 6: Test Bulk Delete & verifikasi DB + UI**
- [ ] **Step 7: Run `npm run build` untuk memverifikasi TypeScript dan bundle Vite**
