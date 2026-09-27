# Public Map Feedback Button Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change Public Map Feedback behavior from an automatic popup/timer to a user-initiated button trigger while using the existing `feedback.tsx` component and maintaining Access Log & Business ID integration.

**Architecture:** Remove the interaction-based automatic timer and auto-popup triggers from `PublicMapPage.tsx`. Add a prominent, responsive floating "Feedback" button on the Public Map with Lucide icon (`MessageSquare` / `Check`). Clicking the button opens the existing `FeedbackWidget` inside a modal overlay with an explicit close control. Session state (`feedbackSubmitted`, `access_log_id`, `selectedBusiness?.id`) remains intact.

**Tech Stack:** React, TypeScript, TailwindCSS, Lucide Icons (`MessageSquare`, `Check`, `X`), Motion (Framer Motion), Axios, Laravel API.

## Global Constraints

- **No New Feedback Component:** Must use existing `resources/js/components/ui/feedback.tsx`.
- **No Auto Popup:** Feedback must NOT open automatically on timer, map pan/zoom, search, marker click, or detail card close.
- **Access Log Integration:** Submission must use active `access_log_id` from visitor session.
- **Responsive Positioning:** Floating button must not obstruct Zoom control, Scale control, MapRiskLegend, Search, Filter, or map attribution on desktop or mobile.

---

### Task 1: Clean Up Auto-Popup Timer Logic in PublicMapPage.tsx & Utilities

**Files:**
- Modify: `resources/js/Pages/PublicMapPage.tsx`
- Modify: `resources/js/lib/feedbackTriggerUtils.ts`
- Modify: `tests/js/feedbackTriggerLogic.test.mjs`

**Interfaces:**
- Consumes: `visitor` session, `isFeedbackAlreadySubmitted`
- Produces: Clean state in `PublicMapPage.tsx` without timer ref, `hasInteracted` auto-trigger, or `setTimeout`

- [ ] **Step 1: Update `feedbackTriggerUtils.ts` and test file to deprecate/clean unused timer helpers**

Ensure `isFeedbackAlreadySubmitted`, `markFeedbackAsSubmitted`, and `createFeedbackPayload` are preserved, while keeping tests green.

- [ ] **Step 2: Run unit tests to verify utilities**

Run: `cmd /c node --test tests/js/feedbackTriggerLogic.test.mjs tests/js/feedbackComponentLogic.test.mjs`
Expected: PASS

- [ ] **Step 3: Remove automatic timer & auto-prompting logic from `PublicMapPage.tsx`**

Remove `feedbackTimerRef`, `getFeedbackDelayMs`, `hasPromptedFeedback`, `markFeedbackAsPrompted`, and the auto-popup `useEffect` block. Remove `setHasInteracted(true)` calls that were only used to kick off the feedback timer.

---

### Task 2: Implement Floating Feedback Button & Modal Integration in PublicMapPage.tsx

**Files:**
- Modify: `resources/js/Pages/PublicMapPage.tsx`
- Test: `tests/js/feedbackComponentLogic.test.mjs`

**Interfaces:**
- Consumes: `isFeedbackOpen`, `feedbackSubmitted`, `visitor`, `selectedBusiness`, `FeedbackWidget`
- Produces: Floating Feedback button on map + modal pop-up on button click

- [ ] **Step 1: Add Lucide Icons and Floating Feedback Button UI**

Import `MessageSquare`, `Check`, `X` from `lucide-react`.
Add floating Feedback button in `PublicMapPage.tsx`:
- Desktop: `bottom-6 right-16 md:bottom-6 md:right-16` (positioned safely to the left of Leaflet zoom control or in safe map control area).
- Mobile: `bottom-20 right-4` (safely clear of bottom legend, zoom control, and attribution).
- Button shows `MessageSquare` icon + text ("Feedback" or "Feedback Terkirim" when `feedbackSubmitted` is true).
- Disabled state / visual indication when `feedbackSubmitted` is true.

- [ ] **Step 2: Connect Button Click to Modal & Wire Close Control**

Clicking [Feedback] sets `isFeedbackOpen(true)`.
Render modal overlay with `FeedbackWidget`.
Add a close `(X)` button in the top-right corner of the modal overlay so users can close without submitting.
On close: `setIsFeedbackOpen(false)` without auto-reopening.

- [ ] **Step 3: Test submission and Access Log payload**

Verify `handleFeedbackSubmit` correctly passes `visitor?.access_log_id || visitor?.id`, `rating`, `feedback`, and `selectedBusiness?.id`.

- [ ] **Step 4: Run unit tests**

Run: `cmd /c node --test tests/js/feedbackTriggerLogic.test.mjs tests/js/feedbackComponentLogic.test.mjs`
Expected: PASS

---

### Task 3: Complete Build & End-to-End Verification

**Files:**
- Build output check
- Feature tests check

- [ ] **Step 1: Run JS Unit Tests**

Run: `cmd /c node --test tests/js/feedbackTriggerLogic.test.mjs tests/js/feedbackComponentLogic.test.mjs`
Expected: All tests pass.

- [ ] **Step 2: Run Production Build**

Run: `cmd /c npm run build`
Expected: Build succeeds with 0 TypeScript / Vite compilation errors.

- [ ] **Step 3: Verify all 10 scenario requirements**

Confirm Test 1 through Test 10 conditions are satisfied.
