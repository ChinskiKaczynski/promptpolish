# Decision Log — PromptPolish

This log registers all key architectural, technical, and product decisions governing PromptPolish. Every non-trivial change to the tech stack or MVP boundaries must be recorded here.

---

## Decision Record Template

```text
Date: YYYY-MM-DD
Decision: [Short summary of the choice]
Reason: [Why this path was chosen over others]
Alternatives Considered: [Other possibilities evaluated]
Risk & Mitigation: [Associated risks and how we address them]
Sources & Docs: [Context7 references, GitHub issues, or links]
Revisit When: [Conditions under which we should reconsider this choice]
```

---

## Active Decisions

### 1. MVP Scope (2026-05-23)
*   **Decision**: Focus strictly on a localized (PL/EN) anonymous-first prompt analysis utility with a single execution pipeline, ending in a copy-ready result and an opt-in share link.
*   **Reason**: Minimizes upfront engineering overhead, avoids cold starts associated with user management, and gathers prompt audit telemetry quickly.
*   **Alternatives Considered**: A complete prompt library with standard authentication, folders, and multi-model comparison side-by-side.
*   **Risk & Mitigation**: Share link might lead to user privacy confusion. **Mitigation**: Sharing is strictly disabled by default; prominent UI warnings advise users not to paste credentials and remind them that share links are publicly viewable.
*   **Revisit When**: Upon completing validation of initial MVP metrics (e.g., target copy rate and repeat user checks).

### 2. Tech Stack and Provider Choices (2026-05-23)
*   **Decision**: Adopt Next.js App Router, TypeScript, Tailwind CSS, Supabase, and Vercel AI SDK with `@ai-sdk/google` (targeting Gemini 1.5/2.0 API models).
*   **Reason**: Next.js App Router provides optimal server-side preflights and cookie-based ownership. Vercel AI SDK provides high-quality structured JSON output APIs (`Output.object`) that integrate smoothly with Zod schemas.
*   **Alternatives Considered**: Raw REST calls to the Gemini API, or langchain/llamaindex abstractions.
*   **Risk & Mitigation**: Breaking changes in fast-moving AI SDK and Gemini APIs. **Mitigation**: Lock dependency versions in `package.json` and enforce **Context7** document checks before provider integration.
*   **Revisit When**: AI SDK v5+ or Gemini major model version updates.

### 3. ESLint 10 Native Flat Config Migration (2026-05-23)
*   **Decision**: Migrate `eslint.config.mjs` away from legacy `@eslint/eslintrc` `FlatCompat` to direct native flat config imports from `eslint-config-next`.
*   **Reason**: Running ESLint 10 with `FlatCompat` on legacy configurations (like `next/core-web-vitals`) results in a circular structure serialization `TypeError` crash. Modern `eslint-config-next` packages natively export flat config arrays, rendering `FlatCompat` obsolete.
*   **Alternatives Considered**: Downgrading ESLint to version 9.x.
*   **Risk & Mitigation**: Potential conflicts with custom rules or plugin extensions. **Mitigation**: Verified via clean local `pnpm lint` and `pnpm build` completions. Added explicit React version `19.0.0` settings to bypass legacy `context.getFilename()` checks within the nested plugins.
*   **Sources & Docs**: ESLint 10 deprecation guides and Next.js flat configuration codemods.
*   **Revisit When**: Next.js releases full official built-in Next 16 ESLint 10 flat presets.

### 4. Gemini API Integration & Structured Output (2026-05-23)
*   **Decision**: Standardize on Vercel AI SDK 6+ integration using `generateText` or `streamText` with `output: Output.object({ schema })` using the standard `:generateContent` endpoint via `google('model-id')`. Avoid using the stateful Gemini Interactions API (`google.interactions('model-id')`).
*   **Reason**: Allows high-performance, stateless prompt evaluations. Using standard generateContent flows avoids the extra complexity and state overhead associated with the Interactions endpoint, which is optimized for multi-turn conversations and agent presets.
*   **Alternatives Considered**: `google.interactions(...)` (Interactions API), raw REST requests using native fetch.
*   **Risk & Mitigation**: Breaking changes in schema options. **Mitigation**: Checked documentation via Context7 and locked imports to Vercel AI SDK. Added a `smoke-test-gemini.ts` manual verification script to check integration before production rollout. A full production-like `analysisSchema` smoke test is required later in Mission 26A.
*   **Sources & Docs**: Context7 library docs for `/vercel/ai` and `/websites/ai-sdk_dev`.
*   **Revisit When**: Model architecture shifts or multi-turn agent integrations are required.

### 5. Data Retention Cleanup Engine & Active Shared Links Exemption (2026-05-23)
*   **Decision**: Implement a database deletion utility running through `getSupabaseAdminClient` (to bypass RLS limitations), triggered manually via CLI (`scripts/retention-cleanup.ts`) or automatically via a cron REST endpoint (`/api/cron/cleanup`), applying distinct expiration thresholds. Explicitly exempt records with `is_share_enabled = true` from the 30-day purge.
*   **Reason**: Respect user sharing intent and keep public shared links active while adhering to the privacy-committed lifetime limits for other telemetry and unshared items. Exposing a secure endpoint with a `CRON_SECRET` bearer check allows standard, serverless scheduling via Vercel Crons.
*   **Alternatives Considered**: Cascading deletion for shared records (which would break links in 30 days) or full anonymization (wiping values of columns instead of dropping rows).
*   **Risk & Mitigation**: Unauthorized route trigger causing data deletion. **Mitigation**: Standardized authorization checks against the server-exclusive `CRON_SECRET` environment variable and introduced a parameter-activated `dryRun` mode for safe previews.
*   **Sources & Docs**: `docs/retention-policy.md` and standard Vercel Cron practices.
*   **Revisit When**: Scalability demands or additional shared link features require dedicated pagination/archival states.

### 6. Paid SaaS Readiness Assessment & Go/No-Go Decision (2026-05-23)
*   **Decision**: **NO-GO for Paid SaaS Roadmap execution at the current time; recommend launching the Anonymous MVP ("continue MVP") first.**
*   **Reason**: The remote hosted Supabase tables are not migrated, no live Gemini API keys or cookie secrets are configured in production environment variables, and we have zero actual user telemetry. Initiating user authentication or billing code at this stage directly violates the core roadmap rule: *"do not add auth, billing, pricing, or Stripe before MVP value validation."*
*   **Alternatives Considered**: Proceeding directly with Stage 1 (Supabase Auth & User profiles) in parallel with launching the MVP.
*   **Risk & Mitigation**: Delayed monetization. **Mitigation**: Launching the free anonymous MVP requires negligible operational costs (~$0.000315/run), builds an initial organic user base, and provides the essential metrics (e.g. >30% copy rate and repeat usage) to define high-converting premium pricing tiers.
*   **Sources & Docs**: `docs/paid-readiness-report.md` and `paid-saas-roadmap_v1.1.md`.
*   **Revisit When**: Upon completing 50–100 real anonymous analyses and verifying a positive copy rate (>30%) and repeat usage signals.


