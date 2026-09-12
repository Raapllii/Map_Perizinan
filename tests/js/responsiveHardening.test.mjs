import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Responsive Calculations & Bounds Safety', () => {
  it('calculates clamp string for modal widths safely', () => {
    const getModalWidthClamp = (maxPx) => `w-[min(${maxPx}px,calc(100vw-1.5rem))]`;
    assert.equal(getModalWidthClamp(512), 'w-[min(512px,calc(100vw-1.5rem))]');
    assert.equal(getModalWidthClamp(896), 'w-[min(896px,calc(100vw-1.5rem))]');
  });

  it('calculates safe pagination item range', () => {
    const getPaginationRange = (page, perPage, total) => {
      if (total <= 0) return { start: 0, end: 0, total: 0 };
      const start = (page - 1) * perPage + 1;
      const end = Math.min(page * perPage, total);
      return { start, end, total };
    };

    assert.deepEqual(getPaginationRange(1, 10, 50), { start: 1, end: 10, total: 50 });
    assert.deepEqual(getPaginationRange(5, 10, 48), { start: 41, end: 48, total: 48 });
    assert.deepEqual(getPaginationRange(1, 10, 0), { start: 0, end: 0, total: 0 });
  });

  it('formats large KPI values with truncation safety', () => {
    const formatKpiValue = (val) => {
      if (val === null || val === undefined) return '0';
      const num = Number(val);
      if (isNaN(num)) return String(val);
      return num.toLocaleString('id-ID');
    };

    assert.equal(formatKpiValue(0), '0');
    assert.equal(formatKpiValue(1250), '1.250');
    assert.equal(formatKpiValue(12500000), '12.500.000');
    assert.equal(formatKpiValue(null), '0');
    assert.equal(formatKpiValue('N/A'), 'N/A');
  });

  it('determines table container minimum width requirements', () => {
    const columns = [
      { id: 'select', width: 40 },
      { id: 'name', width: 250 },
      { id: 'user', width: 200 },
      { id: 'location', width: 200 },
      { id: 'category', width: 180 },
      { id: 'status', width: 100 },
      { id: 'actions', width: 60 }
    ];
    const totalRequiredWidth = columns.reduce((sum, col) => sum + col.width, 0);
    assert.equal(totalRequiredWidth, 1030);
    // Safe minimum width for scrollable container should be at least 960px to prevent crushing
    assert.ok(totalRequiredWidth >= 960);
  });
});
