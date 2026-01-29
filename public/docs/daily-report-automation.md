# TSLA Daily Report Automation Spec

**Version:** 1.1
**Last Updated:** January 28, 2026
**Owner:** Trunks (Clawdbot)

---

## Overview

Automated pipeline to generate daily TSLA trading reports:

1. Capture screenshots from TradingView
2. Capture HIRO screenshot from SpotGamma
3. Extract FlowPatrol data from SpotGamma (browser text extraction)
4. Generate report with BX-Trender verification
5. Convert to PDF and send for review
6. Upload to flacko.ai after approval

**Total time:** ~20 minutes
**Trigger:** 3:00 PM CT daily (market days only)

---

## Timeline

| Time | Step | Duration |
|------|------|----------|
| 3:00 PM | Screenshots + FlowPatrol extraction | 5 min |
| 3:05 PM | Generate report draft | 5 min |
| 3:10 PM | Send BX-Trender readings for confirmation | — |
| 3:12 PM | After confirmation → finalize report | 3 min |
| 3:15 PM | Convert to PDF, send to Telegram | 2 min |
| 3:17 PM | Justin reviews | — |
| 3:20 PM | After "approved" → upload to flacko.ai | 2 min |

---

## Step 1: Create Dated Folder

```bash
mkdir -p ~/Desktop/Flacko_AI/daily-captures/$(date +%Y-%m-%d)
```

Example: `~/Desktop/Flacko_AI/daily-captures/2026-01-29/`

**Note:** This folder is on iCloud — accessible from Justin's MacBook.

---

## Step 2: Capture TradingView Screenshots

**Login:** Already authenticated in clawd browser profile

### TSLA Charts (4 screenshots)

| Filename | Symbol | Timeframe | Saved Layout URL |
|----------|--------|-----------|------------------|
| TSLA_Weekly.png | TSLA | 1W | https://www.tradingview.com/chart/tNbIrfO6/ |
| TSLA_Daily.png | TSLA | 1D | https://www.tradingview.com/chart/WnaUUzOg/ |
| TSLA_4H.png | TSLA | 4H | https://www.tradingview.com/chart/nZrr0NjL/ |
| TSLA_1H.png | TSLA | 1H | https://www.tradingview.com/chart/a2s4ajN3/ |

### QQQ Charts (2 screenshots)

| Filename | Symbol | Timeframe | Saved Layout URL |
|----------|--------|-----------|------------------|
| QQQ_Weekly.png | QQQ | 1W | https://www.tradingview.com/chart/aa4fqoaY/ |
| QQQ_Daily.png | QQQ | 1D | https://www.tradingview.com/chart/PiCNUPvL/ |

### Capture Method

For each chart:
1. Navigate to saved layout URL
2. Wait for chart to load (2-3 seconds)
3. **Verify watchlist/right panel is visible** — if collapsed, click to expand
4. Take screenshot
5. Save to `~/Desktop/Flacko_AI/daily-captures/YYYY-MM-DD/`

**⚠️ CRITICAL:** Watchlist must be visible in every screenshot. Check before each capture.

---

## Step 3: Capture SpotGamma HIRO

**URL:** https://dashboard.spotgamma.com/hiro

### Pre-Screenshot Checklist
- [ ] **Right sidebar is visible** (not collapsed)
  - If collapsed: Click "Chart Sizing Options" icon → Click "Open Sidebar"
- [ ] **"HIRO Upgraded" toggle is OFF** (showing legacy view)

### Capture
- Filename: `SpotGamma_TSLA_HIRO.png`
- Save to: `~/Desktop/Flacko_AI/daily-captures/YYYY-MM-DD/`

---

## Step 4: Extract FlowPatrol Data

**Method:** Browser text extraction (NOT PDF download)

### Process

1. Navigate to: `https://dashboard.spotgamma.com/reports`
2. Click on today's report: "FlowPatrol YYYY-MM-DD"
3. Wait for report to render (3-5 seconds)
4. Take browser snapshot to extract all text content
5. Parse and format the following sections:
   - Executive Summary
   - Index ETF Positioning table
   - Single Stock Positioning table
   - Sector Breakdown table
   - Directional Positioning (Delta table)
   - Gamma Positioning table
   - Volatility Positioning (Vega table)
   - Statistically Significant Positions table
   - Heavy DayTrading/Algo Flow table

6. Save extracted content to: `~/Desktop/Flacko_AI/daily-captures/YYYY-MM-DD/FlowPatrol_extracted.md`

### What We Get
- ✅ All numerical data (delta, gamma, vega exposures)
- ✅ All percentile rankings
- ✅ All position tables
- ✅ Executive summary and analysis text
- ❌ Visual charts/heatmaps (pages 10-13, 15-17) — not needed for report generation

---

## Step 5: Verify All Files Present

Before generating report, confirm these files exist:

```
~/Desktop/Flacko_AI/daily-captures/YYYY-MM-DD/
├── TSLA_Weekly.png
├── TSLA_Daily.png
├── TSLA_4H.png
├── TSLA_1H.png
├── QQQ_Weekly.png
├── QQQ_Daily.png
├── SpotGamma_TSLA_HIRO.png
└── FlowPatrol_extracted.md
```

**If any file missing:** Stop and notify Justin via Telegram.

---

## Step 6: Generate Report

### Reference Files

```
~/Desktop/Flacko_AI/reference/Rulebook_v2.8.md
~/Desktop/Flacko_AI/reference/Daily_Report_Guide_v3.3.md
```

### Process

1. Read the Rulebook and Guide
2. Analyze TradingView screenshots for BX-Trender readings
3. Incorporate FlowPatrol data
4. Generate report following the Guide template exactly
5. **STOP before finalizing mode determination**

---

## Step 7: BX-Trender Verification (CRITICAL)

**⚠️ Human-in-the-loop required**

Before finalizing the report, send BX-Trender readings to Justin via Telegram:

```
📊 BX-Trender Readings — Please Confirm

TSLA Weekly: 🟢 GREEN (price above cloud, momentum positive)
TSLA Daily: 🟡 YELLOW (mixed signals, price near cloud)
TSLA 4H: 🟢 GREEN (...)
TSLA 1H: 🟢 GREEN (...)

QQQ Weekly: 🟢 GREEN (...)
QQQ Daily: 🟢 GREEN (...)

Proposed Mode: 🟢 GREEN
Daily Cap: 100%

Please reply "confirmed" or correct any readings.
```

**Wait for Justin's response before proceeding.**

---

## Step 8: Finalize Report

After BX-Trender confirmation:

1. Finalize mode and daily cap based on confirmed readings
2. Complete all report sections
3. Save to: `~/Desktop/Flacko_AI/daily-reports/TSLA_Daily_Report_YYYY-MM-DD.md`

---

## Step 9: Generate PDF Preview

### Process

1. Convert markdown to styled HTML:
   ```bash
   pandoc [report.md] -o [report.html] --standalone
   ```

2. Open HTML in browser

3. Print to PDF via browser

4. Send PDF to Justin via Telegram:
   ```
   📄 TSLA Daily Report — YYYY-MM-DD
   
   Please review and reply "approved" to publish.
   ```

---

## Step 10: Upload to flacko.ai

**Trigger:** Justin replies "approved" (or similar confirmation)

### Process

1. Navigate to flacko.ai admin panel
2. Upload the markdown file
3. Confirm upload successful
4. Notify Justin:
   ```
   ✅ Report published to flacko.ai
   ```

---

## Error Handling

| Issue | Action |
|-------|--------|
| TradingView screenshot fails | Retry 2x, then notify Justin |
| Watchlist collapsed | Click to expand, then screenshot |
| SpotGamma login expired | Notify Justin to re-authenticate |
| FlowPatrol not available yet | Wait 5 min, retry, then notify Justin |
| FlowPatrol extraction fails | Notify Justin — may need manual PDF |
| BX-Trender reads uncertain | Default to more conservative mode, note uncertainty |
| Report generation fails | Log error, notify Justin with details |
| flacko.ai upload fails | Retry 3x, then notify Justin |

---

## File Dependencies

Ensure these reference files exist and are current:

| File | Purpose |
|------|---------|
| `~/Desktop/Flacko_AI/reference/Rulebook_v2.8.md` | Trading rules and mode definitions |
| `~/Desktop/Flacko_AI/reference/Daily_Report_Guide_v3.3.md` | Report template and structure |

### Folder Structure (iCloud-synced)

```
~/Desktop/Flacko_AI/
├── daily-captures/
│   └── YYYY-MM-DD/
│       ├── TSLA_Weekly.png
│       ├── TSLA_Daily.png
│       ├── TSLA_4H.png
│       ├── TSLA_1H.png
│       ├── QQQ_Weekly.png
│       ├── QQQ_Daily.png
│       ├── SpotGamma_HIRO.png
│       └── FlowPatrol_extracted.md
├── daily-reports/
│   └── TSLA_Daily_Report_YYYY-MM-DD.md
└── reference/
    ├── Rulebook_v2.8.md
    └── Daily_Report_Guide_v3.3.md
```

---

## Session Conflict Warning

**⚠️ Important:** Opening TradingView/SpotGamma in clawd browser may log Justin out on his MacBook (shared sessions).

**Mitigation:** 
- Only run this automation at the scheduled 3:00 PM time
- Notify Justin before starting if running manually

---

## Success Criteria

A successful run produces:
1. ✅ All 7 screenshots captured with watchlist visible
2. ✅ FlowPatrol data extracted
3. ✅ BX-Trender readings confirmed by Justin
4. ✅ Report PDF reviewed and approved
5. ✅ Report uploaded to flacko.ai
6. ✅ Total time under 25 minutes

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-01-28 | HIRO sidebar fix (right not left), iCloud paths, correct guide version |
| 1.0 | 2026-01-28 | Initial spec — FlowPatrol extraction via browser instead of PDF download |

