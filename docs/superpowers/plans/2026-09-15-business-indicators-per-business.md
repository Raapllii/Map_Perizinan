# Per-Business Indicators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the business indicators feature from a global fixed-slot configuration into a dynamic, per-business relational data system (`Business hasMany BusinessIndicator`) with custom title and value, managed directly in Add/Edit Data Usaha and rendered on detail modals and map side panels.

**Architecture:** 
- Table `business_indicators` (`id`, `business_id` FK cascade, `judul`, `nilai`, `sort_order`, `timestamps`).
- Eloquent relation: `Business` hasMany `BusinessIndicator`; `BusinessIndicator` belongsTo `Business`.
- `BusinessService` manages business and indicators in database transactions for create, update, and delete.
- Frontend `DataUsahaFormModal` manages dynamic indicator array with `[ + Add Indikator ]`, custom `judul`, and multiline `nilai`.
- Frontend `DataUsahaDetailModal` and `BusinessSidePanel` display `business.indicators` with `judul` and `nilai`.
- Global indicator menu, pages, routes, and hooks are completely removed.

**Tech Stack:** Laravel 9, PostgreSQL, React 18, TypeScript, Tailwind CSS, TanStack Table, Vite.

## Global Constraints
- Do NOT alter Leaflet map behavior; `selectedBusiness` and `hoveredBusiness` must remain strictly decoupled.
- Do NOT alter table layout in `DataUsahaPage.tsx` with fixed extra columns.
- Database transaction required for creating and updating indicators.
- Cascade delete required on foreign key `business_indicators.business_id -> businesses.id`.
- Value (`nilai`) must support freeform text, multiline sentences, numbers, or dates without restrictive data type constraints.
- Title (`judul`) is required (max 255 chars).

---

### Task 1: Revert Global Indicator Configuration UI & Routes

**Files:**
- Delete: `resources/js/pages/PengaturanIndikatorPage.tsx`
- Delete: `resources/js/hooks/useBusinessIndicators.ts`
- Modify: `resources/js/constants/index.ts:1-30`
- Modify: `resources/js/components/layout/AdminLayout.tsx:10-45`
- Modify: `resources/js/pages/DataUsahaPage.tsx:50-100, 190-210, 540-600, 880-920`
- Modify: `routes/api.php:25-35`
- Modify: `routes/web.php:70-75`

**Interfaces:**
- Consumes: Existing clean navigation and routes.
- Produces: Clean codebase without references to `/admin/pengaturan-indikator` or `useBusinessIndicators`.

- [ ] **Step 1: Delete `PengaturanIndikatorPage.tsx` and `useBusinessIndicators.ts`**
Remove unused files created for the global indicator configuration.

- [ ] **Step 2: Revert `constants/index.ts` and `AdminLayout.tsx`**
Remove `pengaturan-indikator` from `MENU_ITEMS` and `PAGE_TITLES`. Remove `case "pengaturan-indikator"` from `AdminLayout.tsx`.

- [ ] **Step 3: Revert indicator columns in `DataUsahaPage.tsx`**
Remove dynamic indicator columns from TanStack `columns` and `columnVisibility` in `DataUsahaPage.tsx` to restore original table cleanliness.

- [ ] **Step 4: Remove global indicator endpoints in `routes/api.php` and `routes/web.php`**
Remove `GET /business-indicators`, `GET /api/admin/business-indicators`, and `PUT /api/admin/business-indicators/{id}`.

- [ ] **Step 5: Verify route list and bundle compilation**
Run: `php artisan route:list | grep indicator` (should return empty).

---

### Task 2: Database Migration & Eloquent Models for Per-Business Indicators

**Files:**
- Create: `database/migrations/2026_09_15_140000_create_business_indicators_table.php`
- Modify: `app/Models/Business.php`
- Modify: `app/Models/BusinessIndicator.php`

**Interfaces:**
- Consumes: `businesses` table with `id`.
- Produces: `Business::indicators()` relation returning collection of `BusinessIndicator` ordered by `sort_order`.

- [ ] **Step 1: Rollback previous migration if needed & write migration**
Schema definition:
```php
Schema::create('business_indicators', function (Blueprint $table) {
    $table->id();
    $table->foreignId('business_id')->constrained('businesses')->onDelete('cascade');
    $table->string('judul', 255);
    $table->text('nilai')->nullable();
    $table->integer('sort_order')->default(0);
    $table->timestamps();

    $table->index(['business_id', 'sort_order']);
});
```

- [ ] **Step 2: Run migration**
Run: `php artisan migrate:rollback --step=1` followed by `php artisan migrate --force --no-interaction`.

- [ ] **Step 3: Update `BusinessIndicator.php` model**
```php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessIndicator extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'judul',
        'nilai',
        'sort_order',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
```

- [ ] **Step 4: Update `Business.php` model**
Add `hasMany` relationship:
```php
public function indicators()
{
    return $this->hasMany(BusinessIndicator::class, 'business_id')->orderBy('sort_order', 'asc');
}
```

- [ ] **Step 5: Safely migrate any dummy data from `businesses.indicator_1..10`**
Update `database/seeders/DummyDataSeeder.php` to insert indicators via `$business->indicators()->createMany(...)` and remove the old global indicator seeder loop.

---

### Task 3: Backend Controller, Service, & Request Validation (TDD)

**Files:**
- Create: `tests/Feature/BusinessPerItemIndicatorTest.php`
- Modify: `app/Services/BusinessService.php`
- Modify: `app/Http/Controllers/Api/BusinessController.php`
- Modify: `app/Http/Requests/StoreBusinessRequest.php` (or validation in controller/service)
- Modify: `app/Http/Requests/UpdateBusinessRequest.php`

**Interfaces:**
- Consumes: Request with payload `{ ..., indicators: [ { id?: int, judul: string, nilai?: string, sort_order?: int } ] }`.
- Produces: Business record with persisted `indicators` relation.

- [ ] **Step 1: Write comprehensive failing tests in `tests/Feature/BusinessPerItemIndicatorTest.php`**
Implement the 11 tests specified by the user:
1. `test_create_business_without_indicators_succeeds`
2. `test_create_business_with_single_indicator_succeeds`
3. `test_create_business_with_multiple_indicators_succeeds`
4. `test_edit_indicator_judul_succeeds`
5. `test_edit_indicator_nilai_succeeds`
6. `test_add_indicator_during_edit_succeeds`
7. `test_delete_indicator_during_edit_succeeds`
8. `test_indicators_scoped_to_correct_business`
9. `test_deleting_business_cascades_and_deletes_indicators`
10. `test_business_detail_api_returns_indicators`
11. `test_unauthenticated_user_cannot_access_protected_endpoints`

- [ ] **Step 2: Run test suite to verify failure**
Run: `php vendor/phpunit/phpunit/phpunit tests/Feature/BusinessPerItemIndicatorTest.php`
Expected: Fails due to indicators not handled in create/update.

- [ ] **Step 3: Implement indicator handling in `BusinessService.php`**
In `createBusiness(array $data)`:
Wrap in `DB::transaction()`. Extract `indicators = $data['indicators'] ?? []`. Create business. Iterate `$indicators` with index as `sort_order`, create `BusinessIndicator`.
In `updateBusiness(Business $business, array $data)`:
Wrap in `DB::transaction()`. Update business attributes. If `array_key_exists('indicators', $data)`:
Sync indicators:
- Gather incoming IDs.
- Delete indicators of `$business` not present in incoming IDs.
- For incoming items with existing ID, update `judul`, `nilai`, `sort_order`.
- For incoming items without ID, create new `BusinessIndicator`.

- [ ] **Step 4: Update `BusinessController.php`**
Eager load `indicators` in `show($id)` and when returning business after store/update.
Eager load `indicators` in `getBusinessesForDataTable` or map endpoint if needed.

- [ ] **Step 5: Run tests and verify all pass**
Run: `php vendor/phpunit/phpunit/phpunit tests/Feature/BusinessPerItemIndicatorTest.php`
Expected: 11 tests, all passing.

---

### Task 4: Frontend Types & Form Modal (`DataUsahaFormModal.tsx`)

**Files:**
- Modify: `resources/js/types/index.ts`
- Modify: `resources/js/components/DataUsahaFormModal.tsx`

**Interfaces:**
- Consumes: `BusinessIndicator` interface.
- Produces: Dynamic list of `{ id?: number, judul: string, nilai: string }` submitted to backend.

- [ ] **Step 1: Update `resources/js/types/index.ts`**
```ts
export interface BusinessIndicator {
  id?: number;
  business_id?: number;
  judul: string;
  nilai?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Business {
  // ... existing fields
  indicators?: BusinessIndicator[];
}
```

- [ ] **Step 2: Update `DataUsahaFormModal.tsx` state and effects**
Add `indicators: Array<{ id?: number; judul: string; nilai: string }>` to state.
When `business` prop changes:
```ts
if (business && Array.isArray(business.indicators)) {
  setIndicators(business.indicators.map(i => ({
    id: i.id,
    judul: i.judul || "",
    nilai: i.nilai || ""
  })));
} else {
  setIndicators([]);
}
```

- [ ] **Step 3: Implement Section F in `DataUsahaFormModal.tsx`**
- Show header: "F. Indikator Tambahan" with button `[ + Add Indikator ]`.
- If `indicators.length === 0`: render "Belum ada indikator tambahan." in a clean empty state card.
- For each item:
  - Header: "Indikator Tambahan {index + 1}" and Trash button with icon `Trash2`.
  - Field "Judul / Nama Indikator" (input text, placeholder "Contoh: NPWP, Nomor PBG, Status Pajak").
  - Field "Nilai" (textarea with `rows={2}` or auto-adjust for long text/sentences, placeholder "Contoh: 12.345.678 atau keterangan verifikasi lapangan").
- Handle change for `judul` and `nilai`.
- Handle remove item.
- Handle add item.

- [ ] **Step 4: Include `indicators` in submit payload**
Include `indicators` in POST (`/api/admin/businesses`) and PUT (`/api/admin/businesses/${business.id}`).

---

### Task 5: Frontend Detail Views (`DataUsahaDetailModal.tsx` & `BusinessSidePanel.tsx`)

**Files:**
- Modify: `resources/js/components/DataUsahaDetailModal.tsx`
- Modify: `resources/js/components/ui/BusinessSidePanel.tsx`

**Interfaces:**
- Consumes: `business.indicators: BusinessIndicator[]`.
- Produces: List of dynamic indicator items displaying `indicator.judul` as label and `indicator.nilai` as value.

- [ ] **Step 1: Update `DataUsahaDetailModal.tsx`**
Check `business?.indicators && business.indicators.length > 0`.
Render each indicator:
```tsx
<DetailItem
  key={ind.id ?? idx}
  label={ind.judul}
  value={ind.nilai}
/>
```
If empty, hide or show "Tidak ada indikator tambahan".

- [ ] **Step 2: Update `BusinessSidePanel.tsx`**
Check `business?.indicators && business.indicators.length > 0`.
Render each indicator with `ind.judul` and `ind.nilai`.
Preserve all map coordinates and drawer behavior.

---

### Task 6: Full Integration Verification & Build

**Files:** None (testing only)

- [ ] **Step 1: Run full PHPUnit suite**
Run: `php vendor/phpunit/phpunit/phpunit`
Expected: 100% tests pass.

- [ ] **Step 2: Run frontend production build**
Run: `cmd.exe /c "npm run build"`
Expected: Exit code 0, 0 TypeScript errors.

- [ ] **Step 3: Verification against final checklist**
Confirm checklist:
- [ ] Tidak ada menu Pengaturan Indikator
- [ ] Tidak ada halaman Pengaturan Indikator
- [ ] Tidak ada konfigurasi indikator global
- [ ] Tidak ada kewajiban 10 indikator
- [ ] Ada tombol "+ Add Indikator" di Data Usaha
- [ ] Klik Add Indikator -> muncul field Judul & Nilai
- [ ] Bisa menambah, mengedit, dan menghapus indikator
- [ ] Nilai bisa berupa angka maupun kalimat bebas
- [ ] Indikator tersimpan per business_id
- [ ] Detail Data Usaha & Map menampilkan indikator dinamis
- [ ] Data Usaha existing & Map behavior tidak rusak
