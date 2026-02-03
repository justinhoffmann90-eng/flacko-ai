"use client";
// REBUILD: v4 with tech specs - Feb 2, 2026 7:30pm CT

import Link from "next/link";
import { useState } from "react";
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
  BacklogItem,
  TechSpec,
} from "./data";

function TechSpecPanel({ spec, itemId }: { spec: TechSpec; itemId: string }) {
  return (
    <div className="bg-gray-900/80 border border-cyan-500/30 rounded-lg p-6 mt-4 space-y-6">
      <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg">
        <span>📋</span>
        <span>Technical Specification</span>
        <span className="text-xs bg-cyan-500/20 px-2 py-1 rounded">ID: {itemId}</span>
      </div>

      {/* Overview */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Overview</h4>
        <p className="text-gray-200">{spec.overview}</p>
      </div>

      {/* Inputs */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Inputs</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          {spec.inputs.map((input, i) => (
            <li key={i} className="text-sm">{input}</li>
          ))}
        </ul>
      </div>

      {/* Outputs */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Outputs</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          {spec.outputs.map((output, i) => (
            <li key={i} className="text-sm">{output}</li>
          ))}
        </ul>
      </div>

      {/* Implementation Steps */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Implementation Steps</h4>
        <ol className="space-y-2">
          {spec.implementation.map((step, i) => (
            <li key={i} className="text-sm text-gray-300 bg-black/30 rounded px-3 py-2 font-mono">
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Data Flow */}
      {spec.dataFlow && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Data Flow</h4>
          <div className="text-sm text-cyan-300 bg-black/40 rounded px-4 py-3 font-mono">
            {spec.dataFlow}
          </div>
        </div>
      )}

      {/* API Endpoints */}
      {spec.apiEndpoints && spec.apiEndpoints.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">API Endpoints</h4>
          <div className="space-y-2">
            {spec.apiEndpoints.map((endpoint, i) => (
              <div key={i} className="text-sm text-green-300 bg-black/40 rounded px-4 py-2 font-mono">
                {endpoint}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Components */}
      {spec.components && spec.components.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Components</h4>
          <div className="space-y-1">
            {spec.components.map((comp, i) => (
              <div key={i} className="text-sm text-purple-300 bg-black/40 rounded px-4 py-2 font-mono">
                {comp}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dependencies */}
      {spec.dependencies && spec.dependencies.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Dependencies</h4>
          <div className="flex flex-wrap gap-2">
            {spec.dependencies.map((dep, i) => (
              <span key={i} className="text-xs bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full">
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Acceptance Criteria */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Acceptance Criteria</h4>
        <ul className="space-y-2">
          {spec.acceptanceCriteria.map((criterion, i) => (
            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>{criterion}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function BacklogItemRow({ item, idx, expanded, onToggle }: { 
  item: BacklogItem; 
  idx: number; 
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasTechSpec = item.techSpec && item.techSpec.overview !== "Same as 'Public Accuracy Dashboard' in Goal 1. Single implementation serves both growth and platform goals.";
  
  return (
    <>
      <tr 
        className={`${idx % 2 === 0 ? "bg-white/5" : ""} ${hasTechSpec ? "cursor-pointer hover:bg-white/10" : ""}`}
        onClick={hasTechSpec ? onToggle : undefined}
      >
        <td className="px-4 py-3 font-bold text-center">{item.rank}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{item.title}</span>
            {item.isNew && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white">NEW</span>
            )}
            {hasTechSpec && (
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/30 text-cyan-300 border border-cyan-500/30">
                {expanded ? "▼ SPEC" : "▶ SPEC"}
              </span>
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
      {expanded && item.techSpec && (
        <tr>
          <td colSpan={4} className="px-4 pb-4">
            <TechSpecPanel spec={item.techSpec} itemId={item.id} />
          </td>
        </tr>
      )}
    </>
  );
}

function BacklogTable({ items, categoryColor }: { items: BacklogItem[]; categoryColor: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  return (
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
          {items.map((item, idx) => (
            <BacklogItemRow 
              key={item.id} 
              item={item} 
              idx={idx}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminBacklogPage() {
  const goal1Total = goal1Strong.length + goal1Weak.length;
  const goal2Total = goal2Strong.length + goal2Weak.length;
  const goal3Total = goal3Strong.length + goal3Weak.length;
  const totalActive = allStrongItems.length;
  const totalBacklogged = allWeakItems.length;
  const totalEvaluated = totalActive + totalBacklogged;
  const itemsWithSpecs = allStrongItems.filter(i => i.techSpec).length;

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
          <div className="mt-4 inline-flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg px-4 py-2">
            <span className="text-cyan-400">📋</span>
            <span className="text-cyan-300 text-sm">
              <strong>{itemsWithSpecs}</strong> items have detailed tech specs — click <span className="bg-cyan-500/30 px-1.5 py-0.5 rounded text-xs">▶ SPEC</span> to expand
            </span>
          </div>
        </div>

        {/* Goal 1: Grow Subscribers */}
        <div className="space-y-4">
          <div className="bg-green-900/20 border-2 border-green-700/40 rounded-xl p-6">
            <h2 className="text-3xl font-bold text-green-400 mb-2">
              🎯 GOAL 1: Grow Subscribers
            </h2>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">✅ STRONG IDEAS (Keep & Prioritize)</h3>
            <BacklogTable items={goal1Strong} categoryColor="green" />
          </div>
        </div>

        {/* Goal 2: Streamline Workflows */}
        <div className="space-y-4">
          <div className="bg-orange-900/20 border-2 border-orange-700/40 rounded-xl p-6">
            <h2 className="text-3xl font-bold text-orange-400 mb-2">
              ⚡ GOAL 2: Streamline Workflows
            </h2>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">✅ STRONG IDEAS (Keep & Prioritize)</h3>
            <BacklogTable items={goal2Strong} categoryColor="orange" />
          </div>
        </div>

        {/* Goal 3: Platform Excellence */}
        <div className="space-y-4">
          <div className="bg-blue-900/20 border-2 border-blue-700/40 rounded-xl p-6">
            <h2 className="text-3xl font-bold text-blue-400 mb-2">
              🏗️ GOAL 3: Platform Excellence
            </h2>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">✅ STRONG IDEAS (Keep & Prioritize)</h3>
            <BacklogTable items={goal3Strong} categoryColor="blue" />
          </div>
        </div>

        {/* Backlog Storage */}
        <div className="bg-gray-700/20 border border-gray-600/40 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">🗄️ BACKLOG (Future Consideration)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {backlogStorage.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1">
                <div className="font-semibold text-white">{item.title}</div>
                <div className="text-sm text-gray-300">{item.description}</div>
                <div className="text-sm text-gray-400">Why backlogged: {item.reason}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Codex Overnight Priority */}
        <div className="bg-cyan-900/20 border-2 border-cyan-600/40 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">🤖 Codex Overnight Priority</h2>
          <p className="text-gray-400 text-sm mb-4">
            These items have full tech specs above. Codex should reference the ▶ SPEC sections for implementation details.
          </p>
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
                <tr className="border-b border-white/10 bg-cyan-500/10">
                  <td className="px-4 py-3 font-semibold text-cyan-400">Items with Tech Specs</td>
                  <td className="px-4 py-3 text-cyan-300">{itemsWithSpecs} detailed specifications for Codex</td>
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
