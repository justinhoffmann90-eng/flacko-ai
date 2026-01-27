import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, FileText, History, Wallet, Upload, Calendar, Radio } from "lucide-react";
import { LivePriceLadder } from "@/components/dashboard/live-price-ladder";
import { TierSignals, Positioning, LevelMapEntry } from "@/types";
import { PositioningCard } from "@/components/dashboard/positioning-card";
import { hasSubscriptionAccess } from "@/lib/subscription";

interface ExtractedData {
  mode?: { current: string; label: string };
  price?: { close: number };
  master_eject?: { price: number };
  tiers?: TierSignals;
  positioning?: Positioning;
  levels_map?: LevelMapEntry[];
}

interface Report {
  id: string;
  report_date: string;
  extracted_data: ExtractedData;
}

interface UserSettings {
  cash_available: number | null;
}

interface UserData {
  is_admin: boolean;
}

interface Catalyst {
  id: string;
  event_date: string;
  name: string;
  status: 'confirmed' | 'projected' | 'speculative';
}

export default async function DashboardPage() {
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

  const { data: reportData } = await supabase
    .from("reports")
    .select("*")
    .order("report_date", { ascending: false })
    .limit(1)
    .single();

  const report = reportData as Report | null;

  // Fetch upcoming catalysts (next 2)
  const today = new Date().toISOString().split('T')[0];
  const { data: catalystsData } = await supabase
    .from("catalysts")
    .select("id, event_date, name, status")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(3);
  
  const upcomingCatalysts = (catalystsData || []) as Catalyst[];

  // Fetch user settings for position sizing
  let userSettings: UserSettings | null = null;
  let isAdmin = false;
  if (!devBypass) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("cash_available")
        .eq("user_id", data.user.id)
        .single();
      userSettings = settingsData as UserSettings | null;

      // Check if user is admin
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", data.user.id)
        .single();
      isAdmin = (userData as UserData | null)?.is_admin || false;
    }
  } else {
    isAdmin = true; // In dev mode, show admin features
  }

  // Get cash available from user settings (null in dev mode - will be read from localStorage in client)
  const cashAvailable = devBypass ? null : (userSettings?.cash_available || null);
  const extractedData = report?.extracted_data || null;

  // Parse daily cap % from report positioning (e.g., "20% of target position" → 20)
  const positioning = extractedData?.positioning;
  const dailyCapStr = positioning?.daily_cap || "";
  const dailyCapMatch = dailyCapStr.match(/(\d+)/);
  const dailyCapPct = dailyCapMatch ? parseInt(dailyCapMatch[1]) : 20; // Default to 20%

  const mode = extractedData?.mode?.current || "yellow";
  const closePrice = extractedData?.price?.close || 0;
  const masterEject = extractedData?.master_eject?.price || 0;

  // v3.0 data
  const tiers = extractedData?.tiers;
  const levelsMap = extractedData?.levels_map || [];

  // Separate levels for display
  const upsideLevels = levelsMap.filter(l =>
    l.price > closePrice && !l.level.toLowerCase().includes('current')
  );
  const downsideLevels = levelsMap.filter(l =>
    l.price < closePrice &&
    !l.level.toLowerCase().includes('eject') &&
    !l.level.toLowerCase().includes('current')
  );

  const tierColors: Record<string, string> = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  return (
    <>
      <Header title="Dashboard" />
      <main className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {/* Mode Card - Hero with Glow */}
        <div className={`relative rounded-xl overflow-hidden animated-gradient-${mode}`}>
          {/* Glass overlay */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <Badge
                  variant={mode as "green" | "yellow" | "orange" | "red"}
                  className={`text-lg px-4 py-1.5 font-bold glow-${mode}`}
                >
                  {mode.toUpperCase()} MODE
                </Badge>
                <p className="text-sm text-muted-foreground mt-3">
                  {report ? `Latest Report: ${formatDate(report.report_date)}` : "No report yet"}
                </p>
              </div>
              <Link href="/report">
                <Button size="sm" className="shadow-lg">
                  View Report
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Tier Signals - Custom Indicators */}
            {tiers && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: "Regime", signal: tiers.regime },
                    { label: "Trend", signal: tiers.trend },
                    { label: "Timing", signal: tiers.timing },
                    { label: "Flow", signal: tiers.flow },
                  ].map((tier) => (
                    <div key={tier.label} className="flex flex-col items-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">{tier.label}</p>
                      <div className="relative">
                        <div className={`w-4 h-4 rounded-full ${tierColors[tier.signal || 'yellow']} shadow-lg`}>
                          <div className={`absolute inset-0 rounded-full ${tierColors[tier.signal || 'yellow']} animate-ping opacity-30`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Positioning Card */}
        {positioning && (
          <PositioningCard
            dailyCapPct={dailyCapPct}
            posture={positioning.posture || ''}
            serverCashAvailable={cashAvailable}
            isDevMode={devBypass}
          />
        )}

        {/* Key Levels - Live Price Ladder */}
        {(upsideLevels.length > 0 || downsideLevels.length > 0) && (
          <LivePriceLadder
            upsideLevels={upsideLevels}
            downsideLevels={downsideLevels}
            masterEject={masterEject}
            fallbackPrice={closePrice}
            reportDate={report?.report_date}
          />
        )}

        {/* Upcoming Catalysts */}
        {upcomingCatalysts.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Upcoming Catalysts</h3>
              </div>
              <Link href="/catalysts" className="text-xs text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingCatalysts.map((catalyst) => {
                const eventDate = new Date(catalyst.event_date + 'T12:00:00');
                const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
                const day = eventDate.getDate();
                const statusColors: Record<string, string> = {
                  confirmed: 'bg-green-500/20 text-green-500',
                  projected: 'bg-yellow-500/20 text-yellow-500',
                  speculative: 'bg-slate-500/20 text-slate-400',
                };
                return (
                  <div key={catalyst.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="text-center min-w-[40px]">
                      <p className="text-[10px] uppercase text-muted-foreground">{month}</p>
                      <p className="text-lg font-bold leading-tight">{day}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{catalyst.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColors[catalyst.status]}`}>
                        {catalyst.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Set Up Position Sizing - only show if no cash available (hide in dev mode) */}
        {!devBypass && !cashAvailable && (
          <Link href="/settings">
            <Card className="p-4 border-dashed border-2 hover:border-primary/50 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Set Up Position Sizing</p>
                  <p className="text-xs text-muted-foreground">
                    Enter your cash available to see daily budget &amp; bullet sizes
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Quick Actions */}
        <div className={`grid gap-3 pt-2 ${isAdmin ? 'grid-cols-2' : 'grid-cols-2'}`}>
          <Link href="/report" className="block">
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer h-full">
              <FileText className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="font-medium">Full Report</p>
              <p className="text-xs text-muted-foreground mt-1">
                Today&apos;s complete analysis
              </p>
            </Card>
          </Link>
          <Link href="/catalysts" className="block">
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer h-full">
              <Calendar className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="font-medium">Catalysts</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upcoming events
              </p>
            </Card>
          </Link>
          <Link href="/history" className="block">
            <Card className="p-4 hover:bg-accent transition-colors cursor-pointer h-full">
              <History className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="font-medium">History</p>
              <p className="text-xs text-muted-foreground mt-1">
                Previous reports
              </p>
            </Card>
          </Link>
          {isAdmin && (
            <Link href="/admin/command-center" className="block">
              <Card className="p-4 hover:bg-accent transition-colors cursor-pointer h-full border-primary/50 bg-primary/5">
                <Radio className="h-5 w-5 text-primary mb-2" />
                <p className="font-medium">Command Center</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clawd ops
                </p>
              </Card>
            </Link>
          )}
        </div>
      </main>
    </>
  );
}
