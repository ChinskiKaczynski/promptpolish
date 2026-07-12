# Release Notes — PromptPolish v1.0

This release establishes the baseline feature set for the PromptPolish platform.

---

## 1. Release Status & Verdicts

*   **Internal Developer Preview:** **GO**
*   **Anonymous / Private Beta:** **GO**
    *   Core prompt auditing, authentication, history dashboard, text/markdown/PDF exporters, share links, and usage enforcement are operationally ready, contingent on successful manual post-deployment smoke tests.
*   **Stripe Test-Mode Paid Beta (Staging):** **GO (Non-Production Verification Only)**
    *   Stripe webhook idempotency (inbox + advisory locks), subscription uniqueness enforcement, out-of-order event protection, and portal/checkout flows are implemented and tested.
*   **Paid Production:** **NO-GO (BLOCKED)**
    *   Production billing is strictly disabled by default (`STRIPE_ENABLED=false`). Live commercial payments remain blocked until legal entity registration, counsel review, EU tax/VAT OSS, and vendor DPAs are complete.

---

## 2. Hardening & Security Features

### Database & Permissions Hardening
*   Revoked `TRUNCATE`, `REFERENCES`, `TRIGGER`, `MAINTAIN` from `anon` and `authenticated` on all tables.
*   Revoked direct client access to tables.
*   Added server-only RPC `search_user_prompt_history` with safe LIKE escaping; grant restricted to `service_role`.

### Sensitive Data Scanner & Events
*   Sensitive data scanner covers all user-controlled input fields.
*   Usage limit checks are fail-closed using database-backed reservations.

### Retention, Export, Share
*   Retention cleanup guards: `user_id IS NULL`, `is_favorite = false`, `is_share_enabled = false`, `deleted_at IS NULL`. Authenticated analyses are never deleted by the cron.
*   Share uniqueness enforced at DB level.
*   Export routes set `Cache-Control: private, no-store` on private responses.
*   Share page uses `force-dynamic` server-side revocation check.

### Stripe Billing Hardening
*   Webhook idempotency inbox (`stripe_webhook_events` table) with advisory locking, retry/duplicate handling, and terminal/retryable status taxonomy.
*   Unique partial index on `subscriptions (user_id)` for `active/trialing/past_due` — prevents duplicate active subscriptions.
*   Out-of-order event protection via `last_event_created` / `last_event_id` on subscriptions.
*   Checkout idempotency and abort-on-write-error implemented.

---

## 3. Canonical Product Contract

| Capability | Anonymous | Free | Pro |
|---|:---:|:---:|:---:|
| Daily analyses | 3 | 5 | 100 |
| Monthly analyses | 10 | 20 | 500 |
| Max prompt chars | 12,000 | 12,000 | 24,000 |
| Markdown export | ✓ | ✓ | ✓ |
| TXT export | ✓ | ✓ | ✓ |
| PDF export | ✗ | ✗ | ✓ |
| Share result | ✓ | ✓ | ✓ |
| History (persistent) | cookie-owned | ✓ | ✓ |
| Favorites | ✗ | ✓ | ✓ |

> **Source of truth**: `lib/plans/config.ts`. All backend routes, UI, and docs must derive from this file.

---

## 4. What Is Included

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

---

## 5. What Is NOT Included

*   **Public Paid Production:** Live checkout disabled (`STRIPE_ENABLED=false`).
*   **Finalized Legal Entity:** Business name, address, support/privacy inboxes — all TBD.
*   **Finalized Policies:** Terms, Privacy, Refund/Cancellation require counsel sign-off.
*   **VAT / OSS / Stripe Tax:** Live EU tax configuration pending.
*   **Vendor DPAs:** Vercel, Supabase, Stripe, Google — not yet executed.
*   **Batch Audit:** Not in MVP scope for any plan.
