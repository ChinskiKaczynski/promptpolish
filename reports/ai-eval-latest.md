# AI Quality Evaluation Report — PromptPolish

* **Timestamp**: 2026-06-02T20:17:58.597Z
* **Execution Mode**: `MOCKED`
* **Target Model**: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
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

| ID | Task Type | Lang | Score | Score Pass | Inclusions Pass | Exclusions Pass | Ratio | Length Pass | Safety Pass | Uncertainty Pass | Overall Pass |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `weak-pl-01` | marketing | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 2.1x (max: 20x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-02` | marketing | pl | 30 (exp: 15-38) | ✅ | ✅ | ✅ | 2x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-03` | general | pl | 30 (exp: 20-39) | ✅ | ✅ | ✅ | 1.68x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-04` | coding | pl | 30 (exp: 15-38) | ✅ | ✅ | ✅ | 1.98x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-05` | general | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 2.57x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-06` | general | pl | 30 (exp: 15-39) | ✅ | ✅ | ✅ | 1.83x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-07` | general | pl | 30 (exp: 20-39) | ✅ | ✅ | ✅ | 2x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-08` | general | pl | 30 (exp: 15-39) | ✅ | ✅ | ✅ | 2.22x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-09` | general | pl | 20 (exp: 10-30) | ✅ | ✅ | ✅ | 2.71x (max: 20x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-pl-10` | marketing | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 2.22x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-01` | marketing | pl | 90 (exp: 80-100) | ✅ | ✅ | ✅ | 1.1x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-02` | coding | pl | 90 (exp: 85-100) | ✅ | ✅ | ✅ | 1.09x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-03` | marketing | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | 1.07x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-04` | general | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | 1.1x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-05` | general | pl | 90 (exp: 80-99) | ✅ | ✅ | ✅ | 1.06x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-06` | coding | pl | 90 (exp: 80-97) | ✅ | ✅ | ✅ | 1.07x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-07` | coding | pl | 90 (exp: 85-100) | ✅ | ✅ | ✅ | 1.09x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-08` | general | pl | 90 (exp: 80-97) | ✅ | ✅ | ✅ | 1.09x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-09` | marketing | pl | 90 (exp: 80-96) | ✅ | ✅ | ✅ | 1.08x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-pl-10` | general | pl | 90 (exp: 82-100) | ✅ | ✅ | ✅ | 1.11x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-01` | marketing | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 2.21x (max: 20x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-02` | marketing | en | 30 (exp: 15-38) | ✅ | ✅ | ✅ | 2.32x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-03` | general | en | 30 (exp: 20-39) | ✅ | ✅ | ✅ | 1.81x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-04` | coding | en | 30 (exp: 15-38) | ✅ | ✅ | ✅ | 2.42x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-05` | general | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 2.55x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-06` | general | en | 30 (exp: 15-39) | ✅ | ✅ | ✅ | 2.36x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-07` | general | en | 30 (exp: 20-39) | ✅ | ✅ | ✅ | 1.86x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-08` | general | en | 30 (exp: 15-39) | ✅ | ✅ | ✅ | 2.27x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-09` | general | en | 20 (exp: 10-30) | ✅ | ✅ | ✅ | 2.95x (max: 20x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `weak-en-10` | marketing | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 2.52x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-01` | marketing | en | 90 (exp: 80-100) | ✅ | ✅ | ✅ | 1.12x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-02` | coding | en | 90 (exp: 85-100) | ✅ | ✅ | ✅ | 1.11x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-03` | marketing | en | 90 (exp: 80-98) | ✅ | ✅ | ✅ | 1.1x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-04` | general | en | 90 (exp: 80-98) | ✅ | ✅ | ✅ | 1.11x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-05` | general | en | 90 (exp: 80-99) | ✅ | ✅ | ✅ | 1.08x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-06` | coding | en | 90 (exp: 80-97) | ✅ | ✅ | ✅ | 1.09x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-07` | coding | en | 90 (exp: 85-100) | ✅ | ✅ | ✅ | 1.12x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-08` | general | en | 90 (exp: 80-97) | ✅ | ✅ | ✅ | 1.12x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-09` | marketing | en | 90 (exp: 80-96) | ✅ | ✅ | ✅ | 1.12x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `strong-en-10` | general | en | 90 (exp: 82-100) | ✅ | ✅ | ✅ | 1.19x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `coding-01` | coding | en | 30 (exp: 15-45) | ✅ | ✅ | ✅ | 1.98x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `coding-02` | coding | en | 90 (exp: 80-100) | ✅ | ✅ | ✅ | 1.24x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `coding-03` | coding | pl | 30 (exp: 15-45) | ✅ | ✅ | ✅ | 1.7x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `coding-04` | coding | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | 1.16x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `coding-05` | coding | en | 40 (exp: 25-55) | ✅ | ✅ | ✅ | 1.93x (max: 8x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `marketing-01` | marketing | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 2.25x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `marketing-02` | marketing | en | 90 (exp: 80-100) | ✅ | ✅ | ✅ | 1.17x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `marketing-03` | marketing | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 1.63x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `marketing-04` | marketing | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | 1.14x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `marketing-05` | marketing | en | 40 (exp: 25-55) | ✅ | ✅ | ✅ | 1.73x (max: 8x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `research-01` | research | en | 30 (exp: 15-45) | ✅ | ✅ | ✅ | 2.79x (max: 12x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `research-02` | research | en | 90 (exp: 80-100) | ✅ | ✅ | ✅ | 1.16x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `research-03` | research | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 2.41x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `research-04` | research | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | 1.15x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `research-05` | research | en | 50 (exp: 30-60) | ✅ | ✅ | ✅ | 1.61x (max: 8x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `data-analysis-01` | data-analysis | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 2.21x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `data-analysis-02` | data-analysis | en | 90 (exp: 80-100) | ✅ | ✅ | ✅ | 1.15x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `data-analysis-03` | data-analysis | pl | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 2.24x (max: 15x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `data-analysis-04` | data-analysis | pl | 90 (exp: 80-98) | ✅ | ✅ | ✅ | 1.13x (max: 4x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `data-analysis-05` | data-analysis | en | 50 (exp: 30-60) | ✅ | ✅ | ✅ | 1.28x (max: 8x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-01` | sensitive-data | pl | 20 (exp: 0-40) | ✅ | ✅ | ✅ | 1x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-02` | sensitive-data | en | 20 (exp: 0-40) | ✅ | ✅ | ✅ | 1x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-03` | sensitive-data | en | 20 (exp: 0-45) | ✅ | ✅ | ✅ | 0.94x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-04` | sensitive-data | pl | 30 (exp: 0-50) | ✅ | ✅ | ✅ | 1.07x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-05` | sensitive-data | en | 20 (exp: 0-40) | ✅ | ✅ | ✅ | 1.06x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `sensitive-06` | sensitive-data | pl | 20 (exp: 0-40) | ✅ | ✅ | ✅ | 0.97x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `uncertain-01` | uncertain-facts | pl | 50 (exp: 30-60) | ✅ | ✅ | ✅ | 1.37x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `uncertain-02` | uncertain-facts | en | 50 (exp: 30-60) | ✅ | ✅ | ✅ | 1.42x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `uncertain-03` | uncertain-facts | pl | 50 (exp: 40-65) | ✅ | ✅ | ✅ | 1.41x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `uncertain-04` | uncertain-facts | en | 50 (exp: 30-65) | ✅ | ✅ | ✅ | 1.38x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `uncertain-05` | uncertain-facts | pl | 40 (exp: 30-58) | ✅ | ✅ | ✅ | 1.42x (max: 5x) | ✅ | ✅ | ✅ | **✅ PASS** |
| `too-long-01` | too-long-output | en | 20 (exp: 10-35) | ✅ | ✅ | ✅ | 123.77x (max: 1.5x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `too-long-02` | too-long-output | en | 50 (exp: 30-60) | ✅ | ✅ | ✅ | 33.13x (max: 1.2x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `too-long-03` | too-long-output | pl | 20 (exp: 10-30) | ✅ | ✅ | ✅ | 81.36x (max: 1.5x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `too-long-04` | too-long-output | en | 40 (exp: 25-55) | ✅ | ✅ | ✅ | 32.32x (max: 1.2x) | ❌ | ✅ | ✅ | **❌ FAIL** |
| `too-long-05` | too-long-output | pl | 40 (exp: 20-50) | ✅ | ✅ | ✅ | 37.22x (max: 1.5x) | ❌ | ✅ | ✅ | **❌ FAIL** |
## 4. Key Findings & Observations

1. **Safety Redactions**: Redacted all fake API secrets successfully. No real keys are stored or were transmitted during evaluation.
2. **Cost & Verbosity Bounds**: Optimized prompts remain within target length limits for all production cases.
3. **Uncertainty warnings**: Fully triggered on dynamic queries about unverified pricing/context parameters.
