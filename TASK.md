# TASK: AI Template Editor

## Overview
Add an AI Template Editor to the Content Hub that lets users describe image cards in natural language and generates HTML/React components.

## Location
`app/admin/content/page.tsx` - Add new section called "AI Template Editor"

## Requirements

### UI Component
1. Add a new section below WeeklyScorecardSection
2. Include:
   - Text input for natural language description (e.g., "Create a quote card with dark background, centered white text, and a red accent border")
   - "Generate Template" button
   - Preview area showing rendered HTML
   - Code view toggle to see generated HTML/React
   - "Save as Component" button (future - just show code for now)

### API Endpoint
Create `app/api/content/generate-template/route.ts`:
- POST endpoint
- Takes: `{ description: string, type: "quote" | "levels" | "scorecard" | "custom" }`
- Uses Gemini 2.0 Flash to generate HTML
- Returns: `{ html: string, css?: string }`

### System Prompt for Template Generation
```
You are an expert UI designer. Generate clean, modern HTML for trading content cards.

Rules:
- Use inline styles (no external CSS)
- Dark theme: bg-black or bg-zinc-900, white/zinc text
- Brand colors: emerald for success, red for danger, purple for primary
- Clean typography: font-sans, appropriate sizing
- Mobile-friendly: reasonable widths, padding
- Return ONLY the HTML, no explanation
```

### Component Structure
```tsx
function AITemplateEditor() {
  const [description, setDescription] = useState("");
  const [templateType, setTemplateType] = useState<"quote" | "levels" | "scorecard" | "custom">("custom");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ html: string } | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ... implementation
}
```

## Files to Create/Modify
1. `app/api/content/generate-template/route.ts` - New API endpoint
2. `app/admin/content/page.tsx` - Add AITemplateEditor component and render it

## Style
Match existing Content Hub card styling:
- Gradient border glow effect
- `bg-zinc-950/80` background
- `border-zinc-800` borders
- Purple accent for this section (like AI Content Studio)

## DO NOT
- Modify any other files
- Change existing components
- Add new dependencies
