> [!WARNING]
> **Archived / Historical** — This document has been moved to rchive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# Pre-Production Launch & Readiness Checklist â€” PromptPolish

> [!WARNING]
> **LEGAL & TAX BLOCKER â€” APP IS NOT LEGALLY READY FOR PRODUCTION**  
> This checklist contains engineering and compliance requirements for the launch of PromptPolish. Currently, **PromptPolish is NOT legally ready for commercial paid traffic**. 
> All production payments **must remain disabled** (`STRIPE_ENABLED=false` is the safe default configuration) until all blockers listed in this document are resolved, and formal legal and tax counsel audits have been executed and signed off.

---

## Referenced Documents
This checklist consolidates and references specialized launch, billing, and operational policies. Use the following links to review specific detailed guides:
- [docs/stripe-test-mode-checklist.md](./stripe-test-mode-checklist.md) â€” Stripe test-mode setup and verification scenarios.
- [docs/legal-readiness.md](./legal-readiness.md) â€” GDPR, ePrivacy, and legal entity transition roadmap.
- [docs/billing-policy-draft.md](./billing-policy-draft.md) â€” Terms for subscriptions, cancellations, and grace periods.
- [docs/privacy-policy-draft.md](./privacy-policy-draft.md) â€” Personal data processing, sub-processors, and retention schedules.
- [docs/terms-of-service-draft.md](./terms-of-service-draft.md) â€” Core terms of service, AI disclaimers, and user obligations.
- [docs/launch-checklist.md](./launch-checklist.md) â€” Original MVP visual and layout quality gates.
- [docs/production-smoke-test.md](./production-smoke-test.md) â€” Live system verification steps post-deploy.
- [docs/operations-runbook.md](./operations-runbook.md) â€” Operations logging, rotations, database retention, and playbooks.

---

## 1. Technical Readiness Blockers
These items verify the core infrastructure and backend pipelines are secure, performant, and correctly configured.

- [ ] **Production Supabase Migrations Verified**: Confirm the production Supabase database project is created and all migrations from `supabase/migrations` have been successfully applied.
- [ ] **Row-Level Security (RLS) Policies**: Run security audits to verify RLS is enabled on all tables (`user_profiles`, `prompt_analyses`, `subscriptions`, `stripe_customers`, `usage_events`, `feedback_events`). Confirm `anon` and `authenticated` roles can only select/modify data according to ownership rules.
- [ ] **Production Environment Variables Configured**: Verify Vercel environment variables are populated for the production branch:
  - `DATABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENROUTER_API_KEY` (Production quota key)
  - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID_PRO`
  - `APP_URL` (Pointed to the production domain)
  - *Note: Real production passwords and secrets must never be committed to repository code or checklist files.*
- [ ] **OpenRouter Provider Health & Failovers**: Check provider latency and ensure semantic schema formatting matches expected outputs. Verify that transient status codes (429/503) degrade gracefully into standard user-facing messages.
- [ ] **Database Cron Cleanup Verified**: Verify that automated database retention cleanup runs successfully (Usage events purged after 90 days, Feedback events after 180 days, and Prompt analyses after 30 days unless starred or shared).
- [ ] **Admin Metrics Sanitation**: Confirm `/admin/metrics` gathers statistics through privacy-safe SQL queries without exposing PII (IPs are salted and hashed in-memory, email lists are excluded from logs).
- [ ] **Monitoring & Runbook Log Signatures**: Confirm operations logging utilizes the correct signatures defined in [docs/operations-runbook.md](./operations-runbook.md):
  - `[PROVIDER_ERROR]` â€” Critical OpenRouter failures.
  - `[STRIPE_WEBHOOK_FAILURE]` â€” Database sync or webhook validation issues.
  - `[Sensitive Data Blocked]` â€” Preflight blocks on passwords, keys, or secrets.
- [ ] **Backups & Restore Procedures**: Verify automated daily backups are enabled in Supabase. Document and test the restore playbook to a staging project.
- [ ] **No Secrets in Client Bundle**: Scan compiled bundle artifacts. Verify that no secret environment variables (e.g. `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`) have been prefixed with `NEXT_PUBLIC_` or leaked into JS bundles.
- [ ] **Linter, Tests, and Build Compile Cleanly**:
  - `pnpm lint` completes with zero warnings (`--max-warnings=0`).
  - `pnpm test` executes and passes all test files.
  - `pnpm build` finishes successfully without compile errors.

---

## 2. Product Readiness (Aesthetics & Layout Polish)
These visual and layout verification items guarantee the MVP user experience is premium and functional across devices.

- [ ] **Anonymous Analysis Smoke Test**: Confirm unauthenticated users can perform a prompt audit, view the result scorecard, copy the improved prompt, and toggle language between PL and EN.
- [ ] **Auth Signup/Login Flow**: Verify users can register a new account, verify their email, log in, and redirect successfully.
- [ ] **Account & History Verification**: Ensure logged-in users can view their history, favorite specific reports, soft-delete records, and view their tier profile.
- [ ] **Share Link Activation/Revocation**:
  - Enable sharing on a report and access `/share/[token]` in a clean Incognito tab.
  - Verify it shows the public layout without editing/feedback controls.
  - Disable sharing and refresh the Incognito tab to confirm it immediately returns a **404 Not Found** page.
- [ ] **Markdown & TXT Exports**: Verify that downloading audit results as `.md` or `.txt` works correctly and preserves formatting.
- [ ] **PDF Export Entitlement Verification**:
  - Log in to a **Free** account, click **Export to PDF**, and confirm it triggers the subscription upgrade banner.
  - Log in to a **Pro** account, click **Export to PDF**, and confirm a clean, formatted PDF downloads successfully.
- [ ] **Pricing Page Consistency**: Check that the pricing details on `/pricing` match database configurations and draft terms (Free vs Pro quotas, characters, and features).
- [ ] **Terms & Privacy Visibility**: Ensure standard footer links to `/terms` and `/privacy` are visible and load draft policies correctly.
- [ ] **Mobile & Responsive Sanity Check**: Review navigation, landing headers, criteria tables, and results cards on mobile dimensions to ensure no horizontal scrolling or overlapping elements occur.

---

## 3. Stripe & Billing Readiness Blockers
Billing validations that must be performed in development/test-mode first, and configured for production before launching.

- [ ] **Stripe Test Mode Product and Price Created**: Confirm product "PromptPolish Pro" and recurring price ($9.00/mo or equivalent) are manually set up in the Stripe Dashboard (Test Mode).
- [ ] **Local Webhook Forwarding Tested**: Confirm Stripe CLI is configured and routes events to `/api/webhooks/stripe` successfully.
- [ ] **Stripe Checkout Success Tested**: Perform checkout using Stripe test cards (e.g. `4242 4242 4242 4242`) and verify redirection back to the app.
- [ ] **Customer Portal Integration Tested**: Access Stripe Customer Portal from the account page and verify capability to manage invoices and cancel the subscription.
- [ ] **Subscription Status Mapping**:
  - `checkout.session.completed` / `customer.subscription.created` correctly syncs database `plan_slug` to `pro`.
- [ ] **Grace Period (past_due) Verification**:
  - Manually change subscription status to `past_due` in Stripe Dashboard.
  - Verify the account page shows the **ZalegĹ‚oĹ›Ä‡ w pĹ‚atnoĹ›ci (Grace Period)** warning.
  - Confirm Pro entitlements (e.g., PDF export) remain temporarily active.
- [ ] **Downgrade Enforcement (unpaid/canceled)**:
  - Manually change subscription status to `unpaid` or `canceled`.
  - Confirm database `plan_slug` degrades to `free`.
  - Confirm the account page displays the **DostÄ™p zawieszony (Access Suspended)** message.
- [ ] **PDF Block Post-Downgrade**: Ensure PDF exports return a `403 Forbidden` error once downgraded.
- [ ] **Production Stripe Product and Price Created**: Manually create the live product and pricing structure in the Stripe Dashboard (Live Mode). Save the generated Price ID to `STRIPE_PRICE_ID_PRO`.
- [ ] **Production Webhook Registered**: Register the live URL (`https://promptpolish.com/api/webhooks/stripe`) in the Stripe Live Dashboard. Ensure webhook events are filtered to only send `checkout.session.completed`, `customer.subscription.created`, and `customer.subscription.updated`.
- [ ] **STRIPE_ENABLED Safe Default Checked**: Double check that `STRIPE_ENABLED=false` is enforced in the primary configuration files until the official Go decision is signed off.

---

## 4. Legal & Tax Readiness Blockers
Compliance hurdles that must be formally cleared by legal and tax counsel before accepting real customer payments.

- [ ] **Official Legal Entity Configured**: Finalize the formal business legal name and corporate physical address. Confirm these details are filled in on public terms and footer sections.
- [ ] **Support & Compliance Contact Inboxes**: Create active, monitored mailboxes for customer support and privacy requests (e.g. `support@yourdomain.com`, `privacy@yourdomain.com`).
- [ ] **Terms of Service Counsel Sign-off**: Legal counsel review and approval of the public `/terms` page.
- [ ] **Privacy Policy Counsel Sign-off**: Legal counsel review and approval of the public `/privacy` page.
- [ ] **Billing & Cancellation Policy Approval**: Legal counsel review of terms regarding automatic renewal, cancellations, and payment processing.
- [ ] **Refund Policy Finalized**: Finalize the 14-day money-back usage threshold rules (e.g. refund is only approved if under 10 prompt audits have been completed).
- [ ] **VAT / OSS / Stripe Tax Decision**:
  - Resolve whether the business will register under the EU VAT One-Stop Shop (OSS) scheme.
  - Enable **Stripe Tax** in the dashboard to automatically calculate destination-based VAT and sales taxes dynamically.
- [ ] **Sequential Invoice Numbering**: Configure Stripe Invoice templates to issue compliant, sequentially-numbered invoices conforming to local corporate tax audit guidelines.
- [ ] **Customer Withdrawal Rights Verification**: Ensure checkout flow displays the statutory EU waiver of the 14-day digital goods withdrawal right once performance begins.
- [ ] **No Unsupported Compliance Claims**: Audit landing pages to ensure no claims of guaranteed compliance certifications (e.g. "GDPR Certified") are displayed.

---

## 5. Privacy & Vendor Readiness Blockers
Data governance and sub-processor audits to protect user data and align with privacy regulations.

- [ ] **Supabase DPA Executed**: Formally sign the Data Processing Addendum (DPA) with Supabase. Confirm database server hosting is geo-confined to the European Economic Area (EEA) if required.
- [ ] **Vercel DPA Executed**: Execute the DPA with Vercel. Verify that serverless compute deployment locations are aligned with corporate privacy data storage rules.
- [ ] **Stripe DPA Executed**: Complete the data processing terms with Stripe, confirming standard contractual clauses (SCCs) are active for international transfers.
- [ ] **OpenRouter/AI Provider Agreement Audited**: Review the agreements with OpenRouter and verify that the target model (e.g., `deepseek/deepseek-v4-flash`) does not retain input prompts for training or manual review.
- [ ] **Data Retention Window Verification**: Confirm database schema retention schedules are verified in the runtime (e.g. daily cron schedules purging historical telemetry).
- [ ] **Account Deletion Flow Tested**: Validate that clicking "UsuĹ„ konto" triggers cascading deletes in Supabase (deleting profiles, history, and usage logs) and triggers a subscription cancellation webhook to Stripe.
- [ ] **Cookie & ePrivacy Directive Decision**: Formally resolve if the essential ownership cookie `owner_anonymous_id` requires a consent banner under local implementation of the ePrivacy Directive.
- [ ] **Public Share Retention Behavior**: Confirm that shared links deleted by the owner are permanently removed from database storage and immediately return a 404 response.

---

## 6. Manual Production Smoke Test Plan
A manual end-to-end verification checklist to execute in the live production environment.

### Phase A: Before Enabling Stripe
*Run tests with `STRIPE_ENABLED=false` set in production.*
- [ ] Paste a prompt containing mock credentials. Confirm preflight scanning blocks the audit client-side.
- [ ] Audit a standard prompt. Confirm successful redirection to `/result/[id]`.
- [ ] Navigate to `/pricing`. Verify the Pro checkout buttons are swapped for a waitlist signup or show "Beta Mode" alerts.
- [ ] Register a new account. Confirm login works. Check that the developer sandbox allows simulated Pro testing, but Stripe payments are unavailable.

### Phase B: Immediately After Enabling Stripe (Test Mode Staging)
*Temporarily deploy code with `STRIPE_ENABLED=true` pointing to Stripe Test Keys.*
- [ ] Navigate to `/pricing`. Confirm checkout redirects cleanly to Stripe Checkout.
- [ ] Complete payment with mock test card `4242 4242 4242 4242`. Confirm checkout returns user to success page.
- [ ] Verify profile plan badge swaps to **Pro**.
- [ ] Download a result as a PDF file. Confirm export works.
- [ ] Go to `/account` and click "Manage Billing". Confirm Stripe Customer Portal loads. Cancel the subscription inside the portal.
- [ ] Confirm account page updates showing subscription is scheduled for downgrade at period end.

### Phase C: After First Real Production Transaction
*Execute immediately after promoting Stripe Live Keys and set `STRIPE_ENABLED=true` in production.*
- [ ] Execute a real purchase using a valid personal payment card.
- [ ] Verify Stripe processes payment and generates a compliant PDF invoice.
- [ ] Confirm DB updates user profile to `pro`.
- [ ] Verify the support inbox receives standard webhook-triggered receipt confirmations if enabled.

### Phase D: After Forced Downgrade/Cancellation
*Verify downgrade states manually.*
- [ ] In the Stripe Live Dashboard, locate the real customer subscription and force cancel it immediately.
- [ ] Verify that the database updates the profile's `plan_slug` to `free`.
- [ ] Verify that navigating to a result and clicking **Export to PDF** returns a warning to upgrade.

### Phase E: After Rollback Execution
*Validate that system handles rollbacks safely.*
- [ ] Set `STRIPE_ENABLED=false` on production.
- [ ] Open the app. Confirm the pricing page removes Checkout links and displays waitlist forms.
- [ ] Verify that existing Pro users (synced before rollback) can still log in and view past records without application crashes.

---

## 7. Rollback Plan
Standard operating procedures to immediately revert live payments if severe integration failures occur post-launch.

1. **Toggle Billing Switch**: Change the environment variable `STRIPE_ENABLED=false` in the production host settings.
2. **Disable Pricing Call-to-Actions (CTAs)**: Modify pricing UI elements to hide pricing checkout cards and replace them with waitlist forms or maintenance warnings.
3. **Verify API Blockers**: Ensure that any direct POST calls to `/api/checkout` or webhook routes degrade gracefully and do not throw unhandled runtime exceptions.
4. **Graceful Pro Entitlements**: Ensure users who purchased Pro during the active window retain read-only history or continue to receive access via manual database override tags.
5. **Mute Stripe Webhooks**: Navigate to the Stripe Dashboard under Developers > Webhooks and temporarily pause or disable the production webhook to stop forwarding event requests.
6. **Deploy Production Rollback**: Open the Vercel dashboard and execute an instant rollback to the previous stable git hash.
7. **Notify Beta Users**: Email users who attempted checkouts or registered during the deployment window to explain service status.

---

## 8. Go/No-Go Decision Criteria

The release manager must review the checklist and issue a final launch status.

### đźź˘ GO Conditions
You may transition `STRIPE_ENABLED=true` in production **ONLY** if:
*   [ ] Every P0/P1 item in the **Technical Readiness** list is completed.
*   [ ] Every P0/P1 item in the **Product Readiness** list is completed.
*   [ ] Stripe Test Mode verification scenarios have completed with 100% success.
*   [ ] Legal counsel has reviewed and approved terms, privacy policies, and DPAs.
*   [ ] Tax counsel has finalized EU VAT, sales tax, and OSS registration rules.

### đź”´ NO-GO Conditions
You must halt the launch and keep `STRIPE_ENABLED=false` if:
*   [ ] **Legal/Tax Review Incomplete**: Counsel has not formally approved the draft terms or refund rules.
*   [ ] **Stripe Test Mode Fails**: Webhook synchronization, grace periods, or downgrades fail during local/staging tests.
*   [ ] **Missing Production Credentials**: Production Stripe Price IDs or secrets are missing from the configuration.
*   [ ] **Unstable Provider Health**: The OpenRouter API endpoint is unstable, experiencing high latency, or throwing unexpected HTTP 429/500/503 errors.
*   [ ] **Client-Side Entitlement Enforcement Only**: Any premium endpoint (such as `/api/export/[id]/route.ts` for PDF download) verifies Pro plans *only* on the client bundle, without a strict server-side database entitlement audit.
