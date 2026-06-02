# AI Quality Evaluation Harness — PromptPolish

This documentation details the design, calibration sets, assertions, and usage instructions for the **AI Quality Evaluation Harness** built to audit prompt optimization quality in PromptPolish.

---

## 1. Overview & Purpose

The quality evaluation harness goes beyond technical JSON schema parsing to measure whether optimized prompts are actually better than original prompts, that they contain critical parameters, avoid speculative/stale claims, prevent confidentiality leaks, and maintain optimal verbosity constraints.

The harness operates by running a calibration suite of **61 prompts** spread across 11 functional files. It compiles overall performance metrics and exports reports for regressions auditing.

---

## 2. Calibration Fixtures Setup

All fixtures are stored in JSON arrays in the [**`tests/ai-fixtures/`**](file:///d:/AI/promptpolish/tests/ai-fixtures/) directory.

| Fixture File | Count | Domain | Working Language | Target Score | Objective / Expectations |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **`weak-pl.json`** | 10 | General | PL | 10 - 40 | Lack of role, context, or constraints. |
| **`strong-pl.json`** | 10 | General | PL | 80 - 100 | Expert role definitions, formatting rules. |
| **`weak-en.json`** | 10 | General | EN | 10 - 40 | Conversational/vague English requests. |
| **`strong-en.json`** | 10 | General | EN | 80 - 100 | Detailed specifications, strict boundaries. |
| **`coding.json`** | 5 | Software | PL/EN | Mixed | Tests DDL generation, formatting, code blocks. |
| **`marketing.json`** | 5 | Marketing | PL/EN | Mixed | Tests brand voice, LinkedIn hooks, ads, newsletters. |
| **`research.json`** | 5 | Research | PL/EN | Mixed | Tests timeframes, historical data, source checks. |
| **`data-analysis.json`** | 5 | Data Analysis | PL/EN | Mixed | Tests CSV/JSON inputs parsing, growth/metrics extraction. |
| **`sensitive-data.json`** | 6 | Security | PL/EN | 0 - 50 | Injects fake secrets (API keys, private keys, JWTs). |
| **`uncertain-facts.json`** | 5 | Hallucination | PL/EN | 30 - 65 | Injects volatile prices, unreleased specs. |
| **`too-long-output.json`** | 5 | Verbosity | PL/EN | 10 - 60 | Triggers strict length ratio excess limits. |

---

## 3. Schema Specifications

Every fixture must strictly follow this Zod schema:
```typescript
const fixtureSchema = z.object({
  id: z.string().min(1),
  input_prompt: z.string().min(1),
  working_language: z.enum(['pl', 'en']),
  profile_slug: z.enum(['general-llm', 'openrouter-deepseek-v4-flash']),
  task_type: z.string().min(1),
  expected_score_range: z.array(z.number().int().min(0).max(100)).length(2),
  expected_strengths: z.array(z.string()).optional(),
  expected_weaknesses: z.array(z.string()),
  must_include_in_improved_prompt: z.array(z.string()),
  must_not_include: z.array(z.string()),
  should_warn_sensitive_data: z.boolean(),
  should_warn_uncertain_facts: z.boolean(),
  max_reasonable_improved_length_ratio: z.number().positive(),
  notes_for_manual_review: z.string().min(1)
})
```

---

## 4. How to Run the Evaluation

Use the `tsx` compiler utility to execute the evaluation script from the root workspace directory:

### A. Default Mock Mode (Safe & Free)
Runs local simulation to test verification logic and assertions without hitting external APIs:
```bash
npx tsx scripts/eval-prompt-quality.ts
```

### B. Live OpenRouter mode
Sends requests to the configured target OpenRouter LLM:
```bash
npx tsx scripts/eval-prompt-quality.ts --live
```
*(Requires `OPENROUTER_API_KEY` to be defined in your `.env.local`)*

### C. Limited Run Live Evaluation
Executes only a subset (e.g. first 2) of fixtures in each category to save execution cost:
```bash
npx tsx scripts/eval-prompt-quality.ts --live --limit 2
```

### D. Pairwise A/B blind evaluation
Generates answers for both original and optimized prompts to display side-by-side:
```bash
npx tsx scripts/eval-prompt-quality.ts --pairwise
```
*(Can be combined with `--live` to call the target model for actual responses, or run mocked for layout audits)*

---

## 5. Automated Assertions

For each fixture item, the harness runs these checks:
1. **Score Calibration**: Validates that `actual_score` falls within the `expected_score_range` boundaries.
2. **Weakness Coverage**: Checks if expected weaknesses are matched in the analyzer's output (`top_weaknesses` or criteria rationales).
3. **Intent Preservation & Inclusions**: Verifies all `must_include_in_improved_prompt` strings are present in the optimized prompt.
4. **Forbidden Assertions**: Assures zero presence of forbidden claims or leaked secrets (`must_not_include` check).
5. **Length Bounds**: Asserts that `improved_prompt.length / input_prompt.length <= max_reasonable_improved_length_ratio`.
6. **Preflight Safety checks**: If `should_warn_sensitive_data` is true, asserts that the server-side detector flags the risk.
7. **Uncertainty warnings**: If `should_warn_uncertain_facts` is true, checks that the model populated the `uncertainty_warnings` array.

---

## 6. Aggregate Metrics Output

The harness compiles these metrics and writes results:
* **JSON Output**: [**`reports/ai-eval-latest.json`**](file:///d:/AI/promptpolish/reports/ai-eval-latest.json)
* **Markdown Summary**: [**`reports/ai-eval-latest.md`**](file:///d:/AI/promptpolish/reports/ai-eval-latest.md)

### Key Metrics Defined:
* **`fixture_pass_rate`**: Percentage of fixtures that met every quality assertion.
* **`score_range_pass_rate`**: Score calibration compliance.
* **`weakness_detection_rate`**: Rate of correctly diagnosed prompt defects.
* **`required_inclusion_rate`**: Inclusion of requested terminology in improved output.
* **`forbidden_claim_rate`**: Protection rate against unverified data/secrets leakage.
* **`too_long_rate`**: Verbosity excess rate.
* **`sensitive_data_pass_rate`**: Safe filtering of API/cryptographic keys.
* **`uncertainty_warning_pass_rate`**: Flagging rate for volatile facts.
