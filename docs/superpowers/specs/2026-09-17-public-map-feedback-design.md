# Design Document: Public Map Feedback After Map Interaction

**Date:** 2026-09-17  
**Status:** Validated & Ready for Plan  
**Target:** Integration of existing `FeedbackWidget` into `PublicMapPage.tsx`  

---

## 1. Goal and Objectives

Integrate the existing `FeedbackWidget` (`resources/js/components/ui/feedback.tsx`) into the Public Map (`PublicMapPage.tsx`) based on user interaction with business data, without modifying or disturbing the existing `feedback.tsx` code or Public Map features.

### Key Constraints:
- **Zero Modifications to `feedback.tsx`:** Keep UI, emoji rating, animation, markdown preview, and internal logic intact.
- **Strict Interaction-Based Trigger:**
  - Initial map entry: No feedback shown.
  - Map pan/zoom/hover: No feedback shown.
  - Triggered only after user clicks a marker and opens business detail (`selectedBusiness !== null`).
- **Delayed & Non-Intrusive UX:**
  - Do not pop up or block the user while reading business details.
  - Configurable delay (default: 7 seconds) after interaction before feedback becomes available.
  - Displayed as a floating button in the bottom-right corner of the Public Map.
  - Clicking the floating button toggles an overlaid card containing `FeedbackWidget` directly above the button.
  - Submitting feedback stores the response, displays a thank-you toast, and hides the floating button for the session.

---

## 2. User Experience & Interaction Flow

```text
[User Enters Public Map]
        │
        ▼ (browses, zooms, pans, hovers)
  [No Feedback Shown]
        │
        ▼ User clicks marker -> selectedBusiness !== null
[Business Details Opened]
        │
        ▼ Timer starts (7s delay, configurable via FEEDBACK_DELAY_MS)
  [Countdown completes]
        │
        ▼
[Floating "Feedback" Button Appears in Bottom-Right]
        │
        ├── User ignores: Button remains unobtrusive in bottom-right
        │
        └── User clicks "Feedback":
                 │
                 ▼
          [Overlaid Card opens containing FeedbackWidget]
                 │
                 ├── User clicks Close / Outside: Card closes, button remains
                 │
                 └── User selects Emoji + inputs Feedback -> "Send Feedback":
                          │
                          ▼
                   - Store feedback in localStorage (`public_map_feedbacks`)
                   - Set feedbackSubmitted = true
                   - Show Toast: "Terima kasih atas masukan Anda!"
                   - Animate close & hide floating button for this session
```

---

## 3. Component Architecture & State Management

### 3.1 State in `PublicMapPage.tsx`
- `hasInteractedWithBusiness`: `boolean` (default: `false`). Set to `true` on the first non-null `selectedBusiness`.
- `isFeedbackAvailable`: `boolean` (default: `false`). Set to `true` after `FEEDBACK_DELAY_MS` timeout fires.
- `isFeedbackOpen`: `boolean` (default: `false`). Controls whether the `FeedbackWidget` overlay card is visible.
- `feedbackSubmitted`: `boolean` (initialized from `sessionStorage.getItem('public_map_feedback_submitted')`). If `true`, the widget and floating button remain hidden.

### 3.2 Constants
- `const FEEDBACK_DELAY_MS = 7000;` (easily adjustable delay)

### 3.3 Positioning & Responsive Behavior
- **Desktop:** `bottom-6 right-6 z-30`
  - Zero collision with left-docked `BusinessSidePanel`.
  - Zero collision with top-right map controls (Peta/Satelit).
- **Mobile:** `bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-30`
  - While mobile drawer is open (`z-[1000]`), the drawer is the primary focus.
  - When user closes drawer or on map view, the button is accessible in the bottom right corner without obstructing controls.

---

## 4. Error Handling & Data Safety
- `handleFeedbackSubmit`:
  - Safely reads existing feedbacks from `localStorage.getItem('public_map_feedbacks')`.
  - Appends feedback payload (`{ id, timestamp, visitor, rating, feedback, businessId: selectedBusiness?.id }`).
  - Sets `sessionStorage.setItem('public_map_feedback_submitted', 'true')`.
  - Triggers toast message with clean dismiss timer.
- Clean up any active timers in `useEffect` on unmount.

---

## 5. Verification Plan
- Unit test for state machine logic (delay timer, armed state, submission flag).
- Manual verification on desktop and mobile viewports.
- Production build verification via `npm run build`.
