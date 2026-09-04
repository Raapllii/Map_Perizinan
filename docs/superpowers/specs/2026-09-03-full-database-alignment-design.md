# Full Database Alignment Design

## Objective
To completely align the Map Perizinan application (Backend, API, Frontend, Types, Services) with the new 27-column OSS database schema. All backward compatibility layers (aliases, accessors) for old field names will be removed. The new database structure will serve as the single source of truth across all layers.

## Architecture & Data Flow

1. **Database Layer (Source of Truth)**
   - Table: `businesses`
   - Fields: 27 OSS columns + `id`, `status`, `color`, `location` (PostGIS), `created_at`, `updated_at`.
   - The old fields (`lat`, `lng`, `kecamatan`, `alamat_proyek`, `risiko`, `tgl_terbit`, etc.) are permanently deprecated and removed.

2. **Model Layer (`App\Models\Business`)**
   - Remove `$appends` for old keys.
   - Remove accessor methods (e.g., `getLatAttribute()`).
   - Use correct Laravel `$casts` for mapping native DB types (e.g., `latitude` => `float`, `tanggal_terbit_oss` => `date`).

3. **Repository Layer (`App\Repositories\BusinessRepository`)**
   - Remove aliased select statements (e.g., `latitude AS lat`).
   - Map frontend filter payloads to the exact new DB column names (e.g., `kecamatan_usaha`, `uraian_risiko_proyek`).
   - Implement "Status Pemetaan" using `latitude` and `longitude`.
   - Update fulltext search indices and `ILIKE` clauses to target the new columns (`nama_perusahaan`, `kecamatan_usaha`, `alamat_usaha`, etc.).

4. **Service Layer (`App\Services\BusinessService`, `DashboardService`)**
   - Remove payload translations in `store()` and `update()`.
   - Update Dashboard queries (KPIs, Charts) to aggregate on the new columns (`uraian_risiko_proyek` instead of `risiko`, `tanggal_terbit_oss` instead of `tgl_terbit`).

5. **API & Request Layer (`StoreBusinessRequest`, `UpdateBusinessRequest`)**
   - Update validation rules to expect the new field names (`latitude`, `longitude`, `kecamatan_usaha`, `alamat_usaha`, etc.).

6. **Import/Export Layer (`BusinessesImport`, `OssImport`)**
   - Strictly validate the 27 column headers.
   - Remove any fallback to old column names.
   - Map directly to the database.

7. **Frontend Layer (React & TypeScript)**
   - Update `Business` interface types to use the new properties.
   - Update all mapping and binding in UI components:
     - `DataUsahaPage.tsx`, `DataUsahaFormModal.tsx`, `DataUsahaDetailModal.tsx`
     - `PublicMapPage.tsx`, `PetaUsahaPage.tsx`, `CityMapLeaflet.tsx`
     - `DashboardPage.tsx`, `LaporanPage.tsx`, `VerifikasiIzinPage.tsx`
     - `BusinessSidePanel.tsx`, `BusinessDetailCard.tsx`, `TopBar.tsx`, `FilterCombobox.tsx`
   - Data table columns will display human-readable labels (e.g., "Kecamatan") but bind to `kecamatan_usaha`.
   - Update API fetch payload parameters to use the new names.

## Migration & Testing Strategy
- Perform a `php artisan migrate:fresh` to verify schema integrity.
- Run DB seeders (updated to use new keys).
- Execute `npm run build` to verify TypeScript typings.
- Conduct manual/automated endpoint tests.
