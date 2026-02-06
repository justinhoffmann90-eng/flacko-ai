"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { GeneratorCard } from "./generator-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONTENT_TYPES } from "@/lib/content/prompts";

interface CustomContentType {
  key: string;
  label: string;
}

export function GeneratorsTab() {
  const [customTypes, setCustomTypes] = useState<CustomContentType[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTypeTitle, setNewTypeTitle] = useState("");

  // Load custom types from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("content-hub-custom-types");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCustomTypes(parsed);
      } catch (e) {
        console.error("Failed to parse custom types:", e);
      }
    }
  }, []);

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
    localStorage.setItem("content-hub-custom-types", JSON.stringify(updatedTypes));

    // Reset form
    setNewTypeTitle("");
    setIsAddingNew(false);
  };

  const handleDeleteCustomType = (keyToDelete: string) => {
    const updatedTypes = customTypes.filter((type) => type.key !== keyToDelete);
    setCustomTypes(updatedTypes);
    localStorage.setItem("content-hub-custom-types", JSON.stringify(updatedTypes));

    // Also clean up associated data
    localStorage.removeItem(`content-hub-prompt-${keyToDelete}`);

    // Remove from renamed titles if present
    const renamedTitles = localStorage.getItem("content-hub-renamed-titles");
    if (renamedTitles) {
      const titles = JSON.parse(renamedTitles);
      delete titles[keyToDelete];
      localStorage.setItem("content-hub-renamed-titles", JSON.stringify(titles));
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
