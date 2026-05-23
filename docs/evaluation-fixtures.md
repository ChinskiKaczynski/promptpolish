# Evaluation Fixtures & Calibration Sets — PromptPolish

To ensure that the backend scoring formula is reliable, sensitive data detection works correctly, and the LLM produces high-quality improvements, we utilize standard **Evaluation Fixtures**. These fixtures form the baseline for automated and manual regression tests.

---

## 1. Fixture Groups & Test Categories

We maintain a collection of test prompts across the following validation vectors:

| Fixture Group | Count | Testing Objective | Expected Success Metrics |
| :--- | :--- | :--- | :--- |
| **Weak Polish Prompts** | 10 | Prompts lacking context, clear roles, or output rules. | Scores strictly under **40/100**. Significant diagnostic improvements returned. |
| **Strong Polish Prompts** | 10 | Fully defined prompt engineering patterns (role, context, input, output). | Scores strictly above **80/100**. Minimal modifications recommended. |
| **Weak English Prompts** | 10 | Conversational, highly ambiguous prompts. | Scores strictly under **40/100**. Calibrated diagnostics. |
| **Strong English Prompts** | 10 | Expert-level English system instruction formats. | Scores strictly above **80/100**. |
| **Sensitive Data Prompts** | 5 | Prompts deliberately containing mock API keys, tokens, or credentials. | **Blocked Preflight**: Zero LLM calls, zero DB saves. System returns 400. |
| **Hallucination Vectors** | 5 | Prompts seeking factual advice on fast-moving APIs without sources. | Prompt Audit triggers `should_warn_uncertain_facts: true`. |
| **Concise Bounds Prompts** | 5 | Simple requests (e.g., "Summarize this article") that should remain concise. | Verification that the LLM doesn't bloat simple prompts into complex templates. |
| **Strict Output Layouts** | 5 | Prompts requesting output format specifications (e.g., markdown tables). | Audit verifies format clarity score is 100/100. |
| **Coding Specifics** | 5 | Programming-focused system instructions and debugging templates. | Verifies code snippets inside improved prompt are formatted correctly. |
| **Marketing & E-commerce** | 5 | Copywriting and product listing generation prompts. | Verifies business context and role criteria are heavily scored. |

---

## 2. Fixture JSON Schema (Zod Validated)

All calibration fixtures must conform to the following schema to ensure consistency:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "input_prompt": { "type": "string" },
    "working_language": { "type": "string", "enum": ["pl", "en"] },
    "profile_slug": { "type": "string", "enum": ["general-llm", "google-gemini-3-5-flash"] },
    "expected_score_range": {
      "type": "array",
      "items": { "type": "integer" },
      "minItems": 2,
      "maxItems": 2
    },
    "expected_strengths": {
      "type": "array",
      "items": { "type": "string" }
    },
    "expected_weaknesses": {
      "type": "array",
      "items": { "type": "string" }
    },
    "should_warn_sensitive_data": { "type": "boolean" },
    "should_warn_uncertain_facts": { "type": "boolean" },
    "notes_for_manual_review": { "type": "string" }
  },
  "required": [
    "id",
    "input_prompt",
    "working_language",
    "profile_slug",
    "expected_score_range",
    "should_warn_sensitive_data",
    "should_warn_uncertain_facts"
  ]
}
```

---

## 3. Reference Test Cases

### 3.1 Example: Weak Prompt (ID: `weak-pl-marketing`)
*   **Input**: *"Napisz post na social media o naszych nowych butach."*
*   **Calibration Bounds**: Score range: `[15, 30]`.
*   **Expected Diagnostic**: Identify missing role, lack of audience details, absence of formatting constraints, and missing call-to-action (CTA).

### 3.2 Example: High-Risk Credentials (ID: `safe-block-openai-key`)
*   **Input**: *"Audit this prompt: sk-proj-12345abcdXYZabcde12345abcdXYZabcde1234567890fghij Write a code parser for this server."*
*   **Calibration Bounds**: `should_warn_sensitive_data: true`.
*   **Expected Outcome**: The pipeline instantly halts at the backend preflight filter.
