# Goal 1 Implementation: Content Management System

**Status:** ✅ Phase 1 Complete (Core Infrastructure)  
**Date:** February 2, 2026  
**Developer:** Codex (Software Engineer Agent)

---

## Overview

Implemented content management system for generating social media content (X posts) to grow subscribers. Excludes Public Accuracy Page (#5).

### Implemented Items

1. ✅ **Daily Mode Card** - Branded visual card with mode, levels, and take
2. ✅ **HIRO EOD Recap** - Daily correlation between HIRO readings and price action
3. ✅ **Forecast vs Actual** - Yesterday's predictions vs actual results
4. ✅ **Weekly Scorecard** - Weekly transparency thread with wins/losses

---

## Architecture

### Admin UI
- **Location:** `/app/admin/content/page.tsx`
- **Access:** Admin users only
- **Features:**
  - Select content type (4 options)
  - Pick date
  - One-click generate
  - Preview (text + image)
  - Copy to clipboard
  - Download image

### API Routes
- **Endpoint:** `POST /api/content/generate`
- **Auth:** Requires admin authentication
- **Request:**
  ```json
  {
    "type": "daily-mode-card" | "hiro-recap" | "forecast-vs-actual" | "weekly-scorecard",
    "date": "2026-02-02"
  }
  ```
- **Response:**
  ```json
  {
    "text": "Generated tweet text...",
    "imageUrl": "https://..." // or file:// for local
  }
  ```

### Content Generators

#### 1. Daily Mode Card (`lib/content/daily-mode-card.ts`)
- **Purpose:** Generate branded visual card for X
- **Source:** Existing `~/clawd/tools/daily-chart/` 
- **Process:**
  1. Fetch report from database
  2. Find local report markdown file
  3. Run existing `generate-chart.js` script
  4. Return HTML output
- **TODO:** 
  - [ ] Add Puppeteer screenshot generation
  - [ ] Upload to Supabase storage
  - [ ] Return public URL instead of file://

#### 2. HIRO EOD Recap (`lib/content/hiro-recap.ts`)
- **Purpose:** Show HIRO → price correlation after market close
- **Source:** `hiro_readings` table (to be created) + Yahoo Finance
- **Process:**
  1. Fetch HIRO readings for date (9am, 11am, 1pm, 3pm)
  2. Fetch intraday price data
  3. Correlate signals with price movements
  4. Format as X post
- **Current State:** Returns placeholder text
- **TODO:**
  - [ ] Create `hiro_readings` table (see migration)
  - [ ] Add manual entry UI for HIRO readings
  - [ ] Add screenshot OCR pipeline (future)

#### 3. Forecast vs Actual (`lib/content/forecast-vs-actual.ts`)
- **Purpose:** Prove accuracy using yesterday's forecasts
- **Source:** Previous day's report + Yahoo Finance
- **Process:**
  1. Fetch yesterday's report
  2. Fetch actual price data for yesterday
  3. Generate 3 tweet types:
     - Type A: Level accuracy
     - Type B: Mode call recap
     - Type C: Scenario outcome
  4. Return all 3 as options
- **Current State:** ✅ Working (generates draft tweets)

#### 4. Weekly Scorecard (`lib/content/weekly-scorecard.ts`)
- **Purpose:** Weekly transparency thread
- **Source:** All reports from the week + price data
- **Process:**
  1. Get reports for Mon-Fri of target week
  2. Score each day (level accuracy + mode accuracy)
  3. Calculate weekly % score
  4. Format as X thread (main + replies)
- **Current State:** ✅ Working (generates draft thread)

---

## Data Sources

### Yahoo Finance Integration
- **File:** `lib/price/yahoo-finance.ts`
- **Function:** `getIntradayPriceData(date: string)`
- **Returns:**
  - OHLC prices
  - Volume
  - Change %
  - Intraday snapshots (9am, 11am, 1pm, 3pm)
- **API:** Yahoo Finance unofficial chart API
- **Note:** May break. Consider paid API for production.

### Daily Reports
- **Table:** `reports`
- **Data:** Full markdown + extracted data
- **Used by:** All 4 generators

### HIRO Readings (Not Yet Created)
- **Table:** `hiro_readings` (see migration)
- **Fields:**
  - `timestamp` - When reading was taken
  - `value` - HIRO value in millions
  - `signal` - bullish/bearish/neutral
  - `price_at_reading` - TSLA price at time
  - `source` - manual/screenshot_ocr/api
  - `notes` - Optional context

---

## File Storage Strategy

### Current (Phase 1)
- Daily Mode Card HTML saved to: `~/clawd/temp/daily-mode-card-{date}.html`
- Returns `file://` URLs for local preview

### Planned (Phase 2)
- Use Supabase Storage bucket: `content-assets`
- Folder structure:
  ```
  content-assets/
  ├── daily-mode-cards/
  │   └── 2026-02-02.png
  ├── hiro-recaps/ (if images added)
  └── weekly-scorecards/ (if images added)
  ```
- Return public URLs: `https://[project].supabase.co/storage/v1/object/public/...`

---

## Testing

### Test Daily Mode Card
1. Visit `/admin/content` (must be logged in as admin)
2. Select "Daily Mode Card"
3. Pick a date with an existing report (e.g., latest report date)
4. Click "Generate"
5. Preview HTML (file:// link)
6. TODO: Once Puppeteer added, should see PNG preview

### Test HIRO Recap
1. **Current:** Will show placeholder text
2. **After migration:** 
   - Run migration: `migrations/003_hiro_readings.sql`
   - Insert sample HIRO readings
   - Regenerate - should show real correlation

### Test Forecast vs Actual
1. Select "Forecast vs Actual"
2. Pick TODAY (will use yesterday's report)
3. Generate
4. Should see 3 tweet options (Type A, B, C)
5. Copy any tweet to clipboard

### Test Weekly Scorecard
1. Select "Weekly Scorecard"
2. Pick any date in a week with 3+ reports
3. Generate
4. Should see thread with day-by-day scores
5. Weekly % calculated

---

## Database Migration

**File:** `migrations/003_hiro_readings.sql`

**To Run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy/paste migration SQL
3. Execute
4. Verify table created: `hiro_readings`
5. (Optional) Insert sample data for testing

**RLS Policies:**
- Admins: Full access
- Subscribers: Read-only access

---

## Next Steps (Phase 2)

### High Priority
1. **Image Generation Pipeline**
   - [ ] Add Puppeteer dependency
   - [ ] Create screenshot function in `lib/content/screenshot.ts`
   - [ ] Upload to Supabase storage
   - [ ] Update all generators to use real image URLs

2. **HIRO Readings Management**
   - [ ] Create admin UI: `/admin/hiro-readings`
   - [ ] Manual entry form (timestamp, value, signal, price)
   - [ ] Bulk import from CSV
   - [ ] Screenshot upload + OCR (future)

3. **Content Preview Improvements**
   - [ ] Add tweet preview with X-style UI
   - [ ] Character count for tweets
   - [ ] Image preview modal
   - [ ] Edit before copy

### Medium Priority
4. **Automation**
   - [ ] Schedule daily generation (cron job)
   - [ ] Auto-send draft to Telegram for approval
   - [ ] Track which content was posted

5. **Analytics**
   - [ ] Store generated content in `content_history` table
   - [ ] Track: generated_at, posted_at, impressions, engagement
   - [ ] Admin dashboard showing performance

### Low Priority
6. **Alternative Data Sources**
   - [ ] Consider paid API for price data (Alpha Vantage, IEX)
   - [ ] Direct integration with TradingView
   - [ ] Cache price data from daily reports

---

## Known Issues

1. **Yahoo Finance API**
   - Unofficial API, may break
   - Rate limits unknown
   - Consider replacing with paid API

2. **Image Generation**
   - Currently returns file:// URLs
   - Not suitable for production
   - Needs Puppeteer + storage upload

3. **HIRO Readings**
   - Table not created yet
   - Manual entry required
   - No OCR pipeline

4. **Score Calculation**
   - Weekly scorecard scoring is simplified
   - Need to refine accuracy metrics
   - Should match Justin's manual assessments

---

## Files Changed

### New Files
```
app/admin/content/page.tsx                    - Admin UI
app/api/content/generate/route.ts             - API endpoint
lib/content/daily-mode-card.ts                - Generator
lib/content/hiro-recap.ts                     - Generator
lib/content/forecast-vs-actual.ts             - Generator
lib/content/weekly-scorecard.ts               - Generator
lib/price/yahoo-finance.ts                    - Price data fetcher
migrations/003_hiro_readings.sql              - Database migration
docs/GOAL1_IMPLEMENTATION.md                  - This file
```

### Modified Files
- None (all new additions)

---

## Developer Notes

### Why Local Storage First?
- Get core functionality working quickly
- Test content generation workflow
- Justin can preview locally before adding image upload complexity
- Easy to switch to Supabase storage later

### Why Yahoo Finance?
- Free, no API key required
- Good enough for MVP
- Easy to replace later if needed
- Alternative: Parse existing daily journals for price data

### Why Separate Generators?
- Each content type has unique logic
- Easy to test/modify independently
- Clear separation of concerns
- Can add new types without touching existing code

---

## Deployment Checklist

Before deploying to production:

- [ ] Run HIRO readings migration in Supabase
- [ ] Test all 4 content types with real data
- [ ] Add Puppeteer for image generation
- [ ] Set up Supabase storage bucket
- [ ] Test image upload/download
- [ ] Update image URLs to public URLs
- [ ] Test on mobile preview
- [ ] Add error handling for missing data
- [ ] Add loading states in UI
- [ ] Test with various date ranges

---

## Questions for Justin

1. **HIRO Data Entry:** Manual entry OK for now, or build OCR pipeline immediately?
2. **Image Storage:** Supabase storage OK, or prefer different solution (S3, Cloudinary)?
3. **Price Data:** Yahoo Finance OK, or invest in paid API now?
4. **Automation:** Should daily generation auto-run, or always manual trigger?
5. **Scoring Logic:** Review weekly scorecard scoring - does it match your assessment method?

---

**Commit:** `b75497f`  
**Build Status:** ✅ Successful  
**Tests:** Manual testing required (no automated tests yet)
