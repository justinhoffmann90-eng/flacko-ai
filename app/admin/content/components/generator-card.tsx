"use client";

import { useState } from "react";
import { Wand2, Copy, Trash2, Edit3, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getDefaultPrompt } from "@/lib/content/prompts";
import { PromptEditorModal } from "./prompt-editor-modal";

interface GeneratorCardProps {
  contentKey: string;
  label: string;
  storageKey: string;
}

export function GeneratorCard({ contentKey, label, storageKey }: GeneratorCardProps) {
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Get the prompt (custom or default)
    const customPrompt = localStorage.getItem(storageKey);
    const prompt = customPrompt || getDefaultPrompt(contentKey);
    
    // Simulate generation - in production this would call an AI API
    // For now, generate a placeholder response
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const mockOutputs: Record<string, string> = {
      pre_market_tweet: `$TSLA Pre-market levels to watch:
📊 Call Wall: $285
🎯 Gamma Strike: $280  
🛡️ Put Wall: $275

Overnight action suggests opening near key gamma level. Watch for direction off the open.`,
      market_open_tweet: `$TSLA Opening bell 🔔

Opening within yesterday's range. Volume looks healthy. Key level to watch: $280 gamma strike.

Mode: 🟡 YELLOW | Proceed with caution`,
      midday_tweet: `$TSLA Midday update:

Morning session held key support at $275 (Put Wall). Bounced nicely off that level. 

Watching for test of $280 gamma into the afternoon.`,
      power_hour_tweet: `$TSLA Power Hour ⚡

Last 90 minutes of trading. Key closing levels:
• Above $280 = bullish close
• Below $275 = bearish close
• $277-279 = neutral/chop

Watch the gamma pin!`,
      eod_tweet: `$TSLA EOD Summary:

Closed at $281.50 (+1.2%)
📈 Held above gamma strike
📈 Put wall support worked

Earnings next week - expect volatility expansion. See you tomorrow!`,
      eod_wrap: `**TSLA EOD Wrap - ${new Date().toLocaleDateString()}**

**Price Action:**
TSLA closed the session at $281.50, up 1.2% on the day. The stock held key support at the $275 put wall early in the session before grinding higher through the afternoon.

**Level Performance:**
• Call Wall ($285): Not tested - remains overhead resistance
• Gamma Strike ($280): Held as support after midday bounce
• Put Wall ($275): Perfect support - multiple tests held

**Gamma Landscape:**
Net gamma remains positive with the $280 strike the main gravitational pull. Tomorrow's expiration could see increased pinning around this level.

**Overnight Considerations:**
Watch for any macro headlines that could shift sentiment. Key levels remain the same for tomorrow's session.`,
      morning_brief: `**TSLA Morning Brief - ${new Date().toLocaleDateString()}**

**Mode:** 🟡 YELLOW | Daily Cap: 15%

**Key Levels Today:**
• Call Wall: $285 (upside target)
• Gamma Strike: $280 (pivot)
• Put Wall: $275 (key support)

**Overnight Action:**
TSLA trading slightly higher in pre-market following broader market strength. No major stock-specific news.

**Posture:**
Proceed with caution. Market remains in a consolidation phase. Look for setups with good R/R at key levels.`,
      hiro_alert: `**🚨 HIRO Alert - TSLA**

**Unusual Flow Detected**

Large block of calls traded at the $285 strike for Friday expiration. Significant gamma accumulation building at this level.

**Implications:**
• If stock approaches $285, could see gamma acceleration
• Market makers may hedge by buying shares
• Watch for potential squeeze setup

**Action:**
Consider positioning for potential move toward $285. Use put wall at $275 as stop reference.`,
    };
    
    setOutput(mockOutputs[contentKey] || `Generated ${label} content would appear here...\n\nPrompt used:\n${prompt.slice(0, 200)}...`);
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setOutput("");
  };

  return (
    <>
      <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-zinc-200">{label}</h3>
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

        {/* Output */}
        <div className="flex-1 min-h-[150px]">
          {output ? (
            <Textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="w-full h-full min-h-[150px] bg-zinc-900/50 border-zinc-800 text-zinc-300 text-sm resize-none focus:border-purple-500/50"
            />
          ) : (
            <div className="w-full h-full min-h-[150px] bg-zinc-900/30 border border-zinc-800 rounded-md flex items-center justify-center text-zinc-600 text-sm">
              Click Generate to create {label.toLowerCase()}
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
                onClick={handleClear}
                className="flex items-center gap-2 text-zinc-500 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                Clear
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
