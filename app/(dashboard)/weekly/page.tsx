import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { WeeklyReviewData } from "@/types/weekly-review";
import {
  ModeBanner,
  TimeframeGrid,
  ConfluenceBox,
  WeekStats,
  NarrativeCard,
  LessonsGrid,
  ThesisCheckCard,
  ScenariosCard,
  KeyLevelsCard,
  CatalystsCard,
  FlackoTakeCard,
} from "@/components/weekly";
import { ReportToggle } from "@/components/report/report-toggle";
import { hasSubscriptionAccess } from "@/lib/subscription";

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

export default async function WeeklyReviewPage() {
  const devBypass = process.env.DEV_BYPASS_AUTH === "true";
  const supabase = devBypass ? await createServiceClient() : await createClient();

  if (!devBypass) {
    const { data: { user } } = await supabase.auth.getUser();
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
        <main className="px-4 py-6 max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No weekly review available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Weekly reviews are published Sunday.
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const data = review.extracted_data;
  const weekRange = formatWeekRange(review.week_start, review.week_end);

  return (
    <>
      <Header title="Weekly Review" />
      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Daily/Weekly Toggle */}
        <ReportToggle />

        {/* Header with Date */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-1">TSLA Weekly Review</h1>
          <p className="text-muted-foreground">Week of {weekRange}</p>
        </div>

        {/* Mode Banner */}
        <ModeBanner
          mode={data.mode}
          modeTrend={data.mode_trend}
          guidance={data.mode_guidance}
          dailyCap={data.daily_cap_pct}
        />

        {/* Multi-Timeframe Spot Check */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            📊 Multi-Timeframe Spot Check
          </h2>
          <TimeframeGrid
            monthly={data.monthly}
            weekly={data.weekly}
            daily={data.daily}
          />
          <div className="mt-4">
            <ConfluenceBox
              reading={data.confluence.reading}
              explanation={data.confluence.explanation}
            />
          </div>
        </section>

        {/* Week in Pictures (Stats) */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            📈 The Week in Pictures
          </h2>
          <WeekStats candle={data.candle} />
        </section>

        {/* What Happened */}
        {data.what_happened && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              📖 What Happened This Week
            </h2>
            <NarrativeCard content={data.what_happened} />
          </section>
        )}

        {/* What We Learned */}
        {(data.lessons.what_worked.length > 0 ||
          data.lessons.what_didnt.length > 0 ||
          data.lessons.lessons_forward.length > 0) && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              🎓 What We Learned
            </h2>
            <LessonsGrid lessons={data.lessons} />
          </section>
        )}

        {/* Thesis Check */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            🎯 Thesis Check
          </h2>
          <ThesisCheckCard thesis={data.thesis} />
        </section>

        {/* Looking Ahead with Scenarios */}
        {(data.looking_ahead || data.scenarios.length > 0) && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              👀 Looking Ahead
            </h2>
            {data.looking_ahead && (
              <NarrativeCard content={data.looking_ahead} />
            )}
            {data.scenarios.length > 0 && (
              <div className="mt-4">
                <ScenariosCard scenarios={data.scenarios} />
              </div>
            )}
          </section>
        )}

        {/* Catalyst Calendar */}
        {data.catalysts && data.catalysts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              📅 Catalyst Calendar
            </h2>
            <CatalystsCard catalysts={data.catalysts} />
          </section>
        )}

        {/* Key Levels for Next Week */}
        {data.key_levels && data.key_levels.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              📍 Key Levels for Next Week
            </h2>
            <KeyLevelsCard levels={data.key_levels} currentPrice={data.current_price} />
          </section>
        )}

        {/* Flacko AI's Take / Conclusion */}
        {data.flacko_take && (
          <section>
            <FlackoTakeCard content={data.flacko_take} />
          </section>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center px-4">
          This review is for educational purposes only and does not constitute financial advice.
          Always do your own research before making investment decisions.
        </p>
      </main>
    </>
  );
}
