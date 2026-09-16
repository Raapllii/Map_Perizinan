# Custom Indicators Configuration & End-to-End Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the 10 generic indicators into a fully dynamic, configuration-driven system where administrators can customize column names/labels, data types, visibility, and sort order without altering the underlying `businesses` database schema, while auditing and maintaining public access logging and admin features.

**Architecture:** 
- A new `business_indicators` configuration table stores metadata (`id`, `key`, `label`, `description`, `data_type`, `is_active`, `sort_order`).
- The `businesses` table retains `indicator_1` through `indicator_10` as nullable values.
- Backend API provides CRUD for indicator configurations with strict validation (max 10, valid data types, unique keys).
- Frontend forms, detail modals, side panels, and tables dynamically adapt their labels and input types based on active indicator configurations.
- Public map visitor access logs and admin rekapitulasi are audited for robust validation (date range guard, anti-duplicate submit, session integrity).

**Tech Stack:** Laravel 9, PostgreSQL/PostGIS, React 18, TypeScript, Tailwind CSS, Vite, TanStack Table, PHPUnit.

---

## Global Constraints

- Never modify the `businesses` schema with domain-specific columns (e.g., no `nama_pajak`, `nomor_pbg`).
- The internal keys `indicator_1` .. `indicator_10` remain stable; only metadata (`label`, `data_type`, `is_active`, `sort_order`) changes.
- Never exceed 10 indicators.
- Supported data types: `text`, `number`, `date`, `boolean`.
- Map behavior (Leaflet, clustering, hover vs select decoupling, floating panel, popup preview) must not be broken or regressed.
- All PHPUnit tests and `npm run build` must pass with zero errors.

---

### Task 1: Database Migration, Model, & Seeder for `business_indicators`

**Files:**
- Create: `database/migrations/2026_09_15_140000_create_business_indicators_table.php`
- Create: `app/Models/BusinessIndicator.php`
- Modify: `database/seeders/DummyDataSeeder.php`

**Interfaces:**
- Produces: `business_indicators` table with `id`, `key` (unique), `label`, `description`, `data_type`, `is_active`, `sort_order`, timestamps.
- Model `BusinessIndicator` with `$fillable = ['key', 'label', 'description', 'data_type', 'is_active', 'sort_order']` and casts `is_active => boolean, sort_order => integer`.

- [ ] **Step 1: Create migration file for `business_indicators`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBusinessIndicatorsTable extends Migration
{
    public function up()
    {
        Schema::create('business_indicators', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->string('label', 255);
            $table->text('description')->nullable();
            $table->string('data_type', 30)->default('text'); // text, number, date, boolean
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(1);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('business_indicators');
    }
}
```

- [ ] **Step 2: Create Eloquent Model `app/Models/BusinessIndicator.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessIndicator extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'label',
        'description',
        'data_type',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order', 'asc')->orderBy('id', 'asc');
    }
}
```

- [ ] **Step 3: Add indicator seeding to `database/seeders/DummyDataSeeder.php`**

Ensure default 10 indicators are seeded:
```php
        // 7. Default Business Indicators Configuration
        for ($i = 1; $i <= 10; $i++) {
            \App\Models\BusinessIndicator::updateOrCreate(
                ['key' => "indicator_{$i}"],
                [
                    'label' => "Indikator {$i}",
                    'description' => "Kolom indikator tambahan ke-{$i}",
                    'data_type' => 'text',
                    'is_active' => $i <= 5, // 1..5 active by default, 6..10 inactive
                    'sort_order' => $i,
                ]
            );
        }
```

- [ ] **Step 4: Run migration and seeder**

Run: `php artisan migrate`
Expected: Migration created table `business_indicators` successfully.

---

### Task 2: Backend API Controller, Requests, Routes, & Feature Tests

**Files:**
- Create: `app/Http/Requests/UpdateBusinessIndicatorRequest.php`
- Create: `app/Http/Controllers/Api/BusinessIndicatorController.php`
- Modify: `routes/api.php`
- Modify: `routes/web.php`
- Modify: `app/Services/BusinessService.php`
- Modify: `app/Http/Controllers/Api/PublicMapAccessLogController.php`
- Create: `tests/Feature/BusinessIndicatorTest.php`

**Interfaces:**
- `GET /api/business-indicators`: returns active indicators ordered by `sort_order`.
- `GET /api/admin/business-indicators`: returns all 10 indicators ordered by `sort_order` (auth required).
- `PUT /api/admin/business-indicators/{id}`: updates `label`, `description`, `data_type`, `is_active`, `sort_order` (auth required).

- [ ] **Step 1: Write failing Feature Tests in `tests/Feature/BusinessIndicatorTest.php`**

```php
<?php

namespace Tests\Feature;

use App\Models\BusinessIndicator;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessIndicatorTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['role' => 'Administrator']);
        
        for ($i = 1; $i <= 10; $i++) {
            BusinessIndicator::create([
                'key' => "indicator_{$i}",
                'label' => "Indikator {$i}",
                'data_type' => 'text',
                'is_active' => $i <= 5,
                'sort_order' => $i,
            ]);
        }
    }

    public function test_admin_can_list_all_indicators()
    {
        $response = $this->actingAs($this->user)->getJson('/api/admin/business-indicators');
        $response->assertStatus(200);
        $response->assertJsonCount(10, 'data');
    }

    public function test_unauthenticated_cannot_access_admin_indicator_api()
    {
        $response = $this->get('/api/admin/business-indicators');
        $response->assertRedirect('/admin/login');
    }

    public function test_public_can_get_only_active_indicators()
    {
        $response = $this->getJson('/api/business-indicators');
        $response->assertStatus(200);
        $response->assertJsonCount(5, 'data');
    }

    public function test_admin_can_update_indicator_label_and_data_type()
    {
        $indicator = BusinessIndicator::where('key', 'indicator_1')->first();

        $payload = [
            'label' => 'NPWP Perusahaan',
            'data_type' => 'text',
            'is_active' => true,
            'sort_order' => 1,
            'description' => 'Nomor Pokok Wajib Pajak',
        ];

        $response = $this->actingAs($this->user)->putJson("/api/admin/business-indicators/{$indicator->id}", $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('business_indicators', [
            'id' => $indicator->id,
            'label' => 'NPWP Perusahaan',
            'key' => 'indicator_1',
        ]);
    }

    public function test_cannot_update_indicator_with_invalid_data_type()
    {
        $indicator = BusinessIndicator::first();

        $response = $this->actingAs($this->user)->putJson("/api/admin/business-indicators/{$indicator->id}", [
            'label' => 'Test',
            'data_type' => 'invalid_type',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['data_type']);
    }
}
```

- [ ] **Step 2: Run test to verify failure**

Run: `php vendor/phpunit/phpunit/phpunit tests/Feature/BusinessIndicatorTest.php`
Expected: FAIL (Controller/Routes not yet registered).

- [ ] **Step 3: Create FormRequest `UpdateBusinessIndicatorRequest.php`**

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBusinessIndicatorRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'label' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'data_type' => 'required|string|in:text,number,date,boolean',
            'is_active' => 'required|boolean',
            'sort_order' => 'required|integer|min:1|max:10',
        ];
    }
}
```

- [ ] **Step 4: Create Controller `BusinessIndicatorController.php`**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBusinessIndicatorRequest;
use App\Models\BusinessIndicator;
use Illuminate\Support\Facades\Cache;

class BusinessIndicatorController extends Controller
{
    public function index()
    {
        $indicators = BusinessIndicator::ordered()->get();
        return response()->json([
            'status' => 'success',
            'data' => $indicators,
        ]);
    }

    public function indexActive()
    {
        $indicators = Cache::remember('active_business_indicators', 60, function () {
            return BusinessIndicator::active()->ordered()->get();
        });

        return response()->json([
            'status' => 'success',
            'data' => $indicators,
        ]);
    }

    public function update(UpdateBusinessIndicatorRequest $request, $id)
    {
        $indicator = BusinessIndicator::findOrFail($id);
        $indicator->update($request->validated());

        Cache::forget('active_business_indicators');

        return response()->json([
            'status' => 'success',
            'message' => 'Konfigurasi indikator berhasil diperbarui.',
            'data' => $indicator,
        ]);
    }
}
```

- [ ] **Step 5: Register routes in `routes/api.php` and `routes/web.php`**

In `routes/api.php`:
```php
Route::get('/business-indicators', [App\Http\Controllers\Api\BusinessIndicatorController::class, 'indexActive']);
```
In `routes/web.php` under `Route::prefix('api/admin')->group(...)` -> `Route::middleware('auth')->group(...)`:
```php
Route::get('/business-indicators', [App\Http\Controllers\Api\BusinessIndicatorController::class, 'index']);
Route::put('/business-indicators/{id}', [App\Http\Controllers\Api\BusinessIndicatorController::class, 'update']);
```

- [ ] **Step 6: Update `BusinessService.php` and `PublicMapAccessLogController.php`**

In `BusinessService::getBusinessesForDataTable()`:
Add `indicator_1` through `indicator_10` to the query `select()` columns so the table can display them.

In `PublicMapAccessLogController::index()`:
Add date range guard:
```php
if ($request->filled('start_date') && $request->filled('end_date')) {
    $startDate = $request->start_date;
    $endDate = $request->end_date;
    if ($startDate > $endDate) {
        [$startDate, $endDate] = [$endDate, $startDate];
    }
    $query->whereDate('accessed_at', '>=', $startDate)
          ->whereDate('accessed_at', '<=', $endDate);
} elseif ($request->filled('start_date')) {
    $query->whereDate('accessed_at', '>=', $request->start_date);
} elseif ($request->filled('end_date')) {
    $query->whereDate('accessed_at', '<=', $request->end_date);
}
```

- [ ] **Step 7: Run PHPUnit to verify all tests pass**

Run: `php vendor/phpunit/phpunit/phpunit`
Expected: 100% tests pass.

---

### Task 3: TypeScript Interface & Admin "Pengaturan Indikator" Page

**Files:**
- Modify: `resources/js/types/index.ts`
- Create: `resources/js/pages/PengaturanIndikatorPage.tsx`
- Modify: `resources/js/constants/index.ts`
- Modify: `resources/js/components/layout/AdminLayout.tsx`

**Interfaces:**
- Types:
```ts
export interface BusinessIndicator {
  id: number;
  key: `indicator_${number}` | string;
  label: string;
  description: string | null;
  data_type: 'text' | 'number' | 'date' | 'boolean';
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}
```
- Page `PengaturanIndikatorPage`: displays table of 10 indicators, status badges, and edit dialog.

- [ ] **Step 1: Add `BusinessIndicator` to `resources/js/types/index.ts`**
- [ ] **Step 2: Create `PengaturanIndikatorPage.tsx`**
Includes:
- KPI summary (Total Indikator: 10, Indikator Aktif: X, Indikator Nonaktif: Y)
- Table matching Data Usaha styling: No, Nama Kolom (Label), Keterangan, Tipe Data (Badge), Status (Badge Aktif/Nonaktif), Urutan, Aksi (Tombol Edit).
- Edit Modal with live form validation, preview of column name, type selector, toggle status, and save action.
- [ ] **Step 3: Register in `MENU_ITEMS`, `PAGE_TITLES`, and `AdminLayout.tsx`**
Sidebar menu item: `Pengaturan Indikator` with icon `SlidersHorizontal`.

---

### Task 4: Dynamic Indicators in Data Usaha (Form, Detail, SidePanel, Table)

**Files:**
- Modify: `resources/js/components/DataUsahaFormModal.tsx`
- Modify: `resources/js/components/DataUsahaDetailModal.tsx`
- Modify: `resources/js/components/ui/BusinessSidePanel.tsx`
- Modify: `resources/js/pages/DataUsahaPage.tsx`

**Interfaces:**
- Reads active indicators from `/api/business-indicators`.
- Dynamically creates form fields matching `data_type` (`text`, `number`, `date`, `boolean`).
- Inactive indicators are excluded from the form.
- Values saved into `businesses.indicator_1` .. `indicator_10`.
- Detail modal and side panel display custom labels with fallback `-`.
- Data Usaha table appends dynamic columns for active indicators into the table and column visibility dropdown.

- [ ] **Step 1: Update `DataUsahaFormModal.tsx`**
Fetch active indicators. Render Section "F. Indikator Tambahan" dynamically based on active indicator list and `data_type`.
- [ ] **Step 2: Update `DataUsahaDetailModal.tsx`**
Fetch active indicators. Render Section "Indikator Tambahan" using `indicator.label` and `business[indicator.key]`.
- [ ] **Step 3: Update `BusinessSidePanel.tsx`**
Display active indicator labels instead of static "Indikator X".
- [ ] **Step 4: Update `DataUsahaPage.tsx`**
Dynamically register columns in `useReactTable` for active indicators with custom header names and column toggle support.

---

### Task 5: QA Testing, Regression Checks, and Final Build

**Files:**
- Run: `php vendor/phpunit/phpunit/phpunit`
- Run: `cmd.exe /c "npm run build"`

- [ ] **Step 1: Run full PHPUnit suite**
Ensure all existing and new tests pass.
- [ ] **Step 2: Run npm run build**
Ensure Vite compiles clean without TypeScript errors.
- [ ] **Step 3: Perform QA validation for Scenarios 1–10**
Verify custom label, deactivation, sort order, data type, and public visitor audit.
