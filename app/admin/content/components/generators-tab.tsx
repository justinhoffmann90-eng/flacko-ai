"use client";

import { GeneratorCard } from "./generator-card";
import { CONTENT_TYPES } from "@/lib/content/prompts";

export function GeneratorsTab() {
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
      </div>
    </div>
  );
}
