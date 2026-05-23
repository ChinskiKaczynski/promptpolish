# Refund and Cancellation Policy (Draft)

> [!WARNING]
> **LEGAL & TAX REVIEW REQUIRED**  
> This document is a draft prepared for the PromptPolish SaaS platform to assist in legal and billing readiness. It does **not** constitute legal advice or formal compliance certification. This draft **must** be formally reviewed, modified, and signed off by certified legal counsel and a tax advisor prior to enabling paid production transactions. **Do not deploy paid production features or accept real payments before this review is complete.**

---

## 1. Overview & Subscription Model

PromptPolish operates a subscription-based model for its premium tier (**"Pro Plan"**).
*   **Pro Plan Pricing:** Configured at a recurring charge of **$9.00 to $12.00 USD per month** (subject to final pricing selection and local taxes).
*   **Free Tier:** Anonymous users receive a daily abuse limit of **3 free prompt analyses per day**.
*   **Billing Frequency:** Monthly billing cycle only. No annual subscriptions are available at this phase to minimize billing complexity.

---

## 2. Cancellation Policy

We believe in a frictionless, self-service user experience. Subscribers can cancel their subscription at any time without needing to contact support.

### A. Mechanism
*   Cancellations are managed directly by the user through the **Stripe Customer Portal**, accessible from the user's account settings page.
*   Clicking "Cancel Subscription" instantly schedules the subscription for cancellation at the end of the current billing cycle.

### B. Access Retention
*   Upon cancellation, the subscription state is marked as `cancel_at_period_end = true` in Stripe and synced to the database.
*   The user retains full access to all Pro features and entitlements (e.g., higher daily/monthly analysis limits, prompt export) until the exact end of the current paid billing period.
*   At the end of the billing period, the account automatically degrades to the **Free Plan**, and standard usage limits and retention rules will apply.

---

## 3. Refund Policy (14-Day Guarantee)

To protect PromptPolish from cost exploitation while providing a fair, consumer-friendly refund path, we apply a clear usage-based refund threshold.

### A. 14-Day Money-Back Guarantee
*   Users are entitled to a full refund within **14 calendar days** of their initial subscription purchase or monthly renewal.
*   **Strict Usage Limitation:** The refund is valid **ONLY** if the user has consumed **fewer than 10 prompt analyses** during the billing cycle for which the refund is requested.

### B. Rationale for the Usage Threshold
*   Each prompt analysis processed by PromptPolish incurs direct external costs from our AI provider (Google Gemini API).
*   The 10-analysis threshold protects the service from bad-faith exploitation (e.g., a user upgrading, optimizing a massive backlog of dozens of prompts in 2 days, and then requesting a refund to obtain the service for free).
*   If a user has executed 10 or more prompt analyses, the subscription is strictly **non-refundable**.

### C. Processing Refunds
*   Refund requests within the 14-day window that meet the usage criteria must be submitted to support (e.g., support@promptpolish.com).
*   Refunds will be processed via Stripe and returned to the original payment method. Depending on the card issuer, funds may take 5–10 business days to appear.

---

## 4. Unresolved Legal, Tax, and Compliance Questions

The following questions must be resolved by professional legal and tax advisors prior to launch:

1.  **Stripe Tax Implementation:**
    *   *Question:* Should we enable **Stripe Tax** to dynamically calculate and collect state/country-specific sales tax or VAT?
    *   *Impact:* Stripe Tax simplifies global compliance but charges a transaction fee. Without it, we must build custom tax calculation/reporting scripts, which is highly error-prone.
2.  **VAT OSS (One-Stop Shop) for EU B2C Sales:**
    *   *Question:* How will B2C sales to EU residents be reported? Are we registered under the VAT OSS scheme in Poland/EEA, or do we qualify for a micro-business exemption?
    *   *Impact:* Selling to EU consumers requires applying the VAT rate of the customer's country and quarterly reporting via OSS.
3.  **B2B Reverse Charge Verification:**
    *   *Question:* How will we collect and validate corporate tax/VAT IDs at checkout to apply reverse-charge rules?
    *   *Impact:* If B2B is supported, Stripe Checkout can collect VAT IDs, but we must ensure our backend appropriately marks these invoices as reverse-charged.
4.  **Local Consumer Rights (EEA/Poland):**
    *   *Question:* Does the 14-day refund threshold of "under 10 analyses" fully comply with EU directive 2011/83/EU on consumer rights regarding digital services?
    *   *Impact:* Under EU law, consumers generally lose their 14-day right of withdrawal for digital content once performance has begun with their prior express consent and acknowledgment that they lose their right of withdrawal. We must ensure the checkout flow contains the checkbox obtaining this explicit consent and acknowledgment.
