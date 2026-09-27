import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRiskCategory, getRiskConfig, RISK_OPTIONS } from '../../resources/js/lib/riskUtils.ts';
import { getSemanticRiskBadge } from '../../resources/js/components/ui/businessPanelUtils.ts';

test('QA-TC-01: Risk Category Normalization - Rendah (Green #22c55e)', () => {
  const inputs = ['Rendah', ' rendah ', 'RENDAH', 'Sangat Rendah', 'sangat rendah'];
  for (const input of inputs) {
    const config = getRiskConfig(input);
    assert.equal(config.category, 'Rendah', `Input "${input}" should normalize to Rendah`);
    assert.equal(config.hexColor, '#22c55e', `Input "${input}" should have hex #22c55e`);
    assert.equal(config.key, 'rendah');
  }
});

test('QA-TC-02: Risk Category Normalization - Menengah Rendah (Yellow #eab308)', () => {
  const inputs = ['Menengah Rendah', 'MENENGAH RENDAH', 'menengah  rendah', ' Menengah Rendah '];
  for (const input of inputs) {
    const config = getRiskConfig(input);
    assert.equal(config.category, 'Menengah Rendah', `Input "${input}" should normalize to Menengah Rendah`);
    assert.equal(config.hexColor, '#eab308', `Input "${input}" should have hex #eab308`);
    assert.equal(config.key, 'menengah-rendah');
  }
});

test('QA-TC-03: Risk Category Normalization - Menengah Tinggi (Orange #f97316)', () => {
  const inputs = ['Menengah Tinggi', 'MENENGAH TINGGI', 'menengah  tinggi', 'Menengah'];
  for (const input of inputs) {
    const config = getRiskConfig(input);
    assert.equal(config.category, 'Menengah Tinggi', `Input "${input}" should normalize to Menengah Tinggi`);
    assert.equal(config.hexColor, '#f97316', `Input "${input}" should have hex #f97316`);
    assert.equal(config.key, 'menengah-tinggi');
  }
});

test('QA-TC-04: Risk Category Normalization - Tinggi (Red #ef4444)', () => {
  const inputs = ['Tinggi', 'TINGGI', ' tinggi ', 'Sangat Tinggi', 'sangat tinggi'];
  for (const input of inputs) {
    const config = getRiskConfig(input);
    assert.equal(config.category, 'Tinggi', `Input "${input}" should normalize to Tinggi`);
    assert.equal(config.hexColor, '#ef4444', `Input "${input}" should have hex #ef4444`);
    assert.equal(config.key, 'tinggi');
  }
});

test('QA-TC-05: Fallback Handling for Null/Undefined/Empty/Unrecognized (Gray #9ca3af)', () => {
  const inputs = [null, undefined, '', '   ', 'Unknown Risk', 'XYZ 123'];
  for (const input of inputs) {
    const config = getRiskConfig(input);
    assert.equal(config.category, 'Tidak Ada Data', `Input "${input}" must fall back to Tidak Ada Data`);
    assert.equal(config.hexColor, '#9ca3af', `Input "${input}" must have gray hex #9ca3af`);
    assert.equal(config.key, 'none');
    assert.notEqual(config.category, 'Rendah', `Input "${input}" must NEVER default to Rendah`);
  }
});

test('QA-TC-06: Single Source of Truth Alignment - businessPanelUtils vs riskUtils', () => {
  const testCases = ['Rendah', 'Menengah Rendah', 'Menengah Tinggi', 'Tinggi', null];
  for (const tc of testCases) {
    const directConfig = getRiskConfig(tc);
    const badgeResult = getSemanticRiskBadge(tc);
    assert.equal(badgeResult.label, directConfig.category);
    assert.equal(badgeResult.colorClass, directConfig.badgeClass);
  }
});

test('QA-TC-07: Risk Category Structure Consistency', () => {
  const categories = RISK_OPTIONS.filter(o => o.key !== 'none').map(o => o.label);
  assert.deepEqual(
    categories,
    ['Rendah', 'Menengah Rendah', 'Menengah Tinggi', 'Tinggi'],
    'RISK_OPTIONS active categories must contain exactly the 4 standard risk categories'
  );
  assert.equal(RISK_OPTIONS.length, 5, 'RISK_OPTIONS must include 4 categories + 1 neutral fallback');
});
