"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Filter, CheckCircle, XCircle, Clock, FileText, MessageSquare, Bell, Twitter, Calendar, Edit3, Search, AlertTriangle } from "lucide-react";

const actionTypeIcons: Record<string, React.ReactNode> = {
  report_generated: <FileText className="w-4 h-4" />,
  report_uploaded: <FileText className="w-4 h-4" />,
  discord_posted: <MessageSquare className="w-4 h-4" />,
  alert_sent: <Bell className="w-4 h-4" />,
  tweet_posted: <Twitter className="w-4 h-4" />,
  cron_executed: <Calendar className="w-4 h-4" />,
  file_created: <FileText className="w-4 h-4" />,
  file_modified: <Edit3 className="w-4 h-4" />,
  search_performed: <Search className="w-4 h-4" />,
  error_occurred: <AlertTriangle className="w-4 h-4" />,
};

const actionTypeLabels: Record<string, string> = {
  report_generated: "Report generated",
  report_uploaded: "Report uploaded",
  discord_posted: "Discord post",
  alert_sent: "Alert sent",
  tweet_posted: "Tweet posted",
  cron_executed: "Cron executed",
  file_created: "File created",
  file_modified: "File modified",
  search_performed: "Search performed",
  error_occurred: "Error occurred",
};

const statusIcons: Record<string, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-green-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  pending: <Clock className="w-4 h-4 text-yellow-400" />,
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    hour12: true,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface Activity {
  _id: string;
  timestamp: number;
  action_type: string;
  description: string;
  status: string;
  metadata?: any;
  session_id?: string;
  duration_ms?: number;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/activity/log");
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchActivities();
  };

  const filterOptions = Object.keys(actionTypeLabels);

  const filteredActivities = filter
    ? activities.filter((a) => a.action_type === filter)
    : activities;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-white">📋 Activity Feed</div>
          {filter && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
              {actionTypeLabels[filter]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-10">
                <button
                  onClick={() => { setFilter(null); setShowFilterMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 first:rounded-t-lg"
                >
                  All activities
                </button>
                {filterOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => { setFilter(option); setShowFilterMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    {actionTypeIcons[option]}
                    {actionTypeLabels[option]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-white/5">
        {loading && activities.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading activities...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-lg font-medium text-white mb-1">No activities yet</div>
            <div className="text-sm">Activities will appear here as you use the system</div>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity._id}
              className="flex items-start gap-4 p-4 hover:bg-white/5 transition-colors"
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                activity.status === "success" ? "bg-green-500/10 text-green-400" :
                activity.status === "failed" ? "bg-red-500/10 text-red-400" :
                "bg-yellow-500/10 text-yellow-400"
              }`}>
                {actionTypeIcons[activity.action_type] || <FileText className="w-4 h-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {actionTypeLabels[activity.action_type] || activity.action_type}
                    </div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {activity.description}
                    </div>
                    {activity.metadata && (
                      <div className="text-xs text-gray-500 mt-1">
                        {typeof activity.metadata === "object" && activity.metadata.filePath && (
                          <span className="font-mono">{activity.metadata.filePath}</span>
                        )}
                        {typeof activity.metadata === "object" && activity.metadata.url && (
                          <a 
                            href={activity.metadata.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {activity.metadata.url}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statusIcons[activity.status]}
                    <span className={`text-xs capitalize ${
                      activity.status === "success" ? "text-green-400" :
                      activity.status === "failed" ? "text-red-400" :
                      "text-yellow-400"
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {formatRelativeTime(activity.timestamp)}
                  {activity.duration_ms && (
                    <span className="ml-2">({activity.duration_ms}ms)</span>
                  )}
                  {activity.session_id && (
                    <span className="ml-2 font-mono">[{activity.session_id.slice(0, 8)}]</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
