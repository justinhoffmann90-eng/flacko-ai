"use client";

import { useState } from "react";
import { format } from "date-fns";

type ContentType = "daily-mode-card" | "hiro-recap" | "forecast-vs-actual" | "weekly-scorecard";

interface GeneratedContent {
  type: ContentType;
  date: string;
  text?: string;
  html?: string;
  imageUrl?: string;
  data?: Record<string, unknown>;
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
        html: data.html,
        imageUrl: data.imageUrl,
        data: data.data,
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

  const handleCopyHtml = () => {
    if (content?.html) {
      navigator.clipboard.writeText(content.html);
      alert("HTML copied to clipboard!");
    }
  };

  const handleOpenPreview = () => {
    if (content?.html) {
      const blob = new Blob([content.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
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
                {content.html && (
                  <>
                    <button
                      onClick={handleOpenPreview}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                    >
                      Open in New Tab
                    </button>
                    <button
                      onClick={handleCopyHtml}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm"
                    >
                      Copy HTML
                    </button>
                  </>
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
              <div className="text-gray-400 flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Generating content...
              </div>
            )}

            {content.status === "error" && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <div className="text-red-400 font-medium">Error</div>
                <div className="text-red-300 text-sm mt-1">{content.error}</div>
              </div>
            )}

            {content.status === "ready" && (
              <div className="space-y-4">
                {/* Data Summary */}
                {content.data && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">Extracted Data</div>
                    {content.data.dateUsed && content.data.dateUsed !== content.date && (
                      <div className="mb-3 px-3 py-2 bg-yellow-900/30 border border-yellow-700 rounded text-yellow-300 text-sm">
                        ℹ️ Using report from {String(content.data.dateUsed)} (requested date not found)
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {content.data.mode && (
                        <div>
                          <span className="text-gray-500">Mode:</span>{" "}
                          <span className="font-medium">{String(content.data.mode)}</span>
                        </div>
                      )}
                      {content.data.dailyCap && (
                        <div>
                          <span className="text-gray-500">Daily Cap:</span>{" "}
                          <span className="font-medium">{String(content.data.dailyCap)}%</span>
                        </div>
                      )}
                      {content.data.levels && (
                        <div>
                          <span className="text-gray-500">Levels:</span>{" "}
                          <span className="font-medium">{(content.data.levels as unknown[]).length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* HTML Preview */}
                {content.html && (
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-800 px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
                      HTML Preview (click "Open in New Tab" for full view)
                    </div>
                    <iframe
                      srcDoc={content.html}
                      className="w-full h-[500px] bg-gray-950"
                      title="Content Preview"
                    />
                  </div>
                )}

                {/* Image Preview */}
                {content.imageUrl && (
                  <div>
                    <img
                      src={content.imageUrl}
                      alt="Generated content"
                      className="max-w-full rounded-lg border border-gray-700"
                    />
                  </div>
                )}

                {/* Text Preview */}
                {content.text && !content.html && (
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
