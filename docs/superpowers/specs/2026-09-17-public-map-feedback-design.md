# Design Document: Public Map Feedback & Database Integration with Access Log

**Date:** 2026-09-17  
**Status:** Revised & Approved for Full-Stack Implementation  
**Target:** End-to-end Feedback System connecting Public Map, Laravel Database, and Admin Rekapitulasi Akses  

---

## 1. Goal and Objectives

Integrate the existing `FeedbackWidget` (`resources/js/components/ui/feedback.tsx`) into the Public Map (`PublicMapPage.tsx`), connect it to the Laravel database with a foreign key relationship to `PublicMapAccessLog` (`access_log_id`), and display the visitor feedback in the Admin Rekapitulasi Akses page (`RekapitulasiAksesPage.tsx`).

### Strict Constraints:
- **Zero Modifications to `feedback.tsx`:** Keep UI, emoji rating, animations, and markdown preview 100% intact.
- **Database Persistence Required:** Feedback must NOT only be stored in client storage; it must be stored in the database (`public_map_feedbacks` table) and linked to `public_map_access_logs`.
- **Relational Integrity:** Feedback has `public_map_access_log_id` (foreign key) and optional `business_id`.
- **Trigger Behavior:**
  - Initial map entry / pan / zoom / hover: No feedback.
  - Armed when user clicks marker / opens business detail.
  - Feedback offered when: **Close detail ATAU sudah melewati waktu penggunaan tertentu** (default: 7 seconds).
  - Floating button in bottom right opens the `FeedbackWidget` card.
  - Submitting sends `POST /api/public-map-feedback`.
- **Admin Visibility:** Rekapitulasi Akses Admin displays visitor ratings & written feedback linked to each access log.

---

## 2. End-to-End System Flow

```text
Visitor fills Nama + Instansi
        │
        ▼
POST /api/public-map-access
        │
        ▼
public_map_access_logs record created (returns id as access_log_id)
        │
        ▼
Stored in visitor session state { id: 123, nama: "...", instansi: "..." }
        │
        ▼
User interacts with Public Map (Search / Zoom / Click Marker)
        │
        ▼
User opens Business Details (selectedBusiness !== null)
        │
        ▼
Trigger condition met:
[Panel Closed OR 7s Timeout Reached]
        │
        ▼
Floating "Feedback" Button appears in bottom-right
        │
        ▼ (User clicks "Feedback")
Overlaid Card opens displaying FeedbackWidget
        │
        ▼ (User selects Rating & types Feedback -> "Send Feedback")
POST /api/public-map-feedback
{
  access_log_id: visitor.id,
  business_id: selectedBusiness?.id,
  rating: "happy",
  feedback: "..."
}
        │
        ▼
Database: Record inserted into public_map_feedbacks linked to public_map_access_logs
        │
        ▼
Frontend: Shows Thank-You Toast, marks session submitted, hides prompt
        │
        ▼
Admin opens /admin/rekapitulasi-akses:
GET /api/admin/public-map-access-logs (eager loads feedback)
        │
        ▼
Admin sees Rating badge & reads Visitor Feedback in Table Row
```

---

## 3. Database Schema & Architecture

### 3.1 Migration: `create_public_map_feedbacks_table`
- `id`: `bigIncrements`
- `public_map_access_log_id`: `foreignId('public_map_access_log_id')->constrained('public_map_access_logs')->cascadeOnDelete()`
- `business_id`: `foreignId('business_id')->nullable()->constrained('businesses')->nullOnDelete()`
- `rating`: `string(50)` (`very-sad`, `sad`, `neutral`, `happy`)
- `feedback`: `text`
- `timestamps`: `created_at`, `updated_at`

### 3.2 Eloquent Models
- **`App\Models\PublicMapFeedback`**:
  - `$guarded = []`
  - `belongsTo(PublicMapAccessLog::class, 'public_map_access_log_id')`
  - `belongsTo(Business::class, 'business_id')`
- **`App\Models\PublicMapAccessLog`**:
  - `hasOne(PublicMapFeedback::class, 'public_map_access_log_id')`

---

## 4. API Endpoints

### 4.1 `POST /api/public-map-access`
- Ensure returned response explicitly provides `access_log_id` alongside `id`:
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "access_log_id": 1,
      "nama": "...",
      "instansi": "..."
    }
  }
  ```

### 4.2 `POST /api/public-map-feedback`
- Controller: `App\Http\Controllers\Api\PublicMapFeedbackController@store`
- Validation:
  - `access_log_id`: `required|integer|exists:public_map_access_logs,id`
  - `rating`: `required|string|in:very-sad,sad,neutral,happy`
  - `feedback`: `required|string|min:2|max:3000`
  - `business_id`: `nullable|integer|exists:businesses,id`
- Returns:
  ```json
  {
    "status": "success",
    "message": "Terima kasih, masukan Anda berhasil disimpan.",
    "data": { ... }
  }
  ```

### 4.3 `GET /api/admin/public-map-access-logs`
- Update query in `PublicMapAccessLogController@index`:
  - `PublicMapAccessLog::with(['feedback.business:id,nama_perusahaan'])`
  - Returns `feedback` nested object in each log row.
  - In `meta`: include `total_feedbacks` count and satisfaction breakdown.

---

## 5. Frontend Public Map (`PublicMapPage.tsx`)
- Reads `visitor.access_log_id || visitor.id`.
- Tracks interaction:
  - When `selectedBusiness` is selected, `hasInteracted` becomes `true`.
  - Countdown timer runs (7 seconds).
  - If user closes panel before timer finishes (`selectedBusiness` becomes null after being set), feedback availability triggers immediately.
- Floating button in bottom right:
  - Clicking toggles the overlaid `FeedbackWidget` card above it.
  - When submitted:
    - Calls `axios.post('/api/public-map-feedback', ...)`.
    - On success: marks session submitted, displays toast `"Terima kasih atas masukan dan penilaian Anda!"`, closes card.
    - On failure: displays error toast.

---

## 6. Admin Rekapitulasi Akses (`RekapitulasiAksesPage.tsx`)
- Adds a dedicated column in the table: **Feedback & Penilaian**.
- Rows with feedback display:
  - Rating Badge with icon & label (e.g. 🌟 Amazing / 🙂 Okay / 🙁 Bad / 😢 Terrible).
  - Popover / preview to read the full visitor feedback text and the inspected business name (if any).
- Rows without feedback display muted `-` or `Belum ada`.
- KPI StatCard adds "Total Feedback Masuk".

---

## 7. Verification Strategy
1. **Automated Feature Tests (PHPUnit):** `tests/Feature/PublicMapFeedbackTest.php`
   - Store feedback valid request.
   - Validation failures (missing fields, invalid foreign key).
   - Relationship check between log and feedback.
   - Admin access log index returns eager-loaded feedback.
2. **Automated Frontend Logic Tests:** `node --test tests/js/feedbackTriggerLogic.test.mjs`
3. **Build Check:** `npm run build`
