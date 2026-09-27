# Public Map Feedback Popover Layout Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Feedback Popover layout issue by making `FeedbackWidget` a self-contained, responsive popover card with internal header (title + X button), centered emoji rating row, compact textarea, and smooth button-anchored position without clipping or outer double card wrappers.

**Architecture:** Update `resources/js/components/ui/feedback.tsx` header to include `onClose` X button, responsive title flex row, and compact padding. In `PublicMapPage.tsx`, render `FeedbackWidget` directly inside the anchored `bottom-full right-0 mb-3` popover motion div with width `min(380px, calc(100vw - 32px))`.

**Tech Stack:** React, TypeScript, TailwindCSS, Radix UI ToggleGroup, Framer Motion (`motion/react`), Lucide Icons.

## Global Constraints

- **No New Components:** Must refine existing `resources/js/components/ui/feedback.tsx`.
- **No Outer Double Wrappers:** `FeedbackWidget` is rendered directly as the popover card.
- **Header Layout:** Title on left (`flex-1 min-w-0 font-bold truncate`), Close X on right (`shrink-0 p-1`).
- **No Backdrop:** No modal backdrop screen cover.
- **Access Log Integration:** Active `access_log_id` and submission logic 100% preserved.

---

### Task 1: Refine `feedback.tsx` Component Header & Compact Layout

**Files:**
- Modify: `resources/js/components/ui/feedback.tsx`
- Test: `tests/js/feedbackComponentLogic.test.mjs`

**Interfaces:**
- Consumes: `onClose`, `onSubmit`, `label`, `placeholder`, `alwaysExpanded`, `submitButtonText`, `footerText`
- Produces: Compact, self-contained `FeedbackWidget` card component with internal header X button and clean emoji layout.

- [ ] **Step 1: Update `FeedbackWidgetProps` interface in `feedback.tsx`**

Add `alwaysExpanded?: boolean; submitButtonText?: string; footerText?: string;` to `FeedbackWidgetProps`.

- [ ] **Step 2: Update `FeedbackWidget` layout and header in `feedback.tsx`**

- In header: Render flex row with `label` (`flex-1 min-w-0 font-bold truncate`) and `onClose` button (`shrink-0 p-1 rounded-full`).
- Center emoji toggle group row with `w-full max-w-[260px]`.
- Keep textarea compact (`h-[110px]`) and send button aligned in footer.
- Set container class to `w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950`.

- [ ] **Step 3: Run JS Unit Tests**

Run: `cmd /c node --test tests/js/feedbackTriggerLogic.test.mjs tests/js/feedbackComponentLogic.test.mjs`
Expected: PASS

---

### Task 2: Update `PublicMapPage.tsx` Popover Anchor & Layout

**Files:**
- Modify: `resources/js/Pages/PublicMapPage.tsx`

**Interfaces:**
- Consumes: `FeedbackWidget`, `isFeedbackOpen`, `feedbackSubmitted`, `handleCloseFeedback`, `handleFeedbackSubmit`
- Produces: Clean, unclipped Popover panel anchored to floating Feedback button.

- [ ] **Step 1: Simplify `PublicMapPage.tsx` Popover JSX**

Position Popover container as `fixed z-[1050] bottom-20 right-4 md:bottom-6 md:right-16 flex flex-col items-end`.
Render Popover panel with `w-[min(380px,calc(100vw-32px))] mb-3`.
Pass `onClose`, `onSubmit`, `label`, `placeholder`, `submitButtonText`, `footerText` to `FeedbackWidget`.

- [ ] **Step 2: Run JS Unit Tests**

Run: `cmd /c node --test tests/js/feedbackTriggerLogic.test.mjs tests/js/feedbackComponentLogic.test.mjs`
Expected: PASS

- [ ] **Step 3: Run Production Build**

Run: `cmd /c npm run build`
Expected: Build succeeds with 0 TypeScript/Vite errors.

- [ ] **Step 4: Run PHP Artisan Tests**

Run: `php artisan test --filter=PublicMapFeedbackTest`
Expected: 7 passed.
