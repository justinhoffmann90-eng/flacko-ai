export default function OrbLoading() {
  return (
    <div className="min-h-screen p-4 bg-[#0a0a0c]">
      <div className="max-w-3xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6 animate-pulse">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-zinc-800/50 md:hidden" />
            <div className="h-9 w-32 bg-zinc-700/50 rounded-lg" />
          </div>
          <div className="h-4 w-64 bg-zinc-800/40 rounded mt-2" />
        </div>

        {/* Orb Score Skeleton */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 md:p-6 mb-4 animate-pulse">
          <div className="h-3 w-24 bg-zinc-800/40 rounded mb-3" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-8 md:h-10 w-48 bg-zinc-700/50 rounded-lg" />
              <div className="h-4 w-64 bg-zinc-800/40 rounded" />
              <div className="h-3 w-56 bg-zinc-800/30 rounded" />
            </div>
            <div className="text-right space-y-2">
              <div className="h-10 w-20 bg-zinc-700/50 rounded-lg" />
              <div className="h-3 w-16 bg-zinc-800/40 rounded" />
            </div>
          </div>
        </div>

        {/* Zone Summary Table Skeleton */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-3 md:p-4 mb-4 animate-pulse">
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="h-4 w-32 bg-zinc-700/40 rounded" />
                <div className="flex gap-4">
                  <div className="h-4 w-12 bg-zinc-700/40 rounded" />
                  <div className="h-4 w-10 bg-zinc-700/40 rounded" />
                  <div className="h-4 w-10 bg-zinc-700/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Setup Cards Skeleton */}
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 space-y-2">
                    {/* Badge */}
                    <div className="h-5 w-24 bg-zinc-700/40 rounded-full" />
                    
                    {/* Title */}
                    <div className="h-6 w-48 bg-zinc-700/50 rounded" />
                    
                    {/* Description */}
                    <div className="h-4 w-full bg-zinc-800/40 rounded" />
                    <div className="h-4 w-3/4 bg-zinc-800/40 rounded" />
                    
                    {/* Tags */}
                    <div className="flex gap-2 mt-2">
                      <div className="h-5 w-16 bg-zinc-800/40 rounded-full" />
                      <div className="h-5 w-20 bg-zinc-800/40 rounded-full" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3">
                    <div className="text-center space-y-1">
                      <div className="h-12 w-12 rounded-full bg-zinc-700/40 mx-auto" />
                      <div className="h-3 w-16 bg-zinc-800/40 rounded" />
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-8 w-16 bg-zinc-700/40 rounded" />
                      <div className="h-3 w-20 bg-zinc-800/40 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800/50 space-y-1 animate-pulse">
          <div className="h-3 w-full bg-zinc-800/30 rounded" />
          <div className="h-3 w-5/6 bg-zinc-800/30 rounded" />
        </div>
      </div>
    </div>
  );
}
