export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0C0C10] px-6 py-20 font-sans selection:bg-[#A78BFA]/20 antialiased">
      <div className="absolute top-20 right-10 -z-10 h-72 w-72 rounded-full bg-violet-900/15 blur-3xl" />
      <div className="absolute bottom-20 left-10 -z-10 h-72 w-72 rounded-full bg-indigo-900/10 blur-3xl" />

      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="space-y-3">
          <div className="h-3 w-28 animate-pulse rounded-full bg-[#1C1C27]" />
          <div className="h-8 w-64 animate-pulse rounded-xl bg-[#1C1C27]" />
          <div className="h-3 w-full max-w-md animate-pulse rounded-full bg-[#13131A]" />
        </div>

        <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#2A2A3A] pb-4">
            <div className="space-y-2">
              <div className="h-3 w-32 animate-pulse rounded-full bg-[#1C1C27]" />
              <div className="h-6 w-16 animate-pulse rounded-lg bg-[#1C1C27]" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded-full bg-[#1C1C27]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-[#2A2A3A] bg-[#1C1C27] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-[#2A2A3A]" />
                  <div className="h-3 w-8 animate-pulse rounded-full bg-[#A78BFA]/20" />
                </div>
                <div className="h-1.5 w-full animate-pulse rounded-full bg-[#2A2A3A]" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 space-y-6">
          <div className="space-y-3">
            <div className="h-4 w-48 animate-pulse rounded-full bg-[#1C1C27]" />
            <div className="h-3 w-full animate-pulse rounded-full bg-[#13131A]" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-[#13131A]" />
          </div>
          <div className="rounded-lg border border-[#2A2A3A] bg-[#0C0C10] p-6 min-h-[160px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-[#1C1C27]" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#1C1C27]" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#1C1C27]" />
            </div>
            <div className="flex justify-end">
              <div className="h-9 w-28 animate-pulse rounded-lg bg-[#1C1C27]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
