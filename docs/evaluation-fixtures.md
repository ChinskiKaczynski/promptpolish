# Evaluation Fixtures & Calibration Sets — PromptPolish

To ensure that the backend scoring formula is reliable, sensitive data detection works correctly, and the LLM produces high-quality improvements, we maintain a complete calibration suite of **Evaluation Fixtures**. These fixtures form the baseline for automated regression testing and manual quality assurance.

---

## 1. Fixture Groups & Test Files

We categorize our calibration datasets into six distinct, Zod-validated JSON files located in the [tests/ai-fixtures/](file:///d:/AI/promptpolish/tests/ai-fixtures/) directory.

| Fixture File | Count | Target Language | Testing Objective | Calibration Metric |
| :--- | :---: | :---: | :--- | :--- |
| [weak-pl.json](file:///d:/AI/promptpolish/tests/ai-fixtures/weak-pl.json) | 10 | PL | Prompts lacking role, goals, context, or formatting guidelines. | Scores strictly under **40/100**. |
| [strong-pl.json](file:///d:/AI/promptpolish/tests/ai-fixtures/strong-pl.json) | 10 | PL | Expert-level prompts utilizing structured instructions, goals, and constraints. | Scores strictly above **75/100**. |
| [weak-en.json](file:///d:/AI/promptpolish/tests/ai-fixtures/weak-en.json) | 10 | EN | Conversational, highly ambiguous, or brief prompts. | Scores strictly under **40/100**. |
| [strong-en.json](file:///d:/AI/promptpolish/tests/ai-fixtures/strong-en.json) | 10 | EN | Highly specified system prompts incorporating role definitions and output schemas. | Scores strictly above **75/100**. |
| [sensitive-data.json](file:///d:/AI/promptpolish/tests/ai-fixtures/sensitive-data.json) | 5 | PL/EN | Telemetry triggers incorporating mock API keys, tokens, or private credentials. | `should_warn_sensitive_data: true`. |
| [uncertain-facts.json](file:///d:/AI/promptpolish/tests/ai-fixtures/uncertain-facts.json) | 5 | PL/EN | Prompts seeking unreferenced, dynamic, or fast-moving facts (prices, model bounds). | `should_warn_uncertain_facts: true`. |

---

## 2. Fixture JSON Schema & Validation

Every calibration fixture is programmatically validated against a strict Zod schema during the CI/CD pipeline using the test suite [fixtures-validation.test.ts](file:///d:/AI/promptpolish/tests/ai/fixtures-validation.test.ts).

### Fixture Attributes Schema
```typescript
const fixtureSchema = z.object({
  id: z.string().min(1),
  input_prompt: z.string().min(1),
  working_language: z.enum(['pl', 'en']),
  profile_slug: z.enum(['general-llm', 'google-gemini-3-5-flash']),
  expected_score_range: z.array(z.number().int().min(0).max(100)).length(2),
  expected_strengths: z.array(z.string()),
  expected_weaknesses: z.array(z.string()),
  should_warn_sensitive_data: z.boolean(),
  should_warn_uncertain_facts: z.boolean(),
  notes_for_manual_review: z.string().min(1)
})
```

---

## 3. Calibration Instructions & Usage

### Running Fixtures Schema Validation
Verify that all evaluation fixtures parse correctly and conform to the schema:
```bash
pnpm test fixtures-validation
```

### Running scoring evaluations against fixtures
To run local quality regression audits, you can import these JSON fixtures directly into your test loops:
1. Load a fixture (e.g. `weak-pl.json`).
2. Dispatch the `input_prompt` to the backend scoring pipeline.
3. Assert that the calculated `overallScore` falls within the `expected_score_range` array:
   ```typescript
   expect(score.overallScore).toBeGreaterThanOrEqual(fixture.expected_score_range[0])
   expect(score.overallScore).toBeLessThanOrEqual(fixture.expected_score_range[1])
   ```
4. Verify that safety block triggers on `sensitive-data.json` matches `should_warn_sensitive_data`.
5. Verify that uncertainty annotations trigger on `uncertain-facts.json` matches `should_warn_uncertain_facts`.
