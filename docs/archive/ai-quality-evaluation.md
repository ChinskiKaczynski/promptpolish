> [!WARNING]
> **Archived / Historical** — This document has been moved to archive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# AI Quality Evaluation Harness â€” PromptPolish

This documentation details the design, calibration sets, assertions, and usage instructions for the **AI Quality Evaluation Harness** built to audit prompt optimization quality in PromptPolish.

---

## 1. Overview & Purpose

The quality evaluation harness goes beyond technical JSON schema parsing to measure whether optimized prompts are actually better than original prompts, that they contain critical parameters, avoid speculative/stale claims, prevent confidentiality leaks, and maintain optimal verbosity constraints.

The harness operates by running a calibration suite of **76 prompts** spread across 11 functional files. It compiles overall performance metrics and exports reports for regressions auditing.

---

## 2. Calibration Fixtures Setup

All fixtures are stored in JSON arrays in the [**`tests/ai-fixtures/`**](file:///d:/AI/promptpolish/tests/ai-fixtures/) directory.

| Fixture File               | Count | Domain        | Working Language | Target Score | Objective / Expectations                                  |
| :------------------------- | :---: | :------------ | :--------------: | :----------: | :-------------------------------------------------------- |
| **`weak-pl.json`**         |  10   | General       |        PL        |   10 - 40    | Lack of role, context, or constraints.                    |
| **`strong-pl.json`**       |  10   | General       |        PL        |   65 - 100   | Expert role definitions, formatting rules.                |
| **`weak-en.json`**         |  10   | General       |        EN        |   10 - 40    | Conversational/vague English requests.                    |
| **`strong-en.json`**       |  10   | General       |        EN        |   75 - 100   | Detailed specifications, strict boundaries.               |
| **`coding.json`**          |   5   | Software      |      PL/EN       |    Mixed     | Tests DDL generation, formatting, code blocks.            |
| **`marketing.json`**       |   5   | Marketing     |      PL/EN       |    Mixed     | Tests brand voice, LinkedIn hooks, ads, newsletters.      |
| **`research.json`**        |   5   | Research      |      PL/EN       |    Mixed     | Tests timeframes, historical data, source checks.         |
| **`data-analysis.json`**   |   5   | Data Analysis |      PL/EN       |    Mixed     | Tests CSV/JSON inputs parsing, growth/metrics extraction. |
| **`sensitive-data.json`**  |   6   | Security      |      PL/EN       |    0 - 50    | Injects fake secrets (API keys, private keys, JWTs).      |
| **`uncertain-facts.json`** |   5   | Hallucination |      PL/EN       |   30 - 65    | Injects volatile prices, unreleased specs.                |
| **`too-long-output.json`** |   5   | Verbosity     |      PL/EN       |   10 - 60    | Triggers strict length ratio excess limits.               |

---

## 3. Fixture Categories

To make quality evaluation structured and useful for product decisions, every fixture is classified into one of the following categories:

*   **`production_case`**: Standard user interactions representing real-world queries. These prompts must achieve a 100% pass rate in production.
*   **`stress_case`**: High-load or edge-case scenarios (e.g. extremely short inputs expanding to target templates or strict output constraints). Certain stress case failures (like intentional length limit exceeded warnings) are acceptable and indicate that the validator boundaries are functioning as designed.
*   **`safety_case`**: Scans focusing on the identification and redaction of sensitive credentials, keys, or personal identifiers.
*   **`uncertainty_case`**: Evaluation vectors focusing on queries about volatile pricing, undocumented features, or dynamic APIs where hallucination warning blocks must fire.
*   **`regression_case`**: Specific historical bugs or failures captured from user interactions to prevent them from recurring in prompt templates.
*   **`calibration_case`**: Benchmarking controls used to calibrate score levels and criteria weights.

---

## 4. Schema Specifications

Every fixture follows this validated Zod schema in the evaluator:

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
  notes_for_manual_review: z.string().min(1),
  
  fixture_category: z.enum(['production_case', 'stress_case', 'regression_case', 'safety_case', 'uncertainty_case', 'calibration_case']).optional(),
  assertion_strictness: z.enum(['low', 'medium', 'high']).optional(),
  calibration_notes: z.string().optional()
})
```

---

## 5. How to Run the Evaluation

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

_(Requires `OPENROUTER_API_KEY` to be defined in your `.env.local`)_

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

_(Can be combined with `--live` to call the target model for actual responses, or run mocked for layout audits)_

---

## 6. Automated Assertions & Pass/Fail Rules

For each fixture item, the harness runs these checks:

1. **Score Calibration**: Validates that `actual_score` falls within the `expected_score_range` boundaries.
2. **Weakness Coverage**: Checks if expected weaknesses are matched conceptually in the analyzer's output using keyword concept matching, resolving brittle phrasing errors.
3. **Intent Preservation & Inclusions**: Verifies all `must_include_in_improved_prompt` strings or their verified synonyms are present in the optimized prompt.
4. **Forbidden Assertions**: Assures zero presence of forbidden claims or leaked secrets (`must_not_include` check).
5. **Length Bounds**: Asserts that `improved_prompt.length / input_prompt.length <= max_reasonable_improved_length_ratio`.
6. **Preflight Safety checks**: If `should_warn_sensitive_data` is true, asserts that the server-side detector flags the risk.
7. **Uncertainty warnings**: If `should_warn_uncertain_facts` is true, checks that the model populated the `uncertainty_warnings` array.

### What Counts as Pass/Fail
*   **Fixture Pass**: A fixture passes only if all 7 quality assertions evaluate to `true`.
*   **Fixture Fail**: If any single check evaluates to `false`, the fixture fails, and its failing assertions are recorded.
*   **Acceptable Stress Failures**: Prompts in `too-long-output.json` are purposely configured with strict length constraints (e.g., 1.2x max ratio) to verify that the verbosity check behaves correctly. Their failure under the length assertion is expected and does not count as a critical product failure.

---

## 7. Interpreting the Pass Rate & Provider Variance

### How to Interpret Overall Pass Rate
The target benchmark pass rate is **90%+** for `production_case` fixtures. An overall pass rate including stress tests will typically hover around **93%** because stress cases fail their length constraints by design. 

### Provider & Model Variance
During live runs, pass rates can vary by **10% - 20%** depending on:
*   **LLM Provider Latencies & Context Windows**: Variations in provider parameters can shift criteria ratings.
*   **Target Model Verbosity**: Different base models (e.g. DeepSeek vs GPT) have varying default conversational lengths, affecting the length ratio checks.
*   **Synonym Variation**: Although the harness uses concept-based matching, models may occasionally generate novel phrasing outside the mapped synonym dictionaries, requiring periodic calibration of keyword files.

### Provider Timeout & Transient Failures Segmentation
To ensure that transient network anomalies, provider rate limits, and request timeouts do not skew quality metric assessments, the evaluator separates failures into distinct execution buckets:
*   **`quality_failures`**: Pure prompt quality regressions (e.g. score out of range, missing required terms, forbidden claims present).
*   **`provider_failures`**: External infrastructure faults (e.g. `provider_timeout`, `provider_rate_limited`, `provider_network_error`). Provider timeout errors are identified recursively up to 5 levels deep in the error cause stack.
*   **`evaluator_failures`**: Internal execution bugs (e.g. semantic validation parsing issues or evaluator scripts inconsistencies).
*   **`stress_case_failures`**: Expected failures configured purposely under extreme constraint benchmarks (such as intentional verbosity checks).

If transient provider failures occur, the harness prints warnings describing the specific issue (e.g., `provider_timeout`) without counting them as quality constraints failures.
