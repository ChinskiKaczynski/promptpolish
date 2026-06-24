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
- **AI Integration**: OpenRouter API via Vercel AI SDK using `@openrouter/ai-sdk-provider` (with target model `openrouter/owl-alpha`)
- **Validation**: Zod (for type-safe schema validations)

---

## 2. Default MVP Model Profiles

We define exactly two allowed model profiles in the MVP:

1.  **`general-llm`** (Product Slug representing a balanced LLM profile)
2.  **`openrouter-deepseek-v4-flash`** (Product Slug representing DeepSeek v4 Flash via OpenRouter)

> [!IMPORTANT]
> **Dynamic Profile Rules**:
>
> - Do not hardcode model capabilities, token limits, context windows, benchmark scores, or pricing claims in the client-side UI.
> - The actual provider `model_id` (e.g., `openrouter/owl-alpha`) must be resolved from database/static seed configuration in the backend.
> - If a model profile configuration is outdated or unavailable, the UI must show a clear **"Stale/Unverified Data"** warning.

---

## 3. Structured Output & Vercel AI SDK Rule

To prevent formatting errors, parser failures, or unpredictable LLM responses, we mandate structured outputs.

> [!IMPORTANT]
> **Mandatory AI SDK Integration Pattern**:
>
> - Use the Vercel AI SDK's `generateText` or `streamText` function with the `output` parameter set to `Output.object` and a strictly defined Zod schema.
> - **Do not use** older structured-output APIs (such as legacy JSON schema definitions) unless explicitly documented and approved in `docs/decision-log.md`.
> - **Do not use** provider-specific call layers directly in the MVP.

### Standard Integration Schema Pattern

```typescript
// [ARCHIVED/OUTDATED HISTORICAL GEMINI REFERENCE]
// Formerly used Vercel AI SDK's @ai-sdk/google provider:
// import { google } from '@ai-sdk/google';
//
// [ACTIVE PRODUCTION INTEGRATION]
// Vercel AI SDK with @openrouter/ai-sdk-provider:
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";
import { z } from "zod";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const result = await generateText({
  model: openrouter.chat(
    process.env.OPENROUTER_MODEL_ID || "openrouter/owl-alpha",
  ),
  output: Output.object({
    schema: z.object({
      score: z.number().min(0).max(100),
      diagnosis: z.string(),
      improvedPrompt: z.string(),
      explanations: z.array(z.string()),
    }),
  }),
  prompt: "Your structured analysis prompt...",
});
```

---

## 4. MVP Scope Guardrails

### 🟢 In-Scope MVP Features

- **Anonymous Prompt Analysis**: Free, fast prompt checking without account creation.
- **PL/EN Working Languages**: Fully supported translation, scoring, and UI localization.
- **Two Model Profiles**: `general-llm` and `openrouter-deepseek-v4-flash`.
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
- **No Browser Extensions or IDE Integrations**
- **No Collaboration or Team Workspaces**
- **No Automated Benchmarking dashboards**
- **No Admin Panel or Global Management portal**

---

## 5. Coding Rules & Constraints

1.  **Plan First**: Always propose a clear implementation plan before modifying any codebase files.
2.  **Strict TypeScript**: Disable `any` types; enforce strict optional chaining and narrow union typing.
3.  **Secrets & Keys**:
    - **Never** expose `OPENROUTER_API_KEY` or `SUPABASE_SECRET_KEY` client-side.
    - Do not prefix server secrets with `NEXT_PUBLIC_`.
4.  **Backend Score Owner**: Final prompt score calculations and safety checks must occur in the backend code, not inside client bundles or purely trusting LLM outputs.
5.  **Test Driven**: Add isolated unit tests for scoring calculations, sensitive-data detectors, and result share access policies.
6.  **No Unverified Claims**: Never display unverified claims about LLM pricing, context windows, or provider benchmarks.
7.  **Lint and Build**: Always run `pnpm lint` and `pnpm build` before completing a task to verify code health.
