/**
 * Feedback Trigger Utilities & Session Management
 */

export const FEEDBACK_SUBMITTED_SESSION_KEY = 'public_map_feedback_submitted';

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
  accessLogId: number | string,
  rating: string,
  feedback: string,
  businessId?: number | string | null
) {
  const parsedBusinessId =
    businessId !== null && businessId !== undefined && businessId !== ""
      ? Number(businessId)
      : null;

  return {
    access_log_id: Number(accessLogId),
    rating: rating ? String(rating).trim() : "",
    feedback: feedback ? feedback.trim() : "",
    business_id:
      parsedBusinessId && !isNaN(parsedBusinessId) && parsedBusinessId > 0
        ? parsedBusinessId
        : null,
  };
}


