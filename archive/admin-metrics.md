> [!WARNING]
> **Archived / Historical** — This document has been moved to rchive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# Admin Metrics Panel

**Route**: `/admin/metrics`  
**API**: `GET /api/admin/metrics?window={allTime|last30d|last7d|last24h}`  
**Access**: Authenticated users whose email is listed in `ADMIN_EMAILS` only.

---

## Access Control

| Situation | Behaviour |
|---|---|
| Not authenticated | Redirect to `/login?next=/admin/metrics` |
| Authenticated, not in `ADMIN_EMAILS` | 403 Access Denied page |
| Authenticated admin | Dashboard rendered |
| API â€” not authenticated | `401 Unauthorized` JSON |
| API â€” non-admin | `403 Forbidden` JSON |

All checks happen **server-side** in both the page and API route. No client-side hiding.

---

## Reporting Windows

| Key | Description |
|---|---|
| `allTime` | All events since the beginning of time |
| `last30d` | Events in the past 30 days |
| `last7d` | Events in the past 7 days |
| `last24h` | Events in the past 24 hours |

---

## Metrics Categories

### 1. Core Funnel
Analysis lifecycle from start to completion.

| Metric | Source |
|---|---|
| `analysis_started` | `usage_events` where `event_type = analysis_started` |
| `analysis_completed` | `usage_events` where `event_type = analysis_completed` |
| `analysis_failed` | `usage_events` where `event_type = analysis_failed` |
| `completion_rate` | `completed / started Ă— 100` |
| `failure_rate` | `failed / started Ă— 100` |
| `average_analyses_per_day` | `completed / window_duration_days` |
| `latest_analysis_at` | `max(created_at)` of completed events |

### 2. Value Metrics
User engagement and output adoption signals.

| Metric | Source |
|---|---|
| `copy_improved_prompt` | `usage_events` where `event_type IN (copy_improved_prompt, copy)` |
| `copy_rate` | `copies / completed Ă— 100` |
| `feedback_submitted` | `feedback_events` count |
| `feedback_up / feedback_down` | `feedback_events` where `rating = up/down` |
| `positive_feedback_ratio` | `up / total_feedback Ă— 100` |
| `share_link_created` | `usage_events` where `event_type = share_link_created` |
| `active_public_shares` | `prompt_analyses` where `is_share_enabled = true` |
| `export_markdown / export_txt` | `usage_events` where `event_type = export_*` |

### 3. Retention Proxy
Owner re-use patterns â€” **no owner IDs are returned**.

| Metric | Formula |
|---|---|
| `unique_active_owners` | Count distinct `owner_anonymous_id` in `usage_events` |
| `unique_owners_with_completed_analysis` | Count distinct `owner_anonymous_id` of completed events |
| `returning_owners_count` | Owners who completed â‰Ą2 analyses |
| `returning_rate` | `returning / owners_with_completed Ă— 100` |
| `median_completed_analyses_per_owner` | Median of per-owner completion counts |
| `owner_usage_buckets` | Distribution: 1 / 2â€“3 / 4â€“10 / 10+ analyses |

### 4. Plans
From `user_profiles.plan_slug`. Stripe is **disabled** in beta.

- `free_users_count` and `pro_users_count` come from `user_profiles`.
- `analyses_by_plan` maps completed analyses to the plan of the `user_id` at analysis time.
- No subscriptions table is queried when `STRIPE_ENABLED !== "true"`.

### 5. Reliability
Failures and errors â€” **raw error messages are never returned**.

| Metric | Source |
|---|---|
| `analysis_failed` | `usage_events` |
| `provider_error` | `usage_events` where `event_type = provider_error` |
| `invalid_structured_output` | `usage_events` |
| `api_error` | `usage_events` |
| `common_error_codes` | Top 5 `metadata_json.error_code` values (code + count only) |

### 6. Limits
Rate-limiting signals â€” **no owner IDs returned**.

| Metric | Description |
|---|---|
| `limit_reached` | Count of `limit_reached` events |
| `limit_reached_rate` | `limit_reached / unique_active_owners Ă— 100` |
| `owners_hitting_limit_count` | Distinct owners who hit the limit |
| `average_limit_reached_per_limited_owner` | `limit_reached / owners_hitting_limit_count` |

### 7. Sensitive Data Safety
Detection and blocking â€” **no secret values are returned**.

| Metric | Source |
|---|---|
| `sensitive_data_warning_shown` | `usage_events` |
| `sensitive_data_blocked` | `usage_events` |
| `risk_level_counts` | `prompt_analyses.sensitive_data_risk_level` distribution |
| `finding_type_counts` | Counts by `finding.type` from `sensitive_data_findings_json` |

### 8. Prompt Characteristics
Aggregate-only â€” **no prompt text returned**.

- Score distributions across 5 buckets (weak â†’ excellent)
- Language and profile slug breakdowns
- Average/median `overall_score`
- Prompt length buckets based on character count only

### 9. Cost / Usage
Token usage is not stored in the current schema.
Returns `ai_cost_status: "unknown"` until token metadata is added.

### 10. Event Coverage Audit
Checks all 15+ expected events for presence in `usage_events` (all-time).
Returns `present`, `no_events_yet`, or `unknown` per event type.

### 11. Product Interpretation
Computed status signals:

| Signal | Logic |
|---|---|
| `copy_rate_status` | `strong` â‰Ą40%, `acceptable` 20â€“39%, `weak` <20% |
| `feedback_status` | `strong` if â‰Ą70% positive and â‰Ą3 feedback |
| `retention_status` | `strong` if â‰Ą25% returning (min 5 owners) |
| `reliability_status` | `strong` <5% fail, `warning` 5â€“15%, `blocking` >15% |
| `paid_readiness` | Computed based on combined traction signals |

---

## Privacy Guarantees

- No `input_prompt` or `improved_prompt` text is returned.
- No `user_id`, `owner_anonymous_id`, `email`, or `share_token` is returned.
- Only aggregated counts and rates are exposed.
- No Supabase internal error details leak to the client.
- `subscriptions` table is never queried when `STRIPE_ENABLED !== "true"`.

---

## Security

- `ADMIN_EMAILS` is read server-side only and **never sent to the client**.
- The Supabase service-role key is used only server-side via `getSupabaseAdminClient()`.
- The dashboard page is `force-dynamic` to prevent ISR caching of sensitive data.

---

## Final Event Contract

All telemetry events conform strictly to the following contract. **No raw prompt text, user IDs, owner IDs, emails, share tokens, or secret credentials are ever written in any event metadata.**

| Event Name | Trigger Location | Trigger Condition | Minimal Compliant Metadata |
|---|---|---|---|
| `analysis_started` | `/api/analyze` | Immediately after parsing and resolving owner identity | `profile_slug`, `working_language` |
| `analysis_completed` | `/api/analyze` | Successfully saved the prompt audit record in DB | `profile_slug`, `working_language`, `analysis_id`, `token_usage`, `cost_estimate` |
| `analysis_failed` | `/api/analyze` | Any error (limits, validation blocker, AI semantic failures, or generic provider exceptions) | `profile_slug`, `working_language`, `error_code` |
| `limit_reached` | `/api/analyze` | When daily rate limits or monthly quotas are violated | `profile_slug`, `working_language`, `error_code`, `limit` |
| `sensitive_data_warning_shown` | `/api/analyze` | Scented when a low or medium risk preflight warning is detected | `profile_slug`, `working_language`, `risk_level` |
| `sensitive_data_blocked` | `/api/analyze` | When high-risk data preflight block occurs (skips AI execution) | `profile_slug`, `working_language`, `risk_level: 'high'` |
| `provider_error` | `/api/analyze` | Inside POST catch block when catching transient/non-transient `ProviderError` | `profile_slug`, `working_language`, `error_code` |
| `invalid_structured_output` | `/api/analyze` | Caught a `SemanticValidationError` (AI response validation fails schema rules) | `profile_slug`, `working_language`, `error_code` |
| `copy_improved_prompt` / `copy` | `/api/events` | User clicks copy polished prompt inside UI | `analysis_id` |
| `feedback_submitted` | `/api/feedback` | User votes up/down on audit report | `analysis_id`, `rating`, `feedback_id` |
| `share_link_created` | `/api/share` | Enable public link | `analysis_id` |
| `share_link_disabled` | `/api/share/disable` | Disable public link | `analysis_id` |
| `export_markdown` | `/api/export/[id]` | Download audit as Markdown | `analysis_id`, `export_type: 'markdown'` |
| `export_txt` | `/api/export/[id]` | Download audit as Plain TXT | `analysis_id`, `export_type: 'txt'` |

---

## Files

| File | Purpose |
|---|---|
| `lib/admin/auth.ts` | Server-side admin authorization helper |
| `lib/admin/metrics.ts` | Aggregation logic for all metric categories |
| `app/api/admin/metrics/route.ts` | API endpoint |
| `app/admin/metrics/page.tsx` | Server-rendered admin page |
| `components/admin/metrics-dashboard.tsx` | Client dashboard UI |
| `components/admin/metric-card.tsx` | Metric tile component |
| `components/admin/metric-table.tsx` | Table breakdown component |
| `tests/api/admin-metrics.test.ts` | API access + privacy tests |
| `tests/admin/metrics-helper.test.ts` | Unit tests for aggregation logic |
