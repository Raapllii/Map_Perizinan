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
