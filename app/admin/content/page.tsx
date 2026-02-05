"use client";

import { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";

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
  forecastCard: {
    status: "ready" | "pending" | "error";
    imageUrl: string | null;
    tweetText: string | null;
    accuracy: {
      total: number;
      held: number;
      notTested: number;
      broken: number;
      percentage: number;
    } | null;
  };
}

interface TweetDraft {
  id: string;
  date: string;
  type: string;
  content: string;
  status: string;
  created_at: string;
}

interface DiscordChannel {
  key: string;
  id: string;
  purpose: string;
}

const MODE_ACCENTS: Record<string, { badge: string; glow: string; text: string; ring: string }> = {
  GREEN: {
    badge: "bg-green-500/15 text-green-400 border-green-500/40",
    glow: "shadow-[0_0_35px_rgba(34,197,94,0.25)]",
    text: "text-green-400",
    ring: "ring-green-500/40",
  },
  YELLOW: {
    badge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
    glow: "shadow-[0_0_35px_rgba(234,179,8,0.25)]",
    text: "text-yellow-300",
    ring: "ring-yellow-500/40",
  },
  ORANGE: {
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    glow: "shadow-[0_0_35px_rgba(249,115,22,0.25)]",
    text: "text-orange-300",
    ring: "ring-orange-500/40",
  },
  RED: {
    badge: "bg-red-500/15 text-red-400 border-red-500/40",
    glow: "shadow-[0_0_35px_rgba(239,68,68,0.25)]",
    text: "text-red-400",
    ring: "ring-red-500/40",
  },
};

const TEMPLATE_OPTIONS = [
  { value: "minimal", label: "Minimal" },
  { value: "detailed", label: "Detailed" },
  { value: "hype", label: "Hype" },
  { value: "defensive", label: "Defensive" },
] as const;

type TemplateStyle = (typeof TEMPLATE_OPTIONS)[number]["value"];

function getModeKey(mode: string) {
  return String(mode || "").toUpperCase();
}

function getModeAccent(mode: string) {
  const modeKey = getModeKey(mode);
  return MODE_ACCENTS[modeKey] || MODE_ACCENTS.YELLOW;
}

function createTweetIntent(text: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function formatLevelValue(value?: number) {
  if (!value && value !== 0) return "—";
  return `$${Number(value).toFixed(2)}`;
}

export default function ContentHubPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // null = load latest
  const [data, setData] = useState<ContentHubData | null>(null);
  const [loading, setLoading] = useState(true); // Start loading immediately
  const [error, setError] = useState<string | null>(null);
  const [copiedMode, setCopiedMode] = useState(false);
  const [copiedMorning, setCopiedMorning] = useState(false);
  const [copiedEOD, setCopiedEOD] = useState(false);
  const [copiedForecast, setCopiedForecast] = useState(false);
  const [tweetDrafts, setTweetDrafts] = useState<TweetDraft[]>([]);
  const [tweetDraftsLoading, setTweetDraftsLoading] = useState(false);
  const [tweetDraftsError, setTweetDraftsError] = useState<string | null>(null);
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);
  const [discordChannels, setDiscordChannels] = useState<DiscordChannel[]>([]);
  const [selectedDiscordChannel, setSelectedDiscordChannel] = useState<string>("");
  const [discordPosting, setDiscordPosting] = useState<string | null>(null);
  const [discordStatus, setDiscordStatus] = useState<string | null>(null);
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>("minimal");
  const [threadTweets, setThreadTweets] = useState<string[]>([]);

  useEffect(() => {
    loadContent(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    loadTweetDrafts();
    loadDiscordChannels();
  }, []);

  const activeDate = selectedDate || data?.date || null;
  const formattedDate = activeDate
    ? format(parseISO(activeDate), "EEEE, MMM d, yyyy")
    : "Loading...";

  const modeAccent = data ? getModeAccent(data.mode) : MODE_ACCENTS.YELLOW;

  const quickStats = useMemo(() => {
    if (!data) return { ready: 0, pending: 0 };
    const statuses = [data.modeCard.status, data.morningCard.status, data.eodCard.status];
    const ready = statuses.filter((status) => status === "ready").length;
    const pending = statuses.length - ready;
    return { ready, pending };
  }, [data]);

  const threadPreview = useMemo(() => {
    if (!data) return [] as string[];
    return buildThreadTweets(data, templateStyle);
  }, [data, templateStyle]);

  const loadContent = async (date?: string | null) => {
    setLoading(true);
    setError(null);

    try {
      // If no date specified, API will return latest report
      const url = date ? `/api/content/hub?date=${date}` : `/api/content/hub`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load content");
      }

      const contentData = await response.json();
      setData(contentData);

      // If we loaded without a date, update selectedDate from response
      if (!date && contentData.date) {
        setSelectedDate(contentData.date);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTweet = (text: string, type: "mode" | "morning" | "eod" | "forecast") => {
    navigator.clipboard.writeText(text);
    if (type === "mode") {
      setCopiedMode(true);
      setTimeout(() => setCopiedMode(false), 2000);
    } else if (type === "morning") {
      setCopiedMorning(true);
      setTimeout(() => setCopiedMorning(false), 2000);
    } else if (type === "eod") {
      setCopiedEOD(true);
      setTimeout(() => setCopiedEOD(false), 2000);
    } else {
      setCopiedForecast(true);
      setTimeout(() => setCopiedForecast(false), 2000);
    }
  };

  const handleGenerateEOD = async () => {
    if (!data) return;

    setData({
      ...data,
      eodCard: {
        ...data.eodCard,
        status: "generating",
      },
    });

    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "eod-accuracy-card", date: activeDate }),
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
            status: "error" as any,
          },
        });
      }
    }
  };

  const loadTweetDrafts = async () => {
    setTweetDraftsLoading(true);
    setTweetDraftsError(null);

    try {
      const response = await fetch("/api/tweets/drafts");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load tweet drafts");
      }
      const payload = await response.json();
      setTweetDrafts(payload.drafts || []);
    } catch (err) {
      setTweetDraftsError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setTweetDraftsLoading(false);
    }
  };

  const refreshTweetDrafts = async () => {
    setTweetDraftsLoading(true);
    setTweetDraftsError(null);

    try {
      const response = await fetch("/api/tweets/generate", { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to refresh drafts");
      }
      await loadTweetDrafts();
    } catch (err) {
      setTweetDraftsError(err instanceof Error ? err.message : "Unknown error");
      setTweetDraftsLoading(false);
    }
  };

  const handleCopyDraft = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraftId(id);
    setTimeout(() => setCopiedDraftId(null), 2000);
  };

  const handleUpdateDraft = async (id: string, status: "approved" | "rejected") => {
    setTweetDraftsError(null);
    try {
      const response = await fetch(`/api/tweets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update draft");
      }
      await loadTweetDrafts();
    } catch (err) {
      setTweetDraftsError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const loadDiscordChannels = async () => {
    try {
      const response = await fetch("/api/content/discord");
      if (!response.ok) return;
      const payload = await response.json();
      const channels = (payload.channels || []) as DiscordChannel[];
      const filtered = channels.filter((channel) => channel.key !== "alerts");
      setDiscordChannels(filtered);
      if (!selectedDiscordChannel && filtered.length) {
        setSelectedDiscordChannel(filtered[0].key);
      }
    } catch (err) {
      console.error("Failed to load discord channels", err);
    }
  };

  const postToDiscord = async (content: string, context: string) => {
    if (!selectedDiscordChannel) return;
    setDiscordPosting(context);
    setDiscordStatus(null);
    try {
      const response = await fetch("/api/content/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelKey: selectedDiscordChannel, content }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Failed to post to Discord");
      }
      setDiscordStatus("Posted to Discord ✅");
      setTimeout(() => setDiscordStatus(null), 2500);
    } catch (err) {
      setDiscordStatus(err instanceof Error ? err.message : "Discord post failed");
      setTimeout(() => setDiscordStatus(null), 3500);
    } finally {
      setDiscordPosting(null);
    }
  };

  const triggerDownload = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopyAll = () => {
    if (!data) return;
    const parts = [data.modeCard.tweetText, data.morningCard.tweetText, data.eodCard.tweetText]
      .filter(Boolean)
      .join("\n\n—\n\n");
    navigator.clipboard.writeText(parts);
  };

  const handleDownloadAll = () => {
    if (!data || !activeDate) return;
    triggerDownload(`/api/content/download?type=mode-card&date=${activeDate}&download=1`);
    triggerDownload(`/api/content/download?type=daily-mode-card&date=${activeDate}&download=1`);
    if (data.eodCard.status === "ready") {
      triggerDownload(`/api/content/download?type=eod-accuracy-card&date=${activeDate}&download=1`);
    }
  };

  const handleGenerateThread = () => {
    if (!data) return;
    setThreadTweets(buildThreadTweets(data, templateStyle));
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-zinc-500">Loading content hub...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 p-4 sm:p-8">
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
    <div className="min-h-screen bg-black text-zinc-100 px-4 sm:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-6 sm:p-8 mb-6">
          <div className="absolute -top-24 right-0 h-48 w-48 bg-gradient-to-br from-white/10 to-transparent blur-3xl" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Command Center</p>
              <h1 className="text-3xl sm:text-4xl font-semibold mt-2">⚔️ Content Hub v2</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                <span className="text-zinc-500">{formattedDate}</span>
                {data && (
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${modeAccent.badge}`}>
                    {data.modeEmoji} {data.mode} MODE
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-3">
              <input
                type="date"
                value={activeDate || ""}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-zinc-900/80 border border-zinc-700 rounded-lg text-zinc-100"
              />
              {discordStatus && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-lg">
                  {discordStatus}
                </div>
              )}
            </div>
          </div>
        </div>

        {data && (
          <div className="space-y-6">
            {/* Quick Actions Bar */}
            <div className="sticky top-4 z-30">
              <div className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-black/85 backdrop-blur-xl p-4 sm:p-5 ${modeAccent.glow}`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl border ${modeAccent.badge} flex items-center justify-center text-lg`}>{data.modeEmoji}</div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Today&apos;s Mode</div>
                        <div className={`text-lg font-semibold ${modeAccent.text}`}>{data.mode}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-xs text-zinc-500">Content Ready</div>
                        <div className="text-lg font-semibold text-zinc-100">{quickStats.ready}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Pending</div>
                        <div className="text-lg font-semibold text-zinc-100">{quickStats.pending}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCopyAll}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-sm font-medium"
                    >
                      Copy All Tweets
                    </button>
                    <button
                      onClick={handleDownloadAll}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 text-sm font-medium"
                    >
                      Download All PNGs
                    </button>
                    <select
                      value={selectedDiscordChannel}
                      onChange={(e) => setSelectedDiscordChannel(e.target.value)}
                      className="min-h-[44px] px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm"
                    >
                      {discordChannels.map((channel) => (
                        <option key={channel.key} value={channel.key}>
                          {channel.key}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Mode Card */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800/30 via-white/10 to-zinc-800/30 rounded-3xl blur opacity-70" />
              <div className="relative bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-zinc-800">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Daily Mode Card</h2>
                      <div className="text-sm text-zinc-500 mt-1">{data.modeCard.status === "ready" && "✅ Ready"}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs border ${modeAccent.badge}`}>Live Preview</div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {/* Preview */}
                  <div className="mb-5 group">
                    <img
                      src={data.modeCard.imageUrl}
                      className={`w-full max-h-[520px] object-contain border border-zinc-800 rounded-2xl bg-black/80 transition-transform duration-300 group-hover:scale-[1.01] ${modeAccent.glow}`}
                      alt="Daily Mode Card Preview"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col xl:flex-row xl:items-center gap-3 mb-5">
                    <a
                      href={data.modeCard.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm font-medium text-center border border-zinc-700"
                    >
                      Open Full Size
                    </a>
                    <button
                      onClick={() =>
                        triggerDownload(`/api/content/download?type=mode-card&date=${activeDate}&download=1`)
                      }
                      className="min-h-[44px] px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium"
                    >
                      Download PNG
                    </button>
                    <a
                      href={createTweetIntent(data.modeCard.tweetText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg text-sm font-medium text-center"
                    >
                      Open in X
                    </a>
                    <button
                      onClick={() => postToDiscord(data.modeCard.tweetText, "mode")}
                      disabled={!selectedDiscordChannel || discordPosting === "mode"}
                      className="min-h-[44px] px-4 py-2 bg-indigo-500/20 border border-indigo-500/40 hover:bg-indigo-500/30 rounded-lg text-sm font-medium"
                    >
                      {discordPosting === "mode" ? "Posting..." : "Post to Discord"}
                    </button>
                  </div>

                  {/* Tweet Text */}
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Tweet Text</div>
                    <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 relative">
                      <pre className="whitespace-pre-wrap text-sm font-mono text-zinc-200">{data.modeCard.tweetText}</pre>
                      <button
                        onClick={() => handleCopyTweet(data.modeCard.tweetText, "mode")}
                        className={`absolute top-3 right-3 min-h-[40px] px-3 py-2 rounded text-xs font-medium border ${
                          copiedMode
                            ? "bg-green-600 text-white border-green-500"
                            : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                        }`}
                      >
                        {copiedMode ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Morning Card */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800/30 via-white/10 to-zinc-800/30 rounded-3xl blur opacity-70" />
              <div className="relative bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-zinc-800">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Morning Levels Card</h2>
                      <div className="text-sm text-zinc-500 mt-1">{data.morningCard.status === "ready" && "✅ Ready"}</div>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs border border-zinc-700 text-zinc-400">Live Preview</div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {/* Preview */}
                  <div className="mb-5 group">
                    <img
                      src={`/api/content/download?type=daily-mode-card&date=${activeDate}`}
                      className="w-full max-h-[520px] object-contain border border-zinc-800 rounded-2xl bg-black/80 transition-transform duration-300 group-hover:scale-[1.01]"
                      alt="Morning Card Preview"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col xl:flex-row xl:items-center gap-3 mb-5">
                    <a
                      href={data.morningCard.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm font-medium text-center border border-zinc-700"
                    >
                      Open Full Size
                    </a>
                    <button
                      onClick={() =>
                        triggerDownload(`/api/content/download?type=daily-mode-card&date=${activeDate}&download=1`)
                      }
                      className="min-h-[44px] px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium"
                    >
                      Download PNG
                    </button>
                    <a
                      href={createTweetIntent(data.morningCard.tweetText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg text-sm font-medium text-center"
                    >
                      Open in X
                    </a>
                    <button
                      onClick={() => postToDiscord(data.morningCard.tweetText, "morning")}
                      disabled={!selectedDiscordChannel || discordPosting === "morning"}
                      className="min-h-[44px] px-4 py-2 bg-indigo-500/20 border border-indigo-500/40 hover:bg-indigo-500/30 rounded-lg text-sm font-medium"
                    >
                      {discordPosting === "morning" ? "Posting..." : "Post to Discord"}
                    </button>
                  </div>

                  {/* Tweet Text */}
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Tweet Text</div>
                    <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 relative">
                      <pre className="whitespace-pre-wrap text-sm font-mono text-zinc-200">{data.morningCard.tweetText}</pre>
                      <button
                        onClick={() => handleCopyTweet(data.morningCard.tweetText, "morning")}
                        className={`absolute top-3 right-3 min-h-[40px] px-3 py-2 rounded text-xs font-medium border ${
                          copiedMorning
                            ? "bg-green-600 text-white border-green-500"
                            : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                        }`}
                      >
                        {copiedMorning ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* EOD Accuracy Card */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800/30 via-white/10 to-zinc-800/30 rounded-3xl blur opacity-70" />
              <div className="relative bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-zinc-800">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">EOD Accuracy Card</h2>
                      <div className="text-sm text-zinc-500 mt-1">
                        {data.eodCard.status === "ready" && "✅ Ready"}
                        {data.eodCard.status === "pending" && "⏳ Generates at 4pm CT"}
                        {data.eodCard.status === "generating" && "🔄 Generating..."}
                      </div>
                    </div>
                    {data.eodCard.status === "pending" && (
                      <button
                        onClick={handleGenerateEOD}
                        className="min-h-[44px] px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium"
                      >
                        Generate Now
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {data.eodCard.status === "ready" ? (
                    <>
                      {/* Preview */}
                      <div className="mb-5 group">
                        <img
                          src={`/api/content/download?type=eod-accuracy-card&date=${activeDate}`}
                          className="w-full max-h-[520px] object-contain border border-zinc-800 rounded-2xl bg-black/80 transition-transform duration-300 group-hover:scale-[1.01]"
                          alt="EOD Card Preview"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col xl:flex-row xl:items-center gap-3 mb-5">
                        <a
                          href={data.eodCard.imageUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm font-medium text-center border border-zinc-700"
                        >
                          Open Full Size
                        </a>
                        <button
                          onClick={() =>
                            triggerDownload(`/api/content/download?type=eod-accuracy-card&date=${activeDate}&download=1`)
                          }
                          className="min-h-[44px] px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium"
                        >
                          Download PNG
                        </button>
                        {data.eodCard.tweetText && (
                          <a
                            href={createTweetIntent(data.eodCard.tweetText)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[44px] px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg text-sm font-medium text-center"
                          >
                            Open in X
                          </a>
                        )}
                        {data.eodCard.tweetText && (
                          <button
                            onClick={() => postToDiscord(data.eodCard.tweetText || "", "eod")}
                            disabled={!selectedDiscordChannel || discordPosting === "eod"}
                            className="min-h-[44px] px-4 py-2 bg-indigo-500/20 border border-indigo-500/40 hover:bg-indigo-500/30 rounded-lg text-sm font-medium"
                          >
                            {discordPosting === "eod" ? "Posting..." : "Post to Discord"}
                          </button>
                        )}
                      </div>

                      {/* Tweet Text */}
                      {data.eodCard.tweetText && (
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Tweet Text</div>
                          <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 relative">
                            <pre className="whitespace-pre-wrap text-sm font-mono text-zinc-200">{data.eodCard.tweetText}</pre>
                            <button
                              onClick={() => handleCopyTweet(data.eodCard.tweetText!, "eod")}
                              className={`absolute top-3 right-3 min-h-[40px] px-3 py-2 rounded text-xs font-medium border ${
                                copiedEOD
                                  ? "bg-green-600 text-white border-green-500"
                                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                              }`}
                            >
                              {copiedEOD ? "✓ Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-20 text-zinc-500">
                      {data.eodCard.status === "pending" && "EOD card will be available after market close"}
                      {data.eodCard.status === "generating" && "Generating card..."}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Thread Generator */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800/30 via-white/10 to-zinc-800/30 rounded-3xl blur opacity-70" />
              <div className="relative bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-zinc-800">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Thread Generator</h2>
                      <div className="text-sm text-zinc-500 mt-1">4-part thread based on today&apos;s report</div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={templateStyle}
                        onChange={(e) => setTemplateStyle(e.target.value as TemplateStyle)}
                        className="min-h-[44px] px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm"
                      >
                        {TEMPLATE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleGenerateThread}
                        className="min-h-[44px] px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium"
                      >
                        Generate Thread
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  {(threadTweets.length ? threadTweets : threadPreview).map((tweet, index) => (
                    <div key={index} className="border border-zinc-800 rounded-2xl p-4 bg-black/60">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Tweet {index + 1}</div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(tweet)}
                            className="min-h-[40px] px-3 py-2 rounded text-xs font-medium bg-zinc-900 border border-zinc-700"
                          >
                            Copy
                          </button>
                          <a
                            href={createTweetIntent(tweet)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[40px] px-3 py-2 rounded text-xs font-medium bg-zinc-900 border border-zinc-700"
                          >
                            Open in X
                          </a>
                          <button
                            onClick={() => postToDiscord(tweet, `thread-${index}`)}
                            disabled={!selectedDiscordChannel || discordPosting === `thread-${index}`}
                            className="min-h-[40px] px-3 py-2 rounded text-xs font-medium bg-indigo-500/20 border border-indigo-500/40"
                          >
                            {discordPosting === `thread-${index}` ? "Posting..." : "Post to Discord"}
                          </button>
                        </div>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-mono">{tweet}</pre>
                      <div className="text-xs text-zinc-500 mt-2">{tweet.length} characters</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tweet Drafts */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800/30 via-white/10 to-zinc-800/30 rounded-3xl blur opacity-70" />
              <div className="relative bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-zinc-800">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Tweet Drafts</h2>
                      <div className="text-sm text-zinc-500 mt-1">{tweetDrafts.length} pending</div>
                    </div>
                    <button
                      onClick={refreshTweetDrafts}
                      disabled={tweetDraftsLoading}
                      className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium border ${
                        tweetDraftsLoading
                          ? "bg-zinc-900 text-zinc-500 border-zinc-800"
                          : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700"
                      }`}
                    >
                      {tweetDraftsLoading ? "Refreshing..." : "↻ Refresh"}
                    </button>
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  {tweetDraftsError && (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
                      {tweetDraftsError}
                    </div>
                  )}

                  {tweetDraftsLoading ? (
                    <div className="text-zinc-500 text-sm">Loading drafts...</div>
                  ) : tweetDrafts.length === 0 ? (
                    <div className="text-zinc-500 text-sm">No pending drafts yet.</div>
                  ) : (
                    tweetDrafts.map((draft) => (
                      <div key={draft.id} className="border border-zinc-800 rounded-2xl p-4 bg-black/60">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                            {draft.type} • {draft.date}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleCopyDraft(draft.id, draft.content)}
                              className={`min-h-[40px] px-3 py-2 rounded text-xs font-medium border ${
                                copiedDraftId === draft.id
                                  ? "bg-green-600 text-white border-green-500"
                                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                              }`}
                            >
                              {copiedDraftId === draft.id ? "✓ Copied!" : "Copy"}
                            </button>
                            <a
                              href={createTweetIntent(draft.content)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[40px] px-3 py-2 rounded text-xs font-medium bg-zinc-900 border border-zinc-700"
                            >
                              Open in X
                            </a>
                            <button
                              onClick={() => postToDiscord(draft.content, `draft-${draft.id}`)}
                              disabled={!selectedDiscordChannel || discordPosting === `draft-${draft.id}`}
                              className="min-h-[40px] px-3 py-2 rounded text-xs font-medium bg-indigo-500/20 border border-indigo-500/40"
                            >
                              {discordPosting === `draft-${draft.id}` ? "Posting..." : "Post to Discord"}
                            </button>
                            <button
                              onClick={() => handleUpdateDraft(draft.id, "approved")}
                              className="min-h-[40px] px-3 py-2 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateDraft(draft.id, "rejected")}
                              className="min-h-[40px] px-3 py-2 rounded text-xs font-medium bg-rose-600 hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                        <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-mono">{draft.content}</pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Quote Image Generator */}
            <QuoteImageGenerator modeAccent={modeAccent} />

            {/* X Article Builder */}
            <XArticleBuilder />
          </div>
        )}
      </div>
    </div>
  );
}

function QuoteImageGenerator({ modeAccent }: { modeAccent: { badge: string; glow: string; text: string; ring: string } }) {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("Flacko AI");
  const [style, setStyle] = useState<"neutral" | "red" | "orange" | "yellow" | "green">("neutral");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const styleOptions = [
    { value: "neutral", label: "Neutral (White)", color: "bg-white" },
    { value: "red", label: "Red Mode", color: "bg-red-500" },
    { value: "orange", label: "Orange Mode", color: "bg-orange-500" },
    { value: "yellow", label: "Yellow Mode", color: "bg-yellow-500" },
    { value: "green", label: "Green Mode", color: "bg-green-500" },
  ];

  const handleGenerate = async () => {
    if (!quote.trim()) return;
    setGenerating(true);
    setPreviewUrl(null);

    try {
      const response = await fetch("/api/content/quote-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote, author, style }),
      });

      if (!response.ok) throw new Error("Failed to generate");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Quote generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `flacko-quote-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="relative">
      <div className={`absolute -inset-1 bg-gradient-to-r from-zinc-800/30 via-white/10 to-zinc-800/30 rounded-3xl blur opacity-70`} />
      <div className="relative bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-zinc-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span>💬</span> Quote Image Generator
              </h2>
              <div className="text-sm text-zinc-500 mt-1">Create branded quote images for X</div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Quote Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Quote</label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Cash is a position. At RED mode, daily cap is 5%. The goal isn't to catch the bottom — it's to survive until clarity returns."
              rows={4}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none"
            />
            <div className="text-xs text-zinc-500 mt-1">{quote.length} characters</div>
          </div>

          {/* Author & Style Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Color Style</label>
              <div className="flex flex-wrap gap-2">
                {styleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStyle(opt.value as typeof style)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      style === opt.value
                        ? "bg-zinc-800 border-zinc-600 ring-2 ring-zinc-500"
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <span className={`inline-block w-3 h-3 rounded-full ${opt.color} mr-2`} />
                    {opt.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!quote.trim() || generating}
            className={`w-full min-h-[50px] px-6 py-3 rounded-xl text-base font-semibold transition-all ${
              generating
                ? "bg-zinc-800 text-zinc-400 cursor-wait"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {generating ? "Generating..." : "Generate Quote Image"}
          </button>

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-4">
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <img src={previewUrl} alt="Quote preview" className="w-full" />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700"
                >
                  Download PNG
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(quote + "\n\n— " + author + "\n\nflacko.ai ⚔️")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-900 border border-zinc-700 text-center flex items-center justify-center"
                >
                  Open in X
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function XArticleBuilder() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Convert Discord format to X article-friendly format
  const convertToArticle = (text: string): string => {
    let result = text;
    
    // Remove markdown headers (### ## #) - keep the text, add newline after
    result = result.replace(/^#{1,6}\s*(.+)$/gm, "$1\n");
    
    // Convert **bold** to plain text (X articles don't support markdown)
    result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
    
    // Convert __underline__ to plain text
    result = result.replace(/__([^_]+)__/g, "$1");
    
    // Convert *italic* to plain text
    result = result.replace(/\*([^*]+)\*/g, "$1");
    
    // Convert _italic_ to plain text
    result = result.replace(/_([^_]+)_/g, "$1");
    
    // Convert ~~strikethrough~~ to plain text
    result = result.replace(/~~([^~]+)~~/g, "$1");
    
    // Remove Discord separators (━━━━ lines)
    result = result.replace(/[━─═]{3,}/g, "---");
    
    // Clean up bullet points (• → -)
    result = result.replace(/•/g, "-");
    
    // Remove code block markers
    result = result.replace(/```[a-z]*\n?/g, "");
    result = result.replace(/`([^`]+)`/g, "$1");
    
    // Clean up Discord emoji format :emoji_name:
    // Keep common ones, remove custom server emojis
    result = result.replace(/<:[a-zA-Z0-9_]+:[0-9]+>/g, "");
    
    // Clean up multiple newlines (more than 2 → 2)
    result = result.replace(/\n{3,}/g, "\n\n");
    
    // Clean up multiple dashes/separators in a row
    result = result.replace(/(-{3,}\n?){2,}/g, "---\n\n");
    
    // Trim whitespace from each line
    result = result.split("\n").map(line => line.trim()).join("\n");
    
    // Trim overall
    result = result.trim();
    
    return result;
  };

  const articleOutput = convertToArticle(input);

  const handleCopy = () => {
    navigator.clipboard.writeText(articleOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800/30 via-white/10 to-zinc-800/30 rounded-3xl blur opacity-70" />
      <div className="relative bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-zinc-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span>📝</span> X Article Builder
              </h2>
              <div className="text-sm text-zinc-500 mt-1">Convert Discord posts to X article format</div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Paste Discord Content</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your Morning Brief, EOD Wrap, or any Discord-formatted content here..."
              rows={8}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none font-mono text-sm"
            />
            <div className="text-xs text-zinc-500 mt-1">{input.length} characters</div>
          </div>

          {/* Output Preview */}
          {input && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-400">Article Preview</label>
                <button
                  onClick={handleCopy}
                  className={`min-h-[36px] px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    copied
                      ? "bg-green-600 text-white border-green-500"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                  }`}
                >
                  {copied ? "✓ Copied!" : "Copy Article"}
                </button>
              </div>
              <div className="bg-black border border-zinc-800 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-sans leading-relaxed">{articleOutput}</pre>
              </div>
              <div className="text-xs text-zinc-500 mt-1">{articleOutput.length} characters</div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="text-sm text-zinc-400">
              <strong className="text-zinc-300">What this converts:</strong>
              <ul className="mt-2 space-y-1 text-zinc-500">
                <li>• Headers (## Title) → plain text</li>
                <li>• Bold (**text**) → plain text</li>
                <li>• Italic (*text* or _text_) → plain text</li>
                <li>• Underline (__text__) → plain text</li>
                <li>• Strikethrough (~~text~~) → plain text</li>
                <li>• Code blocks and inline code → plain text</li>
                <li>• Separator lines (━━━) → ---</li>
                <li>• Bullets (•) → dashes (-)</li>
                <li>• Custom Discord emojis → removed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildThreadTweets(data: ContentHubData, template: TemplateStyle): string[] {
  const dateLabel = format(parseISO(data.date), "MMM d, yyyy");
  const levels = data.morningCard.levels || {};
  const modeLine = `${data.modeEmoji} ${data.mode.toUpperCase()} MODE — ${dateLabel}`;
  const levelLine = `Key levels: R1 ${formatLevelValue(levels.R1)}, R2 ${formatLevelValue(levels.R2)}, S1 ${formatLevelValue(levels.S1)}, S2 ${formatLevelValue(levels.S2)}`;

  const base = {
    minimal: [
      `${modeLine}\n\nDaily cap in effect. Map your risk accordingly. ⚔️`,
      `${levelLine}\n\nRespect the levels.`,
      `Focus: clean reactions at key levels + protect capital.`,
      `Get the full daily brief + accuracy track record → flacko.ai ⚔️`,
    ],
    detailed: [
      `${modeLine}\n\nToday’s plan is live. Daily cap + posture pulled from the report.`,
      `${levelLine}\n\nThese are the highest-impact levels for today’s tape.`,
      `What to watch: wait for clean reactions at levels, size by mode, and avoid forcing trades.`,
      `Want the full breakdown + alerts? Join the gang → flacko.ai ⚔️`,
    ],
    hype: [
      `${modeLine}\n\nWe’ve got a plan. Levels locked. Risk capped. ⚡️`,
      `${levelLine}\n\nThese are the battlegrounds.`,
      `Stay sharp: let price come to you and execute the playbook. ⚔️`,
      `Full report + live alerts → flacko.ai ⚔️`,
    ],
    defensive: [
      `${modeLine}\n\nRisk tight today. Size down and stay defensive.`,
      `${levelLine}\n\nProtect capital first.`,
      `What matters: patience, clean reactions, no hero trades.`,
      `Track the system + accuracy → flacko.ai ⚔️`,
    ],
  } as const;

  return base[template];
}
