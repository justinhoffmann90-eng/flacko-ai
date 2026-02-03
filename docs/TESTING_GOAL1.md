# Testing Guide: Goal 1 Content Management

Quick guide to test the new content management system.

---

## Prerequisites

1. **Dev server running:**
   ```bash
   cd /Users/trunks/Flacko_AI/flacko-ai
   npm run dev
   ```

2. **Logged in as admin user**
   - Visit http://localhost:3000
   - Login with admin account
   - Verify `is_admin = true` in users table

3. **At least one daily report exists**
   - Check `reports` table in Supabase
   - Note the `report_date` of latest report

---

## Test 1: Daily Mode Card

**Goal:** Generate the branded visual card from existing report

### Steps
1. Visit http://localhost:3000/admin/content
2. Select "Daily Mode Card" (should be selected by default)
3. Pick date of an existing report
4. Click "Generate"
5. Wait for preview to load

### Expected Result
- Status: "Ready"
- Preview shows HTML content (file:// URL)
- "Download Image" button appears
- Clicking download opens HTML file in browser
- HTML shows TSLA levels chart

### Known Limitations
- Returns HTML, not PNG (Puppeteer not yet integrated)
- file:// URL, not public URL
- Works only if `~/trading_inputs/daily-reports/TSLA_Daily_Report_YYYY-MM-DD.md` exists

---

## Test 2: HIRO EOD Recap

**Goal:** Generate tweet showing HIRO → price correlation

### Steps
1. Select "HIRO EOD Recap"
2. Pick any date
3. Click "Generate"

### Expected Result (Before Migration)
- Status: "Ready"
- Text preview shows placeholder recap
- Note at bottom: "HIRO readings table needs to be created"

### Expected Result (After Migration)
1. Run migration: Copy `migrations/003_hiro_readings.sql` to Supabase SQL Editor
2. Insert sample data (uncomment bottom section of migration)
3. Regenerate
4. Should show:
   - Morning reading with price movement
   - Midday reading with price movement
   - Afternoon reading with price movement
   - "HIRO called the direction all day" message

---

## Test 3: Forecast vs Actual

**Goal:** Generate tweets comparing yesterday's forecasts to actual results

### Steps
1. Select "Forecast vs Actual"
2. Pick TODAY's date (will automatically use yesterday's report)
3. Click "Generate"

### Expected Result
- Status: "Ready"
- Text preview shows 3 tweet options separated by `---`:
  - **Type A:** Level accuracy (e.g., "Yesterday's report: '$424 support'...")
  - **Type B:** Mode call recap (e.g., "Yesterday: 🟠 ORANGE MODE...")
  - **Type C:** Scenario outcome (e.g., "Yesterday's base case: 'Chop between...'")
- Click "Copy Text" → should copy all 3 tweets
- Paste into text editor → verify formatting

### Troubleshooting
- If error "Report not found": Yesterday might not have a report (weekend?)
- Try picking a Tuesday (uses Monday's report) or other weekday

---

## Test 4: Weekly Scorecard

**Goal:** Generate thread summarizing the week's performance

### Steps
1. Select "Weekly Scorecard"
2. Pick a Friday date (e.g., latest Friday)
3. Click "Generate"

### Expected Result
- Status: "Ready"
- Text preview shows thread format:
  ```
  📊 FLACKO AI WEEKLY SCORECARD
  Week of Feb 3, 2026

  THREAD 🧵

  ---

  Monday: 🟢 GREEN
  Called: [prediction]
  Result: ✅ Up 2.3%
  Grade: 4/5

  ---
  [... more days ...]

  WEEKLY SCORE: 72%
  ```
- Each day has mode emoji, prediction, result, grade
- Weekly summary shows what worked / what didn't

### Troubleshooting
- If no days shown: Week might not have reports yet
- Try previous week or a known week with reports
- Check `reports` table for available dates

---

## Test 5: Error Handling

**Goal:** Verify system handles errors gracefully

### Test Invalid Date
1. Select any content type
2. Pick a date far in the future (e.g., 2030-01-01)
3. Click "Generate"
4. Expected: Error message "Report not found for this date"

### Test Weekend Date
1. Select "Forecast vs Actual"
2. Pick a Sunday
3. Expected: Error (no Saturday report exists)

### Test Without Admin Access
1. Logout
2. Login with non-admin account
3. Try to visit `/admin/content`
4. Expected: Redirect or "Forbidden" error
5. Try API call directly:
   ```bash
   curl -X POST http://localhost:3000/api/content/generate \
     -H "Content-Type: application/json" \
     -d '{"type":"daily-mode-card","date":"2026-02-02"}'
   ```
6. Expected: 401 Unauthorized or 403 Forbidden

---

## Test 6: Data Flow

**Goal:** Verify each generator pulls correct data

### Daily Mode Card
- Check it reads from: `~/trading_inputs/daily-reports/TSLA_Daily_Report_YYYY-MM-DD.md`
- Check it runs: `~/clawd/tools/daily-chart/generate-chart.js`
- Check output saved to: `~/clawd/temp/daily-mode-card-YYYY-MM-DD.html`

### HIRO Recap
- Check it queries: `hiro_readings` table (after migration)
- Check it calls: Yahoo Finance API for price data
- Check it generates: Tweet text with correlations

### Forecast vs Actual
- Check it queries: `reports` table (yesterday's report)
- Check it calls: Yahoo Finance API
- Check it generates: 3 tweet types

### Weekly Scorecard
- Check it queries: All reports for the week (Mon-Fri)
- Check it calls: Yahoo Finance for each day
- Check it calculates: Scores and weekly %

---

## Verification Checklist

After running all tests:

- [ ] All 4 content types generate without errors
- [ ] Admin UI is responsive (desktop + mobile)
- [ ] Copy to clipboard works
- [ ] Error messages are clear
- [ ] Non-admin users cannot access
- [ ] Generated content is readable
- [ ] Date picker works correctly
- [ ] Preview updates after generation
- [ ] No console errors in browser

---

## Next Steps After Testing

1. **If Daily Mode Card works:** Test with real report, verify HTML looks correct
2. **If HIRO Recap shows placeholder:** Run migration to enable real data
3. **If Forecast vs Actual works:** Generate for last 5 days, verify accuracy
4. **If Weekly Scorecard works:** Generate for last 4 weeks, review scoring logic

5. **Add Puppeteer for images:**
   ```bash
   cd /Users/trunks/Flacko_AI/flacko-ai
   npm install puppeteer
   ```
   Then update `lib/content/daily-mode-card.ts` to use Puppeteer

6. **Set up Supabase storage:**
   - Create bucket: `content-assets`
   - Update generators to upload images
   - Return public URLs

---

## Troubleshooting

### "Report not found"
- Check `reports` table for available dates
- Verify `report_date` format is YYYY-MM-DD
- Try latest report date from database

### "Yahoo Finance API error"
- Check internet connection
- Yahoo might be rate limiting
- Try again in a few minutes
- Consider using cached data from reports

### "HIRO readings table not found"
- Normal before migration
- Will show placeholder text
- Run migration to fix

### Page won't load
- Check dev server is running: `npm run dev`
- Check console for errors
- Verify admin user is logged in
- Clear browser cache/cookies

### Copy button doesn't work
- Check browser permissions for clipboard
- Try different browser
- Manually select + copy text from preview

---

## Success Criteria

✅ **Phase 1 Complete When:**
- All 4 content types generate
- No critical errors
- Admin can preview and copy content
- Ready for Justin to review output quality

✅ **Phase 2 Complete When:**
- Images generate as PNG (not HTML)
- Images upload to Supabase storage
- Public URLs returned
- HIRO readings table populated
- Real-time data flows end-to-end
