# Trading Rulebook: Avoiding the Next Correction

## Purpose

This document provides a framework for:
1. Recognizing when market conditions are deteriorating (progressive red flags)
2. Adjusting exposure accordingly (ratcheting down, not averaging down)
3. Knowing when to exit completely (Master Eject level)
4. **Pacing purchases and using graduated responses to limit damage if wrong**
5. **Controlled accumulation at key levels even in defensive modes**
6. **Recognizing when material catalysts override normal pacing rules**
7. **Knowing when to pause new buys before full eject (Pause Zone)**

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
| **RED** | Trend broken or confirmed downtrend | Capital preservation - nibbles only at extreme support, Master Eject active |

**Key principle:** As conditions deteriorate, you REDUCE size and REQUIRE better prices. You can still accumulate, but more slowly and at better levels.

### The Ratchet Rule

Exposure adjustments move with conditions:

```
GREEN Mode -> YELLOW Mode
Action: Reduce new position sizing. Daily cap: 15-20%/day. Require better levels.

YELLOW Mode -> ORANGE Mode
Action: Reduce to small nibbles only. Daily cap: 10%/day. Tighten stops.

ORANGE Mode -> RED Mode
Action: Nibbles only at extreme support. Daily cap: 5%/day. Master Eject level is active.

Pause Zone Triggered (Daily 21 EMA lost)
Action: Stop new buys until bounce confirms. Reassess mode.

Master Eject Level Breaks
Action: Exit remaining position. Daily cap: 0%. No exceptions.
```

You can rebuild when conditions improve. You cannot recover capital lost to hoping.

### The Pause Zone

**What it is:** The Pause Zone is a pre-exit warning level — typically the Daily 21 EMA. When price loses this level, you stop adding new positions until a bounce confirms the level can be reclaimed.

**Why it matters:** The Pause Zone creates a graduated response between "controlled accumulation" and "Master Eject." It prevents you from buying into accelerating weakness while still allowing you to hold existing positions.

**The rule:**
- When price closes below Daily 21 EMA → Stop all new buys
- Wait for price to reclaim the level (close back above) before resuming
- If price continues lower toward Master Eject → You've preserved capital
- If price bounces and reclaims → Resume accumulation per mode rules

**Note:** Pause Zone is separate from mode. You can be in YELLOW mode but trigger Pause Zone if Daily 21 EMA breaks.

### The Hysteresis Rule

**The principle:** Don't flip-flop modes based on one day's price action. Require the picture to actually change before switching modes.

**In practice:**
- A single red day in an uptrend doesn't make it Yellow
- A single green day in a downtrend doesn't make it Green
- The overall pattern needs to shift - not just one data point

**The exceptions:**
- **Master Eject is always immediate.** Daily close below your eject level = out, regardless of mode.
- **Pause Zone is always immediate.** Daily close below Daily 21 EMA = stop new buys until reclaim.
- **Material catalysts can accelerate upgrades.** See Part 8: Catalyst-Aware Accumulation.

---

## Part 2: Inputs That Determine Your Mode

### Overview

Multiple inputs feed into determining your mode. No single indicator controls the decision - you're looking for confluence.

**The 4-Tier Timeframe System:**

| Tier | Name | Timeframe | Indicators | Purpose | Color Meaning |
|------|------|-----------|------------|---------|---------------|
| **Tier 1** | Long | Weekly | 9/13/21 EMA, BX-Trender, RSI (divergence) | Weekly trend — defines the game | 🟢 = healthy trend |
| **Tier 2** | Medium | Daily | 9/21 EMA, BX-Trender, SMI, RSI | Daily trend — confirming or diverging? | 🟢 = healthy trend |
| **Tier 3** | Short | 4H | 9/21 EMA, BX-Trender, SMI | Entry timing — good moment to buy? | 🟢 = good entry setup |
| **Tier 4** | Hourly | 1H | 9 EMA, BX-Trender, SMI | Pullback quality — at a buy zone? | 🟢 = at pullback zone |

**Key Principle:** Tier 1 (Long) + Tier 2 (Medium) determine MODE (trend health). Tier 3 (Short) + Tier 4 (Hourly) refine ENTRY TIMING (entry quality).

**Color Interpretation:**
- **Tier 1-2:** Colors = trend health. 🟢 GREEN means the trend is healthy/bullish. 🔴 RED means unhealthy/bearish.
- **Tier 3-4:** Colors = entry quality. 🟢 GREEN means it's a good entry setup (oversold, at pullback levels, selling exhausting). 🔴 RED means you'd be chasing (extended, overbought).

**Additional Context Inputs:**
- HIRO (dealer positioning) — conviction modifier and intraday timing
- SpotGamma levels — key support/resistance from options flow
- Market Structure (HH/HL/LL) — trend confirmation

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
BX-Trender is a histogram that visualizes buying and selling pressure. Green bars = buying pressure. Red bars = selling pressure.

**Why it matters:**
BX-Trender shows you the momentum behind price movement. More importantly, the PATTERN of the bars (getting taller or shorter) tells you if that momentum is increasing or fading - often before price confirms.

**How to read it:**

| Color | Value Range | Meaning |
|-------|-------------|---------|
| Dark Green | > +30 | Strong buying pressure |
| Light Green | 0 to +30 | Buying pressure present but watch for weakening |
| Light Red | -30 to 0 | Selling pressure but potentially exhausting |
| Dark Red | < -30 | Strong selling pressure |

| Pattern | What It Looks Like | Meaning |
|---------|-------------------|---------|
| **HH (Higher High)** | Green bars getting taller | Buying pressure increasing |
| **LH (Lower High)** | Green bars getting shorter | Buying pressure weakening |
| **HL (Higher Low)** | Red bars getting shorter | Selling pressure exhausting |
| **LL (Lower Low)** | Red bars getting deeper | Selling pressure increasing |

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

### Input #3: Weekly EMA Hierarchy (9/13/21) — Tier 1: Long

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
- BX-Trender green HH + above all EMAs = strong GREEN
- BX-Trender green LH + testing 9 EMA = early warning, watch closely
- BX-Trender red + below 13 EMA = likely ORANGE
- BX-Trender red LL + below 21 EMA = likely RED

**Important:** Weekly EMA status is ONE input into mode determination, not the sole determinant. A stock can lose the 9 EMA but still be in GREEN mode if BX-Trender is strong and structure is intact. Look for confluence.

---

### Input #4: Daily 9/21 EMA — Tier 2: Medium

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

**Pause Zone:** The Daily 21 EMA serves as the Pause Zone trigger. If price closes below it, stop new buys until it reclaims.

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

**How to read it — Level-Based (Conviction Adjustment):**

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

**How to read it — Direction-Based (Intraday Timing):**

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
| LL | HL | Any | Early Recovery | WATCH | Yellow - pause reductions, watch for entry |
| LL | HH | Any | Recovery Building | IMPROVING | Yellow (Improving) - begin meaningful adds |
| HL | HH | HH | Recovery Confirmed | HIGH | Green - can rebuild |

### Recovery Sequence Mode Modifiers

When Tier 2 (Daily) is leading Tier 1 (Weekly) in a recovery sequence, the mode should be adjusted upward:

| Tier 1 (Weekly) BX | Tier 2 (Daily) BX | Base Mode | Adjusted Mode |
|--------------------|-------------------|-----------|---------------|
| LL | LL | Orange/Red | Orange/Red (no change) |
| LL | HL | Orange | Yellow (early recovery signal) |
| LL | HH | Orange | Yellow (Improving) - near Green |
| HL | HH | Yellow | Green (recovery confirmed) |
| HH | HH | Green | Green (fully bullish) |

**Key principle:** When Tier 2 (Daily) is 2+ stages ahead of Tier 1 (Weekly) in the recovery sequence, treat the mode as one level better than Weekly alone would indicate.

### How This Modifies the Ratchet Rule

**Original Ratchet Rule:** Exposure only moves one direction as conditions worsen.

**Modified Ratchet Rule:** Exposure direction is determined by Tier 1 (Weekly), but SPEED of adjustment is informed by Tier 2 (Daily).

| Scenario | Tier 1 (Weekly) Says | Tier 2 (Daily) Says | Adjustment |
|----------|----------------------|---------------------|------------|
| Weekly LH, Daily HH | Getting cautious | Already recovering | Slow the reduction - Daily suggests turn coming |
| Weekly LH, Daily LL | Getting cautious | Getting worse | Accelerate the reduction - Daily confirms weakness |
| Weekly LL, Daily HL | Stay defensive | Recovering | Pause reductions - Daily suggests bottom forming |
| Weekly LL, Daily HH | Stay defensive | Strong recovery | Begin accumulation - Daily 2 stages ahead |
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
- Prepare for possible exit (know your Master Eject level)
- **Require bounce confirmation before any buys**
- **Watch for Pause Zone (Daily 21 EMA loss)**

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
- Prepare for possible exit (know your Master Eject level)
- Require "prove it" bounce before any meaningful adds
- Consider hedge offset if buying at all
- **Pause Zone likely already triggered**

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
- Master Eject level is ACTIVE - if it breaks, exit remaining
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

After a Master Eject, you're in capital preservation mode. However, V-bottom recoveries can happen quickly, and waiting too long means missing significant upside. This protocol allows accelerated re-entry when specific conditions confirm the bottom is in.

**Trigger:** You've ejected and price is recovering.

**Timeframe:** Within 5 trading days of ejection.

**All conditions must be met:**

| # | Condition | What to Check | Why It Matters |
|---|-----------|---------------|----------------|
| 1 | Price reclaims 21 EMA | Daily close above 21 EMA | Structure attempting recovery |
| 2 | HIRO flips strongly positive | HIRO > 0 and rising | Dealers buying, not selling |
| 3 | Tier 3 (4H) momentum confirms | BX-Trender HH pattern + SMI bullish cross | Near-term momentum supports bounce (4H is more reliable than 1H for swing trading) |

**If all three conditions are met within 5 days:**
- Fast-track directly to ORANGE Mode (skip extended observation period)
- Begin rebuilding at 10%/day pace immediately
- Set new Master Eject at the low that triggered the original ejection

**If conditions are NOT met within 5 days:**
- Remain in Ejected state
- Standard mode upgrade rules apply (slower, requires more confirmation)
- This was likely a real correction, not a V-bottom - patience was correct

**Why this matters:** Analysis shows ~45% of ejections are followed by 20%+ recoveries. This protocol captures more of those recoveries while maintaining the protection that the ejection provided.

---

## Part 4: Master Eject Level

### Concept

The Master Eject Level is your "line in the sand" - a pre-defined price level where you exit remaining exposure with no exceptions.

**Why it matters:**
In the heat of the moment, you will be tempted to hold, hope, or average down. The Master Eject Level removes decision-making from that moment. It's decided in advance when you're thinking clearly.

**Key principle:** The Master Eject is non-negotiable. If price closes below it on the Daily timeframe, you exit. No "let's see how tomorrow opens." Done.

### How to Set It

The Master Eject Level should be based on confluence of:

| Input | Example Level |
|-------|---------------|
| **Structure** | Previous swing low (breaking it = LL confirmed) |
| **SpotGamma** | Put Wall (below it = dealer support gone) |
| **Weekly 21 EMA** | Major trend support |
| **Technical** | Daily 50 EMA |
| **Fixed %** | X% below your average cost |

**Recommendation:** Use structure or SpotGamma levels as primary, technical levels as confirmation.

**Example:**
> "Weekly swing low is $380. Put Wall is $375. Master Eject = Daily close below $375."

### The "Can't Reclaim" Rule

When price breaks a key level intraday:
- Give it 30 minutes to reclaim
- If it can't reclaim within 30 minutes, that's real selling, not a stop hunt
- Act accordingly (cut or exit per your rules)

### Pause Zone vs. Master Eject

| Level | What It Is | When Triggered | Action |
|-------|------------|----------------|--------|
| **Pause Zone** | Daily 21 EMA | Price closes below | Stop new buys until reclaim |
| **Master Eject** | Put Wall / Structure | Price closes below | Exit all positions immediately |

The Pause Zone gives you a warning before Master Eject. If price loses Daily 21 EMA but holds above Master Eject, you're in a "wait and see" mode — not buying, not selling.

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

### Using SpotGamma for Master Eject

- **Put Wall** is often a logical Master Eject level
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
| Daily 21 EMA (Pause Zone) | $XXX | Trend health - if lost, stop new buys |
| Last Higher Low (Structure Support) | $XXX | Key uptrend support - if broken, structure breaks (lower low confirmed) |
| Put Wall | $XXX | SpotGamma institutional support - if broken, expect acceleration lower |
| Hedge Wall | $XXX | Early warning support - losing this is first sign of trouble |

#### Mode Triggers

| To Upgrade (toward GREEN) | To Downgrade (toward RED) |
|---------------------------|---------------------------|
| [What would improve conditions] | [What would worsen conditions] |

#### Pause Zone Status

**Pause Zone Level:** $XXX (Daily 21 EMA)

**Status:** [ACTIVE - no new buys / CLEAR - accumulation permitted]

**The Rule:** If price closes below this level, stop all new buys until price reclaims it.

#### Master Eject Level

**Level: $XXX**

**Why this level:**
> [2-3 sentences explaining the rationale - what confluence of structure, SpotGamma, and/or technical levels led to this being the line in the sand.]
>
> Example: "The Master Eject is set at $375, which is just below the Put Wall ($378) and the last higher low from the weekly structure ($380). A daily close below $375 would mean both dealer support has failed AND the uptrend structure is broken - there's no reason to hold at that point. This level represents the point where the thesis is invalidated."

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
| **Pause Zone Triggered** | 0% - no new buying | Wait for reclaim before resuming |
| **Master Eject Triggered** | 0% - no buying | Capital preservation mode. Cash is a position. |

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
    Is Pause Zone triggered (below Daily 21 EMA)?
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
5. **Exit** - Master Eject triggered

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
| **0** | No new buys, hold existing | YELLOW/ORANGE Transition OR Pause Zone | Wait for clarity |
| **-1** | No new buys, tighten stops | RED - defensive | Protect gains, limit losses |
| **-2** | Trim 25% on bounces | RED - deteriorating | Reduce exposure proactively |
| **-3** | Trim 50% on bounces | RED - serious concern | Significant risk reduction |
| **-4** | Exit 75%, keep starter | RED - near eject | Preserve capital, keep optionality |
| **-5** | Full exit - Master Eject | Structure broken, floor gone | Capital preservation mode |

#### Mapping Actions to Modes

| Mode | Typical Action Range | Default Posture |
|------|---------------------|-----------------|
| **GREEN** | +3 to +5 | Normal to aggressive buying |
| **YELLOW (Improving)** | +2 to +4 | Building into recovery |
| **YELLOW** | 0 to +2 | Cautious, controlled accumulation |
| **ORANGE** | 0 to +1 | Small nibbles at best levels |
| **RED** | -3 to +1 | Trimming, holding, or small nibbles at extreme levels |
| **Pause Zone** | 0 | No new buys, hold existing |
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

### Updated Mode Behavior Summary (with Pacing)

| Mode | Position Sizing | Daily Cap | Primary Actions | Damage Reduction Tactics |
|------|-----------------|-----------|-----------------|--------------------------|
| **GREEN** | 100% (full) | 25-35% | +3 to +5: Normal to aggressive | Scaled entries optional |
| **YELLOW (Improving)** | 50-75% | 20% | +2 to +4: Building into recovery | Scaled entries recommended |
| **YELLOW** | 50-75% | 15-20% | 0 to +2: Controlled accumulation | Time buffer, bounce required, scaled entries |
| **ORANGE** | 25-50% | 10% | 0 to +1: Small nibbles only | All tactics recommended |
| **RED** | 25% or less | 5% | -3 to +1: Trimming, holding, or nibbling at extreme support | All tactics required |
| **Pause Zone** | 0% new | 0% | 0: No new buys, hold existing | Wait for reclaim |
| **Eject** | 0% | 0% | -5: Full exit | None - just exit |

---

### Updated Ratchet Rule (with Pacing and Pause Zone)

```
GREEN Mode -> YELLOW Mode
- Reduce position sizing to 50-75%
- Daily cap: 15-20% of target size
- Require better prices for entries
- Require bounce confirmation for any buys

YELLOW Mode -> ORANGE Mode
- Reduce position sizing to 25-50%
- Daily cap: 10% of target size
- Master Eject level watch begins
- Require "prove it" test for any buys

ORANGE Mode -> RED Mode
- Reduce to nibbles only at extreme support
- Daily cap: 5% of target size
- Master Eject level is ACTIVE
- Enable 2-3 day time buffer before acting

Pause Zone Triggered (Daily 21 EMA lost)
- Stop all new buys immediately
- Hold existing positions
- Wait for price to reclaim Daily 21 EMA before resuming
- Does NOT require mode change

Master Eject Level Breaks
- Exit remaining position
- Daily cap: 0% - no buying
- No exceptions. No "let's see how tomorrow opens."
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

1. **Master Eject still active** - A catalyst doesn't change your stop loss
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

## Part 10: Quick Reference

### Mode Summary

| Mode | Key Indicators | Behavior | Daily Cap |
|------|----------------|----------|-----------|
| GREEN | BX green HH, above all EMAs, structure intact | Normal dip-buying, full size | 25-35% |
| YELLOW | BX LH or light red, testing 9 EMA, structure ok | Controlled accumulation at key levels | 15-20% |
| ORANGE | BX red, below 13 EMA, structure stressed | Small nibbles only | 10% |
| RED | BX red LL, below 21 EMA, structure broken | Nibbles at extreme support only, Master Eject active | 5% |

### Ratchet Rule

```
GREEN -> YELLOW: BX-Trender LH, loses 9 EMA, daily cap 15-20%
YELLOW -> ORANGE: BX-Trender red, loses 13 EMA, daily cap 10%
ORANGE -> RED: BX-Trender LL, loses 21 EMA or structure breaks, daily cap 5%
Pause Zone (Daily 21 EMA): Stop new buys until reclaim
RED + Eject breaks: Exit remaining, no exceptions
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
Exception: Master Eject is always immediate.
Exception: Pause Zone is always immediate.
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
| 0 | No new buys, hold | YELLOW/ORANGE or Pause Zone |
| -1 to -2 | Tighten stops, trim on bounce | RED |
| -3 to -4 | Significant trim, near exit | RED |
| -5 | Full exit | Eject |

### Daily Caps at a Glance

| Mode | Cap | Days to Full Position |
|------|-----|----------------------|
| GREEN | 25-35% | 3-4 days |
| YELLOW | 15-20% | 5-7 days |
| ORANGE | 10% | 10+ days |
| RED | 5% | 20+ days |
| Pause Zone | 0% | N/A - waiting for reclaim |

### Indicator Priority

| Priority | Indicator | Tier | Purpose |
|----------|-----------|------|---------|
| 1 | BX-Trender (Weekly) | Tier 1: Long | Primary momentum regime |
| 2 | Weekly EMA Hierarchy (9/13/21) | Tier 1: Long | Trend structure levels |
| 3 | Market Structure (HH/HL/LL) | Tier 1/2 | Trend confirmation |
| 4 | BX-Trender (Daily) | Tier 2: Medium | Early warning / recovery signal |
| 5 | Daily 9/21 EMA | Tier 2: Medium | Trend confirmation, Pause Zone |
| 6 | SMI | Tier 2/3 | Leading momentum indicator |
| 7 | RSI | Tier 1/2 | Extremes and divergence flags |
| 8 | HIRO | Context | Dealer flow, conviction modifier |
| 9 | BX-Trender (4H) | Tier 3: Short | Entry timing |
| 10 | BX-Trender (1H) | Tier 4: Hourly | Intraday pullback zones |

---

## Summary

1. **Check your MODE before any action** - GREEN / YELLOW / ORANGE / RED determines your behavior
2. **Mode is determined by CONFLUENCE** - BX-Trender + Weekly EMAs + Structure + other indicators
3. **Tier 1 (Weekly) BX-Trender is primary momentum filter** - Weekly EMAs (9/13/21) provide structure context
4. **Tier 2 (Daily) leads Tier 1 (Weekly) by 1-2 weeks** - When Daily is 2+ stages ahead in recovery, upgrade the mode
5. **Apply hysteresis** - Require 2+ signals sustained for 2+ days before changing mode (reduces whipsawing)
6. **Recognize catalysts** - Material thesis-confirming news overrides standard pacing rules
7. **Adjust size and price requirements as conditions worsen** - Smaller size, better prices, not necessarily zero buying
8. **Apply daily caps by mode** - GREEN (25-35%), YELLOW (15-20%), ORANGE (10%), RED (5%)
9. **Use the action spectrum** - Graduated responses from +5 (aggressive) to -5 (full exit)
10. **Deploy damage reduction tactics** - Scaled entries, time buffers, bounce requirements, "prove it" tests
11. **Respect the Pause Zone** - Daily 21 EMA loss = stop new buys until reclaim
12. **Know your Master Eject Level** - Pre-defined, non-negotiable exit point
13. **Use Fast-Track Re-Entry after ejection** - If V-bottom signals confirm within 5 days, accelerate return to Orange Mode
14. **Structure breaks override everything** - A lower low puts you in Red Mode regardless of other indicators

The goal is not to predict the correction. The goal is to recognize it early, adjust size and price requirements progressively, pace your actions, and have a clear exit if it becomes serious.

**Capital preservation enables future opportunities. But staying 100% cash during pullbacks means missing accumulation opportunities.**

**The meta-principle:** In uncertain conditions, slow down, spread out, require better prices, and require proof. Speed kills portfolios. Patience preserves them. But the goal is controlled accumulation, not avoidance.

---

*Document Version: 2.9*
*Purpose: Framework for avoiding corrections and managing drawdowns while enabling controlled accumulation*

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
- v2.9: Aligned terminology with Daily Guide v3.5 - Tier 1 (Long/Weekly), Tier 2 (Medium/Daily), Tier 3 (Short/4H), Tier 4 (Hourly/1H). Added Pause Zone concept (Daily 21 EMA) as pre-eject warning level. Renamed "Claude's Take" to "Flacko AI's Take". Added HIRO direction-based guidance (trending up = trim later, trending down = nibble later). Clarified RSI is primarily for divergence detection on Weekly/Daily timeframes. Updated all references to use tier naming convention throughout.
