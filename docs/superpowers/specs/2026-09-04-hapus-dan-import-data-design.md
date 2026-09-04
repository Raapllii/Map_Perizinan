# Hapus Data & Import Data (CSV + Excel) Technical Design

## Objective
Memperbaiki dan menyempurnakan fitur Hapus Data (single delete & bulk delete) serta fitur Import Data (CSV & Excel .xlsx) pada project Map Perizinan. Fokus pada keandalan (reliability), performa tanpa freeze/lock, arsitektur background processing yang asynchronous, tracking progress riil (upload vs import processing), serta validasi dan normalisasi data yang presisi tanpa mengubah skema 27 kolom OSS.

---

## 1. Arsitektur Hapus Data (Delete)

### A. Single Delete
- **Endpoint**: `DELETE /api/admin/businesses/{id}`
- **Alur**:
  1. User klik menu "Hapus" pada dropdown row aksi tabel di [DataUsahaPage.tsx](file:///c:/laragon/www/Map_Perizinan/resources/js/pages/DataUsahaPage.tsx).
  2. Dialog konfirmasi browser `confirm("Apakah Anda yakin ingin menghapus data ini?")` muncul.
  3. Saat disetujui, tombol row berubah menjadi state loading (`isDeleting === b.id`) dengan icon spinner disabled.
  4. Backend controller [BusinessController.php](file:///c:/laragon/www/Map_Perizinan/app/Http/Controllers/Api/BusinessController.php) mendelegasikan ke `BusinessService::destroy($id)`.
  5. `BusinessRepository::delete($id)` menghapus record, cache terkait (`dashboard_data`, `map_markers_all`) dibersihkan.
  6. Response sukses memicu:
     - `setRefreshTrigger(prev => prev + 1)` untuk auto-refresh data tabel tanpa reload halaman.
     - `setRowSelection({})` untuk reset seleksi.
     - Toast notifikasi sukses.
  7. Jika gagal: tangkap error response backend dan tampilkan pesan spesifik melalui toast error.

### B. Bulk Delete
- **Endpoint Baru**: `POST /api/admin/businesses/bulk-delete`
- **Payload**: `{ ids: number[] }`
- **Alur**:
  1. User memilih satu atau lebih baris melalui checkbox tabel.
  2. Tombol kontekstual "Hapus (N)" di toolbar tabel diklik, membuka `AlertDialog` konfirmasi.
  3. User menekan konfirmasi: tombol aksi disabled dengan spinner `isBulkDeleting`.
  4. Frontend mengirim satu request POST `POST /api/admin/businesses/bulk-delete` dengan array ID terpilih, menggantikan loop `Promise.all` paralel yang membebani server dan berisiko partial failure.
  5. Backend [BusinessController.php](file:///c:/laragon/www/Map_Perizinan/app/Http/Controllers/Api/BusinessController.php) memvalidasi `ids` (`required|array|min:1`, `ids.* => integer`).
  6. Backend memanggil `BusinessService::bulkDestroy(array $ids)`:
     - Menjalankan `DB::transaction()` menghapus `Business::whereIn('id', $ids)->delete()`.
     - Membersihkan cache aplikasi.
     - Mencatat log aktivitas bulk delete.
  7. Response mengembalikan `{ status: 'success', message: 'N data usaha berhasil dihapus', count: N }`.
  8. Frontend menutup modal, mereset `rowSelection`, merefresh tabel, dan menampilkan toast sukses. Jika gagal, tampilkan pesan error backend.

---

## 2. Arsitektur Import Data (CSV & Excel .xlsx)

### A. Format & Ukuran File
- **Ekstensi & MIME**:
  - `.csv` (`text/csv`, `text/plain`)
  - `.xlsx`, `.xls` (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`)
- **Ukuran Maksimum**: 50MB (konsisten antara frontend dan backend `max:51200`).
- **Delimiter CSV**: Auto-detection (mendukung pemisah titik koma `;` standar OSS Indonesia dan koma `,` standar spreadsheet internasional).

### B. Header Mapping & Normalisasi Data
Pertahankan 27 field kanonikal OSS:
1. `id_proyek`
2. `uraian_jenis_proyek`
3. `nib`
4. `nama_perusahaan`
5. `tanggal_terbit_oss`
6. `uraian_status_penanaman_modal`
7. `uraian_jenis_perusahaan`
8. `uraian_risiko_proyek`
9. `nama_proyek`
10. `uraian_skala_usaha`
11. `alamat_usaha`
12. `kab_kota_usaha`
13. `kecamatan_usaha`
14. `kelurahan_usaha`
15. `longitude`
16. `latitude`
17. `day_of_tanggal_pengajuan_proyek`
18. `kbli`
19. `judul_kbli`
20. `kl_sektor_pembina`
21. `nama_user`
22. `email`
23. `nomor_telp`
24. `luas_tanah`
25. `satuan_tanah`
26. `jumlah_investasi`
27. `tki`

- **Aturan Normalisasi**:
  - Semua header dinormalisasi: lowercase, spasi dan tanda baca non-alfanumerik diubah menjadi underscore (`_`), trim underscore.
  - Alias yang didukung:
    - `klsektor_pembina` → `kl_sektor_pembina`
    - `klsektorpembina` → `kl_sektor_pembina`
  - Kolom tambahan seperti `no`, `no.` diabaikan tanpa memicu error.
  - Normalisasi header diterapkan secara simetris baik pada tahap validasi header maupun tahap mapping nilai setiap baris.
  - Format angka desimal/uang (seperti `10.000.000` atau `10.000.000,50` format Indonesia): titik ribuan dibersihkan dan koma desimal dikonversi menjadi titik float.
  - Format tanggal: mendukung format Indonesia `d/m/Y`, `d-m-Y`, string ISO, serta Excel serial date number.
  - Koordinat: validasi range `latitude` [-90, 90] dan `longitude` [-180, 180]. PostgreSQL trigger otomatis mensinkronkan geometri `location`.

### C. Alur Asynchronous & Real Progress

Siklus import dibagi menjadi 4 fase yang terisolasi:

```
[User Memilih File CSV/XLSX]
       │
       ▼
[PHASE 1: Upload (Axios onUploadProgress)]
       │  Network progress: 0% ──► 100%
       ▼
[Backend: POST /api/admin/database/import]
       │  - Simpan file ke storage/app/imports/
       │  - Hitung total baris sebenarnya (XLSX via listWorksheetInfo, CSV via line count)
       │  - Inisialisasi Cache progress status: 'processing'
       │  - Spawn background import process (Queue jika configured, atau Artisan detached command)
       │  - RETURN HTTP 200 { status: 'success', import_id: '...' } SEGERA (tidak blocking)
       ▼
[PHASE 2: Processing (Frontend Polling 800ms)]
       │  - Polling GET /api/admin/database/import-progress/{importId}
       │  - UI menampilkan:
       │    * "Mengimport data..."
       │    * Persentase aktual: (processed_rows / total_rows * 100)%
       │    * "1.250 / 10.000 data"
       │    * "Kecepatan: 125 data/detik"
       │    * "Perkiraan selesai: ± 1 menit 10 detik" (atau "Memperkirakan waktu...")
       ▼
[PHASE 3: Completed ATAU PHASE 4: Failed]
       │
       ├─► Status 'completed':
       │   - Stop polling (cleanup interval)
       │   - Tampilkan "Import selesai", 100%, total baris, durasi
       │   - Hapus file sementara di backend
       │   - Trigger refresh tabel & reset selection di DataUsahaPage
       │   - Modal tetap menampilkan status sukses sampai user menutupnya
       │
       └─► Status 'failed':
           - Stop polling (cleanup interval)
           - Tampilkan "Import gagal" beserta pesan error backend (misal: kolom wajib hilang)
           - Hapus file sementara di backend
```

### D. Manajemen Timer & Polling Frontend
- `pollIntervalRef` disimpan pada React ref.
- Timer dibersihkan (`clearInterval`) di:
  1. Cleanup function `useEffect` (unmount).
  2. Saat modal ditutup (`onClose`).
  3. Saat status progress bernilai `completed`.
  4. Saat status progress bernilai `failed`.
  5. Saat terjadi error fatal pada network polling.

---

## 3. Komponen & File yang Terlibat
1. `routes/web.php`: Tambahkan route `POST /api/admin/businesses/bulk-delete`.
2. `app/Http/Controllers/Api/BusinessController.php`: Tambahkan method `bulkDestroy(Request $request)`.
3. `app/Services/BusinessService.php`: Tambahkan method `bulkDestroy(array $ids)`.
4. `app/Http/Controllers/Api/DatabaseController.php`: Update `import()` menerima CSV & XLSX, simpan file sementara, hitung baris riil, luncurkan async runner, dan perbarui `importProgress()`.
5. `app/Imports/BusinessesImport.php`: Support auto delimiter CSV, dynamic header normalization, robust row value mapping, format uang/tanggal, dan update cache per chunk.
6. `app/Console/Commands/ProcessBusinessImportCommand.php`: Artisan command `businesses:import {importId} {filePath} {userId}` untuk mengeksekusi import di background tanpa memblokir HTTP request.
7. `resources/js/components/DataUsahaImportModal.tsx`: Terima `.csv` & `.xlsx`, real upload progress via Axios, real polling status & ETA, pencegahan memory leak.
8. `resources/js/pages/DataUsahaPage.tsx`: Integrasikan bulk delete ke endpoint baru, refresh tabel dan reset seleksi setelah import berhasil.
