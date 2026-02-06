"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw, History, ChevronDown, ChevronUp, Check } from "lucide-react";

interface PromptVersion {
  id: string;
  version: number;
  prompt: string;
  change_notes?: string;
  created_at: string;
  created_by: string;
}

interface ContentPrompt {
  id: string;
  content_type: string;
  prompt: string;
  description?: string;
  updated_at: string;
}

interface PromptEditorProps {
  contentType: string;
  onSaved?: () => void;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  tweet_premarket: "Pre-market Tweet",
  tweet_market_hours: "Market Hours Tweet",
  tweet_afterhours: "After-hours Tweet",
  morning_brief: "Morning Brief",
  hiro_alert: "HIRO Alert",
  eod_intelligence: "EOD Intelligence",
  daily_assessment: "Daily Assessment",
  mode_card: "Mode Card",
  levels_card: "Levels Card",
  weekly_scorecard: "Weekly Scorecard",
};

export function PromptEditor({ contentType, onSaved }: PromptEditorProps) {
  const [prompt, setPrompt] = useState<ContentPrompt | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [changeNotes, setChangeNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (contentType) {
      fetchPromptData();
    }
  }, [contentType]);

  useEffect(() => {
    if (prompt) {
      setHasChanges(editedPrompt !== prompt.prompt);
    }
  }, [editedPrompt, prompt]);

  const fetchPromptData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/content/prompts-v2/${contentType}`);
      if (!response.ok) throw new Error("Failed to fetch prompt");

      const data = await response.json();
      setPrompt(data.prompt);
      setEditedPrompt(data.prompt.prompt);
      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load prompt");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/content/prompts-v2/${contentType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: editedPrompt,
          change_notes: changeNotes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save prompt");
      }

      setSuccess(true);
      setChangeNotes("");
      fetchPromptData();
      onSaved?.();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = (version: PromptVersion) => {
    if (hasChanges && !confirm("You have unsaved changes. Replace with this version?")) {
      return;
    }
    setEditedPrompt(version.prompt);
    setHasChanges(true);
  };

  const handleReset = () => {
    if (prompt) {
      setEditedPrompt(prompt.prompt);
      setChangeNotes("");
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-8 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-zinc-700 border-t-zinc-300 rounded-full mx-auto mb-2" />
        <p className="text-zinc-500 text-sm">Loading prompt...</p>
      </div>
    );
  }

  if (!prompt && !loading) {
    return (
      <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-zinc-500">Prompt not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">
            {CONTENT_TYPE_LABELS[contentType] || contentType}
          </h3>
          {prompt?.description && (
            <p className="text-sm text-zinc-500">{prompt.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {versions.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 px-3 py-1.5 bg-zinc-900 rounded-lg"
            >
              <History className="w-3 h-3" />
              {versions.length} versions
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-sm text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Prompt saved successfully
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Version History */}
      {showHistory && versions.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs font-medium text-zinc-500">
            Version History
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {versions.map((v, index) => (
              <div
                key={v.id}
                className={`flex items-center justify-between p-3 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 ${
                  index === 0 ? "bg-zinc-900/30" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-300">
                      v{v.version}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-emerald-500">current</span>
                      )}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {new Date(v.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {v.change_notes && (
                    <p className="text-xs text-zinc-500 mt-1 truncate">{v.change_notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRestoreVersion(v)}
                  className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded hover:bg-purple-500/10 transition-colors"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-400">Prompt</label>
          {hasChanges && (
            <span className="text-xs text-amber-500">Unsaved changes</span>
          )}
        </div>
        <textarea
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          rows={15}
          className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none font-mono text-sm"
          placeholder="Enter your prompt..."
        />
      </div>

      {/* Change Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-400">
          Change Notes (optional)
        </label>
        <input
          type="text"
          value={changeNotes}
          onChange={(e) => setChangeNotes(e.target.value)}
          placeholder="Brief description of what changed..."
          className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          onClick={handleReset}
          disabled={!hasChanges || saving}
          className="text-sm text-zinc-400 hover:text-white disabled:opacity-50 flex items-center gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Changes
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          {saving ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Prompt
            </>
          )}
        </button>
      </div>
    </div>
  );
}
