# Private Beta Launch Plan - PromptPolish

This document outlines the operational plan for the PromptPolish private beta. It defines the parameters, goals, success metrics, and safety boundaries to ensure a controlled and informative testing phase.

---

## 1. Goal of the Beta
The primary objective of the private beta is to validate the core user experience, prompt optimization logic, and technical stability of PromptPolish under real-world usage patterns without exposing the app to commercial load or billing complexities.

Specifically, we aim to:
* **Evaluate Prompt Optimization Quality**: Confirm that the LLM-generated improved prompts are perceived as higher quality and more useful than the originals by actual users.
* **Verify System Reliability**: Identify any runtime errors, latency issues, or structural parsing failures in the OpenRouter API integration.
* **Observe Abuse Controls**: Validate that rate limits and sensitive data filters function correctly in a production setting.
* **Collect User Feedback**: Gather qualitative insights to guide future product features (e.g., history, export value additions).

---

## 2. Cohort Parameters
* **Target Testers**: Prompt engineers, AI consultants, copywriters, developers, and marketers who write prompts daily as part of their work.
* **Tester Count**: **5–10 active testers**.
* **Duration**: **3–7 days**.

---

## 3. Scope & Configuration Safeguards

> [!IMPORTANT]
> **Stripe & Billing Remain Disabled**:
> Throughout the private beta, `STRIPE_ENABLED=false` remains strictly enforced. 
> * The checkout and billing portal endpoints (`/api/billing/checkout` and `/api/billing/portal`) will return a secure early `403 Forbidden` response.
> * Database schemas do not require Stripe subscription tables to be present; queries to these tables are skipped backend-side.
> * Users are defaulted to the free tier (unless simulated as Pro via admin flags).

---

## 4. Success Criteria
The beta will be deemed successful if the following thresholds are met:
- [ ] **Engagement**: At least 5 unique testers perform at least 2 prompt audits each.
- [ ] **Utility (Copy Rate)**: Overall prompt copy rate (improved prompt copied) is **$\ge$ 40%**.
- [ ] **User Feedback**: Positive rating ratio (upvotes vs. total feedback events) is **$\ge$ 70%** (minimum 5 total feedback submissions).
- [ ] **Reliability**: Completion rate is **$\ge$ 95%** (failure rate under 5%), with zero unhandled system crashes.
- [ ] **Safety & Privacy**: Zero leaks of raw prompts, API keys, or user identities in server telemetry logs.

---

## 5. Stop Criteria (Abort Signals)
The beta must be immediately paused or terminated if any of the following occur:
* **Cost Overrun**: AI provider costs exceed \$50 within 24 hours (due to unexpected traffic, bot activity, or rate limit bypasses).
* **High Failure Rate**: The prompt analysis failure rate exceeds **10%** over a 12-hour window due to persistent API timeouts or provider drops.
* **Data Leakage**: Detection of sensitive data (passwords, live API keys, private emails) stored in database telemetry or logs.
* **Exploit/Vulnerability**: Any authenticated or anonymous user accesses `/admin/metrics` or other restricted endpoints.

---

## 6. What NOT to Test Yet
Testers should be instructed that the following features are not ready or are out of scope for this private beta:
1. **Subscriptions & Billing**: All upgrade flows, Stripe checkouts, or premium payment modals are simulated or disabled.
2. **Batch / Bulk Processing**: The system is designed for single-prompt auditing only.
3. **Collaboration & Teams**: Shared folders, teams, or collaborative workspaces are out of scope.
4. **Persistent History**: The history is temporary, tied to cookies/local sessions, and will clear if browser storage is wiped.
5. **Alternative AI Models**: Prompt optimization is routed exclusively through the designated fallback profile (`openrouter-deepseek-v4-flash`).
