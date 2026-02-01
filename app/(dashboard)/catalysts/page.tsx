import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Calendar, ExternalLink, Sparkles, Zap, Globe } from "lucide-react";
import { CatalystFilters } from "@/components/dashboard/catalyst-filters";

interface Catalyst {
  id: string;
  event_date: string;
  name: string;
  status: string;
  notes: string | null;
  valuation_impact: string | null;
  source_url: string | null;
  notion_page_id: string | null;
  impact: string | null;
  type: string | null;
  month_level: boolean | null;
}

export default async function CatalystsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type || "all";
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
    const { hasSubscriptionAccess } = await import("@/lib/subscription");
    const hasAccess = hasSubscriptionAccess(sub);

    if (!hasAccess) {
      redirect("/signup");
    }
  }

  // Fetch upcoming catalysts
  const today = new Date().toISOString().split("T")[0];
  let query = supabase
    .from("catalysts")
    .select("*")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(50);
  
  // Apply type filter
  if (typeFilter === "tesla") {
    query = query.eq("type", "tesla");
  } else if (typeFilter === "macro") {
    query = query.eq("type", "macro");
  }

  const { data: catalystsData } = await query;
  const catalysts = (catalystsData || []) as Catalyst[];

  // Group by month
  const groupedCatalysts = catalysts.reduce((acc, catalyst) => {
    const date = new Date(catalyst.event_date);
    const monthKey = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(catalyst);
    return acc;
  }, {} as Record<string, Catalyst[]>);

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
    projected: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    speculative: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  const statusLabels: Record<string, string> = {
    confirmed: "Confirmed",
    projected: "Projected",
    speculative: "Speculative",
  };

  return (
    <>
      <Header title="Catalyst Calendar" />
      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Hero Card */}
        <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Upcoming Catalysts</h2>
              <p className="text-xs text-muted-foreground">
                {catalysts.length} events on the horizon
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Key Tesla events, earnings, product launches, and macro events that could move the stock.
          </p>
        </Card>

        {/* Filters */}
        <CatalystFilters />

        {/* Catalysts by Month */}
        {Object.keys(groupedCatalysts).length === 0 ? (
          <Card className="p-6 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No upcoming catalysts</p>
            <p className="text-xs text-muted-foreground mt-1">
              Check back soon for updates
            </p>
          </Card>
        ) : (
          Object.entries(groupedCatalysts).map(([month, monthCatalysts]) => (
            <div key={month} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
                {month}
              </h3>
              {monthCatalysts.map((catalyst) => {
                const date = new Date(catalyst.event_date);
                const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = date.getDate();
                const isMonthLevel = catalyst.month_level === true;
                
                return (
                  <Card 
                    key={catalyst.id} 
                    className={`p-4 transition-all ${
                      catalyst.impact === 'high' 
                        ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] ring-1 ring-amber-500/30' 
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Date Badge - only show for date-specific catalysts */}
                      {!isMonthLevel && (
                        <div className="flex-shrink-0 w-12 text-center">
                          <div className="text-xs text-muted-foreground uppercase">{dayOfWeek}</div>
                          <div className="text-2xl font-bold">{dayNum}</div>
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className={`flex-1 min-w-0 ${isMonthLevel ? 'ml-0' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {catalyst.impact === 'high' && (
                              <span className="text-amber-500 text-lg animate-pulse">⚡</span>
                            )}
                            <h4 className={`font-medium leading-tight ${catalyst.impact === 'high' ? 'text-amber-400' : ''}`}>
                              {catalyst.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {catalyst.type === "macro" && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-500/20 text-purple-400 border-purple-500/30">
                                Macro
                              </Badge>
                            )}
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1.5 py-0 ${statusColors[catalyst.status] || statusColors.projected}`}
                            >
                              {statusLabels[catalyst.status] || catalyst.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {catalyst.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {catalyst.notes}
                          </p>
                        )}
                        
                        {catalyst.valuation_impact && (
                          <p className="text-sm text-primary/80 mt-2 italic">
                            💰 {catalyst.valuation_impact}
                          </p>
                        )}
                        
                        {catalyst.source_url && (
                          <a 
                            href={catalyst.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                          >
                            Source <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ))
        )}

        {/* Legend */}
        <Card className="p-4 md:p-6 lg:p-8">
          <p className="text-xs font-medium text-muted-foreground mb-2">Status Legend</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={statusColors.confirmed}>
              Confirmed — Official announcement
            </Badge>
            <Badge variant="outline" className={statusColors.projected}>
              Projected — Analyst estimates
            </Badge>
            <Badge variant="outline" className={statusColors.speculative}>
              Speculative — Based on patterns
            </Badge>
          </div>
        </Card>
      </main>
    </>
  );
}
