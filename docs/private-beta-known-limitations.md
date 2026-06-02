# Known Limitations - Private Beta

This document outlines the current limitations, constraints, and known behaviors of PromptPolish during the private beta testing phase.

---

## 1. Beta Status & SLA
* **Development Phase**: PromptPolish is currently in private beta. The service is provided "as is" with no uptime guarantees, performance SLAs, or guarantees of data persistence.
* **Session Lifecycle**: Testing history is stored locally in cookie sessions. Clearing browser cookies or cache will erase your audit history page references.

---

## 2. Monetization & Billing Constraints

> [!IMPORTANT]
> **No Payments or Active Plans**:
> * All payment checkouts and billing management screens are completely disabled (`STRIPE_ENABLED=false`).
> * Any attempts to access `/api/billing/checkout` or `/api/billing/portal` will result in a `403 Forbidden` response.
> * Users cannot upgrade or pay for higher limits. 

---

## 3. Prompt Optimization Quality
* **Output Variances**: LLM prompt optimization is probabilistic. We do not guarantee that the optimized prompt will produce better results for every query or domain.
* **LLM Profile Lock**: Optimization is currently processed through a single model profile (`openrouter-deepseek-v4-flash`). Alternative LLM engines are not available in this version.
* **Length Limits**: Prompt text must be between **20 and 12,000 characters**. Text outside this range is rejected by validation guards.

---

## 4. Input Security & Secret Preflight

> [!WARNING]
> **Do Not Paste Live Credentials**:
> * Although the system includes a sensitive data preflight scanner that blocks queries containing suspected API keys (e.g., `sk-...`), passwords, or database connection strings, the scanner relies on regex patterns and is not exhaustive.
> * Never paste production secrets, API credentials, proprietary codebases, or personally identifiable information (PII) into the input fields.

---

## 5. Upstream Provider Dependencies
* **API Availability**: PromptPolish relies on OpenRouter as the API gateway and DeepSeek as the underlying LLM. System outages, API latency spikes, or rate limiting on the provider side will lead to transient `analysis_failed` errors.
* **Zod Structural Validation**: Prompt outputs are strictly validated against a structured JSON schema. Extreme deviations in the AI provider's output format may occasionally trigger a `SemanticValidationError`, resulting in a failed audit run.

---

## 6. Token Usage & Cost Tracking
* **Cost Metric Limitations**: In the current schema, cost tracking metrics return `ai_cost_status: "unknown"`.
* **Cost Exposure**: Raw token count metadata is not consistently parsed or logged. Cost details will remain estimated/unknown until reliable metadata is returned by the provider and stored in database schemas.
