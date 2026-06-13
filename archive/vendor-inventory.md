> [!WARNING]
> **Archived / Historical** — This document has been moved to rchive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# Vendor & Data Processor Inventory (Draft)

> [!WARNING]
> **LEGAL & COMPLIANCE REVIEW REQUIRED**  
> This vendor and sub-processor inventory is a draft prepared for internal compliance auditing of the PromptPolish SaaS platform. It does **not** guarantee GDPR compliance or constitute a certified Article 30 (Record of Processing Activities) registry. This document **must** be audited and approved by qualified legal counsel prior to launching the platform for public or paid commercial traffic in the European Union (EU). **Do not deploy paid production or collect live user data before this review is finalized.**

---

## 1. Overview of Data Flow & Roles

PromptPolish operates as an anonymous-first prompt optimization platform.
*   **For Anonymous Users:** We collect and process connection telemetry, a strictly necessary cookie (`owner_anonymous_id`), salted and hashed IP addresses, and prompt payloads.
*   **For Registered / Pro Users:** We also process authenticated account identifiers (user IDs, emails) and subscription/billing metadata synced via payment webhooks.

In this architecture, PromptPolish acts as the **Data Controller** for core account, session, and telemetry data. Our hosting, database, payment, and AI infrastructure providers operate as **Data Processors** or **Sub-processors**.

---

## 2. Active Vendor Inventory

Below is the inventory of third-party vendors that receive, store, or process user data on behalf of PromptPolish:

| Vendor | Role & Purpose | Data Processed | Data Residency & Region | Compliance Basis & DPAs |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel Inc.** | Web Hosting & Serverless Platform | Edge telemetry, request headers, serverless function invocation logs, IP addresses. | Global CDN with European edge endpoints; serverless functions configured in EU regions. | Standard Data Processing Addendum (DPA) incorporating Standard Contractual Clauses (SCCs). |
| **Supabase Inc.** | Database & Backend Infrastructure | User account IDs, email addresses, salted and hashed IP addresses (in-memory rate limiting), anonymous/Pro prompt analyses, usage events, and billing state. | Dedicated AWS Postgres instance provisioned in an EU region (e.g., `eu-central-1` Frankfurt). | Supabase Data Processing Addendum (DPA) and SCCs. Backups must be geographically confined to the EU. |
| **Stripe, Inc.** | Payment Processing & Invoicing | User names, emails, billing addresses, credit card tokens (processed securely off-site), transaction amounts, and subscription lifecycle states. | Stripe payments infrastructure operates globally. | Stripe Data Processing Addendum (DPA) and SCCs. Stripe handles PCI-DSS compliance directly (PromptPolish server never touches raw credit card numbers). |
| **Google Cloud / Gemini API** | Artificial Intelligence Provider | User-supplied prompt payloads and structured analysis configuration details. | Serverless API routes. *Must verify routing options to guarantee EU data residency.* | Standard commercial Google Cloud/Workspace DPA. **Crucial:** Commercial API terms must guarantee that prompt inputs are processed in-memory and are **never** stored for human review or model training. |

---

## 3. Unresolved GDPR, Legal & Technical Questions

The following compliance gaps and technical verification items must be resolved by our engineering and legal teams before commercial launch:

1.  **Google Gemini API Data Residency & Training Policy:**
    *   *Question:* Are prompt payloads processed strictly within the European Economic Area (EEA) (e.g., Google's Frankfurt or Belgium data centers)?
    *   *Impact:* If payloads are routed to US-based LLM clusters during high-traffic failover, we must execute Standard Contractual Clauses (SCCs) and update the Privacy Policy to disclose international data transfers. We must formally verify that Google's developer API agreement guarantees **no logging of prompts for model training**.
2.  **IP Address Salt Rotation & Anonymization:**
    *   *Question:* Are the salts used to hash IP addresses for rate limiting rotated frequently enough (e.g., every 24 hours) to prevent the hashes from being classified as persistent "pseudonymous data" under GDPR?
    *   *Impact:* If salts do not rotate, the hashes can be mapped back to raw IPs by computing the hash space, which makes them personal data subject to GDPR deletion rights. Daily salt rotation ensures true anonymity for historical telemetry logs.
3.  **DPA Execution Checklists:**
    *   *Question:* Have we formally signed and recorded the DPAs with Vercel, Supabase, Stripe, and Google Cloud in our corporate compliance vault?
    *   *Impact:* Under GDPR Art. 28, a controller must have written, binding contracts (DPAs) with all processors. Operating without executed DPAs is a direct regulatory violation.
4.  **Database Backup Geolocation:**
    *   *Question:* Are Supabase database backups stored securely within the EEA, or are they replicated globally for disaster recovery?
    *   *Impact:* We must configure Supabase to restrict automated backup replication strictly to EU-based storage buckets to prevent accidental cross-border transfers.
