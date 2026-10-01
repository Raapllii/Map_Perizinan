import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mock browser sessionStorage for Node environment
const storage = new Map();
global.sessionStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

// Import visitorSession module
import {
  setVisitorSession,
  getVisitorSession,
  clearVisitorSession,
  VISITOR_SESSION_KEY
} from '../../resources/js/lib/visitorSession.ts';

describe('Visitor Session Privacy & Hygiene', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('never stores NIK, biodata (gender, birthplace, birthdate), or tokens in sessionStorage', () => {
    const rawInputPayload = {
      nama: 'Rahmat Hidayat',
      instansi: 'DPMPTSP',
      id: 42,
      access_log_id: 42,
      nik: '3201234567890001', // Must be discarded
      verification_token: 'secret-token-xyz', // Must be discarded
      jenis_kelamin: 'Laki-laki', // Must be discarded from storage
      tempat_lahir: 'Banjarmasin', // Must be discarded from storage
      tanggal_lahir: '1998-05-12', // Must be discarded from storage
    };

    setVisitorSession(rawInputPayload);

    const rawStored = sessionStorage.getItem(VISITOR_SESSION_KEY);
    assert.ok(rawStored, 'Session must exist in storage');

    const parsed = JSON.parse(rawStored);
    assert.strictEqual(parsed.nama, 'Rahmat Hidayat');
    assert.strictEqual(parsed.instansi, 'DPMPTSP');
    assert.strictEqual(parsed.id, 42);
    assert.strictEqual(parsed.access_log_id, 42);

    // Verify NIK and sensitive biodata are NOT in sessionStorage
    assert.strictEqual(parsed.nik, undefined, 'NIK must NOT be in sessionStorage');
    assert.strictEqual(parsed.jenis_kelamin, undefined, 'Gender must NOT be in sessionStorage');
    assert.strictEqual(parsed.tempat_lahir, undefined, 'Birthplace must NOT be in sessionStorage');
    assert.strictEqual(parsed.tanggal_lahir, undefined, 'Birthdate must NOT be in sessionStorage');
    assert.strictEqual(parsed.verification_token, undefined, 'Verification token must NOT be in sessionStorage');

    // Ensure raw strings do not exist in storage string
    assert.strictEqual(rawStored.includes('3201234567890001'), false, 'NIK string must not exist in raw storage');
    assert.strictEqual(rawStored.includes('secret-token-xyz'), false, 'Token string must not exist in raw storage');
    assert.strictEqual(rawStored.includes('1998-05-12'), false, 'Birthdate string must not exist in raw storage');
    assert.strictEqual(rawStored.includes('Banjarmasin'), false, 'Birthplace string must not exist in raw storage');
    assert.strictEqual(rawStored.includes('Laki-laki'), false, 'Gender string must not exist in raw storage');
  });

  it('retrieves only sanitized public visitor identity from session', () => {
    setVisitorSession({
      nama: 'Siti Rahma',
      instansi: 'BAPENDA',
      id: 99,
    });

    const session = getVisitorSession();
    assert.ok(session);
    assert.strictEqual(session.nama, 'Siti Rahma');
    assert.strictEqual(session.instansi, 'BAPENDA');
    assert.strictEqual(session.id, 99);
    assert.strictEqual(session.access_log_id, 99);
    assert.strictEqual(session.nik, undefined);
  });

  it('clears session cleanly when user changes identity', () => {
    setVisitorSession({ nama: 'Ahmad', instansi: 'Umum' });
    assert.ok(getVisitorSession());

    clearVisitorSession();
    assert.strictEqual(getVisitorSession(), null);
    assert.strictEqual(sessionStorage.getItem(VISITOR_SESSION_KEY), null);
  });
});
