/**
 * Visitor Session Helper with 15-Minute Inactivity Timeout
 */

export interface VisitorData {
  nama: string;
  instansi: string;
  id?: number;
  last_active?: number;
}

export const VISITOR_SESSION_KEY = "public_map_visitor";
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
export const THROTTLE_UPDATE_MS = 10 * 1000; // Throttle storage updates to once per 10s

/**
 * Save or update visitor session in sessionStorage with current timestamp.
 */
export function setVisitorSession(visitor: VisitorData): VisitorData {
  const dataToStore: VisitorData = {
    ...visitor,
    last_active: Date.now(),
  };
  try {
    sessionStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify(dataToStore));
  } catch (err) {
    console.error("Gagal menyimpan visitor session:", err);
  }
  return dataToStore;
}

/**
 * Get visitor session if valid and not expired.
 * Automatically clears session if 15-minute inactivity timeout has elapsed.
 */
export function getVisitorSession(): VisitorData | null {
  try {
    const raw = sessionStorage.getItem(VISITOR_SESSION_KEY);
    if (!raw) return null;

    const data: VisitorData = JSON.parse(raw);
    if (!data || !data.nama || !data.instansi) {
      clearVisitorSession();
      return null;
    }

    // Check if session has expired (> 15 minutes inactive)
    const lastActive = data.last_active || 0;
    if (Date.now() - lastActive > SESSION_TIMEOUT_MS) {
      clearVisitorSession();
      return null;
    }

    return data;
  } catch {
    clearVisitorSession();
    return null;
  }
}

/**
 * Check if the current visitor session is expired.
 */
export function isVisitorSessionExpired(): boolean {
  try {
    const raw = sessionStorage.getItem(VISITOR_SESSION_KEY);
    if (!raw) return true;

    const data: VisitorData = JSON.parse(raw);
    if (!data || !data.nama || !data.instansi) return true;

    const lastActive = data.last_active || 0;
    return Date.now() - lastActive > SESSION_TIMEOUT_MS;
  } catch {
    return true;
  }
}

/**
 * Update last active timestamp if throttled interval has passed.
 */
let lastThrottleTime = 0;
export function touchVisitorSession(): void {
  const now = Date.now();
  if (now - lastThrottleTime < THROTTLE_UPDATE_MS) return;

  try {
    const raw = sessionStorage.getItem(VISITOR_SESSION_KEY);
    if (!raw) return;

    const data: VisitorData = JSON.parse(raw);
    if (data && data.nama && data.instansi) {
      data.last_active = now;
      sessionStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify(data));
      lastThrottleTime = now;
    }
  } catch {
    // Ignore storage update errors
  }
}

/**
 * Clear visitor session from sessionStorage.
 */
export function clearVisitorSession(): void {
  try {
    sessionStorage.removeItem(VISITOR_SESSION_KEY);
  } catch {
    // Ignore errors
  }
}
