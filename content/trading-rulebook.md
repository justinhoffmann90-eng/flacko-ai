# Trading Rulebook: Avoiding the Next Correction

## Purpose

This document provides a framework for:
1. Recognizing when market conditions are deteriorating (progressive red flags)
2. Adjusting exposure accordingly (ratcheting down, not averaging down)
3. Knowing when to reduce exposure decisively (Kill Leverage ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â partial exit, not full liquidation)
4. **Pacing purchases and using graduated responses to limit damage if wrong**
5. **Controlled accumulation at key levels even in defensive modes**
6. **Recognizing when material catalysts override normal pacing rules**
7. **Knowing when to slow down new buys before eject (Slow Zone ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â sizing reducer)**
8. **Taking profits systematically into strength (Upside Profit-Taking Framework)**
9. **Deploying aggressively into deeply oversold conditions (200 SMA Oversold Override)**

**The core problem this solves:** Buying dips that become corrections, averaging down into weakness, and giving back months of gains in a single drawdown.

**The solution:** A traffic light system that tells you what MODE you're in and how to behave in each mode - determined before emotions take over.

**The swing trader's mindset:** We are NOT momentum day traders. We are swing traders building medium/long-term positions (3-6-9 month calls). Pullbacks are OPPORTUNITIES to accumulate at better prices, not just threats to avoid. The question isn't "should I buy?" but "how much should I buy at these levels?"

---

## Part 1: The Traffic Light System

### Concept

Instead of treating every dip as a buying opportunity, you first determine which MODE the market is in. Your behavior changes based on the mode.

| Mode | Meaning | Your Posture |
|------|---------|--------------|
| **GREEN** | Uptrend intact, momentum healthy | Normal operations - buy dips per your strategy |
| **YELLOW** | Warning signs present, trend weakening | Defensive - reduce size, controlled accumulation at key levels, tighten stops |
| **ORANGE** | Multiple warnings, structure weakening | High caution - small nibbles only at key support, prepare for exit |
| **RED** | Trend broken or confirmed downtrend | Capital preservation - nibbles only at extreme support, Kill Leverage active |

**Key principle:** As conditions deteriorate, you REDUCE size and REQUIRE better prices. You can still accumulate, but more slowly and at better levels.

### The Ratchet Rule

Exposure adjustments move with conditions:

```
GREEN Mode -> YELLOW Mode
Action: Reduce new position sizing. Daily cap: 17.5%/day. Require better levels.

YELLOW Mode -> ORANGE Mode
Action: Reduce to small nibbles only. Daily cap: 10%/day. Tighten stops.

ORANGE Mode -> RED Mode
Action: Nibbles only at extreme support. Daily cap: 5%/day. Kill Leverage level is active.

Slow Zone Triggered (Price < Daily 21 EMA ÃƒÆ’Ã¢â‚¬â€ 0.98)
Action: Halve daily buy cap. Sizing reducer, not hard block. Inactive in GREEN/YELLOW_IMPROVING.

Kill Leverage Level Breaks
Action: Sell ALL leverage (TSLL). Trim TSLA to 50% of portfolio. No exceptions.
```

You rebuild leverage and full position size when conditions improve. You cannot recover capital lost to hoping.

### The Slow Zone

**What it is:** The Slow Zone is a cautionary sizing reducer triggered when price closes below the Daily 21 EMA by 2% or more (D21 ÃƒÆ’Ã¢â‚¬â€ 0.98). When active, it halves the daily buy cap -- slowing accumulation rather than stopping it entirely.

**Why it matters:** The Slow Zone creates a graduated response between "normal accumulation" and "Kill Leverage." It slows you down when price is weakening without forcing you to sit in cash and miss early recovery moves.

**The rule:**
- When price closes below Daily 21 EMA ÃƒÆ’Ã¢â‚¬â€ 0.98 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Halve daily buy cap (e.g., GREEN 30% becomes 15%)
- When price reclaims Daily 21 EMA ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Resume full daily cap per mode rules
- **Inactive in GREEN and YELLOW_IMPROVING modes** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â these modes indicate strong momentum where brief dips below D21 are normal
- In ORANGE/RED modes, Slow Zone reduces cap to 25% of normal (not 50%) since caps are already small

**Backtest evidence:** The Slow Zone was active 36% of the backtest period (323 out of 895 days). Using it as a sizing reducer instead of a hard block preserved the ability to accumulate during early recovery phases while still slowing deployment during genuine deterioration.

**Note:** Slow Zone is separate from mode. You can be in YELLOW mode with Slow Zone active.

### The Hysteresis Rule

**The principle:** Don't flip-flop modes based on one day's price action. Require the picture to actually change before switching modes.

**In practice:**
- A single red day in an uptrend doesn't make it Yellow
- A single green day in a downtrend doesn't make it Green
- The overall pattern needs to shift - not just one data point

**The exceptions:**
- **Kill Leverage is always immediate.** Daily close below your eject level = partial exit (sell leverage, trim to 50%), regardless of mode.
- **Slow Zone activates immediately** when price closes below Daily 21 EMA ÃƒÆ’Ã¢â‚¬â€ 0.98 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â halves daily cap.
- **Downgrades to RED are always immediate.** No lag for the most dangerous mode transitions.
- **Material catalysts can accelerate upgrades.** See Part 8: Catalyst-Aware Accumulation.

---

## Part 2: Inputs That Determine Your Mode

### Overview

Multiple inputs feed into determining your mode. No single indicator controls the decision - you're looking for confluence.

**The 4-Tier Timeframe System:**

| Tier | Name | Timeframe | Indicators | Purpose | Color Meaning |
|------|------|-----------|------------|---------|---------------|
| **Tier 1** | Long | Weekly | 9/13/21 EMA, BX-Trender, RSI (divergence) | Weekly trend -- defines the game | ÃƒÂ°Ã…Â¸Ã…Â¸Ã‚Â¢ = healthy trend |
| **Tier 2** | Medium | Daily | 9/21 EMA, BX-Trender, SMI, RSI | Daily trend -- confirming or diverging? | ÃƒÂ°Ã…Â¸Ã…Â¸Ã‚Â¢ = healthy trend |
| **Tier 3** | Short | 4H | 9/21 EMA, BX-Trender, SMI | Entry timing -- good moment to buy? | ÃƒÂ°Ã…Â¸Ã…Â¸Ã‚Â¢ = good entry setup |
| **Tier 4** | Hourly | 1H | 9 EMA, BX-Trender, SMI | Pullback quality -- at a buy zone? | ÃƒÂ°Ã…Â¸Ã…Â¸Ã‚Â¢ = at pullback zone |

**Key Principle:** Tier 1 (Long) + Tier 2 (Medium) determine MODE (trend health). Tier 3 (Short) + Tier 4 (Hourly) refine ENTRY TIMING (entry quality).

**Color Interpretation:**
- **Tier 1-2:** Colors = trend health. ÃƒÂ°Ã…Â¸Ã…Â¸Ã‚Â¢ GREEN means the trend is healthy/bullish. ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â´ RED means unhealthy/bearish.
- **Tier 3-4:** Colors = entry quality. ÃƒÂ°Ã…Â¸Ã…Â¸Ã‚Â¢ GREEN means it's a good entry setup (oversold, at pullback levels, selling exhausting). ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â´ RED means you'd be chasing (extended, overbought).

**Additional Context Inputs:**
- HIRO (dealer positioning) -- conviction modifier and intraday timing
- SpotGamma levels -- key support/resistance from options flow
- Market Structure (HH/HL/LL) -- trend confirmation

### Input #1: Market Structure

**What it is:**
Market structure refers to the pattern of swing highs and swing lows that price creates. It's the most objective measure of trend.

**Why it matters:**
Structure tells you whether the trend is intact. If we're making higher highs and higher lows, buyers are in control. If we make a lower low, the structure is broken and the uptrend is over - regardless of what other indicators say.

**How to read it:**

| Structure State | Definition | Implication |
|-----------------|------------|-------------|
| **Bullish (HH/HL)** | Each high is higher than the last, each low is higher than the last | Uptrend intact - dips are buyable |
| **Weakening** | Still making HH, but current low is testing previous HL | Trend at risk - caution warranted |
| **Broken (LL confirmed)** | Price closed below previous swing low | Uptrend is over - defensive mode |

**Key rule:** A confirmed lower low (LL) on the Daily or Weekly timeframe puts you in RED Mode, regardless of other indicators.

---

### Input #2: BX-Trender

**What it is:**
BX-Trender is a histogram that visualizes buying and selling pressure with four distinct states:
- **Light Green (HH)** = Strong bullish - making higher highs
- **Dark Green (LH)** = Weakening bullish - warning, no longer making new highs  
- **Light Red (HL)** = Weakening bearish - potential upside turnaround
- **Dark Red (LL)** = Strong bearish - making lower lows

The signal strength is in the TRANSITION: Dark Red -> Light Red is bullish; Light Green -> Dark Green is a warning.

**Why it matters:**
BX-Trender shows you the momentum behind price movement. More importantly, the PATTERN of the bars (getting taller or shorter) tells you if that momentum is increasing or fading - often before price confirms.

**How to read it:**

**CRITICAL:** BX-Trender is read by comparing the RIGHTMOST bar to the bar immediately to its LEFT. Check ONLY the pixel color (green vs red) and whether the bar is TALLER or SHORTER than the previous bar. Never use absolute value ranges ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â they vary by timeframe and period.

| Pattern | What It Looks Like | Meaning |
|---------|-------------------|---------|
| **HH (Higher High)** | Green bars getting taller | Buying pressure increasing |
| **LH (Lower High)** | Green bars getting shorter | Buying pressure weakening |
| **HL (Higher Low)** | Red bars getting shorter | Selling pressure exhausting |
| **LL (Lower Low)** | Red bars getting deeper | Selling pressure increasing |

**Backtest evidence (Daily BX, 895 days):**

| BX State | Avg 5d Fwd Return | Avg 20d Fwd Return | 5d Win Rate | Occurrences |
|---|---|---|---|---|
| HH | +0.97% | +3.47% | 53% | 329 |
| HL | +1.51% | +5.60% | 55% | 123 |
| LH | -0.56% | -2.20% | 46% | 114 |
| LL | -1.06% | -3.13% | 43% | 333 |

**Key insight:** HL (negative but rising) produces the strongest 20-day forward return (+5.60%) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â this is the "momentum turning" signal that identifies bottoms. LLÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢HL transitions are the highest-conviction entry signal at +6.43% avg 20-day return.

**Warning sequence:**

```
Bright Green (HH) -> Dark Green (LH) -> Light Red -> Dark Red (LL)
      OK              First warning       Major warning      EXIT
```

- **First warning sign:** LH pattern (bars shrinking while still green) - momentum fading
- **Major warning sign:** Color flip from green to red - regime change

**Timeframe usage:**
- Tier 1 (Weekly) BX-Trender = Primary regime filter
- Tier 2 (Daily) BX-Trender = Confirmation and early warning
- Tier 3 (4H) BX-Trender = Entry timing
- Tier 4 (1H) BX-Trender = Intraday momentum

---

### Input #3: Weekly EMA Hierarchy (9/13/21) -- Tier 1: Long

**What it is:**
Three Exponential Moving Averages on the Weekly timeframe that provide trend structure context:
- **9 EMA** - Momentum (fastest, most reactive)
- **13 EMA** - Control (intermediate)
- **21 EMA** - Structure (slowest, last line of defense)

**Why it matters:**
The Weekly EMAs give you objective price levels to watch. They work alongside BX-Trender - when both are warning, pay attention. When they diverge, dig deeper.

**How to read it:**

| EMA Status | What It Means | Mode Implication |
|------------|---------------|------------------|
| Above all three, 9>13>21 stacking | Healthy trend structure | Supports GREEN |
| Lost or testing 9 EMA | Momentum fading | Supports YELLOW if BX confirms |
| Lost 13 EMA, holding 21 | Structure weakening | Supports ORANGE if BX confirms |
| Lost 21 EMA | Major breakdown | Supports RED if BX confirms |

**Key insight:** The EMAs tell you WHERE price is relative to trend. BX-Trender tells you the MOMENTUM of the trend. Use both together.

**Example combinations:**
- BX-Trender **Light Green (HH)** + above all EMAs = strong GREEN mode
- BX-Trender **Dark Green (LH)** + testing 9 EMA = early warning, watch closely
- BX-Trender **Light Red (HL)** + below 13 EMA = likely ORANGE (attempting to bottom)
- BX-Trender **Dark Red (LL)** + below 21 EMA = likely RED mode

**Important:** Weekly EMA status is ONE input into mode determination, not the sole determinant. A stock can lose the 9 EMA but still be in GREEN mode if BX-Trender is strong and structure is intact. Look for confluence.

---

### Input #4: Daily 9/21 EMA -- Tier 2: Medium

**What it is:**
Exponential Moving Averages on the Daily timeframe. The 9 EMA is faster (more reactive), the 21 EMA is slower (more stable).

**Why it matters:**
EMAs give you an objective, visual read on trend. The relationship between price and the EMAs - plus the slope of the EMAs themselves - tells you whether buyers or sellers are in control.

**How to read it:**

| Element | Bullish | Bearish |
|---------|---------|---------|
| **Price vs EMAs** | Price above both 9 and 21 | Price below both 9 and 21 |
| **EMA slope** | Both sloping upward | Both sloping downward |
| **9/21 relationship** | 9 above 21 | 9 below 21 |

**Key signals:**

| Signal | Meaning | Mode Implication |
|--------|---------|------------------|
| Price above both EMAs, both sloping up | Healthy uptrend | GREEN |
| Price testing 21 EMA, EMAs flattening | Trend weakening | YELLOW |
| 9 EMA crosses below 21 EMA | Bearish crossover - trend turning | YELLOW->ORANGE Transition |
| Price below both EMAs, both sloping down | Confirmed downtrend | RED |

**Slow Zone:** The Daily 21 EMA serves as the Slow Zone trigger. If price closes below D21 ÃƒÆ’Ã¢â‚¬â€ 0.98, the daily buy cap is halved (sizing reducer, not hard block). Inactive in GREEN and YELLOW_IMPROVING modes.

**Timeframe usage:**
- Daily EMA cross = Actionable signal (earlier, may have fakeouts)
- Weekly EMA cross = Confirmation (slower, more reliable)

---

### Input #5: SMI (Stochastic Momentum Index)

**What it is:**
SMI measures momentum by comparing the current close to the midpoint of the recent range. It oscillates between extreme values and generates cross signals.

**Why it matters:**
SMI is a leading indicator - it often turns before MACD and before price confirms. This makes it valuable for early warnings and timing entries.

**How to read it:**

| Reading | Status | Interpretation |
|---------|--------|----------------|
| > +50 | Overbought | Pullback risk increasing |
| +20 to +50 | Bullish | Healthy momentum |
| -20 to +20 | Neutral | No clear momentum |
| -50 to -20 | Bearish | Downward momentum |
| < -50 | Oversold | Bounce potential IF support holds |

**Cross signals:**

| Signal | Meaning |
|--------|---------|
| **Bullish cross** (fast line crosses above slow) | Momentum turning up |
| **Bearish cross** (fast line crosses below slow) | Momentum turning down |
| **Cross imminent** (lines converging) | Watch closely |

**Key rule:** Read the SLOPE, not just position. A bullish cross at -60 is more significant than sitting at +40.

**Timeframe usage:**
- Tier 2 (Daily) SMI = Primary momentum read
- Tier 3 (4H) SMI = Entry timing and early warnings
- Tier 4 (1H) SMI = Intraday timing

---

### Input #6: RSI (Relative Strength Index)

**What it is:**
RSI measures the speed and magnitude of recent price changes on a scale of 0-100.

**Why it matters:**
RSI is most useful at extremes and for spotting divergences. It's not a primary signal, but a "pay attention" flag. **RSI is primarily used on Weekly and Daily timeframes for divergence detection.**

**How to read it:**

| Reading | Status | Interpretation |
|---------|--------|----------------|
| > 70 | Overbought | Pullback risk - not a sell signal alone, but caution |
| 50-70 | Bullish | Healthy uptrend territory |
| 40-50 | Weak | Below bullish threshold |
| 30-40 | Oversold approaching | Bounce probability increasing |
| < 30 | Extreme oversold | High bounce probability IF support holds |

**Divergences (important caution flags):**

| Divergence | What It Looks Like | Meaning |
|------------|-------------------|---------|
| **Bearish divergence** | Price makes higher high, RSI makes lower high | Momentum weakening despite price rise - caution |
| **Bullish divergence** | Price makes lower low, RSI makes higher low | Selling pressure exhausting - potential reversal |

**Usage:** RSI divergences are caution flags, not action signals. They suggest conditions are changing but need confirmation from other indicators.

**Timeframe usage:**
- Tier 1 (Weekly) RSI = Divergence detection for regime changes
- Tier 2 (Daily) RSI = Divergence detection and extreme readings
- Tier 3/4 (4H/1H) = Not used (too noisy)

---

### Input #7: HIRO (Dealer Flow)

**What it is:**
HIRO tracks institutional/dealer hedging activity in real-time. It shows whether dealers are net buying or selling to hedge their options positions.

**Why it matters:**
HIRO provides insight into institutional positioning that isn't visible in price alone. Extreme readings often precede significant moves.

**How to read it -- Level-Based (Conviction Adjustment):**

| Reading | Position in 30-Day Range | Meaning |
|---------|-------------------------|---------|
| Strongly positive | Upper quartile (>75th percentile) | Dealers buying aggressively - bullish |
| Positive | Above midpoint | Dealers leaning long - supportive |
| Near zero | Middle | Neutral positioning |
| Negative | Below midpoint | Dealers leaning short - headwind |
| Strongly negative | Lower quartile (<25th percentile) | Dealers selling aggressively - bearish |

**CRITICAL: Always contextualize HIRO with the 30-day range.**

- Don't call a reading "extreme" unless it's near the 30-day high or low
- A reading of -500M means different things if the range is -2B to +2B vs. -600M to +600M

**How to read it -- Direction-Based (Intraday Timing):**

| HIRO Direction | Intraday Action |
|----------------|-----------------|
| Trending UP throughout day | Trim later in the day (dealers buying into strength) |
| Trending DOWN throughout day | Nibble later in the day (dealers selling into weakness) |
| Flat/choppy | No directional bias from HIRO |

**Note:** Intraday HIRO alerts can be automated. The daily report provides the EOD snapshot for positioning context.

**Using HIRO for mode conviction:**

| HIRO Position | Effect on Mode Call |
|---------------|---------------------|
| At 30-day high | Upgrade conviction one level |
| Upper quartile | Supports bullish mode calls |
| Middle | Neutral - no adjustment |
| Lower quartile | Supports bearish mode calls |
| At 30-day low | Downgrade conviction one level |

See Part 8.5: HIRO Extreme Handling for specific rules.

---

## Part 2.5: Timeframe Alignment - The Early Warning System

### The Problem with Weekly-Only Focus

Tier 1 (Weekly) BX-Trender is the primary regime filter, but it has a critical limitation: **it's lagging by design.** By the time Weekly confirms a trend change, you may have:
- Missed 1-2 weeks of a new uptrend (recovery)
- Stayed long 1-2 weeks into a new downtrend (deterioration)

### The Solution: Daily as Early Warning

**Tier 2 (Daily) BX-Trender leads Tier 1 (Weekly) by approximately 1-2 weeks.**

This means:
- When Daily starts making LH while Weekly is still HH -> Weekly will likely follow in 1-2 weeks
- When Daily starts making HL while Weekly is still LL -> Weekly will likely follow in 1-2 weeks

**Use Tier 2 (Daily) to anticipate, use Tier 1 (Weekly) to confirm.**

### Deterioration Sequence (Early Warning for Downturns)

| Stage | Tier 2 (Daily) BX | Tier 1 (Weekly) BX | Weekly EMA | Your Response |
|-------|-------------------|-------------------|------------|---------------|
| **1. Early Warning** | LH (first) | HH | Above all | Note it. Tighten mental stops. Don't ignore. |
| **2. Confirmed Fade** | LH/LL | LH | Testing 9 | Reduce size to 75%. Stop adding at current levels. |
| **3. Deteriorating** | LL | LH/LL | Below 9, testing 13 | YELLOW/ORANGE Mode. Require better prices for adds. |
| **4. Full Bearish** | LL | LL | Below 13 or 21 | ORANGE/RED. Small nibbles at extreme support only. |

**Key insight:** Don't wait for Tier 1 (Weekly) to show LH before getting cautious. Tier 2 (Daily) LH is your early warning - respond to it.

### Recovery Sequence (Early Warning for Upturns)

| Stage | Tier 2 (Daily) BX | Tier 1 (Weekly) BX | Weekly EMA | Your Response |
|-------|-------------------|-------------------|------------|---------------|
| **1. Early Hope** | HL (first) | LL | Below 21 | Note it. Watch for continuation. Don't chase yet. |
| **2. Building** | HL/HH | LL | Reclaiming 21 | Start planning re-entry. Watch for confirmation. |
| **3. Recovering** | HH | HL | Above 21, testing 13 | Can begin adding (with daily caps). |
| **4. Full Bullish** | HH | HH | Above all, 9>13>21 | GREEN Mode. Normal operations. |

**Key insight:** Don't wait for Tier 1 (Weekly) to flip green before considering re-entry. Tier 2 (Daily) HH with Tier 1 (Weekly) HL means the turn is likely in progress.

### The Alignment Matrix

| Tier 1 (Weekly) | Tier 2 (Daily) | Tier 3 (4H) | Status | Conviction Level | Mode Adjustment |
|-----------------|----------------|-------------|--------|------------------|-----------------|
| HH | HH | HH | Fully Aligned UP | HIGH | Green - full size |
| HH | LH | Any | Early Deterioration | MODERATE | Green with caution - 75% size |
| LH | LH | LH | Fading | MODERATE | Yellow - standard rules |
| LH | LL | Any | Accelerating Down | LOW | Orange - small nibbles only |
| LL | LL | LL | Fully Aligned DOWN | LOW | Orange / Red |
| LL | HL | Any | Early Recovery | WATCH | Orange (Improving) - early recovery detected, not confirmed. Pause reductions, watch for HLÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢HH. |
| LL | HH | Any | Recovery Building | IMPROVING | Yellow (Improving) - Daily 2 stages ahead, begin meaningful adds |
| HL | HH | HH | Recovery Confirmed | HIGH | Green - can rebuild |

### Recovery Sequence Mode Modifiers

When Tier 2 (Daily) is leading Tier 1 (Weekly) in a recovery sequence, the mode should be adjusted upward:

| Tier 1 (Weekly) BX | Tier 2 (Daily) BX | Base Mode | Adjusted Mode |
|--------------------|-------------------|-----------|---------------|
| LL | LL | Orange/Red | Orange/Red (no change) |
| LL | HL | Orange | Orange (Improving) - early signal, not confirmed. Upgrade requires HL sustained 2+ days or HLÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢HH. |
| LL | HH | Orange | Yellow (Improving) - Daily 2 stages ahead, confirmed recovery |
| HL | HH | Yellow | Green (recovery confirmed) |
| HH | HH | Green | Green (fully bullish) |

**Key principle:** When Tier 2 (Daily) is **2+ stages ahead** of Tier 1 (Weekly) in the recovery sequence, upgrade the mode one level. HL is 1 stage ahead of LL ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â that's an early signal, stay ORANGE but note improving. HH is 2 stages ahead of LL ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â that's confirmed recovery, upgrade to YELLOW (Improving). The distinction matters: HL can revert to LL tomorrow; HH means buying pressure has fully taken over.

**"ORANGE (Improving)" is a valid label** when Tier 1 is LL and Tier 2 is HL. It means: ORANGE caps (10% daily), but the system recognizes early recovery and is watching for the HLÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢HH transition that would trigger YELLOW upgrade. It is NOT an improvised mode ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â it's ORANGE with a documented recovery signal.

### How This Modifies the Ratchet Rule

**Original Ratchet Rule:** Exposure only moves one direction as conditions worsen.

**Modified Ratchet Rule:** Exposure direction is determined by Tier 1 (Weekly), but SPEED of adjustment is informed by Tier 2 (Daily).

| Scenario | Tier 1 (Weekly) Says | Tier 2 (Daily) Says | Adjustment |
|----------|----------------------|---------------------|------------|
| Weekly LH, Daily HH | Getting cautious | Already recovering | Slow the reduction - Daily suggests turn coming |
| Weekly LH, Daily LL | Getting cautious | Getting worse | Accelerate the reduction - Daily confirms weakness |
| Weekly LL, Daily HL | Stay defensive | Recovering | Pause reductions - Daily suggests bottom forming. Stay ORANGE but note improving. |
| Weekly LL, Daily HH | Stay defensive | Strong recovery | Upgrade to YELLOW (Improving) - Daily 2 stages ahead |
| Weekly LL, Daily LL | Stay defensive | Still weak | Continue defensive - no bottom signal yet |

### Practical Application

**Before each report, ask:**

1. **What is Tier 1 (Weekly) BX showing?** (Primary regime filter)
2. **What is Tier 2 (Daily) BX showing?** (Early warning / confirmation)
3. **Where is price vs Weekly 9/13/21 EMAs?** (Structure context)
4. **Are they aligned or diverging?**
5. **If diverging, which direction is Tier 2 (Daily) leading?**
6. **Is Tier 2 (Daily) 2+ stages ahead of Tier 1 (Weekly)?** (If yes, adjust mode upward)

**Then adjust conviction:**

- **Aligned:** High conviction in the mode call
- **Tier 2 leading in same direction as Tier 1:** Very high conviction, trend accelerating
- **Tier 2 diverging from Tier 1:** Lower conviction in current mode, prepare for transition
- **Tier 2 2+ stages ahead in recovery:** Upgrade mode one level, begin accumulation

### Examples

**Example 1: January 2026 Selloff**
- Tier 1 (Weekly): Dark Red, LL (selling increasing)
- Tier 2 (Daily): Dark Red, LL (selling increasing)
- Tier 3 (4H): Dark Green, LH (buying fading)
- Weekly EMAs: Below 13, testing 21
- **Alignment:** Fully aligned bearish
- **Conviction:** HIGH that Orange/Red is correct
- **Action:** Small nibbles at extreme support only, no chasing bounces

**Example 2: Recovery Scenario**
- Tier 1 (Weekly): Dark Red, LL (still selling - but candle not closed)
- Tier 2 (Daily): Bright Green, HH (buying increasing strongly!)
- Tier 3 (4H): Bright Green, HH (bouncing)
- Tier 4 (1H): Bright Green, HH (strong momentum)
- Weekly EMAs: Below 21, attempting reclaim
- **Alignment:** Tier 2 (Daily) 2 stages ahead of Tier 1 (Weekly) (LL -> HH)
- **Conviction:** HIGH that recovery is underway
- **Mode:** Yellow (Improving) - not Orange
- **Action:** Begin meaningful accumulation. This is the setup we wait for. Don't wait for Tier 1 (Weekly) to confirm - it lags by 1-2 weeks.

**Example 3: Hypothetical Early Warning**
- Tier 1 (Weekly): Bright Green, HH (strong uptrend)
- Tier 2 (Daily): Dark Green, LH (momentum FADING - early warning!)
- Tier 3 (4H): Light Red, LL (already negative)
- Weekly EMAs: Above all, 9>13>21
- **Alignment:** Tier 2 (Daily) diverging bearish
- **Conviction:** MODERATE - Weekly strong but Daily showing cracks
- **Action:** Don't buy the dip with full size. Tier 2 (Daily) is warning that Tier 1 (Weekly) may follow. Reduce to 75% size, tighten stops.

---

## Part 3: Mode Definitions

### GREEN Mode - Normal Operations

**You're in GREEN Mode when MOST of these are true:**
- Market structure intact (HH/HL on Weekly and Daily)
- Tier 1 (Weekly) BX-Trender is green with HH or stable pattern
- Weekly price above 9/13/21 EMAs with proper stacking
- Daily price above 9 and 21 EMA, EMAs sloping up or flat
- No significant bearish divergences on RSI

**Behavior in GREEN Mode:**
- Buy dips according to your normal strategy
- Use full position sizing
- Standard stop losses
- Add to winners on pullbacks
- Daily cap: 25-35%

**Watch for (would shift to YELLOW):**
- Tier 1 (Weekly) BX-Trender LH pattern forming (green bars shrinking)
- Weekly price loses or tests 9 EMA
- Daily price testing 21 EMA
- RSI bearish divergence appearing on Daily or Weekly

---

### YELLOW Mode - Controlled Accumulation

**You're in YELLOW Mode when WARNING SIGNS are present:**
- Tier 1 (Weekly) BX-Trender showing LH pattern (green but fading) OR just flipped to light red
- Weekly price has lost or is testing 9 EMA (but holding 13)
- Daily 9 EMA crossed below 21 EMA (bearish cross)
- Structure HL being tested (price near previous swing low)
- Significant bearish RSI divergence on Daily

**YELLOW has conviction levels** - these aren't separate modes, just how aggressive you are within Yellow:

| Conviction | When | Daily Cap | Posture |
|------------|------|-----------|---------|
| **High (Improving)** | Tier 2 (Daily) 2+ stages ahead of Tier 1 (Weekly) in recovery | 20% | Begin meaningful accumulation |
| **Moderate** | Standard warning signs, unclear direction | 15-20% | Controlled accumulation at key levels |
| **Low** | Multiple warnings but not yet Orange | 15% | More caution, smaller nibbles |

**Behavior in YELLOW Mode:**
- **Controlled accumulation at key support levels**
- Reduce position sizing to 50-75% of normal
- **Daily cap: 15-20% of intended position size per day**
- Require better prices (lower entries) than in Green Mode
- Tighten stops to defined support levels
- Prepare for possible exit (know your Kill Leverage level)
- **Require bounce confirmation before any buys**
- **Watch for Slow Zone (Daily 21 EMA loss)**

**Watch for (would upgrade to GREEN):**
- Tier 1 (Weekly) BX-Trender color improves or pattern shifts back to HH
- Weekly price reclaims 9 EMA with conviction
- Daily price reclaims both EMAs, EMAs turn up
- Structure HL holds and price bounces
- SMI bullish cross confirmed

**Watch for (would downgrade to ORANGE):**
- Tier 1 (Weekly) BX-Trender goes red with LL pattern
- Weekly price loses 13 EMA
- Daily structure breaks (lower low confirmed)
- Weekly 9/21 EMA bearish cross

---

### ORANGE Mode - Structure Weakening

**You're in ORANGE Mode when MULTIPLE warnings align:**
- Tier 1 (Weekly) BX-Trender is red or showing sustained LH/LL pattern
- Weekly price has lost 13 EMA (but may be holding 21)
- Tier 2 (Daily) BX-Trender red with LL pattern
- Structure under stress but not yet broken
- HIRO in lower quartile

**This is the caution zone.** Things can recover or break down from here.

**Behavior in ORANGE Mode:**
- **Small nibbles only at key support levels**
- Reduce position sizing to 25-50% of normal
- **Daily cap: 10% of intended position size per day**
- Prepare for possible exit (know your Kill Leverage level)
- Require "prove it" bounce before any meaningful adds
- Consider hedge offset if buying at all
- **Slow Zone likely already triggered**

**Watch for (would upgrade to YELLOW):**
- Tier 1 (Weekly) BX-Trender HL pattern (red bars shrinking)
- Weekly price reclaims 13 EMA
- Tier 2 (Daily) BX-Trender shows HH pattern
- HIRO improving

**Watch for (would downgrade to RED):**
- Tier 1 (Weekly) BX-Trender LL pattern deepening
- Weekly price loses 21 EMA
- Weekly structure breaks (lower low confirmed)

---

### RED Mode - Capital Preservation with Opportunistic Nibbles

**You're in RED Mode when BREAKDOWN is confirmed:**
- Market structure broken (lower low confirmed on Daily or Weekly)
- Tier 1 (Weekly) BX-Trender is red with LL pattern (sustained)
- Weekly price below 21 EMA
- Price below both Daily EMAs, both EMAs sloping down
- Weekly 9/21 EMA bearish cross confirmed

**This is not a dip. This is a trend change.**

**Behavior in RED Mode:**
- **Nibbles only at extreme support levels** (not no buying, but very selective)
- Reduce position sizing to 25% or less of normal
- **Daily cap: 5% of intended position size per day**
- Kill Leverage level is ACTIVE - if it breaks, exit remaining
- Preserve capital for the next opportunity
- **Require "prove it" test before any buys**
- **Enable 2-3 day time buffer before acting**

**Watch for (would upgrade to ORANGE):**
- Tier 1 (Weekly) BX-Trender HL pattern (red bars shrinking)
- Weekly price reclaiming 21 EMA
- Structure attempting higher low
- SMI bullish cross from oversold
- HIRO flipping positive

### Fast-Track Re-Entry Protocol

After a Kill Leverage, you're holding a 50% core TSLA position with no leverage. The recovery paths determine when you can begin rebuilding above 50%.

**Trigger:** You've partially ejected and price is recovering.

**Timeframe:** Within 5 trading days of ejection.

**All conditions must be met:**

| # | Condition | What to Check | Why It Matters |
|---|-----------|---------------|----------------|
| 1 | Price reclaims Daily 21 EMA | Daily close above D21 EMA | Structure attempting recovery |
| 2 | Daily BX-Trender improving | HL or HH pattern (momentum turning) | Selling pressure exhausting |
| 3 | HIRO flips positive | HIRO > 0 and rising | Dealers buying, not selling |

**If all three conditions are met within 5 days:**
- Fast-track directly to ORANGE Mode (skip extended observation period)
- Begin rebuilding above 50% at 10%/day pace
- Set new Kill Leverage at the low that triggered the original ejection

**If conditions are NOT met within 5 days but daily BX is improving (HL or HH):**
- Time-based recovery to ORANGE after 10 days
- Standard mode upgrade rules apply from ORANGE

**If conditions are NOT met within 10 days and daily BX is still LL:**
- Remain in Ejected state with 50% core hold
- 200 SMA Oversold Override continues to operate (see Part 10.5)
- This was likely a real correction ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â patience with the core hold is correct

---

## Part 4: Kill Leverage ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Escalating Defense

### Philosophy

The Kill Leverage is not a single mechanical trigger ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â it's a zone of escalating defensive action anchored around the Weekly 21 EMA. The goal is simple: as conditions deteriorate, you progressively reduce risk so that by the time price reaches true support (Put Wall / gamma floor), you're light enough to actually buy the dip rather than riding leverage into the bottom.

**The system is a compass, not a GPS.** Following it directionally ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â cutting leverage early, tightening posture, buying support with cash you freed up ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â is more important than executing at an exact price on an exact close. A subscriber who cuts leverage near W21 and buys shares at Put Wall support is following the system correctly, even if they didn't execute at the precise trigger.

### Why Partial Exit, Not Full Liquidation?

Backtesting over 3.5 years revealed that full exits (100% to cash) cost more in missed recovery than they saved in drawdown protection. Of 35 eject periods, 16 were followed by V-shaped bounces that recovered within 5 days. Full exits missed +180% of cumulative upside while only saving +146% of cumulative downside. Keeping a 50% core TSLA position through eject periods nearly doubled total strategy return (+43.5% ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ +68.9%) with only 1pp of additional max drawdown (-32.2% vs -33.2%).

**The key insight:** Leverage (TSLL, options) amplifies losses during corrections ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â that's what kills portfolios. TSLA shares held as a core position provide the base that participates in recovery. Cut the leverage, keep the shares.

### The Escalating Defense Zone

As price moves from the Weekly 21 EMA down toward the Put Wall, each step increases defensive action:

**Step 1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Weekly 21 EMA breaks (structure damage begins)**
- **Action:** Cut ALL leverage immediately. Sell TSLL, sell options. This is non-negotiable regardless of context.
- **Why:** Leverage amplifies downside. A 10% correction in TSLA becomes 20%+ in TSLL and potentially total loss in short-dated options. You eliminate this risk first.
- **TSLA shares:** Hold. Don't sell core shares at the first sign of trouble ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the W21 break could be temporary, and selling here puts you in the position of having to buy back higher if it recovers.

**Step 2 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Price continues falling below W21 (no quick reclaim)**
- **Action:** Stop all new buys. Tighten posture. Assess whether the breakdown has conviction (HIRO negative, no institutional buying) or is being contested (HIRO mixed, gamma support holding).
- **Why:** After cutting leverage, you're holding TSLA shares and cash. Don't deploy the cash until you see where support actually forms. The daily cap is already at 5% (RED) or 0% (EJECTED) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the system has naturally slowed your buying.

**Step 3 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Price approaches Put Wall / gamma floor**
- **Action:** This is where you potentially START buying again ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â shares only, no leverage. If HIRO is showing institutional buying and the gamma floor is holding, the Put Wall is your accumulation zone.
- **Why:** You cut leverage at W21, so you have cash. The Put Wall is where dealer hedging creates a natural floor. If institutions are buying (HIRO positive), you're buying alongside them at support ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â not averaging down blindly.

**Step 4 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Put Wall breaks (true structure failure)**
- **Action:** Trim TSLA shares to 50% of portfolio. This is the full defensive posture.
- **Why:** If the gamma floor breaks, there's no institutional backstop. The 200 SMA Oversold Override (Part 10.5) takes over as the framework for re-entry at deeper levels.

### The Key Levels

| Level | What It Means | Action |
|---|---|---|
| **Weekly 21 EMA** | Structure damage ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â weekly trend support lost | Cut ALL leverage (TSLL, options). Non-negotiable. |
| **Between W21 and Put Wall** | Contested territory ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â watch HIRO and gamma | Hold TSLA shares. No new buys until support confirms. Assess context. |
| **Put Wall / Gamma Strike** | Institutional support floor | If HIRO positive + level holding: nibble TSLA shares with available cash |
| **Below Put Wall** | Structure broken, no gamma floor | Trim TSLA to 50%. 200 SMA Override takes over for deeper levels. |

### Why Weekly 21 EMA as the Anchor?

The W21 EMA was validated as the most effective structural reference level over 3.5 years of backtesting.

| Candidate | Why Rejected |
|---|---|
| Put Wall (SpotGamma) | Changes daily, not stable enough for a structural anchor |
| 200 SMA | TSLA spent 171 consecutive days below its 200 SMA (Sep 2022ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“May 2023) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â would keep you defensive through the entire recovery |
| HIGHER-of(W21, 200 SMA) | Whichever is higher dominates, creating premature and prolonged defensive postures |
| Previous swing low | Too variable, often too far below price to provide timely warning |

**The W21 EMA is your early warning.** It tells you "structure is damaged, cut leverage." The Put Wall tells you "here's where support actually is." Between them is the zone where you assess context ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â HIRO, gamma regime, daily BX ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â to decide whether to hold or trim further.

### Reporting Requirements

Every daily report must include:
- Current Weekly 21 EMA level and distance from price
- Current Put Wall level and distance from price
- Where we are in the escalating defense (Step 1/2/3/4)
- Clear rationale: why we're taking this action at this level, explained so a first-time subscriber understands

### Recovery

After executing defensive steps, three recovery paths:

| Path | Condition | Result |
|---|---|---|
| **Price Recovery** | Price reclaims Weekly 21 EMA for 2 consecutive closes | Return to ORANGE, resume normal rules, leverage permitted again |
| **Fast-Track (within 5 days)** | Price reclaims Daily 21 EMA + daily BX turning HL/HH + HIRO positive | Return to ORANGE, rebuild at 10%/day |
| **Time-Based (after 10 days)** | Daily BX improving (HL or HH) for 3+ days | Return to ORANGE regardless of price level |

**During defensive posture, the 200 SMA Oversold Override (Part 10.5) still operates.** Deeply oversold conditions can trigger additional TSLA accumulation even while in full defensive mode.

### Slow Zone vs. Kill Leverage

| Level | What It Is | Action | Severity |
|-------|------------|--------|----------|
| **Slow Zone** | Daily 21 EMA ÃƒÆ’Ã¢â‚¬â€ 0.98 | Halve daily buy cap | ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Caution ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â slow down |
| **Weekly 21 EMA** | Structure damage | Cut all leverage | ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â´ Defensive ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â eliminate amplified risk |
| **Put Wall** | Gamma floor | Assess: buy support or trim further | ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â´ Decision point ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â context matters |
| **Below Put Wall** | No floor | Trim TSLA to 50% | ÃƒÂ¢Ã‚ÂÃ…â€™ Full defense ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â preserve capital |

The system graduates from "slow down" to "cut leverage" to "assess the floor" to "reduce everything." Each step has clear logic, and following even partially ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â cutting leverage near W21 but holding shares through recovery ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â captures most of the protective value.

---

## Part 5: SpotGamma Levels Reference

SpotGamma levels provide insight into where institutional support and resistance lie based on options positioning.

### Level Definitions

| Level | What It Is | Implication |
|-------|------------|-------------|
| **Call Wall** | Strike with highest call open interest | Upside target/resistance - expect stalling here |
| **Key Gamma Strike** | Regime pivot point | Above = positive gamma (stable). Below = negative gamma (volatile). |
| **Hedge Wall** | Strike with maximum dealer hedging activity | Support when price above, resistance when price below |
| **Put Wall** | Strike with highest put open interest | Support floor - **if it breaks, expect acceleration lower** |

### Gamma Regime

| Price Position | Regime | Dealer Behavior | Price Behavior |
|----------------|--------|-----------------|----------------|
| Above Key Gamma Strike | Positive gamma | Dealers buy dips, sell rips | Range-bound, mean-reverting |
| Below Key Gamma Strike | Negative gamma | Dealers sell dips, buy rips | Trending, volatile, moves amplified |

### Using SpotGamma for Kill Leverage

- **Put Wall** is often a logical Kill Leverage level
- If price closes below Put Wall, dealer support is gone and acceleration lower is likely
- Hedge Wall can serve as an early warning level (reduce exposure if lost)

---

## Part 6: Regime Status - Report Section Layout

When integrating this framework into a daily report, include a **Regime Status** section followed by **Flacko AI's Take**. Together, these provide:

1. **Regime Status** - The objective data: current mode, indicator readings, key levels, and triggers
2. **Flacko AI's Take** - The synthesized view: what to do, why, what to watch, and current concerns

This combination ensures you have both the raw data to make your own assessment AND a rules-based interpretation to serve as a sanity check.

---

### Regime Status

**Current Mode: GREEN / YELLOW / ORANGE / RED [MODE NAME]**

**Why we're in this mode:**
> [2-3 sentences explaining the indicator confluence that determines this mode. Be specific about which indicators are signaling what, and how they combine to paint the current picture.]
>
> Example (Yellow Improving): "Tier 1 (Weekly) BX-Trender is still red with LL pattern - but that's a lagging indicator. Tier 2 (Daily) BX-Trender has flipped to bright green with HH pattern, meaning Daily is 2 stages ahead of Weekly in the recovery sequence. Lower timeframes (Tier 3/4H, Tier 4/1H) are fully aligned bullish. HIRO is at +1.4B, the 30-day high. This is textbook Yellow (Improving) - the recovery is already underway, we don't wait for Weekly to confirm."

**What this means for you:**
> [1-2 sentences on the practical implication - what you should and shouldn't do in this mode.]
>
> Example: "In Yellow (Improving) Mode, we begin meaningful accumulation at current levels. Daily cap of 20% applies. We're building position while watching for Weekly confirmation (HL pattern) or failure (Daily reverts to LL)."

#### Indicator Dashboard

| Indicator | Timeframe | Current Reading | Status |
|-----------|-----------|-----------------|--------|
| Structure | Weekly | HH/HL, LL, etc. | OK/WARN/BAD |
| Structure | Daily | HH/HL, LL, etc. | OK/WARN/BAD |
| BX-Trender | Tier 1 (Weekly) | [Color], [Pattern] | OK/WARN/BAD |
| BX-Trender | Tier 2 (Daily) | [Color], [Pattern] | OK/WARN/BAD |
| Weekly 9 EMA | Tier 1 (Weekly) | Above/Below | OK/WARN |
| Weekly 13 EMA | Tier 1 (Weekly) | Above/Below | OK/WARN |
| Weekly 21 EMA | Tier 1 (Weekly) | Above/Below | OK/BAD |
| 9/21 EMA | Tier 2 (Daily) | Above/Below, Slope, Cross | OK/WARN/BAD |
| SMI | Tier 2 (Daily) | [Value], [Cross status] | OK/WARN/BAD |
| RSI | Tier 1/2 | [Value], Divergence? | OK/WARN/BAD |
| HIRO | Intraday | [Value], [Position in 30-day range] | OK/WARN/BAD |

#### Key Levels

| Level | Price | What It Represents |
|-------|-------|-------------------|
| Last Major High (Resistance) | $XXX | Most recent significant peak - breakout level |
| Weekly 9 EMA | $XXX | Momentum support |
| Weekly 13 EMA | $XXX | Control support |
| Weekly 21 EMA | $XXX | Structure support |
| Daily 21 EMA (Slow Zone) | $XXX | Trend health - if lost, stop new buys |
| Last Higher Low (Structure Support) | $XXX | Key uptrend support - if broken, structure breaks (lower low confirmed) |
| Put Wall | $XXX | SpotGamma institutional support - if broken, expect acceleration lower |
| Hedge Wall | $XXX | Early warning support - losing this is first sign of trouble |

#### Mode Triggers

| To Upgrade (toward GREEN) | To Downgrade (toward RED) |
|---------------------------|---------------------------|
| [What would improve conditions] | [What would worsen conditions] |

#### Slow Zone Status

**Slow Zone Level:** $XXX (Daily 21 EMA)

**Status:** [ACTIVE - no new buys / CLEAR - accumulation permitted]

**The Rule:** If price closes below this level, stop all new buys until price reclaims it.

#### Kill Leverage Level

**Level: $XXX**

**Why this level:**
> [2-3 sentences explaining the rationale - what confluence of structure, SpotGamma, and/or technical levels led to this being the line in the sand.]
>
> Example: "The Kill Leverage is set at $375, which is just below the Put Wall ($378) and the last higher low from the weekly structure ($380). A daily close below $375 would mean both dealer support has failed AND the uptrend structure is broken - there's no reason to hold at that point. This level represents the point where the thesis is invalidated."

**The Rule:** Daily close below this level = exit remaining exposure. No exceptions. No "let's see how tomorrow opens."

---

### Flacko AI's Take

**[2-3 sentence summary: What's the setup? What's the opportunity? What's the risk?]**

> **What I'd do:** [Specific action with price levels. Reference daily cap. Be direct.]

> **What would change my mind:** [Single most important signal/level to watch]

**Concerns:**
> [Anything that stands out as a yellow/red flag, even if not actionable yet. This could be divergences forming, momentum fading, key levels approaching, or anything that warrants attention even if the mode hasn't changed.]

---

*This section provides a synthesized, rules-based perspective on the current situation. It's meant to serve as a sanity check against emotional decision-making and ensure the rulebook framework is being applied consistently.*

---

## Part 7: Pacing Rules & Graduated Response Actions

### Purpose

This section extends the Traffic Light System with **pacing rules** and a **graduated response framework**. The goal is to provide more granular guidance on *how* to execute within each mode - not just "reduce exposure" but specific tactics that limit damage if wrong while preserving upside if right.

**Core principle:** The worse conditions get, the more we slow down and require better prices. Speed is the enemy of survival in deteriorating markets, but staying 100% cash during pullbacks means missing accumulation opportunities.

---

### Daily Caps by Mode

A **daily cap** limits how much capital you can deploy in a single day, regardless of how attractive the setup looks. This prevents the common mistake of "sizing down but then buying 3 times in one day" - which defeats the purpose of defensive positioning.

**Why daily caps matter:**
- Volatility clusters. Bad days often follow bad days.
- Your judgment is impaired during drawdowns (stress, urgency, "make it back" mentality)
- Spreading entries improves your average if the dip continues
- Forces patience when patience is hardest
- **Enables controlled accumulation rather than all-or-nothing decisions**

#### Daily Cap Rules

| Mode | Daily Cap | Rationale |
|------|-----------|-----------|
| **GREEN** | 25-35% | Trend intact, buy dips per your strategy |
| **YELLOW** | 15-20% | Conditions uncertain - spread entries across 5-7 days minimum |
| **ORANGE** | 10% | Multiple warnings - small nibbles only |
| **RED** | 5% | High risk environment - nibble at extreme support only |
| **Slow Zone Triggered** | Daily cap halved (sizing reducer, not hard block). In ORANGE/RED: reduces to 25% of normal. | Slow down ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â price weakening, but don't stop entirely |
| **Kill Leverage Triggered** | 0% ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no buying | Capital preservation mode. Cash is a position. |

#### Adjusting Daily Caps

Daily caps aren't rigid - adjust based on conviction:

- **Higher conviction** (strong entry, HIRO supportive, catalyst present) -> faster pace, toward upper end of range
- **Lower conviction** (weak entry, HIRO negative, uncertain setup) -> slower pace, toward lower end of range

Don't overthink it. The ranges exist so you can use judgment.

#### How Daily Caps Work in Practice

**Example - YELLOW Mode:**

You've identified support at $350 and want to add $10,000 to your position if we get there.

- **Without daily cap:** You might buy $5K at $350, another $3K at $348, and $2K at $345 - all in one day. If $345 breaks, you're fully loaded into a falling knife.

- **With daily cap (20%):** You can only deploy $2,000 on Day 1. If price keeps falling on Day 2, you reassess. Maybe you buy another $2,000 at $340. Or maybe conditions worsen and you don't buy at all. Either way, you've limited damage while still accumulating.

**Example - ORANGE Mode:**

Same scenario, but we're in Orange Mode (structure weakening).

- **With daily cap (10%):** You can only deploy $1,000 per day. At this pace, it takes 10 days to build your full position - and a lot can clarify in 10 days. If the bounce fails, you've only committed $2-3K instead of $10K. But if it WAS the bottom, you're building a position.

**Example - RED Mode:**

Same scenario, but we're in Red Mode (structure broken, defensive posture).

- **With daily cap (5%):** You can only deploy $500 per day. This is intentionally slow. You're not trying to catch the bottom - you're waiting for proof that conditions have changed.

#### Daily Cap Decision Tree

```
Want to buy during a dip?
         |
         v
    Is Slow Zone triggered (below Daily 21 EMA)?
         |
    +----+----+
    v         v
   YES        NO
    |         |
    v         v
   0%      What mode are we in?
 NO BUY        |
              +---------+--------------+--------------+----------+
              v         v              v              v          v
            GREEN     YELLOW        ORANGE          RED      EJECTED
              |         |              |              |          |
              v         v              v              v          v
           25-35%    15-20%          10%            5%         0%
              |         |              |              |          |
              v         v              v              v          v
           Execute   Spread over    Spread over   Spread over   NO
           normally   5-7 days       10+ days      20+ days    BUYING
```

---

### The Action Spectrum

**In practice, you think in 5 buckets:**
1. **Buy aggressively** - Green mode, high-quality setup
2. **Buy controlled** - Yellow mode, spread it out
3. **Hold** - Uncertain, wait for clarity
4. **Trim** - Red mode, reduce exposure on bounces
5. **Exit** - Kill Leverage triggered

The scale below is a reference for calibrating your response - not something you calculate in the moment.

#### Action Scale (-5 to +5)

From most bullish to most bearish:

| # | Action | When to Use | Effect |
|---|--------|-------------|--------|
| **+5** | Full size, aggressive adds | GREEN + high-quality setup + catalyst | Maximum upside capture |
| **+4** | Full size, normal adds | GREEN, standard dip-buy | Normal operations |
| **+3** | Reduced size (75%), normal pace | GREEN but minor concerns OR YELLOW (Improving) | Slightly defensive / building into recovery |
| **+2** | Reduced size (50%), daily cap | YELLOW - uncertainty | Controlled accumulation |
| **+1** | Small size (25%), strict daily cap | ORANGE or RED at extreme support | Nibbling at key levels |
| **0** | No new buys, hold existing | YELLOW/ORANGE Transition OR Slow Zone | Wait for clarity |
| **-1** | No new buys, tighten stops | RED - defensive | Protect gains, limit losses |
| **-2** | Trim 25% on bounces | RED - deteriorating | Reduce exposure proactively |
| **-3** | Trim 50% on bounces | RED - serious concern | Significant risk reduction |
| **-4** | Exit 75%, keep starter | RED - near eject | Preserve capital, keep optionality |
| **-5** | Full exit - Kill Leverage | Structure broken, floor gone | Capital preservation mode |

#### Mapping Actions to Modes

| Mode | Typical Action Range | Default Posture |
|------|---------------------|-----------------|
| **GREEN** | +3 to +5 | Normal to aggressive buying |
| **YELLOW (Improving)** | +2 to +4 | Building into recovery |
| **YELLOW** | 0 to +2 | Cautious, controlled accumulation |
| **ORANGE** | 0 to +1 | Small nibbles at best levels |
| **RED** | -3 to +1 | Trimming, holding, or small nibbles at extreme levels |
| **Slow Zone** | 0 | No new buys, hold existing |
| **Eject** | -5 | Full exit |

#### Graduated Response by Scenario

**Scenario: Price Pulls Back to Support in Each Mode**

| Mode | Support Holds | Support Breaks |
|------|---------------|----------------|
| **GREEN** | +4: Add full size at support | +2: Reduce size, watch closely |
| **YELLOW (Improving)** | +3: Add meaningful size | +1: Reduce, reassess recovery thesis |
| **YELLOW** | +1: Small add, daily cap applies | -1: No add, tighten stops |
| **ORANGE** | +1: Small nibble at support | -2: No add, prepare for further downside |
| **RED** | +1: Small nibble at extreme support | -3: Trim 50% on any bounce |

**Scenario: Price Breaks Out Above Resistance**

| Mode | Breakout Holds 30 min | Breakout Fails |
|------|----------------------|----------------|
| **GREEN** | +4: Add on confirmation | +2: Hold, don't chase |
| **YELLOW (Improving)** | +3: Add on confirmation - recovery extending | +1: Wait, don't chase |
| **YELLOW** | +2: Small add, capped | 0: No action, stay patient |
| **ORANGE** | +1: Small nibble if confirmed | -1: Use bounce to reduce |
| **RED** | +1: Small nibble if confirmed | -2: Use bounce to trim |

---

### Damage Reduction Tactics

Two core tactics limit damage when you're wrong:

#### Tactic 1: Spread Across Prices (Scaled Entry)

Instead of one entry at one price, pre-plan entries at progressively lower prices.

**Example:**
- Plan to buy $10K total
- Entry 1: $2,500 at $430 (current)
- Entry 2: $2,500 at $420 (first support)
- Entry 3: $2,500 at $410 (Put Wall)
- Entry 4: $2,500 at $400 (if not ejected)

**Benefit:** If it bounces at $430, you participate. If it falls to $410, your average is much better.

#### Tactic 2: Spread Across Days (Daily Caps)

Don't deploy everything in one day, regardless of how good the setup looks.

**Why:** Volatility clusters. Bad days follow bad days. Your judgment is impaired during drawdowns. Spreading entries forces patience when patience is hardest.

**The caps by mode:**

| Mode | Daily Cap | Days to Full Position |
|------|-----------|----------------------|
| GREEN | 25-35% | 3-4 days |
| YELLOW | 15-20% | 5-7 days |
| ORANGE | 10% | 10+ days |
| RED | 5% | 20+ days |

#### Other Situational Tactics

These are variations you can use, not requirements:

- **Bounce requirement:** In Yellow/Orange/Red, wait for price to hold support 30+ min before buying
- **"Prove it" test:** Wait for price to reclaim a minor resistance level before buying support
- **Hedge offset:** In Orange/Red, pair buys with a protective put or hard stop

---

### Updated Mode Behavior Summary (with Pacing and Max Invested Caps)

| Mode | Daily Buy Cap | Max Invested Cap | Trim Rate | Primary Actions | Slow Zone Effect |
|------|--------------|-----------------|-----------|-----------------|------------------|
| **GREEN** | 30% of cash | 85% | 10% per level | +3 to +5: Normal to aggressive | Inactive |
| **YELLOW (Improving)** | 20% | 70% | 15% | +2 to +4: Building into recovery | Inactive |
| **YELLOW** | 17.5% | 60% | 20% | 0 to +2: Controlled accumulation | Halves cap to 8.75% |
| **ORANGE** | 10% | 40% | 25% | 0 to +1: Small nibbles only | Reduces to 2.5% |
| **RED** | 5% | 20% | 30% | -3 to +1: Nibble at extreme support | Reduces to 1.25% |
| **EJECTED** | 0% (oversold override only) | 50% core hold | ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â | Hold core TSLA, oversold override active | ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â |

**Max Invested Caps ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Tiered Guidance, Not Forced Selling**

Max invested caps are guidelines that tell you how much total exposure is appropriate for each mode. They work differently depending on the severity of the downgrade:

| Transition | Guidance Level | What To Do |
|---|---|---|
| GREEN (85%) ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ YELLOW (60%) | **No action required** | Stop adding aggressively. Daily cap drops from 30% to 17.5% ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the reduced buying pace naturally prevents overexposure. Let trim levels do the work on the upside. |
| YELLOW (60%) ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ORANGE (40%) | **Soft recommendation** | Consider reducing if you're above 50-60% invested. Use trim levels on any bounces to lighten up. The 25% trim cap per level speeds up profit-taking. No forced single-day liquidation. |
| ORANGE (40%) ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ RED (20%) | **Strong suggestion** | Actively work toward 20-30% invested. Trim into any bounces using the 30% trim cap. You should be getting lighter over days, not in one panic sell. Structure is broken ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â don't ride full exposure waiting for Kill Leverage. |
| Any ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ EJECTED (50%) | **Mandatory action** | Sell ALL leverage (TSLL, options). Trim TSLA shares to 50% of portfolio. This is the one forced sell event. Non-negotiable. |

**Why not forced selling on every downgrade?** In practice, mechanical auto-trimming on mode changes creates whipsaw. Mode can shift ORANGE ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ RED ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ORANGE during a V-recovery week, and forced selling at each step erodes positions and creates busywork. The daily buy caps and trim caps already ratchet exposure naturally. The max invested caps tell you where you SHOULD be ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â use the trim levels and time to get there, not a single forced trade.

**The hard line is Kill Leverage.** Everything above it is guided. Kill Leverage is mandatory.

---

### Updated Ratchet Rule (with Pacing, Max Invested Caps, and Slow Zone)

```
GREEN Mode -> YELLOW Mode
- Max invested guidance: 60% (no forced trimming)
- Daily cap drops to 17.5% ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â slower accumulation naturally prevents overexposure
- Trim cap rises to 20% ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â profit-taking speeds up at resistance levels
- Require better prices for entries

YELLOW Mode -> ORANGE Mode
- Max invested guidance: 40% (soft recommendation to reduce if above 50-60%)
- Daily cap drops to 10% ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â very slow new deployment
- Trim cap rises to 25% ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â trim faster into any bounces
- Use trim levels over days to lighten up, not a single forced sell

ORANGE Mode -> RED Mode
- Max invested guidance: 20% (strong suggestion to actively reduce)
- Daily cap drops to 5% ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â minimal new buys at extreme support only
- Trim cap rises to 30% ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â aggressive profit-taking on any bounce
- Work toward target over days using trim levels, don't panic-sell in one trade

Slow Zone Triggered (Price < D21 ÃƒÆ’Ã¢â‚¬â€ 0.98)
- Halve daily buy cap
- Not a hard block ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â sizing reducer only
- Inactive in GREEN and YELLOW_IMPROVING
- In ORANGE/RED, reduces cap to 25% of normal

Kill Leverage Level Breaks (Weekly 21 EMA, 2 consecutive closes)
- Sell ALL TSLL and options immediately
- Trim TSLA to 50% of portfolio value
- Mode becomes EJECTED
- 200 SMA Oversold Override still active (see Part 10.5)
```

---

## Part 8: Catalyst-Aware Accumulation

### The Problem

The standard framework (hysteresis, time buffers, "wait for confirmation") is designed to prevent emotional buying into falling knives. This is correct most of the time.

But it creates a blind spot: **material thesis-confirming catalysts change the risk/reward calculus**, and the standard rules can cause you to miss significant moves.

**Example:** Elon announces EU FSD approval expected next month, China timeline similar, and Austin robotaxi rides begin. The stock gaps up 4%+ on material news. The standard "wait for confirmation" approach would have you sitting out while the recovery you've been waiting for plays out.

### The Catalyst Override

**When material catalysts hit, the following adjustments apply:**

| Normal Rule | Catalyst Override |
|-------------|-------------------|
| Wait for 2+ days confirmation (hysteresis) | Same-day accumulation permitted |
| Daily cap 10-20% | Daily cap can expand to 25-30% |
| Require bounce confirmation | Catalyst IS the confirmation |
| "Don't chase" default | "Missing the move is a cost" mindset |
| Wait for pullback to key level | Build 30-50% of target at current levels immediately |

### What Qualifies as a Material Catalyst

**Thesis-Confirming Catalysts (Override applies):**
- FSD regulatory approvals (EU, China, US expansion)
- Robotaxi launch/expansion announcements
- Major earnings beats (>20% revenue/EPS surprise)
- Significant new market entries
- Production/delivery beats (>15% above consensus)
- Major regulatory wins (EPA, NHTSA)

**Non-Material News (No override - use standard rules):**
- Analyst upgrades/downgrades
- Elon tweets (unless announcing above)
- General market sentiment shifts
- Macro events unrelated to thesis
- Rumor/speculation without official confirmation

### Catalyst Override Decision Tree

```
Material catalyst hits
         |
         v
    Is the catalyst thesis-confirming?
    (FSD approval, robotaxi, major earnings beat)
         |
    +----+----+
    v         v
   YES        NO
    |         |
    v         v
 OVERRIDE   Use standard
 APPLIES    rules
    |
    v
Current mode?
    |
+---+---+-------+
v       v       v
Green   Yellow  Orange/Red
|       |       |
v       v       v
+5      +3/+4   +1/+2
Full    Build   Small add
aggr    30-50%  at current
```

### Catalyst Override by Mode

| Current Mode | Standard Action | Catalyst Override Action |
|--------------|-----------------|--------------------------|
| **GREEN** | +4: Normal adds | **+5: Full aggression, no cap** |
| **YELLOW (Improving)** | +3: Building into recovery | **+4: Accelerated accumulation, 30%+ cap** |
| **YELLOW** | +1 to +2: Controlled | **+3: Build 30-50% at current levels** |
| **ORANGE** | +1: Small nibbles | **+2: Meaningful adds permitted** |
| **RED** | +1: Nibble at extreme support | **+2: Can add at current levels** |

### Example: Catalyst Override in Action

**Context:**
- Mode: Yellow (Improving) - Tier 2 (Daily) HH, Tier 1 (Weekly) LL
- Catalyst: EU FSD approval expected next month, Austin robotaxi rides begin
- Price action: +4% on the day

**Without Catalyst Override:**
"Wait for $425-428 pullback before adding. Daily cap 15-20%."

**With Catalyst Override:**
"Build 30% of target position at current levels (~$430). This is the kind of news we're positioned for. Daily cap elevated to 25-30%. If we get the pullback to $425-428, add another 25%. Total allocation target: 50-60% of position in first 2 days."

**Key insight:** The catalyst confirmed the thesis. Waiting for a "better price" assumes the price will come down - but thesis-confirming catalysts often mark the start of a sustained move. Missing it costs real money.

### Catalyst Override Guardrails

Even with catalysts, maintain discipline:

1. **Kill Leverage still active** - A catalyst doesn't change your stop loss
2. **Maximum acceleration is 2x daily cap** - Yellow 15-20% becomes 30% max
3. **Never go >50% of target in one day** - Leave room to average up/down
4. **Catalyst must be official** - Rumors don't trigger override
5. **Reassess after 2-3 days** - If price gives back catalyst gains, return to standard rules

### Tracking Catalyst Performance

To validate this framework, track:

| Metric | What to Measure |
|--------|-----------------|
| Catalyst hit rate | % of catalyst days that continued higher over next 5 days |
| Missed opportunity cost | $ left on table by not buying on catalyst days |
| False catalyst cost | $ lost when catalyst gains reversed |
| Override vs. standard | Compare returns from catalyst override vs. standard rules |

---

## Part 8.5: HIRO Extreme Handling

### The Problem

HIRO at extreme levels (30-day high or low) is a powerful signal that isn't explicitly addressed in the standard framework. An extreme reading should adjust conviction and daily caps.

### HIRO Extreme Rules

| HIRO Position | Conviction Adjustment | Daily Cap Adjustment |
|---------------|----------------------|---------------------|
| At or near 30-day high (>90th percentile) | Upgrade conviction one level | +5% to daily cap |
| Upper quartile (75-90th percentile) | Supports bullish call | No adjustment |
| Middle (25-75th percentile) | Neutral | No adjustment |
| Lower quartile (10-25th percentile) | Supports bearish call | No adjustment |
| At or near 30-day low (<10th percentile) | Downgrade conviction one level | -5% from daily cap |

### How HIRO Extremes Modify Mode

| Current Mode | HIRO at 30-day High | HIRO at 30-day Low |
|--------------|---------------------|-------------------|
| GREEN | Stay Green, high conviction | Caution - watch for deterioration |
| YELLOW (Improving) | Strong recovery signal - near Green | Pause - recovery may be fading |
| YELLOW | Lean toward Improving | Lean toward Orange |
| ORANGE | Recovery signal - upgrade to Yellow | Stay Orange, high conviction |
| RED | Recovery possible - watch for upgrade signals | Stay Red, high conviction |

### HIRO Direction-Based Guidance

In addition to level-based conviction adjustments, HIRO direction throughout the day provides intraday timing guidance:

| HIRO Direction | What It Means | Intraday Action |
|----------------|---------------|-----------------|
| Trending UP | Dealers buying into strength | Trim later in the day |
| Trending DOWN | Dealers selling into weakness | Nibble later in the day |
| Flat/Choppy | No clear dealer direction | No directional bias from HIRO |

**Note:** Intraday HIRO alerts can be automated. The daily report provides the EOD snapshot for positioning context.

### Example: HIRO at 30-day high

**Context:**
- 30-day range: -1.9B to +1.4B
- Current reading: +1.4B (at the extreme)

**Interpretation:**
"HIRO is at the 30-day extreme high. This is a massive bullish signal - dealers are buying aggressively. Combined with Tier 2 (Daily) BX HH pattern, this strongly supports Yellow (Improving) mode and argues for faster accumulation. Daily cap elevated by 5%."

---

## Part 9: Position Sizing Framework

### The Problem with Per-Order Sizing

The previous framework used "per order" sizing (1-2%, 2-3%, 3-5%) without portfolio context. This creates confusion:
- Someone all-cash doesn't know what total exposure to target
- No guidance on how to pace getting there
- No framework for already-positioned traders

### The "% of Target Position" Framework

Instead of thinking in per-order terms, think in terms of **target exposure** and **% of target already built**.

#### Step 1: Determine Target Exposure

Based on current mode and conviction, what % of your portfolio should be in TSLA?

| Mode | Conviction | Target TSLA Exposure |
|------|------------|---------------------|
| GREEN | High | 15-25% of portfolio |
| GREEN | Moderate | 10-15% of portfolio |
| YELLOW (Improving) | High | 10-20% of portfolio |
| YELLOW | Moderate | 5-15% of portfolio |
| ORANGE | Low | 5-10% of portfolio |
| RED | Low | 0-5% of portfolio (nibbles only) |

#### Step 2: Determine How Much to Build Now

Based on current setup and price levels, how much of the target should you build immediately?

| Situation | % of Target to Build Now |
|-----------|--------------------------|
| At support + 5/5 entry quality | 30-50% |
| Near support + 4/5 entry quality | 20-30% |
| Between levels + 3/5 entry quality | 10-20% |
| Extended from support + 2/5 entry quality | 5-10% |
| Poor entry + 1/5 entry quality | 0% - wait for better |

#### Step 3: Plan the Rest of the Position

Pre-define where you'll add the remainder of your target:

| Allocation Tranche | Price Zone | % of Target |
|--------------------|------------|-------------|
| **Tranche 1: Now** | Current levels | 20-30% |
| **Tranche 2: Pullback** | First support level | 20-25% |
| **Tranche 3: Deeper** | Second support / Put Wall | 25-30% |
| **Tranche 4: Breakout** | Above resistance | 20-25% |

**Example - YELLOW Mode at $430:**

Target exposure: 15% of portfolio
Current allocation: 0%
Target allocation: $30,000 (on $200K portfolio)

| Tranche | Price | Amount | Cumulative |
|---------|-------|--------|------------|
| Tranche 1: Now | $428-432 | $9,000 (30%) | $9,000 |
| Tranche 2: Pullback | $420-425 | $7,500 (25%) | $16,500 |
| Tranche 3: Deeper | $415 (Put Wall) | $7,500 (25%) | $24,000 |
| Tranche 4: Breakout | Above $440 | $6,000 (20%) | $30,000 |

**Daily cap:** 15-20% of target per day = $4,500-$6,000/day

**Pacing:** At 20%/day, Tranche 1 ($9,000) takes 2 days. If we never pull back and just run, you have $9,000 exposure. If we pull back to $420, you add Tranche 2 over 2 days. etc.

#### For Already-Positioned Traders

If you already have TSLA exposure:

| Current Position | Mode | Guidance |
|-----------------|------|----------|
| Underweight vs. target | Any bullish | Add per above framework |
| At target | Green/Yellow | Hold, trim on extended moves |
| Overweight vs. target | Yellow/Orange/Red | Trim to target on bounces |

---

## Part 10: Upside Profit-Taking Framework

### Purpose

Parts 1-9 address the **buy side** -- how to accumulate positions at the right pace and price. This section addresses the **sell side** -- how to take profits systematically as price rises into resistance.

The core symmetry: the same emotional traps exist on both sides. On the buy side, fear causes you to buy too much too fast into falling knives. On the sell side, greed causes you to hold too long or sell too much too fast.

**The solution:** A mode-aware trim system that mirrors the buy-side framework -- with the key inversion that **worse regimes mean faster trimming, not slower.**

---

### The Trim Cap: Mode-Aware Profit Taking

Just as the Daily Buy Cap controls how fast you build positions, the **Trim Cap** controls how fast you take profits. The relationship is inverse:

| Mode | Daily Buy Cap | Trim Cap (% of remaining per level) | Logic |
|------|--------------|--------------------------------------|-------|
| **GREEN** | 25-35% | **10%** | Trend supports holding -- trim slowly, let winners run |
| **YELLOW** | 15-20% | **20%** | Uncertain environment -- symmetrical buy/sell pacing |
| **ORANGE** | 10% | **25%** | Bounces are suspect -- use strength to reduce faster |
| **RED** | 5% | **30%** | Bounces in downtrends are selling opportunities |

**The principle:** In GREEN, your biggest risk is selling too fast. In RED, your biggest risk is not selling fast enough. The trim cap enforces this.

**Critical rule:** All trim percentages are applied to **remaining holdings**, not the original position. This compounds naturally and avoids confusion.

---

### Sequential Trimming: How It Works

Each trim level triggers one trim at the mode-determined percentage of whatever you currently hold.

**Example -- YELLOW Mode (20% trim cap), starting with 100 shares:**

| Trim Level Hit | Action | Shares Sold | Remaining |
|----------------|--------|-------------|-----------|
| T1: Weekly 9 EMA | Trim 20% of 100 | 20 | 80 |
| T2: Key Gamma Strike | Trim 20% of 80 | 16 | 64 |
| T3: Prior swing high | Trim 20% of 64 | 13 | 51 |
| Core Hold | -- | -- | 51 (never sold unless Kill Leverage or thesis breaks) |

**Same scenario in GREEN Mode (10% trim cap):**

| Trim Level Hit | Action | Shares Sold | Remaining |
|----------------|--------|-------------|-----------|
| T1: Weekly 9 EMA | Trim 10% of 100 | 10 | 90 |
| T2: Key Gamma Strike | Trim 10% of 90 | 9 | 81 |
| T3: Prior swing high | Trim 10% of 81 | 8 | 73 |
| Core Hold | -- | -- | 73 (much more retained because trend is healthy) |

**One number. Always % of remaining. Mode determines the number. Levels determine where.**

The system self-regulates: even in RED mode at 30% per level, if price only hits one resistance level during a bounce, you only trim 30%. You need price to hit multiple levels to trim significantly -- which means the market has to prove the bounce is real before you sell too much.

---

### Trim Level Hierarchy

The levels you trim at depend on where price is relative to the EMAs. Two regimes apply:

#### Regime A: Price Recovering (Below Some EMAs)

When price is recovering from a pullback, EMA reclaims serve as natural resistance. Use them as trim targets in this order as price rises:

1. Daily 9 EMA reclaim
2. Key Gamma Strike reclaim
3. Daily 21 EMA reclaim
4. Hedge Wall
5. Weekly 9 EMA
6. Weekly 13 EMA
7. Weekly 21 EMA
8. Prior swing high

#### Regime B: Strong Uptrend (Above All EMAs)

When price is above all EMAs, those levels are below price and irrelevant as resistance. Alternative targets:

1. **Hedge Wall** (SpotGamma) -- often near price, first actionable resistance
2. **Most recent swing high** -- always relevant overhead test
3. **Round numbers** -- only major levels (see below)
4. **EMA Extension Zone** -- measures how stretched price is above Weekly 9 EMA (see below)
5. **Call Wall** (SpotGamma) -- if/when approached
6. **All-time high / 52-week high** -- when approaching

**The report naturally uses whichever regime applies.** In mixed scenarios (above daily EMAs but testing weekly 9 EMA), use levels from both.

---

### Round Numbers: Selective Application

Only include major psychological levels that concentrate significant options activity:

- **$50 increments** as the standard: $350, $400, $450, $500, $550
- **$100 increments** get extra weight: $400, $500, $600
- **Only include** if the round number falls between current price and the next structural level
- **Do not force** a round number if there is already a Hedge Wall or prior high nearby

This keeps trim targets intentional rather than formulaic.

---

### EMA Extension Zone

**What it is:** A measure of how far price is extended above the Weekly 9 EMA. When all EMAs are below price, this provides the "how stretched are we?" answer that EMAs alone cannot.

**How to calculate:** (Current Price - Weekly 9 EMA) / Weekly 9 EMA x 100

| Extension Above Weekly 9 EMA | Status | Trim Implication |
|------------------------------|--------|------------------|
| **0-8%** | Normal | No extension-based trimming -- trend healthy |
| **8-12%** | Warming | Note it, but not actionable alone |
| **12-18%** | Extended | First extension-based trim trigger |
| **18-25%** | Stretched | Second trim -- meaningful reduction regardless of mode |
| **25%+** | Extreme | Heavy trim (1.5x normal rate) -- historically rare, mean reversion likely |

**Key rule:** EMA Extension Zone is mode-independent as a *flag*. Even in GREEN mode, if price is 25%+ above Weekly 9 EMA, the extension itself triggers a trim. But the *speed* of trimming (the % per level) still follows the mode rules. Extension trimming is **disabled in GREEN mode** for the 12% level ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â in GREEN, only 18%+ and 25%+ trigger trims.

**Backtest evidence:** Over 3.5 years, the engine executed 37 extension trims at 12%, 22 at 18%, and 3 at 25%. The higher thresholds (vs the old 8/12/15) reduced whipsaw trimming during normal TSLA volatility while still capturing extreme overextension events.

**Reset:** Trim levels reset after a 3%+ pullback from the most recent close, allowing fresh trims on the next upswing.

---

### The Acceleration Zone

**What it is:** The Key Gamma Strike reclaim from below. This is the sell-side equivalent of the Slow Zone on the buy side.

| Level | Side | Trigger | Action |
|-------|------|---------|--------|
| **Slow Zone** (Daily 21 EMA) | Buy | Price closes below | Stop buying |
| **Acceleration Zone** (Key Gamma Strike) | Sell | Price reclaims from below | Start trim sequence |

**Why Key Gamma Strike?** When price reclaims Key Gamma Strike from below, you transition from negative gamma (volatile, moves amplified) to positive gamma (stable, mean-reverting). In positive gamma, dealers who are long gamma sell the underlying to rebalance as price rises. Dealers are selling into the strength -- you should be doing the same.

**Below Acceleration Zone:** Not trimming. You are in buy territory or holding.
**Above Acceleration Zone:** Each resistance level triggers a trim per mode rules.

The space between Slow Zone and Acceleration Zone is "hold and watch" territory.

---

### The Core Hold

**What it is:** Whatever remains after all trim levels have been hit. The core hold represents your asymmetric thesis exposure -- the position that captures the multi-year upside from robotaxi, FSD, and Optimus.

**When the Core Hold gets sold:**
- **Kill Leverage triggers** -- non-negotiable, same as buy side
- **Thesis fundamentally breaks** -- a narrative event, not a price event

**When it does NOT get sold:**
- Normal pullbacks
- Mode downgrades
- Daily red candles
- General market weakness (unless Kill Leverage level breaks)

The trim system handles tactical profit-taking. The core hold protects your asymmetric exposure.

---

### Fibonacci Extension Levels (Optional)

**Default behavior:** Use the standard trim hierarchy (Hedge Wall, prior highs, round numbers, EMA Extension %, Call Wall). No fibs unless anchor points are provided.

**When fib anchors are provided:**
1. Calculate extensions: 1.0, 1.272, and 1.618
2. Slot them into the trim hierarchy wherever they fall relative to other levels
3. If a fib level clusters near another trim target (within ~1%), note the confluence and give it higher trim priority

**How to provide anchor points:**
> Fib anchors: Swing Low $370 -> Swing High $488 -> Retracement Low $410

**Calculated levels from that example:**
- 1.0 extension = $488 (prior high -- already tracked)
- 1.272 extension = $520
- 1.618 extension = $561

**Anchor point management:** Swing points do not change often in a swing trading context. Update them weekly or after a significant new high/low. The bot carries them forward until updated.

**Fib follow-up workflow:** After the daily report PDF draft is produced and sent for approval, the system should ask whether updated fib anchor points should be provided (swing low, swing high, recent retracement low). If provided, the report is regenerated with fib extension targets incorporated into the upside trim levels. If declined, the standard trim hierarchy is used.

---

### HIRO Integration for Trim Timing

The existing HIRO direction-based guidance supports trim timing:

| HIRO Direction | Trim Guidance |
|----------------|---------------|
| Trending UP during day | Execute trims -- let dealers push price higher first |
| At 30-day high | Trim with urgency -- dealers near peak buying |
| Trending DOWN during day | Hold trims -- wait for a better bounce |
| At 30-day low | No trimming -- this is buy territory |

---

### Trim Framework Summary: The Symmetry

| Concept | Buy Side (Parts 1-9) | Sell Side (Part 10) |
|---------|----------------------|---------------------|
| Speed control | Daily Buy Cap | Trim Cap (% of remaining per level) |
| Speed by mode | GREEN fast, RED slow | GREEN slow, RED fast |
| Level targets | SpotGamma support + EMAs | SpotGamma resistance + EMAs + Extension |
| Scaled execution | 4 buy tranches | Sequential trims at each resistance + Core Hold |
| Pause mechanism | Slow Zone (below Daily 21 EMA) | Acceleration Zone (above Key Gamma Strike) |
| HIRO timing | Nibble when HIRO trending down | Trim when HIRO trending up |
| Non-negotiable floor | Kill Leverage (partial exit ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â sell leverage, trim to 50%) | Core Hold (never sell unless thesis breaks or Kill Leverage) |
| Extension metric | N/A | EMA Extension Zone (% above Weekly 9 EMA) |

---

## Part 10.5: 200 SMA Oversold Override

### The Problem

The standard mode system correctly identifies corrections and reduces exposure. But it creates a blind spot: when TSLA is deeply oversold relative to its 200-day moving average, the system is sitting in cash (or at 50% core hold during eject) exactly when forward returns are most favorable. The deepest oversold conditions produce the highest-conviction rebound signals in the entire dataset.

### The Statistical Foundation

Over 3.5 years of backtesting, the distance below the 200 SMA produced these forward returns:

| Distance Below 200 SMA | Avg 20d Return | Avg 60d Return | 20d Win Rate | Days |
|---|---|---|---|---|
| -10% to -20% | +7.62% | +13.94% | 56% | 141 |
| -20% to -30% | +1.22% | +10.17% | 51% | 89 |
| -30% to -40% | -7.68% | +20.55% | 33% | 33 |
| Below -40% | +44.56% | +53.25% | 87% | 23 |

**Key findings:**
- Below -40% from the 200 SMA is a generational buying opportunity: +44.56% average 20-day return with 87% win rate.
- The -30% to -40% zone shows NEGATIVE 20-day returns (-7.68%) despite strongly positive 60-day returns (+20.55%). This means there is often MORE PAIN before the bounce ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â which is why the stabilization filter exists.
- These conditions are rare (23 days below -40% in 3.5 years) but massively impactful.

### The Oversold Override Tiers

When TSLA is deeply oversold relative to its 200 SMA, the following override activates **regardless of current mode** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â even during EJECTED state. This operates on a separate "oversold accumulation budget" independent of normal mode logic.

| Tier | Trigger | Max Portfolio Allocation | Instruments | Daily Deploy Rate | Stabilization Required? |
|---|---|---|---|---|---|
| **Tier 1** | 20%+ below 200 SMA | 10% | TSLA shares only | 5% of cash/day | No |
| **Tier 2** | 30%+ below 200 SMA | 25% | 60% TSLA + 40% TSLL | 10% of cash/day | Yes ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â 2 days of no new lows |
| **Tier 3** | 40%+ below 200 SMA | 40% | 40% TSLA + 60% TSLL | 15% of cash/day | Yes ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â 2 days of no new lows |

### The Stabilization Filter

**This is critical.** Tier 2 and Tier 3 deploy TSLL (2x leverage), which amplifies both gains and losses. Deploying into a falling knife with leverage is the fastest way to destroy capital.

The stabilization filter requires **2 consecutive days where the daily low does not make a new low** before Tier 2/3 deployment begins. This simple check ensures selling pressure has at least paused before committing leveraged capital.

**Backtest evidence:** Without the stabilization filter, the strategy deployed TSLL into the December 2022 freefall ($174ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢$109) and experienced a -29% drawdown in 2022. With the filter, it waited for the selling to exhaust, then caught the January 2023 bounce ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â reducing the 2022 drawdown to -16% while still capturing the recovery. The filter alone was worth +11pp of total return.

**Tier 1 deploys freely** (no stabilization) because it uses TSLA shares only at a small 10% allocation ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â enough to participate in a rebound without catastrophic risk if prices continue lower.

### How It Works in Practice

**Scenario: TSLA at $160, 200 SMA at $230 (30.4% below)**

1. Tier 1 is already active (has been since price crossed -20% below 200 SMA) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â up to 10% deployed in TSLA
2. Tier 2 triggers (-30%+ threshold met)
3. System checks: has the daily low stopped making new lows for 2 consecutive days?
   - If NO: wait. Tier 1 continues deploying at 5%/day in TSLA only.
   - If YES: Tier 2 activates. Deploy up to 25% of portfolio in 60/40 TSLA/TSLL split at 10%/day.
4. If price continues to -40%, Tier 3 activates (same stabilization check) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â deploy up to 40% with TSLL-heavy allocation.

**Scenario: During EJECTED state**

The oversold override operates independently of the normal buy-side logic. Even when mode is EJECTED and normal buying is suspended, the override deploys if thresholds are met. This is by design ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the deepest oversold conditions coincide with ejected states, and waiting for mode recovery would miss the strongest rebounds.

### When to Deploy Call Options (ÃƒÂ°Ã‚Å¸Ã‚â€Ã‚Â® Orb Signal System)

The backtest models TSLA shares and TSLL only. In practice, the oversold override tiers also provide the highest-conviction setups for call options:

| Tier | Option Strategy | Suggested Parameters |
|---|---|---|
| Tier 1 (-20%) | Not recommended | Too early, too uncertain |
| Tier 2 (-30%) + Stabilized | 0.40-0.50 delta calls, 3-6 month expiry | Small allocation (5% of portfolio in premium) |
| Tier 3 (-40%) + Stabilized | 0.50-0.60 delta calls, 6-9 month expiry | Larger allocation (10% of portfolio in premium). TSLL also appropriate. |

**The math:** At Tier 3 (-40% below 200 SMA), the average 20-day TSLA return is +44.56% with 87% win rate. With TSLL (2x), that's roughly +89%. With 0.50-delta calls, returns scale even further. These are rare but potentially career-defining setups.

### Relationship to Orb Score Override System (Part 12)

The 200 SMA Oversold Override (this section) governs **share-side** deep dip deployment — how much TSLA and TSLL to buy at extreme drawdowns. The **Orb Score override** (Part 12) governs **instrument selection** for the signal system — when specific high-conviction setups fire during NEUTRAL zone, the instrument upgrades from TSLA to TSLL.

These are complementary, not competing:
- **200 SMA Override** activates at extreme drawdowns (-20%/-30%/-40% below 200 SMA) regardless of Orb zone
- **Orb Score Override** activates when Deep Value, Capitulation, or Oversold Extreme fires in NEUTRAL zone regardless of distance from 200 SMA
- In deep corrections, both may be active simultaneously — the 200 SMA Override governs how much to deploy, while the Orb override confirms the dip-buy signal quality

The Orb's Oversold Extreme setup (Tier S) maps roughly to the 200 SMA Tier 3 conditions. Deep Value maps to Tier 1-2 territory. When both systems agree, it's the highest-conviction deployment opportunity the framework produces.

---

## Part 11: Quick Reference

### Mode Summary

| Mode | Key Indicators | Behavior | Daily Cap | Max Invested |
|------|----------------|----------|-----------|-------------|
| GREEN | BX green HH, above all EMAs, structure intact | Normal dip-buying, full size | 30% | 85% |
| YELLOW_IMP | Daily BX 2+ stages ahead of Weekly in recovery | Meaningful accumulation | 20% | 70% |
| YELLOW | BX LH or light red, testing 9 EMA, structure ok | Controlled accumulation at key levels | 17.5% | 60% |
| ORANGE | BX red, below 13 EMA, structure stressed | Small nibbles only | 10% | 40% |
| RED | BX red LL, below 21 EMA, structure broken | Nibbles at extreme support only | 5% | 20% |
| EJECTED | Below W21 for 2 closes, partial exit triggered | Hold 50% core TSLA, oversold override active | 0% | 50% |

### Ratchet Rule

```
GREEN -> YELLOW: BX-Trender LH, loses 9 EMA. Cap 17.5%, max 60%. Trim into bounces to reduce.
YELLOW -> ORANGE: BX-Trender red, loses 13 EMA. Cap 10%, max 40%. Trim into bounces to reduce.
ORANGE -> RED: BX-Trender LL, loses 21 EMA or structure breaks. Cap 5%, max 20%. Trim into bounces to reduce.
Slow Zone (Price < D21 ÃƒÆ’Ã¢â‚¬â€ 0.98): Halve daily cap. Inactive in GREEN/YELLOW_IMP.
Kill Leverage (W21, 2 closes): Sell all leverage. Trim TSLA to 50%. Oversold override active.
```

### Recovery Sequence

```
RED -> ORANGE: BX-Trender HL, reclaims 21 EMA
ORANGE -> YELLOW: BX-Trender improving, reclaims 13 EMA
YELLOW -> GREEN: BX-Trender HH, above all EMAs, structure confirmed
```

### Hysteresis Rule

```
Don't flip-flop modes on one day's action.
Require the overall picture to change before switching modes.
Exception: Kill Leverage is always immediate.
Exception: Slow Zone is always immediate.
Exception: Material catalysts can accelerate upgrades.
```

### Recovery Sequence (Daily Leads Weekly)

| Tier 1 (Weekly) | Tier 2 (Daily) | Mode |
|-----------------|----------------|------|
| LL | LL | Orange/Red |
| LL | HL | Yellow (early recovery) |
| LL | HH | Yellow (Improving) |
| HL | HH | Green (recovery confirmed) |

### Fast-Track Re-Entry (After Ejection)

Within 5 days of ejection, if ALL THREE conditions met:
1. Price reclaims 21 EMA (daily close)
2. HIRO flips strongly positive
3. Tier 3 (4H) BX-Trender HH + SMI bullish cross

-> Fast-track to ORANGE, rebuild at 10%/day

### Catalyst Override

When material catalyst hits (FSD approval, robotaxi launch, major earnings beat):
- Daily cap increases by 50-100%
- Time buffers waived
- Build 30-50% of target at current levels
- Hysteresis relaxed for upgrades

### Warning Sequence (BX-Trender)

```
Green + HH -> Green + LH -> Light Red -> Dark Red + LL
    OK         First         Major        EXIT
             warning        warning
```

### Action Spectrum Quick Reference

| Score | Action | Mode |
|-------|--------|------|
| +5 | Aggressive full-size adds | GREEN Only (+ catalyst) |
| +4 | Full size, normal adds | GREEN |
| +3 | Reduced size (75%), building | GREEN/YELLOW (Improving) |
| +2 | Reduced size (50%), capped | YELLOW |
| +1 | Small nibble at key levels | ORANGE/RED (at extreme support) |
| 0 | No new buys, hold | YELLOW/ORANGE or Slow Zone |
| -1 to -2 | Tighten stops, trim on bounce | RED |
| -3 to -4 | Significant trim, near exit | RED |
| -5 | Full exit | Eject |

### Daily Caps at a Glance

| Mode | Cap | Max Invested | Days to Full Position |
|------|-----|-------------|----------------------|
| GREEN | 30% of cash | 85% | 3-4 days |
| YELLOW_IMP | 20% | 70% | 4-5 days |
| YELLOW | 17.5% | 60% | 5-6 days |
| ORANGE | 10% | 40% | 10+ days |
| RED | 5% | 20% | 20+ days |
| Slow Zone | Halved (not 0%) | Per mode | Slower |
| EJECTED | 0% (oversold override only) | 50% core | ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â |

### Trim Caps at a Glance

| Mode | Trim Cap (% of remaining per level) | Logic |
|------|--------------------------------------|-------|
| GREEN | 10% | Let winners run |
| YELLOW | 20% | Symmetrical pacing |
| ORANGE | 25% | Bounces suspect |
| RED | 30% | Bounces are exits |

### EMA Extension Zone Quick Reference

| Extension Above Weekly 9 EMA | Status | Trim Action |
|------------------------------|--------|-------------|
| 0-8% | Normal | No extension trimming |
| 8-12% | Warming | Note but not actionable |
| 12-18% | Extended | First extension trim trigger (disabled in GREEN) |
| 18-25% | Stretched | Second trim regardless of mode |
| 25%+ | Extreme | Heavy trim (1.5x rate) -- mean reversion likely |

### 200 SMA Oversold Override Quick Reference

| Distance Below 200 SMA | Tier | Max Allocation | Instruments | Stabilization |
|---|---|---|---|---|
| -20% | Tier 1 | 10% | TSLA only | None |
| -30% | Tier 2 | 25% | 60% TSLA / 40% TSLL | 2 days no new lows |
| -40% | Tier 3 | 40% | 40% TSLA / 60% TSLL | 2 days no new lows |

### Acceleration Zone

Key Gamma Strike reclaim from below = start trim sequence. Below it, buy/hold territory. Above it, each resistance level triggers a trim.

### Indicator Priority

| Priority | Indicator | Tier | Purpose |
|----------|-----------|------|---------|
| 1 | BX-Trender (Weekly) | Tier 1: Long | Primary momentum regime |
| 2 | Weekly EMA Hierarchy (9/13/21) | Tier 1: Long | Trend structure levels |
| 3 | Market Structure (HH/HL/LL) | Tier 1/2 | Trend confirmation |
| 4 | BX-Trender (Daily) | Tier 2: Medium | Early warning / recovery signal |
| 5 | Daily 9/21 EMA | Tier 2: Medium | Trend confirmation, Slow Zone |
| 6 | SMI | Tier 2/3 | Leading momentum indicator |
| 7 | RSI | Tier 1/2 | Extremes and divergence flags |
| 8 | HIRO | Context | Dealer flow, conviction modifier |
| 9 | BX-Trender (4H) | Tier 3: Short | Entry timing |
| 10 | BX-Trender (1H) | Tier 4: Hourly | Intraday pullback zones |

---

## Summary

1. **Check your MODE before any action** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â GREEN / YELLOW / ORANGE / RED / EJECTED determines your behavior
2. **Mode is determined by CONFLUENCE** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â BX-Trender + Weekly EMAs + Structure + other indicators
3. **Tier 1 (Weekly) BX-Trender is primary momentum filter** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Weekly EMAs (9/13/21) provide structure context
4. **Tier 2 (Daily) leads Tier 1 (Weekly) by 1-2 weeks** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â When Daily is 2+ stages ahead in recovery, upgrade the mode
5. **Apply hysteresis** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Require 2+ signals sustained for 2+ days before changing mode (reduces whipsawing). Exception: downgrades to RED are immediate.
6. **Recognize catalysts** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Material thesis-confirming news overrides standard pacing rules
7. **Max invested caps enforce the ratchet automatically** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â GREEN 85%, YELLOW 60%, ORANGE 40%, RED 20%, EJECTED 50%
8. **Apply daily caps by mode** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â GREEN (30%), YELLOW_IMP (20%), YELLOW (17.5%), ORANGE (10%), RED (5%)
9. **Slow Zone halves your daily cap** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Price below D21 ÃƒÆ’Ã¢â‚¬â€ 0.98 = sizing reducer, not hard block. Inactive in GREEN/YELLOW_IMP.
10. **Kill Leverage is a partial exit, not a liquidation** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sell all leverage, trim TSLA to 50%. Weekly 21 EMA, 2 consecutive closes.
11. **200 SMA Oversold Override deploys into deep corrections** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Tier 1 (-20%) TSLA, Tier 2 (-30%) + TSLL, Tier 3 (-40%) TSLL-heavy. Tier 2/3 require stabilization.
12. **Downgrade exposure reduction is guided** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â GREENÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢YELLOW: no action needed. YELLOWÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ORANGE: soft recommendation to reduce. ORANGEÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢RED: strong suggestion to actively trim. Kill Leverage: mandatory.
13. **Use Fast-Track Re-Entry after ejection** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â If recovery confirms within 5 days, fast-track to ORANGE
14. **Structure breaks override everything** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â A lower low puts you in Red Mode regardless of other indicators
15. **Trim systematically into strength** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mode determines trim speed (GREEN 10%, YELLOW 20%, ORANGE 25%, RED 30% of remaining per level)
16. **Monitor EMA Extension** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â When 12%+ above Weekly 9 EMA, extension-based trimming applies (disabled in GREEN at 12% level)
17. **Protect the Core Hold** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Whatever remains after all trim levels is only sold on Kill Leverage or thesis break
18. **Orb Score v3 governs leveraged positioning** — 17 setups (11 buy + 6 avoid) collapsed into 4 zones: FULL SEND, NEUTRAL, CAUTION, DEFENSIVE. Validated across 1,005 trading days with 7.64pp spread at 20d. Override setups (Deep Value, Capitulation, Oversold Extreme) trigger TSLL allocation in NEUTRAL zone. See Orb Score Subscriber Guide for zone actions. Call Options Alert Guide v2.2 (INTERNAL) for setup definitions.

The goal is not to predict the correction. The goal is to recognize it early, adjust exposure progressively through max invested caps, pace your actions through daily caps, deploy aggressively into deeply oversold conditions, and reduce risk decisively if conditions break down.

**Capital preservation enables future opportunities. Staying 50% invested during corrections preserves your recovery participation.**

**The meta-principle:** In uncertain conditions, slow down, spread out, require better prices, and require proof. Speed kills portfolios. Patience preserves them. But the goal is controlled accumulation, not avoidance. When deeply oversold, lean into it with the oversold override. When selling into strength, let the mode determine the pace. And when conditions break, cut leverage first, keep core shares second.

---

*Document Version: 4.4*
*Purpose: Framework for avoiding corrections, managing drawdowns, enabling controlled accumulation, oversold rebound deployment, systematic profit-taking, and Orb Score v3 signal system with override logic*

**Version History:**
- v2.0: Added Part 7 - Pacing Rules & Graduated Response Actions
- v2.1: Added Appendix A - Monte Carlo Simulation Insights
- v2.2: Incorporated simulation improvements into core framework (Hysteresis Rule, Fast-Track Re-Entry Protocol)
- v2.3: Refinements based on daily report experience
- v2.4: Philosophy alignment with Guide v2.0 - accumulation mindset, 4H for Fast-Track (not 1H), daily caps 10-20% (not 25%), Red mode allows nibbles at extreme support
- v2.5: Major additions - Yellow (Improving) mode, Catalyst Override rules (Part 8), HIRO Extreme Handling (Part 8.5), Recovery Sequence modifiers, revised Position Sizing framework (Part 9)
- v2.6: Simplification pass - Hysteresis as principle not formula, Yellow sub-modes as conviction levels, consolidated damage reduction to 2 core tactics
- v2.7: Added Part 11 - Indicator Stoplight & Position Sizing Calculator (removed in v2.8)
- v2.8: Added 13 EMA to Weekly hierarchy, introduced ORANGE mode between Yellow and Red for cleaner 4-mode system. Weekly EMAs (9/13/21) tracked as additional input alongside BX-Trender (not replacement). Updated daily caps: GREEN 25-35%, YELLOW 15-20%, ORANGE 10%, RED 5%. Removed Part 11 and Monte Carlo appendix.
- v2.9: Aligned terminology with Daily Guide v3.5 - Tier 1 (Long/Weekly), Tier 2 (Medium/Daily), Tier 3 (Short/4H), Tier 4 (Hourly/1H). Added Slow Zone concept (Daily 21 EMA, originally "Pause Zone") as pre-eject warning level. Renamed "Claude's Take" to "Flacko AI's Take". Added HIRO direction-based guidance (trending up = trim later, trending down = nibble later). Clarified RSI is primarily for divergence detection on Weekly/Daily timeframes. Updated all references to use tier naming convention throughout.
- v3.0: Added Part 10 - Upside Profit-Taking Framework. Trim Cap system mirrors buy-side Daily Cap with inverse mode relationship (GREEN 10%, YELLOW 20%, ORANGE 25%, RED 30% of remaining per level). Sequential trimming at resistance levels. EMA Extension Zone metric (% above Weekly 9 EMA) for strong uptrend trimming. Acceleration Zone (Key Gamma Strike reclaim) as sell-side equivalent of Slow Zone. Core Hold concept for asymmetric thesis exposure. Optional Fibonacci extension levels with post-report follow-up workflow. Kill Leverage methodology updated to HIGHER-of logic (exit at first structural break, not last). "Pause Zone" renamed to "Slow Zone" throughout for clarity. Renumbered Quick Reference to Part 11.
- v4.0: Major backtest-validated update (3.5 years, 895 days, real BX-Trender data). Kill Leverage changed from full exit to partial exit (sell all leverage, trim TSLA to 50%). Slow Zone changed from hard block to sizing reducer (halves daily cap, inactive in GREEN/YELLOW_IMP). Added Max Invested Caps by mode (GREEN 85%, YELLOW 60%, ORANGE 40%, RED 20%) as tiered guidance (no forced trimming on GREENÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢YELLOW, soft recommendation on YELLOWÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ORANGE, strong suggestion on ORANGEÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢RED, mandatory on Kill Leverage only). Added Part 10.5 - 200 SMA Oversold Override with tiered deployment (-20%/-30%/-40%) and stabilization filter for Tier 2/3. EMA Extension thresholds raised from 8/12/15% to 12/18/25%. Daily caps updated to specific values: GREEN 30%, YELLOW_IMP 20%, YELLOW 17.5%, ORANGE 10%, RED 5%. BX-Trender value ranges removed (use relative bar comparison only). Added backtest evidence throughout. Strategy result: +68.9% return with -32.2% max drawdown vs +71.2%/-65.1% buy & hold over 3.5 years.
- v4.1: Added Part 12 - Call Options Alert Rules. Decision tree for evaluating call alert status daily (7 buy setups, 2 avoid signals, 3 reporting modes). Trigger conditions with backtest evidence for each setup. Avoid signal definitions. HIRO intraday timing guidance. General sizing principles (not prescriptive specs ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â call execution not yet validated by live track record). Coverage statistics. Fixed Alignment Matrix conflict: LL+HL now correctly maps to ORANGE (Improving) not YELLOW. "ORANGE (Improving)" is now a documented label. Summary updated with rule #18.
- v4.2: Part 12 refactored as pointer to Orb-managed documents. Setup count expanded from 7 buy + 2 avoid to 11 buy + 4 avoid. Evaluation automated via Orb engine. Subscriber-facing language uses public names only.
- v4.3: Statistics synced to Orb data dump with corrected SMI 10/3/3 parameters. Call Options Alert Guide v2.2 published as internal reference.
- v4.4: Major Orb evolution. Added EMA Shield Caution and Shield Break as avoid setups 16-17 (total: 17 setups). Introduced Orb Score v3 composite scoring with 4 zones (FULL SEND / NEUTRAL / CAUTION / DEFENSIVE), validated across 1,005 trading days with monotonic performance separation. Added Override system — Deep Value, Capitulation, and Oversold Extreme trigger TSLL instrument selection in NEUTRAL zone (all 44 historical instances confirmed in NEUTRAL). Alert system simplified to downside zone changes only. Call Options Alert Guide deprecated as subscriber-facing product, replaced by Orb Score Subscriber Guide. Part 12 fully rewritten to document the Orb Score v3 architecture.

---

## Part 12: Orb Score v3 Signal System

**As of v4.4, the signal system has evolved from individual setup reporting to a composite scoring system.** The 17 underlying setups are still evaluated daily, but subscribers interact with the Orb Score — a single number that maps to one of 4 action zones. This section documents the system architecture, zone definitions, and the override mechanism for high-conviction dip buys.

### What Orb Score v3 Does

Orb evaluates **17 TSLA setups** (11 buy + 6 avoid) daily at market close. Each setup contributes a weighted score based on its tier (S/A+/A/B+/B). The composite score maps to one of 4 zones:

| Zone | Score Range | Meaning | Subscriber Action |
|------|------------|---------|-------------------|
| **FULL SEND** | Highest | Multiple buy signals active, no avoids | Deploy TSLL. Maximum conviction. Daily cap per mode. |
| **NEUTRAL** | Mid-positive to mild negative | Mixed signals or quiet conditions | Hold TSLA shares. No new leveraged entries unless override fires. |
| **CAUTION** | Negative | Avoid signals outweighing buys | Take profits on leveraged positions. Reduce call exposure. |
| **DEFENSIVE** | Most negative | Strong avoid signals dominating | Exit leveraged positions. Cash preservation. |

**Validated performance (1,005 trading days, 17,085 daily snapshots):**

| Zone | Avg Return at 20d | Win Rate at 20d | Avg Return at 60d |
|------|-------------------|-----------------|-------------------|
| FULL SEND | +6.22% | 66% | +15.71% |
| NEUTRAL | +4.22% | 52% | +11.53% |
| CAUTION | -1.24% | 41% | +0.07% |
| DEFENSIVE | -1.84% | 43% | -4.05% |

**Spread:** 7.64pp at 20d between FULL SEND and DEFENSIVE. 19.76pp at 60d. Monotonic separation confirms zones are properly ordered.

### The 17 Setups

**Buy Setups (11):**
1. Goldilocks Zone (Tier A+)
2. Momentum Flip (Tier A)
3. Trend Confirmation (Tier A)
4. Deep Value Bounce (Tier A+)
5. Green Shoots (Tier B+)
6. Capitulation Bounce (Tier A)
7. Oversold Extreme (Tier S)
8. Trend Ride (Tier B)
9. Trend Continuation (Tier B)
10. Regime Shift (Tier A)
11. SMI Gauges (Tier B)

**Avoid Setups (6):**
12. Dual Lower Low (Tier A — strongest avoid)
13. Momentum Crack (Tier B+)
14. Overextended (Tier B)
15. Double Downtrend (Tier A)
16. EMA Shield Caution (Tier B+ — early warning, fires 2-5 days ahead of other avoids)
17. EMA Shield Break (Tier B+ — confirmed momentum deterioration)

**EMA Shield (setups 16-17) — added in v4.4:**
- **Shield Caution:** Price below Daily 9 EMA for 3+ days with slope < -2%. Early warning that uptrend momentum is fading. Historically fires 2-5 days before Dual Lower Low or other structural avoids.
- **Shield Break:** Price below Daily 9 EMA for 5+ days with slope < -2%. Confirmed breakdown. N=31, 41.9% win at 20d, -2.93% avg (vs baseline 53.7% / +3.46%). Signal is strongest when Weekly 9 EMA is still intact (daily leading weekly = correction is starting, not ending).

### The Override System — High-Conviction Dip Buys

**The problem Orb Score has:** When TSLA is deeply oversold and starting to recover, the best buy setups (Deep Value, Capitulation, Oversold Extreme) fire at the same time as avoid setups (Dual LL, EMA Shield). They partially cancel in the composite score, landing in NEUTRAL. NEUTRAL says "hold TSLA shares" — but these specific setups have historically produced outsized returns even in mixed-signal environments.

**The fix:** Three setups override instrument selection when they fire during NEUTRAL zone. The Orb Score still computes normally (correctly reflecting mixed conditions). Mode caps still apply (5-10% daily allocation). The only thing that changes: buying TSLL instead of TSLA, because these specific setups have earned it.

| Override Setup | Tier | When It Fires in NEUTRAL | Historical Performance |
|---------------|------|--------------------------|----------------------|
| **Oversold Extreme** | S | N=2, always in NEUTRAL | +53.5% avg at 20d, 100% win rate |
| **Deep Value Bounce** | A+ | N=14, always in NEUTRAL | +16.4% avg at 60d, 85.7% win rate |
| **Capitulation Bounce** | A | N=28, always in NEUTRAL | +12.5% avg at 20d, 70.6% win rate |

**Key finding:** All 44 override instances across all three setups landed in NEUTRAL — never FULL SEND, never CAUTION, never DEFENSIVE. The override is necessary because the composite scoring cannot distinguish "mixed because nothing is happening" from "mixed because the strongest buy signal just fired alongside active avoids."

**Capitulation note:** 85.7% of Capitulation signals fire with Dual LL also active ("dirty Capitulation"). Clean Capitulation averages +59.7% at 20d vs +6.2% for dirty. Both are positive. Mode cap controls the risk — dirty Capitulation in TSLL at 5% daily allocation is a small, controlled bet on a 70% win signal.

**Override does NOT fire in CAUTION or DEFENSIVE zones.** Data shows these setups simply don't activate when the composite score is that negative. Override is upgrading NEUTRAL, not overriding danger.

### How Orb Score Connects to the Share-Side System (Parts 1-10)

| | Share System (Parts 1-10) | Orb Score v3 (Part 12) |
|---|---|---|
| **Budget** | Mode daily caps (5-30% of cash) | Separate — does NOT count against share daily caps |
| **Inputs** | Same: BX, EMAs, RSI, SMI, SpotGamma, HIRO | Same inputs, composite scoring |
| **Mode interaction** | Mode governs shares directly | Orb zone governs instrument selection (TSLA vs TSLL) and call timing |
| **Evaluation** | Report writer determines mode | Orb evaluates automatically; report writer validates and adds Orb Score to report |
| **Override** | 200 SMA Oversold Override (Part 10.5) governs share-side deep dip buys | Orb override governs instrument selection (TSLL) for leveraged dip buys |

### Alert System

Subscribers receive alerts only for **downside zone changes** — when the Orb zone transitions to CAUTION or DEFENSIVE from a higher zone, or when CAUTION escalates to DEFENSIVE. Maximum one alert per day.

Override setup activations during NEUTRAL also trigger an alert, noting which setup fired and why TSLL is deployed.

No alerts for upward transitions (those are covered in the daily report). No individual setup alerts. No intraday alerts.

### Reference Documents

| Document | What It Contains | Access |
|----------|-----------------|--------|
| **Orb Score Subscriber Guide** | Zone descriptions, action tables, override explanations, Options Playbook | SUBSCRIBER-FACING — primary product |
| **Call Options Alert Guide v2.2** | All 17 setup definitions, exact conditions, backtest stats, decision flow | INTERNAL — report writer and engine reference |
| **Orb Proprietary Setup Reference** | Complete indicator formulas, thresholds, evaluation logic | CONFIDENTIAL — Justin only |
| **Daily Guide v5.1+** | Orb Score integration into daily report format | Report writer guide |
| **Override System Copy** | Corrected subscriber-facing language for override mechanism | Report and alert copy reference |

### What Changed from v4.3 Part 12

- **15 setups → 17 setups** (added EMA Shield Caution and EMA Shield Break as avoid setups 16-17)
- **Orb Score v3 introduced** — composite scoring with 4 zones replacing individual setup reporting for subscribers
- **Override system added** — Deep Value, Capitulation, Oversold Extreme trigger TSLL in NEUTRAL zone
- **Call Options Alert Guide deprecated as subscriber-facing** — now internal reference only, replaced by Orb Score zones
- **Alert system simplified** — downside zone changes only + override signals
- **1,005 days validated** with 17,085 daily snapshots confirming monotonic zone separation
- **Daily report format updated** — Orb Score + zone displayed prominently, "Tomorrow's Gameplan" forward-looking commentary structure
