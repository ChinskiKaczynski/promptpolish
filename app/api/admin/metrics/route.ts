import { NextResponse, NextRequest } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin/auth'
import { fetchAggregatedMetrics, type MetricsWindow } from '@/lib/admin/metrics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAccess()
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const windowParam = searchParams.get('window') || 'allTime'

    const validWindows: MetricsWindow[] = ['allTime', 'last30d', 'last7d', 'last24h']
    const window = validWindows.includes(windowParam as MetricsWindow)
      ? (windowParam as MetricsWindow)
      : 'allTime'

    const metrics = await fetchAggregatedMetrics(window)
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('[GET /api/admin/metrics Error]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
