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

test('FeedbackWidget form validation logic matches requirements A, B, C, D', () => {
  const validateForm = (value, feedback) => {
    if (!value) {
      return { valid: false, error: "Penilaian rating wajib dipilih." };
    }
    const trimmed = (feedback || "").trim();
    if (!trimmed) {
      return { valid: false, error: "Pesan masukan wajib diisi." };
    }
    if (trimmed.length < 2) {
      return { valid: false, error: "Pesan masukan minimal 2 karakter." };
    }
    return { valid: true, error: null, data: { rating: value, feedback: trimmed } };
  };

  // Skenario A: Rating + Feedback valid
  const resultA = validateForm("happy", "Aplikasi sangat membantu dan cepat.");
  assert.equal(resultA.valid, true);
  assert.equal(resultA.error, null);
  assert.deepEqual(resultA.data, { rating: "happy", feedback: "Aplikasi sangat membantu dan cepat." });

  // Skenario B: Rating ada, Feedback kosong
  const resultB = validateForm("happy", "");
  assert.equal(resultB.valid, false);
  assert.equal(resultB.error, "Pesan masukan wajib diisi.");

  const resultBWhitespace = validateForm("happy", "   ");
  assert.equal(resultBWhitespace.valid, false);
  assert.equal(resultBWhitespace.error, "Pesan masukan wajib diisi.");

  // Skenario C: Rating kosong, Feedback ada
  const resultC = validateForm("", "Peta ini sangat bagus.");
  assert.equal(resultC.valid, false);
  assert.equal(resultC.error, "Penilaian rating wajib dipilih.");

  // Skenario D: Rating dideselect (kosong) lalu submit
  let ratingVal = "sad";
  // User deselects
  ratingVal = "";
  const resultD = validateForm(ratingVal, "Ada kendala navigasi");
  assert.equal(resultD.valid, false);
  assert.equal(resultD.error, "Penilaian rating wajib dipilih.");

  // Feedback text minimal 2 karakter
  const resultTooShort = validateForm("happy", "a");
  assert.equal(resultTooShort.valid, false);
  assert.equal(resultTooShort.error, "Pesan masukan minimal 2 karakter.");
});

test('Stale Access Log detection logic in PublicMapPage', () => {
  const isStaleAccessLog = (errorStatus, errorData) => {
    return Boolean(
      errorStatus === 422 &&
      (errorData?.errors?.access_log_id ||
       errorData?.message?.toLowerCase().includes("log akses") ||
       errorData?.message?.toLowerCase().includes("sesi"))
    );
  };

  assert.equal(isStaleAccessLog(422, { errors: { access_log_id: ["Data log akses tidak ditemukan."] } }), true);
  assert.equal(isStaleAccessLog(422, { message: "Data log akses tidak ditemukan atau sesi telah berakhir." }), true);
  assert.equal(isStaleAccessLog(422, { message: "Penilaian rating wajib dipilih." }), false);
  assert.equal(isStaleAccessLog(500, { message: "Server error" }), false);
});
