import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateCoordinates, getSemanticRiskBadge, formatFallback } from '../../resources/js/components/ui/businessPanelUtils.ts';

describe('validateCoordinates', () => {
  test('returns false for null or undefined coordinates', () => {
    assert.deepEqual(validateCoordinates(null, null), {
      hasCoordinates: false,
      latNum: null,
      lngNum: null,
      formattedString: null,
    });
    assert.deepEqual(validateCoordinates(undefined, undefined), {
      hasCoordinates: false,
      latNum: null,
      lngNum: null,
      formattedString: null,
    });
  });

  test('returns false for 0, 0 coordinates (never show 0 as valid)', () => {
    assert.equal(validateCoordinates(0, 0).hasCoordinates, false);
    assert.equal(validateCoordinates('0', '0').hasCoordinates, false);
    assert.equal(validateCoordinates('0.000000', '0.000000').hasCoordinates, false);
  });

  test('returns false for non-numeric strings', () => {
    assert.equal(validateCoordinates('invalid', '117.15').hasCoordinates, false);
    assert.equal(validateCoordinates('', '').hasCoordinates, false);
  });

  test('returns true and parses valid coordinate floats and strings', () => {
    const res = validateCoordinates('-0.502106', '117.153709');
    assert.equal(res.hasCoordinates, true);
    assert.equal(res.latNum, -0.502106);
    assert.equal(res.lngNum, 117.153709);
    assert.equal(res.formattedString, '-0.502106, 117.153709');
  });

  test('handles numeric inputs directly', () => {
    const res = validateCoordinates(-0.51, 117.1715);
    assert.equal(res.hasCoordinates, true);
    assert.equal(res.latNum, -0.51);
    assert.equal(res.lngNum, 117.1715);
    assert.equal(res.formattedString, '-0.510000, 117.171500');
  });
});

describe('getSemanticRiskBadge', () => {
  test('maps Rendah to low risk', () => {
    const res = getSemanticRiskBadge('Rendah');
    assert.equal(res.level, 'low');
    assert.match(res.colorClass, /success/);
  });

  test('maps Menengah Rendah and Menengah Tinggi to medium risk', () => {
    const mr = getSemanticRiskBadge('Menengah Rendah');
    assert.equal(mr.level, 'medium');
    assert.match(mr.colorClass, /warning/);

    const mt = getSemanticRiskBadge('Menengah Tinggi');
    assert.equal(mt.level, 'medium');
    assert.match(mt.colorClass, /warning/);
  });

  test('maps Tinggi to high risk', () => {
    const t = getSemanticRiskBadge('Tinggi');
    assert.equal(t.level, 'high');
    assert.match(t.colorClass, /danger/);

    const st = getSemanticRiskBadge('Sangat Tinggi');
    assert.equal(st.level, 'high');
    assert.match(st.colorClass, /danger/);
  });

  test('handles empty or unknown risk safely', () => {
    const empty = getSemanticRiskBadge(null);
    assert.equal(empty.level, 'neutral');
    assert.equal(empty.label, 'Tidak Ditentukan');
  });
});

describe('formatFallback', () => {
  test('returns fallback for empty, whitespace, or null values', () => {
    assert.equal(formatFallback(null), '-');
    assert.equal(formatFallback('   '), '-');
    assert.equal(formatFallback(undefined, 'Belum diisi'), 'Belum diisi');
  });

  test('returns trimmed string for valid values', () => {
    assert.equal(formatFallback('  PT Maju Bersama  '), 'PT Maju Bersama');
  });

  test('handles number inputs gracefully', () => {
    assert.equal(formatFallback(12345), '12345');
    assert.equal(formatFallback(0), '0');
  });
});

describe('boundary & safety checks', () => {
  test('rejects latitude outside -90 to 90', () => {
    assert.equal(validateCoordinates(90.1, 100).hasCoordinates, false);
    assert.equal(validateCoordinates(-90.1, 100).hasCoordinates, false);
    assert.equal(validateCoordinates(90, 100).hasCoordinates, true);
    assert.equal(validateCoordinates(-90, 100).hasCoordinates, true);
  });

  test('rejects longitude outside -180 to 180', () => {
    assert.equal(validateCoordinates(0.5, 180.1).hasCoordinates, false);
    assert.equal(validateCoordinates(0.5, -180.1).hasCoordinates, false);
    assert.equal(validateCoordinates(0.5, 180).hasCoordinates, true);
    assert.equal(validateCoordinates(0.5, -180).hasCoordinates, true);
  });

  test('rejects invalid numeric strings', () => {
    assert.equal(validateCoordinates('NaN', 'undefined').hasCoordinates, false);
    assert.equal(validateCoordinates('Infinity', '-Infinity').hasCoordinates, false);
  });
});


