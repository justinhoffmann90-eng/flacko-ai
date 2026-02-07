"use client";

import { useState, useEffect, useRef } from "react";
import { Cloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface ScheduleSlot {
  time: string;
  daySlots: Record<string, string>; // day -> content type text
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_TIMES = ["7:00a", "9:30a", "12:00p", "2:00p", "4:00p"];

const STORAGE_KEY = "content-hub-weekly-schedule";

const supabase = createClient();

export function CalendarTab() {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [userId, setUserId] = useState<string | null>(null);
  const lastSave = useRef<number>(0);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  // Load from cloud first, then localStorage fallback
  useEffect(() => {
    if (!userId) return;
    
    const loadData = async () => {
      try {
        // Try cloud first
        const { data: cloudData, error } = await supabase
          .from("content_hub_data")
          .select("weekly_schedule")
          .eq("user_id", userId)
          .single();
        
        if (!error && cloudData?.weekly_schedule && Object.keys(cloudData.weekly_schedule).length > 0) {
          console.log("[CalendarTab] Loaded from cloud");
          const parsed = parseScheduleFromObject(cloudData.weekly_schedule);
          setSchedule(parsed);
          setSyncStatus("synced");
          return;
        }
        
        // Fallback to localStorage
        const savedSchedule = localStorage.getItem(STORAGE_KEY);
        if (savedSchedule) {
          try {
            const parsed = JSON.parse(savedSchedule);
            setSchedule(parsed);
            // Sync to cloud in background
            saveToCloud(parsed, false);
          } catch {
            initializeDefaultSchedule();
          }
        } else {
          initializeDefaultSchedule();
        }
      } catch (err) {
        console.error("[CalendarTab] Load error:", err);
        initializeDefaultSchedule();
      }
    };
    
    loadData();
  }, [userId]);

  // Auto-save to cloud when schedule changes (debounced)
  useEffect(() => {
    if (!userId || schedule.length === 0) return;
    
    const timeout = setTimeout(() => {
      saveToCloud(schedule, true);
    }, 800);
    
    return () => clearTimeout(timeout);
  }, [schedule, userId]);

  const saveToCloud = async (scheduleData: ScheduleSlot[], showStatus = true) => {
    if (!userId) return;
    
    const now = Date.now();
    if (now - lastSave.current < 1000) return; // Rate limit
    lastSave.current = now;
    
    if (showStatus) setSyncStatus("syncing");
    
    try {
      const scheduleObject = scheduleToObject(scheduleData);
      const { error } = await supabase
        .from("content_hub_data")
        .upsert({
          user_id: userId,
          weekly_schedule: scheduleObject,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      
      if (error) {
        console.error("[CalendarTab] Save error:", error);
        setSyncStatus("error");
      } else {
        setSyncStatus("synced");
        // Also update localStorage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scheduleData));
      }
    } catch (err) {
      console.error("[CalendarTab] Save failed:", err);
      setSyncStatus("error");
    }
  };

  const initializeDefaultSchedule = () => {
    const defaultSchedule: ScheduleSlot[] = DEFAULT_TIMES.map((time) => ({
      time,
      daySlots: {
        Mon: "",
        Tue: "",
        Wed: "",
        Thu: "",
        Fri: "",
        Sat: "",
        Sun: "",
      },
    }));
    setSchedule(defaultSchedule);
  };

  // Convert schedule array to object for storage
  const scheduleToObject = (sched: ScheduleSlot[]): Record<string, Record<string, string>> => {
    const obj: Record<string, Record<string, string>> = {};
    sched.forEach((slot) => {
      obj[slot.time] = slot.daySlots;
    });
    return obj;
  };

  // Convert object back to schedule array
  const parseScheduleFromObject = (obj: Record<string, Record<string, string>>): ScheduleSlot[] => {
    return DEFAULT_TIMES.map((time) => ({
      time,
      daySlots: obj[time] || {
        Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "",
      },
    }));
  };

  const handleSlotChange = (timeIndex: number, day: string, value: string) => {
    setSchedule((prev) => {
      const updated = [...prev];
      updated[timeIndex] = {
        ...updated[timeIndex],
        daySlots: {
          ...updated[timeIndex].daySlots,
          [day]: value,
        },
      };
      return updated;
    });
    // Auto-save will trigger via useEffect
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Weekly Schedule</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Plan your content schedule — type freely in any field (auto-saves)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncStatus === "syncing" && (
            <span className="text-sm text-purple-400 flex items-center gap-1">
              <Cloud className="w-4 h-4" /> Saving...
            </span>
          )}
          {syncStatus === "synced" && (
            <span className="text-sm text-green-400 flex items-center gap-1">
              <Cloud className="w-4 h-4" /> Saved
            </span>
          )}
          {syncStatus === "error" && (
            <span className="text-sm text-red-400 flex items-center gap-1">
              <Cloud className="w-4 h-4" /> Save failed
            </span>
          )}
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 w-20">
                  Time
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="px-2 py-3 text-center text-sm font-medium text-zinc-400 min-w-[120px]"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((slot, timeIndex) => (
                <tr key={slot.time} className="border-b border-zinc-800 last:border-b-0">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-300">
                    {slot.time}
                  </td>
                  {DAYS.map((day) => (
                    <td key={day} className="px-2 py-2">
                      <Input
                        type="text"
                        value={slot.daySlots[day] || ""}
                        onChange={(e) => handleSlotChange(timeIndex, day, e.target.value)}
                        placeholder="Type here..."
                        className="w-full bg-zinc-900 border-zinc-800 text-xs h-8 text-zinc-300 placeholder:text-zinc-600"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="text-sm text-zinc-600">
        <p>
          Changes are automatically saved to the cloud. You can type any content 
          you want for each time slot — no restrictions.
        </p>
      </div>
    </div>
  );
}
