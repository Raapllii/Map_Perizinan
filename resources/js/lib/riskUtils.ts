/**
 * Single Source of Truth for Visual Risk Level Mapping
 */

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
