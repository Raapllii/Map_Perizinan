import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatPageTitle, APP_NAME } from '../../resources/js/hooks/useDocumentTitle.ts';
import { PAGE_TITLES } from '../../resources/js/constants/index.ts';

describe('formatPageTitle', () => {
  test('returns base APP_NAME when input is null, undefined, or empty', () => {
    assert.equal(formatPageTitle(null), APP_NAME);
    assert.equal(formatPageTitle(undefined), APP_NAME);
    assert.equal(formatPageTitle(''), APP_NAME);
    assert.equal(formatPageTitle('   '), APP_NAME);
  });

  test('formats page titles with consistent pattern: "Nama Halaman – Map Perizinan"', () => {
    assert.equal(formatPageTitle('Map Public'), 'Map Public – Map Perizinan');
    assert.equal(formatPageTitle('Verifikasi Identitas'), 'Verifikasi Identitas – Map Perizinan');
    assert.equal(formatPageTitle('Login Admin'), 'Login Admin – Map Perizinan');
    assert.equal(formatPageTitle('Dashboard'), 'Dashboard – Map Perizinan');
    assert.equal(formatPageTitle('Peta Usaha'), 'Peta Usaha – Map Perizinan');
    assert.equal(formatPageTitle('Data Usaha'), 'Data Usaha – Map Perizinan');
    assert.equal(formatPageTitle('Tambah Usaha'), 'Tambah Usaha – Map Perizinan');
    assert.equal(formatPageTitle('Verifikasi Izin'), 'Verifikasi Izin – Map Perizinan');
    assert.equal(formatPageTitle('Monitoring'), 'Monitoring – Map Perizinan');
    assert.equal(formatPageTitle('Laporan'), 'Laporan – Map Perizinan');
    assert.equal(formatPageTitle('Rekapitulasi Akses'), 'Rekapitulasi Akses – Map Perizinan');
    assert.equal(formatPageTitle('Pengaturan'), 'Pengaturan – Map Perizinan');
  });

  test('formats entity details like business company name correctly', () => {
    assert.equal(formatPageTitle('PT Mahakam Borneo Sejahtera'), 'PT Mahakam Borneo Sejahtera – Map Perizinan');
    assert.equal(formatPageTitle('CV Karya Bersama'), 'CV Karya Bersama – Map Perizinan');
  });

  test('verifies all PAGE_TITLES from constants produce valid page titles', () => {
    Object.entries(PAGE_TITLES).forEach(([key, info]) => {
      const formatted = formatPageTitle(info.title);
      assert.ok(formatted.endsWith(' – Map Perizinan'), `Page title for ${key} must end with " – Map Perizinan"`);
      assert.ok(formatted.startsWith(info.title), `Page title for ${key} must start with "${info.title}"`);
    });
  });
});

