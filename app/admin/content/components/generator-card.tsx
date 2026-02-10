"use client";

import { useState, useEffect, useRef } from "react";
import { Wand2, Copy, Trash2, Edit3, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { getDefaultPrompt, injectReportData } from "@/lib/content/prompts";
import { PromptEditorModal } from "./prompt-editor-modal";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface ReportData {
  mode?: string;
  dailyCap?: number;
  currentPrice?: number;
  priceChangePct?: number;
  callWall?: number;
  gammaStrike?: number;
  hedgeWall?: number;
  putWall?: number;
  masterEject?: number;
  hiro?: string;
  hiroLow?: string;
  hiroHigh?: string;
  positioning?: string;
  date?: string;
  weekly9ema?: number;
  weekly21ema?: number;
  daily9ema?: number;
  daily21ema?: number;
}

interface GeneratorCardProps {
  contentKey: string;
  label: string;
  storageKey: string;
  onTitleChange?: (newTitle: string) => void;
  onDelete?: () => void;
}

const defaultSubtitles: Record<string, string> = {
  pre_market_tweet: "Key levels and overnight action before market open",
  market_open_tweet: "First 30 minutes reaction and initial direction",
  midday_tweet: "Mid-session update on price action and levels",
  power_hour_tweet: "Final hour momentum and closing outlook",
  eod_tweet: "End of day summary and next day setup",
  eod_wrap: "Detailed Discord wrap with full analysis",
  morning_brief: "Comprehensive morning briefing for Discord",
  hiro_alert: "Real-time HIRO reading and dealer positioning",
};

export function GeneratorCard({ contentKey, label, storageKey, onTitleChange, onDelete }: GeneratorCardProps) {
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(label);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [subtitle, setSubtitle] = useState(defaultSubtitles[contentKey] || "");
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  // Fetch latest report data on mount
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/reports/latest");
        if (res.ok) {
          const data = await res.json();
          const extracted = data.extracted_data || {};
          setReportData({
            mode: extracted.mode?.current?.toUpperCase() || "N/A",
            dailyCap: extracted.position?.daily_cap_pct || extracted.tiers?.daily_cap_pct,
            currentPrice: extracted.price?.close,
            priceChangePct: extracted.price?.change_pct,
            callWall: extracted.key_levels?.call_wall,
            gammaStrike: extracted.key_levels?.gamma_strike,
            hedgeWall: extracted.key_levels?.hedge_wall,
            putWall: extracted.key_levels?.put_wall,
            masterEject: extracted.key_levels?.master_eject,
            hiro: extracted.hiro?.reading || "N/A",
            hiroLow: extracted.hiro?.low_30day || "N/A",
            hiroHigh: extracted.hiro?.high_30day || "N/A",
            positioning: extracted.positioning?.current_stance || extracted.position?.current_stance || "N/A",
            date: data.report_date,
            weekly9ema: data.parsed_data?.weekly_9ema,
            weekly21ema: data.parsed_data?.weekly_21ema,
            daily9ema: data.parsed_data?.daily_9ema,
            daily21ema: data.parsed_data?.daily_21ema,
          });
        }
      } catch (err) {
        console.error("Failed to fetch report:", err);
      } finally {
        setIsLoadingReport(false);
      }
    };
    fetchReport();
  }, []);

  // Load custom title from cloud/localStorage
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        // Try cloud first
        const { data: cloudData } = await supabase
          .from("content_hub_data")
          .select("renamed_titles")
          .eq("user_id", userId)
          .single();

        if (cloudData?.renamed_titles && cloudData.renamed_titles[contentKey]) {
          setTitle(cloudData.renamed_titles[contentKey]);
          return;
        }

        // Fallback to localStorage
        const renamedTitles = localStorage.getItem("content-hub-renamed-titles");
        if (renamedTitles) {
          const titles = JSON.parse(renamedTitles);
          if (titles[contentKey]) {
            setTitle(titles[contentKey]);
          }
        }
      } catch (err) {
        console.error("Failed to load title:", err);
      }
    };

    loadData();
  }, [contentKey, userId]);

  // Load custom subtitle from cloud/localStorage
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        // Try cloud first
        const { data: cloudData } = await supabase
          .from("content_hub_data")
          .select("custom_subtitles")
          .eq("user_id", userId)
          .single();

        if (cloudData?.custom_subtitles && cloudData.custom_subtitles[contentKey]) {
          setSubtitle(cloudData.custom_subtitles[contentKey]);
          return;
        }

        // Fallback to localStorage
        const customSubtitles = localStorage.getItem("content-hub-subtitles");
        if (customSubtitles) {
          const subtitles = JSON.parse(customSubtitles);
          if (subtitles[contentKey]) {
            setSubtitle(subtitles[contentKey]);
          }
        }
      } catch (err) {
        console.error("Failed to load subtitle:", err);
      }
    };

    loadData();
  }, [contentKey, userId]);

  // Focus input when editing title
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Focus input when editing subtitle
  useEffect(() => {
    if (isEditingSubtitle && subtitleInputRef.current) {
      subtitleInputRef.current.focus();
      subtitleInputRef.current.select();
    }
  }, [isEditingSubtitle]);

  useEffect(() => {
    if (!confirmDelete) return;
    const timeout = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(timeout);
  }, [confirmDelete]);

  const saveTitle = async (newTitle: string) => {
    const trimmedTitle = newTitle.trim();
    if (trimmedTitle && trimmedTitle !== label) {
      setTitle(trimmedTitle);

      // Update localStorage
      const renamedTitles = localStorage.getItem("content-hub-renamed-titles");
      const titles = renamedTitles ? JSON.parse(renamedTitles) : {};
      titles[contentKey] = trimmedTitle;
      localStorage.setItem("content-hub-renamed-titles", JSON.stringify(titles));

      // Sync to cloud
      if (userId) {
        try {
          await supabase
            .from("content_hub_data")
            .upsert({
              user_id: userId,
              renamed_titles: titles,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
        } catch (err) {
          console.error("Failed to sync title:", err);
        }
      }

      onTitleChange?.(trimmedTitle);
    } else if (!trimmedTitle) {
      setTitle(label);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveTitle(title);
    } else if (e.key === "Escape") {
      setTitle(label);
      setIsEditingTitle(false);
    }
  };

  const saveSubtitle = async (newSubtitle: string) => {
    const trimmedSubtitle = newSubtitle.trim();
    const defaultSubtitle = defaultSubtitles[contentKey] || "";
    if (trimmedSubtitle && trimmedSubtitle !== defaultSubtitle) {
      setSubtitle(trimmedSubtitle);

      // Update localStorage
      const customSubtitles = localStorage.getItem("content-hub-subtitles");
      const subtitles = customSubtitles ? JSON.parse(customSubtitles) : {};
      subtitles[contentKey] = trimmedSubtitle;
      localStorage.setItem("content-hub-subtitles", JSON.stringify(subtitles));

      // Sync to cloud
      if (userId) {
        try {
          await supabase
            .from("content_hub_data")
            .upsert({
              user_id: userId,
              custom_subtitles: subtitles,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
        } catch (err) {
          console.error("Failed to sync subtitle:", err);
        }
      }
    } else if (!trimmedSubtitle) {
      setSubtitle(defaultSubtitle);
    }
    setIsEditingSubtitle(false);
  };

  const handleSubtitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveSubtitle(subtitle);
    } else if (e.key === "Escape") {
      setSubtitle(defaultSubtitles[contentKey] || "");
      setIsEditingSubtitle(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // Get the prompt (custom or default)
      const customPrompt = localStorage.getItem(storageKey);
      const basePrompt = customPrompt || getDefaultPrompt(contentKey);

      // Inject report data into the prompt
      const prompt = reportData ? injectReportData(basePrompt, reportData) : basePrompt;

      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          contentKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate content");
      }

      setOutput(data?.content || "");
    } catch (error) {
      console.error("Content generation failed:", error);
      setOutput(`Failed to generate content. ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setOutput("");
    setConfirmDelete(false);
  };

  const handleDeleteClick = () => {
    if (!onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete();
  };

  return (
    <>
      <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5 flex flex-col min-h-[350px]">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-1">
            {isEditingTitle ? (
              <Input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => saveTitle(title)}
                onKeyDown={handleTitleKeyDown}
                className="h-8 w-auto min-w-[200px] bg-zinc-900 border-zinc-700 text-zinc-200 font-semibold"
              />
            ) : (
              <h3
                className="font-semibold text-zinc-200 cursor-pointer hover:text-purple-400 transition-colors"
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit title"
              >
                {title}
              </h3>
            )}
            {isEditingSubtitle ? (
              <Input
                ref={subtitleInputRef}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                onBlur={() => saveSubtitle(subtitle)}
                onKeyDown={handleSubtitleKeyDown}
                className="h-6 w-auto min-w-[250px] max-w-[350px] bg-zinc-900 border-zinc-700 text-zinc-400 text-sm"
                placeholder="Enter subtitle description..."
              />
            ) : (
              <p
                className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors"
                onClick={() => setIsEditingSubtitle(true)}
                title="Click to edit subtitle"
              >
                {subtitle}
              </p>
            )}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="sm"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Wand2 className="w-4 h-4" />
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>

        {/* Data Status */}
        {reportData && (
          <div className="mb-3 p-2 bg-zinc-900/50 rounded-md border border-zinc-800">
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span>📊 <strong className="text-zinc-400">{reportData.mode}</strong></span>
              <span>💰 ${reportData.currentPrice}</span>
              <span>🎯 GS: ${reportData.gammaStrike}</span>
              <span>📅 {reportData.date}</span>
            </div>
          </div>
        )}
        {isLoadingReport && (
          <div className="mb-3 p-2 bg-zinc-900/30 rounded-md border border-zinc-800 text-xs text-zinc-500 flex items-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Loading latest report data...
          </div>
        )}

        {/* Output */}
        <div className="flex-1 min-h-[150px]">
          {output ? (
            <Textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="w-full h-full min-h-[150px] bg-zinc-900/50 border-zinc-800 text-zinc-300 text-sm resize-none focus:border-purple-500/50 font-mono"
            />
          ) : (
            <div className="w-full h-full min-h-[150px] bg-zinc-900/30 border border-zinc-800 rounded-md flex items-center justify-center text-zinc-600 text-sm">
              Click Generate to create AI content with live data
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300"
          >
            <Edit3 className="w-4 h-4" />
            Edit Prompt
          </Button>

          {output && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete ? handleDeleteClick : handleClear}
                className={`flex items-center gap-2 ${onDelete ? "text-zinc-500 hover:text-red-500" : "text-zinc-500 hover:text-red-400"}`}
              >
                <Trash2 className="w-4 h-4" />
                {onDelete ? (confirmDelete ? "Click again to confirm" : "Delete") : "Clear"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="flex items-center gap-2 text-zinc-500 hover:text-green-400"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <PromptEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        contentType={contentKey}
        contentLabel={label}
        storageKey={storageKey}
      />
    </>
  );
}
