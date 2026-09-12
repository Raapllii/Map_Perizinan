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

  return {
    hasCoordinates: true,
    latNum: lat,
    lngNum: lng,
    formattedString: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
  };
}

/**
 * Returns semantic badge classes and level based on risk profile
 */
export function getSemanticRiskBadge(risk: string | null | undefined): SemanticRiskResult {
  if (!risk || typeof risk !== 'string' || !risk.trim()) {
    return {
      label: 'Tidak Ditentukan',
      colorClass: 'bg-muted text-muted-foreground border-border/80',
      level: 'neutral',
    };
  }

  const clean = risk.trim();
  const lower = clean.toLowerCase();

  if (lower.includes('rendah') && !lower.includes('menengah')) {
    return {
      label: clean,
      colorClass: 'bg-success/10 text-success border-success/20',
      level: 'low',
    };
  }

  if (lower.includes('menengah')) {
    return {
      label: clean,
      colorClass: 'bg-warning/10 text-warning border-warning/20',
      level: 'medium',
    };
  }

  if (lower.includes('tinggi')) {
    return {
      label: clean,
      colorClass: 'bg-danger/10 text-danger border-danger/20',
      level: 'high',
    };
  }

  return {
    label: clean,
    colorClass: 'bg-primary/10 text-primary border-primary/20',
    level: 'neutral',
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
