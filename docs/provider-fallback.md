# Provider Fallback Architecture

This document describes the design, configuration, and constraints of the PromptPolish provider fallback mechanism.

---

## 1. Design Overview

To maximize API availability and reliability during intermittent provider failures, the prompt analysis pipeline is designed with a two-attempt execution strategy:
1. **Primary Model**: The engine attempts the request with the primary model resolved from the database catalog or `OPENROUTER_MODEL_ID` (defaults to `deepseek/deepseek-v4-flash`).
2. **Fallback Model**: If the primary attempt fails with a transient error (timeouts, rate limits, 502/503/504 status codes, or network connection failures), the client attempts to fallback to a secondary model.

---

## 2. Configuration & Opt-In Rules

The provider fallback is completely optional and adheres to the following rules:

* **Optional Fallback**: The fallback model is configured using the environment variable `OPENROUTER_FALLBACK_MODEL_ID` or database capabilities.
* **Absent/Blank Disables Fallback**: If `OPENROUTER_FALLBACK_MODEL_ID` is unset, empty, or whitespace, fallback is cleanly disabled.
* **Same as Primary Disables Fallback**: If the fallback model ID is identical to the primary model ID, the fallback attempt is disabled.
* **Malformed ID Disables Fallback**: Rejects fallback IDs that do not match the `provider/model` format (missing a slash `/`) and warns in the logs.
* **Production Configuration**: The `OPENROUTER_FALLBACK_MODEL_ID` **must remain unset** in the production Vercel environment.
* **GPT-4o-Mini Rejection**: `openai/gpt-4o-mini` is currently **rejected** as a transparent scoring fallback due to high score divergence.

---

## 3. Testing Policy

* **Default Tests are Offline**: The standard `pnpm test` suite does not make any live provider requests, requires no API credentials, and operates entirely offline.
* **Live AI Checks require Opt-In**: Explicit verification scripts (`pnpm test:live:fallback` and `pnpm test:live:calibration`) are completely isolated and require `RUN_LIVE_AI_TESTS=true` to execute.
