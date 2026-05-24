import { NextResponse } from 'next/server'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { getPromptAnalysisForOwner, getUserProfile, createUsageEvent } from '@/lib/supabase/queries'
import { canExportMarkdown } from '@/lib/plans/config'
import type { PlanSlug } from '@/lib/plans/config'
import type { AnalysisResult } from '@/lib/ai/schemas'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('Missing analysis ID', { status: 400 })
    }

    const ownerAnonymousId = await getOwnerIdFromCookies()
    const user = await getAuthUser()

    // 1. Strict owner check
    const record = user
      ? await getPromptAnalysisForOwner(id, ownerAnonymousId || '', user.id)
      : await getPromptAnalysisForOwner(id, ownerAnonymousId || '')

    if (!record) {
      return new NextResponse('Not Found or Access Denied', { status: 404 })
    }

    // 2. Strict entitlement check
    let planSlug: PlanSlug = 'free'
    if (user) {
      const profile = await getUserProfile(user.id)
      if (profile?.plan_slug === 'pro') {
        planSlug = 'pro'
      }
    }

    if (!canExportMarkdown(planSlug)) {
      return new NextResponse('Pro plan required for Markdown export', { status: 403 })
    }

    // 3. Generate clean Markdown content (scrubbing internal keys, user_ids, and technical metadata)
    const analysis = record.analysis_json as unknown as AnalysisResult
    
    // Score translations
    const scoreLevelLabels: Record<string, string> = {
      excellent: 'Doskonały',
      strong: 'Bardzo dobry',
      decent: 'Dostateczny',
      needs_work: 'Wymaga poprawek',
      weak: 'Słaby'
    }
    const scoreLabel = scoreLevelLabels[record.score_level] || 'Dostateczny'

    // Readable parameters mapping
    const criterionNames: Record<string, string> = {
      goal_clarity: 'Jasność celu',
      context_completeness: 'Kompletność kontekstu',
      structure: 'Struktura promptu',
      constraints: 'Definicje ograniczeń',
      output_format: 'Format wyniku',
      model_profile_fit: 'Dopasowanie do modelu',
      resistance_to_misinterpretation: 'Odporność na błędy',
      cost_efficiency: 'Efektywność kosztowa',
      safety: 'Filtry bezpieczeństwa',
      testability: 'Testowalność i ocena'
    }

    const formattedDate = new Date(record.created_at).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const modelProfileLabel = record.selected_profile_slug === 'openrouter-deepseek-v4-flash'
      ? (record.working_language === 'pl' ? 'Zaawansowany model AI' : 'Advanced AI model')
      : (record.working_language === 'pl' ? 'Uniwersalny model AI' : 'Universal AI model')

    let md = `# Raport Audytu Promptu — PromptPolish\n\n`
    md += `**Data utworzenia:** ${formattedDate}\n`
    md += `**Język roboczy:** ${record.working_language.toUpperCase()}\n`
    md += `**Wybrany profil modelu:** ${modelProfileLabel}\n\n`
    md += `## 1. Ogólna Ocena: ${record.overall_score} / 100 (${scoreLabel})\n\n`
    md += `### Podsumowanie audytu\n${analysis.overall_summary}\n\n`
    md += `## 2. Największe słabości (Top weaknesses)\n`
    analysis.top_weaknesses.forEach((w, i) => {
      md += `${i + 1}. ${w}\n`
    })
    md += `\n`
    md += `## 3. Plan naprawy (Improvement plan)\n`
    analysis.improvement_plan.forEach((step, i) => {
      md += `${i + 1}. ${step}\n`
    })
    md += `\n`
    md += `## 4. Poprawiony Prompt (Optimized Prompt)\n\n`
    md += `\`\`\`\n${record.improved_prompt}\n\`\`\`\n\n`
    md += `## 5. Kryteria szczegółowe\n\n`
    
    analysis.criteria_scores.forEach(item => {
      const name = criterionNames[item.criterion] || item.criterion
      md += `### ${name} (${item.raw_score_0_10} / 10)\n`
      md += `* **Analiza:** ${item.rationale}\n`
      md += `* **Sugerowane ulepszenie:** ${item.improvement_suggestion}\n\n`
    })

    md += `## 6. Dodatkowe uwagi\n\n`
    md += `### Wyjaśnienie Zmian\n`
    analysis.change_explanations.forEach(note => {
      md += `- ${note}\n`
    })
    md += `\n`
    md += `### Zgodność z Modelami\n`
    analysis.model_fit_notes.forEach(note => {
      md += `- ${note}\n`
    })
    md += `\n`
    md += `### Ostrzeżenia (Uncertainty)\n`
    analysis.uncertainty_warnings.forEach(note => {
      md += `- ${note}\n`
    })
    md += `\n`
    md += `### Bezpieczeństwo (Safety)\n`
    analysis.safety_notes.forEach(note => {
      md += `- ${note}\n`
    })
    md += `\n`

    // 4. Telemetry logging - log export_markdown event
    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId || '',
      user_id: user?.id || null,
      event_type: 'export_markdown',
      metadata_json: { analysis_id: id }
    })

    // Return the .md file with attachment headers
    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="promptpolish-audit-${id}.md"`
      }
    })

  } catch (error) {
    console.error('Failed to export markdown:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
