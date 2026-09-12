import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Functional Consistency & Audit Fixes', () => {
  const petaUsahaPath = path.resolve(process.cwd(), 'resources/js/pages/PetaUsahaPage.tsx');
  const laporanPath = path.resolve(process.cwd(), 'resources/js/pages/LaporanPage.tsx');
  const tambahUsahaPath = path.resolve(process.cwd(), 'resources/js/pages/TambahUsahaPage.tsx');

  const petaUsahaSource = fs.readFileSync(petaUsahaPath, 'utf-8');
  const laporanSource = fs.readFileSync(laporanPath, 'utf-8');
  const tambahUsahaSource = fs.readFileSync(tambahUsahaPath, 'utf-8');

  it('Fix #1: PetaUsahaPage does not contain hardcoded Jakarta coordinate badge', () => {
    assert.doesNotMatch(
      petaUsahaSource,
      /📍\s*-6\.2088/i,
      'PetaUsahaPage must not contain hardcoded coordinate badge 📍 -6.2088°'
    );
    assert.doesNotMatch(
      petaUsahaSource,
      /-6\.2088/,
      'PetaUsahaPage must not contain hardcoded -6.2088'
    );
    assert.doesNotMatch(
      petaUsahaSource,
      /106\.8456/,
      'PetaUsahaPage must not contain hardcoded 106.8456'
    );
  });

  it('Fix #1: TambahUsahaPage does not default latitude/longitude to Jakarta coordinates', () => {
    assert.doesNotMatch(
      tambahUsahaSource,
      /latitude:\s*"-6\.2088"/,
      'TambahUsahaPage should not default latitude to -6.2088'
    );
    assert.doesNotMatch(
      tambahUsahaSource,
      /longitude:\s*"106\.8456"/,
      'TambahUsahaPage should not default longitude to 106.8456'
    );
  });

  it('Fix #2: PetaUsahaPage connects onEditClick to DataUsahaFormModal', () => {
    // Must import DataUsahaFormModal
    assert.match(
      petaUsahaSource,
      /import\s+DataUsahaFormModal\s+from\s+["'].*DataUsahaFormModal["']/,
      'PetaUsahaPage must import DataUsahaFormModal'
    );

    // Must render DataUsahaFormModal in JSX
    assert.match(
      petaUsahaSource,
      /<DataUsahaFormModal[\s\S]*?\/>/,
      'PetaUsahaPage must render DataUsahaFormModal'
    );

    // Must wire onEditClick to open the modal with the selected business
    assert.doesNotMatch(
      petaUsahaSource,
      /onEditClick=\{\(\)\s*=>\s*\{\s*\/\/\s*Ensure this uses/,
      'onEditClick must not be an empty placeholder function'
    );
  });

  it('Fix #3: LaporanPage uses correct wording "{totalChange} vs. tahun lalu"', () => {
    assert.match(
      laporanSource,
      /\{totalChange\}\s+vs\.\s+tahun\s+lalu/,
      'LaporanPage must display {totalChange} vs. tahun lalu'
    );
    assert.doesNotMatch(
      laporanSource,
      /\{totalChange\}\s+vs\.\s+lalu/,
      'LaporanPage must not contain incomplete wording "{totalChange} vs. lalu"'
    );
  });

  it('Fix #4: Strict regression protection for selectedBusiness vs hoveredBusiness', () => {
    // Must have both states defined
    assert.match(
      petaUsahaSource,
      /const\s+\[selectedBusiness,\s*setSelectedBusiness\]\s*=\s*useState/,
      'selectedBusiness state must exist'
    );
    assert.match(
      petaUsahaSource,
      /const\s+\[hoveredBusiness,\s*setHoveredBusiness\]\s*=\s*useState/,
      'hoveredBusiness state must exist'
    );

    // Hover handler must NOT set selectedBusiness
    assert.doesNotMatch(
      petaUsahaSource,
      /onHoverMarker=\{\s*\(.*?\)\s*=>\s*setSelectedBusiness/,
      'Hovering a marker must never modify selectedBusiness'
    );
  });
});
