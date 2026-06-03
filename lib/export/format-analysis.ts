import type { PromptAnalysisRow } from '@/lib/supabase/types'
import type { AnalysisResult } from '@/lib/ai/schemas'

const TRANSLATIONS = {
  pl: {
    title: 'Raport Audytu Promptu — PromptPolish',
    date: 'Data utworzenia',
    lang: 'Język roboczy',
    profile: 'Profil modelu',
    score: '1. Ogólna Ocena',
    summary: 'Podsumowanie audytu',
    weaknesses: '2. Największe słabości (Top weaknesses)',
    plan: '3. Plan naprawy (Improvement plan)',
    improvedPrompt: '4. Poprawiony Prompt (Optimized Prompt)',
    criteria: '5. Kryteria szczegółowe',
    additionalNotes: '6. Dodatkowe uwagi',
    changes: 'Wyjaśnienie zmian',
    modelFit: 'Zgodność z profilem audytu',
    uncertainty: 'Ostrzeżenia',
    safety: 'Bezpieczeństwo',
    disclaimer: 'Uwaga: Wygenerowany raport i ulepszony prompt mają charakter pomocniczy. Przed użyciem promptu w krytycznych procesach zaleca się jego samodzielną weryfikację.',
    scoreLevels: {
      excellent: 'Doskonały',
      strong: 'Bardzo dobry',
      decent: 'Dostateczny',
      needs_work: 'Wymaga poprawek',
      weak: 'Słaby'
    },
    criteriaNames: {
      goal_clarity: 'Jasność celu',
      context_completeness: 'Kompletność kontekstu',
      structure: 'Struktura promptu',
      constraints: 'Definicje ograniczeń',
      output_format: 'Format wyniku',
      model_profile_fit: 'Dopasowanie do profilu audytu',
      resistance_to_misinterpretation: 'Odporność na błędy interpretacji',
      cost_efficiency: 'Efektywność kosztowa',
      safety: 'Filtry bezpieczeństwa',
      testability: 'Testowalność i ocena'
    }
  },
  en: {
    title: 'Prompt Audit Report — PromptPolish',
    date: 'Creation date',
    lang: 'Working language',
    profile: 'Model profile',
    score: '1. Overall Score',
    summary: 'Audit summary',
    weaknesses: '2. Top weaknesses',
    plan: '3. Improvement plan',
    improvedPrompt: '4. Optimized Prompt',
    criteria: '5. Detailed criteria',
    additionalNotes: '6. Additional notes',
    changes: 'Explanation of changes',
    modelFit: 'Audit profile fit',
    uncertainty: 'Uncertainty warnings',
    safety: 'Safety notes',
    disclaimer: 'Note: The generated report and improved prompt are provided as-is. It is recommended to verify the output before using the prompt in critical workflows.',
    scoreLevels: {
      excellent: 'Excellent',
      strong: 'Strong',
      decent: 'Decent',
      needs_work: 'Needs work',
      weak: 'Weak'
    },
    criteriaNames: {
      goal_clarity: 'Goal clarity',
      context_completeness: 'Context completeness',
      structure: 'Prompt structure',
      constraints: 'Constraints definitions',
      output_format: 'Output format',
      model_profile_fit: 'Model profile fit',
      resistance_to_misinterpretation: 'Resistance to misinterpretation',
      cost_efficiency: 'Cost efficiency',
      safety: 'Safety filters',
      testability: 'Testability and evaluation'
    }
  }
} as const

function getModelProfileLabel(slug: string, lang: 'pl' | 'en'): string {
  if (slug === 'openrouter-deepseek-v4-flash') {
    return lang === 'pl'
      ? 'Model zaawansowany (DeepSeek v4 Flash)'
      : 'Advanced Model (DeepSeek v4 Flash)'
  }
  if (slug === 'general-llm') {
    return lang === 'pl'
      ? 'Model uniwersalny (General LLM)'
      : 'Universal Model (General LLM)'
  }
  return slug
}

export function formatAnalysis(record: PromptAnalysisRow, format: 'markdown' | 'txt'): string {
  const lang = record.working_language === 'pl' ? 'pl' : 'en'
  const t = TRANSLATIONS[lang]
  const analysis = record.analysis_json as unknown as AnalysisResult

  const formattedDate = new Date(record.created_at).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const scoreLabel = t.scoreLevels[record.score_level] || record.score_level
  const modelProfile = getModelProfileLabel(record.selected_profile_slug, lang)

  if (format === 'markdown') {
    let md = `# ${t.title}\n\n`
    md += `**${t.date}:** ${formattedDate}\n`
    md += `**${t.lang}:** ${record.working_language.toUpperCase()}\n`
    md += `**${t.profile}:** ${modelProfile}\n\n`
    
    md += `## ${t.score}: ${record.overall_score} / 100 (${scoreLabel})\n\n`
    md += `### ${t.summary}\n${analysis.overall_summary}\n\n`
    
    md += `## ${t.weaknesses}\n`
    analysis.top_weaknesses.forEach((w, i) => {
      md += `${i + 1}. ${w}\n`
    })
    md += `\n`

    md += `## ${t.plan}\n`
    analysis.improvement_plan.forEach((step, i) => {
      md += `${i + 1}. ${step}\n`
    })
    md += `\n`

    md += `## ${t.improvedPrompt}\n\n`
    md += `\`\`\`text\n${record.improved_prompt}\n\`\`\`\n\n`

    md += `## ${t.criteria}\n\n`
    analysis.criteria_scores.forEach(item => {
      const name = t.criteriaNames[item.criterion as keyof typeof t.criteriaNames] || item.criterion
      md += `### ${name} (${item.raw_score_0_10} / 10)\n`
      md += `* **Analiza:** ${item.rationale}\n`
      md += `* **Sugerowane ulepszenie:** ${item.improvement_suggestion}\n\n`
    })

    md += `## ${t.additionalNotes}\n\n`
    
    if (analysis.change_explanations.length > 0) {
      md += `### ${t.changes}\n`
      analysis.change_explanations.forEach(note => {
        md += `- ${note}\n`
      })
      md += `\n`
    }

    if (analysis.model_fit_notes.length > 0) {
      md += `### ${t.modelFit}\n`
      analysis.model_fit_notes.forEach(note => {
        md += `- ${note}\n`
      })
      md += `\n`
    }

    if (analysis.uncertainty_warnings.length > 0) {
      md += `### ${t.uncertainty}\n`
      analysis.uncertainty_warnings.forEach(note => {
        md += `- ${note}\n`
      })
      md += `\n`
    }

    if (analysis.safety_notes.length > 0) {
      md += `### ${t.safety}\n`
      analysis.safety_notes.forEach(note => {
        md += `- ${note}\n`
      })
      md += `\n`
    }

    md += `---\n`
    md += `*${t.disclaimer}*\n`
    return md
  } else {
    // Plain Text format
    const width = 80
    const separator = '='.repeat(width)
    const subSeparator = '-'.repeat(width)

    let txt = `${separator}\n`
    txt += `${t.title.toUpperCase().padStart(Math.floor((width + t.title.length) / 2))}\n`
    txt += `${separator}\n\n`
    
    txt += `${t.date}: ${formattedDate}\n`
    txt += `${t.lang}: ${record.working_language.toUpperCase()}\n`
    txt += `${t.profile}: ${modelProfile}\n\n`

    txt += `${subSeparator}\n`
    txt += `${t.score.toUpperCase()}: ${record.overall_score} / 100 (${scoreLabel.toUpperCase()})\n`
    txt += `${subSeparator}\n\n`

    txt += `${t.summary.toUpperCase()}:\n${analysis.overall_summary}\n\n`

    txt += `${subSeparator}\n`
    txt += `${t.weaknesses.toUpperCase()}\n`
    txt += `${subSeparator}\n`
    analysis.top_weaknesses.forEach((w, i) => {
      txt += `${i + 1}. ${w}\n`
    })
    txt += `\n`

    txt += `${subSeparator}\n`
    txt += `${t.plan.toUpperCase()}\n`
    txt += `${subSeparator}\n`
    analysis.improvement_plan.forEach((step, i) => {
      txt += `${i + 1}. ${step}\n`
    })
    txt += `\n`

    txt += `${subSeparator}\n`
    txt += `${t.improvedPrompt.toUpperCase()}\n`
    txt += `${subSeparator}\n`
    txt += `${record.improved_prompt}\n\n`

    txt += `${subSeparator}\n`
    txt += `${t.criteria.toUpperCase()}\n`
    txt += `${subSeparator}\n`
    analysis.criteria_scores.forEach(item => {
      const name = t.criteriaNames[item.criterion as keyof typeof t.criteriaNames] || item.criterion
      txt += `* ${name} (${item.raw_score_0_10}/10)\n`
      txt += `  Analiza: ${item.rationale}\n`
      txt += `  Sugerowane ulepszenie: ${item.improvement_suggestion}\n\n`
    })

    txt += `${subSeparator}\n`
    txt += `${t.additionalNotes.toUpperCase()}\n`
    txt += `${subSeparator}\n`

    if (analysis.change_explanations.length > 0) {
      txt += `${t.changes}:\n`
      analysis.change_explanations.forEach(note => {
        txt += `- ${note}\n`
      })
      txt += `\n`
    }

    if (analysis.model_fit_notes.length > 0) {
      txt += `${t.modelFit}:\n`
      analysis.model_fit_notes.forEach(note => {
        txt += `- ${note}\n`
      })
      txt += `\n`
    }

    if (analysis.uncertainty_warnings.length > 0) {
      txt += `${t.uncertainty}:\n`
      analysis.uncertainty_warnings.forEach(note => {
        txt += `- ${note}\n`
      })
      txt += `\n`
    }

    if (analysis.safety_notes.length > 0) {
      txt += `${t.safety}:\n`
      analysis.safety_notes.forEach(note => {
        txt += `- ${note}\n`
      })
      txt += `\n`
    }

    txt += `${subSeparator}\n`
    txt += `* ${t.disclaimer}\n`
    txt += `${separator}\n`
    return txt
  }
}
