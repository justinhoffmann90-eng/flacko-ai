"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isWeekend,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Play, CheckCircle2, XCircle, Clock, Calendar, Wand2, Save } from "lucide-react";

interface BatchItem {
  id: string;
  content_type: string;
  scheduled_for: string;
  content: string;
  status: "pending" | "generating" | "completed" | "error";
  error?: string;
}

interface BatchPlannerProps {
  onComplete?: () => void;
}

const CONTENT_OPTIONS = [
  { key: "tweets", label: "Tweets", count: 9, types: ["tweet_premarket", "tweet_market_hours", "tweet_afterhours"] },
  { key: "morning_briefs", label: "Morning Briefs", count: 5, types: ["morning_brief"] },
  { key: "hiro_alerts", label: "HIRO Alerts", count: 15, types: ["hiro_alert"] },
  { key: "eod_wraps", label: "EOD Wraps", count: 5, types: ["eod_intelligence"] },
  { key: "assessments", label: "Daily Assessments", count: 5, types: ["daily_assessment"] },
];

const CONTENT_TYPE_LABELS: Record<string, string> = {
  tweet_premarket: "Pre-market Tweet",
  tweet_market_hours: "Market Hours Tweet",
  tweet_afterhours: "After-hours Tweet",
  morning_brief: "Morning Brief",
  hiro_alert: "HIRO Alert",
  eod_intelligence: "EOD Wrap",
  daily_assessment: "Daily Assessment",
};

const HOUR_SLOTS: Record<string, number[]> = {
  tweet_premarket: [7],
  tweet_market_hours: [9, 11, 13, 15, 17],
  tweet_afterhours: [19, 21, 23],
  morning_brief: [8],
  hiro_alert: [9, 11, 13],
  eod_intelligence: [19],
  daily_assessment: [17],
};

export function BatchPlanner({ onComplete }: BatchPlannerProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({
    tweets: true,
    morning_briefs: true,
    hiro_alerts: true,
    eod_wraps: false,
    assessments: false,
  });
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<BatchItem[]>([]);
  const [approvedItems, setApprovedItems] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeek, end }).filter((d) => !isWeekend(d));
  }, [currentWeek]);

  const weekLabel = useMemo(() => {
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return `${format(currentWeek, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }, [currentWeek]);

  const totalSlots = useMemo(() => {
    return Object.entries(selectedOptions)
      .filter(([, selected]) => selected)
      .reduce((total, [key]) => {
        const option = CONTENT_OPTIONS.find((o) => o.key === key);
        return total + (option?.count || 0) * 5; // 5 weekdays
      }, 0);
  }, [selectedOptions]);

  const progress = useMemo(() => {
    if (generatedItems.length === 0) return 0;
    const completed = generatedItems.filter((i) => i.status === "completed").length;
    return Math.round((completed / generatedItems.length) * 100);
  }, [generatedItems]);

  const handleToggleOption = (key: string) => {
    setSelectedOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedItems([]);
    setApprovedItems(new Set());

    // Build list of items to generate
    const itemsToGenerate: Omit<BatchItem, "content" | "status" | "error">[] = [];

    for (const day of weekDays) {
      for (const [optionKey, selected] of Object.entries(selectedOptions)) {
        if (!selected) continue;

        const option = CONTENT_OPTIONS.find((o) => o.key === optionKey);
        if (!option) continue;

        for (const contentType of option.types) {
          const hours = HOUR_SLOTS[contentType] || [9];
          for (const hour of hours) {
            const scheduledFor = new Date(day);
            scheduledFor.setHours(hour, 0, 0, 0);

            itemsToGenerate.push({
              id: `${contentType}-${scheduledFor.toISOString()}`,
              content_type: contentType,
              scheduled_for: scheduledFor.toISOString(),
            });
          }
        }
      }
    }

    // Initialize items
    setGeneratedItems(
      itemsToGenerate.map((item) => ({
        ...item,
        content: "",
        status: "pending",
      }))
    );

    // Generate items one by one
    for (let i = 0; i < itemsToGenerate.length; i++) {
      const item = itemsToGenerate[i];

      setGeneratedItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: "generating" } : p))
      );

      try {
        const response = await fetch("/api/content/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: item.content_type,
            context: context || undefined,
          }),
        });

        if (!response.ok) throw new Error("Generation failed");

        const data = await response.json();

        setGeneratedItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, content: data.content, status: "completed" }
              : p
          )
        );
      } catch (err) {
        setGeneratedItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: "error", error: err instanceof Error ? err.message : "Failed" }
              : p
          )
        );
      }
    }

    setIsGenerating(false);
  };

  const handleApprove = (id: string) => {
    setApprovedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApproveAll = () => {
    const completedIds = generatedItems
      .filter((i) => i.status === "completed")
      .map((i) => i.id);
    setApprovedItems(new Set(completedIds));
  };

  const handleSaveApproved = async () => {
    setIsSaving(true);
    setError(null);

    const itemsToSave = generatedItems.filter((i) => approvedItems.has(i.id));

    try {
      for (const item of itemsToSave) {
        await fetch("/api/content/scheduled", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_type: item.content_type,
            content: item.content,
            scheduled_for: item.scheduled_for,
            status: "pending_approval",
          }),
        });
      }

      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async (id: string) => {
    const item = generatedItems.find((i) => i.id === id);
    if (!item) return;

    setGeneratedItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "generating", error: undefined } : p))
    );

    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: item.content_type,
          context: context || undefined,
          regenerate: true,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();

      setGeneratedItems((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, content: data.content, status: "completed" } : p
        )
      );
    } catch (err) {
      setGeneratedItems((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: "error", error: err instanceof Error ? err.message : "Failed" }
            : p
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Week Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            disabled={isGenerating}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span className="font-medium">{weekLabel}</span>
          </div>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            disabled={isGenerating}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Type Selection */}
      <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">Content to Generate</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CONTENT_OPTIONS.map((option) => (
            <label
              key={option.key}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedOptions[option.key]
                  ? "bg-purple-500/10 border-purple-500/30"
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedOptions[option.key]}
                onChange={() => handleToggleOption(option.key)}
                disabled={isGenerating}
                className="w-4 h-4 rounded border-zinc-600 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-zinc-500">{option.count * 5} items</div>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-3 text-sm text-zinc-500">
          Total slots to fill: <span className="text-zinc-300 font-medium">{totalSlots}</span>
        </div>
      </div>

      {/* Context Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-400">
          Context for All Content (optional)
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g., TSLA closed at $342, major gamma level at $345, earnings next week..."
          rows={2}
          disabled={isGenerating}
          className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-sm disabled:opacity-50"
        />
      </div>

      {/* Generate Button */}
      {!generatedItems.length && (
        <button
          onClick={handleGenerate}
          disabled={isGenerating || totalSlots === 0}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate Week Content
            </>
          )}
        </button>
      )}

      {/* Progress */}
      {generatedItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Generation Progress</span>
            <span className="text-zinc-300">{progress}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Generated Items Queue */}
      {generatedItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-zinc-400">Review Queue</h4>
            <button
              onClick={handleApproveAll}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              Approve All Completed
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {generatedItems.map((item) => {
              const itemDate = parseISO(item.scheduled_for);
              const isApproved = approvedItems.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isApproved
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-zinc-950 border-zinc-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isApproved
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-zinc-600 hover:border-zinc-500"
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-zinc-500">
                          {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {format(itemDate, "EEE, MMM d h:mm a")}
                        </span>
                        {item.status === "generating" && (
                          <span className="text-xs text-amber-500 flex items-center gap-1">
                            <div className="animate-spin w-2 h-2 border border-amber-500 border-t-transparent rounded-full" />
                            Generating...
                          </span>
                        )}
                        {item.status === "error" && (
                          <span className="text-xs text-red-500 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Error
                          </span>
                        )}
                      </div>

                      {item.status === "completed" && (
                        <p className="text-sm text-zinc-300 line-clamp-2">{item.content}</p>
                      )}
                      {item.status === "error" && (
                        <p className="text-xs text-red-400">{item.error}</p>
                      )}
                    </div>

                    {item.status === "completed" && (
                      <button
                        onClick={() => handleRegenerate(item.id)}
                        className="text-xs text-zinc-500 hover:text-white px-2 py-1 rounded hover:bg-zinc-800"
                      >
                        Regenerate
                      </button>
                    )}
                    {item.status === "error" && (
                      <button
                        onClick={() => handleRegenerate(item.id)}
                        className="text-xs text-amber-500 hover:text-amber-400 px-2 py-1 rounded hover:bg-amber-500/10"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Actions */}
          {approvedItems.size > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <span className="text-sm text-zinc-500">
                {approvedItems.size} of {generatedItems.filter((i) => i.status === "completed").length} approved
              </span>
              <button
                onClick={handleSaveApproved}
                disabled={isSaving}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Schedule {approvedItems.size} Items
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
