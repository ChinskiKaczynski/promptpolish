# Vercel Runtime & Deployment Checklist

This checklist contains critical operational environment settings and runtime verifications for deployments on Vercel.

---

## 1. Environment Configurations

| Variable | Deployment Role | Recommended State | Notes |
|---|---|---|---|
| **`OPENROUTER_FALLBACK_MODEL_ID`** | Optional Fallback ID | **Unset (Empty)** | Production fallback must remain disabled until a suitable model is approved. |
| **`STRIPE_ENABLED`** | Stripe Integration | **`false`** | Stripe billing remains disabled. |
| **`AI_MOCK_MODE`** | AI Provider Mocking | **`false`** | Live calls only in production environments. |
| **`AI_PROVIDER_TIMEOUT_MS`** | Provider Request Budget | **`55000`** (55s) | Hard abort limit for provider completions. |

---

## 2. Serverless Function Timeout

> [!WARNING]
> **Vercel maxDuration=120 Status is UNVERIFIED**:
> The `app/api/analyze/route.ts` specifies `export const maxDuration = 120` to support potential retry and repair chains. However, support for execution limits higher than the standard default (60 seconds for Hobby/Pro plans) is unverified and depends on Vercel workspace provisioning.

---

## 3. Security & Database Checklist

* **Least-Privilege Database Grants**: A pending review has been logged:
  > GRANT ALL on public.model_profiles to service_role is broader than the current runtime requirement and should be reviewed in a separate least-privilege task.
* **Preflight Safety Scans**: `SENSITIVE_DATA_BLOCK_HIGH_RISK=true` should be enabled to prevent credentials from being sent to external providers.
