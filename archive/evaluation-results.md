> [!WARNING]
> **Archived / Historical** — This document has been moved to archive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# AI Quality Evaluation Pass Results â€” PromptPolish

> [!WARNING]
> **LIVE AI EVALUATION NOT RUN**: The live evaluation pass against OpenRouter (target: `deepseek/deepseek-v4-flash`) was skipped because the `OPENROUTER_API_KEY` is not configured in your `.env.local` file.
>
> An automated quality evaluation suite is prepared. Follow the setup instructions below to execute it.

---

## 1. Historical Gemini structured output smoke test (Gemini 1.5 Flash)

### A. Live Smoke Test Skip Status
* **Status**: Skipped (No live key configured).
* **Missing API Key Handling**: The legacy smoke test script ([**`scripts/smoke-test-gemini.ts`**](file:///d:/AI/promptpolish/scripts/smoke-test-gemini.ts)) was executed and verified to handle the missing key gracefully. It exits with a detailed configuration guide and does **not** fake success.

### B. Legacy Smoke Test Design (Historical)
The legacy script validates Gemini's structured output compatibility against the exact production-grade `analysisResultSchema` (matching `/api/analyze` behavior).

* **Target Model ID**: `gemini-3.5-flash`
* **Calibration Test Matrix**:
  1. **Polish (PL) Weak Prompt**: `"Napisz opis produktu"` (Expected low score, missing goals/format).
  2. **Polish (PL) Strong Prompt**: `"DziaĹ‚aj jako starszy copywriter..."` (Expected high score, clear goals/format).
  3. **English (EN) Weak Prompt**: `"Write a product description"` (Expected low score, vagueness).
  4. **English (EN) Strong Prompt**: `"Act as a senior e-commerce copywriter..."` (Expected high score, clear constraints).

* **Telemetry and Metrics Tracked (Active Scenario)**:
  - **Invalid Output Rate**: Percentage of Zod schema validation failures across all execution attempts.
  - **Model ID**: `gemini-3.5-flash` (or custom configured `GEMINI_MODEL_ID`).
  - **Token Usage**: Logs prompt, completion, and cumulative total tokens per case.
  - **Provider Errors**: Counts network, API quota, or server-side crashes.
  - **Retry Count**: Built-in 2-retry mechanism with wait intervals on transient errors.
  - **Invalid Schema Count**: Tracks Zod parsing exceptions.
  - **Cost Estimation**: Automatically calculates real-time USD cost using standard pricing benchmarks.

### C. Cost Benchmarking & Estimation (Historical Gemini 1.5 Flash)
Cost per prompt analysis is estimated using the following pricing standards:
* **Pricing Standard (Gemini 1.5/3.5 Flash)**:
  - Input Tokens: **$0.075 / 1,000,000 tokens** ($0.000000075 per token)
  - Output Tokens: **$0.30 / 1,000,000 tokens** ($0.000000300 per token)

**Cost Formula**:
$$\text{Analysis Cost} = (\text{Prompt Tokens} \times 0.000000075) + (\text{Completion Tokens} \times 0.000000300)$$

*Typical Single-Turn Analysis Profile*:
- Input: ~600 tokens ($0.000045)
- Output: ~900 tokens ($0.000270)
- **Total estimated cost per analysis**: **~$0.000315 USD**

---

## 2. How to Run Live Quality Checks

To perform the live quality evaluation pass:

1. Open your local configurations file:
   [**`.env.local`**](file:///d:/AI/promptpolish/.env.local)
2. Provide your valid OpenRouter API Key:
   ```bash
   OPENROUTER_API_KEY=your_key_here
   ```
3. To run the full 46-item quality evaluation pass:
   ```bash
   npx tsx scripts/run-evaluation.ts
   ```

---

## 2. Static Quality Audit of Prompt System Instructions

We performed a rigorous static code review of the core system prompt templates ([**`lib/ai/prompts.ts`**](file:///d:/AI/promptpolish/lib/ai/prompts.ts)) and structured schemas ([**`lib/ai/schemas.ts`**](file:///d:/AI/promptpolish/lib/ai/schemas.ts)) against the AI quality evaluation guidelines.

### A. Polished Prompt Length Control
* **System Prompt Guardrail**: Rule 4 states: *"Do not make the improved prompt unnecessarily long. Keep it concise, functional, and efficient."*
* **Evaluation**: Very strong. This prevents the model from bloating simple inputs into massive, context-heavy essays, keeping prompt costs low and preventing latency spikes.
* **Potential Risk**: LLM compliance with length bounds relies on self-attention; very weak prompts can sometimes trigger overly verbose boilerplate guides.

### B. Prevention of Invented Capabilities (Model Fit Notes)
* **System Prompt Guardrail**: Rules 5, 6, and 7 strictly command:
  1. *"Use ONLY the model profile details provided in the prompt to evaluate model compatibility."*
  2. *"Absolutely DO NOT invent or assume any unverified model capabilities, pricing structures, context windows, token limits, benchmark scores, or provider recommendations."*
  3. *"If model profile data is missing or marked unverified/stale, treat it as unknown/unverified. Do not suggest or assert specifications."*
* **User Prompt Guardrail**: *"For 'model_profile_fit', evaluate compatibility strictly against the [MODEL PROFILE DATA] provided above. Do not reference external benchmarks or claim knowledge of pricing or context windows not listed in the profile."*
* **Evaluation**: Excellent. This prevents the model from fabricating benchmark scores or quoting outdated pricing structures.

### C. Uncertainty Warnings Generation
* **System Prompt Guardrail**: Rule 9 commands: *"To combat hallucination, always include anti-hallucination guardrails and instructions in the generated improved prompt, instructing the model to reject ungrounded assumptions or state when information is unavailable."*
* **Evaluation**: Decent. The schema strictly enforces `uncertainty_warnings` as a typed array of strings. 
* **Potential Risk**: While the system instructions command anti-hallucination guardrails inside the *improved prompt*, they do not explicitly tell the model when to populate the *outer structured JSON parameter* `uncertainty_warnings`. Under live conditions, the model might leave this array empty even for uncertain facts unless instructed directly.

### D. Safety Notes & Secrets Leak Prevention
* **System Prompt Guardrail**: Rule 8 commands: *"Under no circumstances should you repeat full secret values (such as passwords, API keys, tokens, or private database keys) if the input contains sensitive data. Redact them or speak about them generally without copying the sensitive value itself."*
* **Evaluation**: Outstanding. This addresses the danger of "confidentiality mirroring" where the assistant regurgitates credentials back in its analysis notes or within the "improved prompt".
* **Active Defense**: Supported by server-side preflight scans in [**`lib/privacy/sensitive-data-detector.ts`**](file:///d:/AI/promptpolish/lib/privacy/sensitive-data-detector.ts) which blocks high-risk secrets before sending any data to the model.

---

## 3. Calibration Fixture Expectations & Target Ranges

The calibration suite contains **46 prompts** categorized into 6 JSON files under [**`tests/ai-fixtures/`**](file:///d:/AI/promptpolish/tests/ai-fixtures):

| Fixture File | Items | Target Language | Expected Scores | Expected Security & Hallucination Actions |
| :--- | :---: | :---: | :---: | :--- |
| **`weak-pl.json`** | 10 | Polish | **10 - 40** | Should score low due to missing goals, structure, and constraints. |
| **`strong-pl.json`** | 10 | Polish | **75 - 100** | Should score high because they include clear roles, data, and constraints. |
| **`weak-en.json`** | 10 | English | **10 - 40** | Should score low due to vagueness, brevity, and ambiguous instructions. |
| **`strong-en.json`** | 10 | English | **75 - 100** | Should score high because they utilize advanced structures and clear outputs. |
| **`sensitive-data.json`** | 5 | Mixed | **0 - 50** | Preflight filters must trigger a `422` block on high-risk credentials. Live model must redact secrets in `safety_notes`. |
| **`uncertain-facts.json`** | 5 | Mixed | **30 - 65** | Model must populate `uncertainty_warnings` due to queries on volatile specs. |

---

## 4. Recommended Prompt & Schema Changes (Separated)

Based on the static analysis audit, we recommend applying the following isolated changes to the prompt files to guarantee quality when the system goes live:

### đź’ˇ Recommendation 1: Explicitly Instruct Uncertainty Warning Population
* **Problem**: Rule 9 tells the model to add guardrails *inside* the polished prompt, but does not explicitly instruct it to populate the `uncertainty_warnings` array in the JSON schema when the input prompt requests dynamic, unverified facts.
* **Suggested Action**: Append to `analysisSystemInstruction` in `lib/ai/prompts.ts`:
  ```typescript
  "10. If the input prompt asks for fast-moving metrics (such as real-time pricing, token limits, benchmark scores, or unreleased software properties) without providing source documentation, you MUST populate the 'uncertainty_warnings' array with specific notes indicating that these values are unverified and subject to change."
  ```

### đź’ˇ Recommendation 2: Tighten the Zod Constraint on Uncertainty Warnings
* **Problem**: Currently, the `uncertainty_warnings` array is optional and allows up to 8 elements.
* **Suggested Action**: Ensure our client UI displays a prominent warning banner when `uncertainty_warnings.length > 0` to alert users of potential hallucinations in their prompts.

### đź’ˇ Recommendation 3: Add Preflight API Key Masking
* **Problem**: If high-risk credentials are block-disabled, the user gets blocked. If we only show warning, secrets might go to the provider.
* **Suggested Action**: Continue relying on the robust server-side preflight block (`SENSITIVE_DATA_BLOCK_HIGH_RISK=true`) which completely prevents any secret-bearing prompts from making API calls to OpenRouter.
