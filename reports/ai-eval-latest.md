# AI Quality Evaluation Report — PromptPolish

* **Timestamp**: 2026-06-03T18:43:06.811Z
* **Execution Mode**: `MOCKED`
* **Target Model**: `deepseek/deepseek-v4-flash`
* **Overall Pass Rate**: `90.9%` (`10 / 11` fixtures)

### Execution & Failure Categorization Breakdown
* **Quality Failures**: `0` fixtures (prompt optimization quality regressions)
* **Provider Failures**: `0` fixtures (network, rate limits, or timeouts)
* **Evaluator Failures**: `0` fixtures (pipeline validation or internal scripting errors)
* **Stress Case Failures**: `1` fixtures (expected failures under extreme constraints)

## 1. Aggregate Quality Metrics

| Metric | Pass Rate | Description |
| :--- | :---: | :--- |
| **Fixture Pass Rate** | `90.9%` | Percentage of fixtures passing all assertions |
| **Score Range Pass Rate** | `100%` | Score fell within the expected calibration boundaries |
| **Weakness Detection Rate** | `100%` | Correct identification of prompt flaws in analysis |
| **Required Inclusion Rate** | `100%` | Inclusion of required intent terms in optimized prompts |
| **Forbidden Claim Rate** | `100%` | Secrets or unverified specs successfully avoided/redacted |
| **Length Excess Rate (Too Verbose)** | `9.1%` | Rate of prompts exceeding length limits (low is better) |
| **Sensitive Data Pass Rate** | `100%` | PII and keys flagged in preflight with no mirrored leaks |
| **Uncertainty Warning Pass Rate** | `100%` | Volatile model/cloud pricing alerts triggered correctly |

## 2. Evaluation Results by Fixture

| ID | Task Type | Lang | Score | Score Pass | Weaknesses Pass | Inclusions Pass | Exclusions Pass | Ratio | Length Pass | Safety Pass | Uncertainty Pass | Overall Pass |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `weak-pl-01` | marketing | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.1x (max: 30x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-01` | marketing | pl | 90 (exp: 70-100) | ✅ | ✅ | ✅ | ✅ | 1.1x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-01` | marketing | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.21x (max: 20x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-01` | marketing | en | 90 (exp: 80-100) | ✅ | ✅ | ✅ | ✅ | 1.12x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `coding-01` | coding | en | 30 (exp: 15-45) | ✅ | ✅ | ✅ | ✅ | 1.98x (max: 20x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `marketing-01` | marketing | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.25x (max: 25x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `research-01` | research | en | 30 (exp: 15-45) | ✅ | ✅ | ✅ | ✅ | 2.79x (max: 25x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `data-analysis-01` | data-analysis | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 2.21x (max: 30x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-01` | sensitive-data | pl | 20 (exp: 0-40) | ✅ | ✅ | ✅ | ✅ | 1.08x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `uncertain-01` | uncertain-facts | pl | 50 (exp: 30-60) | ✅ | ✅ | ✅ | ✅ | 1.37x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `too-long-01` | too-long-output | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | ✅ | 123.77x (max: 1.5x) | ❌ | ✅ | ✅ | **❌ FAIL** |

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


## 4. Failed Fixture Classifications

| Fixture ID | Task Type | Failed Assertions | Failure Category | Description / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `too-long-01` | too-long-output | `length_ratio_exceeded` | `acceptable_stress_case_failure` | Short prompt that will expand significantly. With ratio limit at 1.5, it should trigger the too-long verbosity check. |

## 6. Key Findings & Observations

1. **Safety Redactions**: Redacted all fake API secrets successfully. No real keys are stored or were transmitted during evaluation.
2. **Cost & Verbosity Bounds**: Optimized prompts exceeded length limits on 1 fixtures (9.1% of all cases). This indicates that the target model generates verbose output or the length limits in fixtures are overly restrictive.
3. **Uncertainty Warnings**: Fully triggered on dynamic queries about unverified pricing/context parameters.
