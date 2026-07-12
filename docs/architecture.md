# System Architecture — PromptPolish

PromptPolish is structured as a Next.js App Router application integrated with Supabase Postgres and the Vercel AI SDK. This document details the application routes, execution pipeline, data models, and access-control boundaries.

---

## 1. Directory & Routing Architecture

### Client Routes (`app/`)
*   `/` — Landing marketing page (localized in PL/EN)
*   `/analyze/` — Prompt submission and preflight form
*   `/result/[id]/` — Private result view; reads owner cookie or user session server-side
*   `/share/[token]/` — Publicly shared view (if enabled; resolves by token)
*   `/pricing/` — Pricing tier comparison page
*   `/login/` — Supabase Auth sign-in / magic link entry page
*   `/account/` — User account subscription management portal
*   `/history/` — Prompt history logs for authenticated users
*   `/admin/` — Admin telemetry and system health metrics dashboard
*   `/privacy/` — Privacy policy draft
*   `/terms/` — Terms of service draft

### API Endpoints (`app/api/`)
*   `/api/analyze/` — Pipeline orchestrator (limits check, safety preflight, Gemini LLM call, save, complete reservation)
*   `/api/feedback/` — Saves user upvotes/downvotes linked to analysis ID
*   `/api/events/` — Collects and stores telemetry events (e.g. clicks, copies)
*   `/api/share/` — Enables or disables public sharing of prompt results
*   `/api/auth/` — Next.js Route Handlers for Supabase Auth session exchanges
*   `/api/billing/` — Stripe checkout session and portal link creation
*   `/api/webhooks/` — Stripe payment/subscription event webhook handler (idempotent listener)
*   `/api/cron/` — Secured cron endpoint for retention cleaning
*   `/api/export/` — Generates file exports (Markdown, Plain Text, PDF)
*   `/api/history/` — Fetches prompt history with SQL-paginated filters
*   `/api/entitlements/` — Returns user tier capability allowances
*   `/api/admin/` — Admin-gated route for metrics collection

---

## 2. Core Execution Pipeline

For every prompt submission, the backend orchestrates a strict multi-layer pipeline:

```text
1. Client-Side Preflight
   └── Simple regex/entropy checks warn the user locally of high-risk sensitive data patterns.

2. Zod Schema Verification
   └── Parses text lengths, chosen language, profile slug, and custom formatting constraints.

3. Reservation Acquisition
   └── Call public.acquire_usage_reservation RPC (applies sliding window daily/monthly rate limits, serializing requests).

4. Severe Sensitive Data Filter
   └── Scans for API keys, passwords, and tokens. Blocks process if high-risk data is detected.

5. Prompts Construction
   └── Assembles system guidelines and user criteria templates matching the target profile.

6. Structured AI Generation
   └── Invokes Vercel AI SDK generateObject via lib/ai/gemini-client.ts to fetch scores, diagnosis, improved prompt, and explanations.

7. Save to Database & Complete Reservation
   └── Call public.save_analysis_and_complete_reservation RPC to insert record and atomically mark reservation completed.

8. Return Typed Payload
    └── Sends back formatted JSON representing the computed audit and refined prompt.
```

---

## 3. Database Schema Design (Supabase Postgres)

The application utilizes the following core database tables:

*   `public.prompt_analyses` — Stores prompt audits, final scores, weaknesses, and improved prompts.
*   `public.usage_reservations` — Tracks short-lived atomic rate limit reservations.
*   `public.usage_events` — Telemetry log tracking rate limits and user interactions.
*   `public.user_profiles` — Stores user subscriptions and plan tier assignments (`free`, `pro`).
*   `public.plan_limits` — Configures daily review ceilings and character boundaries per plan tier.
*   `public.subscriptions` — Caches Stripe subscription states locally.
*   `public.stripe_webhook_events` — Webhook inbox for Stripe event deduplication.
*   `public.stripe_customers` — Maps user UUIDs to Stripe customer references.
*   `public.billing_checkout_attempts` — Ledger mapping checkout sessions to users.
*   `public.feedback_events` — Captures user rating clicks and comments.
*   `public.model_profiles` — Configures AI models (`general-llm` pointing to `gemini-2.5-flash`).

---

## 4. Access Control Boundaries

*   **No Direct Client Queries**: Client components must never run direct Supabase calls to load data from `prompt_analyses`.
*   **Result Ownership Checks**: The private route `/result/[id]` is resolved exclusively by a Next.js Server Component. It extracts the ownership IDs from secure cookie or auth session and queries Supabase. If there is no ownership match, the server returns 404 or redirects to authorization.
*   **Token Sharing**: The route `/share/[token]` resolves records only using the `share_token` field and verifies that `is_share_enabled = true`. It returns `404 Not Found` if sharing is disabled, completely hiding the record's UUID and private metadata.
