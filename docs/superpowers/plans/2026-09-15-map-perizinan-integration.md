# End-to-End Map PB Integration & QA Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect all existing features (Public Map, Visitor Identification, Admin Rekapitulasi Akses, Data Usaha + 10 generic indicators) into a seamless, robust, and professional end-to-end flow without breaking any existing features.

**Architecture:** Laravel 9 + PostgreSQL (PostGIS) backend with React 18, TypeScript, Tailwind CSS, Leaflet/React Leaflet frontend. Strict separation between public map visitor access and authenticated admin endpoints, robust handling of nullable generic indicators, and zero false fallbacks.

**Tech Stack:** Laravel, PostgreSQL, React 18, TypeScript, Vite, Tailwind CSS, Leaflet, PHPUnit.

## Global Constraints

- Never break existing map features: `hoveredBusiness` and `selectedBusiness` remain completely decoupled.
- Generic indicators (`indicator_1` .. `indicator_10`) remain nullable, optional, and not tied to any single domain. Empty values submitted as `null`.
- Unique visitor KPI must count distinct `nama + instansi` combinations (e.g. Andi — DPMPTSP vs Andi — Dinas PU are 2 distinct visitors).
- Never expose IP or User Agent in public endpoints or table UI.
- No false fallbacks (e.g. no `ip_address || "127.0.0.1"`). Missing data displays `-`.
- All tests and TypeScript builds must pass with zero errors.

---

### Task 1: Backend Security Hardening & Unique Visitor Metric Fix

**Files:**
- Modify: `app/Http/Controllers/Api/PublicMapAccessLogController.php`
- Modify: `tests/Feature/PublicMapAccessTest.php`

**Interfaces:**
- Consumes: `POST /api/public-map-access`, `GET /api/admin/public-map-access-logs`
- Produces: Safe public response (`id`, `nama`, `instansi`, `accessed_at`) without IP/User Agent; `meta.total_visitors` accurately based on distinct `(nama, instansi)`.

- [ ] **Step 1: Write the failing tests in `PublicMapAccessTest.php`**

```php
    public function test_unique_visitor_counts_distinct_nama_plus_instansi_combination()
    {
        $user = User::factory()->create(['role' => 'Administrator']);

        // Andi in DPMPTSP
        PublicMapAccessLog::create(['nama' => 'Andi', 'instansi' => 'DPMPTSP', 'accessed_at' => now()]);
        // Andi in Dinas PU (different entity)
        PublicMapAccessLog::create(['nama' => 'Andi', 'instansi' => 'Dinas PU', 'accessed_at' => now()]);
        // Repeat access by Andi DPMPTSP
        PublicMapAccessLog::create(['nama' => 'Andi', 'instansi' => 'DPMPTSP', 'accessed_at' => now()]);

        $response = $this->actingAs($user)->getJson('/api/admin/public-map-access-logs');

        $response->assertStatus(200);
        $this->assertEquals(3, $response->json('meta.total_access'));
        $this->assertEquals(2, $response->json('meta.total_visitors'));
    }

    public function test_public_endpoint_does_not_expose_ip_or_user_agent()
    {
        $response = $this->postJson('/api/public-map-access', [
            'nama' => 'Siti Rahma',
            'instansi' => 'Universitas X',
        ]);

        $response->assertStatus(201);
        $this->assertArrayNotHasKey('ip_address', $response->json('data'));
        $this->assertArrayNotHasKey('user_agent', $response->json('data'));
    }
```

- [ ] **Step 2: Run test to verify failure**

Run: `php vendor/phpunit/phpunit/phpunit tests/Feature/PublicMapAccessTest.php`
Expected: FAIL (because distinct currently only counts `nama` which yields 1 instead of 2, and `ip_address` is exposed in public response).

- [ ] **Step 3: Update `PublicMapAccessLogController.php`**

Fix `total_visitors` calculation using `selectRaw('LOWER(TRIM(nama)) as nama, LOWER(TRIM(instansi)) as instansi')->distinct()->count()`, and sanitize `store` response:

```php
        return response()->json([
            'status' => 'success',
            'message' => 'Akses Peta PB berhasil dicatat.',
            'data' => [
                'id' => $log->id,
                'nama' => $log->nama,
                'instansi' => $log->instansi,
                'accessed_at' => $log->accessed_at,
            ],
        ], 201);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php vendor/phpunit/phpunit/phpunit tests/Feature/PublicMapAccessTest.php`
Expected: PASS (all tests pass).

---

### Task 2: Public Map Flow & Session Resilience

**Files:**
- Modify: `resources/js/pages/PublicMapPage.tsx`
- Modify: `resources/js/components/PublicAccessModal.tsx`

**Interfaces:**
- Consumes: `sessionStorage.getItem('public_map_visitor')`, `onSuccess`, `onGanti`
- Produces: Resilient visitor session guard, marker fetch gating, clean identity replacement flow.

- [ ] **Step 1: Harden visitor validation in `PublicMapPage.tsx`**

Verify that `visitor` stored in `sessionStorage` has both non-empty `nama` and `instansi`. If invalid or corrupt, clear it and open modal. Ensure markers are never fetched when `!visitor`.

- [ ] **Step 2: Harden "Ganti Identitas" flow**

When user clicks "Ganti", remove `sessionStorage`, clear `visitor`, clear `markers`, and set `isAccessModalOpen(true)` so map cannot be accessed without new logging.

- [ ] **Step 3: Reset error and state on modal open in `PublicAccessModal.tsx`**

Ensure that whenever the modal opens, stale error messages are cleared. Prevent submitting empty/whitespace values.

---

### Task 3: Data Usaha 10 Indicators End-to-End Alignment

**Files:**
- Modify: `resources/js/types/index.ts`
- Modify: `resources/js/components/DataUsahaDetailModal.tsx`
- Modify: `resources/js/components/ui/BusinessSidePanel.tsx`

**Interfaces:**
- Consumes: `Business` interface with `indicator_1` .. `indicator_10`
- Produces: Type-safe indicator access, strict `-` formatting for empty/null/undefined/NaN, and display in both Detail Modal and Side Panel.

- [ ] **Step 1: Update `types/index.ts`**

Add dynamic indicator key signature `[key: `indicator_${number}`]: string | null | undefined;` to `Business`.

- [ ] **Step 2: Update `DataUsahaDetailModal.tsx`**

Ensure `DetailItem` displays `-` if value is `null`, `undefined`, `""`, or `NaN`.

- [ ] **Step 3: Update `BusinessSidePanel.tsx`**

Add an "Indikator Tambahan" section if any indicator exists on the business, displaying them with clean fallback formatting.

---

### Task 4: Verification & End-to-End QA Testing

**Files:**
- Run: `php vendor/phpunit/phpunit/phpunit`
- Run: `cmd.exe /c "npm run build"`

- [ ] **Step 1: Run full PHPUnit suite**
Verify all tests pass (0 failures).

- [ ] **Step 2: Run npm run build**
Verify TypeScript and Vite bundle without errors.

- [ ] **Step 3: Manual QA verification matrix (TEST 1 to TEST 15)**
Execute and document all 15 scenarios specified in the master prompt.
