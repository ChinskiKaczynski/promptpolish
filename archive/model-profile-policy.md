> [!WARNING]
> **Archived / Historical** — This document has been moved to rchive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# Model Profile Policy â€” PromptPolish

To maintain trust and accuracy, PromptPolish strictly regulates how LLM models are profiled, queried, and displayed. Developers must never fabricate model capabilities, context limits, pricing benchmarks, or provider features.

---

## 1. Supported Model Profiles

The MVP supports exactly two model profiles. They are defined by product-level **slugs** rather than hardcoded developer assumptions:

1.  **`general-llm`**
    *   *Purpose*: A balanced general-purpose assessment model.
    *   *Default Target*: Resolves to the current industry-standard general analysis model in the database config.
2.  **`openrouter-deepseek-v4-flash`**
    *   *Purpose*: Specifically calibrated for prompt testing under DeepSeek-family models via OpenRouter.
    *   *Default Target*: Resolves to the verified active OpenRouter model ID.

---

## 2. Verification Model Metadata Schema

Every model profile stored in the database or loaded from static configurations MUST implement the following audit fields:

```typescript
interface ModelProfile {
  slug: string;                        // Product slug (e.g. 'openrouter-deepseek-v4-flash')
  model_id: string;                    // Provider model name (e.g. 'deepseek/deepseek-v4-flash')
  verification_status: 'verified' | 'unverified' | 'stale';
  confidence_level: 'high' | 'medium' | 'low';
  source_url: string;                  // Direct documentation reference link
  source_checked_at: string;           // ISO DateTime of last developer audit
  stale_after_days: number;            // Quota of days before profile requires re-verification
  profile_version: string;             // SemVer string for profile instructions
}
```

---

## 3. Strict Rules Against Fabrication

> [!CAUTION]
> **Zero Fabrication Policy**:
> *   **No Hardcoded Pricing**: Do not place price claims (e.g., "$0.075 / 1M tokens") directly in UI code. Pricing changes frequently and must be resolved from verified dynamic configs or excluded entirely.
> *   **No Context Window Claims**: Do not hardcode limits (e.g., "1M Context Window"). If context limits are displayed, they must be fetched from verified, audited profile rows.
> *   **No Hallucinated Capability Badges**: Do not assign hypothetical qualities (e.g., "Best for creative writing" or "100% accurate coding") unless referencing a documented, audited performance source linked in `source_url`.

---

## 4. UI Warning Guardrails

If a model profile's audit metrics indicate it is not currently verified, the front-end interface must display a prominent warning banner:

| Status | Confidence | UI Visual Treatment | Action |
| :--- | :--- | :--- | :--- |
| **`verified`** | `high` / `medium` | Clean, harmonized badge indicating verified model calibration. | Standard operation. |
| **`stale`** | Any | **Amber Banner**: "Warning: Model profile metadata was verified over X days ago and may contain outdated specifications." | Prompts developer verification review. |
| **`unverified`** | `low` | **Red Alert**: "Notice: Unverified model profile. Dynamic parameters and prompt calibrations are unverified." | Blocks usage or requires explicit user acknowledgment. |

---

## 5. Model Hallucination & Calibrations

When prompting the backend model during the analysis step, the system guidelines must include strict constraints to prevent the model from generating incorrect claims about itself:
*   Enforce that the assistant does not make statements regarding its own active API endpoints or physical hosting details.
*   Enforce that the assistant bases its improvements strictly on engineering criteria (context, roles, constraints) and references no speculative capabilities of the target model.
