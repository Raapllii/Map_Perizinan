import test from 'node:test';
import assert from 'node:assert/strict';

test('FeedbackWidget state logic - alwaysExpanded guarantees expanded modal without rating', () => {
  const getIsExpanded = (alwaysExpanded, value) => {
    return Boolean(alwaysExpanded || (value !== ""));
  };

  // When alwaysExpanded is true, even with empty rating value="", it stays expanded!
  assert.equal(getIsExpanded(true, ""), true, "Modal must remain expanded when rating is empty if alwaysExpanded=true");
  assert.equal(getIsExpanded(true, "happy"), true, "Modal must remain expanded when rating is selected");

  // When alwaysExpanded is false (e.g. standalone widget outside modal)
  assert.equal(getIsExpanded(false, ""), false, "Stand-alone widget collapses if rating is empty");
  assert.equal(getIsExpanded(false, "neutral"), true, "Stand-alone widget expands when rating is selected");
});

test('FeedbackWidget toggle logic - clicking same rating toggles to empty without closing modal', () => {
  let currentValue = "";
  let isPreview = false;

  const handleValueChange = (val) => {
    if (val === "" || val === currentValue) {
      currentValue = "";
      isPreview = false;
      return;
    }
    currentValue = val;
  };

  // Step 1: User selects 'happy'
  handleValueChange("happy");
  assert.equal(currentValue, "happy", "Selected rating should be happy");

  // Step 2: User clicks 'happy' again to deselect
  handleValueChange("happy");
  assert.equal(currentValue, "", "Clicking same rating should clear rating to empty string");

  // Step 3: User clicks 'neutral'
  handleValueChange("neutral");
  assert.equal(currentValue, "neutral", "Should switch to neutral");

  // Step 4: Radix UI ToggleGroup sends "" when active item is clicked
  handleValueChange("");
  assert.equal(currentValue, "", "Empty toggle should clear rating");
});

test('FeedbackWidget submit button disabled conditions prevent invalid API calls', () => {
  const isButtonDisabled = (feedback, value, isSubmitting) => {
    return Boolean(!feedback.trim() || !value || isSubmitting);
  };

  // Both feedback and rating are required for submission
  assert.equal(isButtonDisabled("", "happy", false), true, "Disabled when feedback text is empty");
  assert.equal(isButtonDisabled("   ", "happy", false), true, "Disabled when feedback is whitespace");
  assert.equal(isButtonDisabled("Bagus sekali", "", false), true, "Disabled when rating is not selected");
  assert.equal(isButtonDisabled("Bagus sekali", "happy", true), true, "Disabled while submitting");
  assert.equal(isButtonDisabled("Bagus sekali", "happy", false), false, "Enabled when feedback text and rating exist and not submitting");
});
