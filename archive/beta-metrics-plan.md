> [!WARNING]
> **Archived / Historical** — This document has been moved to archive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# Beta Instrumentation & Reporting Plan â€” PromptPolish

This plan establishes the telemetry, event mapping, privacy compliance, and dashboard queries for the **PromptPolish anonymous-first MVP**. It outlines how the 17 required product and AI performance metrics are mapped, lists missing fields, and provides optimized Postgres SQL queries for Supabase dashboard tracking.

---

## 1. Core Architecture & Privacy Guardrails

To preserve our strict **anonymous-first** value proposition, all beta analytics must conform to the following privacy rules:
1. **Zero Personal Data Extraction**: We never collect email, names, or cleartext IP addresses.
2. **Salted Hashing for Abuse Protection**: IP and User-Agents are processed server-side into SHA-256 hashes using a secure `APP_URL` salt before storage. Surowy (raw) IP addresses are never saved.
3. **Zero Mirroring of Input Secrets**: Preflight filters block high-risk secrets entirely. For low/medium risk flags, the telemetry tracks only the *class* of discovery (e.g. `email_address`, `phone_number`), never the actual value.
4. **No Third-Party Tracker Bundles**: All telemetry is executed strictly server-side through our Supabase DB logging client, keeping client-side network packages small, secure, and clean.

---

## 2. Beta Metrics Mapping Matrix

Below is the mapping for the 17 required metrics against our initial database tables: `prompt_analyses` (PA), `usage_events` (UE), and `feedback_events` (FE).

| Metric | Status | Database Source / Event Type | Telemetry Strategy / Column Mapping |
| :--- | :---: | :---: | :--- |
| **1. Number of analyses** | Covered | UE (`event_type = 'analyze'`) | Count successful analysis occurrences over time. |
| **2. Form completion rate** | Missing | Client Event | Requires landing page form impression vs. submission logging. |
| **3. copy_improved_prompt rate** | Covered | UE (`event_type = 'copy'`) | Logged by copy tracker inside the ResultView page. |
| **4. Feedback up/down** | Covered | FE (`rating in ('up', 'down')`) | Captured via upvote/downvote action buttons. |
| **5. Feedback comments themes** | Covered | FE (`comment text`) | Periodic semantic extraction on comment text entries. |
| **6. Task types** | Covered | PA (`task_type`) | Directly tracked inside our core prompt audit table. |
| **7. Average cost per analysis** | Missing | PA (`token_usage` metadata) | Requires addition of token metrics to calculate actual cost. |
| **8. Token usage** | Missing | PA / UE | Currently not persisted. Must capture prompt and completion tokens. |
| **9. Retry count** | Missing | PA / UE | Requires recording the retry count on transient provider exceptions. |
| **10. Invalid schema count** | Missing | PA / UE | Requires tracking when the LLM outputs malformed JSON structure. |
| **11. API errors** | Covered | UE (`event_type = 'provider_error'`) | Logged inside centralized route error catching. |
| **12. Gemini / provider errors** | Covered | UE (`event_type = 'provider_error'`) | Normalization handles detailed provider status codes. |
| **13. Invalid structured output rate** | Missing | PA / UE | Calculated as: `(schema_failures / total_requests) * 100`. |
| **14. limit_reached** | Covered | UE (`event_type = 'limit_reached'`) | Enforced and logged by `checkAnonymousLimit`. |
| **15. share_link_created** | Covered | PA (`is_share_enabled = true`) | Tracks total active publicly shared records. |
| **16. sensitive_data_warning_shown** | Missing | Client Event | Tracks low/medium risk alerts displayed to the user. |
| **17. sensitive_data_blocked** | Covered | UE (`event_type = 'sensitive_data_blocked'`) | Registered immediately when preflight scans block high-risk inputs. |

---

## 3. List of Missing Events & Telemetry Fields

To capture all 17 metrics under production-grade conditions, we recommend extending the schema with the following **two structural updates**:

### A. Extend `prompt_analyses` with AI Performance Metadata
Modify the `prompt_analyses` table to store AI execution metadata. This lets us calculate average cost per run, structured schema validation rates, and provider retry rates:
* `prompt_tokens`: `int` (number of input tokens processed)
* `completion_tokens`: `int` (number of output tokens generated)
* `retry_count`: `int` (defaults to 0, count of attempts executed)
* `invalid_schema_count`: `int` (defaults to 0, tracking minor JSON parsing recoveries)

### B. Track Client UI Warnings & Funnel States in `usage_events`
Register these two new `event_type` strings to track UI conversion funnels:
1. `form_impression`: Logged when the main landing page loads, creating the funnel baseline.
2. `sensitive_data_warning_shown`: Logged when the UI renders low/medium risk disclosures to the user, tracking how safety impacts completion rates.

---

## 4. Recommended Dashboard Queries (Postgres / Supabase)

These highly performant SQL queries can be run directly in the Supabase SQL Editor to render dashboard widgets:

### A. Core Engagement & Event Metrics
```sql
-- 1. Total Audits & Copy/Limit Telemetry (Last 30 Days)
select 
  event_type,
  count(*) as total_occurrences,
  count(distinct owner_anonymous_id) as unique_users
from usage_events
where created_at >= now() - interval '30 days'
group by event_type
order by total_occurrences desc;

-- 2. Form Submission Funnel & Completion Rate
-- Enforces calculation of: (Submissions / Impressions) * 100
with funnel as (
  select
    count(*) filter (where event_type = 'form_impression') as impressions,
    count(*) filter (where event_type = 'analyze') as submissions
  from usage_events
  where created_at >= now() - interval '30 days'
)
select 
  impressions,
  submissions,
  round((submissions::numeric / nullif(impressions, 0)) * 100, 2) as completion_rate_percentage
from funnel;
```

### B. Quality, Scoring, & AI Performance Metrics
```sql
-- 3. Distribution of Task Types & Top Weaknesses
select 
  task_type,
  count(*) as total_runs,
  round(avg(overall_score), 2) as average_score
from prompt_analyses
where task_type is not null
group by task_type
order by total_runs desc;

-- 4. Average AI Cost & Token Usage (Once Extended Fields Are Active)
-- Based on Gemini 1.5 Flash rates: $0.075/1M input, $0.30/1M output tokens
select
  count(*) as total_analyses,
  sum(prompt_tokens) as cumulative_prompt_tokens,
  sum(completion_tokens) as cumulative_completion_tokens,
  round(avg(prompt_tokens + completion_tokens), 2) as average_tokens_per_analysis,
  round(
    sum((prompt_tokens * 0.000000075) + (completion_tokens * 0.000000300)) / count(*),
    6
  ) as average_usd_cost_per_analysis
from prompt_analyses;
```

### C. Security, Safety, & Error Telemetry
```sql
-- 5. Rate Limit Blocks & Sensitive Data Blocks
select
  event_type,
  count(*) as blocked_occurrences,
  round((count(*)::numeric / (select count(*) from usage_events where event_type = 'analyze')) * 100, 2) as percentage_of_total_traffic
from usage_events
where event_type in ('limit_reached', 'sensitive_data_blocked')
group by event_type;

-- 6. Gemini/API Provider Failure Rates
select
  (metadata_json->>'status_code') as status_code,
  (metadata_json->>'error_message') as error_details,
  count(*) as error_count
from usage_events
where event_type = 'provider_error'
group by status_code, error_details
order by error_count desc;
```

### D. User Feedback & Satisfaction
```sql
-- 7. Feedback Upvote/Downvote Ratio
select
  rating,
  count(*) as vote_count,
  round((count(*)::numeric / sum(count(*)) over ()) * 100, 2) as percentage
from feedback_events
group by rating;
```
