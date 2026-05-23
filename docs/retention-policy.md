# Data Retention & Privacy Policy — PromptPolish

PromptPolish is built on an anonymous-first architecture designed to respect user privacy and minimize data storage footprints. This document establishes the strict lifecycle and deletion policies for all data stored by the platform.

---

## 1. Data Classification & Deletion Lifetimes

To prevent indefinite storage of user prompts and metrics, the system implements automated retention limits for all database records:

| Data Type | Table Name | Retention Period | Deletion Mechanism | Privacy Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Anonymous Prompt Analyses** | `prompt_analyses` | **30 Days** | Daily cron purging query. | Limits long-term exposure of custom prompts. |
| **Usage & Telemetry Events** | `usage_events` | **90 Days** | Automated sliding scale cleanup. | Aggregated stats are saved; raw connection tokens are purged. |
| **User Quality Feedback** | `usage_events` (feedback) | **180 Days** | Automated monthly purging. | Retained slightly longer to analyze model refinement quality. |
| **Raw LLM Provider Payloads** | — | **0 Days (Never Stored)** | In-memory execution only. | Prompts are sent to the provider and never kept in vendor-facing logs. |
| **Blocked High-Risk Prompts** | — | **0 Days (Immediate Drop)** | Purged in backend preflights. | Raw credentials are never allowed to touch databases or persistent logs. |

---

## 2. Cookie Lifetimes & Anonymous Session Mechanics

*   **Cookie Name**: `owner_anonymous_id`
*   **Properties**:
    *   `httpOnly`: True (prevents cross-site scripting access via JavaScript).
    *   `secure`: True (enforces delivery only over encrypted HTTPS connections).
    *   `sameSite`: `'strict'` (blocks cross-site request forgery risks).
    *   `path`: `'/'` (covers all routes).
*   **Expiration**: **30 Days** (automatically matching the maximum retention window of the anonymous analysis results).
*   **Session Purging**: If a user clears their cookies, their access to previously generated private `/result/[id]` links is permanently lost, as the server can no longer verify ownership. This is explicitly stated in the UI.

---

## 3. GDPR & Privacy Compliance Guidelines

1.  **Right to be Forgotten (Purging)**:
    *   Since all data is anonymous and resolved only via the `owner_anonymous_id` cookie, users can immediately wipe their association by clearing their browser cookies.
    *   An explicit "Delete My History" button in `/analyze` clears the client cookie and fires a `POST /api/clear-history` event to delete all database rows matching the user's `owner_anonymous_id`.
2.  **No Personal Identifiable Information (PII)**:
    *   We do not store emails, full names, usernames, or phone numbers in the database for the MVP.
    *   IP addresses are immediately salted and hashed on ingestion. Raw IP addresses are **never** logged or written to persistent storages.
