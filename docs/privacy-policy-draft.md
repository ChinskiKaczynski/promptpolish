# Privacy Policy (Draft)

> [!WARNING]
> **DRAFT FOR LEGAL REVIEW**  
> This document is a draft prepared for the PromptPolish SaaS platform to assist in legal and billing readiness. It does **not** constitute official legal advice or formal compliance certification. This draft **must** be formally reviewed, modified, and signed off by certified legal counsel prior to launching the platform for public or paid commercial traffic in the European Union (EU) or other jurisdictions. **Do not deploy paid production features or accept payments before this review is complete.**

Last Updated: June 4, 2026

PromptPolish ("we", "us", or "our") operates the PromptPolish SaaS platform. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and retain your data when you use our website, application, APIs, and associated services (collectively, the "Service").

PromptPolish is designed with a **privacy-by-design** and data minimization approach, featuring an anonymous-first user experience.

---

## 1. What Data We Collect and Why

### A. Anonymous Session Data
*   **Identifier Cookie:** If you use the Service without logging in, we generate a unique, random connection identifier and store it in an essential browser cookie named `owner_anonymous_id` (expires in 30 days, configured as `httpOnly`, `secure`, and `sameSite=Strict`).
*   **Purpose:** This cookie is strictly necessary to link your browser to the analyses you run, allowing you to access and manage your private reports (`/result/[id]`) over multiple visits. If you delete this cookie, you will lose access to your results.

### B. Registered User Account Data
*   **Email & Profile:** If you register for an account (via Supabase Auth), we collect your email address, unique account ID, and display name (if provided).
*   **Purpose:** To manage your account authentication, verify your subscription status, and sync your prompt analysis history across devices.

### C. Prompt Inputs and Optimized Outputs
*   **Data Stored:** We store the raw text prompts you submit for optimization and the resulting diagnosis, scoring, and optimized outputs in our database.
*   **Purpose:** To present your analysis results and history.
*   **Retention:** Anonymous prompt analyses are automatically deleted after **30 days**. Registered users' prompt history is kept until manually cleared or until the account is deleted.

### D. Billing and Transaction Metadata
*   **Data Processed:** When you subscribe to the Pro Plan, our payment processor (Stripe) collects billing details, credit card tokens, names, and billing addresses. We receive and store transaction metadata (Stripe Customer ID, subscription status, active/unpaid state, start/end dates).
*   **No Credit Cards:** We do **not** store or see your raw credit card numbers or security codes.

### E. Usage Events and Telemetry
*   **Metrics Tracked:** We collect click logs, page views, feedback votes (upvotes/downvotes), export events (Markdown/PDF), and performance metrics.
*   **IP Anonymization:** For rate limiting and security, IP addresses are salt-and-hashed in-memory immediately upon ingestion. Raw IP addresses are **never** logged to persistent storage. Salts are rotated every **24 hours** to prevent long-term tracking.

---

## 2. Third-Party Service Providers (Sub-processors)
We share data with the following vendors to deliver the Service. [PRELIMINARY ASSESSMENT — legal review required to verify if DPAs/SCCs have been fully executed with each vendor]:

*   **Supabase Inc. (Backend & Database):** Stores user profiles, authentication records, active subscription state, and prompt analysis history. Database hosting location [to be verified in vendor settings / DPA — e.g. whether restricted to servers within the European Economic Area (EEA)].
*   **Stripe, Inc. (Payment Processing):** Handles payment checkout, billing details, invoicing, and subscription renewals. Stripe maintains PCI-DSS compliance [Stripe invoice data retention and tax compliance terms must be confirmed].
*   **Vercel Inc. (Web Hosting & Serverless):** Hosts our front-end and serverless API endpoints. Invocation logs and edge telemetry are processed globally via Vercel's CDN [serverless region settings must be verified in project configuration].
*   **OpenRouter / Google Gemini API (AI Provider):** Processes prompt inputs to evaluate and generate optimized prompts. [AI provider logging/training terms and data residency must be verified in the provider agreement before launch].

---

## 3. Data Retention and Deletion Schedule
To minimize our data footprint, we enforce the following automated deletion schedules:

*   **Anonymous Prompt Analyses:** Automatically purged **30 days** after generation via database scheduler.
*   **Usage & Telemetry Logs:** Purged automatically after **90 days**.
*   **Upvote / Downvote Feedback Events:** Purged after **180 days**.
*   **Active Public Shares:** Prompts with active share links (`is_share_enabled = true`) are **exempt** from the 30-day purge to prevent link breakage. They remain active until the user disables the share link or manually deletes the analysis.
*   **Exported Files:** Generated PDF/Markdown files are compiled on-the-fly or cached temporarily in server memory and are not stored permanently.

---

## 4. User Rights and Right to Erasure (RODO/GDPR Art. 17)
You have the right to access, rectify, or erase your data at any time.

*   **Anonymous Users:** You can delete all your stored history and analyses immediately by clicking the **"Clear History"** button in the dashboard, which clears your browser cookie and issues a hard delete for matched database rows. Alternatively, clearing cookies disassociates you from the data immediately.
*   **Registered Users:** You can permanently delete your account through your Settings page. This triggers:
    1.  Instant cancellation of any active Stripe subscription.
    2.  Kaskadowe (cascading) hard delete of all profile data, prompt history, and telemetry logs in Supabase database.
    *   *Stripe Invoice Exception:* Legally required invoicing data is retained securely on Stripe [Stripe retention duration for invoicing under tax compliance laws must be confirmed].
*   **Manual Requests:** You can submit a manual deletion request by emailing [PRIVACY CONTACT EMAIL TBD] or [SUPPORT EMAIL TBD]. We will verify ownership and process the deletion within the legally required timeline.

---

## 5. Contact Information (Placeholder)
If you have questions about this Privacy Policy or our data practices, please contact us at:
*   **Privacy Coordinator:** [PRIVACY CONTACT EMAIL TBD]
*   **Support Email:** [SUPPORT EMAIL TBD]
*   **Mailing Address:** [LEGAL ENTITY NAME TBD], [REGISTERED BUSINESS ADDRESS TBD]
