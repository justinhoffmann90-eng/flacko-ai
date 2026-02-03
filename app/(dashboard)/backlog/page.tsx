import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";

interface BacklogItem {
  rank: number;
  name: string;
  description: string;
  impact: number;
  effort: number;
  score: number;
}

const backlogItems: BacklogItem[] = [
  {
    rank: 1,
    name: "Daily Mode Card",
    description: "Branded image posted 7:45am CT daily with MODE, key levels, posture. Template-based, auto-generated from report data.",
    impact: 5,
    effort: 1,
    score: 25
  },
  {
    rank: 2,
    name: "HIRO Spike Alerts (Delayed)",
    description: "Post HIRO threshold alerts to X with 15-30 min delay. Creates FOMO, proves edge.",
    impact: 5,
    effort: 1,
    score: 25
  },
  {
    rank: 3,
    name: "Base Case Accuracy Posts",
    description: "Screenshot report predictions vs actual results. Builds credibility with proof.",
    impact: 4,
    effort: 1,
    score: 20
  },
  {
    rank: 4,
    name: "Monday Preview Posts",
    description: "\"What I'm watching\" weekend preview. Builds anticipation, routine engagement.",
    impact: 4,
    effort: 1,
    score: 20
  },
  {
    rank: 5,
    name: "Quote Tweet the News",
    description: "Rapid response to TSLA news with levels/positioning context. Captures news cycle.",
    impact: 4,
    effort: 1,
    score: 20
  },
  {
    rank: 6,
    name: "Catalyst Calendar Post",
    description: "Weekly visual calendar of upcoming TSLA catalysts. Utility content, gets saved.",
    impact: 4,
    effort: 1,
    score: 20
  },
  {
    rank: 7,
    name: "Weekly Scorecard Thread",
    description: "Friday/Saturday thread: predictions vs results, accuracy %, lessons. Accountability builds trust.",
    impact: 5,
    effort: 2,
    score: 20
  },
  {
    rank: 8,
    name: "Gamma Strike Rejection Posts",
    description: "Showcase precision calls (e.g., $440 rejection at $439.88). Credibility content.",
    impact: 4,
    effort: 2,
    score: 16
  },
  {
    rank: 9,
    name: "\"Why It Moved\" Recaps",
    description: "After big moves (±3%), explain what happened with levels/HIRO. Educational authority.",
    impact: 4,
    effort: 2,
    score: 16
  },
  {
    rank: 10,
    name: "HIRO Swing Visualization",
    description: "Visualize dramatic HIRO swings with before/after. Unique SpotGamma content.",
    impact: 4,
    effort: 2,
    score: 16
  },
  {
    rank: 11,
    name: "Contrarian Call + Accountability",
    description: "High-conviction public calls with specific targets. Engagement + credibility if right.",
    impact: 4,
    effort: 2,
    score: 16
  },
  {
    rank: 12,
    name: "Email Notifications Backend",
    description: "Build backend for price alert email delivery. Member-facing feature.",
    impact: 5,
    effort: 3,
    score: 15
  },
  {
    rank: 13,
    name: "Discord Feedback Channel",
    description: "Dedicated channel for member ideas. Trunks monitors, easy engagement win.",
    impact: 3,
    effort: 1,
    score: 15
  },
  {
    rank: 14,
    name: "Monthly State of TSLA Thread",
    description: "First of month comprehensive thread: last month, levels, catalysts, stance.",
    impact: 4,
    effort: 3,
    score: 12
  },
  {
    rank: 15,
    name: "Earnings Week Case Study",
    description: "Thread showing how MODE system protected during earnings volatility.",
    impact: 5,
    effort: 3,
    score: 10
  },
  {
    rank: 16,
    name: "Pre-Earnings Playbook Posts",
    description: "3-5 days before ER: historical moves, gamma setup, scenarios. Peak attention.",
    impact: 5,
    effort: 3,
    score: 10
  },
  {
    rank: 17,
    name: "Gamma Explainer Series",
    description: "Weekly educational threads on gamma, HIRO, SpotGamma, MODE system.",
    impact: 4,
    effort: 3,
    score: 12
  },
  {
    rank: 18,
    name: "AI Video Content Pipeline",
    description: "Daily report → 90-sec video recap. Voice + charts via ElevenLabs + FFmpeg.",
    impact: 5,
    effort: 4,
    score: 10
  },
  {
    rank: 19,
    name: "Weekly Flow Digest",
    description: "Define format and schedule for weekly flow summary content.",
    impact: 3,
    effort: 2,
    score: 12
  },
  {
    rank: 20,
    name: "TradingAgents Review",
    description: "Deep dive Tauric Research framework for architecture patterns to implement.",
    impact: 4,
    effort: 3,
    score: 12
  },
  {
    rank: 21,
    name: "Education Hub Outline",
    description: "Curriculum for new members. Onboarding improvement.",
    impact: 3,
    effort: 3,
    score: 9
  },
  {
    rank: 22,
    name: "SpotGamma Audit Implementation",
    description: "Act on audit findings (80% features untapped).",
    impact: 4,
    effort: 4,
    score: 8
  },
  {
    rank: 23,
    name: "QMD Local Semantic Search",
    description: "Replace Gemini memory search with local hybrid search. Privacy + quality.",
    impact: 3,
    effort: 3,
    score: 9
  },
  {
    rank: 24,
    name: "TradingView Table Export",
    description: "CSV export for automated indicator analysis.",
    impact: 3,
    effort: 3,
    score: 9
  },
  {
    rank: 25,
    name: "Discord Knowledge Bot (RAG)",
    description: "Bobby Axelrod personality bot for member questions.",
    impact: 4,
    effort: 4,
    score: 8
  },
  {
    rank: 26,
    name: "Paper Trading Bot",
    description: "Simulated trader using Flacko system for proof of concept.",
    impact: 4,
    effort: 4,
    score: 8
  },
  {
    rank: 27,
    name: "Weekly Report Template",
    description: "Create .md template for Sunday weekly workflow. BLOCKING.",
    impact: 5,
    effort: 2,
    score: 20
  },
  {
    rank: 28,
    name: "Export Claude Knowledge Base",
    description: "Backup Flacko knowledge for disaster recovery.",
    impact: 2,
    effort: 2,
    score: 8
  }
];

export default async function BacklogPage() {
  const devBypass = process.env.DEV_BYPASS_AUTH === "true";
  const supabase = devBypass ? await createClient() : await createClient();

  if (!devBypass) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }
  }

  return (
    <>
      <Header title="Product Backlog" />
      <main className="px-4 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Flacko AI Product Backlog</h2>
              <p className="text-sm text-muted-foreground">
                Stack ranked by Impact vs Effort
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-muted-foreground">
                <span>Generated: February 2, 2026</span>
                <span className="hidden sm:inline">•</span>
                <span>Scoring: Impact (1-5) × (6 - Effort) = Priority Score</span>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Higher score = Do first (high impact, low effort)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Backlog Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 sm:p-4 font-semibold text-foreground text-sm whitespace-nowrap">Rank</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-foreground text-sm min-w-[200px]">Name</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-foreground text-sm hidden md:table-cell">Description</th>
                    <th className="text-center p-3 sm:p-4 font-semibold text-foreground text-sm whitespace-nowrap">Impact</th>
                    <th className="text-center p-3 sm:p-4 font-semibold text-foreground text-sm whitespace-nowrap">Effort</th>
                    <th className="text-center p-3 sm:p-4 font-semibold text-foreground text-sm whitespace-nowrap">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {backlogItems.map((item, index) => (
                    <tr 
                      key={item.rank}
                      className={`border-b border-border ${
                        index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                      } hover:bg-muted/40 transition-colors`}
                    >
                      <td className="p-3 sm:p-4 text-muted-foreground text-sm">{item.rank}</td>
                      <td className="p-3 sm:p-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">{item.description}</div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-sm text-muted-foreground hidden md:table-cell max-w-md">
                        {item.description}
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                          item.impact >= 5 ? 'bg-green-500/20 text-green-400' :
                          item.impact >= 4 ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {item.impact}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                          item.effort <= 2 ? 'bg-green-500/20 text-green-400' :
                          item.effort <= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {item.effort}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                          item.score >= 20 ? 'bg-green-500/20 text-green-400' :
                          item.score >= 12 ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {item.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <Card className="bg-muted/30 border-border">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Scoring formula:</strong> Impact × (6 - Effort)</p>
              <p>Example: Impact 5, Effort 1 → 5 × 5 = 25 (highest priority)</p>
              <p>Example: Impact 3, Effort 4 → 3 × 2 = 6 (lower priority)</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
