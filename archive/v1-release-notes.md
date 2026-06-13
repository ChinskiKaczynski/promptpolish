> [!WARNING]
> **Archived / Historical** — This document has been moved to rchive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# Release Notes â€” PromptPolish v1.0 (Release Candidate)

**Date:** 2026-06-13 (updated from 2026-06-04 to reflect Missions 2â€“7)
**Author:** Senior SaaS Release Engineer & Operations Lead
**Version:** v1.0-RC
**Status:** **Frozen (Release Candidate / Post-Mission-7 Hardening Complete)**

---

## 1. Release Status & Verdicts

This release candidate establishes the baseline feature set for the PromptPolish v1.0 platform after completing a full 7-mission hardening cycle.

*   **Internal Developer Preview:** **đźź˘ GO**
    *   All 47 test files, 467 tests pass. Lint clean. Build succeeds.
*   **Anonymous / Private Beta:** **đźź˘ GO**
    *   Core prompt auditing, authentication, history dashboard, text/markdown exporters, share links, and usage enforcement are operationally ready, contingent on successful manual post-deployment smoke tests.
*   **Stripe Test-Mode Paid Beta (Staging): **đźź˘ GO (Non-Production Verification Only)**
    *   Stripe webhook idempotency (inbox + advisory locks), subscription uniqueness enforcement, out-of-order event protection, and portal/checkout flows are implemented and tested.
*   **Paid Production:** **đź”´ NO-GO (BLOCKED)**
    *   Production billing is strictly disabled by default (`STRIPE_ENABLED=false`). Live commercial payments remain blocked until legal entity registration, counsel review, EU tax/VAT OSS, and vendor DPAs are complete.

---

## 2. Missions 2â€“7 Security & Hardening Summary (Post June 12 Audit)

The following hardening was applied after the 2026-06-12 external audit (`docs/promptpolish-audit-2026-06-12.md`):

### Mission 2 â€” DB/RLS/Grants Hardening
*   **Corrective migration** (`20260612200000_corrective_privileges.sql`): Revoked `TRUNCATE`, `REFERENCES`, `TRIGGER`, `MAINTAIN` from `anon` and `authenticated` on all existing and future public tables.
*   Revoked all direct client access to `prompt_analyses`, `usage_events`, `feedback_events`, `user_profiles`, `model_profiles`, `stripe_customers`, `subscriptions`.
*   Added server-only RPC `search_user_prompt_history` with safe LIKE escaping; grant restricted to `service_role`.
*   **Test**: `tests/supabase/grants.test.ts` verifies baseline migration has no unsafe grants.

### Mission 3 â€” Sensitive Data Scanner & Events
*   Sensitive data scanner now covers all user-controlled input fields (not just `input_prompt`).
*   Client-side events endpoint restricted to real UI interactions (`copy_improved_prompt`, etc.); system/billing events emitted server-side only.
*   Usage limit checks are now fail-closed (usage reservations migration: `20260612210000_usage_reservations.sql`).

### Mission 4 â€” Retention, Export, Share
*   Retention cleanup (`lib/privacy/retention.ts`) explicitly guards: `user_id IS NULL`, `is_favorite = false`, `is_share_enabled = false`, `deleted_at IS NULL`. Authenticated analyses are never deleted by the cron.
*   Share uniqueness enforced at DB level (`20260612240000_mission4_share_uniqueness.sql`).
*   Export routes set `Cache-Control: private, no-store` on private responses.
*   Share page uses `force-dynamic` / server-side revocation check.

### Mission 5 â€” Stripe Billing Hardening
*   Webhook idempotency inbox (`stripe_webhook_events` table) with advisory locking, retry/duplicate handling, and terminal/retryable status taxonomy.
*   Unique partial index on `subscriptions (user_id)` for `active/trialing/past_due` â€” prevents duplicate active subscriptions.
*   Out-of-order event protection via `last_event_created` / `last_event_id` on subscriptions.
*   Checkout idempotency and abort-on-write-error implemented.
*   `stripe_webhook_events` and related RPCs are `service_role`-only.

### Mission 6 â€” AI/Provider/Env/Auth SSR
*   `lib/env/server.ts` â€” `STRIPE_ENABLED` and `SENSITIVE_DATA_BLOCK_HIGH_RISK` use strict `"true"/"false"` string parsing (not `z.coerce.boolean()`).
*   `AI_PROVIDER_TIMEOUT_MS` (`default: 30000`) wired through AI call layer with proper abort.
*   `RATE_LIMIT_HMAC_SECRET` added for IP pseudonymization.
*   Auth uses official `@supabase/ssr` pattern in `middleware.ts` with `createServerClient`.
*   No custom `sb-session` cookie; browser does not post refresh tokens to app API.
*   Transient auth failures fail safely without creating anonymous-owned data.

### Mission 7 â€” UI/Accessibility/CSP/Localization
*   CSP in `next.config.ts`: `object-src` removed (was never present), `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests` added. `unsafe-inline` documented as temporary Next.js hydration workaround; nonce-based CSP is the future migration target.
*   Private/draft pages (`/terms`, `/privacy`) set `robots: { index: false, follow: false }`.
*   Share page (`/share/[token]`) has no private controls (owner-only: favorites, export, feedback forms).
*   Google Fonts replaced by `next/font/google` (self-hosted at build time â€” no runtime browser request).
*   Accessibility: toggle uses `role="switch"` and `aria-checked`; `aria-live` on status messages; focus trap on modals.
*   Localization: unified i18n approach for PL/EN.

---

## 3. Canonical Product Contract (v1.0-RC)

| Capability | Anonymous | Free | Pro |
|---|:---:|:---:|:---:|
| Daily analyses | 3 | 5 | 100 |
| Monthly analyses | 10 | 20 | 500 |
| Max prompt chars | 12,000 | 12,000 | 24,000 |
| Markdown export | âś“ | âś“ | âś“ |
| TXT export | âś“ | âś“ | âś“ |
| PDF export | âś— | âś— | âś“ |
| Share result | âś“ | âś“ | âś“ |
| History (persistent) | cookie-owned | âś“ | âś“ |
| Favorites | âś— | âś“ | âś“ |
| Batch Audit | âś— | âś— | âś— (not in MVP) |

> **Source of truth**: `lib/plans/config.ts`. All backend routes, UI, and docs must derive from this file.

---

## 4. What Is Included in v1.0-RC

*   **Anonymous-First Prompt Audit Flow:** PL/EN localization, structured scorecards, performance criteria grids, copy-ready suggestions.
*   **Supabase Auth Integration (SSR):** User sign-up, email verification, sign-in, session refresh via `@supabase/ssr` + middleware.
*   **Account History Dashboard:** History logging, filtering, favorites, cascading soft-delete.
*   **Private Results (`/result/[id]`):** Strict cookie/owner checks; non-owners get 404.
*   **Public Share Routing (`/share/[token]`):** Opt-in, read-only, instant 404 on revocation. Share page has no private controls.
*   **Multi-Format Exporters:** Markdown (`.md`) and Plain Text (`.txt`). Available to all plans (Anonymous, Free, Pro). `Cache-Control: private, no-store`.
*   **Pro-Only PDF Export:** Server-side entitlement gate; 403 for non-Pro.
*   **Server-Side Plan Entitlements:** Tier-gates on all API routes. Client cannot supply or override plan slug.
*   **Stripe Billing Foundation (Test Mode):** Idempotent webhook inbox, checkout idempotency, subscription uniqueness, out-of-order protection, customer portal.
*   **Sensitive Data Preflight:** Covers all user-controlled input fields client-side; blocks before any backend/AI call.
*   **Usage Reservations:** Atomic check-and-reserve for rate limits; fail-closed on DB error.
*   **Retention Safety:** Cron only deletes anonymous, non-favorite, non-shared, expired analyses. Authenticated history never auto-deleted.
*   **RLS Default-Deny:** All tables revoked for `anon`/`authenticated`; all data access via service-role RPCs.
*   **Legal Draft Banners:** `/terms` and `/privacy` are `noindex`, show amber draft warnings.
*   **CSP Headers:** `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, HSTS. `unsafe-inline` is documented workaround for Next.js hydration.
*   **Launch & Ops Documentation:** Runbooks, smoke test plans, checklists.

---

## 5. What Is NOT Included in v1.0-RC

*   **Public Paid Production:** Live checkout disabled (`STRIPE_ENABLED=false`).
*   **Finalized Legal Entity:** Business name, address, support/privacy inboxes â€” all TBD.
*   **Finalized Policies:** Terms, Privacy, Refund/Cancellation require counsel sign-off.
*   **VAT / OSS / Stripe Tax:** Live EU tax configuration pending.
*   **Vendor DPAs:** Vercel, Supabase, Stripe, OpenRouter â€” not yet executed.
*   **Batch Audit:** Not in MVP scope for any plan.
*   **PDF Polish Language Validation:** Polish characters in PDF not yet manually verified.
*   **Nonce-based CSP:** Currently `unsafe-inline`; nonce flow is a post-v1 task.
*   **Full WCAG Audit:** Accessibility work was a smoke-level pass, not full WCAG 2.1 AA certification.
*   **Real Provider API Validation:** Live OpenRouter smoke test (`scripts/smoke-test-openrouter.ts`) requires `OPENROUTER_API_KEY` and was not run in CI â€” validation pending on first real deployment.
*   **Real Stripe API Validation:** Stripe test-mode scenarios validated by code review and unit tests; full end-to-end Stripe CLI run pending on first staging deployment.

---

## 6. Known Limitations

*   **Policy Draft Status:** All terms, privacy, and billing documents are non-binding drafts. Legal compliance is not guaranteed until formal counsel sign-off.
*   **AI Engine Accuracy:** Scores and improved prompts are LLM-generated. Not guaranteed error-free. Users must verify before production use.
*   **Input Privacy Warning:** Sensitive data scanner intercepts known patterns but cannot guarantee interception of all formats.
*   **Anonymous Session Volatility:** History linked to `owner_anonymous_id` cookie. Cookie clearing = access loss.
*   **Provider Dependencies:** Latency and availability subject to OpenRouter API performance.
*   **CSP `unsafe-inline`:** Required for Next.js hydration. Nonce-based CSP is the planned upgrade path.
*   **AI Cost Measurement:** Cost stored from static formula; may diverge from actual provider billing. Unknown pricing produces null cost.

---

## 7. Security & Safety Notes

*   **Sensitive Data Scans:** Client-side scan intercepts secrets across all input fields before any backend/AI call.
*   **RLS Default-Deny:** `anon` and `authenticated` roles have no direct table access. All queries via `service_role` RPCs.
*   **Stripe Webhook Idempotency:** Advisory-lock + inbox table prevents duplicate processing and race conditions.
*   **Export Privacy:** Private exports return `Cache-Control: private, no-store`.
*   **Share Page Isolation:** `/share/[token]` returns only scrubbed read-only data; no owner controls.
*   **Env Validation:** `STRIPE_ENABLED` and `SENSITIVE_DATA_BLOCK_HIGH_RISK` use strict boolean string parsing â€” never `z.coerce.boolean()`.

---

## 8. Upgrade & Rollback Policies

*   **Stripe Sandbox Mode:** Staging can run `STRIPE_ENABLED=true` with test keys.
*   **Production Safety Default:** `STRIPE_ENABLED=false` must remain default in production.
*   **Rollback:** Toggle `STRIPE_ENABLED=false` and redeploy.
*   **Live Billing Approval Gate:** Requires business entity, legal counsel, tax counsel, and vendor DPA sign-offs.

---

## 9. Automated Validation Results (2026-06-13)

*   **`pnpm lint`**: âś… 0 errors, 0 warnings (`--max-warnings=0`)
*   **`pnpm test`**: âś… 47 test files, 467 tests passed
*   **`pnpm build`**: âś… All routes compiled (30 routes: 7 static, 23 dynamic)
*   **Real OpenRouter API**: âŹł Pending â€” requires live `OPENROUTER_API_KEY`
*   **Real Stripe API (test mode)**: âŹł Pending â€” requires staging deployment with Stripe CLI

---

## 10. Related Documentation

*   [Executable Launch Checklist](./v1-launch-checklist.md) â€” Steps required for release validation.
*   [Product Freeze Review](./v1-product-freeze-review.md) â€” Scope boundary and freeze rules.
*   [Staging Stripe Test Mode Checklist](./stripe-test-mode-checklist.md) â€” Sandbox billing workflows.
*   [Pre-Production Launch Checklist](./pre-production-launch-checklist.md) â€” Comprehensive readiness checkpoints.
*   [Vercel Preview Checklist](./vercel-preview-checklist.md) â€” Environment variables and preview setup.
*   [Internal Legal Readiness Roadmap](./legal-readiness.md) â€” Unresolved compliance blockers.
*   [Operator Runbook](./operator-runbook.md) â€” Incident response and key rotation.
*   [Support Playbook](./support-playbook.md) â€” Customer support templates and escalation.
*   [June 12 External Audit](./promptpolish-audit-2026-06-12.md) â€” The audit that triggered Missions 2â€“7.
