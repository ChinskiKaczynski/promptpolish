> [!WARNING]
> **Archived / Historical** — This document has been moved to rchive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# Controlled Production Smoke Test Plan (v1.0) â€” PromptPolish

**Date:** 2026-06-04  
**Author:** Senior QA & SaaS Launch Security Engineer  
**Status:** **FROZEN / READY FOR MANUAL RUNS**  
**Target Release:** v1.0 (Auth & History Active, Stripe Test-Mode Staging)

---

## 1. Pre-Test Prerequisites

To prevent configuration errors, leaks, or deployment issues, execute and verify this prerequisite list before initiating any QA verification runs:

*   **Production Domain Verification:** Verify that the domain (e.g. `promptpolish.com` or staging domain) is active, fully routed via SSL/TLS, and configured with HTTP Strict Transport Security (HSTS).
*   **Database Schema Sanity:** Confirm that the production Supabase database contains all the tables initialized by our migrations:
    *   `user_profiles`, `prompt_analyses`, `subscriptions`, `stripe_customers`, `usage_events`, `feedback_events`.
    *   Confirm that Row-Level Security (RLS) policies are active for all tables.
*   **Production Environment Variables (No Secrets Allowed in Commits):**
    *   Verify that the production branch environment variables are populated on Vercel:
        *   `DATABASE_URL` (Direct connection URL)
        *   `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   `SUPABASE_SERVICE_ROLE_KEY` (Keep hidden, never prefix with `NEXT_PUBLIC_`)
        *   `OPENROUTER_API_KEY` (Production key)
        *   `COOKIE_SIGNING_SECRET` (Cryptographically secure hash)
        *   `CRON_SECRET` (Token for cleanups)
        *   `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET` (Test Keys or Live Keys under owner approval)
        *   `STRIPE_PRICE_ID_PRO` (Test mode price or production price ID)
        *   `APP_URL` (Points to host domain)
*   **Stripe Default Switch:** Double-check that `STRIPE_ENABLED=false` is deployed in the primary production configurations unless verifying test-mode staging setups.
*   **OpenRouter Provider Check:** Query the model list endpoint on OpenRouter to confirm general availability and latency.
*   **Stripe Live Mode Verification:** Confirm that Stripe Live Mode credentials are not enabled in the environment. All initial tests will point to test configurations.
*   **Rollback Owner Assignment:** Designate a specific DevOps/QA lead owner with access to the Vercel dashboard and Supabase editor to handle instant rollbacks.
*   **Test User Accounts:** Prepare a minimum of three test user credentials (standard email/password) that have not been used in previous development checks.
*   **Scrubbed/Mock Data Preparation:** Prepare redacted test payloads for sensitive preflight scanning:
    *   *Fake Secret (to trigger block):* `[FAKE_STRIPE_TEST_SECRET_PATTERN_REDACTED]`
    *   *Redacted DB URL (to trigger block):* `postgresql://mockuser:mockpass@localhost:5432/mockdb`
    *   *Standard clean prompt (to pass):* `"Popraw ten prompt, aby byĹ‚ bardziej zwiÄ™zĹ‚y."`

---

## 2. Test Phases

### Phase A: Before Enabling Stripe (`STRIPE_ENABLED=false` Active in Production)
Execute these tests on the live production environment to verify the core anonymous utility, authentication, history, and exports before any payment integrations are enabled.

1.  **Homepage Loads:** Open the browser to the root URL `/`. Verify the landing layout loads in dark mode and all navigation header controls are responsive.
2.  **Core Audits (/analyze):** Navigate to the prompt analyzer tool. Verify prompt scoring works using a standard prompt.
3.  **Anonymous Audits:** Audit a prompt as an unauthenticated visitor. Confirm redirection to `/result/[id]` with structured scorecard output.
4.  **Sensitive-Data Preflight Block:** Paste the fake secret payload prepared above. Verify that the client scanner blocks the submission, logs a console warning, and saves a PII-free entry marked `[Sensitive Data Blocked]` in telemetry.
5.  **Private Result Access:** Clear local storage or open an incognito tab. Attempt to access the result URL `/result/[id]`. Verify it redirects to a standard 404 or authorization error block.
6.  **Owner Verification checks:** Log in as the result owner. Verify the dynamic result scorecard loads with editing controls.
7.  **Opt-in Public Sharing:** Toggle public sharing on the result page. Open the generated share link `/share/[token]` in a separate, unauthenticated browser window. Confirm it displays read-only metrics, disabling editing and feedback inputs.
8.  **Revoking Public Access:** Toggle sharing off on the owner result dashboard. Refresh the public share window and confirm it returns a standard `404 Not Found` page.
9.  **TXT and Markdown Exports:** Click download as Markdown/TXT. Confirm a clean, formatted text file downloads containing prompt metrics.
10. **Pro-Tier PDF Gate Block:** Click export as PDF. Confirm a warning badge appears informing the user that PDF generation is a Pro feature, prompting for upgrade.
11. **Registration & Auth Flow:** Register a new user account. Confirm email verification is triggered, sign in successfully, check `/account` redirect, and log out.
12. **Account History Action:** Audit several prompts while logged in. Mark one as a favorite, filter the list, soft-delete one item, and verify it disappears from history and cannot be recovered via API routes.
13. **Policy visibility:** Confirm `/terms` and `/privacy` draft policy pages load footer links and display amber draft banners.
14. **Mobile Layout Check:** Emulate responsive phone sizes. Confirm navigation burger menus, scoring grids, and text areas resize cleanly without horizontal scrolling.

### Phase B: Stripe Test-Mode / Staging Verification (`STRIPE_ENABLED=true` pointing to Test Mode keys)
Deploy the staging environment using Stripe Test keys to verify billing event configurations.

1.  **Stripe Redirect:** Go to `/pricing`. Click upgrade CTA. Verify redirect to Stripe checkout page on a test-mode url.
2.  **Mock Purchase:** Complete checkout using test card `4242 4242 4242 4242`. Confirm checkout returns user to success page.
3.  **Plan Ingestion Sync:** Go to `/account`. Confirm badge updates to **Pro** plan.
4.  **Customer Portal Access:** Click manage subscription. Confirm Stripe portal redirects. Update details, cancel the subscription, close portal, and verify redirect back to application account settings.
5.  **Grace Period (past_due) Verification:** Trigger payment failure or set subscription to `past_due` in Stripe. Verify account page shows the **ZalegĹ‚oĹ›Ä‡ w pĹ‚atnoĹ›ci (Grace Period)** warning but PDF exports remain active.
6.  **Downgrade Verification (unpaid/canceled):** Set Stripe subscription status to `unpaid` or `canceled`. Verify database plan badge degrades to **Free**, displaying the **DostÄ™p zawieszony (Access Suspended)** banner.
7.  **Entitlement Gating Check:** Attempt a PDF export after downgrade. Verify route returns `403 Forbidden`.

### Phase C: Controlled Production Payment Test (Live Keys, Restricted Execution)
*Execute ONLY if all legal/tax/vendor blockers are resolved and owner-approved Stripe configurations are configured.*

1.  **Restrict Checkouts:** Temporarily restrict access to the live pricing checkout route.
2.  **Controlled Live Purchase:** Execute one controlled checkout using the configured production price on the live domain using a valid personal credit card.
3.  **Live Ingest sync:** Verify Stripe webhook synchronizes the user profile to `pro` status.
4.  **Invoice Audit:** Confirm Stripe invoice compiles compliant sequential numbering and calculates destination-based VAT.
5.  **Support Receipt:** Verify that the registered support email receives confirmation.
6.  **Controlled Live Cancellation:** Access the Customer Portal on the live billing layout, execute a cancellation, and verify it updates the database profile correctly.
7.  **Rollback Execute:** If the database sync fails or user badge remains Free, immediately trigger the billing rollback procedure.

### Phase D: Post-Test Verification
1.  **Log Leak Audit:** Verify Vercel runtime logs for raw secrets (e.g. `[STRIPE_SECRET_KEY_REDACTED]`, `OPENROUTER_API_KEY`). Ensure no private details are exposed.
2.  **PII Telemetry Check:** Verify that metrics dashboard database logs scrub email addresses and salt/hash IP records.
3.  **Client Bundle Audit:** Static check on bundles. Verify that no private environment keys are exposed inside JS files.

---

## 3. Expected Results Table

| ID | Area | Steps | Expected Result | Pass/Fail | Severity | Rollback Trigger |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **ST-01** | Core | Load homepage `/`. | Dark mode theme displays, header buttons responsive. | *TBD* | Blocker (P0) | No |
| **ST-02** | Core | Audit standard prompt. | Redirection to result view page, score displays. | *TBD* | Blocker (P0) | No |
| **ST-03** | Security | Submit fake credential string. | Scans intercept prompt, display client warning, log metadata. | *TBD* | Blocker (P0) | Yes |
| **ST-04** | Security | Load private `/result/[id]` in incognito. | Redirects to 404 or authorization error block. | *TBD* | Blocker (P0) | Yes |
| **ST-05** | Security | Access `/share/[token]` on active share. | Shows read-only layout, feedback/editing disabled. | *TBD* | Blocker (P0) | Yes |
| **ST-06** | Security | Access `/share/[token]` on disabled share. | Returns standard `404 Not Found` response. | *TBD* | Blocker (P0) | Yes |
| **ST-07** | Export | Click Markdown export. | Download triggers file saving prompt metrics. | *TBD* | Major (P1) | No |
| **ST-08** | Entitlements | Click PDF export on Free plan. | Access blocked, displays upgrade alert. | *TBD* | Blocker (P0) | Yes |
| **ST-09** | Auth | Register test email. | Verification email sent, routes to account page. | *TBD* | Major (P1) | No |
| **ST-10** | History | Set favorite flag, delete audit. | Favorites filters apply, deleted items blocked from recovery. | *TBD* | Major (P1) | No |
| **ST-11** | Billing | Click checkout CTA (STRIPE_ENABLED=false). | Button links disabled or displays waitlist alerts. | *TBD* | Blocker (P0) | Yes |
| **ST-12** | Billing | Redirect checkout (STRIPE_ENABLED=true). | Routes user to secure Stripe payment layout. | *TBD* | Blocker (P0) | Yes |
| **ST-13** | Billing | Verify webhook ingestion (Active). | Mapped profile updates plan status to `pro`. | *TBD* | Blocker (P0) | Yes |
| **ST-14** | Billing | Verify webhook ingestion (past_due). | Account shows grace alert, Pro tools active. | *TBD* | Blocker (P0) | Yes |
| **ST-15** | Billing | Verify webhook ingestion (unpaid/canceled). | Badge returns to `free`, Pro tools blocked. | *TBD* | Blocker (P0) | Yes |
| **ST-16** | Operations | Scan production client bundle logs. | Zero instances of private keys (e.g. `[STRIPE_SECRET_KEY_REDACTED]`, `OPENROUTER_API_KEY`). | *TBD* | Blocker (P0) | Yes |

---

## 4. Rollback Triggers

Initiate the rollback procedure immediately if any of the following occurrences take place:

*   **Stripe Webhook Sync Mismatch:** Ingestion updates throw database locks, status syncing fails, or profile status does not update to `pro` within 60 seconds of checkout completion.
*   **Pro Entitlement Bypass:** Users on standard Free plans bypass entitlement logic to download PDF documents.
*   **Private Data Exposure:** Access control validations fail, allowing public or third-party users to view result pages they do not own.
*   **Telemetry Credential Leak:** Raw client credentials, passwords, or Stripe secret variables appear in stdout logs or client bundle JS files.
*   **Unstable Provider Rate:** Upstream model failure rate exceeds 5% over a 15-minute verification window.
*   **Legal Compliance Blockers Unresolved:** Deployment of Stripe Live payments without signed DPAs, tax audits, VAT OSS validations, or formal policy counsel sign-offs.

---

## 5. Rollback Procedure

Execute these actions sequentially if a rollback trigger is met:

```mermaid
graph TD
    A[Trigger Met] --> B[Set STRIPE_ENABLED=false in Vercel]
    B --> C[Verify Checkout CTA Fallback to Waitlist]
    C --> D[Mute Stripe Webhooks in Stripe Console]
    D --> E[Revert Vercel Route to Last Stable Commit]
    E --> F[Document Incident in Runbook Logs]
```

1.  **Disable Stripe Checkout:** Log in to Vercel and change `STRIPE_ENABLED=false`. Redeploy or restart the production team environment variables.
2.  **Verify Waitlist CTA Fallback:** Reload `/pricing` and verify that Stripe checkouts are deactivated and waitlist forms load.
3.  **Mute Stripe Webhooks:** Open Stripe Developer Console > Webhooks. Pause the production webhook receiver to stop incoming event requests.
4.  **Promote Last Stable Deployment:** In the Vercel dashboard, locate the last stable Git release commit (the anonymous-only version) and trigger a routing Rollback.
5.  **Notify Team & Log Incident:** Send notification email alert updates to DevOps and the product owner. Record webhook responses and log output in database incident folders.

---

## 6. Go/No-Go Verdict Gates

The release manager must confirm the verdict for each milestone gate before advancing the launch process:

### Verdict Gate 1: Anonymous / Private Beta Smoke
*   **Verdicts:** **đźź˘ GO**
    *   *Requirements:* Passing automated lints, tests, builds, and verifying preflight security scanning.

### Verdict Gate 2: Stripe Test-Mode Smoke
*   **Verdicts:** **đźź˘ GO**
    *   *Requirements:* Stripe test products registered, CLI forwarding checked, checkout and grace periods verified in staging.

### Verdict Gate 3: Controlled Paid Production Smoke
*   **Verdicts:** **đź”´ NO-GO**
    *   *Requirements:* Locked until legal, tax, and processor DPAs are formally executed.

### Verdict Gate 4: Public Paid Launch
*   **Verdicts:** **đź”´ NO-GO**
    *   *Requirements:* Locked until Controlled Production Payment checks pass successfully without triggering rollbacks.

---

## 7. Referenced Documents
*   [stripe-test-mode-checklist.md](./stripe-test-mode-checklist.md) â€” Test catalog configurations.
*   [v1-product-freeze-review.md](./v1-product-freeze-review.md) â€” Feature status and frozen module rules.
*   [pre-production-launch-checklist.md](./pre-production-launch-checklist.md) â€” Consolidated pre-launch requirements.
*   [operations-runbook.md](./operations-runbook.md) â€” Logging signatures and rollback instructions.
*   [legal-readiness.md](./legal-readiness.md) â€” Legal entity compliance, EU tax structure, and sub-processor inventories.
