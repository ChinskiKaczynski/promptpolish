> [!WARNING]
> **Archived / Historical** — This document has been moved to archive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# OpenRouter API Integration Decision â€” PromptPolish

This document establishes the technical blueprint, library selections, model endpoints, and safety guardrails for the OpenRouter API integration inside PromptPolish.

---

## 1. Technical Framework & Library Selection

*   **Official SDK**: We use the standard Vercel AI SDK (`ai` package) with the `@openrouter/ai-sdk-provider` provider.
*   **Reasoning**: Native Next.js App Router compatibility, standard dynamic streaming capabilities, and highly structured, Zod-validated JSON output bindings.
*   **OpenRouter Model**: We default to **DeepSeek v4 Flash** (`deepseek/deepseek-v4-flash` at provider level) resolved dynamically from backend config rows, offering excellent Polish/English command understanding at sustainable speeds and extremely competitive cost margins.

---

## 2. Mandatory Structured Output Pattern

To avoid unpredictable text layouts, JSON parsing errors, or missing key fields, the integration **MUST** utilize `Output.object` from the Vercel AI SDK.

### Code Blueprint
```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function executePromptAudit(promptText: string, modelId: string) {
  try {
    const response = await generateText({
      model: openrouter.chat(modelId || 'deepseek/deepseek-v4-flash'),
      temperature: 0.1, // Low temperature to maximize score reproducibility and reduce hallucination
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
    throw new Error('OpenRouter generation failed');
  }
}
```

---

## 3. Key Management & Environment Security

*   **API Key Storage**: The OpenRouter key must be declared strictly under the server-only variable: `OPENROUTER_API_KEY`.
*   **Target Model Environment Variable**: The provider model target key is stored under `OPENROUTER_MODEL_ID` (defaulting to `deepseek/deepseek-v4-flash`).
*   **No Client Leaks**: Never prefix these variables with `NEXT_PUBLIC_`. Any attempt to expose the API keys in standard client components will trigger build-time failures.
*   **IP Protection**: Server-side routing blocks direct user IPs from hitting the OpenRouter API endpoints. The Vercel server functions act as the secure gateway, protecting the user's connection details.

---

## 4. Provider Error Normalization

*   **Safe UI Mapping**: If the OpenRouter API experiences throttling (HTTP 429), quota issues, or transient downtime, the catch block must map this into a standardized, generic user-facing message: *"Our prompt analysis engine is currently handling high volume. Please wait a few moments and try again."*
*   **Internal Logging**: The raw stack trace and specific API error payload (including any raw error details or structural payloads) are logged internally for developer diagnostics using prefix `[PROVIDER_ERROR]` and never exposed to the browser.

---

## 5. Diagnostic Verification & Quality Suite

*   **Quality Evaluation Suite**: We execute comprehensive diagnostic calibrations via the static evaluation script [**`scripts/run-evaluation.ts`**](file:///d:/AI/promptpolish/scripts/run-evaluation.ts).
*   **Mock Verification fallback**: When running in development mode without live keys configured, the validation scripts and API pipeline gracefully support mock-redirection fallbacks, ensuring completely stateless developer workflows and strict build stability.
