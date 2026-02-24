# ⚔️ Paper Flacko — Automated Paper Trading Bot

An automated paper trading bot that simulates TSLA trades using Flacko AI's daily report methodology.

## Overview

**Bot Identity:** "Paper Flacko" — Lord Pretty Flacko voice, battlefield trader persona
**Starting Capital:** $100,000 USD
**Asset:** TSLA shares (Phase 1), Options (Phase 2)

## Architecture

```
flacko-ai/
├── scripts/paper-trader/
│   ├── index.ts          # Main bot loop & controller
│   ├── decision-engine.ts # Trading logic & signals
│   ├── data-feed.ts      # Price/HIRO/data fetching
│   ├── discord-poster.ts # Discord message formatting
│   ├── performance.ts    # P&L tracking & reporting
│   └── types.ts          # TypeScript interfaces
├── lib/paper-trader/
│   ├── schema.sql        # Database schema
│   └── config.ts         # Configuration constants
```

## Quick Start

### 1. Install Dependencies

```bash
cd ~/Flacko_AI/flacko-ai
npm install
```

### 2. Set Up Database

Run `lib/paper-trader/schema.sql` in Supabase SQL Editor.

### 3. Configure Environment

Add to `.env.local`:

```bash
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
PAPER_TRADER_DISCORD_TOKEN=your_discord_token
PAPER_TRADER_CHANNEL_ID=your_channel_id

# Optional (for live HIRO)
SPOT_GAMMA_API_KEY=your_spotgamma_key
```

### 4. Start the Bot

```bash
# Development (runs once)
npm run paper-trader:once

# Production (runs continuously)
npm run paper-trader:start
```

## How It Works

### Data Sources

| Data | Source | Frequency |
|------|--------|-----------|
| TSLA Price | Yahoo Finance | 15 minutes |
| HIRO Flow | SpotGamma API | 1 hour |
| Daily Report | Supabase | Daily 8am CT |
| Key Levels | Supabase | Daily 8am CT |

### Decision Engine

**Entry Criteria:**
- Price near support (Put Wall, Gamma Strike)
- Mode is GREEN/YELLOW (favorable)
- HIRO not in lower quartile
- Price > Master Eject
- R/R ratio > 1.5

**Exit Criteria:**
- Target hit (Gamma Strike)
- Stop hit (below Master Eject)
- Mode flipped to RED
- HIRO extreme negative
- Near market close with profit

### Position Sizing

| Mode | Max Position | Logic |
|------|--------------|-------|
| 🟢 GREEN | 25% | $25K |
| 🟡 YELLOW | 15% | $15K |
| 🟠 ORANGE | 10% | $10K |
| 🔴 RED | 5% or flat | Defensive |

### Posting Schedule

- **Every 15 min:** Status update with price, position, P&L, Flacko's take
- **Every 1 hour:** HIRO update with flow analysis
- **Immediate:** Trade entry/exit alerts
- **Market open/close:** Daily bookends
- **Sunday evening:** Weekly performance report

## Risk Management

1. **Never >25%** of capital on single trade
2. **Always stop** below Master Eject
3. **No new positions after 3pm** CT
4. **Reduce size** in ORANGE/RED mode
5. **Exit on mode flip** to RED
6. **Max 2 trades/day**

## Database Schema

### paper_trades
Stores all buy/sell transactions with reasoning and context.

### paper_portfolio
Daily snapshots of portfolio state for performance tracking.

### paper_bot_state
Current bot state (singleton table for persistence).

### paper_hiro_cache
Cached HIRO readings for fallback.

## Bot Voice Examples

**Bullish:**
> "gamma strike held. dealers buying. i'm in."

**Cautious:**
> "hedge wall acting as ceiling. volume drying up. trimming here."

**Stop hit:**
> "master eject tagged. i'm out. -$180 but kept it small."

**Flat market:**
> "chop zone. no edge. sitting on hands."

## Commands

```bash
# Start bot
npm run paper-trader:start

# Run single iteration (for testing)
npm run paper-trader:once

# View logs
npm run paper-trader:logs
```

## Monitoring

The bot logs all activity to:
- Discord #paper-trading channel
- Supabase `paper_bot_logs` table
- Console output

## Troubleshooting

**Bot won't start:**
- Check all environment variables are set
- Verify Supabase connection
- Check Discord webhook permissions

**No trades executing:**
- Verify daily report exists in Supabase
- Check market hours (8:30am-3pm CT)
- Review `paper_bot_logs` for reasoning

**Missing HIRO data:**
- Bot falls back to cached/mock data
- Add SPOT_GAMMA_API_KEY for live data

## Phase 2 Roadmap

- [ ] TSLA options trading
- [ ] Greeks tracking (delta, gamma, theta)
- [ ] IV percentile analysis
- [ ] More sophisticated position management

---

*Built with ⚔️ by Flacko AI*
