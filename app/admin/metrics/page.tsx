import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { verifyAdminAccess } from '@/lib/admin/auth'
import { MetricsDashboard } from '@/components/admin/metrics-dashboard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin Metrics — PromptPolish',
  description: 'Private beta admin metrics dashboard.',
  robots: { index: false, follow: false },
}

export default async function AdminMetricsPage() {
  const auth = await verifyAdminAccess()

  if (auth.status === 401) {
    redirect('/login?next=/admin/metrics')
  }

  if (auth.status === 403) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-rose-500/30 p-10 text-center space-y-4">
          <div className="text-4xl">🚫</div>
          <h1 className="text-lg font-bold text-rose-400">Access Denied</h1>
          <p className="text-sm text-slate-400">
            You do not have permission to access the admin metrics panel.
            Contact the administrator if you believe this is an error.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-xs font-semibold text-slate-400 hover:text-slate-200 transition border border-slate-700 rounded-lg px-4 py-2"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return <MetricsDashboard />
}
