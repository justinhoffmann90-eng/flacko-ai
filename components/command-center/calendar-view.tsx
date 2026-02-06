"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";

const categoryColors: Record<string, string> = {
  content: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  alerts: "bg-red-500/20 text-red-400 border-red-500/30",
  maintenance: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  default: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  active: <CheckCircle className="w-3 h-3" />,
  success: <CheckCircle className="w-3 h-3" />,
  paused: <Clock className="w-3 h-3" />,
  error: <XCircle className="w-3 h-3" />,
  pending: <AlertCircle className="w-3 h-3" />,
};

interface Job {
  _id: string;
  name: string;
  schedule: string;
  agent: string;
  status: string;
  days?: string[];
  time?: string;
  category?: string;
  enabled: boolean;
  last_run?: number;
  next_run?: number;
}

// Demo jobs for the calendar view
const demoJobs: Job[] = [
  {
    _id: "1",
    name: "Morning Brief",
    schedule: "8:00 AM Weekdays",
    agent: "Clawdbot",
    status: "active",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    time: "08:00",
    category: "content",
    enabled: true,
  },
  {
    _id: "2",
    name: "HIRO Check",
    schedule: "Every 30m Market Hours",
    agent: "Monitor",
    status: "active",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    time: "09:30",
    category: "alerts",
    enabled: true,
  },
  {
    _id: "3",
    name: "Daily Report",
    schedule: "4:00 PM Daily",
    agent: "Analyst",
    status: "active",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    time: "16:00",
    category: "content",
    enabled: true,
  },
  {
    _id: "4",
    name: "EOD Wrap",
    schedule: "5:00 PM Weekdays",
    agent: "Publisher",
    status: "active",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    time: "17:00",
    category: "content",
    enabled: true,
  },
  {
    _id: "5",
    name: "Trading Capture",
    schedule: "4:30 PM Daily",
    agent: "Monitor",
    status: "active",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    time: "16:30",
    category: "maintenance",
    enabled: true,
  },
  {
    _id: "6",
    name: "Weekly Review",
    schedule: "Friday 6:00 PM",
    agent: "Analyst",
    status: "active",
    days: ["Fri"],
    time: "18:00",
    category: "content",
    enabled: true,
  },
  {
    _id: "7",
    name: "Catalyst Sync",
    schedule: "Sunday 8:00 PM",
    agent: "Analyst",
    status: "active",
    days: ["Sun"],
    time: "20:00",
    category: "maintenance",
    enabled: true,
  },
];

export function CalendarView() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Using demo jobs for now - will be replaced with Convex query
  const jobs = demoJobs;

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

  const getJobsForDayAndHour = (day: Date, hour: number) => {
    const dayName = format(day, "EEE"); // Mon, Tue, etc.
    
    return jobs.filter((job: Job) => {
      if (!job.enabled) return false;
      
      // Check if job runs on this day
      const runsOnDay = !job.days || job.days.includes(dayName);
      if (!runsOnDay) return false;
      
      // Check if job runs at this hour
      if (job.time) {
        const [jobHour] = job.time.split(":").map(Number);
        return jobHour === hour;
      }
      
      return false;
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeek(prev => 
      direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-white">📅 Schedule</div>
          <div className="text-sm text-gray-400">
            Week of {format(weekStart, "MMM d, yyyy")}
          </div>
          <span className="text-xs text-gray-500">(Demo data - Convex setup required)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek("prev")}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek("next")}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-white/10">
            <div className="p-3 text-sm text-gray-500 font-medium">Time</div>
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div 
                  key={i} 
                  className={`p-3 text-center ${isToday ? "bg-white/5" : ""}`}
                >
                  <div className={`text-sm font-medium ${isToday ? "text-blue-400" : "text-gray-300"}`}>
                    {format(day, "EEE")}
                  </div>
                  <div className={`text-xs ${isToday ? "text-blue-400" : "text-gray-500"}`}>
                    {format(day, "MMM d")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          <div className="divide-y divide-white/5">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8">
                <div className="p-2 text-xs text-gray-500 font-mono border-r border-white/5">
                  {format(new Date().setHours(hour, 0), "h a")}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayJobs = getJobsForDayAndHour(day, hour);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={dayIndex} 
                      className={`p-1 min-h-[60px] border-r border-white/5 ${
                        isToday ? "bg-white/5" : ""
                      }`}
                    >
                      <div className="space-y-1">
                        {dayJobs.map((job: Job) => (
                          <button
                            key={job._id}
                            onClick={() => setSelectedJob(job)}
                            className={`w-full text-left px-2 py-1 rounded text-xs border ${
                              categoryColors[job.category || "default"]
                            } hover:opacity-80 transition-opacity`}
                          >
                            <div className="flex items-center gap-1">
                              {statusIcons[job.status] || statusIcons.pending}
                              <span className="truncate">{job.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t border-white/10 text-xs">
        <span className="text-gray-500">Categories:</span>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded border bg-blue-500/20 text-blue-400 border-blue-500/30">
            Content
          </span>
          <span className="px-2 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500/30">
            Alerts
          </span>
          <span className="px-2 py-0.5 rounded border bg-purple-500/20 text-purple-400 border-purple-500/30">
            Maintenance
          </span>
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div 
            className="bg-gray-800 border border-white/10 rounded-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedJob.name}</h3>
                <div className="text-sm text-gray-400">{selectedJob.agent}</div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Schedule:</span>
                <span className="text-gray-300">{selectedJob.schedule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`capitalize ${
                  selectedJob.status === "active" ? "text-green-400" :
                  selectedJob.status === "error" ? "text-red-400" :
                  "text-yellow-400"
                }`}>{selectedJob.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="text-gray-300 capitalize">{selectedJob.category || "—"}</span>
              </div>
              {selectedJob.days && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Days:</span>
                  <span className="text-gray-300">{selectedJob.days.join(", ")}</span>
                </div>
              )}
              {selectedJob.time && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Time:</span>
                  <span className="text-gray-300">{selectedJob.time}</span>
                </div>
              )}
              {selectedJob.last_run && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Run:</span>
                  <span className="text-gray-300">
                    {format(selectedJob.last_run, "MMM d, h:mm a")}
                  </span>
                </div>
              )}
              {selectedJob.next_run && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Next Run:</span>
                  <span className="text-gray-300">
                    {format(selectedJob.next_run, "MMM d, h:mm a")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
