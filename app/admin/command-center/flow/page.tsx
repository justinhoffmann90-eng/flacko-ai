"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function InformationFlowPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/command-center" className="text-white/60 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌊</span>
                <div>
                  <h1 className="text-xl font-semibold text-white">Information Flow</h1>
                  <p className="text-xs text-white/50">Complete data pipeline & instructions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* High-Level Flow */}
        <Card className="bg-white/5 border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📊 High-Level Data Flow</h2>
          <div className="space-y-4 font-mono text-sm">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-blue-200">
              <div className="font-semibold mb-1">1. EXTERNAL SOURCES</div>
              <div className="text-xs text-blue-300">SpotGamma • TradingView • FS Insight • Yahoo Finance • Daily Report Upload</div>
            </div>
            <div className="text-center text-white/40">↓</div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3 text-purple-200">
              <div className="font-semibold mb-1">2. DATA INGESTION</div>
              <div className="text-xs text-purple-300">Manual uploads • Browser automation • Web scraping</div>
            </div>
            <div className="text-center text-white/40">↓</div>
            <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-green-200">
              <div className="font-semibold mb-1">3. LOCAL STORAGE</div>
              <div className="text-xs text-green-300 space-y-1">
                <div>~/trading_inputs/daily-reports/TSLA_Daily_Report_YYYY-MM-DD.md</div>
                <div>~/trading_inputs/key_levels.json</div>
                <div>~/Desktop/Clawd Screenshots/YYYY-MM-DD/*.png</div>
              </div>
            </div>
            <div className="text-center text-white/40">↓</div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-yellow-200">
              <div className="font-semibold mb-1">4. PROCESSING</div>
              <div className="text-xs text-yellow-300">Extract key levels • Generate briefs • Monitor prices • Capture screenshots</div>
            </div>
            <div className="text-center text-white/40">↓</div>
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-red-200">
              <div className="font-semibold mb-1">5. OUTPUTS</div>
              <div className="text-xs text-red-300">Telegram (drafts) • Discord #reports • Discord #alerts • Dashboard</div>
            </div>
          </div>
        </Card>

        {/* External Sources */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">📥 External Sources</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* SpotGamma */}
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">📊 SpotGamma</h3>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>
              <div className="text-xs text-blue-400 mb-2 font-mono">dashboard.spotgamma.com</div>
              <div className="text-sm text-white/70 space-y-1 mb-3">
                <div>• HIRO dealer positioning (S&P, QQQ, TSLA)</div>
                <div>• Call/Put wall levels</div>
                <div>• Equity Hub gamma exposure</div>
                <div>• FlowPatrol PDF (daily options flow)</div>
              </div>
              <div className="bg-yellow-500/10 border-l-2 border-yellow-500 rounded p-2 text-xs text-yellow-200">
                <div className="font-semibold mb-1">⚠️ Critical Rules:</div>
                <div>• Keep left sidebar visible</div>
                <div>• Toggle "HIRO Upgraded" OFF</div>
                <div>• Download actual PDF (not webpage print)</div>
              </div>
            </Card>

            {/* TradingView */}
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">📈 TradingView</h3>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>
              <div className="text-xs text-blue-400 mb-2 font-mono">tradingview.com/chart/...</div>
              <div className="text-sm text-white/70 space-y-1 mb-3">
                <div>• TSLA: Weekly, Daily, 4H, 1H</div>
                <div>• QQQ: Weekly, Daily</div>
                <div>• BX-Trender + EMA + SMI indicators</div>
              </div>
              <div className="bg-yellow-500/10 border-l-2 border-yellow-500 rounded p-2 text-xs text-yellow-200">
                <div className="font-semibold mb-1">⚠️ Critical Rules:</div>
                <div>• Use saved layout URLs</div>
                <div>• ALWAYS verify watchlist (right panel) visible</div>
                <div>• If collapsed, click "Watchlist, details and news"</div>
              </div>
            </Card>

            {/* FS Insight */}
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">📰 FS Insight</h3>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>
              <div className="text-xs text-blue-400 mb-2 font-mono">fsinsight.com/members/</div>
              <div className="text-sm text-white/70 space-y-1 mb-3">
                <div>• First Word (Tom Lee) — macro</div>
                <div>• First to Market (Hardika Singh) — intel</div>
                <div>• Daily Technical Strategy (Mark Newton)</div>
                <div>• FlashInsights — real-time commentary</div>
              </div>
              <div className="text-xs text-white/40 font-mono bg-black/30 rounded p-2">
                Logged in via clawd browser
              </div>
            </Card>

            {/* Yahoo Finance */}
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">💹 Yahoo Finance</h3>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>
              <div className="text-xs text-blue-400 mb-2 font-mono">finance.yahoo.com/quote/TSLA/</div>
              <div className="text-sm text-white/70 space-y-1 mb-3">
                <div>• Current TSLA price</div>
                <div>• Pre-market / after-hours</div>
                <div>• Daily % change</div>
              </div>
              <div className="text-xs text-white/40 font-mono bg-black/30 rounded p-2">
                web_fetch tool (HTML scraping)
              </div>
            </Card>

            {/* Daily Report Upload */}
            <Card className="bg-white/5 border-white/10 p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">📄 Daily Report Upload</h3>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>
              <div className="text-xs text-blue-400 mb-2 font-mono">flacko.ai/admin + Telegram</div>
              <div className="text-sm text-white/70 space-y-1 mb-3">
                <div>• Justin uploads .md file via Telegram</div>
                <div>• Contains: Mode, Tiers, Alert Levels table</div>
                <div>• Trigger: New daily analysis complete</div>
              </div>
              <div className="text-xs text-white/40 font-mono bg-black/30 rounded p-2">
                Saved to: ~/trading_inputs/daily-reports/TSLA_Daily_Report_YYYY-MM-DD.md
              </div>
            </Card>
          </div>
        </div>

        {/* File Locations */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">💾 File Locations & Purpose</h2>
          <Card className="bg-white/5 border-white/10 overflow-hidden">
            <div className="divide-y divide-white/10">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-mono text-sm text-blue-400">~/trading_inputs/daily-reports/</div>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Source of Truth</Badge>
                </div>
                <div className="text-sm text-white/70 mb-2">TSLA_Daily_Report_YYYY-MM-DD.md</div>
                <div className="text-xs text-white/50">
                  Complete daily analysis markdown. Contains Mode, Tiers, Alert Levels table. SOURCE OF TRUTH for all key levels, mode, tiers, positioning.
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-mono text-sm text-blue-400">~/trading_inputs/key_levels.json</div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Price Monitor Config</Badge>
                </div>
                <div className="text-xs text-white/50">
                  Extracted from report Alert Levels table. Used by price monitoring system. Includes: price, level name, emoji, action text for each level.
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-mono text-sm text-blue-400">~/Desktop/Clawd Screenshots/</div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Daily Capture</Badge>
                </div>
                <div className="text-sm text-white/70 mb-2">YYYY-MM-DD/*.png</div>
                <div className="text-xs text-white/50">
                  TradingView charts (6 files) + SpotGamma pages (3-4 files) + FlowPatrol PDF (1 file). Expected: 10-11 files per day.
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Processing Workflows */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">⚙️ Processing Workflows</h2>
          <div className="grid grid-cols-1 gap-4">
            {/* Morning Brief */}
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">🌅 Morning Brief (8:00a CT)</h3>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Cron Job</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-white/40 uppercase mb-1">Data Sources (in order):</div>
                  <ol className="text-sm text-white/70 space-y-1 list-decimal list-inside">
                    <li>Run <span className="font-mono text-blue-400">date +"%A, %B %d, %Y"</span> to verify current date</li>
                    <li>Read latest report from ~/trading_inputs/daily-reports/</li>
                    <li>Fetch current price from Yahoo Finance</li>
                    <li>Extract Mode, Tiers, Posture from report</li>
                    <li>Extract key levels from report Alert Levels table</li>
                    <li>Navigate to FS Insight First Word (Tom Lee)</li>
                    <li>Navigate to FS Insight First to Market (Hardika Singh)</li>
                  </ol>
                </div>
                <div className="bg-red-500/10 border-l-2 border-red-500 rounded p-2 text-xs text-red-200">
                  <div className="font-semibold mb-1">❌ DO NOT:</div>
                  <div>• Post to Discord without approval</div>
                  <div>• Use old report data</div>
                  <div>• Use dashboard levels (use report Alert Levels table)</div>
                  <div>• Guess the date (always run date command)</div>
                </div>
                <div className="bg-green-500/10 border-l-2 border-green-500 rounded p-2 text-xs text-green-200">
                  <div className="font-semibold mb-1">✅ MUST DO:</div>
                  <div>• Send to Telegram FIRST</div>
                  <div>• Wait for Justin's "approve" command</div>
                  <div>• Then post to Discord</div>
                </div>
              </div>
            </Card>

            {/* Key Levels Extraction */}
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">🔑 Key Levels Extraction (On Report Upload)</h3>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Trigger: Upload</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-white/40 uppercase mb-1">Workflow:</div>
                  <ol className="text-sm text-white/70 space-y-1 list-decimal list-inside">
                    <li>Read latest .md report from ~/trading_inputs/daily-reports/</li>
                    <li>Find "🚨 Alert Levels - When to Buy / When to Trim" table</li>
                    <li>Extract ALL rows: price, level name, emoji, action text</li>
                    <li>Update ~/trading_inputs/key_levels.json with complete structure</li>
                    <li>Run ~/clawd/update-key-levels.sh (regenerates dashboard verification)</li>
                    <li>Confirm to Justin via Telegram</li>
                  </ol>
                </div>
                <div className="bg-red-500/10 border-l-2 border-red-500 rounded p-2 text-xs text-red-200">
                  <div className="font-semibold mb-1">⚠️ SOURCE OF TRUTH:</div>
                  <div>ALWAYS extract from .md report Alert Levels table — NOT from dashboard, NOT from memory.</div>
                </div>
              </div>
            </Card>

            {/* EOD Wrap */}
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">📊 EOD Wrap (4:30p CT)</h3>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Cron Job</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-white/40 uppercase mb-1">Data Sources (in order):</div>
                  <ol className="text-sm text-white/70 space-y-1 list-decimal list-inside">
                    <li>Run date command to verify current date</li>
                    <li>FS Insight Daily Technical Strategy (Mark Newton)</li>
                    <li>FS Insight FlashInsights (filter to today only)</li>
                    <li>FS Insight US Policy (Tom Block) - ONLY if relevant (Fed, shutdown)</li>
                  </ol>
                </div>
                <div className="bg-red-500/10 border-l-2 border-red-500 rounded p-2 text-xs text-red-200">
                  <div className="font-semibold mb-1">❌ DO NOT USE:</div>
                  <div>• Markets Wrapped section (replaced by FlashInsights)</div>
                  <div>• First Word (Tom Lee) - that's morning content only</div>
                </div>
              </div>
            </Card>

            {/* Price Monitoring */}
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">🚨 Price Monitoring (Every 5 min)</h3>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Cloud System</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-white/40 uppercase mb-1">Architecture:</div>
                  <div className="text-sm text-white/70 space-y-1">
                    <div>1. cron-job.org triggers every 5 min during market hours</div>
                    <div>2. Hits: https://www.flacko.ai/api/cron/check-alerts</div>
                    <div>3. API reads key_levels.json from database/storage</div>
                    <div>4. Fetches current TSLA price</div>
                    <div>5. Compares vs alert thresholds</div>
                    <div>6. If triggered: POST to Discord #alerts webhook</div>
                    <div>7. Updates Supabase system_config.alert_system_status</div>
                  </div>
                </div>
                <div className="bg-yellow-500/10 border-l-2 border-yellow-500 rounded p-2 text-xs text-yellow-200">
                  <div className="font-semibold mb-1">🔍 Health Check (Every Heartbeat):</div>
                  <div>Check Supabase system_config → alert_system_status.last_run</div>
                  <div>If stale (>15 min) during market hours → ALERT JUSTIN IMMEDIATELY</div>
                </div>
              </div>
            </Card>

            {/* Trading Capture */}
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">📸 Trading Capture (7:00a CT)</h3>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Cron Job</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-white/40 uppercase mb-1">Workflow:</div>
                  <ol className="text-sm text-white/70 space-y-1 list-decimal list-inside">
                    <li>Create today's screenshot folder if not exists</li>
                    <li>Start clawd browser, resize to 1600x900</li>
                    <li>For each TradingView chart: Navigate, check watchlist, screenshot, save</li>
                    <li>For SpotGamma: Check sidebar, toggle HIRO Upgraded OFF, screenshot</li>
                    <li>Download FlowPatrol PDF (actual file, not webpage print)</li>
                    <li>Verify file count (expect 10-11 files)</li>
                  </ol>
                </div>
                <div className="bg-red-500/10 border-l-2 border-red-500 rounded p-2 text-xs text-red-200">
                  <div className="font-semibold mb-1">❌ Common Mistakes:</div>
                  <div>• Skipping watchlist visibility check (I've made this mistake)</div>
                  <div>• Skipping sidebar visibility check (I've made this mistake)</div>
                  <div>• Using browser PDF print instead of downloading actual PDF</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Output Destinations */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">📤 Output Destinations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-semibold text-white mb-3">💬 Telegram</h3>
              <div className="text-sm text-white/70 space-y-1 mb-3">
                <div>• All drafts for Justin's approval</div>
                <div>• Morning brief (8a)</div>
                <div>• EOD wrap (4:30p)</div>
                <div>• Market pulse (intraday)</div>
              </div>
              <div className="text-xs text-green-400">✅ Approval required before Discord</div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-semibold text-white mb-3">📢 Discord #reports</h3>
              <div className="text-xs text-white/40 font-mono mb-2">Channel ID: 1465448933525295298</div>
              <div className="text-sm text-white/70 space-y-1 mb-3">
                <div>• New daily report announcements</div>
                <div>• Mode, Tiers, Positioning</div>
              </div>
              <div className="text-xs text-red-400">❌ NOT for price alerts or level triggers</div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-semibold text-white mb-3">🚨 Discord #alerts</h3>
              <div className="text-xs text-white/40 font-mono mb-2">Webhook: 1463702802349035551</div>
              <div className="text-sm text-white/70 space-y-1 mb-3">
                <div>• Price level triggers</div>
                <div>• Master eject warnings</div>
                <div>• Critical mode changes</div>
              </div>
              <div className="text-xs text-red-400">❌ NOT for new report announcements</div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-semibold text-white mb-3">📊 Dashboard</h3>
              <div className="text-xs text-white/40 font-mono mb-2">~/clawd/dashboard/index.html</div>
              <div className="text-sm text-white/70 space-y-1">
                <div>• Data verification panel</div>
                <div>• Task status & activity log</div>
                <div>• Role cards & scheduled jobs</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Verification Points */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">🔍 Verification Points</h2>
          <div className="grid grid-cols-1 gap-4">
            <Card className="bg-green-500/10 border border-green-500/30 p-4">
              <h3 className="font-semibold text-green-400 mb-2">✅ Report ↔ key_levels.json Sync</h3>
              <div className="text-sm text-green-200 mb-2">
                <span className="text-white/50">Check:</span> verification.json sync status (report.date vs keyLevels.data.reportDate)
              </div>
              <div className="text-sm text-yellow-200">
                <span className="text-white/50">Fix:</span> Re-extract Alert Levels table, update key_levels.json, run update-key-levels.sh
              </div>
            </Card>

            <Card className="bg-green-500/10 border border-green-500/30 p-4">
              <h3 className="font-semibold text-green-400 mb-2">✅ Price Monitor Health</h3>
              <div className="text-sm text-green-200 mb-2">
                <span className="text-white/50">Check:</span> Supabase system_config.alert_system_status.last_run (must be &lt;15 min during market hours)
              </div>
              <div className="text-sm text-red-200">
                <span className="text-white/50">Fix:</span> ALERT JUSTIN IMMEDIATELY if stale — do NOT wait or assume it's fine
              </div>
            </Card>

            <Card className="bg-green-500/10 border border-green-500/30 p-4">
              <h3 className="font-semibold text-green-400 mb-2">✅ Screenshot Completeness</h3>
              <div className="text-sm text-green-200 mb-2">
                <span className="text-white/50">Check:</span> File count in today's screenshot folder (expect 10-11 files)
              </div>
              <div className="text-sm text-yellow-200">
                <span className="text-white/50">Fix:</span> Re-run trading capture, report which files missing with error details
              </div>
            </Card>

            <Card className="bg-green-500/10 border border-green-500/30 p-4">
              <h3 className="font-semibold text-green-400 mb-2">✅ Brief vs Report Consistency</h3>
              <div className="text-sm text-green-200 mb-2">
                <span className="text-white/50">Check:</span> Morning brief key levels match report Alert Levels table exactly
              </div>
              <div className="text-sm text-yellow-200">
                <span className="text-white/50">Fix:</span> Re-read report, re-extract levels, regenerate brief (DO NOT guess or use memory)
              </div>
            </Card>
          </div>
        </div>

        {/* Common Failures */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">⚠️ Common Failure Points</h2>
          <div className="space-y-3">
            <Card className="bg-red-500/10 border border-red-500/30 p-4">
              <div className="font-semibold text-red-400 mb-2">❌ Wrong key levels in brief</div>
              <div className="text-sm text-red-200 mb-2">
                <span className="text-white/50">Root cause:</span> Used dashboard levels instead of report Alert Levels table
              </div>
              <div className="text-sm text-white/70">
                <span className="text-white/50">Prevention:</span> ALWAYS read report .md file → Extract from Alert Levels table → NEVER use dashboard → NEVER use memory
              </div>
            </Card>

            <Card className="bg-red-500/10 border border-red-500/30 p-4">
              <div className="font-semibold text-red-400 mb-2">❌ Price alerts posted to #reports instead of #alerts</div>
              <div className="text-sm text-red-200 mb-2">
                <span className="text-white/50">Root cause:</span> Confused channel purposes
              </div>
              <div className="text-sm text-white/70">
                <span className="text-white/50">Prevention:</span> #reports = NEW report announcements ONLY • #alerts = Price triggers, master eject, mode changes
              </div>
            </Card>

            <Card className="bg-red-500/10 border border-red-500/30 p-4">
              <div className="font-semibold text-red-400 mb-2">❌ TradingView screenshots missing watchlist</div>
              <div className="text-sm text-red-200 mb-2">
                <span className="text-white/50">Root cause:</span> Didn't check/expand watchlist on each chart
              </div>
              <div className="text-sm text-white/70">
                <span className="text-white/50">Prevention:</span> Take snapshot first → Look for "Watchlist, details and news" button → If not [pressed], click it → Wait 2 seconds → Then screenshot
              </div>
            </Card>

            <Card className="bg-red-500/10 border border-red-500/30 p-4">
              <div className="font-semibold text-red-400 mb-2">❌ Wrong date in titles</div>
              <div className="text-sm text-red-200 mb-2">
                <span className="text-white/50">Root cause:</span> Didn't verify current date
              </div>
              <div className="text-sm text-white/70">
                <span className="text-white/50">Prevention:</span> ALWAYS run date +"%A, %B %d, %Y" command BEFORE writing any date-sensitive content
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
