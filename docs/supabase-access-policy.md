# Supabase Access Control & Security Policy — PromptPolish

PromptPolish utilizes Supabase Postgres for data storage. As an anonymous-first application, strict access controls must be enforced via Next.js Server Components and Row Level Security (RLS) policies to prevent unauthorized data access, ID enumeration, or privacy leaks.

---

## 1. Database Key Management

The platform utilizes three distinct keys to communicate with Supabase:

1.  **`NEXT_PUBLIC_SUPABASE_URL`** (Public)
    *   *Exposure*: Safe to expose to the client. Declares the project API endpoint.
2.  **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (Public)
    *   *Exposure*: Safe to expose to the client. Enforces API boundaries but relies entirely on Row Level Security (RLS) to restrict data access.
3.  **`SUPABASE_SERVICE_ROLE_KEY`** (Secret)
    *   *Exposure*: **Strictly server-side only**. Exposes administrative access to bypass RLS.
    *   *Usage*: Restricted to automated database crons, data retention purging scripts, and local developer seed tools. **Must never** be imported or exposed in client bundles.

---

## 2. Private Result Access `/result/[id]`

Prompt audits are private by default. Access to `/result/[id]` must be strictly audited to prevent users from viewing other anonymous submissions:

```text
User requests /result/[id]
   ├── 1. Server Component intercepts request.
   ├── 2. Extracts `owner_anonymous_id` from secure httpOnly cookie.
   ├── 3. Queries Supabase using:
   │      SELECT * FROM prompt_analyses 
   │      WHERE id = [id] AND owner_anonymous_id = [owner_anonymous_id]
   ├── 4. If record found: Render page.
   ├── 5. If record missing (wrong ID): Return 404.
   └── 6. If record exists but owner UUID does not match: Return 403 Forbidden.
```

> [!WARNING]
> **No Client-Side Result Queries**:
> Client components must never run direct Supabase queries to retrieve `prompt_analyses` records. All data retrieval for results must occur within secure, server-side Next.js route handlers or Server Components.

---

## 3. Opt-in Public Shared Access `/share/[token]`

Users can explicitly choose to make their prompt audit public by generating a share link:

*   **Entropy Requirement**: The `share_token` must be a cryptographically secure, random 32-character string (not a predictable sequential ID or raw UUID).
*   **Validation Rule**: When resolving `/share/[token]`, the database query must strictly verify:
    ```sql
    SELECT input_prompt, improved_prompt, final_score, criteria_scores, weaknesses, explanations
    FROM prompt_analyses 
    WHERE share_token = [token] AND is_share_enabled = true;
    ```
*   **PII Scrubbing**: The public payload returned for shared results **must be entirely scrubbed** of metadata, including the `owner_anonymous_id`, hashed IP addresses, cookie references, and user diagnostic parameters.
*   **Instant Revocation**: If the user toggles "Disable Public Share" in the private results page, the backend sets `is_share_enabled = false` and regenerates the `share_token` (or clears it), immediately causing the public URL to return a `404 Not Found` response.

---

## 4. Supabase Row Level Security (RLS) Policies

To ensure database safety even in the event of an API proxy exploit, we enforce strict RLS rules in the Postgres schema:

```sql
-- Enable RLS
ALTER TABLE prompt_analyses ENABLE ROW LEVEL SECURITY;

-- 1. Insert Policy: Anyone can insert (anonymous prompt analysis creation)
CREATE POLICY insert_prompt_analysis ON prompt_analyses
  FOR INSERT WITH CHECK (true);

-- 2. Select Policy (Owner): Users can view their own rows if the owner cookie UUID matches
CREATE POLICY select_own_analysis ON prompt_analyses
  FOR SELECT USING (
    owner_anonymous_id = auth.uid() OR 
    owner_anonymous_id = coalesce(nullif(current_setting('request.cookies.owner_anonymous_id', true), ''), '00000000-0000-0000-0000-000000000000')::uuid
  );

-- 3. Select Policy (Shared Links): Anyone can view via RLS if is_share_enabled is true
CREATE POLICY select_shared_analysis ON prompt_analyses
  FOR SELECT USING (
    is_share_enabled = true
  );
```
