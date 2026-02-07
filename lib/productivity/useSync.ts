"use client";

import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface ProductivityData {
  tasks: {
    backlog: any[];
    today: any[];
    progress: any[];
    complete: any[];
  };
  history: any[];
  game: any;
  ideas: any[];
  notes: string;
}

export function useProductivitySync(
  userId: string | null,
  data: ProductivityData,
  onLoad: (data: Partial<ProductivityData>) => void
) {
  const isLoading = useRef(false);
  const lastSave = useRef<number>(0);

  // Load from Supabase on mount
  useEffect(() => {
    if (!userId || isLoading.current) return;
    
    const load = async () => {
      isLoading.current = true;
      
      try {
        // Try Supabase first
        const { data: cloudData, error } = await supabase
          .from("productivity_data")
          .select("*")
          .eq("user_id", userId)
          .single();
        
        if (!error && cloudData) {
          console.log("[Productivity] Loaded from cloud");
          onLoad({
            tasks: cloudData.tasks,
            history: cloudData.history,
            game: cloudData.game,
            ideas: cloudData.ideas,
            notes: cloudData.notes,
          });
        } else {
          console.log("[Productivity] No cloud data, using localStorage");
          // Try localStorage fallback
          const local = localStorage.getItem("flacko-kanban-v4");
          if (local) {
            const tasks = JSON.parse(local);
            onLoad({ tasks });
          }
        }
      } catch (err) {
        console.error("[Productivity] Load error:", err);
      } finally {
        isLoading.current = false;
      }
    };
    
    load();
  }, [userId, onLoad]);

  // Save to Supabase (debounced)
  const saveToCloud = useCallback(async () => {
    if (!userId) return;
    
    // Debounce: only save every 2 seconds max
    const now = Date.now();
    if (now - lastSave.current < 2000) return;
    lastSave.current = now;
    
    try {
      const { error } = await supabase
        .from("productivity_data")
        .upsert({
          user_id: userId,
          tasks: data.tasks,
          history: data.history,
          game: data.game,
          ideas: data.ideas,
          notes: data.notes,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      
      if (error) {
        console.error("[Productivity] Save error:", error);
      } else {
        console.log("[Productivity] Saved to cloud");
      }
    } catch (err) {
      console.error("[Productivity] Save failed:", err);
    }
  }, [userId, data]);

  // Auto-save when data changes
  useEffect(() => {
    if (!userId || isLoading.current) return;
    
    const timeout = setTimeout(saveToCloud, 1000);
    return () => clearTimeout(timeout);
  }, [userId, data, saveToCloud]);

  return { saveToCloud };
}
