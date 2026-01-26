# Trading Rulebook: Avoiding the Next Correction

## Purpose

This document provides a framework for:
1. Recognizing when market conditions are deteriorating (progressive red flags)
2. Adjusting exposure accordingly (ratcheting down, not averaging down)
3. Knowing when to exit completely (Master Eject level)
4. **Pacing purchases and using graduated responses to limit damage if wrong**
5. **Controlled accumulation at key levels even in defensive modes**

**The core problem this solves:** Buying dips that become corrections, averaging down into weakness, and giving back months of gains in a single drawdown.

**The solution:** A traffic light system that tells you what MODE you're in and how to behave in each mode — determined before emotions take over.

**The swing trader's mindset:** We are NOT momentum day traders. We are swing traders building medium/long-term positions (3-6-9 month calls). Pullbacks are OPPORTUNITIES to accumulate at better prices, not just threats to avoid. The question isn't "should I buy?" but "how much should I buy at these levels?"

---

## Part 1: The Traffic Light System

### Concept

Instead of treating every dip as a buying opportunity, you first determine which MODE the market is in. Your behavior changes based on the mode.

| Mode | Meaning | Your Posture |
|------|---------|--------------|
| 🟢 **Green** | Uptrend intact, momentum healthy | Normal operations — buy dips per your strategy |
| 🟡 **Yellow** | Warning signs present, trend weakening | Defensive — reduce size, controlled accumulation at key levels, tighten stops |
| 🔴 **Red** | Trend broken or confirmed downtrend | Capital preservation — nibbles only at extreme support, Master Eject active |

**Key principle:** As conditions deteriorate, you REDUCE size and REQUIRE better prices. You can still accumulate, but more slowly and at better levels.

### The Ratchet Rule

Exposure adjustments move with conditions:

```
🟢 Green Mode → 🟡 Yellow Mode
Action: Reduce new position sizing. Daily cap: 10-20%/day. Require better levels.

🟡 Yellow Mode → 🔴 Red Mode
Action: Reduce to nibbles only at extreme support. Daily cap: 10%/day. Master Eject level is active.

Master Eject Level Breaks
Action: Exit remaining position. Daily cap: 0%. No exceptions.
```

You can rebuild when conditions improve. You cannot recover capital lost to hoping.

### The Hysteresis Rule

**Problem:** Without hysteresis, you'll whipsaw between modes on every small fluctuation — triggering repeated reductions and re-adds, accumulating transaction costs and emotional fatigue.

**Solution:** Require stronger signals to CHANGE mode than to STAY in current mode.

| Current Mode | To Downgrade (requires) | To Upgrade (requires) |
|--------------|------------------------|----------------------|
| 🟢 Green | 2+ warning signals sustained for 2 days | N/A — already best mode |
| 🟡 Yellow | 2+ breakdown signals sustained for 2 days | 2+ recovery signals sustained for 2 days |
| 🔴 Red | N/A — Master Eject is the only further downgrade | 2+ recovery signals sustained for 3 days |

**Example:** You're in Green Mode. Daily price dips below 21 EMA for one day but recovers the next day.
- Without hysteresis: You shifted to Yellow on Day 1, back to Green on Day 2 — whipsaw.
- With hysteresis: You stay Green because the signal wasn't sustained for 2 days.

**The exception:** Master Eject is always immediate. If price closes below your eject level, you exit regardless of how long you've been in Red Mode.

---

## Part 2: Inputs That Determine Your Mode

### Overview

Multiple inputs feed into determining your mode. No single indicator controls the decision — you're looking for confluence.

| Category | Inputs | Timeframe |
|----------|--------|-----------|
| **Structure** | Higher Highs / Higher Lows | Weekly, Daily |
| **Trend Momentum** | BX Trender (color + pattern) | Weekly, Daily |
| **Trend Confirmation** | 9/21 EMA (position, slope, cross) | Daily |
| **Momentum Timing** | SMI (cross status, direction) | Daily, 4H |
| **Caution Flags** | RSI (extremes, divergence) | Daily |
| **Confirmation** | MACD Histogram → Crossover | Daily |

### Input #1: Market Structure

**What it is:**
Market structure refers to the pattern of swing highs and swing lows that price creates. It's the most objective measure of trend.

**Why it matters:**
Structure tells you whether the trend is intact. If we're making higher highs and higher lows, buyers are in control. If we make a lower low, the structure is broken and the uptrend is over — regardless of what other indicators say.

**How to read it:**

| Structure State | Definition | Implication |
|-----------------|------------|-------------|
| **Bullish (HH/HL)** | Each high is higher than the last, each low is higher than the last | Uptrend intact — dips are buyable |
| **Weakening** | Still making HH, but current low is testing previous HL | Trend at risk — caution warranted |
| **Broken (LL confirmed)** | Price closed below previous swing low | Uptrend is over — defensive mode |

**Key rule:** A confirmed lower low (LL) on the Daily or Weekly timeframe puts you in 🔴 Red Mode, regardless of other indicators.

---

### Input #2: BX Trender

**What it is:**
BX Trender is a histogram that visualizes buying and selling pressure. Green bars = buying pressure. Red bars = selling pressure.

**Why it matters:**
BX Trender shows you the momentum behind price movement. More importantly, the PATTERN of the bars (getting taller or shorter) tells you if that momentum is increasing or fading — often before price confirms.

**How to read it:**

| Color | Value Range | Meaning |
|-------|-------------|---------|
| Dark Green | > +30 | Strong buying pressure |
| Light Green | 0 to +30 | Buying pressure present but watch for weakening |
| Light Red | -30 to 0 | Selling pressure but potentially exhausting |
| Dark Red | < -30 | Strong selling pressure |

| Pattern | What It Looks Like | Meaning |
|---------|-------------------|---------|
| **HH (Higher High)** | Green bars getting taller | Buying pressure increasing ✅ |
| **LH (Lower High)** | Green bars getting shorter | Buying pressure weakening ⚠️ |
| **HL (Higher Low)** | Red bars getting shorter | Selling pressure exhausting ⚠️ |
| **LL (Lower Low)** | Red bars getting deeper | Selling pressure increasing ❌ |

**Warning sequence:**

```
Bright Green (HH) → Dark Green (LH) → Light Red → Dark Red (LL)
      ✅              ⚠️ First warning    ⚠️ Major warning    ❌
```

- **First warning sign:** LH pattern (bars shrinking while still green) — momentum fading
- **Major warning sign:** Color flip from green to red — regime change

**Timeframe usage:**
- Weekly BX Trender = Primary regime filter
- Daily BX Trender = Confirmation and timing

---

### Input #3: 9 & 21 EMA

**What it is:**
Exponential Moving Averages (EMAs) smooth price data to show trend direction. The 9 EMA is faster (more reactive), the 21 EMA is slower (more stable).

**Why it matters:**
EMAs give you an objective, visual read on trend. The relationship between price and the EMAs — plus the slope of the EMAs themselves — tells you whether buyers or sellers are in control.

**How to read it:**

| Element | Bullish | Bearish |
|---------|---------|---------|
| **Price vs EMAs** | Price above both 9 and 21 | Price below both 9 and 21 |
| **EMA slope** | Both sloping upward | Both sloping downward |
| **9/21 relationship** | 9 above 21 | 9 below 21 |

**Key signals:**

| Signal | Meaning | Mode Implication |
|--------|---------|------------------|
| Price above both EMAs, both sloping up | Healthy uptrend | 🟢 Green |
| Price testing 21 EMA, EMAs flattening | Trend weakening | 🟡 Yellow |
| 9 EMA crosses below 21 EMA | Bearish crossover — trend turning | 🟡→🔴 Transition |
| Price below both EMAs, both sloping down | Confirmed downtrend | 🔴 Red |

**Timeframe usage:**
- Daily EMA cross = Actionable signal (earlier, may have fakeouts)
- Weekly EMA cross = Confirmation (slower, more reliable)

---

### Input #4: SMI (Stochastic Momentum Index)

**What it is:**
SMI measures momentum by comparing the current close to the midpoint of the recent range. It oscillates between extreme values and generates cross signals.

**Why it matters:**
SMI is a leading indicator — it often turns before MACD and before price confirms. This makes it valuable for early warnings and timing entries.

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
| **Bullish cross** (fast line crosses above slow) | Momentum turning up ✅ |
| **Bearish cross** (fast line crosses below slow) | Momentum turning down ❌ |
| **Cross imminent** (lines converging) | Watch closely ⚠️ |

**Key rule:** Read the SLOPE, not just position. A bullish cross at -60 is more significant than sitting at +40.

**Timeframe usage:**
- Daily SMI = Primary momentum read
- 4H SMI = Entry timing and early warnings

---

### Input #5: RSI (Relative Strength Index)

**What it is:**
RSI measures the speed and magnitude of recent price changes on a scale of 0-100.

**Why it matters:**
RSI is most useful at extremes and for spotting divergences. It's not a primary signal, but a "pay attention" flag.

**How to read it:**

| Reading | Status | Interpretation |
|---------|--------|----------------|
| > 70 | Overbought | Pullback risk — not a sell signal alone, but caution |
| 50-70 | Bullish | Healthy uptrend territory |
| 40-50 | Weak | Below bullish threshold |
| 30-40 | Oversold approaching | Bounce probability increasing |
| < 30 | Extreme oversold | High bounce probability IF support holds |

**Divergences (important caution flags):**

| Divergence | What It Looks Like | Meaning |
|------------|-------------------|---------|
| **Bearish divergence** | Price makes higher high, RSI makes lower high | Momentum weakening despite price rise — caution ⚠️ |
| **Bullish divergence** | Price makes lower low, RSI makes higher low | Selling pressure exhausting — potential reversal |

**Usage:** RSI divergences are caution flags, not action signals. They suggest conditions are changing but need confirmation from other indicators.

---

### Input #6: MACD Histogram

**What it is:**
MACD (Moving Average Convergence Divergence) measures trend momentum. The histogram specifically shows the difference between the MACD line and signal line.

**Why it matters:**
MACD is a lagging indicator, so it's best used for confirmation rather than early signals. However, the histogram gives you an earlier read — it shrinks before the crossover happens.

**How to read it:**

| Histogram State | Meaning |
|-----------------|---------|
| Positive and growing | Bullish momentum increasing ✅ |
| Positive but shrinking | Bullish momentum fading — early warning ⚠️ |
| Flips negative | Bearish momentum confirmed ❌ |
| Negative and growing (deeper) | Bearish momentum increasing ❌ |
| Negative but shrinking | Bearish momentum fading — potential reversal ⚠️ |

**Signal sequence:**

```
Histogram shrinking → Histogram flips sign → MACD crossover
   Early warning         Confirmation          Full confirmation
```

**Usage:** Watch histogram for early warning, use crossover as confirmation of trend change.

---

## Part 2.5: Timeframe Alignment — The Early Warning System

### The Problem with Weekly-Only Focus

Weekly BX-Trender is the primary regime filter, but it has a critical limitation: **it's lagging by design.** By the time Weekly confirms a trend change, you may have:
- Missed 1-2 weeks of a new uptrend (recovery)
- Stayed long 1-2 weeks into a new downtrend (deterioration)

### The Solution: Daily as Early Warning

**Daily BX-Trender leads Weekly by approximately 1-2 weeks.**

This means:
- When Daily starts making LH while Weekly is still HH → Weekly will likely follow in 1-2 weeks
- When Daily starts making HL while Weekly is still LL → Weekly will likely follow in 1-2 weeks

**Use Daily to anticipate, use Weekly to confirm.**

### Deterioration Sequence (Early Warning for Downturns)

| Stage | Daily BX | Weekly BX | What's Happening | Your Response |
|-------|----------|-----------|------------------|---------------|
| **1. Early Warning** | LH (first) | HH | Daily momentum fading, Weekly still strong | Note it. Tighten mental stops. Don't ignore. |
| **2. Confirmed Fade** | LH/LL | LH | Both fading, trend weakening | Reduce size to 75%. Stop adding at current levels. |
| **3. Deteriorating** | LL | LH/LL | Daily leading down, Weekly following | Yellow Mode. Require better prices for adds. |
| **4. Full Bearish** | LL | LL | All timeframes aligned bearish | Yellow Severe. Small nibbles at extreme support only. |

**Key insight:** Don't wait for Weekly to show LH before getting cautious. Daily LH is your early warning — respond to it.

### Recovery Sequence (Early Warning for Upturns)

| Stage | Daily BX | Weekly BX | What's Happening | Your Response |
|-------|----------|-----------|------------------|---------------|
| **1. Early Hope** | HL (first) | LL | Daily selling exhausting, Weekly still negative | Note it. Watch for continuation. Don't chase yet. |
| **2. Building** | HL/HH | LL | Daily recovering, Weekly lagging | Start planning re-entry. Watch for confirmation. |
| **3. Recovering** | HH | HL | Daily confirmed, Weekly turning | Can begin adding (with daily caps). |
| **4. Full Bullish** | HH | HH | All timeframes aligned bullish | Green Mode. Normal operations. |

**Key insight:** Don't wait for Weekly to flip green before considering re-entry. Daily HH with Weekly HL means the turn is likely in progress.

### The Alignment Matrix

| Weekly | Daily | 4H | Status | Conviction Level | Mode Adjustment |
|--------|-------|-----|--------|------------------|-----------------|
| HH | HH | HH | ✅ Fully Aligned UP | HIGH | Green — full size |
| HH | LH | Any | ⚠️ Early Deterioration | MODERATE | Green with caution — 75% size |
| LH | LH | LH | ⚠️ Fading | MODERATE | Yellow — standard rules |
| LH | LL | Any | ❌ Accelerating Down | LOW | Yellow Severe — small nibbles only |
| LL | LL | LL | ❌ Fully Aligned DOWN | LOW | Yellow Severe / Red |
| LL | HL | Any | 🔄 Early Recovery | WATCH | Yellow — pause reductions, watch for entry |
| LL | HH | Any | 🔄 Recovery Building | IMPROVING | Yellow Improving — can begin small adds |
| HL | HH | HH | ✅ Recovery Confirmed | HIGH | Green — can rebuild |

### How This Modifies the Ratchet Rule

**Original Ratchet Rule:** Exposure only moves one direction as conditions worsen.

**Modified Ratchet Rule:** Exposure direction is determined by Weekly, but SPEED of adjustment is informed by Daily.

| Scenario | Weekly Says | Daily Says | Adjustment |
|----------|-------------|------------|------------|
| Weekly LH, Daily HH | Getting cautious | Already recovering | Slow the reduction — Daily suggests turn coming |
| Weekly LH, Daily LL | Getting cautious | Getting worse | Accelerate the reduction — Daily confirms weakness |
| Weekly LL, Daily HL | Stay defensive | Recovering | Pause reductions — Daily suggests bottom forming |
| Weekly LL, Daily LL | Stay defensive | Still weak | Continue defensive — no bottom signal yet |

### Practical Application

**Before each report, ask:**

1. **What is Weekly BX showing?** (Primary regime filter)
2. **What is Daily BX showing?** (Early warning / confirmation)
3. **Are they aligned or diverging?**
4. **If diverging, which direction is Daily leading?**

**Then adjust conviction:**

- **Aligned:** High conviction in the mode call
- **Daily leading in same direction as Weekly:** Very high conviction, trend accelerating
- **Daily diverging from Weekly:** Lower conviction in current mode, prepare for transition

### Examples

**Example 1: January 2026 Selloff**
- Weekly: Dark Red, LL (selling increasing)
- Daily: Dark Red, LL (selling increasing)
- 4H: Dark Green, LH (buying fading)
- **Alignment:** Fully aligned bearish
- **Conviction:** HIGH that Yellow Severe is correct
- **Action:** Small nibbles at extreme support only, no chasing bounces

**Example 2: Hypothetical Recovery Setup**
- Weekly: Dark Red, LL (still selling)
- Daily: Dark Red, HL (selling EXHAUSTING — early signal!)
- 4H: Light Green, HH (bouncing)
- **Alignment:** Daily diverging bullish
- **Conviction:** MODERATE — Weekly still bearish but Daily showing early recovery
- **Action:** Don't sell the rip yet. Watch for Daily to flip green. If it does, Weekly will follow in 1-2 weeks. Can begin small adds.

**Example 3: Hypothetical Early Warning**
- Weekly: Bright Green, HH (strong uptrend)
- Daily: Dark Green, LH (momentum FADING — early warning!)
- 4H: Light Red, LL (already negative)
- **Alignment:** Daily diverging bearish
- **Conviction:** MODERATE — Weekly strong but Daily showing cracks
- **Action:** Don't buy the dip with full size. Daily is warning that Weekly may follow. Reduce to 75% size, tighten stops.

---

## Part 3: Mode Definitions

### 🟢 Green Mode — Normal Operations

**You're in Green Mode when:**
- Market structure intact (HH/HL on Weekly and Daily)
- Weekly BX Trender is green with HH or stable pattern
- Daily price above 9 and 21 EMA, EMAs sloping up or flat
- No significant bearish divergences

**Behavior in Green Mode:**
- Buy dips according to your normal strategy
- Use full position sizing
- Standard stop losses
- Add to winners on pullbacks
- No daily cap required

**Watch for (would shift to Yellow):**
- Weekly BX Trender LH pattern forming (green bars shrinking)
- Daily price testing 21 EMA
- RSI bearish divergence appearing
- MACD histogram starting to shrink

---

### 🟡 Yellow Mode — Controlled Accumulation

**You're in Yellow Mode when ANY of these are true:**
- Weekly BX Trender showing LH pattern (green but fading)
- Weekly BX Trender just flipped to light red
- Daily 9 EMA crossed below 21 EMA (bearish cross)
- Structure HL being tested (price near previous swing low)
- Significant bearish RSI divergence on Daily
- MACD histogram shrinking significantly or flipping negative

**Behavior in Yellow Mode:**
- **Controlled accumulation at key support levels**
- Reduce position sizing to 50-75% of normal
- **Daily cap: 10-20% of intended position size per day**
- Require better prices (lower entries) than in Green Mode
- Tighten stops to defined support levels
- Prepare for possible exit (know your Master Eject level)
- **Require bounce confirmation before any buys**
- **Enable 1-day time buffer before acting on dips**

**Watch for (would shift to Green):**
- Weekly BX Trender color improves or pattern shifts back to HH
- Daily price reclaims both EMAs, EMAs turn up
- Structure HL holds and price bounces
- SMI bullish cross confirmed

**Watch for (would shift to Red):**
- Weekly BX Trender goes red + LL
- Daily structure breaks (lower low confirmed)
- Weekly 9/21 EMA bearish cross
- Price breaks below key support (Put Wall, Hedge Wall)

---

### 🔴 Red Mode — Capital Preservation with Opportunistic Nibbles

**You're in Red Mode when ANY of these are true:**
- Market structure broken (lower low confirmed on Daily or Weekly)
- Weekly BX Trender is red (especially with LL pattern)
- Price below both Daily EMAs, both EMAs sloping down
- Weekly 9/21 EMA bearish cross confirmed

**Behavior in Red Mode:**
- **Nibbles only at extreme support levels** (not no buying, but very selective)
- Reduce position sizing to 25% or less of normal
- **Daily cap: 10% of intended position size per day**
- Master Eject level is ACTIVE — if it breaks, exit remaining
- Preserve capital for the next opportunity
- **Require "prove it" test before any buys**
- **Enable 2-3 day time buffer before acting**
- **Consider hedge offset if buying at all**

**Watch for (would shift to Yellow):**
- Weekly BX Trender HL pattern (red bars shrinking)
- Price reclaiming Daily 21 EMA
- Structure attempting higher low
- SMI bullish cross from oversold

### Fast-Track Re-Entry Protocol

After a Master Eject, you're in capital preservation mode. However, V-bottom recoveries can happen quickly, and waiting too long means missing significant upside. This protocol allows accelerated re-entry when specific conditions confirm the bottom is in.

**Trigger:** You've ejected and price is recovering.

**Timeframe:** Within 5 trading days of ejection.

**All conditions must be met:**

| # | Condition | What to Check | Why It Matters |
|---|-----------|---------------|----------------|
| 1 | Price reclaims 21 EMA | Daily close above 21 EMA | Structure attempting recovery |
| 2 | HIRO flips strongly positive | HIRO > 0 and rising | Dealers buying, not selling |
| 3 | 4H momentum confirms | BX-Trender HH pattern + SMI bullish cross | Near-term momentum supports bounce (4H is more reliable than 1H for swing trading) |

**If all three conditions are met within 5 days:**
- Fast-track directly to 🟡 Yellow Mode (skip extended observation period)
- Begin rebuilding at 10-20%/day pace immediately
- Set new Master Eject at the low that triggered the original ejection

**If conditions are NOT met within 5 days:**
- Remain in Ejected state
- Standard mode upgrade rules apply (slower, requires more confirmation)
- This was likely a real correction, not a V-bottom — patience was correct

**Why this matters:** Analysis shows ~45% of ejections are followed by 20%+ recoveries. This protocol captures more of those recoveries while maintaining the protection that the ejection provided.

---

## Part 4: Master Eject Level

### Concept

The Master Eject Level is your "line in the sand" — a pre-defined price level where you exit remaining exposure with no exceptions.

**Why it matters:**
In the heat of the moment, you will be tempted to hold, hope, or average down. The Master Eject Level removes decision-making from that moment. It's decided in advance when you're thinking clearly.

**Key principle:** The Master Eject is non-negotiable. If price closes below it on the Daily timeframe, you exit. No "let's see how tomorrow opens." Done.

### How to Set It

The Master Eject Level should be based on confluence of:

| Input | Example Level |
|-------|---------------|
| **Structure** | Previous swing low (breaking it = LL confirmed) |
| **SpotGamma** | Put Wall (below it = dealer support gone) |
| **Technical** | Weekly 21 EMA or Daily 50 EMA |
| **Fixed %** | X% below your average cost |

**Recommendation:** Use structure or SpotGamma levels as primary, technical levels as confirmation.

**Example:**
> "Weekly swing low is $380. Put Wall is $375. Master Eject = Daily close below $375."

### The "Can't Reclaim" Rule

When price breaks a key level intraday:
- Give it 30 minutes to reclaim
- If it can't reclaim within 30 minutes, that's real selling, not a stop hunt
- Act accordingly (cut or exit per your rules)

---

## Part 5: SpotGamma Levels Reference

SpotGamma levels provide insight into where institutional support and resistance lie based on options positioning.

### Level Definitions

| Level | What It Is | Implication |
|-------|------------|-------------|
| **Call Wall** | Strike with highest call open interest | Upside target/resistance — expect stalling here |
| **Key Gamma Strike** | Regime pivot point | Above = positive gamma (stable). Below = negative gamma (volatile). |
| **Hedge Wall** | Strike with maximum dealer hedging activity | Support when price above, resistance when price below |
| **Put Wall** | Strike with highest put open interest | Support floor — **if it breaks, expect acceleration lower** |

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

## Part 6: Regime Status — Report Section Layout

When integrating this framework into a daily report, include a **Regime Status** section followed by **Claude's Take**. Together, these provide:

1. **Regime Status** — The objective data: current mode, indicator readings, key levels, and triggers
2. **Claude's Take** — The synthesized view: what to do, why, what to watch, and current concerns

This combination ensures you have both the raw data to make your own assessment AND a rules-based interpretation to serve as a sanity check.

---

### Regime Status

**Current Mode: 🟢 / 🟡 / 🔴 [MODE NAME]**

**Why we're in this mode:**
> [2-3 sentences explaining the indicator confluence that determines this mode. Be specific about which indicators are signaling what, and how they combine to paint the current picture.]
>
> Example (Yellow Mode): "Weekly BX Trender is still green but showing a Lower High pattern — momentum is fading even though the trend hasn't broken. Daily price is testing the 21 EMA and SMI is approaching a bearish cross. Structure remains intact (no lower low yet), but warning signs are accumulating. This warrants controlled accumulation at key levels rather than aggressive buying."

**What this means for you:**
> [1-2 sentences on the practical implication — what you should and shouldn't do in this mode.]
>
> Example: "In Yellow Mode, we accumulate at key support levels with reduced size. Daily cap of 10-20% applies. We're watching for either a bounce that clears the warning signs (back to Green) or a structure break that confirms the downtrend (shift to Red)."

#### Indicator Dashboard

| Indicator | Timeframe | Current Reading | Status |
|-----------|-----------|-----------------|--------|
| Structure | Weekly | HH/HL, LL, etc. | ✅/⚠️/❌ |
| Structure | Daily | HH/HL, LL, etc. | ✅/⚠️/❌ |
| BX Trender | Weekly | [Color], [Pattern] | ✅/⚠️/❌ |
| BX Trender | Daily | [Color], [Pattern] | ✅/⚠️/❌ |
| 9/21 EMA | Daily | Above/Below, Slope, Cross | ✅/⚠️/❌ |
| SMI | Daily | [Value], [Cross status] | ✅/⚠️/❌ |
| RSI | Daily | [Value], Divergence? | ✅/⚠️/❌ |
| MACD Histogram | Daily | Growing/Shrinking/Flip | ✅/⚠️/❌ |

#### Key Levels

| Level | Price | What It Represents |
|-------|-------|-------------------|
| Last Major High (Resistance) | $XXX | Most recent significant peak — breakout level |
| Last Higher Low (Structure Support) | $XXX | Key uptrend support — if broken, structure breaks (lower low confirmed) |
| Put Wall | $XXX | SpotGamma institutional support — if broken, expect acceleration lower |
| Hedge Wall | $XXX | Early warning support — losing this is first sign of trouble |
| Daily 21 EMA | $XXX | Technical trend support — reference level for daily trend |

#### Mode Triggers

| To Upgrade (toward 🟢) | To Downgrade (toward 🔴) |
|------------------------|--------------------------|
| [What would improve conditions] | [What would worsen conditions] |

#### Master Eject Level

**Level: $XXX**

**Why this level:**
> [2-3 sentences explaining the rationale — what confluence of structure, SpotGamma, and/or technical levels led to this being the line in the sand.]
>
> Example: "The Master Eject is set at $375, which is just below the Put Wall ($378) and the last higher low from the weekly structure ($380). A daily close below $375 would mean both dealer support has failed AND the uptrend structure is broken — there's no reason to hold at that point. This level represents the point where the thesis is invalidated."

**The Rule:** Daily close below this level = exit remaining exposure. No exceptions. No "let's see how tomorrow opens."

---

### Claude's Take

**If I were in your position, I would:** [Clear action statement — hold, add at levels, reduce, exit, sit on hands, etc.]

**Why:**
> [2-3 sentences connecting the current indicator readings to the rulebook logic. What's the confluence saying? What mode are we in and what does that mode dictate? Be specific about which indicators are driving the recommendation.]

**What I'm watching:**
> [1-2 specific things that would change the picture — either an upside catalyst that would improve conditions, or a downside risk that would worsen them. Include specific price levels where relevant.]

**Concerns:**
> [Anything that stands out as a yellow/red flag, even if not actionable yet. This could be divergences forming, momentum fading, key levels approaching, or anything that warrants attention even if the mode hasn't changed.]

---

*This section provides a synthesized, rules-based perspective on the current situation. It's meant to serve as a sanity check against emotional decision-making and ensure the rulebook framework is being applied consistently.*

---

## Part 7: Pacing Rules & Graduated Response Actions

### Purpose

This section extends the Traffic Light System with **pacing rules** and a **graduated response framework**. The goal is to provide more granular guidance on *how* to execute within each mode — not just "reduce exposure" but specific tactics that limit damage if wrong while preserving upside if right.

**Core principle:** The worse conditions get, the more we slow down and require better prices. Speed is the enemy of survival in deteriorating markets, but staying 100% cash during pullbacks means missing accumulation opportunities.

---

### Daily Caps by Mode

A **daily cap** limits how much capital you can deploy in a single day, regardless of how attractive the setup looks. This prevents the common mistake of "sizing down but then buying 3 times in one day" — which defeats the purpose of defensive positioning.

**Why daily caps matter:**
- Volatility clusters. Bad days often follow bad days.
- Your judgment is impaired during drawdowns (stress, urgency, "make it back" mentality)
- Spreading entries improves your average if the dip continues
- Forces patience when patience is hardest
- **Enables controlled accumulation rather than all-or-nothing decisions**

#### Daily Cap Rules

| Mode | Daily Cap | Rationale |
|------|-----------|-----------|
| 🟢 **Green** | No cap — normal operations | Trend intact, buy dips per your strategy |
| 🟡 **Yellow** | **10-20% of intended position per day** | Conditions uncertain — spread entries across 5-10 days minimum |
| 🔴 **Red** | **10% of intended position per day** | High risk environment — nibble at extreme support only |
| **Master Eject Triggered** | **0% — no buying** | Capital preservation mode. Cash is a position. |

#### How Daily Caps Work in Practice

**Example — Yellow Mode:**

You've identified support at $350 and want to add $10,000 to your position if we get there.

- **Without daily cap:** You might buy $5K at $350, another $3K at $348, and $2K at $345 — all in one day. If $345 breaks, you're fully loaded into a falling knife.

- **With daily cap (20%):** You can only deploy $2,000 on Day 1. If price keeps falling on Day 2, you reassess. Maybe you buy another $2,000 at $340. Or maybe conditions worsen and you don't buy at all. Either way, you've limited damage while still accumulating.

**Example — Red Mode:**

Same scenario, but we're in Red Mode (structure broken, defensive posture).

- **With daily cap (10%):** You can only deploy $1,000 per day. At this pace, it takes 10 days to build your full position — and a lot can clarify in 10 days. If the bounce fails, you've only committed $2-3K instead of $10K. But if it WAS the bottom, you're building a position.

#### Daily Cap Decision Tree

```
Want to buy during a dip?
         │
         ▼
    What mode are we in?
         │
    ├────┴────┬─────────────────────────┐
    ▼         ▼                      ▼
  🟢 Green   🟡 Yellow              🔴 Red
    │         │                      │
    ▼         ▼                      ▼
 No cap    Max 10-20%/day         Max 10%/day
    │         │                      │
    ▼         ▼                      ▼
 Execute   Spread over            Spread over
 normally   5-10 days              10+ days
                                     │
                                     ▼
                               In Red Mode:
                               Nibble at extreme
                               support only
```

---

### The Action Spectrum

Instead of binary "buy" or "don't buy" decisions, use a **spectrum of actions** that become progressively more defensive (or offensive) based on conditions. This gives you more tools to "reduce the damage if wrong" while still participating if right.

#### Action Scale (-5 to +5)

From most bullish to most bearish:

| # | Action | When to Use | Effect |
|---|--------|-------------|--------|
| **+5** | Full size, aggressive adds | 🟢 Green + high-quality setup | Maximum upside capture |
| **+4** | Full size, normal adds | 🟢 Green, standard dip-buy | Normal operations |
| **+3** | Reduced size (75%), normal pace | 🟢 Green but minor concerns | Slightly defensive |
| **+2** | Reduced size (50%), daily cap | 🟡 Yellow — uncertainty | Controlled accumulation |
| **+1** | Small size (25%), strict daily cap | 🟡 Yellow — elevated risk, OR 🔴 Red at extreme support | Nibbling at key levels |
| **0** | No new buys, hold existing | 🟡/🔴 Transition | Wait for clarity |
| **-1** | No new buys, tighten stops | 🔴 Red — defensive | Protect gains, limit losses |
| **-2** | Trim 25% on bounces | 🔴 Red — deteriorating | Reduce exposure proactively |
| **-3** | Trim 50% on bounces | 🔴 Red — serious concern | Significant risk reduction |
| **-4** | Exit 75%, keep starter | 🔴 Red — near eject | Preserve capital, keep optionality |
| **-5** | Full exit — Master Eject | Structure broken, floor gone | Capital preservation mode |

#### Mapping Actions to Modes

| Mode | Typical Action Range | Default Posture |
|------|---------------------|-----------------|
| 🟢 **Green** | +3 to +5 | Normal to aggressive buying |
| 🟡 **Yellow** | 0 to +2 | Cautious, controlled accumulation |
| 🔴 **Red** | -3 to +1 | Trimming, holding, or small nibbles at extreme levels |
| **Eject** | -5 | Full exit |

#### Graduated Response by Scenario

**Scenario: Price Pulls Back to Support in Each Mode**

| Mode | Support Holds | Support Breaks |
|------|---------------|----------------|
| 🟢 **Green** | +4: Add full size at support | +2: Reduce size, watch closely |
| 🟡 **Yellow** | +1: Small add, daily cap applies | -1: No add, tighten stops |
| 🔴 **Red** | +1: Small nibble at extreme support | -3: Trim 50% on any bounce |

**Scenario: Price Breaks Out Above Resistance**

| Mode | Breakout Holds 30 min | Breakout Fails |
|------|----------------------|----------------|
| 🟢 **Green** | +4: Add on confirmation | +2: Hold, don't chase |
| 🟡 **Yellow** | +2: Small add, capped | 0: No action, stay patient |
| 🔴 **Red** | +1: Small nibble if confirmed | -2: Use bounce to trim |

---

### Damage Reduction Tactics

These are specific tactics designed to "reduce the damage if wrong" — creative ways to stay engaged while limiting downside.

#### Tactic 1: The Scaled Entry

Instead of one entry at one price, pre-plan multiple entries at progressively lower prices.

**Example:**
- Plan to buy $10K total if TSLA pulls back
- Entry 1: $2,000 at $350 (first support)
- Entry 2: $2,000 at $340 (second support)
- Entry 3: $3,000 at $330 (Put Wall — better R/R)
- Entry 4: $3,000 at $320 (if Master Eject hasn't triggered — best R/R)

**Benefit:** If it bounces at $350, you participate. If it falls to $330, your average is much better than buying $10K at $350.

**Mode adjustment:**
- 🟢 Green: Can use 3-4 entries, closer spacing
- 🟡 Yellow: Use 5-6 entries, wider spacing, daily caps apply
- 🔴 Red: Use 8-10 entries (at extreme support only), very wide spacing

#### Tactic 2: The Time Buffer

Force a waiting period before acting on a dip, especially in Yellow/Red modes.

| Mode | Time Buffer |
|------|-------------|
| 🟢 Green | None required — act on setups |
| 🟡 Yellow | Wait 1 full trading day before buying a dip |
| 🔴 Red | Wait 2-3 full trading days before any action |

**Rationale:** Initial reactions are often wrong. Panic selling creates artificial lows that quickly reverse — or the first bounce fails and real selling follows. Waiting gives you clarity.

#### Tactic 3: The Bounce Requirement

In Yellow and Red modes, require a **confirmed bounce** before buying, not just a touch of support.

**Bounce confirmation checklist:**
- [ ] Price touched support and held for 30+ minutes
- [ ] 4H BX-Trender shows HL pattern (selling exhausting)
- [ ] 4H SMI bullish cross confirmed or imminent
- [ ] HIRO flipped positive (dealers buying)

**No bounce confirmation = no buy** (in Yellow/Red modes).

#### Tactic 4: The Hedge Offset

In Red Mode, if you feel compelled to buy, pair it with a protective action.

**Examples:**
- Buy shares but also buy a put at the Master Eject level
- Buy calls but at a smaller size than you'd normally use
- Buy shares but set a hard stop-loss at Master Eject (no "let's see")

**The psychology:** This satisfies the urge to act while mechanically limiting downside.

#### Tactic 5: The "Prove It" Test

Before buying in Yellow or Red mode, price must "prove" the dip is buyable by reclaiming a key level.

**Example:**
- Support is at $340
- Instead of buying at $340, wait for price to reclaim $345 (minor resistance)
- If it can't reclaim $345, the dip isn't over — you saved yourself

**Trade-off:** You sacrifice the exact bottom for higher probability that the bottom is actually in.

---

### Damage Reduction Tactics Summary by Mode

| Tactic | 🟢 Green | 🟡 Yellow | 🔴 Red |
|--------|----------|-----------|--------|
| Scaled entry | Optional | Recommended | Required (if buying) |
| Time buffer | None | 1 day | 2-3 days |
| Bounce required | No | Yes | Yes |
| "Prove it" test | No | Optional | Required |
| Hedge offset | No | Optional | Recommended |

---

### Updated Mode Behavior Summary (with Pacing)

| Mode | Position Sizing | Daily Cap | Primary Actions | Damage Reduction Tactics |
|------|-----------------|-----------|-----------------|--------------------------|
| 🟢 **Green** | 100% (full) | None | +3 to +5: Normal to aggressive | Scaled entries optional |
| 🟡 **Yellow** | 50-75% | 10-20%/day | 0 to +2: Controlled accumulation | Time buffer, bounce required, scaled entries |
| 🔴 **Red** | 25% or less | 10%/day | -3 to +1: Trimming, holding, or nibbling at extreme support | Time buffer, bounce required, "prove it" test, hedge offset |
| **Eject** | 0% | 0%/day | -5: Full exit | None — just exit |

---

### Updated Ratchet Rule (with Pacing)

```
🟢 Green Mode → 🟡 Yellow Mode
├── Reduce position sizing to 50-75%
├── Daily cap: 10-20% of intended size
├── Require better prices for entries
├── Require bounce confirmation for any buys
└── Enable 1-day time buffer

🟡 Yellow Mode → 🔴 Red Mode
├── Reduce to nibbles only at extreme support
├── Daily cap: 10% of intended size
├── Master Eject level is ACTIVE
├── Require "prove it" test for any buys
├── Enable 2-3 day time buffer
└── Consider hedge offset if buying

Master Eject Level Breaks
├── Exit remaining position
├── Daily cap: 0% — no buying
└── No exceptions. No "let's see how tomorrow opens."
```

---

## Part 8: Quick Reference

### Mode Summary

| Mode | Conditions | Behavior | Daily Cap |
|------|------------|----------|-----------|
| 🟢 Green | Structure intact, Weekly BX green + HH, above EMAs | Normal dip-buying, full size | None |
| 🟡 Yellow | Warning signs (LH pattern, EMA test, divergence) | Controlled accumulation at key levels, reduced size | 10-20%/day |
| 🔴 Red | Structure broken OR Weekly BX red OR below EMAs | Nibbles at extreme support only, Master Eject active | 10%/day |

### Ratchet Rule

```
🟢 → 🟡 : Reduce size, require better prices, daily cap 10-20%
🟡 → 🔴 : Nibbles only at extreme support, daily cap 10%, eject level active
Eject breaks : Exit remaining, no exceptions
```

### Hysteresis Rule

```
To CHANGE mode: Require 2+ signals sustained for 2+ days
To STAY in mode: Current signals sufficient
Exception: Master Eject is always immediate
```

### Fast-Track Re-Entry (After Ejection)

Within 5 days of ejection, if ALL THREE conditions met:
1. ☑ Price reclaims 21 EMA (daily close)
2. ☑ HIRO flips strongly positive
3. ☑ 4H BX-Trender HH + SMI bullish cross

→ Fast-track to 🟡 Yellow, rebuild at 10-20%/day

### Warning Sequence (BX Trender)

```
Green + HH → Green + LH → Light Red → Dark Red + LL
    ✅         ⚠️ First       ⚠️ Major       ❌ Exit
             warning        warning
```

### Action Spectrum Quick Reference

| Score | Action | Mode |
|-------|--------|------|
| +5 | Aggressive full-size adds | 🟢 Only |
| +3 to +4 | Normal buying | 🟢 |
| +1 to +2 | Cautious, controlled accumulation | 🟡 |
| +1 | Small nibble at extreme support | 🔴 (at key levels) |
| 0 | No new buys, hold | 🟡/🔴 |
| -1 to -2 | Tighten stops, trim on bounce | 🔴 |
| -3 to -4 | Significant trim, near exit | 🔴 |
| -5 | Full exit | Eject |

### Daily Caps at a Glance

| Mode | Cap | Days to Full Position |
|------|-----|----------------------|
| 🟢 Green | No limit | 1 day (if desired) |
| 🟡 Yellow | 10-20%/day | 5-10 days minimum |
| 🔴 Red | 10%/day | 10+ days minimum |

### Indicator Priority

| Priority | Indicator | Purpose |
|----------|-----------|---------|
| 1 | Structure (HH/HL/LL) | Is the trend intact? |
| 2 | BX Trender (Weekly) | What's the momentum regime? |
| 3 | 9/21 EMA (Daily) | Trend confirmation, objective signal |
| 4 | SMI | Leading momentum indicator |
| 5 | RSI | Extremes and divergence flags |
| 6 | MACD Histogram | Confirmation |

---

## Summary

1. **Check your MODE before any action** — Green / Yellow / Red determines your behavior
2. **Multiple inputs determine mode** — Structure, BX Trender, EMAs, SMI, RSI, MACD
3. **Apply hysteresis** — Require 2+ signals sustained for 2+ days before changing mode (reduces whipsawing)
4. **Adjust size and price requirements as conditions worsen** — Smaller size, better prices, not necessarily zero buying
5. **Apply daily caps in Yellow and Red** — 10-20%/day and 10%/day respectively
6. **Use the action spectrum** — Graduated responses from +5 (aggressive) to -5 (full exit)
7. **Deploy damage reduction tactics** — Scaled entries, time buffers, bounce requirements, "prove it" tests, hedge offsets
8. **Know your Master Eject Level** — Pre-defined, non-negotiable exit point
9. **Use Fast-Track Re-Entry after ejection** — If V-bottom signals confirm within 5 days (using 4H, not 1H), accelerate return to Yellow Mode
10. **Structure breaks override everything** — A lower low puts you in Red Mode regardless of other indicators

The goal is not to predict the correction. The goal is to recognize it early, adjust size and price requirements progressively, pace your actions, and have a clear exit if it becomes serious.

**Capital preservation enables future opportunities. But staying 100% cash during pullbacks means missing accumulation opportunities.**

**The meta-principle:** In uncertain conditions, slow down, spread out, require better prices, and require proof. Speed kills portfolios. Patience preserves them. But the goal is controlled accumulation, not avoidance.

---

## Appendix A: Monte Carlo Simulation Insights

> ⚠️ **PRELIMINARY RESULTS — NOT YET VALIDATED**
>
> The following insights are derived from a Monte Carlo simulation (10,000 iterations) using synthetic TSLA-like price paths. These results are theoretical and have not been validated against real historical data or live trading. Track actual performance to validate or refute these findings over time.

### Improvements Incorporated from Simulation

Based on simulation findings, the following improvements have been added to the core framework:

| Finding | Improvement Added | Location in Rulebook |
|---------|-------------------|---------------------|
| Whipsawing reduced mode transition accuracy | **Hysteresis Rule** — Require 2+ signals for 2+ days | Part 1: Traffic Light System |
| 45% of ejections missed 20%+ recoveries | **Fast-Track Re-Entry Protocol** — Accelerated return to Yellow if V-bottom confirms within 5 days | Part 3: Red Mode |
| Daily caps limit damage when wrong | **Daily Caps** — 10-20%/day (Yellow), 10%/day (Red) | Part 7: Pacing Rules |

### Simulation Overview

A Monte Carlo simulation was conducted to objectively test this framework's effectiveness at:
1. Avoiding participation in corrections
2. Mitigating fakeout risk (selling at bottoms)

**Parameters:** 10,000 simulations, 1-year horizon each, TSLA-calibrated volatility (55% annual), ~1 correction per year, ~3 fakeouts per year.

### Key Findings (Preliminary)

#### The Framework IS Effective at Drawdown Reduction

| Metric | Rulebook | Buy & Hold | Improvement |
|--------|----------|------------|-------------|
| Mean Max Drawdown | 21.7% | 51.5% | **-29.8 pts** |
| Worst 5% Scenarios | -25.0% | -62.2% | **-37.2 pts** |
| Worst 1% Scenarios | -34.5% | -75.2% | **-40.7 pts** |
| Return Volatility | 32.5% | 77.7% | **2.4x lower** |

**Interpretation:** The framework significantly reduces drawdowns and tail risk. In the worst scenarios, it cuts losses nearly in half.

#### The Fakeout Risk Is Manageable

| Metric | Result | Interpretation |
|--------|--------|----------------|
| Sold within 5% of bottom | 5.5% | Low — most ejections were appropriate |
| Missed 20%+ recovery | 45.5% | Addressed by Fast-Track Re-Entry Protocol |
| Avg ejections per year | 1.78 | Reasonable frequency |

**Interpretation:** Only ~1 in 18 ejections occurs near the actual bottom. The daily close rule and hysteresis prevent most fakeout exits.

#### The Return Tradeoff

| Metric | Rulebook | Buy & Hold |
|--------|----------|------------|
| Mean Return | 9.3% | 21.0% |
| Median Return | 1.8% | 1.8% |
| Risk-Adjusted (Return/DD) | 0.43 | 0.41 |

**Interpretation:** Mean returns are lower due to missing some V-bottom recoveries. However:
- Median returns are identical
- Risk-adjusted returns slightly favor the rulebook
- For options traders, drawdown protection is more valuable than upside capture

### Why This Tradeoff Is Correct for Options

For swing traders using 3-6-9 month calls:
- A 50% stock drawdown ≈ 90%+ option loss (leverage works both ways)
- A 50% loss requires 100% gain to recover
- A 22% loss requires only 28% gain to recover
- Smaller drawdowns preserve psychological capital to stay in the game

### Validated Design Elements

The simulation validated these framework components:

| Component | Why It Works |
|-----------|--------------|
| **Daily close rule** | Prevents panic ejections on intraday spikes |
| **Hysteresis** | Requiring stronger signals to change mode reduces whipsawing |
| **Graduated response** | Reduces then exits performs better than all-or-nothing |
| **Master Eject from Red only** | Prevents premature exits during Yellow Mode |
| **Daily caps** | Limits damage when wrong, spreads entries over time |

### Area for Improvement: Faster Re-Entry

The simulation identified one weakness: **45% of simulations missed a 20%+ recovery after ejecting.**

This suggests the re-entry logic may be too conservative. Consider:

#### Fast-Track Re-Entry Protocol

When price recovers after an ejection, allow accelerated mode upgrades if:

| Condition | Action |
|-----------|--------|
| Price reclaims 21 EMA within 5 days of ejection | Fast-track to Yellow Mode |
| HIRO flips strongly positive (>75th percentile) | Allow immediate 10-20%/day rebuilding |
| 4H BX-Trender shows HH pattern + SMI bullish cross | Confirm bounce is real (4H more reliable for swing trading) |

**Implementation:** After ejection, monitor for "V-bottom" signals. If all three conditions are met within 5 trading days, shift directly to Yellow Mode and begin rebuilding at 10-20%/day pace.

### Simulation Limitations

What the simulation captures well:
- Overall return/risk tradeoffs
- Drawdown protection magnitude
- Fakeout frequency
- Mode distribution patterns

What it simplifies:
- Indicator complexity (real BX-Trender, SMI have more nuance)
- Intraday vs. close dynamics
- Options P&L (which would favor rulebook more)

What it doesn't capture:
- Emotional decision-making (assumes perfect rule-following)
- Transaction costs
- Multi-year compounding effects

### Tracking Actual Performance

To validate or refute these simulation findings, track:

| Metric | How to Measure | Target (per simulation) |
|--------|----------------|------------------------|
| Max drawdown | Largest peak-to-trough on position | <25% |
| Ejection accuracy | % of ejections that preceded further decline | >80% |
| Fakeout rate | % of ejections within 5% of actual bottom | <10% |
| Recovery capture | % of 20%+ recoveries where we re-entered | >60% |

Update this appendix with real-world results as data accumulates.

---

*Document Version: 2.4*
*Purpose: Framework for avoiding corrections and managing drawdowns while enabling controlled accumulation*
*v2.0: Added Part 7 — Pacing Rules & Graduated Response Actions*
*v2.1: Added Appendix A — Monte Carlo Simulation Insights*
*v2.2: Incorporated simulation improvements into core framework (Hysteresis Rule, Fast-Track Re-Entry Protocol)*
*v2.3: Refinements based on daily report experience*
*v2.4: Philosophy alignment with Guide v2.0 — accumulation mindset, 4H for Fast-Track (not 1H), daily caps 10-20% (not 25%), Red mode allows nibbles at extreme support*
*Note: Simulation-derived improvements are based on preliminary, unvalidated results — track real-world performance*
*Usage: Reference for daily regime assessment; integrate into Daily SG Report*
