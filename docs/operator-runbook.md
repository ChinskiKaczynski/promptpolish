# Operator Runbook — PromptPolish

This runbook details diagnostic criteria, containment procedures, rollback paths, and escalation protocols for infrastructure operations, billing systems, and data compliance within PromptPolish.

---

## 1. Incident Quick-Reference Matrix

| Incident Type | Severity | First Checks | Mitigation Action | Escalation Path | Rollback Trigger |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **Provider/AI Gateway Failure** | **HIGH** | Check Vercel logs for `[PROVIDER_ERROR]`. Verify Google Gemini API availability. | Fail gracefully; show localized user errors. | Lead AI Engineer / Platform Ops | Failures > 5% over 15m |
| **Supabase/Database Outage** | **CRITICAL** | Test connection using Supabase Console. Check RLS violations or connection pool limits. | Gracefully disable login & history views. Display maintenance banner. | Database Admin / Supabase Support | API crash or persistent 5xx |
| **Stripe Checkout Failure** | **HIGH** | Confirm environment `STRIPE_ENABLED` and check client console errors. Verify price ID bindings. | Verify test-mode vs production key status. Disable Stripe checks in settings. | Billing Engineer | Any live payment failure |
| **Stripe Webhook Failure** | **HIGH** | Check Vercel logs for webhook ingestion errors. Check Stripe webhooks log. | Manually re-send failed events from Stripe Console. | Billing Engineer | Database locks / 500 status |
| **Entitlement Mismatch** | **HIGH** | Query `user_profiles` schema. Check webhook logs for downgrade/upgrade ingestion errors. | Update database plan mapping. Revoke active subscription permissions on Stripe. | Support Team / Lead DB Admin | Unauthorized PDF export access |
| **AI Cost / API Usage Spike** | **HIGH** | Monitor Gemini daily usage charts. Check database `usage_events` telemetry. | Temporarily lower rate limits or implement temporary endpoint rate gating. | Platform Ops / Business Owner | Cost threshold breach |
| **Suspected Secret Leakage** | **CRITICAL** | Inspect recent commits, client JS bundles, public Vercel route headers, and database logs. | Instantly rotate keys. Revoke compromised credentials. | Security Response Lead | Any confirmed secret exposure |
| **Private Result Exposure** | **CRITICAL** | Audit result ownership cookies, RLS policies, and `/api/export` auth route checks. | Disable public share routes or restrict access to `/result` dashboard endpoints. | Lead Developer / SecOps | Unauthorized metadata leakage |

---

## 2. Standard Incident Response Playbooks

### Playbook-01: Provider/AI Failure
*   **Symptoms:** User prompt analysis requests hang or return instant error alerts. Console logs show `[PROVIDER_ERROR]` with status codes (e.g. 429, 502, 503, 401).
*   **What to Check:**
    1. Verify Gemini service availability.
    2. Check Vercel serverless function logs to locate provider response payloads.
    3. Confirm `GOOGLE_GENERATIVE_AI_API_KEY` is correctly mapped and has non-zero credits.
*   **Safe User-Facing Behavior:** The client UI must fail gracefully, showing Polish/English localized error banners indicating temporary provider unavailability without exposing raw API stack traces.
*   **Escalation:** Contact the Lead AI Engineer or Platform Ops if keys are rejected.

### Playbook-02: Supabase/Database Outage
*   **Symptoms:** Users cannot sign up, log in, view prompt histories, save favorites, or complete checkout syncs. Application returns persistent HTTP `5xx` errors.
*   **What Breaks:**
    *   Result Access: Anonymous visitors cannot save results, and registered users cannot load their private results dashboard.
    *   History/Account: Dashboard lists return empty states or database connection errors.
*   **Mitigation:** 
    *   Deploy a temporary maintenance page via Vercel edge configs to halt write traffic.
    *   Check for Supabase resource exhaustion (connection pooling limits or disk space alerts) in the Supabase console.
*   **Rollback:** Revert database schemas to the last stable migration if a schema migration locked tables.

### Playbook-03: Stripe Checkout Failure
*   **Symptoms:** Users click upgrade buttons on `/pricing` and receive error alerts or redirect failures.
*   **What to Check:**
    1. Verify if `STRIPE_ENABLED` is set to `true` (staging) or `false` (production default).
    2. Check Stripe dashboard logs to see if checkouts are rejected for invalid price IDs.
    3. Test connection in Stripe test-mode vs production. Confirm that no production price credentials are used on sandbox domains.
*   **What Not to Expose:** Never print raw Stripe secret keys or internal customer identifiers to the client console.
*   **Mitigation/Rollback:** Disable checkout redirections instantly by setting `STRIPE_ENABLED=false` and redeploying.

### Playbook-04: Stripe Webhook Failure
*   **Symptoms:** Stripe logs show failed delivery attempts to `/api/webhooks`. Vercel logs report webhook ingestion errors.
*   **Entitlement Mismatch Risk:** Customers complete checkout but their database profile is not updated to `pro`, resulting in delayed premium feature delivery.
*   **Webhook Logs to Inspect:** Inspect the Vercel execution logs for webhook payload delivery stack traces. Check the Stripe dashboard for webhook signing secret matching status.
*   **Idempotency Expectations:** Webhooks must safely handle duplicate delivery events using Stripe event ID logging (`public.stripe_webhook_events` table).
*   **Safe Mitigation:** 
    *   Verify the webhook secret key values mapped on Vercel.
    *   Manually push missing transactions by clicking "Resend Event" in Stripe Developer console.

### Playbook-05: Entitlement / Pro Access Mismatch
*   **Symptoms:** Active paid Pro users cannot export PDFs (receive 403 blocks), or Free/canceled accounts retain Pro features.
*   **Immediate Containment Steps:**
    1. Query database records to confirm the user's `plan_slug`.
    2. Check Stripe subscription active state via the Stripe console.
    3. If access remains mismatched, manually force the subscription to Free or Pro via direct database override:
       ```sql
       update user_profiles set plan_slug = 'free' where user_id = 'USER_UUID';
       ```
    4. Audit PDF export routes to verify that they request active server-side plan confirmation.

### Playbook-06: High Cost Spike
*   **Symptoms:** Unexpected token usage charges or elevated Gemini API billing metrics.
*   **Metrics to Inspect:**
    *   Gemini usage logs.
    *   Database transaction charts on the `/admin` endpoint.
    *   Rate limiting logs showing hits on the prompt check limits (3/day anonymous, 5/day Free, 100/day Pro).
*   **Abuse Indicators:** Rapid programmatic checks from single IP hashes or accounts.
*   **Mitigation Steps:**
    *   Implement temporary IP blocks or reduce the anonymous request threshold in `lib/plans/config.ts` config files.
    *   Rotate the `GOOGLE_GENERATIVE_AI_API_KEY` if unauthorized requests bypass the application middleware.

### Playbook-07: Suspected Secret Leakage
*   **Symptoms:** Security alerts flag active developer credentials (such as Stripe API keys or database connection strings) in public git history or compiled Javascript bundles.
*   **Stop Actions:** Immediately deactivate the compromised key in the provider console (Stripe / Gemini).
*   **Audit Protocol:**
    1. Inspect server logs, git diffs, client bundle js files, and public documentation.
    2. **Do not print, log, or copy the exposed secret value** in ticket logs or documentation.
    3. Generate new credentials in the provider dashboard.
    4. Update Vercel environment variables, rebuild, and redeploy.

### Playbook-08: Private Result Exposure Risk
*   **Symptoms:** Users bypass ownership checks, allowing unauthorized visitors to view or export private `/result/[id]` reports.
*   **Containment Steps:**
    1. Verify that Row-Level Security (RLS) is enabled on `prompt_analyses`.
    2. Confirm that public access routes `/share/[token]` only return read-only layouts and do not expose user IDs, emails, or internal database metadata.
    3. Temporarily disable the share toggle functionality or restrict export routes `/api/export` to block all file generation requests during investigation.

---

## 3. Rollback Procedure (SOP-R1)

Execute these recovery steps in order if integration errors occur:

1.  **Set STRIPE_ENABLED=false:** Access the Vercel Team Dashboard and set `STRIPE_ENABLED=false` for the production environment.
2.  **Verify Checkout Disabled:** Navigate to `/pricing` and verify that the payment buttons are deactivated.
3.  **Inspect Webhook Logs:** Audit Stripe Webhook logs and Vercel serverless function logs to identify database locks or signature verification issues.
4.  **Verify Entitlement State:** Verify that database records remain consistent and that users who completed checkouts during the incident window are queued for manual profile syncs.
5.  **Restore Stable Release:** Revert to the last stable, tested Git release commit using the Vercel Dashboard deployments rollback tool.

---

## 4. Post-Incident Review Checklist

Perform this checklist within 24 hours of resolving any high or critical severity incident:

- [ ] **User Impact:** Quantify the total number of affected users and transaction losses.
- [ ] **Data Impact:** Verify database integrity and check for unauthorized data modifications.
- [ ] **Billing Impact:** Reconcile Stripe checkout logs with database subscription records.
- [ ] **Security Impact:** Confirm that no customer PII or system API keys were exposed in logs or bundles.
- [ ] **Follow-up Tasks:** Log bugs, create schema updates, or schedule infrastructure updates.
- [ ] **Decision Log Update:** If architectural changes are required, log decisions in `docs/decision-log.md`.
