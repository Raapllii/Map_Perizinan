# Public Map Feedback & Database Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement end-to-end user feedback for Public Map: database migration and model linked to `public_map_access_logs` via `access_log_id`, Laravel API endpoint for submission, dual-trigger frontend integration (close detail or 7s timeout), and Admin Rekapitulasi Akses visualization.

**Architecture:** Full-stack integration with Laravel Eloquent relational persistence and React frontend. When visitor identifies, `access_log_id` is obtained. When interacting with business details, closing the detail panel or reaching the 7-second timeout activates a floating Feedback button. Feedback is submitted to `POST /api/public-map-feedback`, saved to the database linked to `public_map_access_log_id`, and displayed in the Admin Rekapitulasi table.

**Tech Stack:** Laravel 8/9/10/11 (PHP 8.2), MySQL/MariaDB, React 18, TypeScript, Tailwind CSS, Motion (`motion/react`), Lucide Icons, PHPUnit, Node test runner.

## Global Constraints
- Zero modifications to `resources/js/components/ui/feedback.tsx`.
- Feedback MUST be saved into Laravel database and linked to `public_map_access_logs.id` via `access_log_id`.
- Zero disruption to existing map markers, hover popups, or `BusinessSidePanel`.
- No feedback shown on initial map entry or generic map panning/zooming.
- Triggered by map data interaction: panel close OR 7-second usage timeout.
- Admin Rekapitulasi Akses displays visitor feedback alongside access logs.

---

### Task 1: Database Migration & Eloquent Models for `PublicMapFeedback`

**Files:**
- Create: `database/migrations/2026_09_17_110000_create_public_map_feedbacks_table.php`
- Create: `app/Models/PublicMapFeedback.php`
- Modify: `app/Models/PublicMapAccessLog.php`

**Interfaces:**
- Model `PublicMapFeedback`:
  - Relationships: `publicMapAccessLog()`, `business()`
  - Fields: `public_map_access_log_id`, `business_id`, `rating`, `feedback`
- Model `PublicMapAccessLog`:
  - Relationship: `feedback()` -> `hasOne(PublicMapFeedback::class, 'public_map_access_log_id')`

- [ ] **Step 1: Create Migration**

```php
// database/migrations/2026_09_17_110000_create_public_map_feedbacks_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePublicMapFeedbacksTable extends Migration
{
    public function up()
    {
        Schema::create('public_map_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('public_map_access_log_id')->constrained('public_map_access_logs')->cascadeOnDelete();
            $table->foreignId('business_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->string('rating', 50); // very-sad, sad, neutral, happy
            $table->text('feedback');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('public_map_feedbacks');
    }
}
```

- [ ] **Step 2: Run Migration**

Run: `php artisan migrate`
Expected: Migration created table `public_map_feedbacks` successfully.

- [ ] **Step 3: Create `PublicMapFeedback` Model and update `PublicMapAccessLog`**

```php
// app/Models/PublicMapFeedback.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicMapFeedback extends Model
{
    use HasFactory;

    protected $table = 'public_map_feedbacks';
    protected $guarded = [];

    public function publicMapAccessLog()
    {
        return $this->belongsTo(PublicMapAccessLog::class, 'public_map_access_log_id');
    }

    public function business()
    {
        return $this->belongsTo(Business::class, 'business_id');
    }
}
```

In `app/Models/PublicMapAccessLog.php`:
```php
public function feedback()
{
    return $this->hasOne(PublicMapFeedback::class, 'public_map_access_log_id');
}
```

- [ ] **Step 4: Commit Task 1**

```bash
git add database/migrations/2026_09_17_110000_create_public_map_feedbacks_table.php app/Models/PublicMapFeedback.php app/Models/PublicMapAccessLog.php
git commit -m "feat: add public_map_feedbacks migration and eloquent relations"
```

---

### Task 2: Feedback API Endpoints & PHPUnit Tests

**Files:**
- Create: `tests/Feature/PublicMapFeedbackTest.php`
- Create: `app/Http/Controllers/Api/PublicMapFeedbackController.php`
- Modify: `routes/api.php`
- Modify: `app/Http/Controllers/Api/PublicMapAccessLogController.php`

**Interfaces:**
- `POST /api/public-map-feedback`:
  - Body: `{ access_log_id: int, rating: string, feedback: string, business_id?: int }`
  - Validates and creates `PublicMapFeedback`
- `POST /api/public-map-access`:
  - Returns `access_log_id` explicitly in `data`
- `GET /api/admin/public-map-access-logs`:
  - Eager loads `feedback` relation with nested `business`

- [ ] **Step 1: Write PHPUnit Feature Tests**

```php
// tests/Feature/PublicMapFeedbackTest.php
namespace Tests\Feature;

use App\Models\Business;
use App\Models\PublicMapAccessLog;
use App\Models\PublicMapFeedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicMapFeedbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_submit_feedback_with_valid_access_log_id()
    {
        $log = PublicMapAccessLog::create([
            'nama' => 'Budi Santoso',
            'instansi' => 'DPMPTSP',
            'accessed_at' => now(),
        ]);

        $response = $this->postJson('/api/public-map-feedback', [
            'access_log_id' => $log->id,
            'rating' => 'happy',
            'feedback' => 'Tampilan peta sangat interaktif dan membantu riset lokasi.',
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'status' => 'success',
            'message' => 'Terima kasih, masukan Anda berhasil disimpan.',
        ]);

        $this->assertDatabaseHas('public_map_feedbacks', [
            'public_map_access_log_id' => $log->id,
            'rating' => 'happy',
            'feedback' => 'Tampilan peta sangat interaktif dan membantu riset lokasi.',
        ]);
    }

    public function test_cannot_submit_feedback_without_access_log_id()
    {
        $response = $this->postJson('/api/public-map-feedback', [
            'rating' => 'happy',
            'feedback' => 'Test',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['access_log_id']);
    }

    public function test_cannot_submit_feedback_with_invalid_rating()
    {
        $log = PublicMapAccessLog::create(['nama' => 'Andi', 'instansi' => 'Dinas', 'accessed_at' => now()]);

        $response = $this->postJson('/api/public-map-feedback', [
            'access_log_id' => $log->id,
            'rating' => 'super-awesome-invalid',
            'feedback' => 'Cukup baik',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['rating']);
    }

    public function test_admin_rekapitulasi_eager_loads_feedback()
    {
        $user = User::factory()->create(['role' => 'Administrator']);
        $log = PublicMapAccessLog::create(['nama' => 'Siti', 'instansi' => 'Bapenda', 'accessed_at' => now()]);

        PublicMapFeedback::create([
            'public_map_access_log_id' => $log->id,
            'rating' => 'neutral',
            'feedback' => 'Peta sudah cukup informatif.',
        ]);

        $response = $this->actingAs($user)->getJson('/api/admin/public-map-access-logs');
        $response->assertStatus(200);

        $row = $response->json('data.data.0');
        $this->assertNotNull($row['feedback']);
        $this->assertEquals('neutral', $row['feedback']['rating']);
        $this->assertEquals('Peta sudah cukup informatif.', $row['feedback']['feedback']);
    }
}
```

- [ ] **Step 2: Implement Controller & Route**

In `app/Http/Controllers/Api/PublicMapFeedbackController.php`:
```php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicMapFeedback;
use Illuminate\Http\Request;

class PublicMapFeedbackController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'access_log_id' => 'required|integer|exists:public_map_access_logs,id',
            'rating' => 'required|string|in:very-sad,sad,neutral,happy',
            'feedback' => 'required|string|min:2|max:3000',
            'business_id' => 'nullable|integer|exists:businesses,id',
        ], [
            'access_log_id.required' => 'Identitas akses peta wajib disertakan.',
            'access_log_id.exists' => 'Data log akses tidak ditemukan.',
            'rating.required' => 'Penilaian rating wajib dipilih.',
            'rating.in' => 'Pilihan rating tidak valid.',
            'feedback.required' => 'Pesan masukan wajib diisi.',
            'feedback.min' => 'Pesan masukan minimal 2 karakter.',
        ]);

        $feedback = PublicMapFeedback::create([
            'public_map_access_log_id' => $validated['access_log_id'],
            'business_id' => $validated['business_id'] ?? null,
            'rating' => $validated['rating'],
            'feedback' => trim($validated['feedback']),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Terima kasih, masukan Anda berhasil disimpan.',
            'data' => $feedback,
        ], 201);
    }
}
```

Update `routes/api.php`:
```php
use App\Http\Controllers\Api\PublicMapFeedbackController;

Route::post('/public-map-feedback', [PublicMapFeedbackController::class, 'store']);
```

Update `app/Http/Controllers/Api/PublicMapAccessLogController.php`:
- In `store()`: return `'access_log_id' => $log->id` in `data`.
- In `index()`: query `PublicMapAccessLog::with(['feedback.business:id,nama_perusahaan'])`, add `total_feedbacks` in meta.

- [ ] **Step 3: Run PHPUnit Tests**

Run: `php artisan test --filter=PublicMapFeedbackTest`
Expected: 4 passed.

- [ ] **Step 4: Commit Task 2**

```bash
git add app/Http/Controllers/Api/PublicMapFeedbackController.php routes/api.php app/Http/Controllers/Api/PublicMapAccessLogController.php tests/Feature/PublicMapFeedbackTest.php
git commit -m "feat: add public map feedback API endpoints and feature tests"
```

---

### Task 3: Admin Rekapitulasi Akses UI & Dummy Seeder

**Files:**
- Modify: `resources/js/types/index.ts`
- Modify: `resources/js/pages/RekapitulasiAksesPage.tsx`
- Modify: `database/seeders/DummyDataSeeder.php`

**Interfaces:**
- TypeScript `PublicMapAccessLog` includes `feedback?: PublicMapFeedback | null`
- Rekapitulasi table displays dedicated "Feedback & Rating" column with rating badge, emoji icon, and popover preview of visitor comment and inspected business.

- [ ] **Step 1: Update TypeScript Types**

```typescript
// resources/js/types/index.ts
export interface PublicMapFeedback {
  id: number;
  public_map_access_log_id: number;
  business_id?: number | null;
  rating: 'very-sad' | 'sad' | 'neutral' | 'happy' | string;
  feedback: string;
  business?: {
    id: number;
    nama_perusahaan?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface PublicMapAccessLog {
  id: number;
  nama: string;
  instansi: string;
  accessed_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
  updated_at?: string;
  feedback?: PublicMapFeedback | null;
}
```

- [ ] **Step 2: Add Dummy Feedback in `DummyDataSeeder.php`**

Seed 3 feedbacks for existing access logs with variety of ratings (`happy`, `neutral`, `sad`).

- [ ] **Step 3: Update `RekapitulasiAksesPage.tsx` with Feedback Column & Preview**

- Add `<TableHead className="h-11 w-[220px]">Feedback & Rating</TableHead>`
- Render rating badge with icon:
  - `happy`: Green badge "Amazing"
  - `neutral`: Blue/Yellow badge "Okay"
  - `sad`: Orange badge "Bad"
  - `very-sad`: Red badge "Terrible"
- Add Popover trigger to view full written feedback text and related business.

- [ ] **Step 4: Commit Task 3**

```bash
git add resources/js/types/index.ts resources/js/pages/RekapitulasiAksesPage.tsx database/seeders/DummyDataSeeder.php
git commit -m "feat: add feedback column and preview to admin rekapitulasi akses page"
```

---

### Task 4: Public Map Frontend Integration (Dual Trigger & API Submission)

**Files:**
- Create: `resources/js/lib/feedbackTriggerUtils.ts`
- Create: `tests/js/feedbackTriggerLogic.test.mjs`
- Modify: `resources/js/pages/PublicMapPage.tsx`

**Interfaces:**
- Dual Trigger logic:
  1. User interacts with marker / detail (`selectedBusiness !== null`).
  2. Timer runs (7000ms).
  3. Panel closed (`prevSelected && !currentSelected`) OR timer finishes -> activates `isFeedbackAvailable = true`.
- Submission:
  - Calls `axios.post('/api/public-map-feedback', { access_log_id: visitor.id, rating, feedback, business_id })`
  - On success: saves session flag, shows toast, closes widget.

- [ ] **Step 1: Write Node Unit Tests in `feedbackTriggerLogic.test.mjs`**

- [ ] **Step 2: Implement `feedbackTriggerUtils.ts`**

- [ ] **Step 3: Run Node Tests**

Run: `node --test tests/js/feedbackTriggerLogic.test.mjs`
Expected: All tests pass.

- [ ] **Step 4: Update `PublicMapPage.tsx`**

Integrate:
- Visitor ID retrieval: `visitor?.id || visitor?.access_log_id`.
- Previous selectedBusiness ref to detect panel closing.
- Dual trigger effect (timer or panel close).
- Floating button & overlaid `FeedbackWidget` card in bottom right.
- Submission handler calling `/api/public-map-feedback`.

- [ ] **Step 5: Run Production Build**

Run: `npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 6: Commit Task 4**

```bash
git add resources/js/lib/feedbackTriggerUtils.ts tests/js/feedbackTriggerLogic.test.mjs resources/js/pages/PublicMapPage.tsx
git commit -m "feat: integrate public map feedback with database submission and dual trigger"
```
