import dynamicImport from "next/dynamic";
import type { Metadata } from "next";

const BacktestClient = dynamicImport(() => import("./BacktestClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen p-4 bg-[#0a0a0c] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400 font-mono">Loading backtest explorer...</p>
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Backtest Explorer | Flacko AI",
  description:
    "Scan ORB setups for any ticker, compare peers, and run custom backtests with forward return stats.",
};

export default function BacktestPage() {
  return <BacktestClient />;
}

