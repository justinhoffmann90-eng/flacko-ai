import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/report/markdown-content";
import { ReportToggle } from "@/components/report/report-toggle";
import { WeeklyReviewData } from "@/types/weekly-review";
import { formatPrice, formatPercent } from "@/lib/utils";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WeeklyReviewRow {
  id: string;
  week_start: string;
  week_end: string;
  raw_markdown: string;
  extracted_data: WeeklyReviewData;
  parser_warnings?: string[];
}

// Format date range: "Jan 27 – 31, 2026"
function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

// Get mode emoji
function getModeEmoji(mode: string): string {
  switch (mode) {
    case 'green': return '🟢';
    case 'yellow': return '🟡';
    case 'orange': return '🟠';
    case 'red': return '🔴';
    default: return '⚪';
  }
}

// Get trend icon
function getTrendIcon(trend?: string) {
  if (!trend) return <Minus className="h-4 w-4" />;
  if (trend.toLowerCase().includes('improv') || trend.toLowerCase().includes('strengthen') || trend.toLowerCase().includes('bull')) {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  }
  if (trend.toLowerCase().includes('weaken') || trend.toLowerCase().includes('deteriorat') || trend.toLowerCase().includes('bear')) {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
  return <Minus className="h-4 w-4 text-yellow-500" />;
}

export default async function WeeklyReviewPage() {
  const devBypass = process.env.DEV_BYPASS_AUTH === "true";
  const supabase = devBypass ? await createServiceClient() : await createClient();

  if (!devBypass) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }
  }

  // Fetch latest weekly review
  const { data: reviewData } = await supabase
    .from("weekly_reviews")
    .select("*")
    .order("week_end", { ascending: false })
    .limit(1)
    .single();

  const review = reviewData as WeeklyReviewRow | null;

  if (!review) {
    return (
      <>
        <Header title="Weekly Review" />
        <main className="px-4 py-6 max-w-2xl mx-auto space-y-4">
          <ReportToggle />
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <span className="text-2xl">📅</span>
              </div>
              <p className="text-lg font-medium">No weekly review yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Weekly reviews drop every Sunday with a full recap of the week, updated thesis check, and key levels for the week ahead.
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const data = review.extracted_data;
  const weekRange = formatWeekRange(review.week_start, review.week_end);
  const mode = data.mode || "yellow";
  const changePct = data.candle?.change_pct ?? data.change_pct ?? 0;
  const masterEject = data.master_eject || 0;

  return (
    <>
      <Header title={`TSLA Weekly Review - ${weekRange}`} />
      <main className="px-4 py-6 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* Daily/Weekly Toggle */}
        <ReportToggle />

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6">
          {/* Mode */}
          <div className="bg-card border rounded-lg p-3 md:p-4 lg:p-6 text-center">
            <p className="text-xs md:text-sm lg:text-base text-muted-foreground uppercase tracking-wide">Mode</p>
            <div className="flex items-center justify-center gap-2 mt-1 md:mt-2">
              <span className="text-lg md:text-xl">{getModeEmoji(mode)}</span>
              <Badge
                variant={mode as "green" | "yellow" | "red"}
                className="text-sm md:text-base lg:text-lg px-3 md:px-4"
              >
                {mode.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Weekly Change */}
          <div className="bg-card border rounded-lg p-3 md:p-4 lg:p-6 text-center">
            <p className="text-xs md:text-sm lg:text-base text-muted-foreground uppercase tracking-wide">Weekly Change</p>
            <p className={`text-base md:text-lg lg:text-xl font-semibold mt-1 md:mt-2 ${changePct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
            </p>
          </div>

          {/* Master Eject - Full Width */}
          <div className="col-span-2 bg-card border border-red-500/30 rounded-lg p-3 md:p-4 lg:p-6 text-center">
            <p className="text-xs md:text-sm lg:text-base text-red-500 uppercase tracking-wide flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
              Master Eject
            </p>
            <p className="text-lg md:text-xl lg:text-2xl font-bold text-red-500">
              {masterEject > 0 ? formatPrice(masterEject) : '—'}
            </p>
          </div>
        </div>

        {/* Key Levels Table */}
        {data.key_levels && data.key_levels.length > 0 && (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="bg-slate-700 px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                📍 Key Levels for Next Week
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Level</th>
                  <th className="text-right px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Price</th>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {data.key_levels.map((level, idx) => (
                  <tr key={idx} className="border-t border-border/50">
                    <td className="px-4 py-3">
                      <span className="mr-2">{level.emoji}</span>
                      <span className="font-medium">{level.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatPrice(level.price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {level.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Scenarios Table */}
        {data.scenarios && data.scenarios.length > 0 && (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="bg-slate-700 px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                🔮 Weekly Scenarios
              </h3>
            </div>
            <table className="w-full table-fixed">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-2 md:px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground w-16 md:w-24">Scenario</th>
                  <th className="text-center px-2 md:px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground w-12 md:w-20">Probability</th>
                  <th className="text-left px-2 md:px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Trigger</th>
                  <th className="text-left px-2 md:px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Response</th>
                </tr>
              </thead>
              <tbody>
                {data.scenarios.map((scenario, idx) => (
                  <tr key={idx} className="border-t border-border/50">
                    <td className="px-2 md:px-4 py-3 align-top">
                      <span className={`inline-flex items-center gap-1 md:gap-2 font-medium text-sm ${
                        scenario.type === 'bull' ? 'text-green-500' :
                        scenario.type === 'bear' ? 'text-red-500' :
                        'text-yellow-500'
                      }`}>
                        {scenario.type === 'bull' ? '🐂' :
                         scenario.type === 'bear' ? '🐻' : '⚖️'}
                        <span className="hidden sm:inline">{scenario.type.charAt(0).toUpperCase() + scenario.type.slice(1)}</span>
                      </span>
                    </td>
                    <td className="px-2 md:px-4 py-3 text-center align-top">
                      <span className="font-semibold text-sm">{scenario.probability}%</span>
                    </td>
                    <td className="px-2 md:px-4 py-3 text-sm align-top">{scenario.trigger}</td>
                    <td className="px-2 md:px-4 py-3 text-sm align-top">{scenario.response}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Catalyst Calendar */}
        {data.catalysts && data.catalysts.length > 0 && (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="bg-slate-700 px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                📅 Catalyst Calendar
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Event</th>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Impact</th>
                </tr>
              </thead>
              <tbody>
                {data.catalysts.map((catalyst, idx) => (
                  <tr key={idx} className="border-t border-border/50">
                    <td className="px-4 py-3 text-sm font-medium">{catalyst.date}</td>
                    <td className="px-4 py-3 text-sm">{catalyst.event}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{catalyst.impact || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Multi-Timeframe Spot Check */}
        {(data.monthly || data.weekly || data.daily) && (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="bg-slate-700 px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                📊 Multi-Timeframe Spot Check
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Timeframe</th>
                  <th className="text-center px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Signal</th>
                  <th className="text-center px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">BX Trender</th>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Structure</th>
                </tr>
              </thead>
              <tbody>
                {data.monthly && (
                  <tr className="border-t border-border/50">
                    <td className="px-4 py-3 font-medium">Monthly</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-3 h-3 rounded-full ${
                        data.monthly.signal === 'green' ? 'bg-green-500' :
                        data.monthly.signal === 'yellow' ? 'bg-yellow-500' :
                        data.monthly.signal === 'red' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className={data.monthly.bx_trender?.color === 'green' ? 'text-green-500' : 'text-red-500'}>
                        {data.monthly.bx_trender?.pattern || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{data.monthly.structure}</td>
                  </tr>
                )}
                {data.weekly && (
                  <tr className="border-t border-border/50">
                    <td className="px-4 py-3 font-medium">Weekly</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-3 h-3 rounded-full ${
                        data.weekly.signal === 'green' ? 'bg-green-500' :
                        data.weekly.signal === 'yellow' ? 'bg-yellow-500' :
                        data.weekly.signal === 'red' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className={data.weekly.bx_trender?.color === 'green' ? 'text-green-500' : 'text-red-500'}>
                        {data.weekly.bx_trender?.pattern || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{data.weekly.structure}</td>
                  </tr>
                )}
                {data.daily && (
                  <tr className="border-t border-border/50">
                    <td className="px-4 py-3 font-medium">Daily</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-3 h-3 rounded-full ${
                        data.daily.signal === 'green' ? 'bg-green-500' :
                        data.daily.signal === 'yellow' ? 'bg-yellow-500' :
                        data.daily.signal === 'red' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className={data.daily.bx_trender?.color === 'green' ? 'text-green-500' : 'text-red-500'}>
                        {data.daily.bx_trender?.pattern || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{data.daily.structure}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {data.confluence && (
              <div className="px-4 py-3 bg-muted/30 border-t border-border/50">
                <p className="text-sm">
                  <strong>Confluence:</strong> {data.confluence.reading}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{data.confluence.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Thesis Check */}
        {data.thesis && (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="bg-slate-700 px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                🎯 Thesis Check
              </h3>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge 
                  variant={
                    data.thesis.status === 'intact' ? 'green' :
                    data.thesis.status === 'strengthening' ? 'green' :
                    data.thesis.status === 'weakening' ? 'yellow' :
                    'default'
                  }
                >
                  {data.thesis.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              
              {data.thesis.supporting_points?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 text-green-500">✓ Supporting Points</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {data.thesis.supporting_points.map((point, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {data.thesis.concerning_points?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 text-red-500">⚠ Concerning Points</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {data.thesis.concerning_points.map((point, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {data.thesis.narrative && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-sm">{data.thesis.narrative}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Markdown Content */}
        <div className="bg-card border rounded-lg p-4 sm:p-6 md:p-8 lg:p-10">
          <MarkdownContent content={review.raw_markdown} />
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center px-4">
          This review is for educational purposes only and does not constitute financial advice.
          Always do your own research before making investment decisions.
        </p>
      </main>
    </>
  );
}
