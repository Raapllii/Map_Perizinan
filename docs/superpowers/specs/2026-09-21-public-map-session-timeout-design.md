# Design Spec: Public Map Visitor Session Timeout (15 Minutes Idle Expiry)

## Overview
Implement a robust 15-minute visitor session timeout for the public WebGIS map (`PublicMapPage.tsx`). If a visitor leaves the browser tab open without activity for 15 minutes, or returns to a backgrounded tab after 15 minutes, their session automatically expires and the `PublicAccessModal` re-appears requiring them to re-enter their Name and Agency (*Instansi*). Closing the browser tab will also naturally clear the session via `sessionStorage`.

## Key Requirements & Specifications

1. **Session Lifetime & Inactivity Threshold**:
   - Timeout Duration: **15 minutes** (`15 * 60 * 1000` milliseconds).
   - Storage Key: `public_map_visitor` in `sessionStorage`.

2. **Session Storage Payload Schema**:
   ```typescript
   interface VisitorSessionData {
     nama: string;
     instansi: string;
     id?: number;
     last_active: number; // Unix timestamp in ms
   }
   ```

3. **Inactivity Detection & Expiry Check Points**:
   - **Initial Load**: Validate `last_active` timestamp against `Date.now()`. If `Date.now() - last_active >= 15 mins`, invalidate session.
   - **Tab Visibility Change (`visibilitychange`)**: When user returns to the tab (`document.visibilityState === 'visible'`), verify if 15 minutes have elapsed since `last_active`. If expired, prompt the access modal immediately.
   - **User Activity Listener (Throttled)**: Track user interactions (`mousemove`, `keydown`, `click`, `touchstart`, `scroll`). Throttle timestamp updates to `sessionStorage` (once every 10 seconds) to ensure optimal client performance.
   - **Periodic Inactivity Check (Timer)**: Run a background timer check every 30 seconds while the page is open to catch prolonged idle sessions.

4. **Session Expiry Action**:
   When a session expires:
   - Clear `public_map_visitor` from `sessionStorage`.
   - Clear visitor-related state variables in `PublicMapPage.tsx`.
   - Open `PublicAccessModal` asking for Name and Instansi.

5. **Modular Architecture**:
   - Create helper module `resources/js/lib/visitorSession.ts` containing:
     - `getVisitorSession()`
     - `setVisitorSession(data)`
     - `updateVisitorLastActive()`
     - `isVisitorSessionExpired()`
     - `clearVisitorSession()`
