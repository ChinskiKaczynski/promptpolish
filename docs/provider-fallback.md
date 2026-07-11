# Provider Fallback Architecture

This document describes the design, configuration, and constraints of the PromptPolish provider fallback mechanism.

---

## 1. Design Overview

To maximize API availability and reliability during intermittent provider failures, the prompt analysis pipeline is designed with a two-attempt execution strategy:

1. **Primary Model**: The engine attempts the request with the primary model. The model ID is resolved dynamically from the database profile capabilities or falls back to the server environment settings (`getOwnerConfiguredModelId()` maps aliases like `cheap`, `fast`, `quality`, `default`, `current` to `gemini-2.5-flash` or uses `GEMINI_MODEL_ID`).
2. **Fallback Model**: If the primary attempt fails with a transient error (timeouts, rate limits, 502/503/504 status codes, or network connection failures), the client attempts to fallback to a secondary model.

---

## 2. Configuration & Opt-In Rules

The provider fallback is completely optional and adheres to the following rules:

- **Optional Fallback**: The fallback model is resolved from the database profile capabilities (`capabilities.fallback_model_id` or `capabilities.fallbackModelId`), defaulting to the environment variable `GEMINI_MODEL_ID`.
- **Same as Primary Disables Fallback**: If the fallback model ID is identical to the primary model ID (or resolves to the same string), the fallback attempt is disabled.
- **Absent/Blank Disables Fallback**: If the fallback model ID is unset, empty, or whitespace, fallback is cleanly disabled.
- **Translatability & Schema Preservation**: Both primary and fallback models execute structured generation via the Vercel AI SDK (`generateObject`) using a strictly typed Zod schema via `lib/ai/gemini-client.ts` to prevent parsing failures or unpredictable outputs.
- **Timeout Policies**:
  - The primary attempt timeout defaults to `55000` ms (55s) or as configured via the database capabilities (`timeout_ms` / `serverEnv.AI_PROVIDER_TIMEOUT_MS`).
  - The total operation budget timeout (encompassing both primary and fallback attempts) defaults to `110000` ms (110s).
  - A fallback attempt will only be launched if the remaining budget is at least 5000 ms.

---

## 3. Environment Variables (Required)

- **`GOOGLE_GENERATIVE_AI_API_KEY`**: API Key for Google Gemini.
- **`GEMINI_MODEL_ID`**: Default model ID used as a fallback if not configured otherwise (e.g., `gemini-2.5-flash`).
- **`AI_PROVIDER_TIMEOUT_MS`**: Request budget in milliseconds (default: 55000).

> [!IMPORTANT]
> **OpenRouter/DeepSeek/Owl are ARCHIVED**:
> Legacy variables like `OPENROUTER_FALLBACK_MODEL_ID`, `OPENROUTER_MODEL_ID` and `OPENROUTER_API_KEY` are archived and not used by the production code. Do not configure them.

---

## 4. Testing Policy

- **Default Tests are Offline**: The standard `pnpm test` suite does not make any live provider requests, requires no API credentials, and operates entirely offline.
- **Live AI Checks require Opt-In**: Explicit verification scripts (`pnpm test:live:fallback` and `pnpm test:live:calibration`) are completely isolated and require `RUN_LIVE_AI_TESTS=true` to execute.
