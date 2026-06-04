# Executable Launch Checklist (v1.0) — PromptPolish

> [!WARNING]
> **LEGAL & BILLING BLOCKER: PRODUCT NOT LEGALLY READY FOR PRODUCTION PAID TRAFFIC**
> This launch checklist maps out the validation path for PromptPolish v1.0. 
> The **Public Paid Launch** milestone is strictly a **NO-GO** and must remain blocked until all legal entity setup, EU tax/VAT OSS rules, and vendor Data Processing Addendums (DPAs) are finalized and approved by qualified legal counsel. 
> Keep `STRIPE_ENABLED=false` as the default in production to protect the platform.

---

## Referenced Base Documents
- [v1-product-freeze-review.md](./v1-product-freeze-review.md) — Feature freeze status and locked engine modules.
- [v1-production-smoke-test-plan.md](./v1-production-smoke-test-plan.md) — Manual smoke tests and environment configurations.
- [pre-production-launch-checklist.md](./pre-production-launch-checklist.md) — Pre-launch engineering and compliance roadmap.
- [stripe-test-mode-checklist.md](./stripe-test-mode-checklist.md) — Local and staging Stripe sandbox testing.
- [legal-readiness.md](./legal-readiness.md) — GDPR, tax details, and sub-processor agreements.
- [operations-runbook.md](./operations-runbook.md) — Operations logging, retention crons, and support playbooks.
- [production-smoke-test.md](./production-smoke-test.md) — Visual design, layout, and copy validation checklists.

---

## 1. Release Scope

This release (v1.0) encapsulates the anonymous prompt check utility and lays the structural foundations for account history, billing integration, and PDF exports.

- [ ] **Anonymous-First Audit Flow**: Verify visitors can perform prompt audits without an account, receiving scoring metrics, critiqued categories, and copy-ready recommendations.
- [ ] **Account & History**: Verify registered users can view their history dashboard, filter by language or date, toggle favorites, and execute cascading soft-deletes.
- [ ] **Share Links**: Verify owner-controlled share generation with clean, read-only public pages.
- [ ] **Multi-Format Document Exporters**: Confirm file generation for Markdown (`.md`) and Plain Text (`.txt`) documents (restricted to the report owner).
- [ ] **Pro-Only PDF Export**: Confirm PDF download requests are blocked for free accounts, displaying an upgrade prompt.
- [ ] **Server-Side Entitlements**: Ensure tier-gates (PDF export, usage thresholds) are validated in the API routes via database checks, not just UI restrictions.
- [ ] **Stripe Foundation**: Verify local/staging checkouts, webhook endpoints, and status syncing logic.
- [ ] **Terms & Privacy Pages**: Confirm that `/terms` and `/privacy` contain the policy draft text with visible amber draft banners.
- [ ] **No Public Paid Launch Yet**: Ensure that commercial paid checkouts remain disabled (`STRIPE_ENABLED=false` configuration default).

---

## 2. Technical Checklist

Verify infrastructure stability, access controls, and code hygiene.

- [ ] **Lint, Test, and Build Compilation**:
  - [ ] Run linter: verify `pnpm lint` completes with zero errors or warnings.
  - [ ] Run unit and integration tests: verify `pnpm test` passes all tests.
  - [ ] Run production compiler: verify `pnpm build` finishes successfully without Turbopack compile warnings.
- [ ] **Production Environment Configurations**: Ensure the production hosting provider (Vercel) environment contains the necessary variables (do not write raw values in codebase/commits):
  - [ ] `DATABASE_URL` (Direct database connection pool)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (Keep secure, do not prefix with `NEXT_PUBLIC_`)
  - [ ] `OPENROUTER_API_KEY` (Live AI engine endpoint key)
  - [ ] `COOKIE_SIGNING_SECRET` (Secure cookie signature)
  - [ ] `CRON_SECRET` (For scheduled database maintenance authentication)
  - [ ] `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET` (Stripe key bindings)
  - [ ] `STRIPE_PRICE_ID_PRO` (Subscription tier ID)
  - [ ] `APP_URL` (Domain host url)
- [ ] **Supabase Migrations Verified**: Confirm production database has successfully executed all migrations in `supabase/migrations`.
- [ ] **Row-Level Security (RLS) Verified**: Check that all tables have RLS enabled, protecting private prompt histories and billing associations from unauthorized access.
- [ ] **OpenRouter/Provider Health Verified**: Verify that OpenRouter responds with DeepSeek-v4-flash models and that transient 429/500/503 errors map to user-friendly messages.
- [ ] **Cron Cleanup Verified**: Verify that the daily cleanup script purges old telemetry events (90 days for usage, 180 days for feedback, 30 days for unstarred/unshared audits).
- [ ] **No Secrets in Client Bundle**: Confirm that no private keys (such as OpenRouter keys or Stripe secret keys) are exposed in compiled JavaScript files.
- [ ] **Admin Metrics Verified**: Confirm the `/admin/metrics` endpoint aggregates statistics cleanly without listing raw emails or exposing user IP addresses.
- [ ] **Rollback Path Documented**: Ensure the DevOps team has access to the Vercel Deployments tab for instant rollbacks and knows the Supabase database schema revert playbook.

---

## 3. Product Smoke Checklist

E2E verification of core user journeys in the live environment.

- [ ] **Homepage Layout**:
  - [ ] Verify the page loads in dark mode and all navigation header controls are responsive.
  - [ ] Confirm spelling of benefits and target cards (e.g., `"Konsultanci i trenerzy AI"`, `"Marketerzy i copywriterzy"`).
- [ ] **Analyze Flow**: Confirm prompt checks complete successfully, leading to a structured scorecard redirect.
- [ ] **Sensitive-Data Preflight Block**: Submit a prompt containing a fake secret pattern or mock connection string. Verify the scanner intercepts the request client-side, showing a block alert.
- [ ] **Private Result Owner Access**: Log in as the owner of an audit result and verify that editing features, favorite flags, and markdown exports load correctly.
- [ ] **Non-Owner Access Block**: Attempt to view a private result UUID in a separate incognito window. Verify it yields a standard 404 or authorization error block.
- [ ] **Public Share Create/Disable**:
  - [ ] Toggle sharing on a result. Verify it generates a `/share/[token]` link.
  - [ ] Access the share link in incognito. Verify it displays a read-only layout with no editing/feedback.
  - [ ] Toggle sharing off. Confirm the share link immediately returns a 404 response.
- [ ] **Exports Verification**: Download audit scorecards as `.md` and `.txt`. Check that formatting and metrics are correct.
- [ ] **Auth Login/Logout**:
  - [ ] Register a new test user account and complete sign-up.
  - [ ] Check `/account` details and billing badges.
  - [ ] Log out, confirming session revocation.
- [ ] **History / Favorites / Delete**:
  - [ ] Verify audited prompts are visible on `/history`.
  - [ ] Mark an item as a favorite and check filters.
  - [ ] Delete a history item, confirming it is blocked from retrieval across all API routes.
- [ ] **Pricing, Terms, and Privacy Visibility**: Confirm links load properly from the footer and display correct headers with draft warning banners.
- [ ] **Mobile Sanity Check**: Emulate mobile layout dimensions. Confirm navigation burger menus, scoring grids, and text areas resize cleanly without horizontal scrolling.

---

## 4. Billing Checklist

Verify payment workflows in test-mode first, keeping live payments blocked.

- [ ] **STRIPE_ENABLED=false Default**: Double-check that billing is disabled by default in production settings to prevent early public purchases.
- [ ] **Stripe Test-Mode Checkout Verified**:
  - [ ] Click upgrade CTA on staging. Verify redirect to the secure Stripe Checkout test page.
  - [ ] Complete purchase using a Stripe mock card. Confirm return redirect back to the application.
- [ ] **Customer Portal Verified**: Open "Manage billing" on `/account`. Verify Stripe Customer Portal loads, allowing mock invoice downloads or trial cancellations.
- [ ] **Webhook Integration Verified**: Ensure webhook events (`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`) route safely to `/api/webhooks/stripe`.
- [ ] **Active Status Mapped to Pro**: Confirm that database records transition a user's `plan_slug` to `pro` upon payment completion.
- [ ] **Past_Due Grace Period Verification**:
  - [ ] Change test customer subscription to `past_due` in the Stripe dashboard.
  - [ ] Confirm `/account` displays the **Zaległość w płatności (Grace Period)** warning.
  - [ ] Verify the user still retains PDF export privileges.
- [ ] **Unpaid/Canceled Downgrade Policy**:
  - [ ] Change subscription status to `unpaid` or `canceled` in the Stripe dashboard.
  - [ ] Verify `/account` changes the tier badge to Free and shows **Dostęp zawieszony (Access Suspended)**.
- [ ] **PDF Pro Gate Verification**: Verify that downloading PDF exports returns a 403 response after a subscription downgrade.
- [ ] **Stripe Production Setup Blocked**: Ensure live Stripe credentials, webhook setups, and billing toggles remain strictly blocked until legal and tax steps are finalized.

---

## 5. Legal / Privacy / Tax Checklist

Ensure compliance rules are resolved before transitioning to production paid tiers.

- [ ] **Legal Entity Resolution**: Finalize the registered company physical address and formal business name, replacing all placeholders in terms, policies, and receipts.
- [ ] **Support/Privacy Inboxes Created**: Establish and test the email address mailboxes for handling user issues and GDPR erasure requests.
- [ ] **Terms of Service Counsel Review**: Obtain official legal review and sign-off on public service terms.
- [ ] **Privacy Policy Counsel Review**: Obtain official legal review and sign-off on public data processing notices.
- [ ] **Refund/Cancellation Policy Finalized**: Finalize the 14-day refund window consumption threshold rule (e.g. limit to users with fewer than 10 completed audits).
- [ ] **VAT / OSS / Stripe Tax Decision**:
  - [ ] Determine B2C VAT registration under the EU VAT One-Stop Shop (OSS) program.
  - [ ] Configure Stripe Tax on the Stripe dashboard to calculate location-based sales taxes dynamically.
  - [ ] Verify VAT ID inputs at checkout for B2B reverse charge routing.
- [ ] **Vendor DPAs Reviewed**: Execute Data Processing Addendums (DPAs) incorporating standard contractual clauses (SCCs) with key sub-processors:
  - [ ] Stripe, Inc.
  - [ ] Supabase, Inc.
  - [ ] Vercel, Inc.
- [ ] **AI Provider Data Terms Reviewed**: Confirm that our OpenRouter model endpoint terms guarantee user input prompts are not retained for downstream model training or manual reviews.
- [ ] **Cookie / ePrivacy Decision**: Verify that our essential `owner_anonymous_id` cookie meets ePrivacy Directive rules for strictly necessary functional data without requiring cookie banners.
- [ ] **No Unsupported Compliance Claims**: Audit public pages to ensure no claims of guaranteed compliance certifications (e.g., "GDPR Certified") are displayed.

---

## 6. Go/No-Go Checklist

The launch checklist is divided into sequential release milestones. Each milestone must meet specific GO criteria to advance.

### Milestone 1: Anonymous / Private Beta
- **Status: 🟢 GO**
- **Criteria**:
  - [ ] Automated tests, eslint rules, and production builds compile successfully.
  - [ ] Sensitive-data preflight scans block fake secret strings client-side.
  - [ ] Private result permissions and public shares operate correctly.
  - [ ] Footer links display draft policies with warning banners.
  - [ ] `STRIPE_ENABLED=false` is enforced.

### Milestone 2: Stripe Test-Mode Paid Beta
- **Status: 🟢 GO**
- **Criteria**:
  - [ ] Stripe CLI successfully forwards test events.
  - [ ] Checkout flows, portals, and webhook status mapping verified on staging.
  - [ ] PDF export entitlements are correctly enforced in Pro and Free states.
  - [ ] past_due grace warning banners display without removing premium tool access.

### Milestone 3: Controlled Production Payment Smoke
- **Status: 🔴 NO-GO (BLOCKED)**
- **Criteria (Locked until Milestone 4 readiness)**:
  - [ ] Legal entity and support channels are finalized.
  - [ ] EU VAT OSS tax strategy and Stripe Tax configurations are enabled.
  - [ ] DPAs signed with Vercel, Supabase, Stripe, and AI providers.
  - [ ] Terms and privacy policies approved by legal counsel.
  - [ ] Stripe checkout requires statutory EU withdrawal waiver consent.

### Milestone 4: Public Paid Launch
- **Status: 🔴 NO-GO (BLOCKED)**
- **Criteria**:
  - [ ] Controlled production payment tests complete successfully on the live domain using a real card.
  - [ ] Invoiced payments generate sequentially numbered VAT invoices.
  - [ ] Webhook sync updates profiles to Pro in under 60 seconds without database deadlocks.
  - [ ] Zero logs or telemetry inputs leak PII or developer secrets.

---

## 7. Rollback Checklist

Execute these recovery procedures if integration failures occur post-launch.

- [ ] **Set STRIPE_ENABLED=false**: Immediately change the environment variable on Vercel to turn off checkouts.
- [ ] **Verify Checkout Disabled**: Confirm that the `/pricing` upgrade button replaces payment redirections with a waitlist form or error card.
- [ ] **Disable / Replace Upgrade CTA**: If the layout cache does not update immediately, deploy a fast patch to hide the pricing cards.
- [ ] **Inspect Webhook Logs**: Audit Stripe Developer webhook deliveries and Vercel execution logs to identify database locks or processing errors.
- [ ] **Verify Entitlement State**: Ensure that users who purchased during the failure window are flagged for support audits or kept on a manual Pro override.
- [ ] **Pause Paid Beta / Public Announcement**: Halt marketing distributions and pause public social media announcements.
- [ ] **Document Incident**: Log the error signature prefix (e.g. `[STRIPE_WEBHOOK_FAILURE]`) and database snapshots in the incident runbook.
- [ ] **Restore Previous Environment / Redeploy**: Revert to the last stable git release commit in the Vercel dashboard, returning edge routers to the previous build.

---

## 8. Final Sign-off Table

| Area | Owner | Status | Evidence/Link | Blocker? | Notes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Technical Readiness** | Release Manager | 🟢 Pass | [v1-product-freeze-review.md](./v1-product-freeze-review.md#9-verification-results--command-output) | No | Lints, unit tests, and production builds complete cleanly. |
| **Product Smoke Checks** | QA Lead | 🟢 Pass | [v1-production-smoke-test-plan.md](./v1-production-smoke-test-plan.md#2-test-phases) | No | Basic audit flow, private security, and markdown exports verified. |
| **Stripe Test Mode** | Billing Engineer | 🟢 Pass | [stripe-test-mode-checklist.md](./stripe-test-mode-checklist.md#4-test-scenarios) | No | Webhook event routing and portal downgrades verified in staging. |
| **Legal Entity Details** | Business Owner | 🔴 Pending | [legal-readiness.md](./legal-readiness.md#5-stripe-production-readiness-blockers-checklist) | **YES** | Corporate name, address, and compliance inboxes TBD. |
| **Counsel Review** | Legal Counsel | 🔴 Pending | [legal-readiness.md](./legal-readiness.md#6-consolidated-list-of-unresolved-legal-tax-and-gdpr-questions) | **YES** | Terms of service and privacy policy draft reviews incomplete. |
| **Tax Compliance** | Tax Advisor | 🔴 Pending | [legal-readiness.md](./legal-readiness.md#6-consolidated-list-of-unresolved-legal-tax-and-gdpr-questions) | **YES** | VAT OSS registration and Stripe Tax configuration details pending. |
| **Sub-processor DPAs** | Business Owner | 🔴 Pending | [legal-readiness.md](./legal-readiness.md#5-stripe-production-readiness-blockers-checklist) | **YES** | Signed DPAs with Vercel, Supabase, Stripe, and AI provider pending. |
| **Production Key Promo** | Release Manager | 🔴 Pending | [v1-production-smoke-test-plan.md](./v1-production-smoke-test-plan.md#2-test-phases) | **YES** | Production webhook registration and Stripe Live Mode keys locked. |
