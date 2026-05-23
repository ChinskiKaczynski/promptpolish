# Internal Legal Readiness & Compliance Roadmap (Draft)

This document outlines the core privacy, regulatory, and vendor management questions that the product engineering and legal teams must address prior to opening `PromptPolish` to public traffic from the European Union (EU) or applying strict GDPR compliance frameworks.

---

## 1. GDPR & Data Controllership Assessment

### A. Role Definition
*   **PromptPolish Status:** We act as a **Data Controller** for connection data (telemetry, usage events, feedback, session cookies) because we define the purpose and means of this processing.
*   **User-Provided Prompts:** When a user inputs a custom prompt, it may contain unstructured personal or commercial data.
    *   *Question for Counsel:* Does PromptPolish act as a **Processor** or **Controller** for unstructured data pasted into the prompt window?
    *   *Recommendation:* Since we are anonymous-first, we do not intentionally solicit or link PII to an identity. We should remain a Controller operating under a strict "privacy-by-design" data minimization architecture, while contractually prohibiting users from pasting PII.

### B. Salting & Hashing IP Addresses
*   **Implementation:** For rate limiting, we salt and hash incoming IP addresses in-memory before writing them to database state.
*   *Verification Required:* Under GDPR, hashed IP addresses might still be considered pseudonymous data rather than completely anonymous data if the salt is persistent or the hash can be reverse-engineered by mapping all possible IP spaces (which is computationally trivial for IPv4).
*   *Action Item:* Ensure salts are rotated regularly (e.g. daily) so that hashes cannot be mapped long-term, rendering historical connection records fully anonymous.

---

## 2. Cookie & Local Storage Audit

Under the ePrivacy Directive ("Cookie Law"), any non-essential cookies require prior active consent.

*   **Audit of Current Cookie Store:**
    *   `owner_anonymous_id` (30 Days, httpOnly, secure, SameSite=Strict).
*   **ePrivacy Assessment:**
    *   *Question:* Is the `owner_anonymous_id` cookie classified as "strictly necessary"?
    *   *Analysis:* Yes, it is strictly necessary to deliver the requested core service (retaining user ownership of their anonymous `/result/[id]` reports over multiple visits). Without this cookie, the user cannot access their private results.
    *   *Action Item:* If we add any analytic cookies (e.g., Google Analytics, Vercel Speed Insights) or marketing tracking, we **MUST** implement a compliant, active-consent Cookie Banner blocking script load prior to consent. For MVP, we use only the essential connection cookie, so no cookie banner is active.

---

## 3. Vendor Sub-processor Assessment

All third-party services that receive user payloads must be bound by a **Data Processing Addendum (DPA)** with standard contractual clauses (SCCs) for cross-border data transfer if processed outside the EEA.

### A. AI Model Provider (Google Cloud / Google Gemini API)
*   **Data Processed:** User-supplied prompt payloads and structured analysis configurations.
*   **Data Residency:** Does the Google Gemini API route traffic through EU-based data centers (e.g., `europe-west3` Frankfurt / `europe-west1` Belgium)?
*   *Action Item:* Ensure the production API configuration enforces European data residency options if available, and that the commercial API terms explicitly guarantee that prompts are **not** saved for human review or model training.

### B. Database Provider (Supabase / Postgres)
*   **Data Processed:** Anonymous prompt analyses, salted IP hashes, user feedback, usage timestamps.
*   **Data Residency:** Supabase database must be provisioned in an EU region (e.g., Frankfurt or Ireland).
*   *Action Item:* Sign the Supabase DPA and confirm backups are geographically isolated to the EU.

### C. Hosting Provider (Vercel)
*   **Data Processed:** Edge telemetry, request routing, serverless function invocation logs.
*   *Action Item:* Sign Vercel's standard Data Processing Addendum.

---

## 4. Deletion & Right to Be Forgotten Verification

Under GDPR Art. 17, users have the right to request deletion of their personal data.

*   **Current MVP Mechanism:**
    *   Since analyses are anonymous, clearing browser cookies effectively separates the user from the database entry.
    *   However, we also provide a "Delete History" option which triggers `POST /api/clear-history` to purge the matching `owner_anonymous_id` database records.
*   *Legal Validation:* Does this self-serve purging process fully satisfy Art. 17 compliance for anonymous/pseudonymous systems? (Usually yes, as it is a complete, irreversible hard-delete of all associated data rows).

---

## 5. Pre-launch Checklist for Public Traffic

1.  [ ] **DPA Execution:** Execute DPAs with Google, Supabase, and Vercel.
2.  [ ] **Legal Review:** Have counsel audit the final `/privacy` and `/terms` texts based on local Polish/EU e-commerce regulations.
3.  [ ] **Security Audit:** Validate that the sensitive-data preflight regexes are actively updated in the backend to prevent credential leakage.
4.  [ ] **Data Residency Validation:** Run a trace check confirming that serverless function regions and database servers do not replicate data to jurisdictions outside the EEA without SCC coverage.
