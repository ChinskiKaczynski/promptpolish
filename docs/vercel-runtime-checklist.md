# Vercel Runtime & Deployment Checklist

This checklist contains critical operational environment settings and runtime verifications for deployments on Vercel.

---

## 1. Environment Configurations

| Variable | Deployment Role | Recommended State | Notes |
|---|---|---|---|
| **`GEMINI_MODEL_ID`** | Default Fallback/Direct ID | **`gemini-2.5-flash`** | Default model used for prompt analysis and as fallback. |
| **`STRIPE_ENABLED`** | Stripe Integration | **`false`** (Production) | Stripe billing remains disabled on prod. Set to `true` in Vercel Preview for test mode. |
| **`AI_MOCK_MODE`** | AI Provider Mocking | **`false`** | Live calls only in production environments. |
| **`AI_PROVIDER_TIMEOUT_MS`** | Provider Request Budget | **`55000`** (55s) | Hard abort limit for provider completions. |

---

## 1.5 Stripe Test Mode on Vercel Preview

To enable Stripe Test Mode checkout on Vercel Preview, you must set the following environment variables in Vercel Project settings under the **Preview** environment scope:

- **`STRIPE_ENABLED`**: `true`
- **`STRIPE_SECRET_KEY`**: `sk_test_...` (Your Stripe Test Mode secret key)
- **`STRIPE_PRICE_ID_PRO`**: `price_...` (Your Stripe Test Mode Pro price ID)
- **`STRIPE_WEBHOOK_SECRET`**: `whsec_...` (Your Stripe Test Mode webhook signing secret)
- **`APP_URL`**: `https://preview-url.vercel.app` (The Vercel preview deployment URL)

> [!CAUTION]
> Never configure live keys (`sk_live_...`) or enable Stripe billing on the production environment branch. Keep Stripe billing disabled (`STRIPE_ENABLED=false`) in production.

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
