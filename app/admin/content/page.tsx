"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

type ContentType = "daily-mode-card" | "hiro-recap" | "forecast-vs-actual" | "weekly-scorecard";

interface GeneratedContent {
  type: ContentType;
  date: string;
  text?: string;
  imageUrl?: string;
  status: "generating" | "ready" | "error";
  error?: string;
}

export default function ContentManagementPage() {
  const [selectedType, setSelectedType] = useState<ContentType>("daily-mode-card");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);

  const contentTypes = [
    { id: "daily-mode-card", name: "Daily Mode Card", icon: "🎯" },
    { id: "hiro-recap", name: "HIRO EOD Recap", icon: "📊" },
    { id: "forecast-vs-actual", name: "Forecast vs Actual", icon: "🎯" },
    { id: "weekly-scorecard", name: "Weekly Scorecard", icon: "📈" },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setContent({ type: selectedType, date: selectedDate, status: "generating" });

    try {
      const response = await fetch(`/api/content/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType, date: selectedDate }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setContent({
        type: selectedType,
        date: selectedDate,
        text: data.text,
        imageUrl: data.imageUrl,
        status: "ready",
      });
    } catch (error) {
      setContent({
        type: selectedType,
        date: selectedDate,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (content?.text) {
      navigator.clipboard.writeText(content.text);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Content Management</h1>

        {/* Type Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {contentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id as ContentType)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedType === type.id
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-gray-700 hover:border-gray-600"
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="text-sm font-medium">{type.name}</div>
            </button>
          ))}
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors mb-8"
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        {/* Preview Area */}
        {content && (
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Preview</h2>
              <div className="flex gap-2">
                {content.text && (
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                  >
                    Copy Text
                  </button>
                )}
                {content.imageUrl && (
                  <a
                    href={content.imageUrl}
                    download
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
                  >
                    Download Image
                  </a>
                )}
              </div>
            </div>

            {content.status === "generating" && (
              <div className="text-gray-400">Generating content...</div>
            )}

            {content.status === "error" && (
              <div className="text-red-400">Error: {content.error}</div>
            )}

            {content.status === "ready" && (
              <div className="space-y-4">
                {content.imageUrl && (
                  <div>
                    <img
                      src={content.imageUrl}
                      alt="Generated content"
                      className="max-w-full rounded-lg border border-gray-700"
                    />
                  </div>
                )}
                {content.text && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{content.text}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
