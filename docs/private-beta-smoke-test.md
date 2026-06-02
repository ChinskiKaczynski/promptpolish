# Production Smoke Test Checklist - Private Beta

This checklist must be executed by the product engineer or launch operator immediately after deployment to the live environment, and prior to inviting the first beta tester.

---

## 1. Authentication & Session Stability
- [ ] **Sign In**: Access the login page and sign in using a test email. Confirm that auth redirects to the dashboard smoothly.
- [ ] **Sign Out**: Click "Wyloguj" in the navigation bar. Verify that the session terminates and redirects to the landing page.
- [ ] **Login Retention**: Log back in, close the tab, reopen it, and navigate back. Verify that the session is persisted via cookies/local storage.

---

## 2. Entitlement & Pro Mode Simulation
- [ ] **Simulate Pro Route**: As an administrator (`nupharizar@gmail.com`), access the `simulate-pro` route.
  - Verify that the API returns a successful `200 OK` response.
  - Check that the database updates your `plan_slug` to `pro`.
- [ ] **Account Plan Persistence**: Navigate to `/account` and refresh the page.
  - Verify that the plan is displayed as **Pro** and persists across page refreshes.
- [ ] **Non-Admin Access Denial**: Sign in as a test email *not* listed in `ADMIN_EMAILS` (e.g. `test@example.com`).
  - Attempt to call the `simulate-pro` route.
  - Verify that the request is rejected with a `403 Forbidden` response and does not upgrade the account.

---

## 3. Core Analyze Flow & Safety Preflight
- [ ] **Standard Audit Flow**: On the landing page or new audit page, choose Polish (`PL`), paste a standard prompt (e.g., `"Napisz życzenia urodzinowe dla kolegi z pracy"`), and click the audit button.
  - Confirm the loading spinner appears.
  - Confirm it redirects to `/result/[id]` upon completion.
- [ ] **Result Page Checks**:
  - Verify that the header renders as `"Raport audytu promptu"`.
  - Confirm that **NO** developer-internal database UUIDs or AI provider tags (`DeepSeek`, `OpenRouter`, `deepseek-v4-flash`) are visible on the page.
  - Expand the criteria cards and ensure styling and text are readable.
- [ ] **Fake High-Risk Secret Blocking**: In the prompt input block, paste a fake API key: `sk-proj-55555SECRETKEYFORTESTINGBLOCKING` or a database URL `postgresql://user:pass@localhost:5432/db`.
  - Verify that the "Audytuj prompt" button is immediately disabled.
  - Confirm the warning panel describes the risk and blocks submission.
  - Verify that no network request is sent to the LLM backend.

---

## 4. Telemetry & User Event Tracking
- [ ] **Copy Event**: On the result page, click the "Kopiuj prompt" button.
  - Verify the button text updates to "Skopiowano!" or "Skopiowano prompt!".
  - Paste the clipboard contents to confirm it matches the improved prompt.
  - Verify (via admin metrics or database query) that `copy_improved_prompt` or `copy` is recorded.
- [ ] **Feedback Event**: Click the upvote button `👍 Tak, bardzo`.
  - Confirm the thanks message appears.
  - Click the downvote button `👎 Nie, słaba jakość`. Verify the critique feedback textarea opens, type a test response, and submit.
  - Verify that the feedback is logged in the `feedback_events` table.

---

## 5. Sharing Controls & Public Scrubbing
- [ ] **Public Share Toggle**: Toggle "Udostępnij raport" to ON.
  - Verify a shareable link `/share/[token]` is generated.
- [ ] **Public Share Safety**: Open the share link in an Incognito window (unauthenticated).
  - Verify the page renders under `"Publiczny raport"` branding.
  - Confirm that **NO** user details, private UUIDs, edit buttons, upvote/downvote buttons, or share status toggles are visible.
- [ ] **Public Share Disable**: Toggle the sharing switch back to OFF in the owner's session.
  - In the Incognito window, refresh the page.
  - Verify that the page returns a clean **404 Not Found** error.

---

## 6. Admin Metrics Panel
- [ ] **Authorized Admin Access**: Sign in as `nupharizar@gmail.com` and navigate to `/admin/metrics`.
  - Verify that the full dashboard page load succeeds and charts/tables render.
- [ ] **Unauthorized Admin Block**: Sign in as a regular user, or open the link `/admin/metrics` in Incognito.
  - Verify that the route redirects to login, or displays a `403 Forbidden` / `404 Not Found` page.

---

## 7. Mobile Layout & UX Check
- [ ] **Responsive Navigation**: In mobile viewport (390x844 or similar), open the application.
  - Verify that the navigation menu collapses/adapts cleanly.
- [ ] **Mobile Code Gutter Wrap**: Navigate to a result page on mobile.
  - Verify that the code blocks and gutters wrap cleanly without stretching the page horizontally.
