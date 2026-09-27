import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  FEEDBACK_SUBMITTED_SESSION_KEY,
  isFeedbackAlreadySubmitted,
  markFeedbackAsSubmitted,
  createFeedbackPayload
} from '../../resources/js/lib/feedbackTriggerUtils.ts';

describe('feedbackTriggerUtils', () => {
  test('constants define correct session key', () => {
    assert.equal(FEEDBACK_SUBMITTED_SESSION_KEY, 'public_map_feedback_submitted');
  });

  test('session storage checks and marks submission correctly', () => {
    const store = new Map();
    const mockStorage = {
      getItem: (k) => store.get(k) || null,
      setItem: (k, v) => store.set(k, String(v)),
    };

    assert.equal(isFeedbackAlreadySubmitted(mockStorage), false);
    markFeedbackAsSubmitted(mockStorage);
    assert.equal(isFeedbackAlreadySubmitted(mockStorage), true);
    assert.equal(store.get(FEEDBACK_SUBMITTED_SESSION_KEY), 'true');
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

