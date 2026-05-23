# Vercel Preview Deployment & DB Setup Checklist — PromptPolish

This checklist establishes a step-by-step deployment blueprint for Vercel Preview environments and Supabase database setups. It details required variables, manual smoke-test specifications, and rollback processes for safety.

---

## 1. Required Environment Variables

Deploy these variables in your **Vercel Preview Environment** settings. Do **NOT** expose server secrets to client-facing scopes (never prefix with `NEXT_PUBLIC_`).

| Variable Name | Required Scope | Type / Validation | Description / Default Behavior |
| :--- | :---: | :---: | :--- |
| **`APP_URL`** | All | `string (URL)` | Root URL of the deployment. Defaults to `http://localhost:3000`. |
| **`COOKIE_SIGNING_SECRET`** | Server | `string` | Cryptographic secret for signing session cookies. Crucial to prevent session hijacking. |
| **`GOOGLE_GENERATIVE_AI_API_KEY`** | Server | `string` | Live Google Gemini API Key. |
| **`GEMINI_MODEL_ID`** | Server | `string` | Target model slug. Defaults to `gemini-3.5-flash`. |
| **`SUPABASE_SECRET_KEY`** | Server | `string` | Secret Service Role API key for Supabase admin queries. |
| **`NEXT_PUBLIC_SUPABASE_URL`** | Client/Server | `string (URL)` | Supabase Project API URL. |
| **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** | Client/Server | `string` | Supabase Anon Publishable Key. |
| **`ANONYMOUS_DAILY_LIMIT`** | Server | `number (Integer)` | Daily limit of prompt audits allowed per anonymous ID. Defaults to `3`. |
| **`MAX_PROMPT_CHARS`** | Server | `number (Integer)` | Upper character limit on inputs. Defaults to `12000`. |
| **`MIN_PROMPT_CHARS`** | Server | `number (Integer)` | Lower character limit on inputs. Defaults to `20`. |
| **`SENSITIVE_DATA_BLOCK_HIGH_RISK`** | Server | `boolean` | Activates hard blocker for high-risk keys on preflight. Defaults to `true`. |
| **`RETENTION_ANONYMOUS_ANALYSIS_DAYS`** | Server | `number (Integer)` | Days to keep unshared analyses in the DB. Defaults to `30`. |
| **`RETENTION_USAGE_EVENT_DAYS`** | Server | `number (Integer)` | Days to keep telemetry log rows in the DB. Defaults to `90`. |
| **`RETENTION_FEEDBACK_EVENT_DAYS`** | Server | `number (Integer)` | Days to keep feedback opinion rows in the DB. Defaults to `180`. |
| **`CRON_SECRET`** | Server | `string` | Authorization Bearer token required for trigger-cleanup CRON jobs. |

---

## 2. Supabase Preview Database Setup

Follow these steps to initialize your preview database environment:

1. **Create Preview Database**: Initialize a new project on your Supabase Dashboard (choose a region close to your Vercel hosting server, e.g., Frankfurt/Warsaw for EU).
2. **Execute Database Schemas (Migrations)**:
   * Open the **SQL Editor** on your Supabase dashboard.
   * Open the migration file: [**`db/migrations/0001_init.sql`**](file:///d:/AI/promptpolish/db/migrations/0001_init.sql).
   * Copy the entire SQL content, paste it into the editor, and click **Run** to provision the database tables, views, and schemas.
3. **Execute Configuration Data (Seeding)**:
   * Open a new SQL Editor tab.
   * Open the seeding file: [**`db/seed/model_profiles.sql`**](file:///d:/AI/promptpolish/db/seed/model_profiles.sql).
   * Copy the seed contents, paste into the editor, and click **Run** to register the initial MVP model profiles (`general-llm`, `google-gemini-3-5-flash`).

---

## 3. Step-by-Step Manual Smoke-Test Script

Once your preview deployment succeeds, manually execute the following **22-step verification suite**:

### A. Landing and Navigation Checks
1. [ ] **Verify Home Page (`/`)**: Navigate to the home page. Check that styling, brand typography, and animations load correctly.
2. [ ] **Responsive Visuals / Mobile Layout**: Open Chrome DevTools, toggle **Device Mode**, and verify the layout adapts to iPhone and iPad screen sizes without overflow.

### B. Prompt Audit End-to-End Flow
3. [ ] **Submit Weak Prompt**: Enter `"Napisz opis produktu"` (19 chars).
4. [ ] **Validation Reject**: Verify that the system blocks submission with a warning that the input is below the 20-character limit.
5. [ ] **Verify Valid Audit Submission**: Enter `"Zrób zwięzły opis dla lampki biurkowej."` (39 chars) and click submit.
6. [ ] **Loading Skeletons**: Confirm that beautiful animated loading skeletons render while the backend processes the request.
7. [ ] **Verify Results Redirection**: Confirm the server automatically redirects to a private result URL formatted as `/result/[id]`.
8. [ ] **Private result verification**: Verify the results page displays the overall score, task goal, top weaknesses, and the copy-ready polished prompt.

### C. Sensitive Data Prevention
9. [ ] **Test High-Risk Credentials Preflight**: Enter a prompt bearing a raw key: `"OPENAI_API_KEY=sk-test1234567890abcdefghijklmnop Stwórz opis."`
10. [ ] **Verification**: Click submit. Confirm that the preflight blocker intercepts the request, returning a `422 Unprocessable Entity` state, warning the user about sensitive API keys, and **never** redirecting to `/result/[id]`.
11. [ ] **DB Verify**: Check the database logs. Confirm that this secret-bearing prompt was **never** saved.

### D. Session Access Controls & Limits
12. [ ] **Verify Result Access Control (Authorization)**: Copy the private URL `/result/[id]`. Open a separate private browsing window (Incognito) and paste the URL.
13. [ ] **Verification**: Confirm the browser returns a `404 Not Found` page, indicating that non-owners cannot view private results.
14. [ ] **Test Rate Limits**: Submit 3 successful audits in a row. Submit a 4th audit.
15. [ ] **Verification**: Confirm the 4th submission returns a `429 Too Many Requests` response with a localized daily rate limit warning.

### E. Public Sharing and Disabling
16. [ ] **Enable Public Sharing**: On your private results page, click **Generate Public Link**. Copy the generated URL `/share/[token]`.
17. [ ] **Verify Public Share**: Open an Incognito window and paste `/share/[token]`. Confirm the page displays the scrubbed results, and lacks administrative feedback, share panels, and private database UUIDs.
18. [ ] **Disable Public Sharing**: Return to the owner page and click **Disable Public Link**.
19. [ ] **Verification**: Reload the public Incognito window. Confirm the server returns a `404 Not Found` immediately.

### F. Telemetry Events & Retention Checks
20. [ ] **Copy Event Verification**: Click **Copy Prompt** on the results view. Verify that the system records a `'copy'` usage event in the database telemetry.
21. [ ] **Retention Cleanup Dry-Run**: Run the retention cleanup locally targeting your preview database:
    ```bash
    npx tsx scripts/retention-cleanup.ts --dry-run
    ```
    Confirm it securely returns the counts of expired data *without* deleting any rows.

### G. Security Verification
22. [ ] **Static Bundle Leak Checks**: Verify that no forbidden environment variables or database admin imports leak client-side:
    ```bash
    pnpm run test
    ```
    Confirm that `client-exposure-checks.test.ts` passes with zero violations.

---

## 4. Rollback Plan

If a deployment fails, encounters database exceptions, or breaks existing integration flows, execute these rollback protocols immediately:

### A. Vercel Frontend Rollback
1. Open the **Vercel Project Dashboard**.
2. Navigate to the **Deployments** tab.
3. Locate the previous successful stable deployment.
4. Click the options icon (three dots) and select **Redeploy** (or click **Rollback** if available).
5. Alternatively, execute via Vercel CLI:
   ```bash
   vercel rollback <deployment-id-of-previous-stable-build>
   ```

### B. Supabase Database Rollback
Since preview environments use stateless or dev databases, database issues can be safely reset:
1. To rebuild the schema from scratch, run a database reset via Supabase CLI:
   ```bash
   supabase db reset
   ```
2. In production, rollbacks must be performed by restoring the database backup snapshot directly in the **Supabase Database Backups** panel.

---

## 5. Known Operational Risks

During preview execution and launch, monitor these known external risks:

1. **LLM Provider Availability & Rate Changes**: Gemini API endpoints may change structure or pricing. Standardize error normalization handles 429/503 boundaries safely, but API version shifts must be audited regularly.
2. **Session Losses on Cookie Clearing**: Clearing cookies deletes the cryptographic `owner_anonymous_id` signature, permanently locking the user out of their `/result/[id]` views. The UI displays prominent warning notices, but this remains a fundamental constraint of the anonymous-first architecture.
3. **Database Cold Starts (Free Tier)**: If Supabase free tier instances are idle, queries will experience minor initial latency spikes while the database container warms up. This is a non-blocking performance characteristic of dev environments.
