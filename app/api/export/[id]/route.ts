import { NextResponse } from 'next/server'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { getPromptAnalysisForOwner, createUsageEvent } from '@/lib/supabase/queries'
import { formatAnalysis } from '@/lib/export/format-analysis'

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

    if (!formatParam || (formatParam !== 'markdown' && formatParam !== 'txt')) {
      return new NextResponse('Invalid or missing format. Supported: markdown, txt', { status: 400 })
    }

    const format = formatParam as 'markdown' | 'txt'

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

    // 3. Generate scrubbed formatted content
    const output = formatAnalysis(record, format)

    // 4. Telemetry logging - log export_markdown or export_txt event
    try {
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId || '',
        user_id: user?.id || null,
        event_type: format === 'txt' ? 'export_txt' : 'export_markdown',
        metadata_json: {
          analysis_id: id,
          export_type: format
        }
      })
    } catch (err) {
      console.error(`Failed to log export_${format} usage event:`, err)
    }

    // 5. Return formatted attachment with safe headers and filenames
    const contentType = format === 'txt' ? 'text/plain; charset=utf-8' : 'text/markdown; charset=utf-8'
    const extension = format === 'txt' ? 'txt' : 'md'

    return new NextResponse(output, {
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
