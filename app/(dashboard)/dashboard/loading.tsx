export default function DashboardLoading() {
  return (
    <main className="px-4 py-6 max-w-lg mx-auto md:max-w-none md:max-w-5xl lg:max-w-6xl md:px-0 space-y-4 md:space-y-8">
      {/* Mode Card Skeleton */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 animate-pulse">
        <div className="p-5 md:p-8 lg:p-10">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="h-8 md:h-12 lg:h-14 w-40 md:w-56 bg-zinc-700/50 rounded-lg" />
              <div className="h-4 md:h-5 w-64 md:w-80 bg-zinc-800/50 rounded" />
            </div>
            <div className="h-10 md:h-14 w-32 md:w-40 bg-zinc-700/50 rounded-lg" />
          </div>

          {/* Tier Signals Skeleton */}
          <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/10">
            <div className="grid grid-cols-4 gap-3 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <div className="h-3 md:h-4 w-16 bg-zinc-800/50 rounded" />
                  <div className="h-2 md:h-3 w-12 bg-zinc-800/30 rounded" />
                  <div className="w-4 h-4 md:w-7 md:h-7 lg:w-9 lg:h-9 rounded-full bg-zinc-700/50" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orb Signals Skeleton */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 md:p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-zinc-700/50 rounded" />
          <div className="h-8 w-24 bg-zinc-700/50 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-800/40 rounded-lg" />
          ))}
        </div>
      </div>

      {/* 2-column grid */}
      <div className="md:grid md:grid-cols-2 md:gap-8 space-y-4 md:space-y-0">
        {/* Left column */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 md:p-6 animate-pulse">
            <div className="h-6 w-40 bg-zinc-700/50 rounded mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-zinc-800/40 rounded" />
              <div className="h-4 bg-zinc-800/40 rounded" />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 md:p-6 animate-pulse">
            <div className="h-6 w-32 bg-zinc-700/50 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-800/40 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 md:p-6 animate-pulse">
            <div className="h-6 w-48 bg-zinc-700/50 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-800/40 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 md:p-6 animate-pulse">
            <div className="h-6 w-36 bg-zinc-700/50 rounded mb-4" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-zinc-800/40 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 md:p-6 animate-pulse">
            <div className="h-5 md:h-7 w-5 md:w-7 bg-zinc-700/50 rounded mb-2 md:mb-3" />
            <div className="h-5 w-24 bg-zinc-700/50 rounded mb-2" />
            <div className="h-3 w-full bg-zinc-800/40 rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
