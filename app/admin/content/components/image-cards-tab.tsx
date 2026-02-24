"use client";

import { useState, useRef, useEffect } from "react";
import { Wand2, Download, Edit3, Image } from "lucide-react";

// Dynamically import html2canvas only on client side
const getHtml2canvas = async () => {
  if (typeof window === "undefined") return null;
  const { default: html2canvas } = await import("html2canvas");
  return html2canvas;
};
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ModeCardTemplate,
  LevelsCardTemplate,
  ScorecardTemplate,
} from "@/lib/content/card-templates";
import { PromptEditorModal } from "./prompt-editor-modal";

// Mode Card Generator
function ModeCardGenerator() {
  const [mode, setMode] = useState<"GREEN" | "YELLOW" | "ORANGE" | "RED">("YELLOW");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [ticker, setTicker] = useState("TSLA");
  const [dailyCap, setDailyCap] = useState("15");
  const [takeAction, setTakeAction] = useState("Look for long setups above gamma strike");
  const [takeCaution, setTakeCaution] = useState("Break below put wall would flip me defensive");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Key levels state - populated from API
  const [callWall, setCallWall] = useState<number>(285);
  const [hedgeWall, setHedgeWall] = useState<number>(278);
  const [gammaStrike, setGammaStrike] = useState<number>(280);
  const [putWall, setPutWall] = useState<number>(275);
  const [masterEject, setMasterEject] = useState<number>(270);
  const [currentPrice, setCurrentPrice] = useState<number>(280);

  // Fetch latest report data on mount
  useEffect(() => {
    // Guard for SSR
    if (typeof window === "undefined") return;

    const fetchLatestReport = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/reports/latest");
        if (response.ok) {
          const report = await response.json();
          const data = report.extracted_data || {};

          // Set mode
          if (data.mode?.current) {
            const reportMode = data.mode.current.toUpperCase() as "GREEN" | "YELLOW" | "ORANGE" | "RED";
            setMode(reportMode);
          }

          // Set daily cap
          if (data.position?.daily_cap_pct) {
            setDailyCap(data.position.daily_cap_pct.toString());
          }

          // Set key levels
          if (data.key_levels) {
            if (data.key_levels.call_wall) setCallWall(parseFloat(data.key_levels.call_wall));
            if (data.key_levels.hedge_wall) setHedgeWall(parseFloat(data.key_levels.hedge_wall));
            if (data.key_levels.gamma_strike) setGammaStrike(parseFloat(data.key_levels.gamma_strike));
            if (data.key_levels.put_wall) setPutWall(parseFloat(data.key_levels.put_wall));
            if (data.key_levels.master_eject) setMasterEject(parseFloat(data.key_levels.master_eject));
          }

          // Set current price
          if (data.price?.close) {
            setCurrentPrice(parseFloat(data.price.close));
          }

          // Set date from report
          if (report.date) {
            setDate(report.date);
          }
        }
      } catch (error) {
        console.error("Failed to fetch latest report:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestReport();
  }, []);

  const calculatePctFromClose = (price: number) => {
    if (!currentPrice || currentPrice === 0) return 0;
    return ((price - currentPrice) / currentPrice) * 100;
  };

  const handleGenerate = () => {
    const levels = [
      { name: "Call Wall", price: callWall, type: "upside" as const, pctFromClose: calculatePctFromClose(callWall) },
      { name: "Gamma Strike", price: gammaStrike, type: "upside" as const, pctFromClose: calculatePctFromClose(gammaStrike) },
      { name: "Hedge Wall", price: hedgeWall, type: "downside" as const, pctFromClose: calculatePctFromClose(hedgeWall) },
      { name: "Put Wall", price: putWall, type: "downside" as const, pctFromClose: calculatePctFromClose(putWall) },
      { name: "Master Eject", price: masterEject, type: "eject" as const, pctFromClose: calculatePctFromClose(masterEject) },
      { name: "Last Close", price: currentPrice, type: "close" as const },
    ];

    setPreviewData({
      mode,
      date,
      ticker,
      dailyCap,
      levels,
      take: {
        action: takeAction,
        caution: takeCaution,
      },
    });
  };

  const handleDownload = async () => {
    if (!previewRef.current || !previewData) return;

    const html2canvas = await getHtml2canvas();
    if (!html2canvas) return;

    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: null,
      scale: 2,
    });

    const link = document.createElement("a");
    link.download = `mode-card-${ticker}-${date}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Mode Card</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditorOpen(true)}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300"
        >
          <Edit3 className="w-4 h-4" />
          Edit Prompt
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Side - Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-zinc-400">Mode</Label>
              <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="GREEN">🟢 GREEN</SelectItem>
                  <SelectItem value="YELLOW">🟡 YELLOW</SelectItem>
                  <SelectItem value="ORANGE">🟠 ORANGE</SelectItem>
                  <SelectItem value="RED">🔴 RED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Ticker</Label>
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="bg-zinc-900 border-zinc-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Daily Cap (%)</Label>
              <Input
                value={dailyCap}
                onChange={(e) => setDailyCap(e.target.value)}
                className="bg-zinc-900 border-zinc-800 mt-1"
              />
            </div>
          </div>

          {/* Key Levels Inputs */}
          <div className="space-y-3 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-zinc-300">Key Levels</Label>
              {isLoading && (
                <span className="text-xs text-purple-400 animate-pulse">Loading from report...</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-zinc-500">Call Wall</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={callWall}
                  onChange={(e) => setCallWall(parseFloat(e.target.value) || 0)}
                  className="bg-zinc-900 border-zinc-800 mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-500">Hedge Wall</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={hedgeWall}
                  onChange={(e) => setHedgeWall(parseFloat(e.target.value) || 0)}
                  className="bg-zinc-900 border-zinc-800 mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-500">Gamma Strike</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={gammaStrike}
                  onChange={(e) => setGammaStrike(parseFloat(e.target.value) || 0)}
                  className="bg-zinc-900 border-zinc-800 mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-500">Put Wall</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={putWall}
                  onChange={(e) => setPutWall(parseFloat(e.target.value) || 0)}
                  className="bg-zinc-900 border-zinc-800 mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-500">Master Eject</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={masterEject}
                  onChange={(e) => setMasterEject(parseFloat(e.target.value) || 0)}
                  className="bg-zinc-900 border-zinc-800 mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-500">Current Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                  className="bg-zinc-900 border-zinc-800 mt-1 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm text-zinc-400">What I&apos;d Do</Label>
              <Textarea
                value={takeAction}
                onChange={(e) => setTakeAction(e.target.value)}
                className="bg-zinc-900 border-zinc-800 mt-1 text-sm"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Would Change My Mind</Label>
              <Textarea
                value={takeCaution}
                onChange={(e) => setTakeCaution(e.target.value)}
                className="bg-zinc-900 border-zinc-800 mt-1 text-sm"
                rows={2}
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Wand2 className="w-4 h-4" />
            Generate Preview
          </Button>
        </div>

        {/* Right Side - Preview */}
        <div className="space-y-3">
          <Label className="text-sm text-zinc-400">Preview</Label>
          <div className="overflow-auto border border-zinc-800 rounded-lg p-4 bg-zinc-900/50 min-h-[300px] flex items-center justify-center">
            {previewData ? (
              <div ref={previewRef} className="inline-block">
                <ModeCardTemplate data={previewData} />
              </div>
            ) : (
              <div className="text-zinc-600 text-center">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click &quot;Generate Preview&quot; to see the card</p>
              </div>
            )}
          </div>
          {previewData && (
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
          )}
        </div>
      </div>

      <PromptEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        contentType="mode_card"
        contentLabel="Mode Card"
        storageKey="content-hub-mode-card-prompt"
      />
    </div>
  );
}

// Levels Card Generator
function LevelsCardGenerator() {
  const [callWall, setCallWall] = useState(285);
  const [hedgeWall, setHedgeWall] = useState(278);
  const [gammaStrike, setGammaStrike] = useState(280);
  const [putWall, setPutWall] = useState(275);
  const [currentPrice, setCurrentPrice] = useState(281.5);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    setPreviewData({
      callWall,
      hedgeWall,
      gammaStrike,
      putWall,
      currentPrice,
      date,
    });
  };

  const handleDownload = async () => {
    if (!previewRef.current || !previewData) return;

    const html2canvas = await getHtml2canvas();
    if (!html2canvas) return;

    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: null,
      scale: 2,
    });

    const link = document.createElement("a");
    link.download = `levels-card-${date}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Levels Card</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditorOpen(true)}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300"
        >
          <Edit3 className="w-4 h-4" />
          Edit Prompt
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Side - Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-zinc-400">Call Wall</Label>
              <Input
                type="number"
                step="0.01"
                value={callWall}
                onChange={(e) => setCallWall(parseFloat(e.target.value))}
                className="bg-zinc-900 border-zinc-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Hedge Wall</Label>
              <Input
                type="number"
                step="0.01"
                value={hedgeWall}
                onChange={(e) => setHedgeWall(parseFloat(e.target.value))}
                className="bg-zinc-900 border-zinc-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Gamma Strike</Label>
              <Input
                type="number"
                step="0.01"
                value={gammaStrike}
                onChange={(e) => setGammaStrike(parseFloat(e.target.value))}
                className="bg-zinc-900 border-zinc-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Put Wall</Label>
              <Input
                type="number"
                step="0.01"
                value={putWall}
                onChange={(e) => setPutWall(parseFloat(e.target.value))}
                className="bg-zinc-900 border-zinc-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Current Price</Label>
              <Input
                type="number"
                step="0.01"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(parseFloat(e.target.value))}
                className="bg-zinc-900 border-zinc-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 mt-1"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Wand2 className="w-4 h-4" />
            Generate Preview
          </Button>
        </div>

        {/* Right Side - Preview */}
        <div className="space-y-3">
          <Label className="text-sm text-zinc-400">Preview</Label>
          <div className="overflow-auto border border-zinc-800 rounded-lg p-4 bg-zinc-900/50 min-h-[300px] flex items-center justify-center">
            {previewData ? (
              <div ref={previewRef} className="inline-block">
                <LevelsCardTemplate data={previewData} />
              </div>
            ) : (
              <div className="text-zinc-600 text-center">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click &quot;Generate Preview&quot; to see the card</p>
              </div>
            )}
          </div>
          {previewData && (
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
          )}
        </div>
      </div>

      <PromptEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        contentType="levels_card"
        contentLabel="Levels Card"
        storageKey="content-hub-levels-card-prompt"
      />
    </div>
  );
}

// Weekly Scorecard Generator
function ScorecardGenerator() {
  const [weekEnding, setWeekEnding] = useState(new Date().toISOString().split("T")[0]);
  const [scenariosHit, setScenariosHit] = useState("4/5");
  const [keyWins, setKeyWins] = useState("Caught the move off put wall support\nGamma squeeze to call wall paid nicely");
  const [keyMisses, setKeyMisses] = useState("Missed the overnight gap down\nShould have taken more off at gamma strike");
  const [summary, setSummary] = useState("Solid week overall. System worked well - key was respecting the eject levels.");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    setPreviewData({
      weekEnding,
      scenariosHit,
      keyWins,
      keyMisses,
      summary,
    });
  };

  const handleDownload = async () => {
    if (!previewRef.current || !previewData) return;

    const html2canvas = await getHtml2canvas();
    if (!html2canvas) return;

    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: null,
      scale: 2,
    });

    const link = document.createElement("a");
    link.download = `weekly-scorecard-${weekEnding}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Weekly Scorecard</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditorOpen(true)}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300"
        >
          <Edit3 className="w-4 h-4" />
          Edit Prompt
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Side - Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-zinc-400">Week Ending</Label>
              <Input
                type="date"
                value={weekEnding}
                onChange={(e) => setWeekEnding(e.target.value)}
                className="bg-zinc-900 border-zinc-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Scenarios Hit</Label>
              <Input
                value={scenariosHit}
                onChange={(e) => setScenariosHit(e.target.value)}
                className="bg-zinc-900 border-zinc-800 mt-1"
                placeholder="e.g., 4/5"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm text-zinc-400">Key Wins (one per line)</Label>
              <Textarea
                value={keyWins}
                onChange={(e) => setKeyWins(e.target.value)}
                className="bg-zinc-900 border-zinc-800 mt-1 text-sm"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Key Misses (one per line)</Label>
              <Textarea
                value={keyMisses}
                onChange={(e) => setKeyMisses(e.target.value)}
                className="bg-zinc-900 border-zinc-800 mt-1 text-sm"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Summary</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="bg-zinc-900 border-zinc-800 mt-1 text-sm"
                rows={2}
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Wand2 className="w-4 h-4" />
            Generate Preview
          </Button>
        </div>

        {/* Right Side - Preview */}
        <div className="space-y-3">
          <Label className="text-sm text-zinc-400">Preview</Label>
          <div className="overflow-auto border border-zinc-800 rounded-lg p-4 bg-zinc-900/50 min-h-[300px] flex items-center justify-center">
            {previewData ? (
              <div ref={previewRef} className="inline-block">
                <ScorecardTemplate data={previewData} />
              </div>
            ) : (
              <div className="text-zinc-600 text-center">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click &quot;Generate Preview&quot; to see the card</p>
              </div>
            )}
          </div>
          {previewData && (
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
          )}
        </div>
      </div>

      <PromptEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        contentType="scorecard"
        contentLabel="Weekly Scorecard"
        storageKey="content-hub-scorecard-prompt"
      />
    </div>
  );
}

// Main Image Cards Tab
export function ImageCardsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Image Cards</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Generate visual trading cards with downloadable PNG output
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <ModeCardGenerator />
        <LevelsCardGenerator />
        <ScorecardGenerator />
      </div>
    </div>
  );
}
