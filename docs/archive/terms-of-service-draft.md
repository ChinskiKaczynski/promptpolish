> [!WARNING]
> **Archived / Historical** — This document has been moved to archive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# Terms of Service (Draft)

> [!WARNING]
> **DRAFT FOR LEGAL REVIEW**  
> This document is a draft prepared for the PromptPolish SaaS platform to assist in legal and billing readiness. It does **not** constitute official legal advice or formal compliance certification. This draft **must** be formally reviewed, modified, and signed off by certified legal counsel prior to enabling paid production transactions. **Do not deploy paid production features or accept real payments before this review is complete.**

Last Updated: June 4, 2026

Welcome to **PromptPolish**. These Terms of Service ("Terms") govern your access to and use of PromptPolish, including our website, application, APIs, and any other services provided by us (collectively, the "Service").

By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.

---

## 1. Description of Service
PromptPolish is a software-as-a-service (SaaS) application designed to audit, evaluate, score, and optimize text instructions ("prompts") directed toward Large Language Models (LLMs). The Service provides numerical scores, diagnoses weaknesses, and provides improved versions of inputs.

---

## 2. Account Registration and Security
*   **Anonymous Access:** Users can access basic auditing capabilities without creating an account.
*   **Registered Accounts:** Accessing features like search/filtering history, favorites, or paid tiers requires creating a user account via our authentication provider (Supabase Auth).
*   **Account Responsibility:** If you register an account, you are solely responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
*   **Age Limitation:** The Service is intended solely for users who are eighteen (18) years of age or older, or the age of majority in your jurisdiction.

---

## 3. Anonymous-First Flow and Localized History
*   **Session Cookies:** For anonymous (unauthenticated) users, your association with optimized prompts and reports is maintained strictly via an essential cookie (`owner_anonymous_id`) stored locally in your browser.
*   **Browser Cookie Erasure Warning:** If you clear your browser cookies, reset your browser cache, or change devices, your link to previously generated private results (`/result/[id]`) is permanently lost. PromptPolish does not have the technical ability to retrieve or restore access to anonymous data once the local identifier cookie is deleted.
*   **Automatic Deletion:** Unshared anonymous prompt analyses are automatically hard-deleted from our databases after **30 days**.

---

## 4. Paid Pro Subscription
*   **Subscription Tier:** The Service offers a premium tier ("Pro Plan") providing higher usage limits (up to 500 prompt analyses per month), extended input lengths (up to 24,000 characters), report exports (Markdown/PDF), and batch auditing tools.
*   **Pricing:** Subscription rates are billed on a monthly recurring basis ([PRIMARY CURRENCY AND PRICE TBD â€” requires pricing/tax decision]).
*   **Automatic Renewal:** Your subscription will automatically renew at the end of each billing cycle unless cancelled prior to renewal.

---

## 5. Billing via Stripe
*   **Payment Processor:** All payment processing, invoicing, and subscription lifecycle management is handled securely off-site by **Stripe, Inc.** using Stripe Checkout.
*   **Payment Information:** PromptPolish does not store or process credit card numbers or other raw billing credentials. All payment details are processed under Stripe's secure infrastructure (PCI-DSS compliant).
*   **Invoicing:** Stripe will generate and email invoices to the email address associated with your subscription.

---

## 6. Subscription Cancellation
*   **Self-Service:** You can cancel your subscription at any time via the **Stripe Customer Portal**, accessible from your Account Settings.
*   **Access Retention:** Upon cancellation, your subscription remains active until the end of the current paid billing period (`cancel_at_period_end = true`). No further charges will be made.
*   **Downgrade:** At the end of the billing period, your account automatically degrades to the Free Plan, and standard Free Tier usage limits and data retention policies will apply.

---

## 7. Refund Policy (Placeholder)
*   **[REFUND POLICY TBD â€” legal review required]**
*   *Possible policy under review:* 14-day refund window with usage threshold. Must be reviewed for EU consumer law before publication. Under this proposed option: refunds would only be valid if the user has consumed fewer than 10 prompt analyses during the billing cycle for which the refund is requested, to offset direct API infrastructure costs. If 10 or more analyses have been processed, the subscription would be non-refundable.
*   **Submission:** Refund requests must be sent to [SUPPORT EMAIL TBD] for processing.
*   *Legal Disclaimer Note:* This refund policy must be reviewed against local consumer protection laws (e.g., EU Digital Goods Withdrawal rights) where prior consent is obtained to waive withdrawal rights upon performance commencement.

---

## 8. Acceptable Use Policy
You agree not to use the Service to:
*   Submit or optimize any prompts that contain illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable content.
*   Submit or paste sensitive personal data (PII), medical records, financial details, passwords, API keys, or third-party proprietary trade secrets.
*   Circumvent or attempt to circumvent rate limits, user quotas, or IP-based abuse controls.
*   Engage in automated scraping, harvesting, or bulk execution of the prompt analyzer without prior written authorization.
*   Conduct any DoS/DDoS attacks, network interference, or security vulnerability scans.

---

## 9. AI-Generated Output Disclaimer
*   **Inherent AI Risks:** PromptPolish utilizes third-party artificial intelligence engines (OpenRouter / Google Gemini API) to evaluate and improve prompts. You acknowledge that AI outputs can sometimes be incorrect, incomplete, or contain hallucinations (factually incorrect claims).
*   **No Guarantee of Quality:** We do **not** guarantee that optimized prompts will improve performance, increase accuracy, or prevent errors in your downstream LLM integrations. The outputs are suggestions, and prompt engineering is an empirical science.
*   **User Responsibility:** You are solely responsible for testing, validating, and approving any optimized prompts in your own development and production environments prior to commercial use.

---

## 10. Limitation of Liability (Placeholder)
To the maximum extent permitted by applicable law:
*   PromptPolish and its affiliates, officers, employees, and suppliers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, or loss of data, arising out of your access to or use of the Service.
*   In no event shall our aggregate liability for all claims related to the Service exceed the total amount paid by you to PromptPolish for the Service in the twelve (12) months preceding the event giving rise to liability.

---

## 11. Termination
We reserve the right to suspend or terminate your access to the Service (including your account and subscriptions) at our sole discretion, without notice, if we believe you have violated these Terms or engaged in conduct harmful to the Service or other users.

---

## 12. Governing Law
These Terms shall be governed by and construed in accordance with the laws of [GOVERNING LAW JURISDICTION TBD â€” requires legal decision], without regard to its conflict of law principles.

---

## 13. Contact Information (Placeholder)
For support, legal notices, or feedback, please contact us at:
*   **Support Email:** [SUPPORT EMAIL TBD]
*   **Legal Inquiries:** [SUPPORT EMAIL TBD]
*   **Business Address:** [LEGAL ENTITY NAME TBD], [REGISTERED BUSINESS ADDRESS TBD]
