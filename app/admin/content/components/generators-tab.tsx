"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Cloud } from "lucide-react";
import { GeneratorCard } from "./generator-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONTENT_TYPES } from "@/lib/content/prompts";
import { createClient } from "@/lib/supabase/client";

interface CustomContentType {
  key: string;
  label: string;
}

const supabase = createClient();

export function GeneratorsTab() {
  const [customTypes, setCustomTypes] = useState<CustomContentType[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTypeTitle, setNewTypeTitle] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced">("idle");
  const lastSave = useRef<number>(0);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  // Load custom types from cloud first, then localStorage
  useEffect(() => {
    if (!userId) return;
    
    const loadData = async () => {
      try {
        // Try cloud first
        const { data: cloudData, error } = await supabase
          .from("content_hub_data")
          .select("custom_types")
          .eq("user_id", userId)
          .single();
        
        if (!error && cloudData?.custom_types && cloudData.custom_types.length > 0) {
          console.log("[GeneratorsTab] Loaded from cloud");
          setCustomTypes(cloudData.custom_types);
          setSyncStatus("synced");
          return;
        }
        
        // Fallback to localStorage
        const stored = localStorage.getItem("content-hub-custom-types");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setCustomTypes(parsed);
            // Also save to cloud
            saveToCloud(parsed);
          } catch (e) {
            console.error("Failed to parse custom types:", e);
          }
        }
      } catch (err) {
        console.error("[GeneratorsTab] Load error:", err);
      }
    };
    
    loadData();
  }, [userId]);

  // Save to cloud
  const saveToCloud = async (types: CustomContentType[]) => {
    if (!userId) return;
    
    const now = Date.now();
    if (now - lastSave.current < 2000) return;
    lastSave.current = now;
    
    setSyncStatus("syncing");
    
    try {
      const { error } = await supabase
        .from("content_hub_data")
        .upsert({
          user_id: userId,
          custom_types: types,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      
      if (error) {
        console.error("[GeneratorsTab] Save error:", error);
        setSyncStatus("idle");
      } else {
        setSyncStatus("synced");
        // Also update localStorage as backup
        localStorage.setItem("content-hub-custom-types", JSON.stringify(types));
      }
    } catch (err) {
      console.error("[GeneratorsTab] Save failed:", err);
      setSyncStatus("idle");
    }
  };

  const handleAddCustomType = () => {
    const trimmedTitle = newTypeTitle.trim();
    if (!trimmedTitle) return;

    const key = `custom_${Date.now()}`;
    const newType: CustomContentType = {
      key,
      label: trimmedTitle,
    };

    const updatedTypes = [...customTypes, newType];
    setCustomTypes(updatedTypes);
    saveToCloud(updatedTypes);

    // Reset form
    setNewTypeTitle("");
    setIsAddingNew(false);
  };

  const handleDeleteCustomType = async (keyToDelete: string) => {
    const updatedTypes = customTypes.filter((type) => type.key !== keyToDelete);
    setCustomTypes(updatedTypes);
    
    // Save to cloud
    await saveToCloud(updatedTypes);

    // Also clean up associated data from localStorage
    localStorage.removeItem(`content-hub-prompt-${keyToDelete}`);

    // Remove from renamed titles if present (also sync to cloud)
    const renamedTitles = localStorage.getItem("content-hub-renamed-titles");
    if (renamedTitles) {
      const titles = JSON.parse(renamedTitles);
      delete titles[keyToDelete];
      localStorage.setItem("content-hub-renamed-titles", JSON.stringify(titles));
      // Also sync renamed titles to cloud
      await supabase
        .from("content_hub_data")
        .upsert({
          user_id: userId,
          renamed_titles: titles,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddCustomType();
    } else if (e.key === "Escape") {
      setIsAddingNew(false);
      setNewTypeTitle("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Content Generators</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Generate trading content with customizable AI prompts
          </p>
        </div>
        {syncStatus === "syncing" && (
          <span className="text-sm text-purple-400 flex items-center gap-1">
            <Cloud className="w-4 h-4" /> Syncing...
          </span>
        )}
        {syncStatus === "synced" && (
          <span className="text-sm text-green-400 flex items-center gap-1">
            <Cloud className="w-4 h-4" /> Cloud Saved
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-4">
        {CONTENT_TYPES.map((contentType) => (
          <GeneratorCard
            key={contentType.key}
            contentKey={contentType.key}
            label={contentType.label}
            storageKey={`content-hub-prompt-${contentType.key}`}
          />
        ))}

        {customTypes.map((customType) => (
          <GeneratorCard
            key={customType.key}
            contentKey={customType.key}
            label={customType.label}
            storageKey={`content-hub-prompt-${customType.key}`}
            onTitleChange={(newTitle) => {
              const updatedTypes = customTypes.map((t) =>
                t.key === customType.key ? { ...t, label: newTitle } : t
              );
              setCustomTypes(updatedTypes);
              localStorage.setItem(
                "content-hub-custom-types",
                JSON.stringify(updatedTypes)
              );
            }}
            onDelete={() => handleDeleteCustomType(customType.key)}
          />
        ))}
      </div>

      {/* Add Content Type Section */}
      <div className="pt-4 border-t border-zinc-800">
        {isAddingNew ? (
          <div className="flex items-center gap-3">
            <Input
              placeholder="Enter content type name..."
              value={newTypeTitle}
              onChange={(e) => setNewTypeTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="max-w-sm bg-zinc-900 border-zinc-700 text-zinc-200"
              autoFocus
            />
            <Button
              onClick={handleAddCustomType}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Add
            </Button>
            <Button
              onClick={() => {
                setIsAddingNew(false);
                setNewTypeTitle("");
              }}
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsAddingNew(true)}
            variant="outline"
            className="flex items-center gap-2 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
          >
            <Plus className="w-4 h-4" />
            Add Content Type
          </Button>
        )}
      </div>
    </div>
  );
}
