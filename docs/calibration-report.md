# Primary/Fallback Score Calibration Report

This document records the observed calibration runs for the prompt optimization engine fallback pairing.

> [!NOTE]
> These results represent specific observed calibration runs under non-deterministic LLM generations. They are not permanent benchmarks, but serve as empirical evidence for fallback model suitability.

---

## 1. Executive Summary

We evaluated `openai/gpt-4o-mini` as a candidate transparent fallback for `deepseek/deepseek-v4-flash`. Based on two independent calibration runs over a 10-prompt test fixture suite, **`openai/gpt-4o-mini` has been rejected** as a transparent fallback.

Both runs failed to meet the target acceptance thresholds:
* **Median Absolute Difference**: target `<= 10`, observed `14.00` - `14.50` (**FAIL**)
* **Maximum Absolute Difference**: target `<= 20`, observed `27.00` - `30.00` (**FAIL**)
* **Recommendation Overlap**: target high, observed `7.8%` - `8.0%` (**FAIL**)

As a result, transparent provider fallback to `openai/gpt-4o-mini` is disabled in production settings (the `OPENROUTER_FALLBACK_MODEL_ID` remains unset).

---

## 2. Calibration Runs Summary

We resolved the conflicting calibration values by verifying both historical runs. The variance is due to the non-deterministic nature of model generation.

### Run 1 (Initial Release Gate Run)
* **Timestamp**: June 14, 2026
* **Primary Model**: `deepseek/deepseek-v4-flash`
* **Fallback Model**: `openai/gpt-4o-mini`
* **Analysis Schema Version**: `1.0.0`
* **Scoring Version**: `1.0.0`
* **Prompt Template Version**: `1.0.0`
* **Acceptance Thresholds**: Median Diff `<= 10`, Max Diff `<= 20`
* **Conclusion**: **FAIL** (High scoring divergence and low recommendation overlap)

#### Run 1 Aggregated Stats
| Metric | Value | Threshold | Pass/Fail |
|---|---|---|---|
| **Median Absolute Difference** | 14.50 | <= 10 | **FAIL** |
| **Maximum Absolute Difference** | 27.00 | <= 20 | **FAIL** |
| **Avg Recommendation Overlap** | 8.0% | - | - |
| **Intent Preservation Rate** | 100.0% | - | - |
| **Usefulness Rate** | 100.0% | - | - |

---

### Run 2 (Saved Run Results)
* **Timestamp**: June 14, 2026
* **Primary Model**: `deepseek/deepseek-v4-flash`
* **Fallback Model**: `openai/gpt-4o-mini`
* **Analysis Schema Version**: `1.0.0`
* **Scoring Version**: `1.0.0`
* **Prompt Template Version**: `1.0.0`
* **Acceptance Thresholds**: Median Diff `<= 10`, Max Diff `<= 20`
* **Conclusion**: **FAIL**

#### Run 2 Aggregated Stats
| Metric | Value | Threshold | Pass/Fail |
|---|---|---|---|
| **Mean Absolute Difference** | 13.90 | - | - |
| **Median Absolute Difference** | 14.00 | <= 10 | **FAIL** |
| **Maximum Absolute Difference** | 30.00 | <= 20 | **FAIL** |
| **Avg Recommendation Overlap** | 7.8% | - | - |
| **Intent Preservation Rate** | 100.0% | - | - |
| **Usefulness Rate** | 100.0% | - | - |

#### Run 2 Prompt-by-Prompt Results Table
| Fixture ID / Category | Primary Score | Fallback Score | Absolute Diff | Overlap % | Intent Preserved | Usefulness |
|---|---|---|---|---|---|---|
| **P1** (Weak universal prompt) | 27 | 37 | 10 | 0% | pass | pass |
| **P2** (Strong universal prompt) | 58 | 74 | 16 | 0% | pass | pass |
| **P3** (SEO/content) | 48 | 67 | 19 | 0% | pass | pass |
| **P4** (Coding) | 56 | 67 | 11 | 0% | pass | pass |
| **P5** (Data analysis) | 64 | 67 | 3 | 33% | pass | pass |
| **P6** (Research) | 49 | 66 | 17 | 20% | pass | pass |
| **P7** (Marketing/sales) | 44 | 74 | 30 | 0% | pass | pass |
| **P8** (Agent/workflow) | 43 | 57 | 14 | 25% | pass | pass |
| **P9** (Strict output format) | 61 | 75 | 14 | 0% | pass | pass |
| **P10** (Constraints and quality criteria) | 69 | 74 | 5 | 0% | pass | pass |
