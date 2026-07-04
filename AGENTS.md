# PromptPolish — Project Rules & Agent Guidelines

This is a production-oriented, anonymous-first PromptPolish application designed to score, diagnose, and improve prompts.

---

## 1. Core Technology Stack

All developers and agents MUST strictly adhere to the following stack:

- **Framework**: Next.js App Router (version 16+)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Vanilla CSS in `app/globals.css`, no utility-class expansions like Tailwind v4 unless explicitly configured)
- **Database**: Supabase Postgres (accessed server-side only via `@supabase/supabase-js`)
- **Deployment**: Vercel
- **AI Integration**: Google Gemini via Vercel AI SDK using `@ai-sdk/google` (target model: `gemini-2.5-flash`, env: `GEMINI_MODEL_ID`)
- **Validation**: Zod (for type-safe schema validations)

> [!IMPORTANT]
> **OpenRouter/DeepSeek/Owl are ARCHIVED — not part of the active runtime.**
> The `@openrouter/ai-sdk-provider` package has been removed from `package.json`.
> Do not add it back. Do not reference `OPENROUTER_API_KEY` in runtime code.
> Historical context is in `archive/openrouter-integration-decision.md` and `docs/decision-log.md`.

---

## 2. Active Model Profile

Exactly **one** product-facing profile is active in the MVP:

1. **`general-llm`** — the only valid `selected_profile_slug`

> [!IMPORTANT]
> **Profile Rules**:
>
> - Do not hardcode model capabilities, token limits, context windows, benchmark scores, or pricing claims in the client-side UI.
> - The actual provider `model_id` (`gemini-2.5-flash`) must be resolved from env `GEMINI_MODEL_ID` in the backend.
> - No model/profile selector is shown in the UI for now. The form always sends `selected_profile_slug: 'general-llm'`.
> - If a model profile configuration is outdated or unavailable, the UI must show a clear **"Stale/Unverified Data"** warning.

---

## 3. Structured Output & Vercel AI SDK Rule

To prevent formatting errors, parser failures, or unpredictable LLM responses, we mandate structured outputs.

> [!IMPORTANT]
> **Mandatory AI SDK Integration Pattern**:
>
> - Use the Vercel AI SDK's `generateObject` function with a strictly typed Zod schema via `lib/ai/gemini-client.ts`.
> - **Do not use** `@openrouter/ai-sdk-provider` or any OpenRouter provider call.
> - **Do not use** provider-specific call layers directly in the MVP — go through `lib/ai/gemini-client.ts`.

### Active Integration Pattern (from `lib/ai/gemini-client.ts`)

```typescript
// [ACTIVE PRODUCTION INTEGRATION]
// Vercel AI SDK with @ai-sdk/google:
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const { object } = await generateObject({
  model: google(process.env.GEMINI_MODEL_ID || 'gemini-2.5-flash'),
  system: systemInstruction,
  prompt: userPrompt,
  temperature: 0.1,
  schema: z.object({
    score: z.number().min(0).max(100),
    diagnosis: z.string(),
    improvedPrompt: z.string(),
    explanations: z.array(z.string()),
  }),
})
```

---

## 4. MVP Scope Guardrails

### 🟢 In-Scope MVP Features

- **Anonymous Prompt Analysis**: Free, fast prompt checking without account creation.
- **PL/EN Working Languages**: Fully supported translation, scoring, and UI localization.
- **Single Model Profile**: `general-llm` only. No profile selector in the UI.
- **Scoring Breakdown**: Visual criteria metrics, score levels, and top weaknesses.
- **Improved Prompt & Explanations**: A copy-ready refined prompt with change log.
- **AI Safety & Sensitive Data Preflights**: Active regex/rule-based blocking of high-risk secrets before sending to LLM.
- **Private Result Ownership**: Cookie-based anonymous session linking `/result/[id]` strictly to its creator.
- **Opt-in Public Sharing**: User-controlled `/share/[token]` random URL access with sharing explicitly disabled by default.
- **Anonymous Usage Limits**: IP and cookie-based rate limits to prevent provider cost abuse.
- **Feedback Buttons**: Upvote/downvote and copy event tracking.
- **GDPR Privacy & Terms Drafts**: Visible landing drafts.

### 🔴 Out-of-Scope MVP Features (DO NOT BUILD)

- **No Authentication** (No Sign-in, Sign-up, or Profile Management)
- **No Billing or Pricing Pages**
- **No Folder or Tag Systems**
- **No Marketplace or Sharing to Public Discovery Feeds**
- **No Multi-Model Simultaneous/Side-by-Side Execution**
- **No Model/Provider Selector in the UI**
- **No Browser Extensions or IDE Integrations**
- **No Collaboration or Team Workspaces**
- **No Automated Benchmarking dashboards**
- **No Admin Panel or Global Management portal**

---

## 5. Coding Rules & Constraints

1.  **Plan First**: Always propose a clear implementation plan before modifying any codebase files.
2.  **Strict TypeScript**: Disable `any` types; enforce strict optional chaining and narrow union typing.
3.  **Secrets & Keys**:
    - **Never** expose `GOOGLE_GENERATIVE_AI_API_KEY` or `SUPABASE_SECRET_KEY` client-side.
    - Do not prefix server secrets with `NEXT_PUBLIC_`.
    - Do not add `OPENROUTER_API_KEY` to any active code path.
4.  **Backend Score Owner**: Final prompt score calculations and safety checks must occur in the backend code, not inside client bundles or purely trusting LLM outputs.
5.  **Test Driven**: Add isolated unit tests for scoring calculations, sensitive-data detectors, and result share access policies.
6.  **No Unverified Claims**: Never display unverified claims about LLM pricing, context windows, or provider benchmarks.
7.  **Lint and Build**: Always run `pnpm lint` and `pnpm build` before completing a task to verify code health.
