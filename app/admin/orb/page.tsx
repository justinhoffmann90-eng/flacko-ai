import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";

const OrbAdminClient = dynamicImport(() => import("./OrbAdminClient"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0a0a0c", color: "#a1a1aa", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Loading Orb admin...
        </p>
      </div>
    </div>
  ),
});

export default function OrbAdminPage() {
  return <OrbAdminClient />;
}
