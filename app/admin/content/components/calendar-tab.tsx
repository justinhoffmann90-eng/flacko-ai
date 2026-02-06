"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTENT_TYPE_KEYS } from "@/lib/content/prompts";

interface ScheduleSlot {
  time: string;
  daySlots: Record<string, string>; // day -> content type key
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_TIMES = ["7:00a", "9:30a", "12:00p", "2:00p", "4:00p"];

const STORAGE_KEY = "content-hub-weekly-schedule";

export function CalendarTab() {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [saved, setSaved] = useState(false);

  // Initialize schedule from localStorage or defaults
  useEffect(() => {
    const savedSchedule = localStorage.getItem(STORAGE_KEY);
    
    if (savedSchedule) {
      try {
        const parsed = JSON.parse(savedSchedule);
        setSchedule(parsed);
      } catch {
        initializeDefaultSchedule();
      }
    } else {
      initializeDefaultSchedule();
    }
  }, []);

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
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const contentOptions = [{ key: "", label: "(none)" }, ...CONTENT_TYPE_KEYS];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Weekly Schedule</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Plan what content types to post and when (template repeats weekly)
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save Weekly Schedule"}
        </Button>
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
                    className="px-2 py-3 text-center text-sm font-medium text-zinc-400 min-w-[100px]"
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
                      <Select
                        value={slot.daySlots[day] || ""}
                        onValueChange={(value) =>
                          handleSlotChange(timeIndex, day, value)
                        }
                      >
                        <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs h-8">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {contentOptions.map((option) => (
                            <SelectItem
                              key={option.key}
                              value={option.key}
                              className="text-xs"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-zinc-950/30 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Content Types</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
          {CONTENT_TYPE_KEYS.map((type) => (
            <div key={type.key} className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="text-sm text-zinc-600">
        <p>
          This schedule is saved to your browser&apos;s local storage and persists
          across sessions. It&apos;s a weekly template that applies to every week.
        </p>
      </div>
    </div>
  );
}
