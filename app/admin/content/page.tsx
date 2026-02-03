"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface ContentHubData {
  date: string;
  mode: string;
  modeEmoji: string;
  modeCard: {
    status: "ready" | "pending" | "error";
    imageUrl: string;
    tweetText: string;
  };
  morningCard: {
    status: "ready" | "pending" | "error";
    imageUrl: string;
    tweetText: string;
    levels: {
      R1?: number;
      R2?: number;
      S1?: number;
      S2?: number;
    };
  };
  eodCard: {
    status: "ready" | "pending" | "generating" | "not_available";
    imageUrl: string | null;
    tweetText: string | null;
    accuracy: {
      total: number;
      hit: number;
      percentage: number;
      details: Array<{
        level: string;
        price: number;
        status: string;
        actual: number | null;
      }>;
    } | null;
  };
  tweetDrafts: Array<{
    id: string;
    text: string;
    status: string;
  }>;
}

export default function ContentHubPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<ContentHubData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMode, setCopiedMode] = useState(false);
  const [copiedMorning, setCopiedMorning] = useState(false);
  const [copiedEOD, setCopiedEOD] = useState(false);

  useEffect(() => {
    loadContent();
  }, [selectedDate]);

  const loadContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/content/hub?date=${selectedDate}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load content");
      }

      const contentData = await response.json();
      setData(contentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTweet = (text: string, type: "mode" | "morning" | "eod") => {
    navigator.clipboard.writeText(text);
    if (type === "mode") {
      setCopiedMode(true);
      setTimeout(() => setCopiedMode(false), 2000);
    } else if (type === "morning") {
      setCopiedMorning(true);
      setTimeout(() => setCopiedMorning(false), 2000);
    } else {
      setCopiedEOD(true);
      setTimeout(() => setCopiedEOD(false), 2000);
    }
  };

  const handleGenerateEOD = async () => {
    if (!data) return;

    setData({
      ...data,
      eodCard: {
        ...data.eodCard,
        status: "generating"
      }
    });

    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "eod-accuracy-card", date: selectedDate }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate EOD card");
      }

      // Reload content
      await loadContent();
    } catch (err) {
      console.error("EOD generation error:", err);
      if (data) {
        setData({
          ...data,
          eodCard: {
            ...data.eodCard,
            status: "error" as any
          }
        });
      }
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Loading content hub...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <div className="text-red-400 font-medium">Error</div>
            <div className="text-red-300 text-sm mt-1">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">📊 Daily Content Hub</h1>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-400">
                  {format(new Date(selectedDate), "EEEE, MMM d, yyyy")}
                </span>
                {data && (
                  <span className="text-gray-400">
                    Mode: {data.modeEmoji} <span className="font-bold">{data.mode}</span>
                  </span>
                )}
              </div>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
            />
          </div>
        </div>

        {data && (
          <div className="space-y-6">
            {/* Daily Mode Card */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Daily Mode Card</h2>
                    <div className="text-sm text-gray-400 mt-1">
                      {data.modeCard.status === "ready" && "✅ Ready"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Preview */}
                <div className="mb-4">
                  <img
                    src={data.modeCard.imageUrl}
                    className="w-full max-h-[400px] object-contain border border-gray-700 rounded-lg bg-gray-950"
                    alt="Daily Mode Card Preview"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 mb-4">
                  <a
                    href={data.modeCard.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                  >
                    Open Full Size
                  </a>
                  <a
                    href={data.modeCard.imageUrl}
                    download={`tsla-mode-${selectedDate}.png`}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                  >
                    Download PNG
                  </a>
                </div>

                {/* Tweet Text */}
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">Tweet Text:</div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative">
                    <pre className="whitespace-pre-wrap text-sm font-mono">{data.modeCard.tweetText}</pre>
                    <button
                      onClick={() => handleCopyTweet(data.modeCard.tweetText, "mode")}
                      className={`absolute top-3 right-3 px-3 py-1 rounded text-xs font-medium ${
                        copiedMode
                          ? "bg-green-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      }`}
                    >
                      {copiedMode ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Morning Card */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Morning Levels Card</h2>
                    <div className="text-sm text-gray-400 mt-1">
                      {data.morningCard.status === "ready" && "✅ Ready"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Preview */}
                <div className="mb-4">
                  <iframe
                    src={data.morningCard.imageUrl}
                    className="w-full h-[400px] border border-gray-700 rounded-lg bg-gray-950"
                    title="Morning Card Preview"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 mb-4">
                  <a
                    href={data.morningCard.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                  >
                    Open Full Size
                  </a>
                  <a
                    href={data.morningCard.imageUrl}
                    download={`tsla-levels-${selectedDate}.html`}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                  >
                    Download HTML
                  </a>
                </div>

                {/* Tweet Text */}
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">Tweet Text:</div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative">
                    <pre className="whitespace-pre-wrap text-sm font-mono">{data.morningCard.tweetText}</pre>
                    <button
                      onClick={() => handleCopyTweet(data.morningCard.tweetText, "morning")}
                      className={`absolute top-3 right-3 px-3 py-1 rounded text-xs font-medium ${
                        copiedMorning
                          ? "bg-green-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      }`}
                    >
                      {copiedMorning ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* EOD Accuracy Card */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">EOD Accuracy Card</h2>
                    <div className="text-sm text-gray-400 mt-1">
                      {data.eodCard.status === "ready" && "✅ Ready"}
                      {data.eodCard.status === "pending" && "⏳ Generates at 4pm CT"}
                      {data.eodCard.status === "generating" && "🔄 Generating..."}
                    </div>
                  </div>
                  {data.eodCard.status === "pending" && (
                    <button
                      onClick={handleGenerateEOD}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium"
                    >
                      Generate Now
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {data.eodCard.status === "ready" && data.eodCard.imageUrl ? (
                  <>
                    {/* Preview */}
                    <div className="mb-4">
                      <iframe
                        src={data.eodCard.imageUrl}
                        className="w-full h-[500px] border border-gray-700 rounded-lg bg-gray-950"
                        title="EOD Card Preview"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mb-4">
                      <a
                        href={data.eodCard.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                      >
                        Open Full Size
                      </a>
                      <a
                        href={data.eodCard.imageUrl}
                        download={`tsla-accuracy-${selectedDate}.html`}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                      >
                        Download HTML
                      </a>
                    </div>

                    {/* Tweet Text */}
                    {data.eodCard.tweetText && (
                      <div>
                        <div className="text-sm font-medium text-gray-400 mb-2">Tweet Text:</div>
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative">
                          <pre className="whitespace-pre-wrap text-sm font-mono">{data.eodCard.tweetText}</pre>
                          <button
                            onClick={() => handleCopyTweet(data.eodCard.tweetText!, "eod")}
                            className={`absolute top-3 right-3 px-3 py-1 rounded text-xs font-medium ${
                              copiedEOD
                                ? "bg-green-600 text-white"
                                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                            }`}
                          >
                            {copiedEOD ? "✓ Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center py-20 text-gray-500">
                    {data.eodCard.status === "pending" && "EOD card will be available after market close"}
                    {data.eodCard.status === "generating" && "Generating card..."}
                  </div>
                )}
              </div>
            </div>

            {/* Tweet Drafts (placeholder for future) */}
            {data.tweetDrafts && data.tweetDrafts.length > 0 && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-xl font-bold">Tweet Drafts</h2>
                  <div className="text-sm text-gray-400 mt-1">{data.tweetDrafts.length} ready</div>
                </div>
                <div className="p-6">
                  <div className="text-gray-500 text-sm">Coming soon...</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
