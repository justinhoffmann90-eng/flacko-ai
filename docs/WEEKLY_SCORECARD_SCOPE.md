# Weekly Scorecard Thread - Implementation Scope

## Overview
Complete the Weekly Scorecard Thread feature for the Content Hub. Transform weekly trading performance data into a formatted X thread with header image.

**Deploy to:** https://www.flacko.ai/admin/content

## Current State
- Partial implementation exists at `lib/content/weekly-scorecard.ts`
- Has basic `generateWeeklyScorecard()` function
- Fetches reports from Supabase, scores days, generates monolithic text
- Missing: proper tweet formatting, header image, API endpoints, admin UI

## Deliverables

### 1. Complete `lib/accuracy/aggregateWeekly.ts`
Extract weekly aggregation logic from existing code:
```typescript
interface WeeklyAggregate {
  weekStart: string;           // YYYY-MM-DD
  weekEnd: string;
  tradingDays: number;         // Usually 5
  totalGrade: number;
  maxGrade: number;
  weeklyScore: number;         // Percentage
  modeBreakdown: {
    green: { days: number; avgScore: number };
    yellow: { days: number; avgScore: number };
    orange: { days: number; avgScore: number };
    red: { days: number; avgScore: number };
  };
  bestDay: { date: string; score: number };
  worstDay: { date: string; score: number };
  dayScores: DayScore[];
}
```

### 2. Complete `lib/content/formatThread.ts`
Convert aggregated data to tweet array (each under 280 chars):
```typescript
interface Tweet {
  index: number;              // 1-based
  text: string;               // Max 280 chars
  isHeader: boolean;          // First tweet
}

function formatWeeklyThread(data: WeeklyAggregate): Tweet[]
```

**Thread structure:**
- Tweet 1: Week summary + headline stat + "THREAD 🧵"
- Tweets 2-5: Daily highlights (best/notable days)
- Tweet 6: "What worked / What didn't" summary
- Tweet 7: CTA + flacko.ai/accuracy link

### 3. Create `components/cards/WeeklyScorecardCard.tsx`
Header image component for @vercel/og generation (1200x675px):
- Week dates prominent
- Weekly score as large number
- Mode breakdown pie/bar
- "Flacko AI" branding

Reference `lib/content/daily-mode-card.ts` for HTML generation pattern.

### 4. API Endpoints

**GET `/api/accuracy/weekly`**
Query: `?week=YYYY-WW` or `?date=YYYY-MM-DD`
Returns: `WeeklyAggregate` JSON

**GET `/api/content/weekly-thread`**
Query: `?week=YYYY-WW`
Returns: `{ tweets: Tweet[], imageUrl: string }`

**GET `/api/cards/weekly-scorecard`**
Query: `?week=YYYY-WW`
Returns: PNG image (use @vercel/og ImageResponse)

### 5. Admin UI at `/admin/content`
Add Weekly Scorecard section:
- Week selector (date picker)
- "Generate Thread" button
- Preview: shows header image + tweet thread
- "Copy Thread" button (copies all tweets)
- "Approve & Save" button (stores draft)

## Technical Notes

### Existing Patterns to Follow
- Supabase client: `import { createServiceClient } from "@/lib/supabase/server"`
- Price data: `import { getIntradayPriceData } from "@/lib/price/yahoo-finance"`
- Date handling: `date-fns` (already installed)
- Image generation: HTML string approach like `daily-mode-card.ts`

### Database
Reports table has:
- `report_date` (DATE)
- `extracted_data` (JSONB) - contains mode, levels, scenarios
- `parsed_data` (JSONB)

### Tweet Formatting Rules
- Max 280 characters per tweet
- Use emojis sparingly but effectively
- Include $TSLA hashtag in first tweet
- End thread with flacko.ai link

## Acceptance Criteria
1. [ ] Weekly aggregation calculates correctly for Mon-Fri
2. [ ] Thread generates 5-7 tweets, each under 280 chars
3. [ ] Header image renders at 1200x675px with week stats
4. [ ] API endpoints return correct data
5. [ ] Admin UI allows preview and copy of thread
6. [ ] Deployed to production at /admin/content

## Files to Create/Modify
- `lib/accuracy/aggregateWeekly.ts` (NEW)
- `lib/content/formatThread.ts` (NEW)
- `lib/content/weekly-scorecard.ts` (MODIFY - refactor to use new modules)
- `components/cards/WeeklyScorecardCard.tsx` (NEW)
- `app/api/accuracy/weekly/route.ts` (NEW)
- `app/api/content/weekly-thread/route.ts` (NEW)
- `app/api/cards/weekly-scorecard/route.ts` (NEW)
- `app/admin/content/page.tsx` (MODIFY - add weekly section)

## Testing
After implementation:
```bash
cd /Users/trunks/Flacko_AI/flacko-ai
npm run build
npm run dev
# Test endpoints manually
# Deploy: vercel --prod
```

## Notify When Done
Message Justin on Telegram when complete.
