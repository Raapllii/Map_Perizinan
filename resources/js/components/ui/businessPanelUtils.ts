export interface CoordinateValidationResult {
  hasCoordinates: boolean;
  latNum: number | null;
  lngNum: number | null;
  formattedString: string | null;
}

export interface SemanticRiskResult {
  label: string;
  colorClass: string;
  level: 'low' | 'medium' | 'high' | 'neutral';
}

/**
 * Validates latitude and longitude coordinates.
 * Returns valid = true ONLY if both coordinates are valid finite numbers and not (0, 0).
 */
export function validateCoordinates(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined
): CoordinateValidationResult {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return {
      hasCoordinates: false,
      latNum: null,
      lngNum: null,
      formattedString: null,
    };
  }

  const latStr = String(latitude).trim();
  const lngStr = String(longitude).trim();

  if (latStr === '' || lngStr === '') {
    return {
      hasCoordinates: false,
      latNum: null,
      lngNum: null,
      formattedString: null,
    };
  }

  const lat = Number(latStr);
  const lng = Number(lngStr);

  if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
    return {
      hasCoordinates: false,
      latNum: null,
      lngNum: null,
      formattedString: null,
    };
  }

  // Never treat (0, 0) as valid coordinates
  if (lat === 0 && lng === 0) {
    return {
      hasCoordinates: false,
      latNum: null,
      lngNum: null,
      formattedString: null,
    };
  }

  // Validate standard geographic coordinates: latitude in [-90, 90], longitude in [-180, 180]
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      hasCoordinates: false,
      latNum: null,
      lngNum: null,
      formattedString: null,
    };
  }

  return {
    hasCoordinates: true,
    latNum: lat,
    lngNum: lng,
    formattedString: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
  };
}

import { getRiskConfig } from '../../lib/riskUtils.ts';

/**
 * Returns semantic badge classes and level based on risk profile
 */
export function getSemanticRiskBadge(risk: string | null | undefined): SemanticRiskResult {
  const config = getRiskConfig(risk);
  let level: 'low' | 'medium' | 'high' | 'neutral' = 'neutral';
  if (config.key === 'rendah') level = 'low';
  else if (config.key === 'menengah-rendah' || config.key === 'menengah-tinggi') level = 'medium';
  else if (config.key === 'tinggi') level = 'high';

  return {
    label: config.category,
    colorClass: config.badgeClass,
    level,
  };
}

/**
 * Sanitizes and falls back empty values
 */
export function formatFallback(value: any, fallback = '-'): string {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str === '' ? fallback : str;
}

export function formatCurrency(val: any): string {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(d);
  } catch(e) {
    return dateStr;
  }
}

export interface BusinessIndicatorItem {
  id: string | number;
  judul: string;
  nilai: string;
  sort_order?: number;
}

/**
 * Extracts non-empty indicators from business object.
 * Prefers relational business.indicators (sorted by sort_order).
 * Falls back to legacy indicator_1 .. indicator_10 if relational indicators are empty.
 */
export function extractBusinessIndicators(business: any): BusinessIndicatorItem[] {
  if (!business) return [];

  // 1. Relational Indicators
  if (Array.isArray(business.indicators) && business.indicators.length > 0) {
    const sorted = [...business.indicators].sort((a, b) => {
      const orderA = a.sort_order ?? a.id ?? 0;
      const orderB = b.sort_order ?? b.id ?? 0;
      return orderA - orderB;
    });

    return sorted
      .filter((ind: any) => ind && ind.judul && ind.nilai !== null && ind.nilai !== undefined && String(ind.nilai).trim() !== '')
      .map((ind: any) => ({
        id: ind.id ?? ind.judul,
        judul: String(ind.judul).trim(),
        nilai: String(ind.nilai).trim(),
        sort_order: ind.sort_order,
      }));
  }

  // 2. Legacy Fallback (indicator_1 .. indicator_10)
  const legacyItems: BusinessIndicatorItem[] = [];
  for (let n = 1; n <= 10; n++) {
    const val = business[`indicator_${n}`];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      legacyItems.push({
        id: `legacy_${n}`,
        judul: `Indikator ${n}`,
        nilai: String(val).trim(),
        sort_order: n,
      });
    }
  }

  return legacyItems;
}
