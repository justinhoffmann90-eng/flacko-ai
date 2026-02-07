"use client";

import { useState, useEffect } from "react";
import { X, RotateCcw, Save, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getDefaultPrompt } from "@/lib/content/prompts";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: string;
  contentLabel: string;
  storageKey: string;
  onSaved?: () => void;
}

export function PromptEditorModal({
  isOpen,
  onClose,
  contentType,
  contentLabel,
  storageKey,
  onSaved,
}: PromptEditorModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadPrompt = async () => {
        try {
          // Try to load from cloud first
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: cloudData } = await supabase
              .from("content_hub_data")
              .select("custom_prompts")
              .eq("user_id", user.id)
              .single();
            
            if (cloudData?.custom_prompts && cloudData.custom_prompts[contentType]) {
              setPrompt(cloudData.custom_prompts[contentType]);
              setIsDirty(false);
              return;
            }
          }
          
          // Fallback to localStorage
          const saved = localStorage.getItem(storageKey);
          setPrompt(saved || getDefaultPrompt(contentType));
          setIsDirty(false);
        } catch (err) {
          console.error("Failed to load prompt:", err);
          const saved = localStorage.getItem(storageKey);
          setPrompt(saved || getDefaultPrompt(contentType));
        }
      };
      
      loadPrompt();
    }
  }, [isOpen, storageKey, contentType]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage
      localStorage.setItem(storageKey, prompt);
      
      // Save to cloud
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get existing custom prompts
        const { data: existingData } = await supabase
          .from("content_hub_data")
          .select("custom_prompts")
          .eq("user_id", user.id)
          .single();
        
        const customPrompts = existingData?.custom_prompts || {};
        customPrompts[contentType] = prompt;
        
        await supabase
          .from("content_hub_data")
          .upsert({
            user_id: user.id,
            custom_prompts: customPrompts,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
      }
      
      setIsDirty(false);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Failed to save prompt:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultPrompt = getDefaultPrompt(contentType);
    setPrompt(defaultPrompt);
    setIsDirty(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold">Edit Prompt</h3>
            <p className="text-sm text-zinc-500">{contentLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Prompt Template
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setIsDirty(true);
            }}
            className="w-full h-96 bg-zinc-900 border-zinc-800 text-zinc-200 font-mono text-sm resize-none focus:border-purple-500 focus:ring-purple-500/20"
            placeholder="Enter your prompt template here..."
          />
          <p className="mt-2 text-xs text-zinc-600">
            This prompt will be used when generating {contentLabel.toLowerCase()}. 
            Changes are saved to the cloud and synced across devices.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Cloud className="w-4 h-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
