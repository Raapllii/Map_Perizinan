import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  FEEDBACK_DELAY_PRODUCTION_MS,
  FEEDBACK_DELAY_TEST_MS,
  FEEDBACK_SUBMITTED_SESSION_KEY,
  FEEDBACK_PROMPTED_SESSION_KEY,
  getFeedbackDelayMs,
  isFeedbackEligible,
  isFeedbackAlreadySubmitted,
  markFeedbackAsSubmitted,
  isFeedbackAlreadyPrompted,
  markFeedbackAsPrompted,
  createFeedbackPayload
} from '../../resources/js/lib/feedbackTriggerUtils.ts';

describe('feedbackTriggerUtils', () => {
  test('constants define correct production (2 min) and testing (7s) durations', () => {
    assert.equal(FEEDBACK_DELAY_PRODUCTION_MS, 120000); // 2 minutes
    assert.equal(FEEDBACK_DELAY_TEST_MS, 7000); // 7 seconds
    assert.equal(FEEDBACK_SUBMITTED_SESSION_KEY, 'public_map_feedback_submitted');
    assert.equal(FEEDBACK_PROMPTED_SESSION_KEY, 'public_map_feedback_prompted');
  });

  test('getFeedbackDelayMs respects testing flag', () => {
    assert.equal(getFeedbackDelayMs(true), 7000);
    assert.equal(getFeedbackDelayMs(false), 120000);
  });

  test('isFeedbackEligible returns true only if interacted, not submitted, and not prompted', () => {
    assert.equal(isFeedbackEligible(false, false, false), false);
    assert.equal(isFeedbackEligible(false, true, false), false);
    assert.equal(isFeedbackEligible(true, true, false), false);
    assert.equal(isFeedbackEligible(true, false, true), false);
    assert.equal(isFeedbackEligible(true, false, false), true);
    assert.equal(isFeedbackEligible(true, false), true); // default isPrompted=false
  });

  test('session storage checks and marks submission and prompted correctly', () => {
    const store = new Map();
    const mockStorage = {
      getItem: (k) => store.get(k) || null,
      setItem: (k, v) => store.set(k, String(v)),
    };

    assert.equal(isFeedbackAlreadySubmitted(mockStorage), false);
    markFeedbackAsSubmitted(mockStorage);
    assert.equal(isFeedbackAlreadySubmitted(mockStorage), true);
    assert.equal(store.get(FEEDBACK_SUBMITTED_SESSION_KEY), 'true');

    assert.equal(isFeedbackAlreadyPrompted(mockStorage), false);
    markFeedbackAsPrompted(mockStorage);
    assert.equal(isFeedbackAlreadyPrompted(mockStorage), true);
    assert.equal(store.get(FEEDBACK_PROMPTED_SESSION_KEY), 'true');
  });

  test('createFeedbackPayload formats payload with trimmed feedback and nullable businessId', () => {
    const payload = createFeedbackPayload(42, 'happy', '  Bagus sekali  ', 105);
    assert.deepEqual(payload, {
      access_log_id: 42,
      rating: 'happy',
      feedback: 'Bagus sekali',
      business_id: 105,
    });

    const payloadNoBusiness = createFeedbackPayload('99', 'neutral', 'Cukup', undefined);
    assert.deepEqual(payloadNoBusiness, {
      access_log_id: 99,
      rating: 'neutral',
      feedback: 'Cukup',
      business_id: null,
    });

    // Skenario F: Feedback tanpa business detail aktif (0 or null or empty string)
    const payloadZeroBusiness = createFeedbackPayload(100, 'sad', 'Kurang detail', 0);
    assert.equal(payloadZeroBusiness.business_id, null);

    const payloadEmptyBusiness = createFeedbackPayload(100, 'sad', 'Kurang detail', '');
    assert.equal(payloadEmptyBusiness.business_id, null);
  });
});
