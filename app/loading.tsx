export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30 px-6 py-20 font-sans selection:bg-indigo-100 antialiased">
      {/* Decorative Blur Elements */}
      <div className="absolute top-20 right-10 -z-10 h-72 w-72 rounded-full bg-indigo-200/20 blur-3xl" />
      <div className="absolute bottom-20 left-10 -z-10 h-72 w-72 rounded-full bg-violet-200/20 blur-3xl" />

      <div className="mx-auto w-full max-w-4xl space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="h-9 w-64 animate-pulse rounded-2xl bg-slate-300" />
          <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-slate-200" />
        </div>

        {/* Card Skeleton 1: Scoring Breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
              <div className="h-6 w-16 animate-pulse rounded-xl bg-slate-300" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-8 animate-pulse rounded-full bg-indigo-200/60" />
                </div>
                <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Card Skeleton 2: Main Content */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="space-y-3">
            <div className="h-5 w-48 animate-pulse rounded-full bg-slate-300" />
            <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-200" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 min-h-[160px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-slate-800" />
              <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-slate-800" />
              <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-slate-800" />
            </div>
            <div className="flex justify-end">
              <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
