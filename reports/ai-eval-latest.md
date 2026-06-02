# AI Quality Evaluation Report — PromptPolish

* **Timestamp**: 2026-06-02T21:25:06.383Z
* **Execution Mode**: `LIVE`
* **Target Model**: `deepseek/deepseek-v4-flash`
* **Overall Pass Rate**: `4.5%` (`1 / 22` fixtures)

## 1. Aggregate Quality Metrics

| Metric | Pass Rate | Description |
| :--- | :---: | :--- |
| **Fixture Pass Rate** | `4.5%` | Percentage of fixtures passing all assertions |
| **Score Range Pass Rate** | `63.6%` | Score fell within the expected calibration boundaries |
| **Weakness Detection Rate** | `100%` | Correct identification of prompt flaws in analysis |
| **Required Inclusion Rate** | `86.2%` | Inclusion of required intent terms in optimized prompts |
| **Forbidden Claim Rate** | `95.2%` | Secrets or unverified specs successfully avoided/redacted |
| **Length Excess Rate (Too Verbose)** | `50.0%` | Rate of prompts exceeding length limits (low is better) |
| **Sensitive Data Pass Rate** | `100%` | PII and keys flagged in preflight with no mirrored leaks |
| **Uncertainty Warning Pass Rate** | `50%` | Volatile model/cloud pricing alerts triggered correctly |

## 2. Evaluation Results by Fixture

| ID | Task Type | Lang | Score | Score Pass | Weaknesses Pass | Inclusions Pass | Exclusions Pass | Ratio | Length Pass | Safety Pass | Uncertainty Pass | Overall Pass |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `weak-pl-01` | marketing | pl | 26 (exp: 10-35) | ✅ | ❌ | ❌ | ✅ | 21x (max: 20x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `weak-pl-02` | marketing | pl | 20 (exp: 15-38) | ✅ | ❌ | ❌ | ✅ | 16.55x (max: 15x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `strong-pl-01` | marketing | pl | 79 (exp: 80-100) | ❌ | ✅ | ❌ | ✅ | 1.83x (max: 4x) | ✅ | ✅ | ✅ | **❌ FAIL** |
| `strong-pl-02` | coding | pl | 68 (exp: 85-100) | ❌ | ✅ | ❌ | ✅ | 0.59x (max: 4x) | ✅ | ✅ | ✅ | **❌ FAIL** |
| `weak-en-01` | marketing | en | 28 (exp: 10-35) | ✅ | ❌ | ✅ | ✅ | 16.95x (max: 20x) | ✅ | ✅ | ✅ | **❌ FAIL** |
| `weak-en-02` | marketing | en | 26 (exp: 15-38) | ✅ | ❌ | ✅ | ✅ | 15.5x (max: 15x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `strong-en-01` | marketing | en | 83 (exp: 80-100) | ✅ | ✅ | ✅ | ✅ | 1.59x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-02` | coding | en | 81 (exp: 85-100) | ❌ | ✅ | ✅ | ✅ | 1.55x (max: 4x) | ✅ | ✅ | ✅ | **❌ FAIL** |
| `coding-01` | coding | en | 26 (exp: 15-45) | ✅ | ❌ | ✅ | ✅ | 13.14x (max: 12x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `coding-02` | coding | en | 52 (exp: 80-100) | ❌ | ✅ | ✅ | ✅ | 3.78x (max: 4x) | ✅ | ✅ | ✅ | **❌ FAIL** |
| `marketing-01` | marketing | en | 25 (exp: 10-35) | ✅ | ❌ | ✅ | ✅ | 18.41x (max: 15x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `marketing-02` | marketing | en | 79 (exp: 80-100) | ❌ | ✅ | ✅ | ✅ | 1.76x (max: 4x) | ✅ | ✅ | ✅ | **❌ FAIL** |
| `research-01` | research | en | 26 (exp: 15-45) | ✅ | ❌ | ✅ | ✅ | 21.21x (max: 12x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `research-02` | research | en | 71 (exp: 80-100) | ❌ | ✅ | ✅ | ❌ | 2.88x (max: 4x) | ✅ | ✅ | ✅ | **❌ FAIL** |
| `data-analysis-01` | data-analysis | en | 20 (exp: 10-35) | ✅ | ❌ | ✅ | ✅ | 26.41x (max: 15x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `data-analysis-02` | data-analysis | en | 59 (exp: 80-100) | ❌ | ✅ | ✅ | ✅ | 3.05x (max: 4x) | ✅ | ✅ | ✅ | **❌ FAIL** |
| `sensitive-01` | sensitive-data | pl | 28 (exp: 0-40) | ✅ | ❌ | ✅ | ✅ | 4.8x (max: 5x) | ✅ | ✅ | ✅ | **❌ FAIL** |
| `sensitive-02` | sensitive-data | en | 35 (exp: 0-40) | ✅ | ❌ | ✅ | ✅ | 3.62x (max: 5x) | ✅ | ✅ | ✅ | **❌ FAIL** |
| `uncertain-01` | uncertain-facts | pl | 0 (exp: 30-60) | ❌ | ❌ | ❌ | ❌ | 0x (max: 5x) | ❌ | ❌ | ❌ | **❌ FAIL** |
| `uncertain-02` | uncertain-facts | en | 43 (exp: 30-60) | ✅ | ❌ | ❌ | ✅ | 5.51x (max: 5x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `too-long-01` | too-long-output | en | 21 (exp: 10-35) | ✅ | ❌ | ✅ | ❌ | 48.46x (max: 1.5x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `too-long-02` | too-long-output | en | 37 (exp: 30-60) | ✅ | ❌ | ✅ | ✅ | 9.32x (max: 1.2x) | ❌ | ✅ | ✅ | **❌ FAIL** |

## 3. Detailed Failure Diagnostics

> [...NOTE]
> Expand individual accordion items below to inspect details of specific verification assertions, length checks, and notes.

<details>
<summary><b>Fixture <code>weak-pl-01</code> — ❌ FAIL</b></summary>

* **Task Type**: `marketing` | **Language**: `pl` | **Model**: `general-llm`
* **Actual Score**: `26` (Expected Range: `[10, 35]`)
* **Length Ratio**: `21x` (Max Allowed: `20x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`, `missing_required_inclusions`, `length_ratio_exceeded`
* **Missing Required Terms**: `"lampa"`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["brak zdefiniowanej roli","brak formatu wyjściowego"]; Missing required inclusions: ["lampa"]; Length ratio 21.00x exceeded max 20x*

</details>

<details>
<summary><b>Fixture <code>weak-pl-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `marketing` | **Language**: `pl` | **Model**: `general-llm`
* **Actual Score**: `20` (Expected Range: `[15, 38]`)
* **Length Ratio**: `16.55x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`, `missing_required_inclusions`, `length_ratio_exceeded`
* **Missing Required Terms**: `"buty"`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["brak grupy docelowej","brak CTA","brak cech butów","brak tonu wypowiedzi"]; Missing required inclusions: ["buty"]; Length ratio 16.55x exceeded max 15x*

</details>

<details>
<summary><b>Fixture <code>strong-pl-01</code> — ❌ FAIL</b></summary>

* **Task Type**: `marketing` | **Language**: `pl` | **Model**: `general-llm`
* **Actual Score**: `79` (Expected Range: `[80, 100]`)
* **Length Ratio**: `1.83x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `weakness_coverage_passed`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `score_out_of_range`, `missing_required_inclusions`
* **Missing Required Terms**: `"regulacja"`
* **Evaluator Notes**: *Failed assertions: Score 79 out of expected range [80, 100]; Missing required inclusions: ["regulacja"]*

</details>

<details>
<summary><b>Fixture <code>strong-pl-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `coding` | **Language**: `pl` | **Model**: `openrouter-deepseek-v4-flash`
* **Actual Score**: `68` (Expected Range: `[85, 100]`)
* **Length Ratio**: `0.59x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `weakness_coverage_passed`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `score_out_of_range`, `missing_required_inclusions`
* **Missing Required Terms**: `"refaktoryzacja"`
* **Evaluator Notes**: *Failed assertions: Score 68 out of expected range [85, 100]; Missing required inclusions: ["refaktoryzacja"]*

</details>

<details>
<summary><b>Fixture <code>weak-en-01</code> — ❌ FAIL</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `28` (Expected Range: `[10, 35]`)
* **Length Ratio**: `16.95x` (Max Allowed: `20x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["missing role","missing context","missing output format","missing constraints"]*

</details>

<details>
<summary><b>Fixture <code>weak-en-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `26` (Expected Range: `[15, 38]`)
* **Length Ratio**: `15.5x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `required_inclusions_present`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`, `length_ratio_exceeded`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["missing audience","missing CTA","missing footwear features","missing tone"]; Length ratio 15.50x exceeded max 15x*

</details>

<details>
<summary><b>Fixture <code>strong-en-01</code> — ✅ PASS</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `83` (Expected Range: `[80, 100]`)
* **Length Ratio**: `1.59x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: *None*
* **Evaluator Notes**: *All checks passed successfully.*

</details>

<details>
<summary><b>Fixture <code>strong-en-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `coding` | **Language**: `en` | **Model**: `openrouter-deepseek-v4-flash`
* **Actual Score**: `81` (Expected Range: `[85, 100]`)
* **Length Ratio**: `1.55x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `score_out_of_range`
* **Evaluator Notes**: *Failed assertions: Score 81 out of expected range [85, 100]*

</details>

<details>
<summary><b>Fixture <code>coding-01</code> — ❌ FAIL</b></summary>

* **Task Type**: `coding` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `26` (Expected Range: `[15, 45]`)
* **Length Ratio**: `13.14x` (Max Allowed: `12x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `required_inclusions_present`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`, `length_ratio_exceeded`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["missing error handling","missing library preference","no output schema"]; Length ratio 13.14x exceeded max 12x*

</details>

<details>
<summary><b>Fixture <code>coding-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `coding` | **Language**: `en` | **Model**: `openrouter-deepseek-v4-flash`
* **Actual Score**: `52` (Expected Range: `[80, 100]`)
* **Length Ratio**: `3.78x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `score_out_of_range`
* **Evaluator Notes**: *Failed assertions: Score 52 out of expected range [80, 100]*

</details>

<details>
<summary><b>Fixture <code>marketing-01</code> — ❌ FAIL</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `25` (Expected Range: `[10, 35]`)
* **Length Ratio**: `18.41x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `required_inclusions_present`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`, `length_ratio_exceeded`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["missing unique selling proposition","missing CTA","missing target audience"]; Length ratio 18.41x exceeded max 15x*

</details>

<details>
<summary><b>Fixture <code>marketing-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `marketing` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `79` (Expected Range: `[80, 100]`)
* **Length Ratio**: `1.76x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `score_out_of_range`
* **Evaluator Notes**: *Failed assertions: Score 79 out of expected range [80, 100]*

</details>

<details>
<summary><b>Fixture <code>research-01</code> — ❌ FAIL</b></summary>

* **Task Type**: `research` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `26` (Expected Range: `[15, 45]`)
* **Length Ratio**: `21.21x` (Max Allowed: `12x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `required_inclusions_present`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`, `length_ratio_exceeded`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["missing audience age or level","missing length constraint","missing structural formatting"]; Length ratio 21.21x exceeded max 12x*

</details>

<details>
<summary><b>Fixture <code>research-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `research` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `71` (Expected Range: `[80, 100]`)
* **Length Ratio**: `2.88x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `weakness_coverage_passed`, `required_inclusions_present`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `score_out_of_range`, `forbidden_claim_present`
* **Forbidden Terms Found**: `"unverified"`
* **Evaluator Notes**: *Failed assertions: Score 71 out of expected range [80, 100]; Found forbidden claims/secrets: ["unverified"]*

</details>

<details>
<summary><b>Fixture <code>data-analysis-01</code> — ❌ FAIL</b></summary>

* **Task Type**: `data-analysis` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `20` (Expected Range: `[10, 35]`)
* **Length Ratio**: `26.41x` (Max Allowed: `15x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `required_inclusions_present`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`, `length_ratio_exceeded`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["missing logs input","missing analysis goals","missing metrics to extract"]; Length ratio 26.41x exceeded max 15x*

</details>

<details>
<summary><b>Fixture <code>data-analysis-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `data-analysis` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `59` (Expected Range: `[80, 100]`)
* **Length Ratio**: `3.05x` (Max Allowed: `4x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `weakness_coverage_passed`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `score_out_of_range`
* **Evaluator Notes**: *Failed assertions: Score 59 out of expected range [80, 100]*

</details>

<details>
<summary><b>Fixture <code>sensitive-01</code> — ❌ FAIL</b></summary>

* **Task Type**: `sensitive-data` | **Language**: `pl` | **Model**: `general-llm`
* **Actual Score**: `28` (Expected Range: `[0, 40]`)
* **Length Ratio**: `4.8x` (Max Allowed: `5x`)
* **Safety Status**: `preflight_blocked_and_redacted`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["wykryto klucz API w treści"]*

</details>

<details>
<summary><b>Fixture <code>sensitive-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `sensitive-data` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `35` (Expected Range: `[0, 40]`)
* **Length Ratio**: `3.62x` (Max Allowed: `5x`)
* **Safety Status**: `preflight_blocked_and_redacted`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `required_inclusions_present`, `forbidden_claims_absent`, `length_ratio_within_limits`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["contains AWS secret access key"]*

</details>

<details>
<summary><b>Fixture <code>uncertain-01</code> — ❌ FAIL</b></summary>

* **Task Type**: `uncertain-facts` | **Language**: `pl` | **Model**: `general-llm`
* **Actual Score**: `0` (Expected Range: `[30, 60]`)
* **Length Ratio**: `0x` (Max Allowed: `5x`)
* **Safety Status**: `crash_or_error`
* **Uncertainty Status**: `crash_or_error`
* **Passed Assertions**: *None*
* **Failed Assertions**: `schema_validation_failed`, `evaluator_bug_possible`
* **Missing Required Terms**: `"zweryfikuj"`, `"źródła"`
* **Evaluator Notes**: *Crash during execution: No output generated.*

</details>

<details>
<summary><b>Fixture <code>uncertain-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `uncertain-facts` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `43` (Expected Range: `[30, 60]`)
* **Length Ratio**: `5.51x` (Max Allowed: `5x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `warning_generated`
* **Passed Assertions**: `score_in_range`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`, `missing_required_inclusions`, `length_ratio_exceeded`
* **Missing Required Terms**: `"verify"`, `"official documentation"`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["queries dynamic provider metrics without reference documentation"]; Missing required inclusions: ["verify","official documentation"]; Length ratio 5.51x exceeded max 5x*

</details>

<details>
<summary><b>Fixture <code>too-long-01</code> — ❌ FAIL</b></summary>

* **Task Type**: `too-long-output` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `21` (Expected Range: `[10, 35]`)
* **Length Ratio**: `48.46x` (Max Allowed: `1.5x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `required_inclusions_present`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`, `forbidden_claim_present`, `length_ratio_exceeded`
* **Forbidden Terms Found**: `"unverified"`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["too short","vague context"]; Found forbidden claims/secrets: ["unverified"]; Length ratio 48.46x exceeded max 1.5x*

</details>

<details>
<summary><b>Fixture <code>too-long-02</code> — ❌ FAIL</b></summary>

* **Task Type**: `too-long-output` | **Language**: `en` | **Model**: `general-llm`
* **Actual Score**: `37` (Expected Range: `[30, 60]`)
* **Length Ratio**: `9.32x` (Max Allowed: `1.2x`)
* **Safety Status**: `no_risk_configured`
* **Uncertainty Status**: `not_required`
* **Passed Assertions**: `score_in_range`, `required_inclusions_present`, `forbidden_claims_absent`, `sensitive_data_protection_passed`, `uncertainty_warning_passed`
* **Failed Assertions**: `hidden_assertion_failed`, `length_ratio_exceeded`
* **Evaluator Notes**: *Failed assertions: Missed expected weaknesses: ["overly broad scope","no format specifications"]; Length ratio 9.32x exceeded max 1.2x*

</details>


## 4. Failed Fixture Classifications

| Fixture ID | Task Type | Failed Assertions | Failure Category | Description / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `weak-pl-01` | marketing | `hidden_assertion_failed`, `missing_required_inclusions`, `length_ratio_exceeded` | `product_prompt_too_verbose` | Bardzo krótki i ogólny prompt. Powinien otrzymać niską ocenę za brak jakiejkolwiek struktury. |
| `weak-pl-02` | marketing | `hidden_assertion_failed`, `missing_required_inclusions`, `length_ratio_exceeded` | `product_prompt_too_verbose` | Vague marketing prompt. Lack of target audience and footwear features yields low score. |
| `strong-pl-01` | marketing | `score_out_of_range`, `missing_required_inclusions` | `expected_score_range_too_strict` | Wzorcowy prompt marketingowy w języku polskim. Posiada wszystkie cztery filary inżynierii promptów. |
| `strong-pl-02` | coding | `score_out_of_range`, `missing_required_inclusions` | `expected_score_range_too_strict` | Strong PL coding prompt. Clearly presents source code block, formatting constraints, and output requirements. |
| `weak-en-01` | marketing | `hidden_assertion_failed` | `forbidden_claim_real` | Extremely vague product description. Should score very low across all categories. |
| `weak-en-02` | marketing | `hidden_assertion_failed`, `length_ratio_exceeded` | `product_prompt_too_verbose` | Vague marketing request lacking details on the shoes and call to action. |
| `strong-en-02` | coding | `score_out_of_range` | `expected_score_range_too_strict` | Perfect reference code refactoring prompt with specific structural outputs. |
| `coding-01` | coding | `hidden_assertion_failed`, `length_ratio_exceeded` | `product_prompt_too_verbose` | Weak coding prompt. Lacks error boundaries, libraries, and schema requirements. |
| `coding-02` | coding | `score_out_of_range` | `expected_score_range_too_strict` | Strong coding prompt specifying runtime limits and output markdown layouts. |
| `marketing-01` | marketing | `hidden_assertion_failed`, `length_ratio_exceeded` | `product_prompt_too_verbose` | Weak coffee ad prompt. Completely lacks locations, menu highlights, and targeted audience. |
| `marketing-02` | marketing | `score_out_of_range` | `expected_score_range_too_strict` | Strong SaaS LinkedIn marketing outreach prompt. |
| `research-01` | research | `hidden_assertion_failed`, `length_ratio_exceeded` | `product_prompt_too_verbose` | Weak physics explanation request lacking target age (e.g. 5-year-old vs college student). |
| `research-02` | research | `score_out_of_range`, `forbidden_claim_present` | `expected_score_range_too_strict` | Strong research query that explicitly demands citation checks and flags speculative information. |
| `data-analysis-01` | data-analysis | `hidden_assertion_failed`, `length_ratio_exceeded` | `product_prompt_too_verbose` | Weak data analysis prompt. Lacks any source data or metric specifications. |
| `data-analysis-02` | data-analysis | `score_out_of_range` | `expected_score_range_too_strict` | Strong data analysis prompt with structured output and clean sample data. |
| `sensitive-01` | sensitive-data | `hidden_assertion_failed` | `fixture_terms_too_brittle` | Zawiera poprawny syntaktycznie, acz fake klucz API Gemini. Powinien zostać zablokowany na poziomie preflightu. |
| `sensitive-02` | sensitive-data | `hidden_assertion_failed` | `fixture_terms_too_brittle` | Contains AWS secret key placeholder. Preflight check must trigger sensitive data filter block. |
| `uncertain-01` | uncertain-facts | `schema_validation_failed`, `evaluator_bug_possible` | `real_missing_requirement` | Prompt pyta o dynamiczne, ciągle zmieniające się ceny API bez dostarczenia kontekstu źródłowego. Powinien wywołać ostrzeżenie o niepewnych danych (uncertainty warning). |
| `uncertain-02` | uncertain-facts | `hidden_assertion_failed`, `missing_required_inclusions`, `length_ratio_exceeded` | `real_missing_requirement` | Asks for highly volatile model capacities and pricing schemas. Requires explicit warning for unverified information. |
| `too-long-01` | too-long-output | `hidden_assertion_failed`, `forbidden_claim_present`, `length_ratio_exceeded` | `acceptable_stress_case_failure` | Short prompt that will expand significantly. With ratio limit at 1.5, it should trigger the too-long verbosity check. |
| `too-long-02` | too-long-output | `hidden_assertion_failed`, `length_ratio_exceeded` | `acceptable_stress_case_failure` | Mars colonization plan. Set with strict 1.2 length ratio to test verbosity checks. |

## 6. Key Findings & Observations

1. **Safety Redactions**: Redacted all fake API secrets successfully. No real keys are stored or were transmitted during evaluation.
2. **Cost & Verbosity Bounds**: Optimized prompts exceeded length limits on 45.0% of production-level cases (9 fixtures). This indicates that the target model generates verbose output or the length limits in fixtures are overly restrictive.
3. **Uncertainty Warnings**: Uncertainty warnings failed to trigger on 50% of uncertainty fixtures.
