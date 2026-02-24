"use client";

import { useState, useEffect } from "react";
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isPast,
  startOfDay,
  endOfDay,
  addDays,
} from "date-fns";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  XCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
} from "lucide-react";

interface QueueItem {
  id: string;
  content_type: string;
  content: string;
  scheduled_for: string;
  status: "draft" | "pending_approval" | "approved" | "posted" | "rejected";
  metadata?: Record<string, unknown>;
  created_at: string;
  approved_at?: string;
  posted_at?: string;
}

interface ContentQueueProps {
  refreshTrigger?: number;
  onEdit?: (item: QueueItem) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    icon: <Clock className="w-4 h-4" />,
    color: "text-zinc-400",
    bgColor: "bg-zinc-800/50",
  },
  pending_approval: {
    label: "Pending Approval",
    icon: <AlertCircle className="w-4 h-4" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  posted: {
    label: "Posted",
    icon: <Send className="w-4 h-4" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  tweet: "Tweet",
  tweet_premarket: "Pre-market Tweet",
  tweet_market_hours: "Market Hours Tweet",
  tweet_afterhours: "After-hours Tweet",
  morning_brief: "Morning Brief",
  hiro_alert: "HIRO Alert",
  eod_intelligence: "EOD Wrap",
  daily_assessment: "Daily Assessment",
  mode_card: "Mode Card",
  levels_card: "Levels Card",
};

export function ContentQueue({ refreshTrigger, onEdit }: ContentQueueProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, [refreshTrigger]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/content/scheduled?status=all&limit=100");
      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "today") {
      const itemDate = parseISO(item.scheduled_for);
      return isToday(itemDate);
    }
    if (filter === "upcoming") {
      const itemDate = parseISO(item.scheduled_for);
      return !isPast(itemDate) || isToday(itemDate);
    }
    if (filter === "pending") {
      return item.status === "pending_approval" || item.status === "approved";
    }
    return item.status === filter;
  });

  const groupedItems = filteredItems.reduce((groups, item) => {
    const date = startOfDay(parseISO(item.scheduled_for));
    const dateKey = date.toISOString();

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {} as Record<string, QueueItem[]>);

  const sortedDates = Object.keys(groupedItems).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApprove = async (id: string) => {
    setProcessing((prev) => new Set(prev).add(id));

    try {
      const response = await fetch(`/api/content/scheduled/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!response.ok) throw new Error("Failed to approve");

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "approved", approved_at: new Date().toISOString() } : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: string) => {
    setProcessing((prev) => new Set(prev).add(id));

    try {
      const response = await fetch(`/api/content/scheduled/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) throw new Error("Failed to reject");

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "rejected" } : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;

    setProcessing((prev) => new Set(prev).add(id));

    try {
      const response = await fetch(`/api/content/scheduled/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d");
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-zinc-700 border-t-zinc-300 rounded-full mx-auto mb-2" />
        <p className="text-zinc-500 text-sm">Loading queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All" },
          { key: "today", label: "Today" },
          { key: "upcoming", label: "Upcoming" },
          { key: "pending", label: "Needs Action" },
          { key: "draft", label: "Drafts" },
          { key: "approved", label: "Approved" },
          { key: "posted", label: "Posted" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              filter === f.key
                ? "bg-zinc-800 border-zinc-600 text-white"
                : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Queue Items */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950/50 border border-zinc-800 rounded-xl">
          <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-500">No items in queue</p>
          <p className="text-xs text-zinc-600 mt-1">
            {filter === "all" ? "Generate content to see it here" : "Try a different filter"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <h4 className="text-sm font-medium text-zinc-500 mb-3 sticky top-0 bg-zinc-900/95 py-2">
                {formatDateLabel(dateKey)}
              </h4>
              <div className="space-y-2">
                {groupedItems[dateKey]
                  .sort(
                    (a, b) =>
                      new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
                  )
                  .map((item) => {
                    const status = STATUS_CONFIG[item.status];
                    const isExpanded = expandedItems.has(item.id);
                    const isProcessing = processing.has(item.id);
                    const itemDate = parseISO(item.scheduled_for);
                    const isOverdue = isPast(itemDate) && !isToday(itemDate) && item.status !== "posted";

                    return (
                      <div
                        key={item.id}
                        className={`bg-zinc-950 border rounded-xl overflow-hidden transition-colors ${
                          isOverdue ? "border-rose-500/30" : "border-zinc-800"
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Status Icon */}
                            <div className={`mt-0.5 ${status.color}`}>{status.icon}</div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-zinc-300">
                                  {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${status.bgColor} ${status.color}`}
                                >
                                  {status.label}
                                </span>
                                {isOverdue && (
                                  <span className="text-xs text-rose-500">Overdue</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {format(itemDate, "h:mm a")}
                                  {isToday(itemDate) && (
                                    <span className="text-zinc-400 ml-1">(today)</span>
                                  )}
                                </span>
                              </div>

                              {/* Preview */}
                              <div className="mt-2">
                                <p
                                  className={`text-sm text-zinc-400 ${
                                    isExpanded ? "" : "line-clamp-2"
                                  }`}
                                >
                                  {item.content}
                                </p>
                                {item.content.length > 150 && (
                                  <button
                                    onClick={() => toggleExpanded(item.id)}
                                    className="text-xs text-zinc-500 hover:text-zinc-400 mt-1 flex items-center gap-1"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-3 h-3" /> Show less
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3" /> Show more
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              {item.status === "draft" && (
                                <>
                                  <button
                                    onClick={() => onEdit?.(item)}
                                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    disabled={isProcessing}
                                    className="p-2 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {item.status === "pending_approval" && (
                                <>
                                  <button
                                    onClick={() => handleApprove(item.id)}
                                    disabled={isProcessing}
                                    className="p-2 hover:bg-emerald-500/10 rounded-lg text-zinc-500 hover:text-emerald-500 transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(item.id)}
                                    disabled={isProcessing}
                                    className="p-2 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {item.status === "approved" && (
                                <span className="text-xs text-emerald-500 px-2 py-1">
                                  Ready to post
                                </span>
                              )}

                              {item.status === "posted" && item.posted_at && (
                                <span className="text-xs text-zinc-500">
                                  Posted {format(parseISO(item.posted_at), "MMM d, h:mm a")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
