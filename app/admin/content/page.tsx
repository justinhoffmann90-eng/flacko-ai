"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Wand2, Calendar, Image } from "lucide-react";
import { GeneratorsTab } from "./components/generators-tab";
import { CalendarTab } from "./components/calendar-tab";
import { ImageCardsTab } from "./components/image-cards-tab";

const TABS = [
  { id: "generators", label: "Generators", icon: Wand2 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "image-cards", label: "Image Cards", icon: Image },
];

export default function ContentHubPage() {
  const [activeTab, setActiveTab] = useState("generators");

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
              Generate trading content and plan your weekly schedule
            </p>
          </div>
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
          {activeTab === "generators" && (
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6">
              <GeneratorsTab />
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6">
              <CalendarTab />
            </div>
          )}

          {activeTab === "image-cards" && (
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6">
              <ImageCardsTab />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
