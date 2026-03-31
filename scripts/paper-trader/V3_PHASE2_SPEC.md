# Taylor Decision Engine v3 Phase 2 — Alert-Driven Trading

**Goal:** Taylor must execute the EXACT alert instructions from the daily report, not approximate them with proximity thresholds.

**Source of truth:** The `levels_map` array from `/api/reports/latest` — each level has:
```json
{
  "type": "nibble",
  "level": "S1: Put Wall / Round-number floor",
  "price": 350,
  "action": "Buy up to daily cap. Stop $340.",
  "source": "Report"
}
```

The `action` field IS the subscriber instruction. Taylor must parse and execute it.

---

## Current Data Flow (already works)

`fetchDailyReport()` → `parseExtractedData()` → `DailyReport.levels: KeyLevel[]`

The `action` field IS already on `KeyLevel` interface but marked optional and **never read** by the decision engine.

---

## Gap 1: Parse Alert Actions into Structured Instructions

### Add to types.ts:

```typescript
export interface AlertInstruction {
  /** The raw action text from the report */
  raw: string;
  /** Parsed action type */
  type: 'buy' | 'trim' | 'hold' | 'eject' | 'reduce' | 'unknown';
  /** Parsed stop loss price, if mentioned */
  stopPrice?: number;
  /** Parsed trim percentage, if mentioned */
  trimPercent?: number;
  /** Whether this is a "up to daily cap" instruction */
  useDailyCap?: boolean;
  /** Specific size override if mentioned (e.g., "half position") */
  sizeOverride?: number;
}
```

### Add parseAlertAction() function to decision-engine.ts:

Parse the `action` string from each level:

| Action text pattern | Parsed result |
|---|---|
| `"Buy up to daily cap. Stop $340."` | `{ type: 'buy', useDailyCap: true, stopPrice: 340 }` |
| `"Buy up to daily cap. Stop $330."` | `{ type: 'buy', useDailyCap: true, stopPrice: 330 }` |
| `"Trim 30% of remaining"` | `{ type: 'trim', trimPercent: 0.30 }` |
| `"Trim 50% of remaining"` | `{ type: 'trim', trimPercent: 0.50 }` |
| `"All leverage cut. Master Eject confirmed."` | `{ type: 'eject' }` |
| `"Cap reduces to 1.25%"` | `{ type: 'hold' }` (informational, already handled by Slow Zone logic) |
| `"Reduce 30%"` or `"Reduce exposure 30%"` | `{ type: 'reduce', trimPercent: 0.30 }` |
| `"--"` or empty | `{ type: 'unknown' }` |

Regex patterns:
- Stop: `/[Ss]top\s*\$?([\d,.]+)/` → extract stop price
- Trim %: `/[Tt]rim\s+(\d+)%/` → extract trim percentage
- Buy: `/[Bb]uy/` → type = 'buy'
- Daily cap: `/daily cap/i` → useDailyCap = true
- Reduce: `/[Rr]educe\s+(\d+)%/` → type = 'reduce', trimPercent

---

## Gap 2: Execute Alert-Level Buy Instructions with Stops

### Current problem:
- `checkNearSupport()` returns boolean "near or not" with a % threshold
- `determineStop()` uses masterEject or putWall as generic fallbacks
- Neither reads the actual `action` text from the level

### Fix — Replace proximity-based entry with alert-driven entry:

**New function: `findActiveAlert()`**

```typescript
function findActiveAlert(
  price: number,
  report: DailyReport,
  mode: string
): { level: KeyLevel; instruction: AlertInstruction; distance: number } | null
```

Logic:
1. Filter `report.levels` to `type === 'nibble' || type === 'support'` where `action` contains 'buy'
2. For each, parse the action with `parseAlertAction()`
3. Find the NEAREST buy level that price is AT or BELOW (within 1.5% above, or anywhere below)
   - "At support" means price is within proximity — use existing thresholds
   - "Below support" means price has fallen through — still valid, the alert fires on touch
4. Return the matched level + its parsed instruction (including stop price)
5. If no buy levels match, return null

**Replace in evaluateEntry():**

Where Taylor currently calls `checkNearSupport()` and gets a boolean, replace with `findActiveAlert()` which returns the SPECIFIC instruction to execute:

- **Entry price:** The alert level price (buy AT support, not near it)
- **Stop loss:** Parsed from `instruction.stopPrice` — NOT a generic fallback
- **Position size:** If `instruction.useDailyCap`, use the mode's daily cap (already calculated)
- **Instrument:** Already determined by Orb zone logic (keep existing)

**Replace `determineStop()`:**

Instead of generic fallback logic, the stop comes FROM the alert instruction:

```typescript
function determineStopFromAlert(
  currentPrice: number,
  report: DailyReport,
  activeAlert: { level: KeyLevel; instruction: AlertInstruction } | null
): number {
  // 1. If we have an active alert with an explicit stop, use it
  if (activeAlert?.instruction.stopPrice) {
    return activeAlert.instruction.stopPrice;
  }
  // 2. Fallback: next support level below current price
  const supportsBelow = report.levels
    .filter(l => (l.type === 'support' || l.type === 'nibble') && l.price < currentPrice)
    .sort((a, b) => b.price - a.price);
  if (supportsBelow.length > 0) {
    return supportsBelow[0].price;
  }
  // 3. Last resort: 1.5% below
  return currentPrice * 0.985;
}
```

---

## Gap 3: Execute Alert-Level Trim Instructions with Exact Percentages

### Current problem:
- Trim logic uses mode-based `TRIM_CAPS[mode]` (GREEN=10%, RED=30%)
- The report often says "Trim 30% of remaining" on EVERY trim level
- These should be the SAME, but if the report says something different, the report wins

### Fix:

When evaluating trim levels in `evaluateExit()`:

```typescript
// After finding crossedTrims[0]:
const trimLevel = crossedTrims[0];
const instruction = parseAlertAction(trimLevel.action || '');

// Use report's trim percentage if specified, otherwise fall back to mode cap
let trimCapPercent: number;
if (instruction.trimPercent != null) {
  trimCapPercent = instruction.trimPercent;
} else {
  trimCapPercent = TRIM_CAPS[mode] || 0.20;
}

// Still respect daily trim cap remaining
const remainingDailyTrim = dailyTrimCap - v3State.dailyTrimPercent;
trimCapPercent = Math.min(trimCapPercent, remainingDailyTrim);
```

---

## Gap 4: HIRO as Entry Confirmation (Not Just a Note)

### Current problem:
- HIRO < 25th percentile adds a reasoning note but DOESN'T block the entry
- The system says: "HIRO positive at support = buy, HIRO negative at support = wait"

### Fix:

In `evaluateEntry()`, AFTER finding an active alert:

```typescript
// HIRO confirmation gate
// Guide: HIRO positive at support = buy, HIRO negative = wait
const hiroConfirm = hiro.percentile30Day >= 25; // Above lower quartile = "positive"
if (!hiroConfirm && !isOversoldOverride) {
  reasoning.push(`HIRO negative (${hiro.percentile30Day.toFixed(0)}%tile) at ${nearSupport.level} — waiting for flow confirmation`);
  return { action: 'hold', price, reasoning, confidence: 'medium' };
}
```

**EXCEPTION:** Oversold override / capitulation setups bypass HIRO gate (these are "buy the blood" setups where flow is expected to be negative).

**EXCEPTION:** In GREEN/YELLOW_IMPROVING mode, HIRO gate is relaxed to 15th percentile (uptrend benefits from the doubt).

---

## Gap 5: Stop Loss Execution

### Current problem:
Taylor has NO stop loss logic. Once bought, he holds forever or trims at named levels above entry.

### Fix — Add stop tracking to V3State:

```typescript
// In types.ts, add to V3State:
activeStops: Array<{
  instrument: Instrument;
  entryLevelName: string;
  stopPrice: number;
  sharesAtRisk: number;  // shares bought at this level
  entryDate: string;
}>;
```

**In evaluateExit(), BEFORE trim logic:**

```typescript
// Check active stop losses
for (const stop of v3State.activeStops) {
  if (stop.instrument === 'TSLA' && tslaPrice <= stop.stopPrice) {
    // Stop triggered — exit the shares bought at this level
    reasoning.push(`🛑 Stop hit: ${stop.entryLevelName} stop at $${stop.stopPrice} — selling ${stop.sharesAtRisk} shares`);
    // Remove this stop from active list
    v3State.activeStops = v3State.activeStops.filter(s => s !== stop);
    return {
      action: 'sell',
      instrument: 'TSLA',
      shares: Math.min(stop.sharesAtRisk, multiPortfolio.tsla?.shares || 0),
      price: tslaPrice,
      reasoning,
      confidence: 'high',
    };
  }
}
```

**When a buy executes (in index.ts trade execution):**

```typescript
// After successful buy, register the stop
if (activeAlert?.instruction.stopPrice) {
  sessionState.v3.activeStops.push({
    instrument: signal.instrument,
    entryLevelName: activeAlert.level.name,
    stopPrice: activeAlert.instruction.stopPrice,
    sharesAtRisk: signal.shares,
    entryDate: new Date().toISOString().split('T')[0],
  });
}
```

---

## Gap 6: Alert Fire Tracking (Match the Price Alert System)

### Current problem:
`levelsHitToday` in sessionState tracks levels but doesn't match how the actual alert system on flacko.ai works. The flacko.ai alert system fires ONCE per level per day when price crosses.

### Fix:

Already mostly working with `levelsHitToday`. But ensure:

1. Each support level fires ONE buy alert per day (already tracked)
2. Each trim level fires ONE trim per day (already tracked)
3. Stops fire immediately on touch (no once-per-day limit)
4. Reset `levelsHitToday` at market open (already done)

Add to reasoning: "Alert fired: S1 at $350 — executing report instruction"

---

## FILES TO MODIFY

1. `scripts/paper-trader/types.ts` — Add `AlertInstruction`, `activeStops` to V3State
2. `scripts/paper-trader/decision-engine.ts` — Add `parseAlertAction()`, `findActiveAlert()`, replace `checkNearSupport()` usage, add HIRO gate, add stop loss check, use report trim %
3. `scripts/paper-trader/index.ts` — Register stops after buys, persist `activeStops`
4. `scripts/paper-trader/performance.ts` — Persist/restore `activeStops`
5. `scripts/paper-trader/__tests__/decision-engine.test.ts` — Add tests for all 6 gaps

---

## TESTS TO ADD

1. **parseAlertAction parses buy with stop:** Input `"Buy up to daily cap. Stop $340."` → `{ type: 'buy', useDailyCap: true, stopPrice: 340 }`
2. **parseAlertAction parses trim with percent:** Input `"Trim 30% of remaining"` → `{ type: 'trim', trimPercent: 0.30 }`
3. **findActiveAlert returns nearest buy level:** Price at $351, S1 at $350 → returns S1 with stop $340
4. **findActiveAlert returns null when no buy levels near:** Price at $370, S1 at $350 → null
5. **Stop loss fires when price hits stop:** Bought at $350, stop at $340, price drops to $339 → sell
6. **Stop loss respects Core Hold Floor:** Stop fires but won't sell below 20% of peak
7. **HIRO gate blocks entry when negative:** HIRO at 10th percentile, at support → hold (wait for flow)
8. **HIRO gate bypassed for oversold override:** HIRO at 5th percentile, oversold extreme → buy anyway
9. **HIRO gate relaxed in GREEN:** HIRO at 20th percentile in GREEN → buy (threshold is 15 not 25)
10. **Report trim % overrides mode cap:** Report says "Trim 50%", mode says 30% → uses 50%
11. **Alert fires once per level per day:** Two price touches at S1 → only first triggers buy

---

## CRITICAL CONSTRAINTS

- **DO NOT** remove or change any Phase 1 fixes (Slow Zone, EMA Extension, EJECTED, KL Step 4)
- **DO NOT** change Orb zone logic
- **DO NOT** change regime detection
- **DO NOT** change Core Hold Floor
- `parseAlertAction` must be robust — handle malformed/missing action text gracefully
- Stops are PER-ENTRY, not per-position. If Taylor buys 50 shares at S1 (stop $340) and 30 shares at S2 (stop $330), those are SEPARATE stops.
- If a stop triggers but shares have already been trimmed at a higher level, reduce `sharesAtRisk` accordingly
- The `action` field on KeyLevel is already in the interface and already populated by `parseExtractedData()` — **verify this is actually being passed through**
