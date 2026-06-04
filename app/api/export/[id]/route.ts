import { NextResponse } from 'next/server'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { getPromptAnalysisForOwner, createUsageEvent } from '@/lib/supabase/queries'
import { formatAnalysis } from '@/lib/export/format-analysis'
import { generatePdf } from '@/lib/export/generate-pdf'
import { getPlanSlugForUser, canExportMarkdown, canExportPdf } from '@/lib/plans/config'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return new NextResponse('Missing analysis ID', { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const formatParam = searchParams.get('format')

    if (!formatParam || (formatParam !== 'markdown' && formatParam !== 'txt' && formatParam !== 'pdf')) {
      return new NextResponse('Invalid or missing format. Supported: markdown, txt, pdf', { status: 400 })
    }

    const format = formatParam as 'markdown' | 'txt' | 'pdf'

    // 1. Resolve session ownership identities
    const ownerAnonymousId = await getOwnerIdFromCookies()
    const user = await getAuthUser()

    // 2. Fetch prompt analysis and strictly verify owner identity in database filter
    const record = user
      ? await getPromptAnalysisForOwner(id, ownerAnonymousId || '', user.id)
      : await getPromptAnalysisForOwner(id, ownerAnonymousId || '')

    if (!record) {
      return new NextResponse('Not Found or Access Denied', { status: 404 })
    }

    // 2b. Check Pro subscription entitlement for all export formats
    if (format === 'pdf') {
      const planSlug = await getPlanSlugForUser(user?.id || null)
      if (!canExportPdf(planSlug)) {
        return new NextResponse('PDF export requires a Pro subscription', { status: 403 })
      }
    }

    if (format === 'markdown' || format === 'txt') {
      const planSlug = await getPlanSlugForUser(user?.id || null)
      if (!canExportMarkdown(planSlug)) {
        return new NextResponse('Export requires a Pro subscription', { status: 403 })
      }
    }

    // 3. Generate scrubbed formatted content
    const output = format === 'pdf' ? generatePdf(record) : formatAnalysis(record, format)

    // 4. Telemetry logging - log export_markdown, export_txt, or export_pdf event
    try {
      let eventType = 'export_markdown'
      if (format === 'txt') eventType = 'export_txt'
      else if (format === 'pdf') eventType = 'export_pdf'

      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId || '',
        user_id: user?.id || null,
        event_type: eventType,
        metadata_json: {
          analysis_id: id,
          export_type: format
        }
      })
    } catch (err) {
      console.error(`Failed to log export_${format} usage event:`, err)
    }

    // 5. Return formatted attachment with safe headers and filenames
    let contentType = 'text/markdown; charset=utf-8'
    let extension = 'md'

    if (format === 'txt') {
      contentType = 'text/plain; charset=utf-8'
      extension = 'txt'
    } else if (format === 'pdf') {
      contentType = 'application/pdf'
      extension = 'pdf'
    }

    return new NextResponse(output as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="promptpolish-audit-${id}.${extension}"`
      }
    })

  } catch (error) {
    console.error('Failed to export prompt analysis:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

