"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface ContentHubData {
  weeklySchedule: Record<string, string>;
  customTypes: any[];
  renamedTitles: Record<string, string>;
  customSubtitles: Record<string, string>;
  customPrompts: Record<string, string>;
}

export function useContentHubSync(
  userId: string | null,
  data: Partial<ContentHubData>,
  onLoad: (data: Partial<ContentHubData>) => void
) {
  const isLoading = useRef(false);
  const lastSave = useRef<number>(0);

  // Load from cloud
  useEffect(() => {
    if (!userId || isLoading.current) return;
    
    const loadFromCloud = async () => {
      isLoading.current = true;
      try {
        const { data: cloudData, error } = await supabase
          .from("content_hub_data")
          .select("*")
          .eq("user_id", userId)
          .single();
        
        if (!error && cloudData) {
          console.log("[ContentHub] Loaded from cloud");
          onLoad({
            weeklySchedule: cloudData.weekly_schedule || {},
            customTypes: cloudData.custom_types || [],
            renamedTitles: cloudData.renamed_titles || {},
            customSubtitles: cloudData.custom_subtitles || {},
            customPrompts: cloudData.custom_prompts || {},
          });
        } else {
          console.log("[ContentHub] No cloud data, using localStorage");
        }
      } catch (err) {
        console.error("[ContentHub] Load error:", err);
      } finally {
        isLoading.current = false;
      }
    };
    
    loadFromCloud();
  }, [userId, onLoad]);

  // Save to cloud (debounced)
  const saveToCloud = useCallback(async (dataToSave: Partial<ContentHubData>) => {
    if (!userId) return;
    
    const now = Date.now();
    if (now - lastSave.current < 2000) return;
    lastSave.current = now;
    
    try {
      const { error } = await supabase
        .from("content_hub_data")
        .upsert({
          user_id: userId,
          weekly_schedule: dataToSave.weeklySchedule,
          custom_types: dataToSave.customTypes,
          renamed_titles: dataToSave.renamedTitles,
          custom_subtitles: dataToSave.customSubtitles,
          custom_prompts: dataToSave.customPrompts,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      
      if (error) {
        console.error("[ContentHub] Save error:", error);
      } else {
        console.log("[ContentHub] Saved to cloud");
      }
    } catch (err) {
      console.error("[ContentHub] Save failed:", err);
    }
  }, [userId]);

  return { saveToCloud, isLoading: isLoading.current };
}
