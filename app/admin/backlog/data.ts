export type BacklogStatus = "backlog" | "in-progress" | "done";
export type BacklogPriority = "P0" | "P1" | "P2";

export interface BacklogItem {
  id: string;
  priority: BacklogPriority;
  title: string;
  description: string;
  status: BacklogStatus;
  tags: string[];
}

export const backlogItems: BacklogItem[] = [
  {
    id: "multi-timeframe-analysis",
    priority: "P0",
    title: "Multi-timeframe analysis in daily reports",
    description:
      "Add multi-timeframe breakdowns (1H/4H/1D/1W) to improve context and trend alignment in daily reports.",
    status: "in-progress",
    tags: ["Reports", "Analysis", "Pipeline"],
  },
  {
    id: "email-delivery-monitoring",
    priority: "P0",
    title: "Email delivery reliability monitoring",
    description:
      "Track bounce rates, delays, and deliverability metrics with alerting tied to onboarding health.",
    status: "backlog",
    tags: ["Email", "Monitoring", "Onboarding"],
  },
  {
    id: "subscriber-growth-dashboard",
    priority: "P1",
    title: "Subscriber growth dashboard",
    description:
      "Visualize new signups, churn, and conversion funnels with daily/weekly trend lines.",
    status: "backlog",
    tags: ["Growth", "Analytics", "Dashboard"],
  },
  {
    id: "alert-accuracy-tracking",
    priority: "P1",
    title: "Alert accuracy tracking",
    description:
      "Measure alert hit rate, false positives, and post-alert performance outcomes.",
    status: "backlog",
    tags: ["Alerts", "Quality", "Analytics"],
  },
  {
    id: "mobile-push-notifications",
    priority: "P2",
    title: "Mobile app push notifications",
    description:
      "Add mobile push alerts for key price levels, report drops, and system updates.",
    status: "backlog",
    tags: ["Mobile", "Notifications"],
  },
  {
    id: "historical-report-archive",
    priority: "P2",
    title: "Historical report archive",
    description:
      "Create a searchable archive for past reports with filters by date, theme, and market regime.",
    status: "done",
    tags: ["Reports", "Archive", "Search"],
  },
];
