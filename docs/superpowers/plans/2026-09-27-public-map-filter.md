# Public Map Filter (Risiko, Kecamatan, Kelurahan, Kategori) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a responsive, 4-field cascading filter popover (Tingkat Risiko, Kecamatan, Kelurahan/Desa, Kategori Usaha) for Public Map, integrated seamlessly with existing backend APIs, Leaflet map markers, clustering, and search.

**Architecture:** 
Update `FilterCombobox.tsx` to render a standard, high-quality popover card containing 4 dropdown selects for Tingkat Risiko (with visual risk color dots), Kecamatan, Kelurahan/Desa (cascading dependent on selected Kecamatan), and Kategori Usaha. The filter state is synchronized with `PublicMapPage.tsx` which constructs the `/api/businesses` request using existing backend parameters (`uraian_risiko_proyek`, `kecamatan_usaha`, `kelurahan_usaha`, `judul_kbli`, `search`, `bounds`, `zoom`).

**Tech Stack:** React, TypeScript, TailwindCSS, Radix Popover (`@radix-ui/react-popover`), Axios, Leaflet / `CityMapLeaflet`, Laravel API.

## Global Constraints
- **Filter Count & Fields:** EXACTLY 4 main filters (Tingkat Risiko, Kecamatan, Kelurahan/Desa, Kategori Usaha). Do NOT add Status Perizinan.
- **Cascading Logic:** Kelurahan options must update based on selected Kecamatan. If Kecamatan changes or resets, Kelurahan automatically resets to "Semua Kelurahan/Desa".
- **Risk Visuals:** Use existing `getRiskConfig` helper from `riskUtils.ts` to display colored risk status dots in the Risiko dropdown.
- **Badge Count:** Button shows active filter count `[ ⚙ Filter (N) ]` (excluding "Semua..." defaults).
- **Map & Search Integrity:** Maintain Leaflet map instance, marker clustering, zoom thresholds, bounds logic, search query, Access Log, and Feedback popover without regression.

---

### Task 1: Update `FilterCombobox.tsx` UI & Cascading Logic

**Files:**
- Modify: `resources/js/components/ui/FilterCombobox.tsx`
- Test: `tests/js/filterComboboxLogic.test.mjs`

**Interfaces:**
- Consumes: `/api/locations/kecamatan`, `/api/locations/kelurahan?kecamatan_usaha=...`, `/api/categories`
- Produces: `FilterCombobox` component with `onChange?: (filterState: PublicMapFilterState) => void` where `PublicMapFilterState` is:
  ```ts
  export interface PublicMapFilterState {
    risiko: string; // 'Semua' | 'Rendah' | 'Menengah Rendah' | 'Menengah Tinggi' | 'Tinggi'
    kecamatan: string; // 'Semua' | string
    kelurahan: string; // 'Semua' | string
    kategori: string; // 'Semua' | string
  }
  ```

- [ ] **Step 1: Create unit test for filter state transformation & cascading logic**

Create file `tests/js/filterComboboxLogic.test.mjs`:
```js
import test from 'node.test';
import assert from 'node.assert/strict';

function computeActiveFilterCount(filterState) {
  let count = 0;
  if (filterState.risiko && filterState.risiko !== 'Semua') count++;
  if (filterState.kecamatan && filterState.kecamatan !== 'Semua') count++;
  if (filterState.kelurahan && filterState.kelurahan !== 'Semua') count++;
  if (filterState.kategori && filterState.kategori !== 'Semua') count++;
  return count;
}

function handleKecamatanChange(prevFilterState, newKecamatan) {
  return {
    ...prevFilterState,
    kecamatan: newKecamatan,
    kelurahan: 'Semua' // Cascading reset
  };
}

test('computeActiveFilterCount returns 0 for all default "Semua"', () => {
  const state = { risiko: 'Semua', kecamatan: 'Semua', kelurahan: 'Semua', kategori: 'Semua' };
  assert.equal(computeActiveFilterCount(state), 0);
});

test('computeActiveFilterCount counts active filters accurately', () => {
  const state = { risiko: 'Tinggi', kecamatan: 'Kecamatan Barat', kelurahan: 'Semua', kategori: 'Semua' };
  assert.equal(computeActiveFilterCount(state), 2);
});

test('handleKecamatanChange resets kelurahan to "Semua"', () => {
  const initial = { risiko: 'Tinggi', kecamatan: 'Kecamatan Barat', kelurahan: 'Desa C', kategori: 'Semua' };
  const updated = handleKecamatanChange(initial, 'Kecamatan Timur');
  assert.deepEqual(updated, {
    risiko: 'Tinggi',
    kecamatan: 'Kecamatan Timur',
    kelurahan: 'Semua',
    kategori: 'Semua'
  });
});
```

- [ ] **Step 2: Run unit test to verify it passes**

Run: `node --test tests/js/filterComboboxLogic.test.mjs`
Expected: PASS

- [ ] **Step 3: Update `FilterCombobox.tsx` with clean 4-filter UI & API hooks**

Update `resources/js/components/ui/FilterCombobox.tsx` to:
1. Export `PublicMapFilterState` and default state `{ risiko: 'Semua', kecamatan: 'Semua', kelurahan: 'Semua', kategori: 'Semua' }`.
2. Fetch `kecamatanList` (`/api/locations/kecamatan`) and `kategoriList` (`/api/categories`) on mount using Axios.
3. Fetch `kelurahanList` (`/api/locations/kelurahan?kecamatan_usaha=${selectedKecamatan}`) whenever `selectedKecamatan` changes.
4. Render 4 label-select groups:
   - **Tingkat Risiko:** "Semua Risiko", "Risiko Rendah", "Risiko Menengah Rendah", "Risiko Menengah Tinggi", "Risiko Tinggi". Display colored dot for risk options using `getRiskConfig(r).dotClass`.
   - **Kecamatan:** "Semua Kecamatan" + dynamic `kecamatanList`.
   - **Kelurahan/Desa:** "Semua Kelurahan/Desa" + dynamic `kelurahanList`.
   - **Kategori Usaha:** "Semua Kategori" + dynamic `kategoriList`.
5. Include "Terapkan" button to emit updated filters and "Reset" button to reset all 4 selections to "Semua".
6. Badge counter on trigger button `[ ⚙ Filter (N) ]` showing active non-"Semua" filters.

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit` or `npm run build`
Expected: PASS

---

### Task 2: Integrate Filter State with Map Data Fetching in `PublicMapPage.tsx` & `mini-navbar.tsx`

**Files:**
- Modify: `resources/js/components/ui/mini-navbar.tsx`
- Modify: `resources/js/pages/PublicMapPage.tsx`

**Interfaces:**
- `Navbar` receives `onFilterChange?: (filters: PublicMapFilterState) => void`
- `PublicMapPage` passes `activeFilters` as backend parameters to `/api/businesses`:
  - `uraian_risiko_proyek`
  - `kecamatan_usaha`
  - `kelurahan_usaha`
  - `judul_kbli`

- [ ] **Step 1: Update `mini-navbar.tsx` to forward `PublicMapFilterState`**

Ensure `FilterCombobox` in `mini-navbar.tsx` receives `onFilterChange` and passes it through both desktop nav and mobile menu.

- [ ] **Step 2: Update `PublicMapPage.tsx` filter handling & empty state overlay**

1. Define `PublicMapFilterState` in `PublicMapPage.tsx`.
2. Map `activeFilters` to `/api/businesses` request params:
   - `if (activeFilters.risiko && activeFilters.risiko !== 'Semua') url += '&uraian_risiko_proyek=' + encodeURIComponent(activeFilters.risiko)`
   - `if (activeFilters.kecamatan && activeFilters.kecamatan !== 'Semua') url += '&kecamatan_usaha=' + encodeURIComponent(activeFilters.kecamatan)`
   - `if (activeFilters.kelurahan && activeFilters.kelurahan !== 'Semua') url += '&kelurahan_usaha=' + encodeURIComponent(activeFilters.kelurahan)`
   - `if (activeFilters.kategori && activeFilters.kategori !== 'Semua') url += '&judul_kbli=' + encodeURIComponent(activeFilters.kategori)`
3. Render user-friendly empty state overlay when `markers.length === 0` and active filter count > 0:
   - Include a "Reset Filter" button in the overlay that calls `resetFilters()`.

- [ ] **Step 3: Run full JS tests and backend tests**

Run:
`cmd /c node --test tests/js/filterComboboxLogic.test.mjs tests/js/feedbackTriggerLogic.test.mjs`
`cmd /c php artisan test --filter=PublicMapFeedbackTest`
Expected: ALL PASS

- [ ] **Step 4: Run Vite build**

Run: `npm run build`
Expected: SUCCESS with zero compilation errors.
