// Productivity Hub Supabase Sync
// Makes data persistent across devices and immune to browser clears

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ProductivityData {
  user_id: string;
  tasks: {
    backlog: Task[];
    today: Task[];
    progress: Task[];
    complete: Task[];
  };
  history: HistoryEntry[];
  game: GameData;
  ideas: Idea[];
  updated_at: string;
}

// Sync to Supabase (source of truth)
export async function syncToCloud(userId: string, data: Partial<ProductivityData>) {
  const { error } = await supabase
    .from("productivity_data")
    .upsert({
      user_id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    });
  
  if (error) {
    console.error("Sync error:", error);
    throw error;
  }
}

// Load from Supabase (primary), fallback to localStorage
export async function loadFromCloud(userId: string): Promise<ProductivityData | null> {
  const { data, error } = await supabase
    .from("productivity_data")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (error) {
    console.log("No cloud data found, using localStorage");
    return null;
  }
  
  return data;
}

// Database schema to run in Supabase:
/*
CREATE TABLE productivity_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  tasks JSONB DEFAULT '{"backlog":[],"today":[],"progress":[],"complete":[]}'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  game JSONB DEFAULT '{"xp":0,"level":1,"streak":0,"bestStreak":0,"lastActiveDate":null}'::jsonb,
  ideas JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE productivity_data ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can only access own productivity data"
  ON productivity_data
  FOR ALL
  USING (auth.uid() = user_id);
*/
