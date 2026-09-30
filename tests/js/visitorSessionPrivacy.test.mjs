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

  it('never stores NIK in sessionStorage even if passed in input object', () => {
    const maliciousPayload = {
      nama: 'Budi Santoso',
      instansi: 'DPMPTSP',
      id: 42,
      access_log_id: 42,
      nik: '3201234567890001', // Should be discarded
      verification_token: 'secret-token-xyz', // Should be discarded
    };

    setVisitorSession(maliciousPayload);

    const rawStored = sessionStorage.getItem(VISITOR_SESSION_KEY);
    assert.ok(rawStored, 'Session must exist in storage');

    const parsed = JSON.parse(rawStored);
    assert.strictEqual(parsed.nama, 'Budi Santoso');
    assert.strictEqual(parsed.instansi, 'DPMPTSP');
    assert.strictEqual(parsed.id, 42);
    assert.strictEqual(parsed.access_log_id, 42);

    // Verify NIK is NOT in sessionStorage
    assert.strictEqual(parsed.nik, undefined, 'NIK must NOT be present in sessionStorage');
    assert.strictEqual(rawStored.includes('3201234567890001'), false, 'NIK string must not exist in raw storage');
    assert.strictEqual(rawStored.includes('secret-token-xyz'), false, 'Token string must not exist in raw storage');
  });

  it('retrieves only sanitized visitor identity from session', () => {
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
