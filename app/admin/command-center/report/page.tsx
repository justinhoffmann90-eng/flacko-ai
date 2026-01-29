"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import { FolderTree, ArrowRight, FileText, Globe, Bell, Terminal, Clock } from "lucide-react";

// Folder structure data
const folderStructure = [
  { path: "~/trading_inputs/", type: "folder", comment: "All trading data lives here", indent: 0 },
  { path: "daily-reports/", type: "folder", comment: "Report markdown files", indent: 1 },
  { path: "YYYY-MM-DD.md", type: "source", comment: "⭐ SOURCE OF TRUTH", indent: 2 },
  { path: "2026-01-27.md", type: "file", comment: "", indent: 2 },
  { path: "2026-01-26.md", type: "file", comment: "", indent: 2 },
  { path: "key_levels.json", type: "highlight", comment: "Alert levels (extracted from report)", indent: 1 },
  { path: "FlowPatrol/", type: "folder", comment: "SpotGamma PDFs", indent: 1 },
  { path: "screenshots/", type: "folder", comment: "Trading screenshots", indent: 1 },
  { path: "", type: "spacer", comment: "", indent: 0 },
  { path: "~/clawd/dashboard/", type: "folder", comment: "Command Center", indent: 0 },
  { path: "verification.json", type: "file", comment: "Dashboard key levels copy", indent: 1 },
  { path: "data.json", type: "file", comment: "Dashboard state", indent: 1 },
  { path: "", type: "spacer", comment: "", indent: 0 },
  { path: "Supabase", type: "folder", comment: "", indent: 0 },
  { path: "daily_reports", type: "file", comment: "Report table (date, mode, tier, content)", indent: 1 },
  { path: "system_config", type: "file", comment: "Alert system status", indent: 1 },
];

// Key files reference
const keyFiles = [
  { file: "YYYY-MM-DD.md", location: "~/trading_inputs/daily-reports/", purpose: "Daily report markdown", updatedBy: "Trunks (builds) → Justin (approves) → Trunks (uploads)", isSource: true },
  { file: "key_levels.json", location: "~/trading_inputs/", purpose: "Price alert levels for monitoring", updatedBy: "Trunks (extracted from report)", isSource: false },
  { file: "verification.json", location: "~/clawd/dashboard/", purpose: "Dashboard verification data", updatedBy: "Trunks (via script)", isSource: false },
  { file: "daily_reports", location: "Supabase", purpose: "Report storage for website", updatedBy: "Trunks (after approval)", isSource: false },
];

// Report creation checklist
const reportChecklist = [
  { step: 1, title: "Capture trading screenshots", detail: "TradingView charts, SpotGamma HIRO, FlowPatrol PDF" },
  { step: 2, title: "Build report markdown", detail: "Analyze data, write .md file with mode/tier/levels" },
  { step: 3, title: "Generate PDF and send to Justin", detail: "Convert .md to PDF, send via Telegram for review" },
  { step: 4, title: "Wait for Justin's approval", detail: "Justin reviews PDF, requests changes or approves" },
  { step: 5, title: "Upload approved .md to flacko.ai", detail: "Use admin upload or API to publish report" },
  { step: 6, title: "Extract key levels and update alerts", detail: "Parse Alert Levels table → key_levels.json → Supabase" },
  { step: 7, title: "Confirm price monitor is active", detail: "Verify alerts are live in Discord #alerts" },
];

// Scripts reference
const scripts = [
  { name: "update-key-levels.sh", location: "~/clawd/", purpose: "Syncs key_levels.json → dashboard/verification.json" },
  { name: "sync-catalysts-supabase.sh", location: "~/clawd/scripts/", purpose: "Syncs catalyst calendar to website" },
  { name: "get-verification-data.sh", location: "~/clawd/dashboard/", purpose: "Fetches current verification data" },
];

// Quick reference cards
const quickRef = {
  locations: [
    { label: "Reports", path: "~/trading_inputs/daily-reports/" },
    { label: "Key Levels", path: "~/trading_inputs/key_levels.json" },
    { label: "Screenshots", path: "~/trading_inputs/screenshots/" },
    { label: "FlowPatrol", path: "~/trading_inputs/FlowPatrol/" },
    { label: "Dashboard", path: "~/clawd/dashboard/" },
  ],
  endpoints: [
    { label: "Report Page", url: "flacko.ai/report" },
    { label: "Report API", url: "flacko.ai/api/report" },
    { label: "Alert Cron", url: "flacko.ai/api/cron/check-alerts" },
    { label: "Catalysts", url: "flacko.ai/catalysts" },
  ],
  channels: [
    { label: "#alerts", purpose: "Price alerts only" },
    { label: "#reports", purpose: "New report announcements only" },
    { label: "#market-pulse", purpose: "Briefs, pulse, wrap" },
  ],
  schedule: [
    { time: "8:00a CT", task: "Morning Brief" },
    { time: "8a-4p CT", task: "Price monitor active" },
    { time: "~3:00p CT", task: "Trading capture" },
    { time: "4:30p CT", task: "EOD Wrap" },
  ],
};

export default function ReportSystemPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📊</span>
              <div>
                <h1 className="text-xl font-semibold text-white">Report System</h1>
                <p className="text-xs text-white/50">Daily trading report pipeline documentation</p>
              </div>
            </div>
            
            <nav className="flex gap-2">
              <Link href="/admin" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Admin</Link>
              <Link href="/admin/command-center" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Dashboard</Link>
              <Link href="/admin/command-center/flow" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Flow</Link>
              <Link href="/admin/command-center/discord" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Discord</Link>
              <Link href="/admin/command-center/roles" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Roles</Link>
              <Link href="/admin/command-center/workflow" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Workflow</Link>
              <Link href="/admin/command-center/report" className="px-3 py-1.5 text-sm text-white bg-white/10 rounded-lg">Report</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* Spec Sheet Link */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <h3 className="font-semibold">Daily Report Automation Spec</h3>
                <p className="text-sm text-white/50">Complete technical specification for the report pipeline</p>
              </div>
            </div>
            <a 
              href="/docs/daily-report-automation.md" 
              target="_blank"
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View Spec Sheet
            </a>
          </div>
        </Card>

        {/* Folder Structure */}
        <Card className="bg-white/[0.02] border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-blue-400" />
            File System Overview
          </h2>
          <div className="bg-black/30 rounded-xl p-5 font-mono text-sm overflow-x-auto">
            {folderStructure.map((item, i) => {
              if (item.type === "spacer") return <div key={i} className="h-3" />;
              const indent = "│   ".repeat(item.indent);
              const prefix = item.indent > 0 ? "├── " : "";
              
              let colorClass = "text-white/60";
              if (item.type === "folder") colorClass = "text-blue-400";
              if (item.type === "file") colorClass = "text-yellow-400";
              if (item.type === "source") colorClass = "text-green-400 font-semibold";
              if (item.type === "highlight") colorClass = "text-yellow-400 bg-blue-500/20 px-2 py-0.5 rounded";
              
              return (
                <div key={i} className="leading-relaxed">
                  <span className="text-white/30">{indent}{prefix}</span>
                  <span className={colorClass}>{item.path}</span>
                  {item.comment && <span className="text-white/30 ml-4 italic">← {item.comment}</span>}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Data Flow */}
        <Card className="bg-white/[0.02] border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-400" />
            Report Creation Flow
          </h2>
          
          <p className="text-white/50 text-sm mb-6">End-to-end workflow from data capture to live alerts</p>
          
          {/* Main Flow: Full Pipeline */}
          <div className="flex items-center justify-center gap-3 flex-wrap py-6">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center min-w-[110px]">
              <div className="text-2xl mb-2">📸</div>
              <div className="text-xs font-semibold uppercase tracking-wide">Screenshots</div>
              <div className="text-xs text-white/40 mt-1">Trunks captures</div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/30" />
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center min-w-[110px]">
              <div className="text-2xl mb-2">⚔️</div>
              <div className="text-xs font-semibold uppercase tracking-wide">Build Report</div>
              <div className="text-xs text-white/40 mt-1">Trunks writes .md</div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/30" />
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center min-w-[110px]">
              <div className="text-2xl mb-2">📄</div>
              <div className="text-xs font-semibold uppercase tracking-wide">PDF Review</div>
              <div className="text-xs text-white/40 mt-1">Send to Justin</div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/30" />
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center min-w-[110px]">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-xs font-semibold uppercase tracking-wide">Approve</div>
              <div className="text-xs text-white/40 mt-1">Justin reviews</div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/30" />
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center min-w-[110px]">
              <div className="text-2xl mb-2">📤</div>
              <div className="text-xs font-semibold uppercase tracking-wide">Upload</div>
              <div className="text-xs text-white/40 mt-1">Trunks → website</div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/30" />
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center min-w-[110px]">
              <div className="text-2xl mb-2">🚨</div>
              <div className="text-xs font-semibold uppercase tracking-wide">Alerts Active</div>
              <div className="text-xs text-white/40 mt-1">Price monitor</div>
            </div>
          </div>

          {/* Flow 2: Post-Upload - Key Levels */}
          <div className="border-t border-white/10 mt-6 pt-6">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-4">After Upload: Key Levels Pipeline</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center min-w-[100px]">
                <div className="text-xl mb-1">📄</div>
                <div className="text-xs font-semibold">.md on website</div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30" />
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center min-w-[100px]">
                <div className="text-xl mb-1">⚔️</div>
                <div className="text-xs font-semibold">Extract levels</div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30" />
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center min-w-[100px]">
                <div className="text-xl mb-1">📊</div>
                <div className="text-xs font-semibold">key_levels.json</div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30" />
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center min-w-[100px]">
                <div className="text-xl mb-1">🔄</div>
                <div className="text-xs font-semibold">Sync to Supabase</div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30" />
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center min-w-[100px]">
                <div className="text-xl mb-1">🚨</div>
                <div className="text-xs font-semibold">Discord #alerts</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Key Files Reference */}
        <Card className="bg-white/[0.02] border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Key Files Reference
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 font-medium">File</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Location</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Purpose</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Updated By</th>
                </tr>
              </thead>
              <tbody>
                {keyFiles.map((file, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <code className="bg-black/30 px-2 py-1 rounded text-xs">{file.file}</code>
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      <code className="text-xs">{file.location}</code>
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      {file.isSource && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded mr-2">
                          Source of Truth
                        </span>
                      )}
                      {file.purpose}
                    </td>
                    <td className="py-3 px-4 text-white/50">{file.updatedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Report Creation Workflow */}
        <Card className="bg-white/[0.02] border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-400" />
            Daily Report Workflow
          </h2>
          <p className="text-white/50 text-sm mb-6">Trunks builds the report end-to-end. Justin approves before publish.</p>
          
          <div className="space-y-3">
            {reportChecklist.map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-white/[0.02] rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-white/50 text-sm">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Critical Rules */}
          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-5">
            <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
              ⛔ Critical Rules
            </h3>
            <ul className="text-sm text-white/70 space-y-2">
              <li>• NEVER upload report to website without Justin&apos;s explicit approval</li>
              <li>• ALWAYS send PDF for review first — no exceptions</li>
              <li>• Extract levels from the .md report&apos;s Alert Levels table — NOT from memory</li>
              <li>• The uploaded report is the source of truth for price alerts</li>
              <li>• ALWAYS run update-key-levels.sh after updating key_levels.json</li>
              <li>• Verify price monitor is active after upload</li>
            </ul>
          </div>
        </Card>

        {/* Scripts Reference */}
        <Card className="bg-white/[0.02] border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-green-400" />
            Scripts Reference
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Script</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Location</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {scripts.map((script, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <code className="bg-black/30 px-2 py-1 rounded text-xs text-green-400">{script.name}</code>
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      <code className="text-xs">{script.location}</code>
                    </td>
                    <td className="py-3 px-4 text-white/70">{script.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 bg-black/30 rounded-xl p-4 font-mono text-sm">
            <div className="text-white/40"># Update key levels after new report</div>
            <div className="text-green-400">~/clawd/update-key-levels.sh</div>
            <div className="h-3" />
            <div className="text-white/40"># Check current key levels</div>
            <div className="text-green-400">cat ~/trading_inputs/key_levels.json | jq</div>
            <div className="h-3" />
            <div className="text-white/40"># Find latest report</div>
            <div className="text-green-400">ls -la ~/trading_inputs/daily-reports/ | tail -5</div>
          </div>
        </Card>

        {/* Quick Reference Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Locations */}
          <Card className="bg-white/[0.02] border-white/10 p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-blue-400" />
              Where Things Live
            </h3>
            <ul className="space-y-2 text-sm">
              {quickRef.locations.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-white/70">{item.label}</span>
                  <code className="text-xs text-white/50">{item.path}</code>
                </li>
              ))}
            </ul>
          </Card>

          {/* Endpoints */}
          <Card className="bg-white/[0.02] border-white/10 p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              Web Endpoints
            </h3>
            <ul className="space-y-2 text-sm">
              {quickRef.endpoints.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-white/70">{item.label}</span>
                  <code className="text-xs text-white/50">{item.url}</code>
                </li>
              ))}
            </ul>
          </Card>

          {/* Channels */}
          <Card className="bg-white/[0.02] border-white/10 p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-400" />
              Alert Channels
            </h3>
            <ul className="space-y-2 text-sm">
              {quickRef.channels.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span className="font-mono text-white/70">{item.label}</span>
                  <span className="text-xs text-white/50">{item.purpose}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Schedule */}
          <Card className="bg-white/[0.02] border-white/10 p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              Daily Schedule
            </h3>
            <ul className="space-y-2 text-sm">
              {quickRef.schedule.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span className="font-mono text-white/70">{item.time}</span>
                  <span className="text-xs text-white/50">{item.task}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
