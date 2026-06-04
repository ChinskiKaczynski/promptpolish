# Billing, Refund, and Cancellation Policy (Draft)

> [!WARNING]
> **DRAFT FOR LEGAL & TAX REVIEW**  
> This document is a draft prepared for the PromptPolish SaaS platform to assist in legal and billing readiness. It does **not** constitute official legal advice or formal compliance certification. This draft **must** be formally reviewed, modified, and signed off by certified legal counsel and a tax advisor prior to enabling paid production transactions. **Do not deploy paid production features or accept real payments before this review is complete.**

Last Updated: June 4, 2026

This Billing, Refund, and Cancellation Policy outlines the financial terms governing the premium subscription tier ("Pro Plan") of PromptPolish.

---

## 1. Subscription Model and Pricing
*   **Monthly Pro Plan:** PromptPolish offers a recurring monthly subscription plan. At this stage of platform maturity, annual plans are not supported to reduce accounting and billing complexity.
*   **Pricing:** [PRIMARY CURRENCY AND PRICE TBD — requires pricing/tax decision].
*   **Tax/VAT Exclusion:** The base pricing does **not** include localized taxes (such as EU VAT or state-level sales taxes). [Tax calculation and local tax dynamic inclusion are TBD — requires tax setup decisions].

---

## 2. Stripe-Hosted Checkout & Security
*   **Checkout Redirection:** All subscription registration transactions are processed via secure **Stripe Checkout** pages hosted by Stripe, Inc.
*   **Security Standards:** PromptPolish processes payments under strict PCI-DSS compliance. We do not store, log, or have access to any customer credit card numbers, CVVs, or security credentials.
*   **Customer Account Matching:** Stripe customers are linked to registered PromptPolish users in our database via the unique `stripe_customer_id` and metadata tags.

---

## 3. Subscription Renewals
*   **Billing Anniversary:** Subscriptions are billed immediately upon purchase and automatically renew on the same calendar day each month (the "Anniversary Date").
*   **Proration:** If a billing month does not contain the Anniversary Date (e.g., purchase on January 31, renewal in February), the invoice will be billed on the final day of that month.
*   **Billing Communication:** Automated billing confirmation receipts are emailed to subscribers directly by Stripe.

---

## 4. Failed Payments & Grace Period Policy
If a monthly renewal charge fails (due to card expiration, insufficient funds, or banking blocks), Stripe automatically manages the dunning process:
*   **Stripe Retries:** Stripe will retry the payment card up to 4 times over a period of 1-3 weeks (configured in the Stripe Dashboard settings).
*   **past_due Status (Grace Period):** During the retry cycle, the subscription status transitions to `past_due`. [Grace period duration for past_due status must be finalized in Stripe retry settings and verified in webhook handlers].
*   **unpaid Status (Downgrade):** If all retries fail, the subscription status changes to `unpaid`. PromptPolish immediately processes a webhook event to degrade the account entitlement layer from Pro back to the Free Plan, preventing cost abuse on our AI infrastructure.
*   **canceled Status:** If a subscription is permanently canceled by Stripe or the team, the entitlement resolves instantly to Free.

---

## 5. Subscription Cancellation
*   **Self-Service Cancellation:** Subscribers can cancel their subscription at any time. The process is self-service and is initiated by clicking the "Manage Billing" button in the Account Settings dashboard, which redirects to the **Stripe Customer Portal**.
*   **Cancel at Period End:** Clicking cancel schedules the subscription to terminate at the end of the current billing cycle (`cancel_at_period_end = true`).
*   **Access Retention:** The user retains full access to all Pro features (extended character limits, Markdown/PDF exports, batch audits) for the remainder of the paid period.
*   **Final Downgrade:** At the exact end of the billing period, the subscription changes to `canceled`, and the account is downgraded to the Free Plan.

---

## 6. Refund Policy (Placeholder)
*   **[REFUND POLICY TBD — legal review required]**
*   *Possible policy under review:* 14-day refund window with usage threshold. Must be reviewed for EU consumer law before publication. Under this proposed option: refunds would only be valid if the user has consumed fewer than 10 prompt analyses during the billing cycle for which the refund is requested, to offset direct API infrastructure costs. If 10 or more analyses have been processed, the subscription would be non-refundable.
*   **Refund Requests:** Requests must be sent to [SUPPORT EMAIL TBD] and are processed via Stripe back to the original payment card.

---

## 7. Crucial Launch Constraints (Blockers)
Paid production checkouts will remain disabled (`STRIPE_ENABLED=false` by default) until a human tax and legal advisor reviews the following [to be verified / configured before launch]:
1.  **Stripe Tax Activation:** To automate tax/VAT collection depending on customer location.
2.  **VAT OSS Registration:** For compliance with European Union B2C digital sales regulations.
3.  **B2B Reverse Charge:** Implementing validation mechanisms for corporate VAT numbers if we open the Service to B2B customers.
4.  **Sequential Compliant Invoicing:** Configuring Stripe to issue legally compliant, sequentially numbered PDF invoices containing our company tax details and the customer's local VAT details.
