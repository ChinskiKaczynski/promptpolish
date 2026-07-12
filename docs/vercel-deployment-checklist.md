# Vercel Deployment & DB Setup Checklist

This checklist establishes a step-by-step deployment blueprint for Vercel environments and Supabase database setups. It details required variables, manual smoke-test specifications, and rollback processes for safety.

---

## 1. Required Environment Variables

Deploy these variables in your **Vercel Environment** settings. Do **NOT** expose server secrets to client-facing scopes (never prefix with `NEXT_PUBLIC_`).

| Variable Name | Required Scope | Type / Validation | Description / Default Behavior |
| :--- | :---: | :---: | :--- |
| **`APP_URL`** | All | `string (URL)` | Root URL of the deployment. |
| **`GEMINI_MODEL_ID`** | Server | `string` | Target model ID (e.g. `gemini-2.5-flash`). |
| **`GOOGLE_GENERATIVE_AI_API_KEY`**| Server | `string` | Google Gemini API key. |
| **`SUPABASE_SECRET_KEY`** | Server | `string` | Service-role key for Supabase admin queries. |
| **`NEXT_PUBLIC_SUPABASE_URL`** | Client/Server  | `string (URL)` | Supabase Project API URL. |
| **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** | Client/Server | `string` | Supabase Anon/Publishable Key. |
| **`ANONYMOUS_DAILY_LIMIT`** | Server | `number (Integer)`| Daily limit of prompt audits allowed per anonymous ID. Defaults to `3`. |
| **`MAX_PROMPT_CHARS`** | Server | `number (Integer)`| Upper character limit on inputs. Defaults to `12000`. |
| **`MIN_PROMPT_CHARS`** | Server | `number (Integer)`| Lower character limit on inputs. Defaults to `20`. |
| **`SENSITIVE_DATA_BLOCK_HIGH_RISK`** | Server | `"true"\|"false"` | Activates hard blocker for high-risk keys on preflight. |
| **`RETENTION_ANONYMOUS_ANALYSIS_DAYS`**| Server | `number (Integer)`| Days to keep unshared anonymous analyses in the DB. Defaults to `30`. |
| **`RETENTION_USAGE_EVENT_DAYS`** | Server | `number (Integer)`| Days to keep telemetry log rows in the DB. Defaults to `90`. |
| **`RETENTION_FEEDBACK_EVENT_DAYS`** | Server | `number (Integer)`| Days to keep feedback opinion rows in the DB. Defaults to `180`. |
| **`CRON_SECRET`** | Server | `string` | Authorization Bearer token required for trigger-cleanup CRON jobs. |
| **`RATE_LIMIT_HMAC_SECRET`** | Server | `string` | HMAC-SHA256 secret used to pseudonymize IP addresses for rate limiting. |
| **`STRIPE_ENABLED`** | Server | `"true"\|"false"` | Enables Stripe billing. |
| **`STRIPE_SECRET_KEY`** | Server | `string` | Stripe secret key. Required when `STRIPE_ENABLED=true`. |
| **`STRIPE_WEBHOOK_SECRET`** | Server | `string` | Stripe webhook signing secret (`whsec_...`). Required when `STRIPE_ENABLED=true`. |
| **`STRIPE_PRICE_ID_PRO`** | Server | `string` | Stripe Price ID for the Pro subscription. Required when `STRIPE_ENABLED=true`. |
| **`COOKIE_SIGNING_SECRET`** | Server | `string` | Secret key used to sign anonymous cookies. |

---

## 2. Supabase Online Database Setup

Follow these steps to initialize or synchronize your database environment:

1. **Provision Database**: Initialize your project on your Supabase Dashboard.
2. **Execute Database Migrations**:
   - Align the database with repository migration files located in `supabase/migrations/**` using the Supabase MCP tools or remote migrations execution.
3. **Execute Configuration Data (Seeding)**:
   - Run seed files to register the default model profiles (`general-llm` pointing to `gemini-2.5-flash`).

---

## 3. Step-by-Step Manual Smoke-Test Script

Once your deployment succeeds, manually execute the verification suite:

1. [ ] **Verify Home Page (`/`)**: Navigate to the home page. Check that styling, brand typography, and animations load correctly.
2. [ ] **Responsive Visuals / Mobile Layout**: Open Chrome DevTools, toggle **Device Mode**, and verify the layout adapts to mobile screen sizes without overflow.
3. [ ] **Submit Weak Prompt**: Enter a very short prompt below the limit. Verify that the system blocks submission with a warning that the input is below the 20-character limit.
4. [ ] **Verify Valid Audit Submission**: Enter a valid prompt (e.g. 40 characters) and click submit. Confirm that animated loading skeletons render while the backend processes the request.
5. [ ] **Verify Results Redirection**: Confirm the server automatically redirects to a private result URL formatted as `/result/[id]`.
6. [ ] **Private result verification**: Verify the results page displays the overall score, weaknesses, and the polished prompt.
7. [ ] **Test High-Risk Credentials Preflight**: Enter a prompt bearing a raw key (e.g. `OPENAI_API_KEY=sk-test1234567890abcdefghijklmnop`). Confirm that the preflight blocker intercepts the request, returning a `422 Unprocessable Entity` state. Verify in the database that this secret-bearing prompt was never saved.
8. [ ] **Verify Result Access Control (Authorization)**: Copy the private URL `/result/[id]`. Open a separate private browsing window (Incognito) and paste the URL. Confirm the browser returns a `404 Not Found` page (or redirects), indicating that non-owners cannot view private results.
9. [ ] **Enable Public Sharing**: On your private results page, click **Generate Public Link**. Copy the generated URL `/share/[token]`. Open an Incognito window and paste it. Confirm the page displays the scrubbed results.
10. [ ] **Disable Public Sharing**: Return to the owner page and click **Disable Public Link**. Reload the public Incognito window. Confirm the server returns a `404 Not Found` immediately.

---

## 4. Rollback Plan

If a deployment fails or encounters database exceptions, execute these rollback protocols immediately:

### A. Vercel Frontend Rollback
1. Open the **Vercel Project Dashboard**.
2. Navigate to the **Deployments** tab.
3. Locate the previous successful stable deployment.
4. Click the options icon (three dots) and select **Redeploy** (or click **Rollback** if available).

### B. Supabase Database Rollback
1. In production, rollbacks must be performed by restoring the database backup snapshot directly in the **Supabase Database Backups** panel.
