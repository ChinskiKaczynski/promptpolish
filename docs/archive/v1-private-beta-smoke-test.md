> [!WARNING]
> **Archived / Historical** — This document has been moved to archive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# Final Manual Smoke-Test Checklist â€” PromptPolish v1 Private Beta

**Date:** 2026-06-13
**Author:** Senior QA & Release Auditor
**Status:** FINAL â€” Use this checklist for all post-deploy verification runs
**Applies to:** `STRIPE_ENABLED=false` private beta deployment

> [!IMPORTANT]
> This is the authoritative smoke-test checklist superseding the earlier Phase A / Phase B checklists in `v1-production-smoke-test-plan.md`. That document remains for historical reference and Stripe staging scenarios.

> [!NOTE]
> **Preparation**: Have three browser profiles ready: (1) Owner profile, (2) Incognito/Private â€” unauthenticated, (3) Logged-in Free account. Use the Stripe CLI for billing tests.

---

## Section 1: Public / Anonymous

### 1.1 Landing Page
- [ ] Navigate to `/`. Page loads in dark mode, no console errors.
- [ ] Navbar displays correctly. Footer links (`/terms`, `/privacy`, `/pricing`) are present.
- [ ] Mobile layout: Open DevTools, toggle device mode (375px). No horizontal scroll, no overlapping elements.

### 1.2 Anonymous Analysis Success
- [ ] Submit a clean prompt (`"Napisz zwiÄ™zĹ‚y opis produktu SaaS dla menedĹĽerĂłw"` â€” 52 chars).
- [ ] Loader appears. Redirects to `/result/[id]` with structured scorecard.
- [ ] Score, criteria grid, improved prompt, and copy button all render.
- [ ] No AI provider name (`DeepSeek`, `OpenRouter`, `deepseek-v4-flash`) visible anywhere on result page.
- [ ] No internal UUID or analysis ID visible in breadcrumbs or page copy.

### 1.3 Anonymous Daily / Monthly Limit
- [ ] Submit 3 anonymous audits from the same browser.
- [ ] 4th submission returns `429 Too Many Requests` with a localized daily limit warning.
- [ ] The limit warning references the correct daily limit number (default: 3).

### 1.4 Sensitive Data Block
- [ ] Type `OPENAI_API_KEY=sk-test1234567890abcdefghijklmnop` into the prompt input.
- [ ] Submit button is immediately disabled / blocked client-side.
- [ ] Warning panel shows detected pattern. Request does NOT reach `/api/analyze`.
- [ ] Verify in DB: no prompt_analyses row created for this attempt.

### 1.5 Markdown and TXT Export (Anonymous Owner)
- [ ] On a completed result page (owned by anonymous cookie), click Export Markdown.
- [ ] File downloads as `.md`, contains scorecard data, no internal tokens or system UUIDs.
- [ ] Click Export TXT. File downloads as `.txt` with equivalent content.
- [ ] Verify `Cache-Control: private, no-store` header on export response (use browser DevTools Network tab).

### 1.6 PDF Denied with Upgrade CTA
- [ ] On the same result page, click Export PDF.
- [ ] NOT downloaded. Upgrade CTA/modal appears instead of 403 raw error.
- [ ] CTA links to `/pricing`.

### 1.7 Share Enable / Revoke
- [ ] On the result page, toggle the Share switch ON.
- [ ] Public URL (`/share/[token]`) is generated and displayed.
- [ ] Open the share URL in **Incognito** (Profile 2). Page renders in read-only mode.
  - [ ] No share toggle visible.
  - [ ] No favorites button visible.
  - [ ] No feedback form visible (thumbs up/down).
  - [ ] No export buttons visible.
- [ ] Toggle Share OFF (in Owner profile).
- [ ] Refresh Incognito tab. Receives **404 Not Found**.

### 1.8 Non-Owner Access Block
- [ ] Copy the private `/result/[id]` URL.
- [ ] Open in Incognito. Returns **404 Not Found** (not the result).

---

## Section 2: Authenticated Free User

### 2.1 Email Login & Session Refresh
- [ ] Navigate to `/login`. Enter valid test email/password.
- [ ] Redirects to `/account` or `/` with user session active.
- [ ] Navigate away and back. Session persists without re-login.
- [ ] Open DevTools > Application > Cookies. No `sb-session` cookie (Supabase SSR uses its own cookie names). Anonymous `owner_anonymous_id` cookie remains separate.

### 2.2 Analysis Success (Authenticated)
- [ ] Submit a clean prompt while logged in.
- [ ] Redirects to `/result/[id]` with structured scorecard.

### 2.3 History Persistence
- [ ] Navigate to `/history`.
- [ ] Completed analyses appear in the list.
- [ ] Search by prompt text works (results filter correctly).
- [ ] Language filter and sort (newest/oldest) work.

### 2.4 Favorites
- [ ] Toggle the star â… on a history item.
- [ ] Filter by Favorites. Only starred items appear.
- [ ] Un-star. Item disappears from Favorites filter.

### 2.5 Soft Delete
- [ ] Delete a history item.
- [ ] Item immediately disappears from `/history`.
- [ ] Direct navigation to `/result/[deleted-id]` returns **404**.
- [ ] Share link for deleted item (if previously enabled) returns **404** in Incognito.

### 2.6 Markdown / TXT Export (Authenticated Owner)
- [ ] Export Markdown from a result page. Downloads correctly. No private tokens.
- [ ] Export TXT. Downloads correctly.

### 2.7 PDF Denied (Free Plan)
- [ ] Click Export PDF on a Free account result.
- [ ] NOT downloaded. Upgrade CTA appears.

### 2.8 Share Enable / Revoke (Authenticated)
- [ ] Enable share on a result. Copy public URL.
- [ ] Verify public URL in Incognito: read-only, no private controls.
- [ ] Disable share. Public URL returns 404.

### 2.9 Logout
- [ ] Click logout. Redirects to `/` or `/login`.
- [ ] Navigating to `/account` or `/history` redirects to login.
- [ ] Session cookie cleared.

---

## Section 3: Pro Simulation / Test Mode

> [!IMPORTANT]
> Test this in **development mode** or with an account listed in `ADMIN_EMAILS`. The `SimulateProButton` must NOT be accessible to arbitrary users in production.

### 3.1 Simulate Pro Activation
- [ ] Log in as admin/dev account.
- [ ] Navigate to `/pricing` or `/account`. Activate SimulateProButton.
- [ ] Account shows `Beta Symulacja` / Simulated Pro badge.
- [ ] DB: `user_profiles.plan_slug = 'pro'` for this user (no Stripe subscription record).

### 3.2 Pro 24k Prompt Accepted
- [ ] Submit a prompt > 12,000 chars (up to 24,000). Analysis completes successfully.
- [ ] A Free user submitting the same prompt gets rejected at the character limit.

### 3.3 PDF Export Works (Pro)
- [ ] On any result page as simulated Pro, click Export PDF.
- [ ] PDF downloads successfully.
- [ ] Verify Polish characters (`Ä…Ä™Ä‡Ĺ‚Ĺ„ĂłĹ›ĹşĹĽ`) render correctly in the PDF.

### 3.4 Pro Limits Apply
- [ ] Pro daily limit: 100 analyses (not 3). Verify by checking config, not by running 100 audits.
- [ ] Pro monthly limit: 500 (not 10 or 20).

### 3.5 Billing Page â€” STRIPE_ENABLED=false
- [ ] Navigate to `/pricing`. Pro checkout button is DISABLED or replaced with waitlist/beta notice.
- [ ] NO Stripe checkout session is created. No redirect to `checkout.stripe.com`.
- [ ] `/account` shows amber Beta Info banner instead of real billing details.

---

## Section 4: Billing (Staging / Test Mode Only)

> [!WARNING]
> Run Sections 4.2â€“4.5 **only on staging** with `STRIPE_ENABLED=true` pointing to Stripe test keys. Never run on production with live keys.

### 4.1 Checkout Rejects Unauthenticated (STRIPE_ENABLED=false, production)
- [ ] POST to `/api/billing/checkout` without a session returns **403 `billing_disabled`**.

### 4.2 Arbitrary Client Price Rejected (staging)
- [ ] POST to `/api/billing/checkout` with an arbitrary `priceId` in body. Route uses `STRIPE_PRICE_ID_PRO` from env, not client input. Arbitrary price is ignored/rejected.

### 4.3 Checkout Flow (staging)
- [ ] Log in. Click upgrade on `/pricing`.
- [ ] Redirects to `checkout.stripe.com` (test mode URL).
- [ ] Complete with test card `4242 4242 4242 4242`, expiry `12/30`, CVC `123`.
- [ ] Redirects back to app. Account shows Pro badge.

### 4.4 Webhook Duplicate Event Idempotent (staging)
- [ ] In Stripe dashboard, resend a `checkout.session.completed` event for the same session.
- [ ] DB: no second subscription row created; `stripe_webhook_events` shows `duplicate_success` or `processed` for second delivery.
- [ ] No 500 error in Vercel logs.

### 4.5 Cancellation Updates Entitlement (staging)
- [ ] In Stripe dashboard, cancel the test subscription.
- [ ] Webhook fires `customer.subscription.updated` or `customer.subscription.deleted`.
- [ ] DB: `plan_slug` reverts to `free`.
- [ ] PDF export blocked after cancel.

### 4.6 Past-Due Grace Period (staging)
- [ ] Trigger `past_due` status in Stripe dashboard.
- [ ] Account shows grace period warning.
- [ ] Pro entitlements (PDF export) remain active during `past_due`.

### 4.7 Unpaid Downgrade (staging)
- [ ] Trigger `unpaid` status.
- [ ] Account shows suspended message.
- [ ] `plan_slug = 'free'` in DB.
- [ ] PDF returns 403.

---

## Section 5: Security & Privacy

### 5.1 CSP â€” No Browser Violations
- [ ] Open browser DevTools > Console on `/`, `/analyze`, `/result/[id]`.
- [ ] No CSP violation errors.
- [ ] In production mode, `unsafe-eval` is absent from script-src; `unsafe-inline` is present (documented workaround).

### 5.2 Private Pages Are noindex
- [ ] View source or check headers for `/terms`. Contains `<meta name="robots" content="noindex">`.
- [ ] Same for `/privacy`.
- [ ] `/result/[id]` â€” verify it does NOT serve a cached version to non-owners.

### 5.3 Private Exports No-Store
- [ ] Network DevTools: Export Markdown from `/api/export/[id]`.
- [ ] Response includes `Cache-Control: private, no-store`.

### 5.4 Public Share â€” No Private Controls
- [ ] See Section 1.7 â€” already covers this.
- [ ] Additionally verify: share page does NOT render the raw `input_prompt` text (only scrubbed output data).

### 5.5 No Raw Prompt Leaked Where Not Intended
- [ ] Public share page (`/share/[token]`): original prompt text NOT displayed.
- [ ] History list: prompts truncated to 120 chars, sensitive data redacted from preview.

### 5.6 No Secrets in Vercel Logs
- [ ] After any analysis run, check Vercel Runtime Logs.
- [ ] No `OPENROUTER_API_KEY`, `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` values appear.
- [ ] No `[STRIPE_SECRET_KEY_REDACTED]` false-positive pattern from test strings in production logs.

### 5.7 No Secrets in Client Bundle
- [ ] Run `pnpm test` â€” `tests/api/production-readiness.test.ts` checks for secret exposure patterns.
- [ ] Inspect `.next/static/` â€” no secret key patterns in JS bundle files.

---

## Section 6: Server Observability

### 6.1 RLS â€” No Permission Denied Errors
- [ ] After anonymous and authenticated analysis runs, check Supabase Dashboard > Logs > Postgres.
- [ ] No RLS policy rejection errors. All queries route through `service_role`.

### 6.2 No Zod Parse Failures
- [ ] Check Vercel logs. No `ZodError` or structured output parse failures from OpenRouter responses.

### 6.3 Admin Metrics Accessible
- [ ] Navigate to `/admin/metrics` as an admin account.
- [ ] Metrics load without error.
- [ ] No raw email addresses visible in output. IP addresses are hashed.

---

## Sign-Off Table

| Area | Check | Result | Notes |
|---|---|:---:|---|
| Public anonymous audit | Sections 1.2â€“1.8 | _TBD_ | |
| Daily limit enforcement | Section 1.3 | _TBD_ | |
| Sensitive data block | Section 1.4 | _TBD_ | |
| Auth login/session | Section 2.1 | _TBD_ | |
| History/Favorites/Delete | Sections 2.3â€“2.5 | _TBD_ | |
| Export (Markdown/TXT) | Sections 1.5, 2.6 | _TBD_ | |
| PDF denied (Free/Anon) | Sections 1.6, 2.7 | _TBD_ | |
| Share enable/revoke | Sections 1.7, 2.8 | _TBD_ | |
| Pro simulation (dev) | Section 3 | _TBD_ | Dev mode only |
| Billing disabled behavior | Section 3.5 | _TBD_ | STRIPE_ENABLED=false |
| CSP no violations | Section 5.1 | _TBD_ | |
| Private pages noindex | Section 5.2 | _TBD_ | |
| Export no-store header | Section 5.3 | _TBD_ | |
| No secrets in logs/bundle | Sections 5.6â€“5.7 | _TBD_ | |
| RLS no errors | Section 6.1 | _TBD_ | |

---

## Referenced Documents

*   [v1-production-smoke-test-plan.md](./v1-production-smoke-test-plan.md) â€” Detailed Phase A/B/C/D scenarios (historical, Stripe staging)
*   [stripe-test-mode-checklist.md](./stripe-test-mode-checklist.md) â€” Stripe sandbox scenario setup
*   [operator-runbook.md](./operator-runbook.md) â€” Incident response and rollback procedures
*   [v1-release-notes.md](./v1-release-notes.md) â€” Current release state and known limitations
