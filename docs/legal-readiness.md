# Internal Legal Readiness & Compliance Roadmap (Draft)

> [!WARNING]
> **LEGAL & TAX REVIEW REQUIRED**  
> This document and all associated policy drafts are internal engineering/product planning drafts. They do **not** constitute official legal advice or formal compliance certifications. PromptPolish **must** undergo a comprehensive audit by qualified legal counsel and tax advisors before launching public traffic from the European Union (EU) or accepting any live commercial payments. **Do not deploy paid production features or accept payments before this review is complete.**

---

## 1. Executive Summary & Core Rules

This roadmap outlines the legal and billing readiness status of PromptPolish for its transition from an **Anonymous-first MVP** to a commercial SaaS model (introducing the **Pro Plan** subscription).

To protect the platform, engineering, and our customers, we operate under these strict compliance rules:
1.  **Draft Status:** All customer-facing and internal legal content must be visibly marked as "Draft" and requiring professional review.
2.  **No Guaranteed Claims:** We do **not** claim GDPR or ePrivacy compliance as guaranteed or certified.
3.  **No Unsupported Claims:** We make no unsupported claims regarding data security, liability caps, or regulatory exemptions.
4.  **No Pre-Review Paid Deployment:** We will **not** deploy paid production features or accept live payments until formal counsel review is complete.
5.  **Strict Consistency:** All terms, privacy notices, pricing pages, and policy documents must remain fully consistent in terms of pricing, limits, and processing behaviors.

---

## 2. Core Compliance Audits

### A. GDPR & Data Controllership Assessment
*   **PromptPolish Status:** We act as a **Data Controller** for connection data (telemetry, usage events, feedback, session cookies) (preliminary assessment — legal review required).
*   **User-Provided Prompts:** When a user inputs a custom prompt, it may contain unstructured personal or commercial data.
    *   *Our Stance:* Since we are anonymous-first, we do not intentionally solicit or link PII to an identity. We remain a Controller operating under a strict "privacy-by-design" data minimization architecture, while contractually prohibiting users from pasting PII in their input prompts (preliminary assessment — legal review required).
*   **IP Address Anonymization:** For rate limiting, we salt and hash incoming IP addresses in-memory before writing them to database state. Salts must be rotated every **24 hours** to prevent these hashes from being classified as persistent "pseudonymous data" under GDPR (to be verified in code implementation).

### B. ePrivacy Directive (Cookie & Local Storage)
*   **Audit of Current Cookie Store:** We store a single essential cookie `owner_anonymous_id` (30 days, HttpOnly, secure, SameSite=Strict).
*   **ePrivacy Assessment:** This cookie is classified as **strictly necessary** to deliver the requested core service (retaining user ownership of their anonymous `/result/[id]` reports over multiple visits). Without this cookie, the user cannot access their private results (preliminary assessment — legal review required).
*   **Consent Requirements:** Current assumption: only strictly necessary cookies are used. Cookie consent requirements must be verified before public launch, especially if analytics/marketing tools are added.

---

## 3. Reference to Draft Policies

We have prepared comprehensive, modular policy drafts to map our legal and billing compliance. These documents must be read in conjunction with this roadmap:

1.  **Draft Terms of Service:**  
    Covers service parameters, account rules, cookies, acceptable use, AI disclaimer, and liability limits.  
    👉 **[terms-of-service-draft.md](./terms-of-service-draft.md)**
2.  **Draft Privacy Policy:**  
    Details email and telemetry processing, cookies, sub-processors, retention limits, and user erasure rights.  
    👉 **[privacy-policy-draft.md](./privacy-policy-draft.md)**
3.  **Draft Billing, Refund & Cancellation Policy:**  
    Outlines subscription terms, Stripe portal cancellations, failed payment grace periods, and launch tax blockers. Contains placeholders for pricing and refund policy parameters under review.  
    👉 **[billing-policy-draft.md](./billing-policy-draft.md)**
4.  **Vendor & Data Processor Inventory:**  
    Detailed inventory of sub-processors (Stripe, Supabase, Vercel, Google Gemini API) and their roles.  
    👉 **[vendor-inventory.md](./vendor-inventory.md)**
5.  **Refund & Cancellation Policy (Historical Draft):**  
    Defines the initial Pro subscription parameters and our 14-day usage-restricted refund policy.  
    👉 **[refund-cancellation-policy.md](./refund-cancellation-policy.md)**
6.  **Data Deletion Request Flow Draft:**  
    Details technical and manual right-to-erasure workflows (GDPR Art. 17) for anonymous and registered Pro users.  
    👉 **[data-deletion-flow.md](./data-deletion-flow.md)**

---

## 4. Public Page Consistency Audit Findings (Internal Engineering Observations)

> [!NOTE]
> The findings below represent internal engineering observations and code structure checks. They do not constitute formal legal certification of compliance.

An audit of the public routes and UI elements was conducted to verify copy consistency and prevent misleading claims prior to Stripe activation:

### A. App Pricing Page (`app/pricing/page.tsx`)
*   **Live Payment Claims:** No claims are made that production checkouts are live. When `STRIPE_ENABLED=false` is detected on the server, a highly visible banner is displayed: *"Beta: Bramka płatności Stripe jest wyłączona. Zakup Pro jest niedostępny — możesz testować symulację Pro po zalogowaniu."*
*   **Pricing Copy:** The Pro pricing card displays *"Cena TBD"* and swaps the purchase button for a waitlist form, preventing users from attempting payment.
*   **Feature Alignment:** The listed Pro features (500 analyses, 24k chars, Markdown/PDF exports, batch audit) align exactly with active server-side configurations in `lib/plans/config.ts`.
*   **Developer Sandbox:** A developer simulation section allows testers to toggle simulated Pro status locally. This is clearly labeled as a developer tool.

### B. App Terms Page (`app/terms/page.tsx`)
*   **Draft Notice:** The page displays an amber draft warning banner at the top, emphasizing that the document is a draft and that EU GDPR compliance is not yet legally guaranteed.
*   **Limit Alignment:** The copy states the Free Tier daily abuse limit is 3 analyses, matching the default configuration for anonymous visitors.
*   **Billing/Refund Terms:** Terms correctly refer to Stripe processing, Customer Portal cancellations, and the usage-based 14-day refund window (<10 analyses).
*   **AI Disclaimers:** Visible disclaimers are present (the service is provided "as-is", no guarantees of downstream business results, users must verify prompts).

### C. App Privacy Page (`app/privacy/page.tsx`)
*   **Draft Notice:** Includes the same amber draft warning banner.
*   **Data Processors:** Discloses Vercel, Supabase, Stripe, and Google Gemini API (processed in-memory).
*   **Cookies:** Identifies the `owner_anonymous_id` cookie and warns that clearing cache permanently deletes history links.
*   **Retention Table:** Lists matching retention schedules (30 days analyses, 90 days telemetry, 180 days feedback, tax records for invoicing).

### D. App Account Page (`app/account/page.tsx`)
*   **Beta Warning:** Displays a beta notification when `STRIPE_ENABLED=false`.
*   **Subscription Details:** Shows detailed conditional sub-sections depending on whether the subscription is active, trialing, past_due, unpaid, or simulated Pro.
*   **Portal Button:** The "Manage Billing" (`PortalButton`) component is only active if the user has an active Stripe subscription, preventing redirect loops.

---

## 5. Stripe Production Readiness Blockers Checklist

Before changing `STRIPE_ENABLED=true` in the production environment variables, the business and engineering teams must decide, configure, and verify the following items:

### A. Business and Legal Entity Configuration
- [ ] **Official Legal Entity Name:** [LEGAL ENTITY NAME TBD]
- [ ] **Physical Business Address:** [REGISTERED BUSINESS ADDRESS TBD]
- [ ] **Customer Support Channel:** [SUPPORT EMAIL TBD]
- [ ] **Privacy/Compliance Contact:** [PRIVACY CONTACT EMAIL TBD]

### B. Tax and Financial Setup
- [ ] **Primary Billing Currency:** Resolve if checkouts bill in USD, PLN, or dynamic multi-currency.
- [ ] **Stripe Tax Activation:** Determine if Stripe Tax should be enabled in the Stripe Dashboard to calculate state-specific sales tax and EU VAT dynamically.
- [ ] **VAT OSS (One-Stop Shop) Status:** Confirm if the business entity is registered under EU VAT OSS, allowing simplified EU digital goods tax reporting.
- [ ] **B2B Reverse Charge Invoicing:** Enable VAT ID collection in Stripe Checkout to automatically apply reverse charge rules for business customers if supported.
- [ ] **Sequential Invoice Numbering:** Configure Stripe Invoice templates to issue compliant sequential numbering conforming to local corporate tax audits.

### C. Policy & DPA vaulting
- [ ] **Legal Counsel Sign-off:** Obtain formal legal review and sign-off on final terms and privacy pages.
- [ ] **Execute Sub-processor DPAs (preliminary assessment — legal review required):** Formally execute Data Processing Addendums containing standard contractual clauses (SCCs) with:
  - [ ] Stripe, Inc. (data transfer and retention terms must be confirmed).
  - [ ] Supabase, Inc. (database hosting and backups geo-confinement to be verified in settings / DPA).
  - [ ] Vercel Inc. (serverless region settings must be verified in project configuration).
  - [ ] Google Cloud / AI Provider (Gemini API logging/training terms and data residency must be verified in the provider agreement).

### D. Technical Deployment Checklist
- [ ] **Production Price ID:** Configure `STRIPE_PRICE_ID_PRO` with the live production recurring product ID from the Stripe dashboard.
- [ ] **Production API Keys:** Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` with live production credentials.
- [ ] **Production Webhook Registration:** Register the live API URL (`https://promptpolish.com/api/webhooks/stripe`) in the production Stripe Dashboard.
- [ ] **TLS Certificate Verification:** Confirm the production host enforces HTTPS and has valid SSL/TLS certificates.
- [ ] **Webhook Event Filtering:** Configure Stripe webhook settings to send *only* required events (`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`).
- [ ] **IP Anonymization Telemetry:** Test that the daily salt rotation is active and telemetry logging remains 100% PII-free.

### E. Monitoring and Operations
- [ ] **Rollback Owner:** Designate a specific engineer responsible for executing rollbacks if webhook sync fails or database locks occur.
- [ ] **Webhook Failure Alerts:** Setup Slack, email, or monitoring dashboard alarms for server errors on the `/api/webhooks/stripe` endpoint (e.g., catching 400 or 500 status codes).
- [ ] **Support Runbook:** Distribute support runbooks on manual subscription cancellation, refund triggers, and customer data erasure requests.

---

## 6. Consolidated List of Unresolved Legal, Tax, and GDPR Questions

The following unresolved questions are critical blockers that **must** be resolved by professional legal and tax counsel before launch:

### Tax & Billing Questions
1.  **Stripe Tax Activation:** Should we enable **Stripe Tax** to automate sales tax/VAT calculations globally, and how will we handle transaction fees associated with this service?
2.  **VAT OSS Registration:** If selling to European B2C customers, are we registered under the VAT One-Stop Shop (OSS) scheme (with reporting handled via our Polish or EU business entity), or do we qualify for a micro-business exemption?
3.  **B2B Reverse Charge Compliance:** How will we validate corporate tax/VAT IDs at checkout to automate reverse-charge invoicing for B2B transactions?
4.  **Sequential Invoicing:** How will we configure Stripe to automatically generate and email legally compliant PDF invoices that meet local EU formatting guidelines?

### GDPR & Privacy Questions
5.  **Gemini API Data Residency & Training:** Does our Google Gemini API deployment guarantee that all prompt data is processed strictly within the European Economic Area (EEA), and do the commercial terms explicitly prohibit Google from saving prompt payloads for human review or model training?
6.  **Stripe Invoicing Retention vs. Right to Erasure:** Does retaining customer personal data on Stripe billing invoices for tax compliance (legally mandated for 5–7 years) comply with GDPR Article 17(3)(b) when a user requests complete account deletion?
7.  **IP Telemetry Log Retention:** Are we fully purging raw IP addresses and telemetry logs in Vercel/Supabase within the 90-day retention window, or must we reduce log retention to under 30 days or mask the final IP octets?
8.  **Digital Goods Withdrawal Directive:** Does our proposed usage-based refund threshold fully comply with EU Directive 2011/83/EU? How will we obtain and record explicit prior consent at checkout to waive the standard 14-day digital goods withdrawal right once performance begins?

---

## 7. Pre-launch Checklist for Public Traffic

Prior to removing waitlists and opening the Pro Plan to public payments, the following checklist must be fully executed and recorded:

- [ ] **Professional Review:** Formal review and sign-off on `/privacy`, `/terms`, and the `docs/billing-policy-draft.md` by qualified legal counsel.
- [ ] **Tax Strategy Approval:** Business entity tax strategy sign-off by a certified tax advisor (resolving VAT OSS & Stripe Tax configurations).
- [ ] **Sub-processor DPAs:** Formally execute and vault Data Processing Addendums (DPAs) incorporating Standard Contractual Clauses (SCCs) with Google, Supabase, Vercel, and Stripe.
- [ ] **Data Residency Audit:** Validate that our remote database servers (Supabase) and serverless function executors (Vercel) do not route or store customer data outside the EEA without SCC coverage.
- [ ] **Consolidated Deletion Test:** Run an end-to-end simulation of an account deletion request, verifying that Stripe subscriptions cancel instantly and Supabase user records cascade-delete correctly.
