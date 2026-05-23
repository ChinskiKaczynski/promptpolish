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
*   **PromptPolish Status:** We act as a **Data Controller** for connection data (telemetry, usage events, feedback, session cookies) because we define the purpose and means of this processing.
*   **User-Provided Prompts:** When a user inputs a custom prompt, it may contain unstructured personal or commercial data.
    *   *Our Stance:* Since we are anonymous-first, we do not intentionally solicit or link PII to an identity. We remain a Controller operating under a strict "privacy-by-design" data minimization architecture, while contractually prohibiting users from pasting PII in their input prompts.
*   **IP Address Anonymization:** For rate limiting, we salt and hash incoming IP addresses in-memory before writing them to database state. Salts must be rotated every **24 hours** to prevent these hashes from being classified as persistent "pseudonymous data" under GDPR.

### B. ePrivacy Directive (Cookie & Local Storage)
*   **Audit of Current Cookie Store:** We store a single essential cookie `owner_anonymous_id` (30 days, HttpOnly, secure, SameSite=Strict).
*   **ePrivacy Assessment:** This cookie is classified as **strictly necessary** to deliver the requested core service (retaining user ownership of their anonymous `/result/[id]` reports over multiple visits). Without this cookie, the user cannot access their private results.
*   **Consent Requirements:** Because we use only strictly necessary cookies and have zero analytical/marketing trackers active in the MVP, an active-consent Cookie Banner is **not** currently required. If analytics or marketing scripts are added, a compliant consent banner blocking script load prior to consent **must** be implemented.

---

## 3. Reference to Draft Policies

We have prepared comprehensive, modular policy drafts to map our legal and billing compliance. These documents must be read in conjunction with this roadmap:

1.  **Vendor & Data Processor Inventory:**  
    Detailed inventory of sub-processors (Stripe, Supabase, Vercel, Google Gemini API) and their roles.  
    👉 **[vendor-inventory.md](file:///d:/AI/promptpolish/docs/vendor-inventory.md)**
2.  **Refund & Cancellation Policy Draft:**  
    Defines Pro subscription pricing, self-service cancellation via Stripe Customer Portal, and our 14-day usage-restricted refund policy.  
    👉 **[refund-cancellation-policy.md](file:///d:/AI/promptpolish/docs/refund-cancellation-policy.md)**
3.  **Data Deletion Request Flow Draft:**  
    Details technical and manual right-to-erasure workflows (GDPR Art. 17) for anonymous and registered Pro users.  
    👉 **[data-deletion-flow.md](file:///d:/AI/promptpolish/docs/data-deletion-flow.md)**

---

## 4. Consolidated List of Unresolved Legal, Tax, and GDPR Questions

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
8.  **Digital Goods Withdrawal Directive:** Does our "fewer than 10 analyses" refund threshold fully comply with EU Directive 2011/83/EU? How will we obtain and record explicit prior consent at checkout to waive the standard 14-day digital goods withdrawal right once performance begins?

---

## 5. Pre-launch Checklist for Public Traffic

Prior to removing waitlists and opening the Pro Plan to public payments, the following checklist must be fully executed and recorded:

- [ ] **Professional Review:** Formal review and sign-off on `/privacy`, `/terms`, and the `docs/refund-cancellation-policy.md` by qualified legal counsel.
- [ ] **Tax Strategy Approval:** Business entity tax strategy sign-off by a certified tax advisor (resolving VAT OSS & Stripe Tax configurations).
- [ ] **Sub-processor DPAs:** Formally execute and vault Data Processing Addendums (DPAs) incorporating Standard Contractual Clauses (SCCs) with Google, Supabase, Vercel, and Stripe.
- [ ] **Data Residency Audit:** Validate that our remote database servers (Supabase) and serverless function executors (Vercel) do not route or store customer data outside the EEA without SCC coverage.
- [ ] **Consolidated Deletion Test:** Run an end-to-end simulation of an account deletion request, verifying that Stripe subscriptions cancel instantly and Supabase user records cascade-delete correctly.
