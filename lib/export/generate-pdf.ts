import { jsPDF } from 'jspdf'
import type { PromptAnalysisRow } from '@/lib/supabase/types'
import type { AnalysisResult } from '@/lib/ai/schemas'
import { NOTO_SANS_REGULAR_BASE64 } from './fonts/noto-sans-regular'
import { normalizeNewlines } from './format-analysis'

const TRANSLATIONS = {
  pl: {
    title: 'Raport Audytu Promptu — PromptPolish',
    date: 'Data utworzenia',
    lang: 'Język roboczy',
    profile: 'Profil modelu',
    score: '1. Ogólna Ocena',
    summary: 'Podsumowanie audytu',
    weaknesses: '2. Największe słabości',
    plan: '3. Plan naprawy',
    improvedPrompt: '4. Poprawiony Prompt',
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

export function generatePdf(record: PromptAnalysisRow): Uint8Array {
  const lang = record.working_language === 'pl' ? 'pl' : 'en'
  const t = TRANSLATIONS[lang]
  const analysis = record.analysis_json as unknown as AnalysisResult

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Embed NotoSans Regular (OFL license) for Unicode support (Polish diacritics: ą ć ę ł ń ó ś ź ż)
  doc.addFileToVFS('NotoSans-Regular.ttf', NOTO_SANS_REGULAR_BASE64)
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'bold') // reuse same TTF; bold fallback

  let currentY = 20
  const margin = 20
  const printWidth = 170 // 210 - 20 - 20

  // Set default font to NotoSans for all text
  doc.setFont('NotoSans', 'normal')


  // 1. Document Title
  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(15, 23, 42) // Slate 900
  doc.text(t.title, margin, currentY)
  currentY += 10

  // 2. Metadata details
  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139) // Slate 500
  
  const formattedDate = new Date(record.created_at).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const modelProfile = getModelProfileLabel(record.selected_profile_slug, lang)
  
  doc.text(`${t.date}: ${formattedDate}   |   ${t.lang}: ${record.working_language.toUpperCase()}   |   ${t.profile}: ${modelProfile}`, margin, currentY)
  currentY += 8

  // Horizontal divider
  doc.setDrawColor(226, 232, 240) // Slate 200
  doc.setLineWidth(0.5)
  doc.line(margin, currentY, margin + printWidth, currentY)
  currentY += 10

  // 3. Overall Score Callout
  const scoreLabel = t.scoreLevels[record.score_level] || record.score_level
  doc.setFillColor(241, 245, 249) // Slate 100
  doc.roundedRect(margin, currentY, printWidth, 22, 3, 3, 'F')
  
  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105) // Slate 600
  doc.text(t.score.toUpperCase(), margin + 6, currentY + 7)
  
  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(79, 70, 229) // Indigo 600
  doc.text(`${record.overall_score}`, margin + 6, currentY + 16)
  
  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139) // Slate 500
  doc.text(`/ 100  (${scoreLabel})`, margin + 20, currentY + 15)
  currentY += 30

  // 4. Audit Summary
  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text(t.summary, margin, currentY)
  currentY += 7

  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  const summaryLines = doc.splitTextToSize(analysis.overall_summary, printWidth)
  for (const line of summaryLines) {
    if (currentY + 6 > 277) {
      doc.addPage()
      currentY = 20
    }
    doc.text(line, margin, currentY)
    currentY += 6
  }
  currentY += 6

  // 5. Top Weaknesses
  if (currentY + 15 > 277) {
    doc.addPage()
    currentY = 20
  }
  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text(t.weaknesses, margin, currentY)
  currentY += 7

  analysis.top_weaknesses.forEach((w, i) => {
    const text = `${i + 1}. ${w}`
    doc.setFont('NotoSans', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(51, 65, 85)
    const lines = doc.splitTextToSize(text, printWidth - 5)
    lines.forEach((line: string) => {
      if (currentY + 5 > 277) {
        doc.addPage()
        currentY = 20
      }
      doc.text(line, margin + 4, currentY)
      currentY += 5
    })
    currentY += 2
  })
  currentY += 4

  // 6. Improvement Plan
  if (currentY + 15 > 277) {
    doc.addPage()
    currentY = 20
  }
  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text(t.plan, margin, currentY)
  currentY += 7

  analysis.improvement_plan.forEach((step, i) => {
    const text = `${i + 1}. ${step}`
    doc.setFont('NotoSans', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(51, 65, 85)
    const lines = doc.splitTextToSize(text, printWidth - 5)
    lines.forEach((line: string) => {
      if (currentY + 5 > 277) {
        doc.addPage()
        currentY = 20
      }
      doc.text(line, margin + 4, currentY)
      currentY += 5
    })
    currentY += 2
  })
  currentY += 6

  // 7. Optimized Prompt (Code Block style)
  if (currentY + 25 > 277) {
    doc.addPage()
    currentY = 20
  }
  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text(t.improvedPrompt, margin, currentY)
  currentY += 7

  const improvedPrompt = normalizeNewlines(record.improved_prompt)
  const promptLines = improvedPrompt.split('\n')
  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)

  const leftBorderX = margin + 2
  const textStartX = margin + 6

  promptLines.forEach((pLine) => {
    if (pLine.trim() === '') {
      if (currentY + 5 > 277) {
        doc.addPage()
        currentY = 20
      }
      doc.setDrawColor(79, 70, 229) // Indigo Accent Line
      doc.setLineWidth(1)
      doc.line(leftBorderX, currentY - 3, leftBorderX, currentY + 2)
      currentY += 5
      return
    }

    const lines = doc.splitTextToSize(pLine, printWidth - 8)
    lines.forEach((line: string) => {
      if (currentY + 5 > 277) {
        doc.addPage()
        currentY = 20
      }
      doc.setDrawColor(79, 70, 229)
      doc.setLineWidth(1)
      doc.line(leftBorderX, currentY - 3, leftBorderX, currentY + 2)
      
      doc.text(line, textStartX, currentY)
      currentY += 5
    })
  })
  currentY += 8

  // 8. Detailed Criteria
  if (currentY + 20 > 277) {
    doc.addPage()
    currentY = 20
  }
  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text(t.criteria, margin, currentY)
  currentY += 7

  analysis.criteria_scores.forEach((item) => {
    const criterionName = t.criteriaNames[item.criterion as keyof typeof t.criteriaNames] || item.criterion
    
    if (currentY + 22 > 277) {
      doc.addPage()
      currentY = 20
    }
    
    doc.setFont('NotoSans', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(`${criterionName} (${item.raw_score_0_10} / 10)`, margin, currentY)
    currentY += 5
    
    doc.setFont('NotoSans', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(71, 85, 105)
    
    const rationalLabel = lang === 'pl' ? '* Analiza: ' : '* Rationale: '
    const rationalText = rationalLabel + item.rationale
    const rationalLines = doc.splitTextToSize(rationalText, printWidth)
    rationalLines.forEach((line: string) => {
      if (currentY + 5 > 277) {
        doc.addPage()
        currentY = 20
      }
      doc.text(line, margin, currentY)
      currentY += 5
    })
    
    const suggestionLabel = lang === 'pl' ? '* Rekomendacja: ' : '* Recommendation: '
    const suggestionText = suggestionLabel + item.improvement_suggestion
    const suggestionLines = doc.splitTextToSize(suggestionText, printWidth)
    suggestionLines.forEach((line: string) => {
      if (currentY + 5 > 277) {
        doc.addPage()
        currentY = 20
      }
      doc.text(line, margin, currentY)
      currentY += 5
    })
    
    currentY += 3
  })
  currentY += 4

  // 9. Additional Notes
  const noteSections = [
    { title: t.changes, notes: analysis.change_explanations },
    { title: t.modelFit, notes: analysis.model_fit_notes },
    { title: t.uncertainty, notes: analysis.uncertainty_warnings },
    { title: t.safety, notes: analysis.safety_notes }
  ]

  const hasAdditionalNotes = noteSections.some(s => s.notes && s.notes.length > 0)
  
  if (hasAdditionalNotes) {
    if (currentY + 20 > 277) {
      doc.addPage()
      currentY = 20
    }
    
    doc.setFont('NotoSans', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(15, 23, 42)
    doc.text(t.additionalNotes, margin, currentY)
    currentY += 7
    
    noteSections.forEach((sec) => {
      if (!sec.notes || sec.notes.length === 0) return
      
      if (currentY + 15 > 277) {
        doc.addPage()
        currentY = 20
      }
      
      doc.setFont('NotoSans', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(71, 85, 105)
      doc.text(sec.title, margin, currentY)
      currentY += 5
      
      sec.notes.forEach((note) => {
        doc.setFont('NotoSans', 'normal')
        doc.setFontSize(9.5)
        doc.setTextColor(100, 116, 139)
        const noteText = `- ${note}`
        const lines = doc.splitTextToSize(noteText, printWidth)
        lines.forEach((line: string) => {
          if (currentY + 5 > 277) {
            doc.addPage()
            currentY = 20
          }
          doc.text(line, margin, currentY)
          currentY += 5
        })
      })
      currentY += 2
    })
  }

  // 10. Disclaimer Footer
  if (currentY + 22 > 277) {
    doc.addPage()
    currentY = 20
  }
  
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(margin, currentY, margin + printWidth, currentY)
  currentY += 6
  
  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(148, 163, 184)
  const disclaimerLines = doc.splitTextToSize(t.disclaimer, printWidth)
  disclaimerLines.forEach((line: string) => {
    if (currentY + 4 > 277) {
      doc.addPage()
      currentY = 20
    }
    doc.text(line, margin, currentY)
    currentY += 4
  })

  // Return the PDF as raw binary buffer
  const pdfBuffer = doc.output('arraybuffer')
  return new Uint8Array(pdfBuffer)
}
