"use client";

import Link from "next/link";
import { backlogItems, categories, BacklogCategory } from "./data";
import { Badge } from "@/components/ui/badge";

const priorityStyles: Record<string, "red" | "orange" | "yellow"> = {
  P0: "red",
  P1: "orange",
  P2: "yellow",
};

const effortStyles: Record<string, string> = {
  quick: "bg-green-500/20 text-green-300 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  large: "bg-red-500/20 text-red-300 border-red-500/30",
};

const statusStyles: Record<string, string> = {
  backlog: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  "in-progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  done: "bg-green-500/20 text-green-400 border-green-500/30",
};

const categoryColors: Record<BacklogCategory, string> = {
  growth: "border-purple-500/30 bg-purple-500/5",
  workflow: "border-yellow-500/30 bg-yellow-500/5",
  platform: "border-blue-500/30 bg-blue-500/5",
};

export default function AdminBacklogPage() {
  const total = backlogItems.length;
  const p0Count = backlogItems.filter((item) => item.priority === "P0").length;
  const inProgress = backlogItems.filter((item) => item.status === "in-progress").length;
  const done = backlogItems.filter((item) => item.status === "done").length;

  const itemsByCategory = {
    growth: backlogItems.filter((item) => item.category === "growth"),
    workflow: backlogItems.filter((item) => item.category === "workflow"),
    platform: backlogItems.filter((item) => item.category === "platform"),
  };

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
        <div>
          <h1 className="text-4xl font-bold text-white mb-3">Product Backlog v3</h1>
          <p className="text-gray-400 text-lg">
            Critically analyzed and prioritized. Weak ideas moved to storage. Strong ideas enhanced.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Total Items</div>
            <div className="text-2xl font-bold text-white mt-1">{total}</div>
          </div>
          <div className="bg-white/5 border border-red-500/20 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">P0 Priority</div>
            <div className="text-2xl font-bold text-red-400 mt-1">{p0Count}</div>
          </div>
          <div className="bg-white/5 border border-blue-500/20 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">In Progress</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{inProgress}</div>
          </div>
          <div className="bg-white/5 border border-green-500/20 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Done</div>
            <div className="text-2xl font-bold text-green-400 mt-1">{done}</div>
          </div>
        </div>

        {/* Category Sections */}
        {(Object.keys(categories) as BacklogCategory[]).map((categoryKey) => {
          const category = categories[categoryKey];
          const items = itemsByCategory[categoryKey];
          
          return (
            <div key={categoryKey} className="space-y-4">
              {/* Category Header */}
              <div className={`border rounded-xl p-6 ${categoryColors[categoryKey]}`}>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {category.emoji} {category.title}
                </h2>
                <p className="text-gray-400">{category.description}</p>
                <div className="mt-4 flex gap-4 text-sm">
                  <span className="text-gray-300">
                    <strong className="text-white">{items.length}</strong> items
                  </span>
                  <span className="text-gray-300">
                    <strong className="text-red-400">{items.filter(i => i.priority === "P0").length}</strong> P0
                  </span>
                  <span className="text-gray-300">
                    <strong className="text-green-400">{items.filter(i => i.status === "done").length}</strong> done
                  </span>
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3 hover:border-white/20 transition-colors"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={priorityStyles[item.priority]}>{item.priority}</Badge>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${effortStyles[item.effort]}`}>
                        {item.effort}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusStyles[item.status]}`}>
                        {item.status.replace("-", " ")}
                      </span>
                      {item.isNew && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="text-gray-400 mt-1 text-sm leading-relaxed">{item.description}</p>
                    </div>

                    {/* Assessment */}
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Assessment</div>
                      <p className="text-gray-200 text-sm">{item.assessment}</p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Codex Priorities Section */}
        <div className="border border-cyan-500/30 bg-cyan-500/5 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-2">🤖 Codex Overnight Priority</h2>
          <p className="text-gray-400 mb-4">Build these 4 (enables highest-impact items)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-cyan-400 font-semibold">1. Daily Mode Card Generator</div>
              <div className="text-gray-400 text-sm mt-1">Enables daily X presence</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-cyan-400 font-semibold">2. Accuracy Comparison Generator</div>
              <div className="text-gray-400 text-sm mt-1">Enables proof content</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-cyan-400 font-semibold">3. Report-to-Tweet Pipeline</div>
              <div className="text-gray-400 text-sm mt-1">Eliminates blank page problem</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-cyan-400 font-semibold">4. Weekly Report Template</div>
              <div className="text-gray-400 text-sm mt-1">Unblocks Sunday workflow</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
