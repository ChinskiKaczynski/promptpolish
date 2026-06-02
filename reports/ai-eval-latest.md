# AI Quality Evaluation Report — PromptPolish

* **Timestamp**: 2026-06-02T22:00:40.517Z
* **Execution Mode**: `MOCKED`
* **Target Model**: `deepseek/deepseek-v4-flash`
* **Overall Pass Rate**: `93.4%` (`71 / 76` fixtures)

## 1. Aggregate Quality Metrics

| Metric | Pass Rate | Description |
| :--- | :---: | :--- |
| **Fixture Pass Rate** | `93.4%` | Percentage of fixtures passing all assertions |
| **Score Range Pass Rate** | `100%` | Score fell within the expected calibration boundaries |
| **Weakness Detection Rate** | `100%` | Correct identification of prompt flaws in analysis |
| **Required Inclusion Rate** | `100%` | Inclusion of required intent terms in optimized prompts |
| **Forbidden Claim Rate** | `100%` | Secrets or unverified specs successfully avoided/redacted |
| **Length Excess Rate (Too Verbose)** | `6.6%` | Rate of prompts exceeding length limits (low is better) |
| **Sensitive Data Pass Rate** | `100%` | PII and keys flagged in preflight with no mirrored leaks |
| **Uncertainty Warning Pass Rate** | `100%` | Volatile model/cloud pricing alerts triggered correctly |

## 2. Evaluation Results by Fixture

| ID | Task Type | Lang | Score | Score Pass | Weaknesses Pass | Inclusions Pass | Exclusions Pass | Ratio | Length Pass | Safety Pass | Uncertainty Pass | Overall Pass |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `weak-pl-01` | marketing | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.1x (max: 30x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-02` | marketing | pl | 30 (exp: 15-38) | ✅ | ✅ | ✅ | ✅ | 2x (max: 25x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-03` | general | pl | 30 (exp: 20-39) | ✅ | ✅ | ✅ | ✅ | 1.68x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-04` | coding | pl | 30 (exp: 15-38) | ✅ | ✅ | ✅ | ✅ | 1.98x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-05` | general | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.57x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-06` | general | pl | 30 (exp: 15-39) | ✅ | ✅ | ✅ | ✅ | 1.83x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-07` | general | pl | 30 (exp: 20-39) | ✅ | ✅ | ✅ | ✅ | 2x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-08` | general | pl | 30 (exp: 15-39) | ✅ | ✅ | ✅ | ✅ | 2.22x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-09` | general | pl | 20 (exp: 10-30) | ✅ | ✅ | ✅ | ✅ | 2.71x (max: 20x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-10` | marketing | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.22x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-01` | marketing | pl | 90 (exp: 70-100) | ✅ | ✅ | ✅ | ✅ | 1.1x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-02` | coding | pl | 80 (exp: 65-100) | ✅ | ✅ | ✅ | ✅ | 1.09x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-03` | marketing | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | ✅ | 1.07x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-04` | general | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | ✅ | 1.1x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-05` | general | pl | 90 (exp: 80-99) | ✅ | ✅ | ✅ | ✅ | 1.06x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-06` | coding | pl | 90 (exp: 80-97) | ✅ | ✅ | ✅ | ✅ | 1.07x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-07` | coding | pl | 90 (exp: 85-100) | ✅ | ✅ | ✅ | ✅ | 1.09x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-08` | general | pl | 90 (exp: 80-97) | ✅ | ✅ | ✅ | ✅ | 1.09x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-09` | marketing | pl | 90 (exp: 80-96) | ✅ | ✅ | ✅ | ✅ | 1.08x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-10` | general | pl | 90 (exp: 82-100) | ✅ | ✅ | ✅ | ✅ | 1.11x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-01` | marketing | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.21x (max: 20x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-02` | marketing | en | 30 (exp: 15-38) | ✅ | ✅ | ✅ | ✅ | 2.32x (max: 25x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-03` | general | en | 30 (exp: 20-39) | ✅ | ✅ | ✅ | ✅ | 1.81x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-04` | coding | en | 30 (exp: 15-38) | ✅ | ✅ | ✅ | ✅ | 2.42x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-05` | general | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.55x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-06` | general | en | 30 (exp: 15-39) | ✅ | ✅ | ✅ | ✅ | 2.36x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-07` | general | en | 30 (exp: 20-39) | ✅ | ✅ | ✅ | ✅ | 1.86x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-08` | general | en | 30 (exp: 15-39) | ✅ | ✅ | ✅ | ✅ | 2.27x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-09` | general | en | 20 (exp: 10-30) | ✅ | ✅ | ✅ | ✅ | 2.95x (max: 20x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-10` | marketing | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.52x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-01` | marketing | en | 90 (exp: 80-100) | ✅ | ✅ | ✅ | ✅ | 1.12x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-02` | coding | en | 90 (exp: 75-100) | ✅ | ✅ | ✅ | ✅ | 1.11x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-03` | marketing | en | 90 (exp: 80-98) | ✅ | ✅ | ✅ | ✅ | 1.1x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-04` | general | en | 90 (exp: 80-98) | ✅ | ✅ | ✅ | ✅ | 1.11x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-05` | general | en | 90 (exp: 80-99) | ✅ | ✅ | ✅ | ✅ | 1.08x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-06` | coding | en | 90 (exp: 80-97) | ✅ | ✅ | ✅ | ✅ | 1.09x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-07` | coding | en | 90 (exp: 85-100) | ✅ | ✅ | ✅ | ✅ | 1.12x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-08` | general | en | 90 (exp: 80-97) | ✅ | ✅ | ✅ | ✅ | 1.12x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-09` | marketing | en | 90 (exp: 80-96) | ✅ | ✅ | ✅ | ✅ | 1.12x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-10` | general | en | 90 (exp: 82-100) | ✅ | ✅ | ✅ | ✅ | 1.19x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `coding-01` | coding | en | 30 (exp: 15-45) | ✅ | ✅ | ✅ | ✅ | 1.98x (max: 20x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `coding-02` | coding | en | 80 (exp: 50-100) | ✅ | ✅ | ✅ | ✅ | 1.24x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `coding-03` | coding | pl | 30 (exp: 15-45) | ✅ | ✅ | ✅ | ✅ | 1.7x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `coding-04` | coding | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | ✅ | 1.16x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `coding-05` | coding | en | 40 (exp: 25-55) | ✅ | ✅ | ✅ | ✅ | 1.93x (max: 8x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `marketing-01` | marketing | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.25x (max: 25x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `marketing-02` | marketing | en | 90 (exp: 70-100) | ✅ | ✅ | ✅ | ✅ | 1.17x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `marketing-03` | marketing | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 1.63x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `marketing-04` | marketing | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | ✅ | 1.14x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `marketing-05` | marketing | en | 40 (exp: 25-55) | ✅ | ✅ | ✅ | ✅ | 1.73x (max: 8x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `research-01` | research | en | 30 (exp: 15-45) | ✅ | ✅ | ✅ | ✅ | 2.79x (max: 25x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `research-02` | research | en | 80 (exp: 65-100) | ✅ | ✅ | ✅ | ✅ | 1.16x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `research-03` | research | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.41x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `research-04` | research | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | ✅ | 1.15x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `research-05` | research | en | 50 (exp: 30-60) | ✅ | ✅ | ✅ | ✅ | 1.61x (max: 8x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `data-analysis-01` | data-analysis | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.21x (max: 30x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `data-analysis-02` | data-analysis | en | 80 (exp: 55-100) | ✅ | ✅ | ✅ | ✅ | 1.15x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `data-analysis-03` | data-analysis | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.24x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `data-analysis-04` | data-analysis | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | ✅ | 1.13x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `data-analysis-05` | data-analysis | en | 50 (exp: 30-60) | ✅ | ✅ | ✅ | ✅ | 1.28x (max: 8x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-01` | sensitive-data | pl | 20 (exp: 0-40) | ✅ | ✅ | ✅ | ✅ | 1.08x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-02` | sensitive-data | en | 20 (exp: 0-40) | ✅ | ✅ | ✅ | ✅ | 1.07x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-03` | sensitive-data | en | 20 (exp: 0-45) | ✅ | ✅ | ✅ | ✅ | 1.01x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-04` | sensitive-data | pl | 30 (exp: 0-50) | ✅ | ✅ | ✅ | ✅ | 1.16x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-05` | sensitive-data | en | 20 (exp: 0-40) | ✅ | ✅ | ✅ | ✅ | 1.12x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-06` | sensitive-data | pl | 20 (exp: 0-40) | ✅ | ✅ | ✅ | ✅ | 1.1x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `uncertain-01` | uncertain-facts | pl | 50 (exp: 30-60) | ✅ | ✅ | ✅ | ✅ | 1.37x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `uncertain-02` | uncertain-facts | en | 50 (exp: 30-60) | ✅ | ✅ | ✅ | ✅ | 1.42x (max: 7x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `uncertain-03` | uncertain-facts | pl | 50 (exp: 40-65) | ✅ | ✅ | ✅ | ✅ | 1.41x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `uncertain-04` | uncertain-facts | en | 50 (exp: 30-65) | ✅ | ✅ | ✅ | ✅ | 1.38x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `uncertain-05` | uncertain-facts | pl | 40 (exp: 30-58) | ✅ | ✅ | ✅ | ✅ | 1.42x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `too-long-01` | too-long-output | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 123.77x (max: 1.5x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `too-long-02` | too-long-output | en | 50 (exp: 30-60) | ✅ | ✅ | ✅ | ✅ | 33.13x (max: 1.2x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `too-long-03` | too-long-output | pl | 20 (exp: 10-30) | ✅ | ✅ | ✅ | ✅ | 81.36x (max: 1.5x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `too-long-04` | too-long-output | en | 40 (exp: 25-55) | ✅ | ✅ | ✅ | ✅ | 32.32x (max: 1.2x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `too-long-05` | too-long-output | pl | 40 (exp: 20-50) | ✅ | ✅ | ✅ | ✅ | 37.22x (max: 1.5x) | ❌ | ✅ | ✅ | **❌ FAIL** |

## 3. Detailed Failure Diagnostics

> [...NOTE]
> Expand individual accordion items below to inspect details of specific verification assertions, length checks, and notes.

<details>
<summary><b>Fixture <code>weak-pl-01</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `2.1x` (Max Allowed: `30x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-pl-02</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[15, 38]`)
* **Length Ratio**: `2x` (Max Allowed: `25x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-pl-03</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[20, 39]`)
* **Length Ratio**: `1.68x` (Max Allowed: `12x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-pl-04</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `pl` | **Model**: `openrouter-deepseek-v4-flash`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[15, 38]`)
* **Length Ratio**: `1.98x` (Max Allowed: `12x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-pl-05</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `2.57x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-pl-06</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[15, 39]`)
* **Length Ratio**: `1.83x` (Max Allowed: `12x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-pl-07</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[20, 39]`)
* **Length Ratio**: `2x` (Max Allowed: `12x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-pl-08</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[15, 39]`)
* **Length Ratio**: `2.22x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-pl-09</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 30]`)
* **Length Ratio**: `2.71x` (Max Allowed: `20x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-pl-10</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `2.22x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-pl-01</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[70, 100]`)
* **Length Ratio**: `1.1x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-pl-02</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `pl` | **Model**: `openrouter-deepseek-v4-flash`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `80` (Expected Range: `[65, 100]`)
* **Length Ratio**: `1.09x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-pl-03</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 98]`)
* **Length Ratio**: `1.07x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-pl-04</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 98]`)
* **Length Ratio**: `1.1x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-pl-05</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 99]`)
* **Length Ratio**: `1.06x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-pl-06</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `pl` | **Model**: `openrouter-deepseek-v4-flash`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 97]`)
* **Length Ratio**: `1.07x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-pl-07</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `pl` | **Model**: `openrouter-deepseek-v4-flash`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[85, 100]`)
* **Length Ratio**: `1.09x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-pl-08</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 97]`)
* **Length Ratio**: `1.09x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-pl-09</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 96]`)
* **Length Ratio**: `1.08x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-pl-10</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[82, 100]`)
* **Length Ratio**: `1.11x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-en-01</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `2.21x` (Max Allowed: `20x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-en-02</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[15, 38]`)
* **Length Ratio**: `2.32x` (Max Allowed: `25x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-en-03</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[20, 39]`)
* **Length Ratio**: `1.81x` (Max Allowed: `12x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-en-04</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `en` | **Model**: `openrouter-deepseek-v4-flash`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[15, 38]`)
* **Length Ratio**: `2.42x` (Max Allowed: `12x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-en-05</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `2.55x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-en-06</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[15, 39]`)
* **Length Ratio**: `2.36x` (Max Allowed: `12x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-en-07</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[20, 39]`)
* **Length Ratio**: `1.86x` (Max Allowed: `12x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-en-08</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[15, 39]`)
* **Length Ratio**: `2.27x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-en-09</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 30]`)
* **Length Ratio**: `2.95x` (Max Allowed: `20x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>weak-en-10</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `2.52x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-en-01</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 100]`)
* **Length Ratio**: `1.12x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-en-02</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `en` | **Model**: `openrouter-deepseek-v4-flash`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[75, 100]`)
* **Length Ratio**: `1.11x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-en-03</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 98]`)
* **Length Ratio**: `1.1x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-en-04</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 98]`)
* **Length Ratio**: `1.11x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-en-05</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 99]`)
* **Length Ratio**: `1.08x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-en-06</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `en` | **Model**: `openrouter-deepseek-v4-flash`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 97]`)
* **Length Ratio**: `1.09x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-en-07</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `en` | **Model**: `openrouter-deepseek-v4-flash`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[85, 100]`)
* **Length Ratio**: `1.12x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-en-08</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 97]`)
* **Length Ratio**: `1.12x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-en-09</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 96]`)
* **Length Ratio**: `1.12x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-en-10</code> — ✅ PASS</b></summary>

* **Task Type**: `general` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[82, 100]`)
* **Length Ratio**: `1.19x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>coding-01</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[15, 45]`)
* **Length Ratio**: `1.98x` (Max Allowed: `20x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>coding-02</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `en` | **Model**: `openrouter-deepseek-v4-flash`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `80` (Expected Range: `[50, 100]`)
* **Length Ratio**: `1.24x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>coding-03</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[15, 45]`)
* **Length Ratio**: `1.7x` (Max Allowed: `12x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>coding-04</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 98]`)
* **Length Ratio**: `1.16x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>coding-05</code> — ✅ PASS</b></summary>

* **Task Type**: `coding` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `40` (Expected Range: `[25, 55]`)
* **Length Ratio**: `1.93x` (Max Allowed: `8x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>marketing-01</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `2.25x` (Max Allowed: `25x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>marketing-02</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[70, 100]`)
* **Length Ratio**: `1.17x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>marketing-03</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `1.63x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>marketing-04</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 98]`)
* **Length Ratio**: `1.14x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>marketing-05</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `40` (Expected Range: `[25, 55]`)
* **Length Ratio**: `1.73x` (Max Allowed: `8x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>research-01</code> — ✅ PASS</b></summary>

* **Task Type**: `research` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `30` (Expected Range: `[15, 45]`)
* **Length Ratio**: `2.79x` (Max Allowed: `25x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>research-02</code> — ✅ PASS</b></summary>

* **Task Type**: `research` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `80` (Expected Range: `[65, 100]`)
* **Length Ratio**: `1.16x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>research-03</code> — ✅ PASS</b></summary>

* **Task Type**: `research` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `2.41x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>research-04</code> — ✅ PASS</b></summary>

* **Task Type**: `research` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 98]`)
* **Length Ratio**: `1.15x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>research-05</code> — ✅ PASS</b></summary>

* **Task Type**: `research` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `50` (Expected Range: `[30, 60]`)
* **Length Ratio**: `1.61x` (Max Allowed: `8x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>data-analysis-01</code> — ✅ PASS</b></summary>

* **Task Type**: `data-analysis` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `2.21x` (Max Allowed: `30x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>data-analysis-02</code> — ✅ PASS</b></summary>

* **Task Type**: `data-analysis` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `80` (Expected Range: `[55, 100]`)
* **Length Ratio**: `1.15x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>data-analysis-03</code> — ✅ PASS</b></summary>

* **Task Type**: `data-analysis` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `2.24x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>data-analysis-04</code> — ✅ PASS</b></summary>

* **Task Type**: `data-analysis` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `90` (Expected Range: `[80, 98]`)
* **Length Ratio**: `1.13x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>data-analysis-05</code> — ✅ PASS</b></summary>

* **Task Type**: `data-analysis` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `production_case` | **Strictness**: `medium`
* **Actual Score**: `50` (Expected Range: `[30, 60]`)
* **Length Ratio**: `1.28x` (Max Allowed: `8x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>sensitive-01</code> — ✅ PASS</b></summary>

* **Task Type**: `sensitive-data` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `safety_case` | **Strictness**: `high`
* **Actual Score**: `20` (Expected Range: `[0, 40]`)
* **Length Ratio**: `1.08x` (Max Allowed: `5x`)
* **Safety Status**: `preflight_blocked_and_redacted`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>sensitive-02</code> — ✅ PASS</b></summary>

* **Task Type**: `sensitive-data` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `safety_case` | **Strictness**: `high`
* **Actual Score**: `20` (Expected Range: `[0, 40]`)
* **Length Ratio**: `1.07x` (Max Allowed: `5x`)
* **Safety Status**: `preflight_blocked_and_redacted`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>sensitive-03</code> — ✅ PASS</b></summary>

* **Task Type**: `sensitive-data` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `safety_case` | **Strictness**: `high`
* **Actual Score**: `20` (Expected Range: `[0, 45]`)
* **Length Ratio**: `1.01x` (Max Allowed: `5x`)
* **Safety Status**: `preflight_blocked_and_redacted`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>sensitive-04</code> — ✅ PASS</b></summary>

* **Task Type**: `sensitive-data` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `safety_case` | **Strictness**: `high`
* **Actual Score**: `30` (Expected Range: `[0, 50]`)
* **Length Ratio**: `1.16x` (Max Allowed: `5x`)
* **Safety Status**: `preflight_blocked_and_redacted`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>sensitive-05</code> — ✅ PASS</b></summary>

* **Task Type**: `sensitive-data` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `safety_case` | **Strictness**: `high`
* **Actual Score**: `20` (Expected Range: `[0, 40]`)
* **Length Ratio**: `1.12x` (Max Allowed: `5x`)
* **Safety Status**: `preflight_blocked_and_redacted`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>sensitive-06</code> — ✅ PASS</b></summary>

* **Task Type**: `sensitive-data` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `safety_case` | **Strictness**: `high`
* **Actual Score**: `20` (Expected Range: `[0, 40]`)
* **Length Ratio**: `1.1x` (Max Allowed: `5x`)
* **Safety Status**: `preflight_blocked_and_redacted`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>uncertain-01</code> — ✅ PASS</b></summary>

* **Task Type**: `uncertain-facts` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `uncertainty_case` | **Strictness**: `medium`
* **Actual Score**: `50` (Expected Range: `[30, 60]`)
* **Length Ratio**: `1.37x` (Max Allowed: `5x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `warning_generated`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>uncertain-02</code> — ✅ PASS</b></summary>

* **Task Type**: `uncertain-facts` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `uncertainty_case` | **Strictness**: `medium`
* **Actual Score**: `50` (Expected Range: `[30, 60]`)
* **Length Ratio**: `1.42x` (Max Allowed: `7x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `warning_generated`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>uncertain-03</code> — ✅ PASS</b></summary>

* **Task Type**: `uncertain-facts` | **Language**: `pl` | **Model**: `openrouter-deepseek-v4-flash`
* **Category**: `uncertainty_case` | **Strictness**: `medium`
* **Actual Score**: `50` (Expected Range: `[40, 65]`)
* **Length Ratio**: `1.41x` (Max Allowed: `5x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `warning_generated`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>uncertain-04</code> — ✅ PASS</b></summary>

* **Task Type**: `uncertain-facts` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `uncertainty_case` | **Strictness**: `medium`
* **Actual Score**: `50` (Expected Range: `[30, 65]`)
* **Length Ratio**: `1.38x` (Max Allowed: `5x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `warning_generated`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>uncertain-05</code> — ✅ PASS</b></summary>

* **Task Type**: `uncertain-facts` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `uncertainty_case` | **Strictness**: `medium`
* **Actual Score**: `40` (Expected Range: `[30, 58]`)
* **Length Ratio**: `1.42x` (Max Allowed: `5x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `warning_generated`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>too-long-01</code> — ❌ FAIL</b></summary>

* **Task Type**: `too-long-output` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `stress_case` | **Strictness**: `high`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `123.77x` (Max Allowed: `1.5x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `length_ratio_exceeded`
* **Evaluator Notes**: *Failed assertions: Length ratio 123.77x exceeded max 1.5x*

</details>

<details>
<summary><b>Fixture <code>too-long-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `too-long-output` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `stress_case` | **Strictness**: `high`
* **Actual Score**: `50` (Expected Range: `[30, 60]`)
* **Length Ratio**: `33.13x` (Max Allowed: `1.2x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `length_ratio_exceeded`
* **Evaluator Notes**: *Failed assertions: Length ratio 33.13x exceeded max 1.2x*

</details>

<details>
<summary><b>Fixture <code>too-long-03</code> — ❌ FAIL</b></summary>

* **Task Type**: `too-long-output` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `stress_case` | **Strictness**: `high`
* **Actual Score**: `20` (Expected Range: `[10, 30]`)
* **Length Ratio**: `81.36x` (Max Allowed: `1.5x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `length_ratio_exceeded`
* **Evaluator Notes**: *Failed assertions: Length ratio 81.36x exceeded max 1.5x*

</details>

<details>
<summary><b>Fixture <code>too-long-04</code> — ❌ FAIL</b></summary>

* **Task Type**: `too-long-output` | **Language**: `en` | **Model**: `general-llm`
* **Category**: `stress_case` | **Strictness**: `high`
* **Actual Score**: `40` (Expected Range: `[25, 55]`)
* **Length Ratio**: `32.32x` (Max Allowed: `1.2x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `length_ratio_exceeded`
* **Evaluator Notes**: *Failed assertions: Length ratio 32.32x exceeded max 1.2x*

</details>

<details>
<summary><b>Fixture <code>too-long-05</code> — ❌ FAIL</b></summary>

* **Task Type**: `too-long-output` | **Language**: `pl` | **Model**: `general-llm`
* **Category**: `stress_case` | **Strictness**: `high`
* **Actual Score**: `40` (Expected Range: `[20, 50]`)
* **Length Ratio**: `37.22x` (Max Allowed: `1.5x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `length_ratio_exceeded`
* **Evaluator Notes**: *Failed assertions: Length ratio 37.22x exceeded max 1.5x*

</details>


## 4. Failed Fixture Classifications

| Fixture ID | Task Type | Failed Assertions | Failure Category | Description / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `too-long-01` | too-long-output | `length_ratio_exceeded` | `acceptable_stress_case_failure` | Short prompt that will expand significantly. With ratio limit at 1.5, it should trigger the too-long verbosity check. |
| `too-long-02` | too-long-output | `length_ratio_exceeded` | `acceptable_stress_case_failure` | Mars colonization plan. Set with strict 1.2 length ratio to test verbosity checks. |
| `too-long-03` | too-long-output | `length_ratio_exceeded` | `acceptable_stress_case_failure` | History of the world request. Set with 1.5 ratio to verify PL verbose validation. |
| `too-long-04` | too-long-output | `length_ratio_exceeded` | `acceptable_stress_case_failure` | Review of all programming languages. Set with 1.2 ratio limit. |
| `too-long-05` | too-long-output | `length_ratio_exceeded` | `acceptable_stress_case_failure` | Huge marketing plan request. Set with 1.5 ratio limit. |

## 6. Key Findings & Observations

1. **Safety Redactions**: Redacted all fake API secrets successfully. No real keys are stored or were transmitted during evaluation.
2. **Cost & Verbosity Bounds**: Optimized prompts exceeded length limits on 5 fixtures (6.6% of all cases). This indicates that the target model generates verbose output or the length limits in fixtures are overly restrictive.
3. **Uncertainty Warnings**: Fully triggered on dynamic queries about unverified pricing/context parameters.
