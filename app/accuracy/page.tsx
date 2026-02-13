"use client";

export default function AccuracyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="text-5xl">🎯</div>
        <h1 className="text-2xl font-bold">accuracy tracker</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          we&apos;re building a public accuracy dashboard so you can verify our track record — 
          every level, every scenario, every call.
        </p>
        <p className="text-zinc-500 text-xs">
          coming soon. transparency isn&apos;t optional.
        </p>
        <a
          href="/"
          className="inline-block text-sm text-white underline hover:text-zinc-300"
        >
          ← back to home
        </a>
      </div>
    </div>
  );
}
