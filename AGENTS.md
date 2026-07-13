# PromptPolish — Project Rules & Agent Guidelines

This is a production-oriented PromptPolish application designed to score, diagnose, and improve prompts.

---

## 1. Core Technology Stack

All developers and agents MUST strictly adhere to the following stack:

- **Framework**: Next.js App Router (version 16+)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Vanilla CSS in `app/globals.css`, no utility-class expansions like Tailwind v4 unless explicitly configured)
- **Database**: Supabase Postgres (accessed server-side only via `@supabase/supabase-js` using connection info pointing to the online Supabase instance). **Local Supabase database emulator/Studio setup is disabled.**
- **Deployment**: Vercel
- **AI Integration**: Google Gemini via Vercel AI SDK using `@ai-sdk/google` (target model: `gemini-2.5-flash`, env: `GEMINI_MODEL_ID`)
- **Billing/Stripe**: Stripe subscription integration (enabled/configured via env `STRIPE_ENABLED=true` in production and local tests)
- **Validation**: Zod (for type-safe schema validations)

> [!IMPORTANT]
> **OpenRouter/DeepSeek/Owl are ARCHIVED — not part of the active runtime.**
> The `@openrouter/ai-sdk-provider` package has been removed from `package.json`.
> Do not add it back. Do not reference `OPENROUTER_API_KEY` in runtime code.
> Historical context is in `archive/openrouter-integration-decision.md` and `docs/decision-log.md`.

---

## 2. Active Model Profile

Exactly **one** product-facing profile is active in the application:

1. **`general-llm`** — the only valid `selected_profile_slug`

> [!IMPORTANT]
> **Profile Rules**:
>
> - Do not hardcode model capabilities, token limits, context windows, benchmark scores, or pricing claims in the client-side UI.
> - The actual provider `model_id` (`gemini-2.5-flash`) must be resolved from env `GEMINI_MODEL_ID` in the backend.
> - No model/profile selector is shown in the UI. The form always sends `selected_profile_slug: 'general-llm'`.
> - If a model profile configuration is outdated or unavailable, the UI must show a clear **"Stale/Unverified Data"** warning.

---

## 3. Structured Output & Vercel AI SDK Rule

To prevent formatting errors, parser failures, or unpredictable LLM responses, we mandate structured outputs.

> [!IMPORTANT]
> **Mandatory AI SDK Integration Pattern**:
>
> - Use the Vercel AI SDK's `generateObject` function with a strictly typed Zod schema via `lib/ai/gemini-client.ts`.
> - **Do not use** `@openrouter/ai-sdk-provider` or any OpenRouter provider call.
> - **Do not use** provider-specific call layers directly — go through `lib/ai/gemini-client.ts`.

### Active Integration Pattern (from `lib/ai/gemini-client.ts`)

```typescript
// [ACTIVE PRODUCTION INTEGRATION]
// Vercel AI SDK with @ai-sdk/google:
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const { object } = await generateObject({
  model: google(process.env.GEMINI_MODEL_ID || "gemini-2.5-flash"),
  system: systemInstruction,
  prompt: userPrompt,
  temperature: 0.1,
  schema: z.object({
    score: z.number().min(0).max(100),
    diagnosis: z.string(),
    improvedPrompt: z.string(),
    explanations: z.array(z.string()),
  }),
});
```

---

## 4. MVP Scope & Active Features

### 🟢 In-Scope & Active Features

- **Anonymous Prompt Analysis**: Free prompt checking without account creation (limited to 3 daily reviews, 10 monthly reviews, max 12,000 prompt characters).
- **PL/EN Working Languages**: Fully supported translation, scoring, and UI localization.
- **Single Model Profile**: `general-llm` only.
- **Scoring Breakdown**: Visual criteria metrics, score levels, and top weaknesses.
- **Improved Prompt & Explanations**: A copy-ready refined prompt with change log.
- **AI Safety & Sensitive Data Preflights**: Active regex/rule-based blocking of high-risk secrets before sending to LLM.
- **Private Result Ownership**: Cookie-based anonymous session linking `/result/[id]` strictly to its creator.
- **Opt-in Public Sharing**: User-controlled `/share/[token]` random URL access with sharing explicitly disabled by default.
- **Usage Limits**: Enforcement of daily and monthly limits using a secure server-side reservation database ledger (prevents race conditions and double-spending).
- **Stripe Subscriptions & checkout**: Pro plan access (100 daily reviews, 500 monthly reviews, 24,000 max prompt characters, PDF export enabled). Checkout flow, portal link, and webhook event handling.
- **Supabase Auth**: Authenticated login and user profiles.
- **Account history**: Detailed history page for authenticated users.
- **Export options**: Markdown, Plain Text (.txt), and PDF (Pro only) exports.
- **GDPR Privacy & Terms Drafts**: Visible landing drafts.
- **Admin Metrics Dashboard**: High-level telemetry aggregation.
- **Cron Cleanup**: Automated database retention cleanup.

### 🔴 Out-of-Scope Features (DO NOT BUILD)

- **No Marketplace or Sharing to Public Discovery Feeds**
- **No Multi-Model Simultaneous/Side-by-Side Execution**
- **No Model/Provider Selector in the UI**
- **No Browser Extensions or IDE Integrations**
- **No Collaboration or Team Workspaces**
- **No Automated Benchmarking dashboards**

---

## 5. Coding Rules & Constraints

1. **Plan First**: Always propose a clear implementation plan before modifying any codebase files.
2. **Strict TypeScript**: Disable `any` types; enforce strict optional chaining and narrow union typing.
3. **Secrets & Keys**:
   - **Never** expose `GOOGLE_GENERATIVE_AI_API_KEY` or `SUPABASE_SECRET_KEY` client-side.
   - Do not prefix server secrets with `NEXT_PUBLIC_`.
   - Do not add `OPENROUTER_API_KEY` to any active code path.
4. **Backend Score Owner**: Final prompt score calculations and safety checks must occur in the backend code, not inside client bundles or purely trusting LLM outputs.
5. **Test Driven**: Add isolated unit tests for scoring calculations, sensitive-data detectors, and result share access policies.
6. **No Unverified Claims**: Never display unverified claims about LLM pricing, context windows, or provider benchmarks.
7. **Production Supabase MCP**: Use Supabase MCP `execute_sql` and `apply_migration` to manage the live online database. **Do not initialize, start, or reset local Supabase/Docker instances.**
8. **Lint and Build**: Always run the validation commands before completing a task:
   ```bash
   pnpm install --frozen-lockfile
   pnpm exec tsc --noEmit
   pnpm lint
   pnpm test
   pnpm audit --prod
   pnpm build
   ```
