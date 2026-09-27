# Public Map Visual Risk Level System Design

**Date:** 2026-09-22  
**Status:** Approved  
**Scope:** Public Map (`PublicMapPage.tsx`, `CityMapLeaflet.tsx`, `FilterCombobox.tsx`, `BusinessSidePanel.tsx`, `BusinessDetailCard.tsx`, `BusinessRepository.php`)

---

## 1. Executive Summary

This design specification establishes a single-source-of-truth visual risk level system across the Public Map GIS application. Every business marker, detail panel, preview card, legend item, and risk filter will share an identical color mapping and categorization system.

---

## 2. Core Requirements & Classification

### 2.1 Four Operational Risk Levels + Neutral Fallback
The system standardizes exactly 4 risk categories plus 1 neutral fallback:

1. **Rendah** (🟢 `#22c55e` / Emerald Green)
2. **Menengah Rendah** (🟡 `#eab308` / Yellow)
3. **Menengah Tinggi** (🟠 `#f97316` / Orange)
4. **Tinggi** (🔴 `#ef4444` / Red)
5. **Tidak Ada Data** (⚪ `#9ca3af` / Neutral Gray)

> **Rule:** Any missing, `null`, `undefined`, empty string, whitespace, or unrecognized string value **MUST** fall back to `Tidak Ada Data` (Gray). Missing data must never be treated as "Rendah".

---

## 3. Architecture & Single Source of Truth Utility

### 3.1 Utility Specification (`resources/js/lib/riskUtils.ts`)
A dedicated utility function `getRiskConfig(rawRisk?: string | null)` will be created as the sole mapping mechanism.

#### Normalization Logic:
- Trim leading/trailing whitespace and collapse internal duplicate spaces.
- Convert string to lowercase for robust case-insensitive comparison.
- Match exact normalized strings:
  - `"rendah"` (excluding `"menengah rendah"`) $\rightarrow$ `Rendah`
  - `"menengah rendah"` $\rightarrow$ `Menengah Rendah`
  - `"menengah tinggi"` $\rightarrow$ `Menengah Tinggi`
  - `"tinggi"` (excluding `"menengah tinggi"`) $\rightarrow$ `Tinggi`
  - Everything else / empty / null $\rightarrow$ `Tidak Ada Data`

#### Output Interface:
```ts
export interface RiskConfig {
  category: 'Rendah' | 'Menengah Rendah' | 'Menengah Tinggi' | 'Tinggi' | 'Tidak Ada Data';
  key: 'rendah' | 'menengah-rendah' | 'menengah-tinggi' | 'tinggi' | 'none';
  hexColor: string;
  badgeClass: string;
  dotClass: string;
  iconColor: string;
}
```

---

## 4. Map Component Integration (`CityMapLeaflet.tsx`)

### 4.1 Individual Marker Visualization
- Markers obtain their fill color strictly from `getRiskConfig(marker.uraian_risiko_proyek).hexColor`.
- The SVG pin shape remains consistent across all markers to preserve clean GIS visual hierarchy.

### 4.2 Selected State Handling
- When a marker is selected, **ITS RISK COLOR DOES NOT CHANGE**.
- An outer halo ring `<circle cx="250" cy="172" r="140" fill="none" stroke="${riskConfig.hexColor}" stroke-width="26" opacity="0.9" />` and drop-shadow glow filter are applied to indicate active selection.

### 4.3 Hover State Handling
- When a marker is hovered, **ITS RISK COLOR DOES NOT CHANGE**.
- Scale filter (`transform: scale(1.1)`) and brightness enhancement are applied.

### 4.4 Marker Clustering
- Leaflet marker clustering logic remains unmodified.
- Cluster counts and group bubbles operate on standard neutral cluster styles; when zoomed in, individual risk markers render with their respective risk colors.

---

## 5. Map Risk Legend (`resources/js/components/ui/MapRiskLegend.tsx`)

- A compact, responsive overlay positioned cleanly on the Public Map.
- Supports collapsible Open / Close states to prevent viewport obstruction on mobile devices (360px–430px) and high-resolution displays (1024px–1920px).
- Lists all 4 risk levels with corresponding colored indicators plus the neutral `Tidak ada data` item.

---

## 6. Filter Integration (`FilterCombobox.tsx` & `PublicMapPage.tsx`)

- `risikoOptions` in `FilterCombobox.tsx` updated to `["Rendah", "Menengah Rendah", "Menengah Tinggi", "Tinggi"]`.
- `PublicMapPage.tsx` passes risk filter choices to API parameter `uraian_risiko_proyek`.

---

## 7. Backend Query Enhancements (`BusinessRepository.php`)

- Map `risiko` request key to `uraian_risiko_proyek`.
- Use case-insensitive PostgreSQL query filter `LOWER(TRIM(uraian_risiko_proyek))` when filtering by risk level.

---

## 8. Verification Strategy

1. **Automated Unit & Feature Tests**:
   - PHP Unit tests for API risk filtering.
   - Node JS tests for string normalization in `riskUtils.ts`.
2. **TypeScript & Production Build**:
   - `npm run build` execution with 0 compilation errors.
