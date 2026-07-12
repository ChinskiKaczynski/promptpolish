# AI Safety & Security Policy — PromptPolish

PromptPolish enforces rigid safety systems to prevent data leaks, secure provider keys, manage resource consumption, and normalize downstream errors.

---

## 1. Sensitive Data Detection & Blocking

To ensure absolute user privacy and data security, the application intercepts every prompt submission before it is ever written to disk or sent to the AI provider.

### 1.1 High-Risk Sensitive Patterns
The system scans input prompts for structural and high-entropy indicators of sensitive credentials, including but not limited to:
*   **API Keys & Access Tokens**: `sk-proj-...` (OpenAI), `AIzaSy...` (Google Cloud), `gpts-...`, Stripe secret keys (`sk_live_...`), GitHub tokens (`ghp_...`), AWS credentials.
*   **Private Cryptographic Keys**: Standard Pem block headers (`-----BEGIN PRIVATE KEY-----`).
*   **Environment Secrets**: Typical `.env` structures and database connection strings (`postgresql://...`).
*   **Passwords & Authentication Header Values**: Raw Bearer tokens, JSON Web Tokens (JWT), or base64-encoded credentials.
*   **Explicit Customer Personal Data**: Unmasked emails, SSNs/PESEL numbers, or raw credit card patterns.

### 1.2 Strict Preflight & Backend Blocking Rules
*   **Preflight Warning**: The client interface runs lightweight regex checks and displays a warning to encourage users to scrub secrets.
*   **Hard Backend Blocking**: If a backend check detects a high-risk secret:
    1.  The execution pipeline is immediately halted.
    2.  **No Raw Storage**: The input prompt is completely purged from memory and is **never** saved to Postgres or logged.
    3.  A generic, friendly error is returned to the user: *"Analysis halted. A potential API key, credential, or sensitive token was detected in your prompt. Please remove all secrets and try again."*
    4.  A generic log entry is written to `usage_events` (`event_type: "blocked_sensitive_data"`) with all input text omitted to trace attack patterns.

---

## 2. Usage Quota & Rate Limiting

PromptPolish enforces tight, layered rate limits:

*   **Daily Quotas**: Strict limit of **3 prompt analyses per day for anonymous**, **5 for free users**, and **100 for Pro subscribers**.
*   **IP Hashing**: The user's IP is hashed on the server side using SHA-256 with a rotating salt. The raw IP is **never** stored in the database.
*   **Dual Tracking**: Rate limiting is tracked against both the active **Anonymous Session Cookie UUID** or user ID, and the server-side calculated **SHA-256 IP Hash** to prevent evasion via simple cookie purging.
*   **Prompt Character Constraints**: Enforces max **12,000 characters** for anonymous and free tiers, and **24,000 characters** for Pro subscribers.

---

## 3. Model Hallucination & Calibrations

To keep the AI model from generating unverified claims or fabricating system rules, the system instructions sent to the provider contain absolute formatting walls:
*   **Standardized Rubric**: The LLM must assess prompts strictly on predefined criteria with scores between 0 and 100.
*   **No Self-Fabrication**: Prompt instructions explicitly forbid the model from discussing its own underlying API features, version dates, or provider parameters.
*   **Weighted Scoring Backend Logic**: The LLM output provides individual criteria scores. The backend recalculates and applies weights to determine the final composite score, preventing the LLM from simply generating arbitrary, unaligned scores.

---

## 4. Provider & Infrastructure Error Normalization

Under no circumstance should internal stack traces or raw vendor JSON payloads be exposed to the client.

> [!CAUTION]
> **API Leak Protection Rules**:
> *   All third-party integrations (Supabase, Gemini API) must run inside robust `try/catch` wrappers.
> *   If a provider fails (e.g., rate limits, API down, quota exceeded), the backend catches the error, logs a secure internal trace, and returns a safe standard response: *"Audit service is temporarily congested. Please try again shortly."*
> *   Do not include native database errors, table names, SQL queries, or remote host URLs in any client responses.
