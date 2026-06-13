> [!WARNING]
> **Archived / Historical** — This document has been moved to rchive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# Data Retention & Privacy Policy â€” PromptPolish

PromptPolish is built on an anonymous-first architecture designed to respect user privacy and minimize data storage footprints. This document establishes the strict lifecycle and deletion policies for all data stored by the platform.

---

## 1. Data Classification & Deletion Lifetimes

To prevent indefinite storage of user prompts and metrics, the system implements automated retention limits for all database records:

| Data Type | Table Name | Retention Period | Deletion Mechanism | Privacy Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Anonymous Prompt Analyses** | `prompt_analyses` | **30 Days** | Daily cron purging query. | Limits long-term exposure of custom prompts. |
| **Usage & Telemetry Events** | `usage_events` | **90 Days** | Automated sliding scale cleanup. | Aggregated stats are saved; raw connection tokens are purged. |
| **User Quality Feedback** | `feedback_events` | **180 Days** | Automated monthly purging. | Retained slightly longer to analyze model refinement quality. |
| **Raw LLM Provider Payloads** | â€” | **0 Days (Never Stored)** | In-memory execution only. | Prompts are sent to the provider and never kept in vendor-facing logs. |
| **Blocked High-Risk Prompts** | â€” | **0 Days (Immediate Drop)** | Purged in backend preflights. | Raw credentials are never allowed to touch databases or persistent logs. |

---

## 2. Retention Implementation & Configurations

### 2.1. Environment Configuration Overrides
The automated deletion schedule utilizes these environment variable configurations (with pre-set defaults):
*   `RETENTION_ANONYMOUS_ANALYSIS_DAYS` (Default: `30`): Cutoff for unshared analyses.
*   `RETENTION_USAGE_EVENT_DAYS` (Default: `90`): Cutoff for usage telemetry events.
*   `RETENTION_FEEDBACK_EVENT_DAYS` (Default: `180`): Cutoff for feedback telemetry events.
*   `CRON_SECRET`: Access key to secure the API endpoint.

### 2.2. Active Shared Records Exemption
Prompt analyses with `is_share_enabled = true` and a valid `share_token` are explicitly **exempted** from the automatic 30-day purge to preserve public share links and prevent link breakage. However, any associated quality feedback records older than 180 days are still purged automatically.

---

## 3. Deletion Execution & Trigger Mechanisms

The platform supports two secure cleanup modalities:

### 3.1. Manual CLI Script (Developer trigger)
Run the manual cleanup locally or in administrative workflows:
```bash
# Preview what records will be deleted without altering database rows:
npx tsx scripts/retention-cleanup.ts --dry-run

# Run active deletion:
npx tsx scripts/retention-cleanup.ts
```

### 3.2. Scheduled Cron Job (HTTP trigger)
A secure REST endpoint is exposed for automated orchestrations (e.g. Vercel Cron):
`GET /api/cron/cleanup` or `POST /api/cron/cleanup`
*   **Header Authorization**: Enforces `Authorization: Bearer <CRON_SECRET>`.
*   **Query Options**: Supply `?dryRun=true` to preview the deletion count.

---

## 4. Cookie Lifetimes & Anonymous Session Mechanics

*   **Cookie Name**: `owner_anonymous_id`
*   **Properties**:
    *   `httpOnly`: True (prevents cross-site scripting access via JavaScript).
    *   `secure`: True (enforces delivery only over encrypted HTTPS connections).
    *   `sameSite`: `'strict'` (blocks cross-site request forgery risks).
    *   `path`: `'/'` (covers all routes).
*   **Expiration**: **30 Days** (automatically matching the maximum retention window of the anonymous analysis results).
*   **Session Purging**: If a user clears their cookies, their access to previously generated private `/result/[id]` links is permanently lost, as the server can no longer verify ownership. This is explicitly stated in the UI.

---

## 5. GDPR & Privacy Compliance Guidelines

1.  **Right to be Forgotten (Purging)**:
    *   Since all data is anonymous and resolved only via the `owner_anonymous_id` cookie, users can immediately wipe their association by clearing their browser cookies.
    *   An explicit "Delete My History" button in `/analyze` clears the client cookie and fires a `POST /api/clear-history` event to delete all database rows matching the user's `owner_anonymous_id`.
2.  **No Personal Identifiable Information (PII)**:
    *   We do not store emails, full names, usernames, or phone numbers in the database for the MVP.
    *   IP addresses are immediately salted and hashed on ingestion. Raw IP addresses are **never** logged or written to persistent storages.
