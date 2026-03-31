# Taylor v3 — Report Executor Architecture

**Principle:** The daily report IS the decision. Taylor executes it.

---

## Architecture

```
Daily Report (brain)          Taylor (hands)
─────────────────────         ──────────────────
Mode, levels, actions    →    Read report
"Buy at $350. Stop $340" →   Set alert at $350
"Trim 30% at $387"       →   Set alert at $387
System constraints       →    Apply caps/floors
                              Execute when price hits
                              Track P&L
```

## What Taylor Does

1. **On boot / report update:** Parse all levels + actions from the latest report
2. **Every tick:** Check if price has crossed any alert level
3. **On level cross:**
   - Parse the `action` field (e.g., "Buy up to daily cap. Stop $340.")
   - Execute the action, constrained by system rules
4. **Track:** Positions, stops, P&L, daily caps used

## What Taylor Does NOT Do

- ❌ Orb zone scoring (report already decided instrument/sizing)
- ❌ Independent HIRO gating (report already factored flow)
- ❌ Risk/reward calculations (report already set the levels)
- ❌ Regime detection for entries (report already chose the levels based on regime)
- ❌ Independent "near support" proximity logic
- ❌ BX state analysis (report engine does this)
- ❌ Recovery Acceleration logic (report adjusts caps when this applies)
- ❌ Deep Dip Bridge (report adjusts caps)

## System Constraints Taylor DOES Enforce

These are guardrails, not decisions. They constrain execution:

| Constraint | Source | What it does |
|---|---|---|
| Mode daily cap | Report mode | GREEN 30%, YI 20%, YELLOW 17.5%, ORANGE 10%, RED 5% |
| Max invested | Report mode | Accumulation ceiling — blocks new buys above cap |
| Slow Zone | D21 × 0.98 | Halves cap (25% in ORANGE/RED). Inactive in GREEN/YI. |
| Daily trim cap | Report mode | GREEN 10%, YI 15%, YELLOW 15%, ORANGE 25%, RED 30% |
| Core Hold Floor | Peak value | 20% of peak TSLA value never trimmed |
| Kill Leverage | W21 EMA | Below W21 → sell ALL TSLL. Below Put Wall → trim TSLA to 50%. |
| EJECTED | 2 closes < W21 | Block buys (except 200 SMA override). Hold 50% core. |
| Leverage rule | Mode | RED/ORANGE = shares only (TSLA). GREEN/YI = TSLL allowed. |
| Time cutoff | 3 PM CT | No new positions after 3 PM |
| Max trades/day | 2 | Hard limit |
| Trim cap per level | Mode | Per-trim max: GREEN 10%, YI 15%, YELLOW 20%, ORANGE 25%, RED 30% |

## Report Data Taylor Reads

From `GET /api/reports/latest` → `extracted_data`:

```json
{
  "mode": { "current": "red" },
  "levels_map": [
    { "type": "trim", "level": "T1: Daily 21 EMA", "price": 387, "action": "Trim 30% of remaining" },
    { "type": "nibble", "level": "S1: Put Wall", "price": 350, "action": "Buy up to daily cap. Stop $340." },
    { "type": "eject", "level": "Kill Leverage (W21 EMA)", "price": 401.87, "action": "All leverage cut." },
    { "type": "slow_zone", "level": "Slow Zone", "price": 379.35, "action": "Cap reduces to 1.25%" }
  ],
  "master_eject": { "price": 401.87 },
  "daily_21ema": 387,
  "weekly_21ema": 401.87,
  ...
}
```

## Core Logic (pseudocode)

```
on_tick(price):
  report = latest_report()
  mode = report.mode
  
  // CHECK STOPS FIRST
  for stop in active_stops:
    if price <= stop.price:
      sell(stop.shares, reason="stop hit at ${stop.price}")
      remove(stop)
      return
  
  // CHECK TRIM LEVELS (price crossing UP through a trim level)
  for level in report.levels where type='trim' and price >= level.price:
    if already_fired_today(level): continue
    instruction = parse(level.action)  // "Trim 30% of remaining"
    trim_pct = instruction.trim_percent or TRIM_CAPS[mode]
    trim_pct = min(trim_pct, daily_trim_remaining)
    shares_to_trim = apply_core_hold_floor(position * trim_pct)
    if shares_to_trim > 0:
      sell(shares_to_trim)
      mark_fired(level)
      return
  
  // CHECK KL / EJECTED
  if price < W21: sell_all_tsll()
  if price < put_wall and exposure > 50%: trim_to_50%()
  if ejected and exposure > 50%: trim_to_50%()
  
  // CHECK BUY LEVELS (price at or below a nibble/support level)
  for level in report.levels where type='nibble'|'support':
    if already_fired_today(level): continue
    if not near(price, level.price, threshold=1.5%): continue
    if time > 3PM: continue
    if trades_today >= 2: continue
    if exposure >= MAX_INVESTED[mode]: continue
    
    instruction = parse(level.action)  // "Buy up to daily cap. Stop $340."
    cap = MODE_CONFIGS[mode].daily_cap
    if in_slow_zone: cap *= slow_zone_multiplier
    if ejected and not oversold_override: continue
    
    shares = floor(cash * cap / price)
    if shares > 0:
      buy(shares, instrument=leverage_allowed ? TSLL : TSLA)
      if instruction.stop_price:
        register_stop(instruction.stop_price, shares)
      mark_fired(level)
      return
  
  // EXTENSION ZONE (independent of levels — pure EMA math)
  if price > W9 * 1.12:
    extension_trim()
  
  // Nothing to do
  hold()
```

## Leverage Decision

Simple rule from report mode:
- GREEN, YELLOW_IMPROVING → TSLL allowed (if report doesn't say "shares only")
- YELLOW, ORANGE, RED, EJECTED → TSLA only
- Below Kill Leverage → TSLA only (always)

NO Orb zone logic needed. The report already tells subscribers what instrument to use based on conditions.

## What Gets Removed from Current Code

1. **Orb zone scoring system** — entire `evaluateOrbZone()` and zone-based instrument selection
2. **HIRO independent gating** — HIRO percentile checks as entry blockers
3. **Risk/reward calculation** — `riskRewardRatio` gate
4. **`checkNearSupport()` as primary entry logic** — replaced by alert-level matching
5. **`checkNearResistance()` as entry blocker** — report levels handle this
6. **Recovery Acceleration** — report already adjusts when applicable
7. **Deep Dip Bridge** — report already adjusts
8. **BX state tracking for entries** — report engine handles this
9. **Regime detection for entries** — report levels are regime-aware
10. **Catch-up sizing** — report sets the caps appropriately
11. **Underweight accumulation logic** — not in the system
12. **Tier multipliers** — report already factors tiers into level selection

## What Gets Kept

1. **Mode daily cap enforcement** ✅
2. **Max invested gate** ✅  
3. **Slow Zone cap reduction** ✅
4. **Kill Leverage (sell TSLL, Step 4 trim)** ✅
5. **EJECTED mode** ✅
6. **Core Hold Floor** ✅
7. **Daily trim cap** ✅
8. **Per-trim mode cap** ✅
9. **Time cutoff** ✅
10. **Max 2 trades/day** ✅
11. **EMA Extension Zone trimming** ✅
12. **Alert action parsing** ✅ (new)
13. **Stop loss execution** ✅ (new)
14. **Level fire tracking** ✅ (existing, improved)

## Files to Modify

1. `types.ts` — Add AlertInstruction, activeStops to V3State, remove OrbData/OrbZone from DecisionContext (keep types for backward compat but not required in decision)
2. `decision-engine.ts` — Major rewrite: strip independent logic, add parseAlertAction, alert-level execution, stop losses
3. `index.ts` — Register stops after buys, persist activeStops, remove Orb scoring call from decision context
4. `performance.ts` — Persist/restore activeStops
5. `data-feed.ts` — Already fixed (action field pass-through)
6. `__tests__/decision-engine.test.ts` — Rewrite tests for new architecture

## Tests

1. **parseAlertAction: buy with stop** → `{ type: 'buy', useDailyCap: true, stopPrice: 340 }`
2. **parseAlertAction: trim with %** → `{ type: 'trim', trimPercent: 0.30 }`
3. **parseAlertAction: eject** → `{ type: 'eject' }`
4. **parseAlertAction: unknown/empty** → `{ type: 'unknown' }`
5. **Buy fires at nibble level** — price near S1 ($350), report says "Buy up to daily cap. Stop $340" → buys with stop registered
6. **Stop loss fires** — price drops to $339 → sells shares from that entry
7. **Trim fires at level regardless of P&L** — price at T1 ($387), avg cost $392 → trims 30%
8. **Report trim % used over mode cap** — report says "Trim 50%", mode cap 30% → trims 50% (respecting daily cap)
9. **Daily cap enforced** — RED 5%, already used 4% → only 1% available
10. **Slow Zone reduces cap** — ORANGE in Slow Zone → 10% × 0.25 = 2.5%
11. **Core Hold Floor blocks over-trim** — 20% of peak protected
12. **Max invested blocks entry** — at 20% in RED (cap) → no buy
13. **EJECTED blocks entry** — 2 closes below W21 → no buy except 200 SMA override
14. **KL Step 4 trims** — below Put Wall, exposure > 50% → trim to 50%
15. **EMA Extension trim** — 15% above W9 → trim fires
16. **Leverage only in GREEN/YI** — RED mode buy → TSLA (not TSLL)
17. **Time cutoff** — after 3 PM CT → no new buys
18. **Alert fires once per day** — second touch at same level → no action
