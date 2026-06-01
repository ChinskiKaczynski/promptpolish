import { NextResponse } from 'next/server'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { getPromptAnalysisForOwner, createUsageEvent } from '@/lib/supabase/queries'
import { canExportPdf, getPlanSlugForUser } from '@/lib/plans/config'
import type { PlanSlug } from '@/lib/plans/config'
import type { AnalysisResult } from '@/lib/ai/schemas'
import { jsPDF } from 'jspdf'

export const dynamic = 'force-dynamic'

function removePolishAccents(text: string): string {
  const map: Record<string, string> = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
  }
  return text.replace(/[ąćęłnósźżĄĆĘŁNÓSŹŻ]/g, match => map[match] || match)
}

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
    const planSlug = await getPlanSlugForUser(user?.id || null)

    if (!canExportPdf(planSlug)) {
      return new NextResponse('Pro plan required for PDF export', { status: 403 })
    }

    const analysis = record.analysis_json as unknown as AnalysisResult

    // Score translations
    const scoreLevelLabels: Record<string, string> = {
      excellent: 'Doskonaly',
      strong: 'Bardzo dobry',
      decent: 'Dostateczny',
      needs_work: 'Wymaga poprawek',
      weak: 'Slaby'
    }
    const scoreLabel = scoreLevelLabels[record.score_level] || 'Dostateczny'

    // Readable parameters mapping
    const criterionNames: Record<string, string> = {
      goal_clarity: 'Jasnosc celu',
      context_completeness: 'Kompletnosc kontekstu',
      structure: 'Struktura promptu',
      constraints: 'Definicje ograniczen',
      output_format: 'Format wyniku',
      model_profile_fit: 'Dopasowanie do modelu',
      resistance_to_misinterpretation: 'Odpornosc na bledy',
      cost_efficiency: 'Efektywnosc kosztowa',
      safety: 'Filtry bezpieczenstwa',
      testability: 'Testowalnosc i ocena'
    }

    const formattedDate = new Date(record.created_at).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // 3. Generate clean PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    let y = 20
    const pageHeight = doc.internal.pageSize.height || 297
    const margin = 20
    const maxY = pageHeight - margin

    function addText(text: string, size = 10, bold = false, font = 'helvetica') {
      doc.setFontSize(size)
      doc.setFont(font, bold ? 'bold' : 'normal')
      
      const cleanText = removePolishAccents(text)
      const lines = doc.splitTextToSize(cleanText, 170)
      
      lines.forEach((line: string) => {
        if (y + 6 > maxY) {
          doc.addPage()
          y = margin
        }
        doc.text(line, margin, y)
        y += 6
      })
    }

    function addSpacing(height: number) {
      y += height
    }

    function addDivider() {
      if (y + 4 > maxY) {
        doc.addPage()
        y = margin
      }
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, 190, y)
      y += 6
    }

    // Title & Header
    addText('Raport Audytu Promptu — PromptPolish', 18, true)
    addSpacing(2)
    addDivider()

    addText(`Data utworzenia: ${formattedDate}`, 9)
    addText(`Jezyk roboczy: ${record.working_language.toUpperCase()}`, 9)
    const modelProfileLabel = record.selected_profile_slug === 'openrouter-deepseek-v4-flash'
      ? (record.working_language === 'pl' ? 'Zaawansowany model AI' : 'Advanced AI model')
      : (record.working_language === 'pl' ? 'Uniwersalny model AI' : 'Universal AI model')

    addText(`Wybrany profil modelu: ${modelProfileLabel}`, 9)
    addSpacing(4)

    // Section 1: Score
    addText('1. Ogolna Ocena', 14, true)
    addSpacing(2)
    addText(`Score: ${record.overall_score} / 100 (${scoreLabel})`, 11, true)
    addSpacing(2)
    addText('Podsumowanie audytu:', 10, true)
    addText(analysis.overall_summary, 10)
    addSpacing(4)

    // Section 2: Weaknesses
    addText('2. Najwieksze slabosci (Top weaknesses)', 12, true)
    addSpacing(2)
    analysis.top_weaknesses.forEach((w, i) => {
      addText(`${i + 1}. ${w}`, 10)
    })
    addSpacing(4)

    // Section 3: Improvement Plan
    addText('3. Plan naprawy (Improvement plan)', 12, true)
    addSpacing(2)
    analysis.improvement_plan.forEach((step, i) => {
      addText(`${i + 1}. ${step}`, 10)
    })
    addSpacing(4)

    // Section 4: Improved Prompt
    addText('4. Poprawiony Prompt (Optimized Prompt)', 12, true)
    addSpacing(2)
    
    // Draw prompt inside a clean layout with courier font
    doc.setFontSize(9)
    doc.setFont('courier', 'normal')
    const promptLines = doc.splitTextToSize(removePolishAccents(record.improved_prompt), 170)
    promptLines.forEach((line: string) => {
      if (y + 5 > maxY) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 5
    })
    addSpacing(4)

    // Section 5: Criteria scores
    addText('5. Kryteria szczegolowe', 12, true)
    addSpacing(2)
    analysis.criteria_scores.forEach(item => {
      const name = criterionNames[item.criterion] || item.criterion
      addText(`* ${name} (${item.raw_score_0_10} / 10)`, 10, true)
      addText(`  Analiza: ${item.rationale}`, 9)
      addText(`  Sugerowane ulepszenie: ${item.improvement_suggestion}`, 9)
      addSpacing(2)
    })
    addSpacing(4)

    // Section 6: Additional notes
    addText('6. Dodatkowe uwagi', 12, true)
    addSpacing(2)
    
    addText('Wyjasnienie Zmian:', 10, true)
    analysis.change_explanations.forEach(note => {
      addText(`- ${note}`, 9)
    })
    addSpacing(2)

    addText('Zgodnosc z Modelami:', 10, true)
    analysis.model_fit_notes.forEach(note => {
      addText(`- ${note}`, 9)
    })
    addSpacing(2)

    addText('Ostrzezenia (Uncertainty):', 10, true)
    analysis.uncertainty_warnings.forEach(note => {
      addText(`- ${note}`, 9)
    })
    addSpacing(2)

    addText('Bezpieczenstwo (Safety):', 10, true)
    analysis.safety_notes.forEach(note => {
      addText(`- ${note}`, 9)
    })

    // Output buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // 4. Telemetry logging - log export_pdf event
    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId || '',
      user_id: user?.id || null,
      event_type: 'export_pdf',
      metadata_json: { analysis_id: id }
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="promptpolish-audit-${id}.pdf"`
      }
    })

  } catch (error) {
    console.error('Failed to export pdf:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
