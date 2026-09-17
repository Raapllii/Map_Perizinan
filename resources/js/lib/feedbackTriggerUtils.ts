/**
 * Feedback Trigger Utilities & Configurable Timing
 */

// Production default: 2 menit (120.000 ms)
export const FEEDBACK_DELAY_PRODUCTION_MS = 2 * 60 * 1000;

// Test default: 7 detik (7.000 ms)
export const FEEDBACK_DELAY_TEST_MS = 7 * 1000;

export const FEEDBACK_SUBMITTED_SESSION_KEY = 'public_map_feedback_submitted';

/**
 * Returns configurable delay duration in milliseconds:
 * 1. Reads VITE_FEEDBACK_DELAY_MS if defined
 * 2. If isTesting is true, returns FEEDBACK_DELAY_TEST_MS (7s)
 * 3. Otherwise returns FEEDBACK_DELAY_PRODUCTION_MS (2 minutes)
 */
export function getFeedbackDelayMs(isTesting: boolean = false): number {
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv?.VITE_FEEDBACK_DELAY_MS) {
      const parsed = Number(metaEnv.VITE_FEEDBACK_DELAY_MS);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // In environments without import.meta (e.g. Node tests), fallback to constants
  }

  return isTesting ? FEEDBACK_DELAY_TEST_MS : FEEDBACK_DELAY_PRODUCTION_MS;
}

export function isFeedbackEligible(hasInteracted: boolean, isSubmitted: boolean): boolean {
  return hasInteracted && !isSubmitted;
}

export function isFeedbackAlreadySubmitted(storage?: Storage): boolean {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.sessionStorage : null);
    return s?.getItem(FEEDBACK_SUBMITTED_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markFeedbackAsSubmitted(storage?: Storage): void {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.sessionStorage : null);
    s?.setItem(FEEDBACK_SUBMITTED_SESSION_KEY, 'true');
  } catch (err) {
    console.warn('Unable to write feedback submitted flag to session storage:', err);
  }
}

export function createFeedbackPayload(
  accessLogId: number,
  rating: string,
  feedback: string,
  businessId?: number | null
) {
  return {
    access_log_id: accessLogId,
    rating,
    feedback: feedback.trim(),
    business_id: businessId ?? null,
  };
}
