'use client'

import { useState, useEffect, useCallback } from 'react'
import { MetricCard } from './metric-card'
import { MetricTable } from './metric-table'
import type { AggregatedMetrics, MetricsWindow } from '@/lib/admin/metrics'

const WINDOWS: { key: MetricsWindow; label: string }[] = [
  { key: 'allTime', label: 'All Time' },
  { key: 'last30d', label: 'Last 30 Days' },
  { key: 'last7d', label: 'Last 7 Days' },
  { key: 'last24h', label: 'Last 24 Hours' },
]

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function StatusBanner({ status }: { status: string }) {
  const styles: Record<string, string> = {
    strong: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    acceptable: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    weak: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    blocking: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    unknown: 'bg-slate-800/50 border-slate-700 text-slate-400',
    not_ready: 'bg-slate-800/50 border-slate-700 text-slate-400',
    improve_product_quality_first: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    add_auth_history_next: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    consider_export_pro_value_layer_later: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    strong_signal: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    mixed_signal: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    weak_signal: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    insufficient_data: 'bg-slate-800/50 border-slate-700 text-slate-400',
  }
  const cls = styles[status] ?? styles.unknown
  const label = status.replace(/_/g, ' ')
  return (
    <span className={`inline-block text-[11px] font-semibold px-3 py-1 rounded-full border uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  )
}

export function MetricsDashboard() {
  const [window, setWindow] = useState<MetricsWindow>('allTime')
  const [data, setData] = useState<AggregatedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMetrics = useCallback(async (w: MetricsWindow) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/metrics?window=${w}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const fetchMetrics = async () => {
      if (!ignore) {
        await loadMetrics(window)
      }
    }
    fetchMetrics()
    return () => {
      ignore = true
    }
  }, [window, loadMetrics])

  const fmt = (n: number, decimals = 0) => n.toFixed(decimals)

  return (
    <div className="bg-slate-950 text-slate-100">
      {/* Sub-Header */}
      <div className="border-b border-slate-900 bg-slate-900/10 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span className="h-2 w-2 rounded bg-indigo-500" /> Panel Metryk Administratora
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Prywatny panel beta — Tylko do odczytu</span>
              <span className="text-slate-700">•</span>
              <span className="text-indigo-400 font-semibold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                Okno: {WINDOWS.find((w) => w.key === window)?.label}
              </span>
              {data && (
                <>
                  <span className="text-slate-700">•</span>
                  <span className="text-slate-400 font-medium">
                    {data.startDate ? new Date(data.startDate).toLocaleDateString() : 'Początek'} → {new Date(data.endDate).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Window Selector */}
          <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800">
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                id={`window-${w.key}`}
                onClick={() => setWindow(w.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  window === w.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Loading / Error state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading metrics…</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-6 text-center">
            <p className="text-sm font-semibold text-rose-400">Failed to load metrics</p>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
            <button
              onClick={() => loadMetrics(window)}
              className="mt-4 text-xs px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition border border-slate-700"
            >
              Retry
            </button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Insufficient Data Beta Alert Banner */}
            {data.coreFunnel.analysis_completed < 20 && (
              <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-5 text-amber-400/90 backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                <div className="flex items-start gap-3 relative">
                  <span className="text-xl">⚠️</span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-amber-300">Niewystarczająca ilość danych (Brak Sygnału Trakcji)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
                      Liczba zakończonych analiz wynosi <strong className="text-amber-300">{data.coreFunnel.analysis_completed}</strong> (próg beta: <strong>20</strong>). 
                      Z powodu małej próbki w wybranym oknie czasowym, sygnał trakcji beta jest zdefiniowany jako 
                      <strong className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded ml-1">INSUFFICIENT_DATA</strong>. 
                      Zbierz więcej interakcji użytkowników, aby odblokować pełną analizę jakościową.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Overview Cards */}
            <section>
              <SectionHeader title="Overview" subtitle={`${data.startDate ? new Date(data.startDate).toLocaleDateString() + ' → ' : ''}${new Date(data.endDate).toLocaleDateString()}`} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  label="Completed Analyses"
                  value={data.coreFunnel.analysis_completed}
                  subtext={data.coreFunnel.completion_rate === null 
                    ? `Mismatch (Started: ${data.coreFunnel.analysis_started} / Completed: ${data.coreFunnel.analysis_completed})`
                    : `of ${data.coreFunnel.analysis_started} started`}
                  status={data.coreFunnel.completion_rate === null ? 'blocking' : null}
                />
                <MetricCard
                  label="Copy Rate"
                  value={data.valueMetrics.copy_rate}
                  format="percent"
                  status={data.productInterpretation.copy_rate_status === 'strong' ? 'strong' : data.productInterpretation.copy_rate_status === 'acceptable' ? 'acceptable' : data.productInterpretation.copy_rate_status === 'weak' ? 'weak' : null}
                  subtext={`${data.valueMetrics.copy_improved_prompt} copies`}
                />
                <MetricCard
                  label="Positive Feedback"
                  value={data.valueMetrics.positive_feedback_ratio}
                  format="percent"
                  status={data.productInterpretation.feedback_status === 'strong' ? 'strong' : data.productInterpretation.feedback_status === 'weak' ? 'weak' : null}
                  subtext={`${data.valueMetrics.feedback_up} 👍 / ${data.valueMetrics.feedback_down} 👎 (Ratio: ${data.valueMetrics.feedback_up_down_ratio})`}
                />
                <MetricCard
                  label="Returning Owners"
                  value={data.retentionProxy.returning_rate}
                  format="percent"
                  status={data.productInterpretation.retention_status === 'strong' ? 'strong' : data.productInterpretation.retention_status === 'weak' ? 'weak' : null}
                  subtext={`${data.retentionProxy.returning_owners_count} returning`}
                />
                <MetricCard
                  label="Failure Rate"
                  value={data.coreFunnel.failure_rate}
                  format="percent"
                  status={data.productInterpretation.reliability_status === 'strong' ? 'strong' : data.productInterpretation.reliability_status === 'warning' ? 'warning' : data.productInterpretation.reliability_status === 'blocking' ? 'blocking' : null}
                  subtext={`${data.coreFunnel.analysis_failed} failed`}
                />
                <MetricCard
                  label="Active Public Shares"
                  value={data.valueMetrics.active_public_shares}
                  subtext={`${data.valueMetrics.share_link_created} created / ${data.valueMetrics.share_link_disabled} disabled`}
                />
                <MetricCard
                  label="Limit Reached"
                  value={data.limits.limit_reached}
                  subtext={`${data.limits.owners_hitting_limit_count} unique owners`}
                />
                <MetricCard
                  label="Sensitive Blocks"
                  value={data.sensitiveDataSafety.sensitive_data_blocked}
                  subtext={`${fmt(data.sensitiveDataSafety.sensitive_block_rate, 1)}% block rate`}
                />
              </div>
            </section>

            {/* Core Funnel */}
            <section>
              <SectionHeader title="Core Funnel" subtitle="Analysis lifecycle: started → completed → failed" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <MetricCard label="Started" value={data.coreFunnel.analysis_started} />
                <MetricCard label="Completed" value={data.coreFunnel.analysis_completed} />
                <MetricCard label="Failed" value={data.coreFunnel.analysis_failed} />
                <MetricCard
                  label="Completion Rate"
                  value={data.coreFunnel.completion_rate !== null ? data.coreFunnel.completion_rate : 'N/A — Inconsistent'}
                  format={data.coreFunnel.completion_rate !== null ? 'percent' : 'text'}
                  status={data.coreFunnel.completion_rate === null ? 'blocking' : null}
                  subtext={data.coreFunnel.completion_rate === null ? 'Undercounted started events' : undefined}
                />
                <MetricCard label="Failure Rate" value={data.coreFunnel.failure_rate} format="percent" />
                <MetricCard label="Avg / Day" value={parseFloat(fmt(data.coreFunnel.average_analyses_per_day, 1))} format="number" />
                {data.coreFunnel.latest_analysis_at && (
                  <div className="col-span-2 flex flex-col gap-1 rounded-2xl bg-slate-900 border border-slate-800 px-5 py-4">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Latest Analysis</p>
                    <p className="text-sm font-semibold text-slate-300">{new Date(data.coreFunnel.latest_analysis_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Value Metrics */}
            <section>
              <SectionHeader title="Value Metrics" subtitle="User engagement and output adoption signals" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <MetricCard label="Copy Events" value={data.valueMetrics.copy_improved_prompt} />
                <MetricCard label="Copy Rate" value={data.valueMetrics.copy_rate} format="percent" />
                <MetricCard label="Feedback Submitted" value={data.valueMetrics.feedback_submitted} />
                <MetricCard label="Feedback Rate" value={data.valueMetrics.feedback_rate} format="percent" />
                <MetricCard label="Thumbs Up" value={data.valueMetrics.feedback_up} />
                <MetricCard label="Thumbs Down" value={data.valueMetrics.feedback_down} />
                <MetricCard label="Positive Ratio" value={data.valueMetrics.positive_feedback_ratio} format="percent" />
                <MetricCard label="Up/Down Ratio" value={data.valueMetrics.feedback_up_down_ratio} format="text" />
                <MetricCard label="Share Links Created" value={data.valueMetrics.share_link_created} />
                <MetricCard label="Share Links Disabled" value={data.valueMetrics.share_link_disabled} />
                <MetricCard label="Share Rate" value={data.valueMetrics.share_rate} format="percent" />
                <MetricCard label="Active Public Shares" value={data.valueMetrics.active_public_shares} />
                <MetricCard label="Export Markdown" value={data.valueMetrics.export_markdown} />
                <MetricCard label="Export TXT" value={data.valueMetrics.export_txt} />
              </div>
            </section>

            {/* Retention Proxy */}
            <section>
              <SectionHeader title="Retention Proxy" subtitle="Re-use signals — no user IDs or emails are stored here" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <MetricCard label="Active Owners" value={data.retentionProxy.unique_active_owners} />
                <MetricCard label="Owners w/ Completed" value={data.retentionProxy.unique_owners_with_completed_analysis} />
                <MetricCard label="Returning Owners" value={data.retentionProxy.returning_owners_count} />
                <MetricCard label="Returning Rate" value={data.retentionProxy.returning_rate} format="percent" />
                <MetricCard label="Avg Completed / Owner" value={parseFloat(fmt(data.retentionProxy.average_completed_analyses_per_owner, 1))} />
                <MetricCard label="Median Completed / Owner" value={parseFloat(fmt(data.retentionProxy.median_completed_analyses_per_owner, 1))} />
              </div>
              <MetricTable
                title="Owner Usage Distribution"
                description="How many analyses each owner has completed (aggregated, no IDs)"
                columns={[
                  { key: 'bucket', label: 'Bucket' },
                  { key: 'owners', label: 'Owners', align: 'right', format: 'number' },
                ]}
                rows={[
                  { bucket: '1 analysis', owners: data.retentionProxy.owner_usage_buckets.one_analysis },
                  { bucket: '2–3 analyses', owners: data.retentionProxy.owner_usage_buckets.two_to_three },
                  { bucket: '4–10 analyses', owners: data.retentionProxy.owner_usage_buckets.four_to_ten },
                  { bucket: '10+ analyses', owners: data.retentionProxy.owner_usage_buckets.more_than_ten },
                ]}
              />
            </section>

            {/* Plans */}
            <section>
              <SectionHeader title="Plans" subtitle="Current plan distribution from user_profiles (no emails, no IDs)" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <MetricCard label="Free Users" value={data.plans.free_users_count} />
                <MetricCard label="Pro Users" value={data.plans.pro_users_count} />
              </div>
              {data.plans.analyses_by_plan ? (
                <MetricTable
                  title="Completed Analyses by Plan"
                  columns={[
                    { key: 'plan', label: 'Plan' },
                    { key: 'count', label: 'Completed Analyses', align: 'right', format: 'number' },
                  ]}
                  rows={[
                    { plan: 'Free', count: data.plans.analyses_by_plan.free },
                    { plan: 'Pro', count: data.plans.analyses_by_plan.pro },
                  ]}
                />
              ) : (
                <p className="text-xs text-slate-500 italic">Analyses by plan data not available.</p>
              )}
            </section>

            {/* Reliability */}
            <section>
              <SectionHeader title="Reliability" subtitle="Provider and system errors — raw error messages are never shown" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <MetricCard label="Analysis Failed" value={data.reliability.analysis_failed} />
                <MetricCard label="Failure Rate" value={data.reliability.failure_rate} format="percent"
                  status={data.productInterpretation.reliability_status === 'strong' ? 'strong' : data.productInterpretation.reliability_status === 'warning' ? 'warning' : data.productInterpretation.reliability_status === 'blocking' ? 'blocking' : null}
                />
                <MetricCard label="Provider Errors" value={data.reliability.provider_error} />
                <MetricCard label="Invalid Output" value={data.reliability.invalid_structured_output} />
                <MetricCard label="API Errors" value={data.reliability.api_error} />
              </div>
              {data.reliability.common_error_codes.length > 0 && (
                <MetricTable
                  title="Common Error Codes"
                  description="Aggregated error codes from event metadata — no raw error messages"
                  columns={[
                    { key: 'code', label: 'Error Code' },
                    { key: 'count', label: 'Count', align: 'right', format: 'number' },
                  ]}
                  rows={data.reliability.common_error_codes}
                />
              )}
            </section>

            {/* Limits */}
            <section>
              <SectionHeader title="Limits" subtitle="Rate-limiting signals — no owner IDs exposed" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <MetricCard label="Limit Reached Events" value={data.limits.limit_reached} />
                <MetricCard label="Limit Reached Rate" value={data.limits.limit_reached_rate} format="percent" />
                <MetricCard label="Owners Hitting Limit" value={data.limits.owners_hitting_limit_count} />
                <MetricCard label="Avg Hits / Limited Owner" value={parseFloat(fmt(data.limits.average_limit_reached_per_limited_owner, 1))} />
              </div>
            </section>

            {/* Sensitive Data Safety */}
            <section>
              <SectionHeader title="Sensitive Data Safety" subtitle="Detection and blocking signals — no secret values are shown" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <MetricCard label="Warnings Shown" value={data.sensitiveDataSafety.sensitive_data_warning_shown} />
                <MetricCard label="Prompts Blocked" value={data.sensitiveDataSafety.sensitive_data_blocked} />
                <MetricCard label="Warning Rate" value={data.sensitiveDataSafety.sensitive_warning_rate} format="percent" />
                <MetricCard label="Block Rate" value={data.sensitiveDataSafety.sensitive_block_rate} format="percent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricTable
                  title="Risk Level Distribution"
                  description="From prompt_analyses.sensitive_data_risk_level"
                  columns={[
                    { key: 'level', label: 'Risk Level' },
                    { key: 'count', label: 'Count', align: 'right', format: 'number' },
                  ]}
                  rows={[
                    { level: 'none', count: data.sensitiveDataSafety.risk_level_counts.none },
                    { level: 'low', count: data.sensitiveDataSafety.risk_level_counts.low },
                    { level: 'medium', count: data.sensitiveDataSafety.risk_level_counts.medium },
                    { level: 'high', count: data.sensitiveDataSafety.risk_level_counts.high },
                  ]}
                />
                {Object.keys(data.sensitiveDataSafety.finding_type_counts).length > 0 && (
                  <MetricTable
                    title="Finding Type Counts"
                    description="Types of sensitive findings detected — no values shown"
                    columns={[
                      { key: 'type', label: 'Finding Type' },
                      { key: 'count', label: 'Count', align: 'right', format: 'number' },
                    ]}
                    rows={Object.entries(data.sensitiveDataSafety.finding_type_counts)
                      .map(([type, count]) => ({ type, count }))
                      .sort((a, b) => b.count - a.count)}
                  />
                )}
              </div>
            </section>

            {/* Prompt Characteristics */}
            <section>
              <SectionHeader title="Prompt Characteristics" subtitle="Aggregate-only statistics — no prompt text returned" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <MetricCard label="Total Analyses" value={data.promptCharacteristics.total_prompt_analyses} />
                <MetricCard label="Avg Score" value={parseFloat(fmt(data.promptCharacteristics.average_overall_score, 1))} />
                <MetricCard label="Median Score" value={parseFloat(fmt(data.promptCharacteristics.median_overall_score, 1))} />
                <MetricCard label="Avg Input Length" value={Math.round(data.promptCharacteristics.average_input_prompt_length)} subtext="characters" />
                <MetricCard label="Avg Output Length" value={Math.round(data.promptCharacteristics.average_improved_prompt_length)} subtext="characters" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricTable
                  title="Score Distribution"
                  columns={[
                    { key: 'range', label: 'Score Range' },
                    { key: 'count', label: 'Count', align: 'right', format: 'number' },
                  ]}
                  rows={[
                    { range: 'Weak (0–39)', count: data.promptCharacteristics.score_distribution.weak_0_39 },
                    { range: 'Needs Work (40–59)', count: data.promptCharacteristics.score_distribution.needs_work_40_59 },
                    { range: 'Decent (60–74)', count: data.promptCharacteristics.score_distribution.decent_60_74 },
                    { range: 'Strong (75–89)', count: data.promptCharacteristics.score_distribution.strong_75_89 },
                    { range: 'Excellent (90–100)', count: data.promptCharacteristics.score_distribution.excellent_90_100 },
                  ]}
                />
                <MetricTable
                  title="By Language"
                  columns={[
                    { key: 'lang', label: 'Language' },
                    { key: 'count', label: 'Count', align: 'right', format: 'number' },
                  ]}
                  rows={Object.entries(data.promptCharacteristics.analyses_by_working_language)
                    .map(([lang, count]) => ({ lang, count }))
                    .sort((a, b) => b.count - a.count)}
                />
                <MetricTable
                  title="By Profile"
                  columns={[
                    { key: 'profile', label: 'Profile Slug' },
                    { key: 'count', label: 'Count', align: 'right', format: 'number' },
                  ]}
                  rows={Object.entries(data.promptCharacteristics.analyses_by_selected_profile_slug)
                    .map(([profile, count]) => ({ profile, count }))
                    .sort((a, b) => b.count - a.count)}
                />
                <MetricTable
                  title="Prompt Length Buckets"
                  description="Based on character count — no text returned"
                  columns={[
                    { key: 'bucket', label: 'Length Bucket' },
                    { key: 'count', label: 'Count', align: 'right', format: 'number' },
                  ]}
                  rows={[
                    { bucket: 'Short (≤100 chars)', count: data.promptCharacteristics.prompt_length_buckets.short },
                    { bucket: 'Medium (101–500 chars)', count: data.promptCharacteristics.prompt_length_buckets.medium },
                    { bucket: 'Long (501–2000 chars)', count: data.promptCharacteristics.prompt_length_buckets.long },
                    { bucket: 'Very Long (2000+ chars)', count: data.promptCharacteristics.prompt_length_buckets.very_long },
                  ]}
                />
              </div>
            </section>

            {/* Cost / AI Usage */}
            <section>
              <SectionHeader title="Cost / AI Usage" subtitle="Token and cost estimates" />
              {data.costUsage.ai_cost_status === 'unknown' ? (
                <div className="rounded-2xl bg-slate-900 border border-slate-800 px-5 py-6">
                  <p className="text-sm text-slate-400">
                    <span className="font-semibold text-amber-400">Status: Unknown</span>
                    {' — '}{data.costUsage.ai_cost_reason}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <MetricCard label="Total Input Tokens" value={data.costUsage.total_input_tokens ?? '—'} />
                  <MetricCard label="Total Output Tokens" value={data.costUsage.total_output_tokens ?? '—'} />
                  <MetricCard label="Total Tokens" value={data.costUsage.total_tokens ?? '—'} />
                  <MetricCard label="Avg Tokens / Analysis" value={data.costUsage.average_tokens_per_completed_analysis ?? '—'} />
                </div>
              )}
            </section>

            {/* Event Coverage */}
            <section>
              <SectionHeader title="Event Coverage Audit" subtitle="Which events have been fired at least once (all-time)" />
              <MetricTable
                title="Expected Events"
                columns={[
                  { key: 'eventType', label: 'Event Type' },
                  { key: 'countAllTime', label: 'All-Time Count', align: 'right', format: 'number' },
                  { key: 'status', label: 'Status', align: 'center', format: 'status' },
                ]}
                rows={data.eventCoverage}
              />
            </section>

            {/* Product Interpretation */}
            <section>
              <SectionHeader title="Product Interpretation" subtitle="Computed readiness signals for private beta traction" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Copy Rate', status: data.productInterpretation.copy_rate_status, desc: '≥40% = strong, 20–39% = acceptable, <20% = weak' },
                  { label: 'Feedback Quality', status: data.productInterpretation.feedback_status, desc: '≥70% positive = strong' },
                  { label: 'Retention Signal', status: data.productInterpretation.retention_status, desc: '≥25% returning = strong' },
                  { label: 'Reliability', status: data.productInterpretation.reliability_status, desc: '<5% failure = strong, 5–15% = warning, >15% = blocking' },
                  { label: 'Beta Traction Signal', status: data.productInterpretation.beta_signal.toLowerCase(), desc: 'Based on copy rate, feedback, and system reliability' },
                  { label: 'Paid Readiness', status: data.productInterpretation.paid_readiness, desc: 'Based on combined signals — Stripe stays disabled' },
                ].map(({ label, status, desc }) => (
                  <div key={label} className="rounded-2xl bg-slate-900 border border-slate-800 px-5 py-4 flex flex-col gap-2">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">{label}</p>
                    <StatusBanner status={status} />
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Privacy footer */}
            <footer className="border-t border-slate-800 pt-6 pb-4">
              <p className="text-xs text-slate-600 text-center">
                All metrics are aggregate-only. No prompt text, user IDs, owner IDs, emails, or share tokens are returned by this panel.
                Subscriptions table: {process.env.STRIPE_ENABLED === 'true' ? 'queried' : 'not queried (STRIPE_ENABLED=false)'}.
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
