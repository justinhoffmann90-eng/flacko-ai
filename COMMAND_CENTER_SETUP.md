# Command Center Mission Control - Setup Guide

## Overview
The Command Center has been enhanced with 3 new features:
1. **Activity Feed** — Real-time log of all agent actions
2. **Calendar View** — Weekly view of scheduled cron jobs
3. **Global Search** — Search across memory files, templates, documents, and activity

## Current State
The components are functional with demo data. To enable full functionality, you need to complete the Convex setup.

## Convex Setup Instructions

### 1. Initialize Convex Project
```bash
cd /Users/trunks/Flacko_AI/flacko-ai
npx convex dev
```

This will:
- Prompt you to login/create a Convex account
- Create a new project
- Generate the proper `_generated` files
- Provide the deployment URL

### 2. Update Environment Variables
Add the Convex deployment URL to your `.env.local`:
```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=your-deployment-name
```

### 3. Update Providers
Once Convex is configured, update `app/providers.tsx` to always use ConvexProvider:
```tsx
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ToastProvider } from "@/components/ui/toast";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <ToastProvider>{children}</ToastProvider>
    </ConvexProvider>
  );
}
```

### 4. Update Components
Once Convex is set up, update the components to use the real Convex queries:

**ActivityFeed** — Uncomment the Convex imports and `useQuery` hook:
```tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const activities = useQuery(api.activities.getActivities, { limit: 50 });
```

**CalendarView** — Uncomment the Convex imports and `useQuery` hook:
```tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const jobs = useQuery(api.schedules.getScheduledJobs);
```

**GlobalSearch** — Uncomment the Convex imports and `useQuery` hook:
```tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const results = useQuery(api.search.searchDocuments, { query: debouncedQuery });
```

## File Indexing Script

Create a script to index workspace files into Convex for search:

```typescript
// scripts/index-files.ts
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const MEMORY_DIR = "~/clawd/memory";
const TEMPLATES_DIR = "~/clawd/templates";
const CHECKLISTS_DIR = "~/clawd/checklists";

async function indexFile(filePath: string, category: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const stats = fs.statSync(filePath);
  
  // Extract title from frontmatter or filename
  const { data, content: body } = matter(content);
  const title = data.title || path.basename(filePath);
  
  await fetchMutation(api.search.upsertDocument, {
    path: filePath,
    title,
    content: body,
    category,
    last_modified: stats.mtimeMs,
  });
}

async function indexAllFiles() {
  // Index memory files
  const memoryFiles = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith(".md"));
  for (const file of memoryFiles) {
    await indexFile(path.join(MEMORY_DIR, file), "memory");
  }
  
  // Index templates
  const templateFiles = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith(".md"));
  for (const file of templateFiles) {
    await indexFile(path.join(TEMPLATES_DIR, file), "template");
  }
  
  // Index checklists
  const checklistFiles = fs.readdirSync(CHECKLISTS_DIR).filter(f => f.endsWith(".md"));
  for (const file of checklistFiles) {
    await indexFile(path.join(CHECKLISTS_DIR, file), "checklist");
  }
  
  console.log("Indexing complete!");
}

indexAllFiles();
```

## API Endpoint for Logging Activities

The `/api/activity/log` endpoint is ready to receive activity logs:

```bash
curl -X POST http://localhost:3000/api/activity/log \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "report_generated",
    "description": "Daily TSLA report generated",
    "status": "success",
    "metadata": { "filePath": "~/reports/daily.md" }
  }'
```

## Files Created/Modified

### New Files
- `convex/schema.ts` — Database schema
- `convex/activities.ts` — Activity feed functions
- `convex/schedules.ts` — Calendar functions
- `convex/search.ts` — Search functions
- `convex/_generated/*` — Generated Convex types
- `components/command-center/activity-feed.tsx` — Activity Feed component
- `components/command-center/calendar-view.tsx` — Calendar View component
- `components/command-center/global-search.tsx` — Global Search component
- `components/command-center/index.ts` — Component exports
- `app/api/activity/log/route.ts` — Activity logging API

### Modified Files
- `app/admin/command-center/page.tsx` — Updated with new components and tabs
- `app/providers.tsx` — Added ConvexProvider
- `.env.local` — Added Convex environment variables

## Next Steps
1. Run `npx convex dev` to initialize the Convex project
2. Update environment variables with the deployment URL
3. Rebuild the app
4. Start using the Mission Control dashboard!

## Demo Data
The components currently show demo data until Convex is fully configured. This allows you to preview the UI while setting up the backend.
