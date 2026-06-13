import { NextResponse } from 'next/server'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { getPromptAnalysisForOwner, createUsageEvent } from '@/lib/supabase/queries'
import { formatAnalysis } from '@/lib/export/format-analysis'
import { generatePdf } from '@/lib/export/generate-pdf'
import {
  getPlanSlugForUser,
  canExportMarkdown,
  canExportText,
  canExportPdf,
} from '@/lib/plans/config'

export const dynamic = 'force-dynamic'

/**
 * Private response headers required for all export routes.
 * Prevents browsers and CDN proxies from caching private user reports.
 */
const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'Pragma': 'no-cache',
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return new NextResponse('Missing analysis ID', {
        status: 400,
        headers: PRIVATE_CACHE_HEADERS
      })
    }

    const { searchParams } = new URL(request.url)
    const formatParam = searchParams.get('format')

    if (!formatParam || (formatParam !== 'markdown' && formatParam !== 'txt' && formatParam !== 'pdf')) {
      return new NextResponse('Invalid or missing format. Supported: markdown, txt, pdf', {
        status: 400,
        headers: PRIVATE_CACHE_HEADERS
      })
    }

    const format = formatParam as 'markdown' | 'txt' | 'pdf'

    // 1. Resolve session ownership identities (server-side, never trust client)
    const ownerAnonymousId = await getOwnerIdFromCookies()
    const user = await getAuthUser()

    // 2. Fetch prompt analysis and strictly verify owner identity in database filter.
    //    Public share tokens DO NOT grant export access — only private ownership does.
    const record = user
      ? await getPromptAnalysisForOwner(id, ownerAnonymousId, user.id)
      : await getPromptAnalysisForOwner(id, ownerAnonymousId)

    if (!record) {
      // Return 404 — non-owners must not learn whether another result exists
      return new NextResponse('Not Found or Access Denied', {
        status: 404,
        headers: PRIVATE_CACHE_HEADERS
      })
    }

    // 3. Resolve the plan server-side and check export entitlement.
    //    The client cannot override or supply the plan.
    const planSlug = await getPlanSlugForUser(user?.id ?? null)

    if (format === 'pdf') {
      if (!canExportPdf(planSlug)) {
        // Typed JSON response so the UI can show an upgrade CTA instead of a raw 403 page
        return NextResponse.json(
          {
            error: 'entitlement_denied',
            feature: 'exportPdf',
            plan: planSlug,
            upgradeRequired: true,
            message: 'PDF export is available on the Pro plan.'
          },
          {
            status: 403,
            headers: PRIVATE_CACHE_HEADERS
          }
        )
      }
    }

    if (format === 'markdown') {
      if (!canExportMarkdown(planSlug)) {
        // This should not happen given the current contract (all plans allow Markdown),
        // but guard defensively in case the config is changed.
        return NextResponse.json(
          {
            error: 'entitlement_denied',
            feature: 'exportMarkdown',
            plan: planSlug,
            upgradeRequired: true,
            message: 'Markdown export is not available on your current plan.'
          },
          {
            status: 403,
            headers: PRIVATE_CACHE_HEADERS
          }
        )
      }
    }

    if (format === 'txt') {
      if (!canExportText(planSlug)) {
        // This should not happen given the current contract (all plans allow TXT),
        // but guard defensively in case the config is changed.
        return NextResponse.json(
          {
            error: 'entitlement_denied',
            feature: 'exportText',
            plan: planSlug,
            upgradeRequired: true,
            message: 'Plain text export is not available on your current plan.'
          },
          {
            status: 403,
            headers: PRIVATE_CACHE_HEADERS
          }
        )
      }
    }

    // 4. Generate scrubbed formatted content
    const output = format === 'pdf' ? generatePdf(record) : formatAnalysis(record, format)

    // 5. Telemetry logging
    try {
      const eventType =
        format === 'pdf' ? 'export_pdf'
        : format === 'txt' ? 'export_txt'
        : 'export_markdown'

      if (ownerAnonymousId) {
        await createUsageEvent({
          owner_anonymous_id: ownerAnonymousId,
          user_id: user?.id || null,
          event_type: eventType,
          metadata_json: {
            analysis_id: id,
            export_type: format
          }
        })
      }
    } catch (err) {
      console.error(`Failed to log export_${format} usage event:`, err)
    }

    // 6. Return formatted attachment with private cache headers and safe filenames.
    //    Safe filename: uses only the first 8 chars of the UUID — avoids full ID leakage
    //    in Content-Disposition while remaining unique enough for the user.
    const safeId = id.replace(/[^a-z0-9-]/gi, '').slice(0, 8)
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
        ...PRIVATE_CACHE_HEADERS,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="promptpolish-report-${safeId}.${extension}"`
      }
    })

  } catch (error) {
    console.error('Failed to export prompt analysis:', error)
    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: PRIVATE_CACHE_HEADERS
    })
  }
}
