# Public Map Visual Risk Level Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a unified visual risk level system for Public Map Leaflet markers, selected states, legend, search/filters, and detail sidepanels.

**Architecture:** A single utility `riskUtils.ts` standardizes string normalization and risk configurations across 4 levels (`Rendah`, `Menengah Rendah`, `Menengah Tinggi`, `Tinggi`) plus 1 neutral fallback (`Tidak Ada Data`). Map markers use risk colors with selected-state halos, the legend renders responsive color keys, and filters synchronize with backend queries.

**Tech Stack:** React 18, Leaflet / React-Leaflet, Tailwind CSS, Motion/React, Laravel 10 / PHP, Node.js Test Runner.

## Global Constraints

- **Four Risk Categories:** `Rendah` (Green `#22c55e`), `Menengah Rendah` (Yellow `#eab308`), `Menengah Tinggi` (Orange `#f97316`), `Tinggi` (Red `#ef4444`).
- **Neutral Fallback:** Empty/null/undefined/unrecognized values map to `Tidak Ada Data` (Gray `#9ca3af`). Never assume missing data is "Rendah".
- **Selected State:** Risk color fill remains unchanged; selection is indicated via outer SVG halo rings and glow shadows.
- **Single Source of Truth:** `riskUtils.ts` must be consumed by markers, legend, filters, and detail panels.

---

### Task 1: Risk Utility Single Source of Truth (`riskUtils.ts`)

**Files:**
- Create: `resources/js/lib/riskUtils.ts`
- Test: `tests/js/riskUtils.test.mjs`

**Interfaces:**
- Produces: `getRiskConfig(rawRisk?: string | null): RiskConfig`, `RISK_OPTIONS`, `normalizeRiskCategory(rawRisk?: string | null): string`

- [ ] **Step 1: Write Node.js unit tests for risk utility**

```js
// tests/js/riskUtils.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRiskCategory, getRiskConfig } from '../../resources/js/lib/riskUtils.ts';

test('normalizeRiskCategory handles all casing and whitespace variations', () => {
  assert.equal(normalizeRiskCategory('Rendah'), 'Rendah');
  assert.equal(normalizeRiskCategory(' rendah '), 'Rendah');
  assert.equal(normalizeRiskCategory('RENDAH'), 'Rendah');
  assert.equal(normalizeRiskCategory('Menengah Rendah'), 'Menengah Rendah');
  assert.equal(normalizeRiskCategory('MENENGAH RENDAH'), 'Menengah Rendah');
  assert.equal(normalizeRiskCategory('menengah  rendah'), 'Menengah Rendah');
  assert.equal(normalizeRiskCategory('Menengah Tinggi'), 'Menengah Tinggi');
  assert.equal(normalizeRiskCategory('MENENGAH TINGGI'), 'Menengah Tinggi');
  assert.equal(normalizeRiskCategory('Tinggi'), 'Tinggi');
  assert.equal(normalizeRiskCategory('TINGGI'), 'Tinggi');
  assert.equal(normalizeRiskCategory(' tinggi '), 'Tinggi');
});

test('normalizeRiskCategory maps null/empty/unrecognized to Tidak Ada Data', () => {
  assert.equal(normalizeRiskCategory(null), 'Tidak Ada Data');
  assert.equal(normalizeRiskCategory(undefined), 'Tidak Ada Data');
  assert.equal(normalizeRiskCategory(''), 'Tidak Ada Data');
  assert.equal(normalizeRiskCategory('   '), 'Tidak Ada Data');
  assert.equal(normalizeRiskCategory('Unknown Risk'), 'Tidak Ada Data');
});

test('getRiskConfig returns correct hex colors and keys', () => {
  assert.equal(getRiskConfig('Rendah').hexColor, '#22c55e');
  assert.equal(getRiskConfig('Menengah Rendah').hexColor, '#eab308');
  assert.equal(getRiskConfig('Menengah Tinggi').hexColor, '#f97316');
  assert.equal(getRiskConfig('Tinggi').hexColor, '#ef4444');
  assert.equal(getRiskConfig(null).hexColor, '#9ca3af');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/js/riskUtils.test.mjs`  
Expected: FAIL with module/file not found error.

- [ ] **Step 3: Implement `resources/js/lib/riskUtils.ts`**

```ts
export type RiskCategory = 'Rendah' | 'Menengah Rendah' | 'Menengah Tinggi' | 'Tinggi' | 'Tidak Ada Data';

export interface RiskConfig {
  category: RiskCategory;
  key: 'rendah' | 'menengah-rendah' | 'menengah-tinggi' | 'tinggi' | 'none';
  hexColor: string;
  badgeClass: string;
  dotClass: string;
  iconColor: string;
}

export const RISK_OPTIONS = [
  { key: 'rendah', label: 'Rendah', color: '#22c55e', dotClass: 'bg-emerald-500' },
  { key: 'menengah-rendah', label: 'Menengah Rendah', color: '#eab308', dotClass: 'bg-yellow-500' },
  { key: 'menengah-tinggi', label: 'Menengah Tinggi', color: '#f97316', dotClass: 'bg-orange-500' },
  { key: 'tinggi', label: 'Tinggi', color: '#ef4444', dotClass: 'bg-red-500' },
  { key: 'none', label: 'Tidak ada data', color: '#9ca3af', dotClass: 'bg-gray-400' },
] as const;

export function normalizeRiskCategory(rawRisk?: string | null): RiskCategory {
  if (!rawRisk || typeof rawRisk !== 'string') return 'Tidak Ada Data';
  const clean = rawRisk.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!clean) return 'Tidak Ada Data';

  if (clean === 'rendah' || clean === 'sangat rendah') return 'Rendah';
  if (clean === 'menengah rendah') return 'Menengah Rendah';
  if (clean === 'menengah tinggi' || clean === 'menengah') return 'Menengah Tinggi';
  if (clean === 'tinggi' || clean === 'sangat tinggi') return 'Tinggi';

  return 'Tidak Ada Data';
}

export function getRiskConfig(rawRisk?: string | null): RiskConfig {
  const normalized = normalizeRiskCategory(rawRisk);

  switch (normalized) {
    case 'Rendah':
      return {
        category: 'Rendah',
        key: 'rendah',
        hexColor: '#22c55e',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
        dotClass: 'bg-emerald-500',
        iconColor: 'text-emerald-500',
      };
    case 'Menengah Rendah':
      return {
        category: 'Menengah Rendah',
        key: 'menengah-rendah',
        hexColor: '#eab308',
        badgeClass: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30 dark:text-yellow-400',
        dotClass: 'bg-yellow-500',
        iconColor: 'text-yellow-500',
      };
    case 'Menengah Tinggi':
      return {
        category: 'Menengah Tinggi',
        key: 'menengah-tinggi',
        hexColor: '#f97316',
        badgeClass: 'bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400',
        dotClass: 'bg-orange-500',
        iconColor: 'text-orange-500',
      };
    case 'Tinggi':
      return {
        category: 'Tinggi',
        key: 'tinggi',
        hexColor: '#ef4444',
        badgeClass: 'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400',
        dotClass: 'bg-red-500',
        iconColor: 'text-red-500',
      };
    default:
      return {
        category: 'Tidak Ada Data',
        key: 'none',
        hexColor: '#9ca3af',
        badgeClass: 'bg-muted text-muted-foreground border-border/80',
        dotClass: 'bg-gray-400',
        iconColor: 'text-gray-400',
      };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/js/riskUtils.test.mjs`  
Expected: PASS (3 tests pass).

---

### Task 2: CityMapLeaflet Marker Color & Selection Halo (`CityMapLeaflet.tsx`)

**Files:**
- Modify: `resources/js/components/CityMapLeaflet.tsx`

**Interfaces:**
- Consumes: `getRiskConfig` from `../lib/riskUtils`

- [ ] **Step 1: Update SVG Marker Generator in `CityMapLeaflet.tsx`**

Update `customSvgIcon` to accept `(marker: any, isSelected: boolean, isHovered: boolean)`:
- Retrieve `riskConfig = getRiskConfig(marker?.uraian_risiko_proyek)`.
- Set `fillColor = riskConfig.hexColor`.
- When `isSelected`: Include outer SVG halo ring `<circle cx="250" cy="172" r="130" fill="none" stroke="${fillColor}" stroke-width="24" opacity="0.85" />` and glow filter `drop-shadow(0 0 10px ${fillColor}) drop-shadow(0 0 4px #ffffff)`.
- When `isHovered`: Apply `drop-shadow(0 4px 10px ${fillColor}) brightness(1.1); transform: scale(1.08);`.

- [ ] **Step 2: Update Marker renderer loop**

Pass `customSvgIcon(marker, isSelected, isHovered)` in `renderedMarkers`.

---

### Task 3: Responsive Map Risk Legend (`MapRiskLegend.tsx` & `PublicMapPage.tsx`)

**Files:**
- Create: `resources/js/components/ui/MapRiskLegend.tsx`
- Modify: `resources/js/pages/PublicMapPage.tsx`

- [ ] **Step 1: Create `MapRiskLegend.tsx`**

```tsx
import React, { useState } from 'react';
import { Shield, ChevronUp, ChevronDown } from 'lucide-react';
import { RISK_OPTIONS } from '../../lib/riskUtils';
import { cn } from '../../lib/utils';

export function MapRiskLegend() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="fixed bottom-6 left-4 z-[40] pointer-events-auto flex flex-col items-start font-[Inter,sans-serif]">
      <div className="bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-xl overflow-hidden text-xs w-[170px]">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 flex items-center justify-between font-bold text-foreground bg-muted/40 hover:bg-muted/70 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-primary" />
            <span className="text-[11px] uppercase tracking-wider">Tingkat Risiko</span>
          </div>
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {isOpen && (
          <div className="p-2.5 space-y-1.5 border-t border-border/50">
            {RISK_OPTIONS.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', item.dotClass)} />
                <span className="text-[11px] font-medium text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render `MapRiskLegend` inside `PublicMapPage.tsx`**

Import and render `<MapRiskLegend />` inside `PublicMapPage.tsx`.

---

### Task 4: Filter Options & Backend Case-Insensitive Matching

**Files:**
- Modify: `resources/js/components/ui/FilterCombobox.tsx`
- Modify: `app/Repositories/BusinessRepository.php`
- Modify: `resources/js/pages/PublicMapPage.tsx`

- [ ] **Step 1: Update `risikoOptions` in `FilterCombobox.tsx`**

Change `risikoOptions` to:
```ts
export const risikoOptions = ["Rendah", "Menengah Rendah", "Menengah Tinggi", "Tinggi"];
```

- [ ] **Step 2: Update `BusinessRepository.php` risk filter logic**

In `BusinessRepository.php`, map both `uraian_risiko_proyek` and `risiko` request keys to `uraian_risiko_proyek`, and execute case-insensitive `LOWER(TRIM(uraian_risiko_proyek))` matching.

- [ ] **Step 3: Update filter mapping in `PublicMapPage.tsx`**

Ensure `activeFilters` correctly passes `uraian_risiko_proyek` URL parameter when filter type `Risiko` is chosen.

---

### Task 5: Side Panel & Detail Card Integration

**Files:**
- Modify: `resources/js/components/ui/businessPanelUtils.ts`
- Modify: `resources/js/components/ui/BusinessSidePanel.tsx`
- Modify: `resources/js/components/ui/BusinessDetailCard.tsx`

- [ ] **Step 1: Delegate `getSemanticRiskBadge` to `riskUtils.ts`**

In `businessPanelUtils.ts`, update `getSemanticRiskBadge` to use `getRiskConfig` from `riskUtils.ts`.

- [ ] **Step 2: Update `BusinessDetailCard.tsx` to render Risk Badge**

Render `riskInfo` badge in `BusinessDetailCard.tsx` matching `BusinessSidePanel.tsx`.

---

### Task 6: Build Verification & Final Testing

- [ ] **Step 1: Run PHP and Node tests**

Run `php artisan test` and `node --test tests/js/...`.

- [ ] **Step 2: Execute Production Vite Build**

Run `npm run build` and ensure 0 errors.
