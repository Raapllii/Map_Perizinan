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
