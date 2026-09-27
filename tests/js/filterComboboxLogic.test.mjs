import test from 'node:test';
import assert from 'node:assert/strict';

function computeActiveFilterCount(filterState) {
  if (!filterState) return 0;
  let count = 0;
  if (filterState.risiko && filterState.risiko !== 'Semua') count++;
  if (filterState.kecamatan && filterState.kecamatan !== 'Semua') count++;
  if (filterState.kelurahan && filterState.kelurahan !== 'Semua') count++;
  if (filterState.kategori && filterState.kategori !== 'Semua') count++;
  return count;
}

function handleKecamatanChange(prevFilterState, newKecamatan) {
  return {
    ...prevFilterState,
    kecamatan: newKecamatan,
    kelurahan: 'Semua' // Cascading reset
  };
}

test('computeActiveFilterCount returns 0 for all default "Semua"', () => {
  const state = { risiko: 'Semua', kecamatan: 'Semua', kelurahan: 'Semua', kategori: 'Semua' };
  assert.equal(computeActiveFilterCount(state), 0);
});

test('computeActiveFilterCount counts active filters accurately', () => {
  const state = { risiko: 'Tinggi', kecamatan: 'Kecamatan Barat', kelurahan: 'Semua', kategori: 'Semua' };
  assert.equal(computeActiveFilterCount(state), 2);
});

test('handleKecamatanChange resets kelurahan to "Semua"', () => {
  const initial = { risiko: 'Tinggi', kecamatan: 'Kecamatan Barat', kelurahan: 'Desa C', kategori: 'Semua' };
  const updated = handleKecamatanChange(initial, 'Kecamatan Timur');
  assert.deepEqual(updated, {
    risiko: 'Tinggi',
    kecamatan: 'Kecamatan Timur',
    kelurahan: 'Semua',
    kategori: 'Semua'
  });
});
