# Supabase Access Control & Security Policy — PromptPolish

PromptPolish utilizes Supabase Postgres for data storage. As an anonymous-first application with optional authenticated tiers, strict access controls must be enforced via Next.js Server Components and backend-only service role executions to prevent unauthorized data access, ID enumeration, or privacy leaks.

---

## 1. Database Key Management

The platform utilizes three distinct keys to communicate with Supabase:

1.  **`NEXT_PUBLIC_SUPABASE_URL`** (Public)
    *   *Exposure*: Safe to expose to the client. Declares the project API endpoint.
2.  **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (Public)
    *   *Exposure*: Safe to expose to the client. Enforces API boundaries but relies entirely on Row Level Security (RLS) to restrict data access.
3.  **`SUPABASE_SECRET_KEY`** (Secret)
    *   *Exposure*: **Strictly server-side only**. Exposes administrative access to bypass RLS.
    *   *Usage*: Used by Next.js backend Server Actions, API routes, automated database crons, and data retention purging scripts. **Must never** be imported or exposed in client bundles.

---

## 2. Private Result Access `/result/[id]`

Prompt audits are private by default. Access to `/result/[id]` must be strictly audited to prevent users from viewing other anonymous submissions:

```text
User requests /result/[id]
   ├── 1. Server Component intercepts request.
   ├── 2. Extracts ownership identifiers (user_id for authenticated, or owner_anonymous_id from cookie).
   ├── 3. Queries Supabase using:
   │      SELECT * FROM prompt_analyses 
   │      WHERE id = [id] AND (user_id = [user_id] OR owner_anonymous_id = [owner_anonymous_id])
   ├── 4. If record found: Render page.
   └── 5. If record missing or unauthorized: Return 404 or redirect.
```

> [!WARNING]
> **No Client-Side Result Queries**:
> Client components must never run direct Supabase queries to retrieve `prompt_analyses` records. All data retrieval for results must occur within secure, server-side Next.js route handlers or Server Components.

---

## 3. Opt-in Public Shared Access `/share/[token]`

Users can explicitly choose to make their prompt audit public by generating a share link:

*   **Entropy Requirement**: The `share_token` must be a cryptographically secure, random string (nanoid).
*   **Validation Rule**: When resolving `/share/[token]`, the database query must strictly verify:
    ```sql
    SELECT input_prompt, improved_prompt, final_score, criteria_scores, weaknesses, explanations
    FROM prompt_analyses 
    WHERE share_token = [token] AND is_share_enabled = true;
    ```
*   **PII Scrubbing**: The public payload returned for shared results **must be entirely scrubbed** of metadata, including the `owner_anonymous_id`, hashed IP addresses, cookie references, and user diagnostic parameters.
*   **Instant Revocation**: If the user toggles "Disable Public Share" in the private results page, the backend sets `is_share_enabled = false` and clears the token, causing the public URL to immediately return a `404 Not Found` response.

---

## 4. Supabase Row Level Security (RLS) Policies

All application tables (`prompt_analyses`, `usage_events`, `feedback_events`, `user_profiles`, `billing_checkout_attempts`, `stripe_webhook_events`, etc.) have Row Level Security enabled. 

To enforce strict server-side ownership:
*   Client roles (`anon`, `authenticated`) have all default privileges revoked on private tables.
*   The Next.js backend interacts with the database exclusively using the service-role client, ensuring that data is accessed securely via Server Components, route handlers, and stored procedures (RPCs).
*   All stored procedures (RPCs like `acquire_usage_reservation`, `save_analysis_and_complete_reservation`, `claim_stripe_webhook_event`, `insert_usage_event_with_limit`) are declared with `SECURITY DEFINER` and restricted execution rights (`REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC`), granting execution permissions exclusively to `service_role`.
