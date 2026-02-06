"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Edit3, ListTodo, Layers, Plus } from "lucide-react";
import { ContentCalendar } from "@/components/content-hub/content-calendar";
import { ContentGenerator } from "@/components/content-hub/content-generator";
import { PromptEditor } from "@/components/content-hub/prompt-editor";
import { BatchPlanner } from "@/components/content-hub/batch-planner";
import { ContentQueue } from "@/components/content-hub/content-queue";

interface ScheduledItem {
  id: string;
  content_type: string;
  content: string;
  scheduled_for: string;
  status: "draft" | "pending_approval" | "approved" | "posted" | "rejected";
  metadata?: Record<string, unknown>;
}

const TABS = [
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "queue", label: "Queue", icon: ListTodo },
  { id: "prompts", label: "Prompts", icon: Edit3 },
  { id: "batch", label: "Plan Week", icon: Layers },
];

const PROMPT_TYPES = [
  { key: "tweet_premarket", label: "Pre-market Tweet" },
  { key: "tweet_market_hours", label: "Market Hours Tweet" },
  { key: "tweet_afterhours", label: "After-hours Tweet" },
  { key: "morning_brief", label: "Morning Brief" },
  { key: "hiro_alert", label: "HIRO Alert" },
  { key: "eod_intelligence", label: "EOD Intelligence" },
  { key: "daily_assessment", label: "Daily Assessment" },
  { key: "mode_card", label: "Mode Card" },
  { key: "levels_card", label: "Levels Card" },
  { key: "weekly_scorecard", label: "Weekly Scorecard" },
];

export default function ContentHubPage() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatorConfig, setGeneratorConfig] = useState<{
    contentType: string;
    scheduledFor: Date;
    existingContent: ScheduledItem | null;
  } | null>(null);
  const [selectedPromptType, setSelectedPromptType] = useState(PROMPT_TYPES[0].key);

  // Handle calendar slot click
  const handleSlotClick = (date: Date, hour: number, contentType: string) => {
    const scheduledFor = new Date(date);
    scheduledFor.setHours(hour, 0, 0, 0);

    setGeneratorConfig({
      contentType,
      scheduledFor,
      existingContent: null,
    });
    setGeneratorOpen(true);
  };

  // Handle existing item click
  const handleItemClick = (item: ScheduledItem) => {
    setGeneratorConfig({
      contentType: item.content_type,
      scheduledFor: parseISO(item.scheduled_for),
      existingContent: item,
    });
    setGeneratorOpen(true);
  };

  // Handle queue item edit
  const handleQueueEdit = (item: ScheduledItem) => {
    setGeneratorConfig({
      contentType: item.content_type,
      scheduledFor: parseISO(item.scheduled_for),
      existingContent: item,
    });
    setGeneratorOpen(true);
    setActiveTab("calendar");
  };

  // Handle successful save
  const handleSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Handle batch planner complete
  const handleBatchComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab("queue");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a
              href="/admin/command-center"
              className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-white mb-2 transition-colors"
            >
              ← Command Center
            </a>
            <h1 className="text-2xl sm:text-3xl font-bold">Content Hub</h1>
            <p className="text-zinc-500 mt-1">
              Schedule, generate, and manage trading content
            </p>
          </div>
          <button
            onClick={() => setActiveTab("batch")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Plan Week
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-800">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-purple-500 text-white"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {/* Calendar Tab */}
          {activeTab === "calendar" && (
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6">
              <ContentCalendar
                onSlotClick={handleSlotClick}
                onItemClick={handleItemClick}
                refreshTrigger={refreshTrigger}
              />
            </div>
          )}

          {/* Queue Tab */}
          {activeTab === "queue" && (
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Content Queue</h2>
                <p className="text-sm text-zinc-500">
                  Review and approve content before posting
                </p>
              </div>
              <ContentQueue
                refreshTrigger={refreshTrigger}
                onEdit={handleQueueEdit}
              />
            </div>
          )}

          {/* Prompts Tab */}
          {activeTab === "prompts" && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Prompt Type Selection */}
              <div className="lg:col-span-1">
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 sticky top-4">
                  <h3 className="font-semibold mb-4">Prompt Types</h3>
                  <div className="space-y-1">
                    {PROMPT_TYPES.map((type) => (
                      <button
                        key={type.key}
                        onClick={() => setSelectedPromptType(type.key)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedPromptType === type.key
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prompt Editor */}
              <div className="lg:col-span-2">
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6">
                  <PromptEditor
                    contentType={selectedPromptType}
                    onSaved={handleSaved}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Batch Planner Tab */}
          {activeTab === "batch" && (
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Plan Week</h2>
                <p className="text-sm text-zinc-500">
                  Generate and schedule a week of content at once
                </p>
              </div>
              <BatchPlanner onComplete={handleBatchComplete} />
            </div>
          )}
        </div>
      </div>

      {/* Content Generator Modal */}
      {generatorConfig && (
        <ContentGenerator
          isOpen={generatorOpen}
          onClose={() => {
            setGeneratorOpen(false);
            setGeneratorConfig(null);
          }}
          contentType={generatorConfig.contentType}
          scheduledFor={generatorConfig.scheduledFor}
          existingContent={generatorConfig.existingContent}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
