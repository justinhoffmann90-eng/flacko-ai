"use client";
// REBUILD: v3 backlog fix - Feb 2, 2026 6:59pm CT

import Link from "next/link";
import {
  categories,
  goal1Strong,
  goal1Weak,
  goal2Strong,
  goal2Weak,
  goal3Strong,
  goal3Weak,
  backlogStorage,
  codexPriorities,
  allStrongItems,
  allWeakItems,
} from "./data";

export default function AdminBacklogPage() {
  const goal1Total = goal1Strong.length + goal1Weak.length;
  const goal2Total = goal2Strong.length + goal2Weak.length;
  const goal3Total = goal3Strong.length + goal3Weak.length;
  const totalActive = allStrongItems.length;
  const totalBacklogged = allWeakItems.length;
  const totalEvaluated = totalActive + totalBacklogged;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-black/20 border-b border-white/10 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-lg font-bold text-blue-400">Product Backlog</div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1 text-sm">
                <Link href="/admin/reports" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Upload Report
                </Link>
                <Link href="/admin/subscribers" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Subscribers
                </Link>
                <Link href="/admin/command-center" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Command Center
                </Link>
                <Link href="/admin/command-center/updates" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Updates
                </Link>
                <Link href="/admin/backlog" className="px-3 py-2 rounded bg-white/10 text-white">
                  Backlog
                </Link>
                <Link href="/admin/dashboard/roles" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Roles
                </Link>
                <Link href="/admin/dashboard/docs" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Docs
                </Link>
              </div>
              <div className="text-right text-sm text-gray-400">
                <div className="text-lg font-bold text-blue-400">
                  {new Date().toLocaleTimeString("en-US", {
                    timeZone: "America/Chicago",
                    hour12: true,
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8 mb-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Flacko AI Product Backlog v3</h1>
          <p className="text-gray-400 text-lg">
            Critically Analyzed + Enhanced with Better Ideas | February 2, 2026
          </p>
        </div>

        {/* Goal 1: Grow Subscribers */}
        <div className="space-y-4">
          <div className="bg-green-900/20 border-2 border-green-700/40 rounded-xl p-6">
            <h2 className="text-3xl font-bold text-green-400 mb-2">
              🎯 GOAL 1: Grow Subscribers
            </h2>
          </div>

          {/* Strong Items */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">✅ STRONG IDEAS (Keep & Prioritize)</h3>
            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 border-b border-white/10">
                    <th className="px-4 py-3 text-left font-semibold text-white w-12">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Item</th>
                    <th className="px-4 py-3 text-center font-semibold text-white w-24">Rating</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Why Strong</th>
                  </tr>
                </thead>
                <tbody>
                  {goal1Strong.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? "bg-white/5" : ""}>
                      <td className="px-4 py-3 font-bold text-center">{item.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.title}</span>
                          {item.isNew && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white">NEW</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={item.stars === 5 ? "text-green-400 font-bold" : "text-yellow-400 font-bold"}>
                          {item.rating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{item.assessment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weak Items */}
          <div className="bg-yellow-900/20 border-l-4 border-yellow-600 rounded-lg p-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-3">⚠️ MOVED TO BACKLOG</h3>
            <div className="space-y-2">
              {goal1Weak.map((item) => (
                <div key={item.id} className="text-gray-300">
                  • <span className="font-semibold text-orange-400">{item.title}</span> — {item.reason}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Goal 2: Streamline Workflows */}
        <div className="space-y-4">
          <div className="bg-orange-900/20 border-2 border-orange-700/40 rounded-xl p-6">
            <h2 className="text-3xl font-bold text-orange-400 mb-2">
              ⚡ GOAL 2: Streamline Workflows
            </h2>
          </div>

          {/* Strong Items */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">✅ STRONG IDEAS (Keep & Prioritize)</h3>
            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 border-b border-white/10">
                    <th className="px-4 py-3 text-left font-semibold text-white w-12">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Item</th>
                    <th className="px-4 py-3 text-center font-semibold text-white w-24">Rating</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Why Strong</th>
                  </tr>
                </thead>
                <tbody>
                  {goal2Strong.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? "bg-white/5" : ""}>
                      <td className="px-4 py-3 font-bold text-center">{item.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.title}</span>
                          {item.isNew && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white">NEW</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={item.stars === 5 ? "text-green-400 font-bold" : item.stars === 4 ? "text-lime-400 font-bold" : "text-yellow-400 font-bold"}>
                          {item.rating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{item.assessment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weak Items */}
          <div className="bg-yellow-900/20 border-l-4 border-yellow-600 rounded-lg p-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-3">⚠️ MOVED TO BACKLOG</h3>
            <div className="space-y-2">
              {goal2Weak.map((item) => (
                <div key={item.id} className="text-gray-300">
                  • <span className="font-semibold text-orange-400">{item.title}</span> — {item.reason}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Goal 3: Platform Excellence */}
        <div className="space-y-4">
          <div className="bg-blue-900/20 border-2 border-blue-700/40 rounded-xl p-6">
            <h2 className="text-3xl font-bold text-blue-400 mb-2">
              🏗️ GOAL 3: Platform Excellence
            </h2>
          </div>

          {/* Strong Items */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">✅ STRONG IDEAS (Keep & Prioritize)</h3>
            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 border-b border-white/10">
                    <th className="px-4 py-3 text-left font-semibold text-white w-12">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Item</th>
                    <th className="px-4 py-3 text-center font-semibold text-white w-24">Rating</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Why Strong</th>
                  </tr>
                </thead>
                <tbody>
                  {goal3Strong.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? "bg-white/5" : ""}>
                      <td className="px-4 py-3 font-bold text-center">{item.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.title}</span>
                          {item.isNew && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white">NEW</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={item.stars === 5 ? "text-green-400 font-bold" : item.stars === 4 ? "text-lime-400 font-bold" : "text-yellow-400 font-bold"}>
                          {item.rating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{item.assessment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weak Items */}
          <div className="bg-yellow-900/20 border-l-4 border-yellow-600 rounded-lg p-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-3">⚠️ MOVED TO BACKLOG</h3>
            <div className="space-y-2">
              {goal3Weak.map((item) => (
                <div key={item.id} className="text-gray-300">
                  • <span className="font-semibold text-orange-400">{item.title}</span> — {item.reason}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Backlog Storage */}
        <div className="bg-gray-700/20 border border-gray-600/40 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">🗄️ BACKLOG (Future Consideration)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {backlogStorage.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="font-semibold text-white">{item.title}</div>
                <div className="text-sm text-gray-400">{item.reason}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Codex Overnight Priority */}
        <div className="bg-cyan-900/20 border-2 border-cyan-600/40 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">🤖 Codex Overnight Priority</h2>
          <ol className="space-y-3">
            {codexPriorities.map((item) => (
              <li key={item.id} className="bg-black/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-cyan-400 font-bold text-lg">{item.id}.</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-sm text-gray-400 mt-1">{item.enables}</div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Final Summary */}
        <div className="bg-gray-800/40 border border-gray-600/40 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📊 Final Summary</h2>
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="px-4 py-3 font-semibold text-white">Goal 1: Grow Subscribers</td>
                  <td className="px-4 py-3 text-gray-300">{goal1Total} items ({goal1Strong.length} strong, {goal1Weak.length} backlogged)</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="px-4 py-3 font-semibold text-white">Goal 2: Streamline Workflows</td>
                  <td className="px-4 py-3 text-gray-300">{goal2Total} items ({goal2Strong.length} strong, {goal2Weak.length} backlogged)</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="px-4 py-3 font-semibold text-white">Goal 3: Platform Excellence</td>
                  <td className="px-4 py-3 text-gray-300">{goal3Total} items ({goal3Strong.length} strong, {goal3Weak.length} backlogged)</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="px-4 py-3 font-semibold text-white">Backlog Storage</td>
                  <td className="px-4 py-3 text-gray-300">{backlogStorage.length} items for future consideration</td>
                </tr>
                <tr>
                  <td colSpan={2} className="px-4 py-4 font-bold text-white text-lg">
                    Total: {totalActive} active items | {totalBacklogged} backlogged | {totalEvaluated} evaluated
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 border-t border-white/10 pt-6">
          <strong>Key Insight:</strong> Original backlog was missing critical funnel pieces (lead magnet, accuracy proof, testimonials).
          <br />
          New items fill gaps that directly convert followers → subscribers → paying members.
        </div>
      </div>
    </div>
  );
}
