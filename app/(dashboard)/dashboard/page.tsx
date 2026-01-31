import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, FileText, History, Wallet, Upload, Calendar, Radio, CalendarDays } from "lucide-react";
import { LivePriceLadder } from "@/components/dashboard/live-price-ladder";
import { TierSignals, Positioning, LevelMapEntry } from "@/types";
import { PositioningCard } from "@/components/dashboard/positioning-card";
import { hasSubscriptionAccess } from "@/lib/subscription";
import { DiscordOnboarding } from "@/components/dashboard/discord-onboarding";
import { ModeProvider } from "@/components/providers/mode-provider";

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
  discord_user_id: string | null;
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

    // Track dashboard visit
    await supabase
      .from("users")
      .update({ last_dashboard_visit: new Date().toISOString() })
      .eq("id", user.id);
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
  let isDiscordLinked = false;
  if (!devBypass) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("cash_available")
        .eq("user_id", data.user.id)
        .single();
      userSettings = settingsData as UserSettings | null;

      // Check if user is admin and Discord status
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin, discord_user_id")
        .eq("id", data.user.id)
        .single();
      const userDataTyped = userData as UserData | null;
      isAdmin = userDataTyped?.is_admin || false;
      isDiscordLinked = !!userDataTyped?.discord_user_id;
    }
  } else {
    isAdmin = true; // In dev mode, show admin features
    isDiscordLinked = true; // Hide onboarding in dev mode
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
    <ModeProvider mode={mode}>
      <Header title="Dashboard" />
      <main className="px-4 py-6 max-w-lg mx-auto md:max-w-none md:max-w-5xl lg:max-w-6xl md:px-0 space-y-4 md:space-y-8">
        {/* Discord Onboarding Banner */}
        <DiscordOnboarding isDiscordLinked={isDiscordLinked} />
        
        {/* Mode Card - Hero with Glow */}
        <div className={`relative rounded-xl overflow-hidden animated-gradient-${mode}`}>
          {/* Glass overlay */}
          <div className="glass-card rounded-xl p-5 md:p-8 lg:p-10">
            <div className="flex items-start justify-between">
              <div>
                <Badge
                  variant={mode as "green" | "yellow" | "orange" | "red"}
                  className={`text-lg md:text-2xl lg:text-3xl px-4 md:px-8 lg:px-10 py-1.5 md:py-3 lg:py-4 font-bold glow-${mode}`}
                >
                  {mode.toUpperCase()} MODE
                </Badge>
                <p className="text-sm md:text-base lg:text-lg text-muted-foreground mt-3 md:mt-4">
                  {report ? `Latest Report: ${formatDateShort(report.report_date)}` : "No report yet"}
                </p>
              </div>
              <Link href="/report">
                <Button size="sm" className="shadow-lg md:text-base md:px-6 md:py-6 lg:text-lg lg:px-8 lg:py-7">
                  View Report
                  <ArrowRight className="ml-1 h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                </Button>
              </Link>
            </div>

            {/* Tier Signals - Custom Indicators */}
            {tiers && (
              <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/10">
                <div className="grid grid-cols-4 gap-3 md:gap-6 lg:gap-8 text-center">
                  {[
                    { label: "Long", sublabel: "Weekly", signal: tiers.long || tiers.regime },
                    { label: "Medium", sublabel: "Daily", signal: tiers.medium || tiers.trend },
                    { label: "Short", sublabel: "4H Entry", signal: tiers.short || tiers.timing },
                    { label: "Hourly", sublabel: "1H Zone", signal: tiers.hourly || tiers.flow },
                  ].map((tier) => (
                    <div key={tier.label} className="flex flex-col items-center">
                      <p className="text-[10px] md:text-sm lg:text-base text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1 font-medium">{tier.label}</p>
                      <p className="text-[8px] md:text-xs lg:text-sm text-muted-foreground/70 mb-1 md:mb-2">{tier.sublabel}</p>
                      <div className="relative">
                        <div className={`w-4 h-4 md:w-7 md:h-7 lg:w-9 lg:h-9 rounded-full ${tierColors[tier.signal || 'yellow']} shadow-lg`}>
                          <div className={`absolute inset-0 rounded-full ${tierColors[tier.signal || 'yellow']} animate-ping opacity-30`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] md:text-xs lg:text-sm text-center text-muted-foreground/60 mt-2 md:mt-3">
                  Long/Medium = trend health • Short/Hourly = entry quality
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: 2-column grid | Mobile: stacked */}
        <div className="md:grid md:grid-cols-2 md:gap-8 lg:gap-10 space-y-4 md:space-y-0">
          {/* Left column */}
          <div className="space-y-4">
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
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Upcoming Catalysts */}
            {upcomingCatalysts.length > 0 && (
              <Card className="p-4 md:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Calendar className="h-4 w-4 md:h-6 md:w-6 lg:h-7 lg:w-7 text-muted-foreground" />
                    <h3 className="font-semibold text-sm md:text-lg lg:text-xl">Upcoming Catalysts</h3>
                  </div>
                  <Link href="/catalysts" className="text-xs md:text-sm lg:text-base text-primary hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
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
                      <div key={catalyst.id} className="flex items-center gap-3 md:gap-4 lg:gap-5 p-2 md:p-3 lg:p-4 rounded-lg bg-muted/50">
                        <div className="text-center min-w-[40px] md:min-w-[60px] lg:min-w-[70px]">
                          <p className="text-[10px] md:text-xs lg:text-sm uppercase text-muted-foreground">{month}</p>
                          <p className="text-lg md:text-2xl lg:text-3xl font-bold leading-tight">{day}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base lg:text-lg font-medium truncate">{catalyst.name}</p>
                          <span className={`text-[10px] md:text-xs lg:text-sm px-1.5 md:px-2 py-0.5 md:py-1 rounded font-medium ${statusColors[catalyst.status]}`}>
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
                <Card className="p-4 md:p-6 lg:p-8 border-dashed border-2 hover:border-primary/50 hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 md:gap-4 lg:gap-5">
                    <div className="h-10 w-10 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-full bg-muted flex items-center justify-center">
                      <Wallet className="h-5 w-5 md:h-7 md:w-7 lg:h-8 lg:w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium md:text-lg lg:text-xl">Set Up Position Sizing</p>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                        Enter your cash available to see daily budget &amp; bullet sizes
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`grid gap-3 md:gap-4 lg:gap-6 pt-2 grid-cols-2 md:grid-cols-4`}>
          <Link href="/report" className="block">
            <Card className="p-4 md:p-6 lg:p-8 hover:bg-accent transition-all cursor-pointer h-full press-scale">
              <FileText className="h-5 w-5 md:h-7 md:w-7 lg:h-8 lg:w-8 text-muted-foreground mb-2 md:mb-3 lg:mb-4" />
              <p className="font-medium md:text-xl lg:text-2xl">Daily Report</p>
              <p className="text-xs md:text-sm lg:text-base text-muted-foreground mt-1 md:mt-2">
                Today&apos;s complete analysis
              </p>
            </Card>
          </Link>
          <Link href="/weekly" className="block">
            <Card className="p-4 md:p-6 lg:p-8 hover:bg-accent transition-colors cursor-pointer h-full border-blue-500/30 bg-blue-500/5">
              <CalendarDays className="h-5 w-5 md:h-7 md:w-7 lg:h-8 lg:w-8 text-blue-500 mb-2 md:mb-3 lg:mb-4" />
              <p className="font-medium md:text-xl lg:text-2xl">📅 Weekly Review</p>
              <p className="text-xs md:text-sm lg:text-base text-muted-foreground mt-1 md:mt-2">
                Friday recap &amp; outlook
              </p>
            </Card>
          </Link>
          <Link href="/catalysts" className="block">
            <Card className="p-4 md:p-6 lg:p-8 hover:bg-accent transition-all cursor-pointer h-full press-scale">
              <Calendar className="h-5 w-5 md:h-7 md:w-7 lg:h-8 lg:w-8 text-muted-foreground mb-2 md:mb-3 lg:mb-4" />
              <p className="font-medium md:text-xl lg:text-2xl">Catalysts</p>
              <p className="text-xs md:text-sm lg:text-base text-muted-foreground mt-1 md:mt-2">
                Upcoming events
              </p>
            </Card>
          </Link>
          <Link href="/history" className="block">
            <Card className="p-4 md:p-6 lg:p-8 hover:bg-accent transition-all cursor-pointer h-full press-scale">
              <History className="h-5 w-5 md:h-7 md:w-7 lg:h-8 lg:w-8 text-muted-foreground mb-2 md:mb-3 lg:mb-4" />
              <p className="font-medium md:text-xl lg:text-2xl">History</p>
              <p className="text-xs md:text-sm lg:text-base text-muted-foreground mt-1 md:mt-2">
                Previous reports
              </p>
            </Card>
          </Link>
          {isAdmin && (
            <Link href="/admin/command-center" className="col-span-2 md:col-span-4 block">
              <Card className="p-4 md:p-6 lg:p-8 hover:bg-accent transition-colors cursor-pointer h-full border-primary/50 bg-primary/5">
                <Radio className="h-5 w-5 md:h-7 md:w-7 lg:h-8 lg:w-8 text-primary mb-2 md:mb-3 lg:mb-4" />
                <p className="font-medium md:text-xl lg:text-2xl">Command Center</p>
                <p className="text-xs md:text-sm lg:text-base text-muted-foreground mt-1 md:mt-2">
                  Clawd ops
                </p>
              </Card>
            </Link>
          )}
        </div>
      </main>
    </ModeProvider>
  );
}
