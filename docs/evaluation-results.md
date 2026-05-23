# AI Quality Evaluation Pass Results — PromptPolish

> [!WARNING]
> **LIVE AI EVALUATION NOT RUN**: The live evaluation pass against the actual Gemini API (target: `gemini-3.5-flash`) was skipped because the `GOOGLE_GENERATIVE_AI_API_KEY` is not configured in your `.env.local` file.
>
> An automated evaluation script has been prepared at [scripts/run-evaluation.ts](file:///d:/AI/promptpolish/scripts/run-evaluation.ts). Follow the setup instructions below to execute the live suite.

---

## 1. How to Run Live Evaluation Suite

To perform the live quality evaluation pass, execute the following steps in your terminal:

1. Open your local configurations file:
   [**`.env.local`**](file:///d:/AI/promptpolish/.env.local)
2. Provide your valid Google Gemini API Key:
   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyYourActualKeyHere
   ```
3. Run the automated evaluation suite using `tsx`:
   ```bash
   npx tsx scripts/run-evaluation.ts
   ```
4. The script will automatically connect to the Gemini API, evaluate all 46 calibration prompts, calculate scoring deviations, detect leaks, audit uncertainty warnings, and overwrite this file (`docs/evaluation-results.md`) with live telemetry.

---

## 2. Static Quality Audit of Prompt System Instructions

We performed a rigorous static code review of the core system prompt templates ([**`lib/ai/prompts.ts`**](file:///d:/AI/promptpolish/lib/ai/prompts.ts)) and structured schemas ([**`lib/ai/schemas.ts`**](file:///d:/AI/promptpolish/lib/ai/schemas.ts)) against the AI quality evaluation guidelines.

### A. Polished Prompt Length Control
* **System Prompt Guardrail**: Rule 4 states: *"Do not make the improved prompt unnecessarily long. Keep it concise, functional, and efficient."*
* **Evaluation**: Very strong. This prevents Gemini from bloating simple inputs into massive, context-heavy essays, keeping prompt costs low and preventing latency spikes.
* **Potential Risk**: LLM compliance with length bounds relies on self-attention; very weak prompts can sometimes trigger overly verbose boilerplate guides.

### B. Prevention of Invented Capabilities (Model Fit Notes)
* **System Prompt Guardrail**: Rules 5, 6, and 7 strictly command:
  1. *"Use ONLY the model profile details provided in the prompt to evaluate model compatibility."*
  2. *"Absolutely DO NOT invent or assume any unverified model capabilities, pricing structures, context windows, token limits, benchmark scores, or provider recommendations."*
  3. *"If model profile data is missing or marked unverified/stale, treat it as unknown/unverified. Do not suggest or assert specifications."*
* **User Prompt Guardrail**: *"For 'model_profile_fit', evaluate compatibility strictly against the [MODEL PROFILE DATA] provided above. Do not reference external benchmarks or claim knowledge of pricing or context windows not listed in the profile."*
* **Evaluation**: Excellent. This prevents Gemini from fabricating benchmark scores or quoting outdated pricing structures.

### C. Uncertainty Warnings Generation
* **System Prompt Guardrail**: Rule 9 commands: *"To combat hallucination, always include anti-hallucination guardrails and instructions in the generated improved prompt, instructing the model to reject ungrounded assumptions or state when information is unavailable."*
* **Evaluation**: Decent. The schema strictly enforces `uncertainty_warnings` as a typed array of strings. 
* **Potential Risk**: While the system instructions command anti-hallucination guardrails inside the *improved prompt*, they do not explicitly tell Gemini when to populate the *outer structured JSON parameter* `uncertainty_warnings`. Under live conditions, Gemini might leave this array empty even for uncertain facts unless instructed directly.

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

### 💡 Recommendation 1: Explicitly Instruct Uncertainty Warning Population
* **Problem**: Rule 9 tells the model to add guardrails *inside* the polished prompt, but does not explicitly instruct it to populate the `uncertainty_warnings` array in the JSON schema when the input prompt requests dynamic, unverified facts.
* **Suggested Action**: Append to `analysisSystemInstruction` in `lib/ai/prompts.ts`:
  ```typescript
  "10. If the input prompt asks for fast-moving metrics (such as real-time pricing, token limits, benchmark scores, or unreleased software properties) without providing source documentation, you MUST populate the 'uncertainty_warnings' array with specific notes indicating that these values are unverified and subject to change."
  ```

### 💡 Recommendation 2: Tighten the Zod Constraint on Uncertainty Warnings
* **Problem**: Currently, the `uncertainty_warnings` array is optional and allows up to 8 elements.
* **Suggested Action**: Ensure our client UI displays a prominent warning banner when `uncertainty_warnings.length > 0` to alert users of potential hallucinations in their prompts.

### 💡 Recommendation 3: Add Preflight API Key Masking
* **Problem**: If high-risk credentials are block-disabled, the user gets blocked. If we only show warning, secrets might go to the provider.
* **Suggested Action**: Continue relying on the robust server-side preflight block (`SENSITIVE_DATA_BLOCK_HIGH_RISK=true`) which completely prevents any secret-bearing prompts from making API calls to Gemini.
