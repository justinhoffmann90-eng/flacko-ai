import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hasSubscriptionAccess } from "@/lib/subscription";

interface BacklogItem {
  rank: number;
  name: string;
  description: string;
  impact: number;
  effort: number;
  score: number;
}

const backlogData: BacklogItem[] = [
  { rank: 1, name: "Daily Mode Card", description: "Branded image posted 7:45am CT daily with MODE, key levels, posture. Template-based, auto-generated from report data.", impact: 5, effort: 1, score: 25 },
  { rank: 2, name: "HIRO Spike Alerts (Delayed)", description: "Post HIRO threshold alerts to X with 15-30 min delay. Creates FOMO, proves edge.", impact: 5, effort: 1, score: 25 },
  { rank: 3, name: "Base Case Accuracy Posts", description: "Screenshot report predictions vs actual results. Builds credibility with proof.", impact: 4, effort: 1, score: 20 },
  { rank: 4, name: "Monday Preview Posts", description: "\"What I'm watching\" weekend preview. Builds anticipation, routine engagement.", impact: 4, effort: 1, score: 20 },
  { rank: 5, name: "Quote Tweet the News", description: "Rapid response to TSLA news with levels/positioning context. Captures news cycle.", impact: 4, effort: 1, score: 20 },
  { rank: 6, name: "Catalyst Calendar Post", description: "Weekly visual calendar of upcoming TSLA catalysts. Utility content, gets saved.", impact: 4, effort: 1, score: 20 },
  { rank: 7, name: "Weekly Scorecard Thread", description: "Friday/Saturday thread: predictions vs results, accuracy %, lessons. Accountability builds trust.", impact: 5, effort: 2, score: 20 },
  { rank: 8, name: "Gamma Strike Rejection Posts", description: "Showcase precision calls (e.g., $440 rejection at $439.88). Credibility content.", impact: 4, effort: 2, score: 16 },
  { rank: 9, name: "\"Why It Moved\" Recaps", description: "After big moves (±3%), explain what happened with levels/HIRO. Educational authority.", impact: 4, effort: 2, score: 16 },
  { rank: 10, name: "HIRO Swing Visualization", description: "Visualize dramatic HIRO swings with before/after. Unique SpotGamma content.", impact: 4, effort: 2, score: 16 },
  { rank: 11, name: "Contrarian Call + Accountability", description: "High-conviction public calls with specific targets. Engagement + credibility if right.", impact: 4, effort: 2, score: 16 },
  { rank: 12, name: "Email Notifications Backend", description: "Build backend for price alert email delivery. Member-facing feature.", impact: 5, effort: 3, score: 15 },
  { rank: 13, name: "Discord Feedback Channel", description: "Dedicated channel for member ideas. Trunks monitors, easy engagement win.", impact: 3, effort: 1, score: 15 },
  { rank: 14, name: "Monthly State of TSLA Thread", description: "First of month comprehensive thread: last month, levels, catalysts, stance.", impact: 4, effort: 3, score: 12 },
  { rank: 15, name: "Earnings Week Case Study", description: "Thread showing how MODE system protected during earnings volatility.", impact: 5, effort: 3, score: 10 },
  { rank: 16, name: "Pre-Earnings Playbook Posts", description: "3-5 days before ER: historical moves, gamma setup, scenarios. Peak attention.", impact: 5, effort: 3, score: 10 },
  { rank: 17, name: "Gamma Explainer Series", description: "Weekly educational threads on gamma, HIRO, SpotGamma, MODE system.", impact: 4, effort: 3, score: 12 },
  { rank: 18, name: "AI Video Content Pipeline", description: "Daily report → 90-sec video recap. Voice + charts via ElevenLabs + FFmpeg.", impact: 5, effort: 4, score: 10 },
  { rank: 19, name: "Weekly Flow Digest", description: "Define format and schedule for weekly flow summary content.", impact: 3, effort: 2, score: 12 },
  { rank: 20, name: "TradingAgents Review", description: "Deep dive Tauric Research framework for architecture patterns to implement.", impact: 4, effort: 3, score: 12 },
  { rank: 21, name: "Education Hub Outline", description: "Curriculum for new members. Onboarding improvement.", impact: 3, effort: 3, score: 9 },
  { rank: 22, name: "SpotGamma Audit Implementation", description: "Act on audit findings (80% features untapped).", impact: 4, effort: 4, score: 8 },
  { rank: 23, name: "QMD Local Semantic Search", description: "Replace Gemini memory search with local hybrid search. Privacy + quality.", impact: 3, effort: 3, score: 9 },
  { rank: 24, name: "TradingView Table Export", description: "CSV export for automated indicator analysis.", impact: 3, effort: 3, score: 9 },
  { rank: 25, name: "Discord Knowledge Bot (RAG)", description: "Bobby Axelrod personality bot for member questions.", impact: 4, effort: 4, score: 8 },
  { rank: 26, name: "Paper Trading Bot", description: "Simulated trader using Flacko system for proof of concept.", impact: 4, effort: 4, score: 8 },
  { rank: 27, name: "Weekly Report Template", description: "Create .md template for Sunday weekly workflow. BLOCKING.", impact: 5, effort: 2, score: 20 },
  { rank: 28, name: "Export Claude Knowledge Base", description: "Backup Flacko knowledge for disaster recovery.", impact: 2, effort: 2, score: 8 },
];

function getImpactColor(impact: number): string {
  if (impact >= 5) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (impact >= 4) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (impact >= 3) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

function getEffortColor(effort: number): string {
  if (effort >= 4) return "bg-red-500/20 text-red-400 border-red-500/30";
  if (effort >= 3) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (effort >= 2) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-green-500/20 text-green-400 border-green-500/30";
}

function getScoreColor(score: number): string {
  if (score >= 20) return "bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border-green-500/40";
  if (score >= 15) return "bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-300 border-blue-500/40";
  if (score >= 10) return "bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-300 border-yellow-500/40";
  return "bg-gradient-to-r from-slate-500/30 to-gray-500/30 text-slate-300 border-slate-500/40";
}

export default async function BacklogPage() {
  const devBypass = process.env.DEV_BYPASS_AUTH === "true";
  const supabase = devBypass ? await createServiceClient() : await createClient();

  if (!devBypass) {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      redirect("/login");
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const sub = subscription as { status?: string; trial_ends_at?: string } | null;
    const hasAccess = hasSubscriptionAccess(sub);

    if (!hasAccess) {
      redirect("/signup");
    }
  }

  // Sort by score (already sorted in data, but ensuring)
  const sortedBacklog = [...backlogData].sort((a, b) => b.score - a.score || a.rank - b.rank);

  return (
    <>
      <Header title="Product Backlog" />
      <main className="px-4 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Flacko AI Product Backlog</h2>
          <p className="text-muted-foreground mb-4">Stack Ranked by Impact vs Effort</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-mono">Generated:</span>
              <span>February 2, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono">Formula:</span>
              <span>Impact (1-5) × (6 - Effort) = Priority Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono">Strategy:</span>
              <span>Higher score = Do first (high impact, low effort)</span>
            </div>
          </div>
        </Card>

        {/* Legend */}
        <Card className="p-4 md:p-6">
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Impact</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">5 - Critical</Badge>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">4 - High</Badge>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">3 - Medium</Badge>
                <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">2 - Low</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Effort</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">1 - Quick</Badge>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">2 - Short</Badge>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">3 - Medium</Badge>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">4 - Long</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Priority Score</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border-green-500/40">20+ - Now</Badge>
                <Badge className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-300 border-blue-500/40">15+ - Soon</Badge>
                <Badge className="bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-300 border-yellow-500/40">10+ - Later</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Backlog Items */}
        <div className="space-y-3">
          {sortedBacklog.map((item) => (
            <Card 
              key={item.rank} 
              className={`p-4 md:p-6 transition-all hover:border-primary/50 ${
                item.score >= 20 ? 'border-green-500/30 bg-green-500/5' : 
                item.score >= 15 ? 'border-blue-500/30 bg-blue-500/5' : 
                ''
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                    item.rank <= 5 ? 'bg-primary/20 text-primary' : 
                    item.rank <= 10 ? 'bg-blue-500/20 text-blue-400' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {item.rank}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-semibold mb-2">{item.name}</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-3">{item.description}</p>
                  
                  {/* Metrics */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getImpactColor(item.impact)}>
                      Impact: {item.impact}
                    </Badge>
                    <Badge className={getEffortColor(item.effort)}>
                      Effort: {item.effort}
                    </Badge>
                    <Badge className={`${getScoreColor(item.score)} font-bold`}>
                      Score: {item.score}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Top Priorities Summary */}
        <Card className="p-6 md:p-8 bg-gradient-to-br from-green-500/5 to-emerald-500/10 border-green-500/20">
          <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Top 10 Priorities (High Impact, Low Effort)
          </h3>
          <ol className="space-y-2">
            {sortedBacklog.slice(0, 10).map((item) => (
              <li key={item.rank} className="flex items-baseline gap-3">
                <span className="font-bold text-primary">{item.rank}.</span>
                <span className="flex-1">
                  <strong>{item.name}</strong> <span className="text-muted-foreground">(Score: {item.score})</span>
                  {item.name === "Daily Mode Card" && <span className="text-muted-foreground text-sm ml-2">— Template once, post daily forever</span>}
                  {item.name === "HIRO Spike Alerts (Delayed)" && <span className="text-muted-foreground text-sm ml-2">— Already have data, just needs delay + post</span>}
                  {item.name === "Weekly Report Template" && <span className="text-muted-foreground text-sm ml-2">— BLOCKING Sunday workflow</span>}
                </span>
              </li>
            ))}
          </ol>
        </Card>

        {/* Recommended Codex Tasks */}
        <Card className="p-6 md:p-8 bg-gradient-to-br from-blue-500/5 to-cyan-500/10 border-blue-500/20">
          <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            Recommended Codex Overnight Tasks
          </h3>
          <p className="text-muted-foreground mb-4">Focus: Build automation for top items</p>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="font-bold text-blue-400 flex-shrink-0">1.</span>
              <div>
                <strong>Daily Mode Card Template</strong>
                <p className="text-sm text-muted-foreground">Create Figma/HTML template that auto-generates from report data</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-blue-400 flex-shrink-0">2.</span>
              <div>
                <strong>HIRO Alert Delay System</strong>
                <p className="text-sm text-muted-foreground">Script to capture HIRO alerts, hold 15-30 min, format for X</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-blue-400 flex-shrink-0">3.</span>
              <div>
                <strong>Accuracy Screenshot Tool</strong>
                <p className="text-sm text-muted-foreground">Auto-generate before/after comparison images</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-blue-400 flex-shrink-0">4.</span>
              <div>
                <strong>Catalyst Calendar Visual</strong>
                <p className="text-sm text-muted-foreground">Auto-generate weekly calendar image from catalysts.json</p>
              </div>
            </li>
          </ol>
        </Card>
      </main>
    </>
  );
}
