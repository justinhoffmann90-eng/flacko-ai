"use client";

import { useState, useEffect } from "react";
import { X, Wand2, RotateCcw, Save, Clock, Edit3, ChevronDown, ChevronUp } from "lucide-react";

interface PromptVersion {
  id: string;
  version: number;
  prompt: string;
  created_at: string;
  created_by: string;
}

interface ContentPrompt {
  id: string;
  content_type: string;
  prompt: string;
  description?: string;
}

interface ContentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: string;
  scheduledFor: Date;
  existingContent?: {
    id: string;
    content: string;
    status: string;
    metadata?: Record<string, unknown>;
  } | null;
  onSaved: () => void;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  tweet: "Tweet",
  tweet_premarket: "Pre-market Tweet",
  tweet_market_hours: "Market Hours Tweet",
  tweet_afterhours: "After-hours Tweet",
  morning_brief: "Morning Brief",
  hiro_alert: "HIRO Alert",
  eod_intelligence: "EOD Intelligence",
  daily_assessment: "Daily Assessment",
  mode_card: "Mode Card",
  levels_card: "Levels Card",
};

export function ContentGenerator({
  isOpen,
  onClose,
  contentType,
  scheduledFor,
  existingContent,
  onSaved,
}: ContentGeneratorProps) {
  const [prompt, setPrompt] = useState<ContentPrompt | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [context, setContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    if (isOpen && contentType) {
      fetchPrompt();
      if (existingContent) {
        setGeneratedContent(existingContent.content);
        setEditedContent(existingContent.content);
      } else {
        setGeneratedContent("");
        setEditedContent("");
      }
    }
  }, [isOpen, contentType, existingContent]);

  const fetchPrompt = async () => {
    try {
      const response = await fetch(`/api/content/prompts-v2/${contentType}`);
      if (response.ok) {
        const data = await response.json();
        setPrompt(data.prompt);
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error("Failed to fetch prompt:", err);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: contentType,
          context: context || undefined,
          regenerate: !!generatedContent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      setEditedContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (status: "draft" | "pending_approval") => {
    setIsSaving(true);
    setError(null);

    try {
      const contentToSave = editMode ? editedContent : generatedContent;
      
      if (existingContent) {
        // Update existing
        const response = await fetch(`/api/content/scheduled/${existingContent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: contentToSave,
            status,
          }),
        });

        if (!response.ok) throw new Error("Failed to update");
      } else {
        // Create new
        const response = await fetch("/api/content/scheduled", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_type: contentType,
            content: contentToSave,
            scheduled_for: scheduledFor.toISOString(),
            status,
          }),
        });

        if (!response.ok) throw new Error("Failed to create");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = async (versionPrompt: string) => {
    if (!prompt) return;

    try {
      const response = await fetch(`/api/content/prompts-v2/${contentType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: versionPrompt,
          change_notes: `Restored from version`,
        }),
      });

      if (response.ok) {
        fetchPrompt();
      }
    } catch (err) {
      console.error("Failed to restore version:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {existingContent ? "Edit" : "Generate"}: {CONTENT_TYPE_LABELS[contentType] || contentType}
            </h3>
            <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
              <Clock className="w-3 h-3" />
              <span>
                Scheduled for {scheduledFor.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-5">
          {/* Prompt Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-400">System Prompt</label>
              {versions.length > 0 && (
                <button
                  onClick={() => setShowVersions(!showVersions)}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  {versions.length} versions
                  {showVersions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
            
            <div className="bg-black/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400 font-mono max-h-[150px] overflow-y-auto">
              {prompt?.prompt || "Loading prompt..."}
            </div>

            {/* Version History */}
            {showVersions && versions.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                <div className="text-xs font-medium text-zinc-500">Version History</div>
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-2 hover:bg-zinc-900 rounded-lg"
                  >
                    <div className="text-xs text-zinc-400">
                      v{v.version} — {new Date(v.created_at).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(v.prompt)}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Context Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">
              Additional Context (optional)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., TSLA closed at $342, gamma strike at $345, overnight action..."
              rows={2}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-sm"
            />
          </div>

          {/* Generate Button */}
          {!generatedContent && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Content
                </>
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Generated Content Preview */}
          {generatedContent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-400">
                  Generated Content
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`text-xs px-2 py-1 rounded ${
                      editMode 
                        ? "bg-amber-500/20 text-amber-400" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Edit3 className="w-3 h-3 inline mr-1" />
                    {editMode ? "Editing" : "Edit"}
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
              </div>

              {editMode ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 bg-black border border-amber-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none font-mono text-sm"
                />
              ) : (
                <div className="bg-black border border-zinc-800 rounded-xl p-4 max-h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-mono">
                    {generatedContent}
                  </pre>
                </div>
              )}

              <div className="text-xs text-zinc-500 text-right">
                {(editMode ? editedContent : generatedContent).length} characters
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {generatedContent && (
          <div className="p-5 border-t border-zinc-800 flex items-center justify-between">
            <button
              onClick={() => handleSave("draft")}
              disabled={isSaving}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Save as Draft
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave("pending_approval")}
                disabled={isSaving}
                className="px-6 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Submit for Approval
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
