# Gemini API Integration Decision — PromptPolish

> [!CAUTION]
> **ARCHIVED / OUTDATED**: This document describes the legacy Gemini API integration pattern using `@ai-sdk/google`.
> The runtime AI engine has been migrated to **OpenRouter** using `@openrouter/ai-sdk-provider` and the `deepseek/deepseek-v4-flash` target model.
> For the active AI integration blueprint, refer to [**`docs/openrouter-integration-decision.md`**](file:///d:/AI/promptpolish/docs/openrouter-integration-decision.md).

This document establishes the technical blueprint, library selections, model endpoints, and safety guardrails for the Gemini API integration inside PromptPolish.

---

## 1. Technical Framework & Library Selection

*   **Official SDK**: We use the official Vercel AI SDK (`ai` package) with the `@ai-sdk/google` provider.
*   **Reasoning**: Native App Router support, built-in dynamic streaming capabilities, and highly structured, Zod-validated JSON output bindings.
*   **Gemini Model**: We default to **Gemini 1.5 Flash** or **Gemini 2.0 Flash** (resolved dynamically from backend config rows) for high speed, low latency, and highly cost-effective analysis runs.

---

## 2. Mandatory Structured Output Pattern

To avoid unpredictable text layouts, JSON parsing errors, or missing key fields, the integration **MUST** utilize `Output.object` from the Vercel AI SDK.

### Code Blueprint
```typescript
import { generateText, Output } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function executePromptAudit(promptText: string, modelId: string) {
  try {
    const response = await generateText({
      model: google(modelId),
      temperature: 0.1, // Low temperature to maximize score reproducibility
      output: Output.object({
        schema: z.object({
          criteriaScores: z.object({
            role: z.number().min(0).max(100),
            context: z.number().min(0).max(100),
            constraints: z.number().min(0).max(100),
            format: z.number().min(0).max(100),
          }),
          weaknesses: z.array(
            z.object({
              title: z.string(),
              severity: z.enum(['low', 'medium', 'high']),
              critique: z.string(),
            })
          ),
          improvedPrompt: z.string(),
          explanations: z.array(z.string()),
        }),
      }),
      prompt: `Audit the following prompt: \n\n"${promptText}"`,
    });

    return response.output;
  } catch (error) {
    // Standardized Error Normalization
    throw new Error('Gemini generation failed');
  }
}
```

---

## 3. Mandatory Provider Changelog Checks

Before any changes are committed to the AI provider integration, the developer or agent must perform the following validation gates:

> [!IMPORTANT]
> **AI Changelog Verification Checklist**:
> *   **Check API Status**: Verify that the targeted Gemini model ID (e.g., `gemini-1.5-flash`) is not deprecated or scheduled for shutdown.
> *   **Check SDK Compatibility**: Confirm that the installed `@ai-sdk/google` package version matches the schema configuration.
> *   **Review Structured Output Limits**: Enforce that the output schemas do not exceed maximum nested object bounds supported by the target API version.

---

## 4. Key Management & Environment Security

*   **API Key Storage**: The Google Generative AI key must be declared strictly under the server-only variable: `GEMINI_API_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY`).
*   **No Client Leaks**: Never prefix this variable with `NEXT_PUBLIC_`. Any attempt to expose the AI provider key in standard client components will trigger build-time failures.
*   **IP Protection**: Server-side routing blocks direct user IPs from hitting the Gemini API endpoints. The Vercel server functions act as the secure gateway, protecting the user's connection details.

---

## 5. Provider Error Normalization

*   **Safe UI Mapping**: If the Gemini API experiences throttling (HTTP 429), quota issues, or transient downtime, the catch block must map this into a standardized, generic user-facing message: *"Our prompt analysis engine is currently handling high volume. Please wait a few moments and try again."*
*   **Internal Logging**: The raw stack trace and specific API error payload (including any raw error details or structural payloads) are logged internally for developer diagnostics only and never exposed to the browser.

---

## 6. Endpoint Selection and Smoke Testing Decisions (2026-05-23)

### Endpoint Decision
*   **Standard Endpoint Chosen**: We explicitly use the standard Google Generative AI `:generateContent` and `:streamGenerateContent` endpoints via the `google('model-id')` model instance creator.
*   **Interactions API Avoided**: We explicitly **DO NOT** use the Gemini Interactions API (`google.interactions(...)` endpoint). The Interactions API targets a separate stateful `POST /v1beta/interactions` endpoint that maintains server-side state, utilizes different event SSE vocabularies, and is intended for agent presets or multi-turn conversational agents. Our anonymous single-turn prompt analysis requires simple, stateless, fast execution, which is perfectly served by standard `generateContent`.

### Upgraded Production Schema Smoke Test
*   **Upgrade Completed (2026-05-23)**: The deferred minimal smoke test has been replaced with a robust, production-equivalent structured output smoke test using the actual `analysisResultSchema`.
*   **Prompt Matrix Coverage**: The upgraded script (`scripts/smoke-test-gemini.ts`) validates 4 standard calibration scenarios:
    1. Polish (PL) Weak Prompt
    2. Polish (PL) Strong Prompt
    3. English (EN) Weak Prompt
    4. English (EN) Strong Prompt
*   **Telemetry Collected**: The script records precise telemetry for:
    - Invalid output rate (Zod schema violations / total calls)
    - Model ID used (`process.env.GEMINI_MODEL_ID` or `gemini-3.5-flash`)
    - Token usage (input, output, cumulative total)
    - Provider error counts
    - Retries count (with exponential backoff / simple wait retry mechanism)
    - Invalid schema counts
    - Cost estimation based on live token counts.

### Cost Benchmark & Estimation Formula
We establish a standard benchmark for cost estimation per single-turn prompt analysis.
For **Gemini 1.5 Flash** (or `gemini-3.5-flash`), the pricing is:
- **Input Tokens**: $0.075 / 1,000,000 tokens ($0.000000075 per token)
- **Output Tokens**: $0.30 / 1,000,000 tokens ($0.000000300 per token)

**Cost Formula**:
$$\text{Cost per Analysis} = (\text{Input Tokens} \times 0.000000075) + (\text{Output Tokens} \times 0.000000300)$$

*Based on prompt size (avg. 500-1000 input tokens, 800-1200 output tokens), the typical analysis cost ranges between $0.00025 and $0.00045.*

### Execution Instructions
To run the production schema smoke test locally:
1. Open [**`.env.local`**](file:///d:/AI/promptpolish/.env.local) and provide a valid API key:
   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
   ```
2. Run the smoke test using `tsx`:
   ```bash
   npx tsx scripts/smoke-test-gemini.ts
   ```
3. The script will execute the cases, validate schemas, calculate real-time costs, and report final metrics.

*   **Missing API Key Handling**: If the `GOOGLE_GENERATIVE_AI_API_KEY` is not set locally (e.g. in development), the live smoke test script (`scripts/smoke-test-gemini.ts`) exits gracefully with detailed setup documentation and a clear skip status. It **DO NOT** fake success.

