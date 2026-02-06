"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, AlertCircle, Circle } from "lucide-react";

interface ScheduledItem {
  id: string;
  content_type: string;
  content: string;
  scheduled_for: string;
  status: "draft" | "pending_approval" | "approved" | "posted" | "rejected";
  metadata?: Record<string, unknown>;
}

interface ContentCalendarProps {
  onSlotClick: (date: Date, hour: number, contentType: string) => void;
  onItemClick: (item: ScheduledItem) => void;
  refreshTrigger?: number;
}

const HOURS = [7, 9, 11, 13, 15, 17, 19, 21, 23];
const HOUR_LABELS: Record<number, string> = {
  7: "7am",
  9: "9am",
  11: "11am",
  13: "1pm",
  15: "3pm",
  17: "5pm",
  19: "7pm",
  21: "9pm",
  23: "11pm",
};

const CONTENT_TYPES: Record<string, { label: string; color: string; hours: number[] }> = {
  tweet: { label: "Tweet", color: "bg-blue-500", hours: [7, 9, 11, 13, 15, 17, 19, 21, 23] },
  morning_brief: { label: "Morning Brief", color: "bg-amber-500", hours: [8] },
  hiro_alert: { label: "HIRO Alert", color: "bg-purple-500", hours: [9, 11, 13] },
  eod_intelligence: { label: "EOD Wrap", color: "bg-emerald-500", hours: [19] },
  daily_assessment: { label: "Assessment", color: "bg-rose-500", hours: [17] },
  mode_card: { label: "Mode Card", color: "bg-cyan-500", hours: [7] },
  levels_card: { label: "Levels Card", color: "bg-indigo-500", hours: [7] },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <Circle className="w-3 h-3 text-zinc-500" />,
  pending_approval: <AlertCircle className="w-3 h-3 text-amber-500" />,
  approved: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
  posted: <CheckCircle2 className="w-3 h-3 text-blue-500" />,
  rejected: <AlertCircle className="w-3 h-3 text-rose-500" />,
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-800/50 border-zinc-700",
  pending_approval: "bg-amber-500/10 border-amber-500/30",
  approved: "bg-emerald-500/10 border-emerald-500/30",
  posted: "bg-blue-500/10 border-blue-500/30",
  rejected: "bg-rose-500/10 border-rose-500/30",
};

export function ContentCalendar({ onSlotClick, onItemClick, refreshTrigger }: ContentCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingItem, setDraggingItem] = useState<ScheduledItem | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ date: Date; hour: number } | null>(null);

  const weekDays = useMemo(() => {
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeek, end });
  }, [currentWeek]);

  const weekLabel = useMemo(() => {
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return `Week of ${format(currentWeek, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }, [currentWeek]);

  useEffect(() => {
    fetchScheduledContent();
  }, [currentWeek, refreshTrigger]);

  const fetchScheduledContent = async () => {
    setLoading(true);
    try {
      const start = format(currentWeek, "yyyy-MM-dd");
      const response = await fetch(`/api/content/scheduled?week=${start}`);
      if (response.ok) {
        const data = await response.json();
        setScheduledItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch scheduled content:", error);
    } finally {
      setLoading(false);
    }
  };

  const getItemsForSlot = (date: Date, hour: number) => {
    return scheduledItems.filter((item) => {
      const itemDate = parseISO(item.scheduled_for);
      const itemHour = itemDate.getHours();
      return isSameDay(itemDate, date) && itemHour === hour;
    });
  };

  const handlePrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleDragStart = (item: ScheduledItem) => {
    setDraggingItem(item);
  };

  const handleDragOver = (e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault();
    setDragOverSlot({ date, hour });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (!draggingItem) return;

    const newDateTime = new Date(date);
    newDateTime.setHours(hour, 0, 0, 0);

    try {
      const response = await fetch(`/api/content/scheduled/${draggingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_for: newDateTime.toISOString() }),
      });

      if (response.ok) {
        fetchScheduledContent();
      }
    } catch (error) {
      console.error("Failed to reschedule:", error);
    }

    setDraggingItem(null);
  };

  const getContentTypeForHour = (hour: number): string => {
    if (hour === 8) return "morning_brief";
    if (hour === 19) return "eod_intelligence";
    if (hour === 17) return "daily_assessment";
    if ([9, 11, 13].includes(hour)) return "hiro_alert";
    return "tweet";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold min-w-[200px] text-center">{weekLabel}</h3>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <Circle className="w-3 h-3" />
          <span>Draft</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-500" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Approved</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-blue-500" />
          <span>Posted</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="p-2 text-xs text-zinc-500 font-medium">Time</div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-2 text-center text-sm font-medium rounded-lg ${
                  isToday(day) ? "bg-zinc-800 text-white" : "text-zinc-400"
                }`}
              >
                <div>{format(day, "EEE")}</div>
                <div className={isToday(day) ? "text-zinc-300" : "text-zinc-600"}>
                  {format(day, "MMM d")}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
              <div className="p-2 text-xs text-zinc-600 font-medium flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {HOUR_LABELS[hour]}
              </div>
              {weekDays.map((day) => {
                const items = getItemsForSlot(day, hour);
                const isDragOver = dragOverSlot && 
                  isSameDay(dragOverSlot.date, day) && 
                  dragOverSlot.hour === hour;
                const contentType = getContentTypeForHour(hour);

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={`min-h-[80px] p-1 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 transition-all ${
                      isDragOver ? "bg-zinc-800/50 border-zinc-600" : ""
                    }`}
                    onDragOver={(e) => handleDragOver(e, day, hour)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day, hour)}
                  >
                    {items.length === 0 ? (
                      <button
                        onClick={() => onSlotClick(day, hour, contentType)}
                        className="w-full h-full min-h-[70px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Plus className="w-4 h-4 text-zinc-600" />
                      </button>
                    ) : (
                      <div className="space-y-1">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => handleDragStart(item)}
                            onClick={() => onItemClick(item)}
                            className={`p-1.5 rounded cursor-pointer text-xs border ${STATUS_COLORS[item.status]} hover:opacity-80 transition-opacity`}
                          >
                            <div className="flex items-center gap-1">
                              {STATUS_ICONS[item.status]}
                              <span className="truncate flex-1">
                                {CONTENT_TYPES[item.content_type]?.label || item.content_type}
                              </span>
                            </div>
                            <div className="truncate text-zinc-500 mt-0.5">
                              {item.content.slice(0, 30)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-zinc-500">
          <div className="animate-spin w-6 h-6 border-2 border-zinc-700 border-t-zinc-300 rounded-full mx-auto mb-2" />
          Loading scheduled content...
        </div>
      )}
    </div>
  );
}
