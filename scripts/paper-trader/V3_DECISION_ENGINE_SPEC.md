# Taylor Decision Engine v3 Rewrite Spec

**Source of Truth:** `~/clawd/guides/daily-report-guide.md`
**Current Engine:** `scripts/paper-trader/decision-engine.ts`
**Date:** 2026-03-30

---

## What's Correct (DO NOT BREAK)

These features work and must be preserved exactly:

1. **Orb zone instrument selection** — FULL_SEND→TSLL, NEUTRAL→TSLA, CAUTION→TSLA nibbles at support, DEFENSIVE→no buys
2. **Orb zone transitions** — DEFENSIVE exits all TSLL, CAUTION exits TSLL, FULL_SEND→NEUTRAL holds existing TSLL
3. **Override setups** — oversold-extreme, deep-value, capitulation upgrade NEUTRAL→TSLL
4. **Dirty vs clean capitulation** — noted in reasoning
5. **Two-regime trim hierarchy** — Regime A (recovering, below EMAs) trims at EMA reclaims. Regime B (strong uptrend, above all EMAs) trims at swing highs only. MIXED draws from both.
6. **D9 trim suppression** — Regime B + GREEN/YI suppresses D9 EMA trims
7. **Core Hold Floor** — 20% of peak TSLA position value is never trimmed. Does NOT apply to TSLL.
8. **Acceleration Zone** — No trims below KGS proxy (midpoint of D21 and W9)
9. **Daily trim cap** — Per-mode max daily trim: GREEN 10%, YI 15%, YELLOW 15%, ORANGE 25%, RED 30%
10. **Leverage priority** — Always trim TSLL before TSLA
11. **Recovery Acceleration** — LL→HL BX flip doubles buy cap for 5 days
12. **Deep Dip Bridge** — 10-15% below SMA200 boosts RED cap to 10%
13. **Kill Leverage cuts TSLL** — Below W21 EMA, all TSLL exits immediately
14. **Slow Zone** — D21 × 0.98, halves daily buy cap. Inactive in GREEN/YI. In ORANGE/RED reduces to 25% of normal.
15. **Time restriction** — No new positions after 3 PM CT
16. **Max 2 trades per day**
17. **3pm CT no new positions**

---

## BUGS TO FIX

### Bug 1: Trim logic only fires on profitable positions
**Current:** `if (report && unrealizedPnlPercent > 0)` gates ALL trim logic
**Guide says:** Trim at named levels when price CROSSES them, regardless of P&L. If price hits T1 ($387 D21 EMA) from below, trim 30% of remaining — even if avg cost is $392.50.
**Fix:** Remove the `unrealizedPnlPercent > 0` gate. Trim logic fires whenever price crosses a trim level from below, period. The trim levels come from the report's `levels` array where `type === 'trim'`.

### Bug 2: EMA Extension Zone missing
**Guide says:**
| Extension from W9 EMA | Status | Action |
|------------------------|--------|--------|
| 0-8% | Normal | No extension trimming |
| 8-12% | Warming | Note in reasoning, not actionable alone |
| 12-18% | Extended | First trim trigger (disabled in GREEN at 12% level) |
| 18-25% | Stretched | Second trim regardless of mode |
| 25%+ | Extreme | Heavy trim (1.5x rate) |

**When price is BELOW W9 EMA:** Report negative extension, no trimming.
**Fix:** Add `evaluateExtensionTrim()` function. Calculate `(price - W9_EMA) / W9_EMA * 100`. If >= 12% (and not GREEN at exactly 12%), trigger trim at mode trim cap rate. If >= 18%, trim regardless. If >= 25%, trim at 1.5x rate. Extension trims count toward daily trim cap. Extension trims respect Core Hold Floor.

### Bug 3: EJECTED mode not implemented
**Guide says:** 
- Trigger: Price below W21 EMA for **2 consecutive daily closes**
- Effect: 0% new buys (only oversold override). Hold 50% core TSLA.
- Recovery: When price reclaims W21 (consecutive_below_w21 resets to 0), system exits EJECTED and forces ORANGE — regardless of what indicators suggest. Does NOT jump to YELLOW or GREEN.
**Fix:** 
- Add `consecutive_below_w21` counter to V3State (persisted across days)
- In `evaluateExit()`: if consecutive_below_w21 >= 2 AND current exposure > 50%, trim to 50%
- In `evaluateEntry()`: if EJECTED, block all buys EXCEPT 200 SMA Oversold Override
- Track mode transitions: EJECTED → ORANGE on W21 reclaim (not GREEN/YELLOW)

### Bug 4: Kill Leverage Step 4 missing (below Put Wall)
**Guide says:**
1. W21 breaks → Cut ALL leverage. Hold shares. ✅ (already works)
2. Between W21 and Put Wall → Stop new buys. Assess context. ✅ (partially works)
3. Put Wall / Gamma Strike → Buy zone, shares only, no leverage. ✅ (works)
4. **Below Put Wall → Trim TSLA to 50%.** ❌ MISSING
**Fix:** In `evaluateExit()`, add: if price < report.putWall AND putWall > 0, check if TSLA exposure > 50% of total. If so, trim to 50%. This is the KL Step 4 forced trim — it's defensive, not a mode-based cap. Respects Core Hold Floor.

### Bug 5: Slow Zone in ORANGE/RED should reduce to 25% of normal, not 50%
**Current:** All modes get 50% multiplier (`slowZoneMultiplier = 0.5`)
**Guide says:** ORANGE/RED in Slow Zone = 25% of normal cap (not 50%)
**Fix:** `slowZoneMultiplier = (mode === 'ORANGE' || mode === 'RED') ? 0.25 : 0.5`

### Bug 6: MAX_INVESTED as entry gate — clarification
**Current behavior is CORRECT for entry gating.** MAX_INVESTED prevents new buys above the cap. It does NOT force sells. Already fixed with comment. No code change needed.

### Bug 7: Axe system prompt alignment
**Already fixed earlier today.** Mode caps corrected, KL awareness added. Paper trader restart picks it up.

---

## IMPLEMENTATION ORDER

1. **Bug 5** (Slow Zone ORANGE/RED 25%) — one-line fix
2. **Bug 1** (Trim regardless of P&L) — remove the `unrealizedPnlPercent > 0` gate
3. **Bug 4** (KL Step 4 below Put Wall) — add trim-to-50% check in evaluateExit
4. **Bug 2** (EMA Extension Zone) — new function + integration
5. **Bug 3** (EJECTED mode) — V3State extension + mode transition logic

---

## VERIFICATION PLAN

After each fix, run these checks:

### Unit Tests to Add
1. **Trim fires on losing position:** Create position at $392, price at $387 (D21 EMA trim level). Verify trim fires despite being underwater.
2. **Extension trim at 15%:** Price 15% above W9 EMA. Verify trim fires at mode rate.
3. **Extension trim suppressed in GREEN at 12%:** Price 12% above W9 in GREEN. Verify NO trim.
4. **Extension trim at 18% overrides GREEN:** Price 18% above W9 in GREEN. Verify trim fires.
5. **EJECTED mode after 2 closes below W21:** Simulate 2 daily closes below W21. Verify EJECTED activates, blocks all buys except oversold override.
6. **EJECTED → ORANGE recovery:** Price reclaims W21. Verify mode becomes ORANGE, not GREEN/YELLOW.
7. **KL Step 4:** Price below Put Wall. Verify TSLA trims to 50%.
8. **KL Step 4 respects Core Hold Floor:** Verify trim doesn't go below 20% of peak.
9. **Slow Zone in RED:** Verify cap is 25% of normal (not 50%).
10. **Slow Zone in GREEN:** Verify Slow Zone is inactive (no reduction).
11. **MAX_INVESTED blocks entry but doesn't force exit:** 60% exposure in RED. Verify no sell signal. Verify no buy signal.

### Integration Test
Run Taylor through one full simulated day with today's data (RED mode, $354 price, $392 avg cost, 746 shares):
- Verify NO forced sell-down from MAX_INVESTED
- Verify trims would fire if price hits D21 ($386.38) — even though underwater
- Verify KL Step 4 would fire if price drops below Put Wall ($350) — trim to 50%
- Verify Slow Zone reduces cap to 25% of 5% = 1.25% (matches report)

### Regression Check
- Run existing test suite (if any): `cd ~/Flacko_AI/flacko-ai && npx jest scripts/paper-trader/`
- Verify Orb transitions still work (DEFENSIVE → sell TSLL)
- Verify Regime A/B detection unchanged
- Verify Core Hold Floor still protects 20% of peak

---

## FILES TO MODIFY

1. `scripts/paper-trader/decision-engine.ts` — main logic (all bugs)
2. `scripts/paper-trader/types.ts` — add V3State.consecutive_below_w21, EJECTED mode type
3. `scripts/paper-trader/index.ts` — persist consecutive_below_w21 across days
4. `scripts/paper-trader/axelrod.ts` — update system prompt to include EJECTED mode and KL Step 4
5. `scripts/paper-trader/__tests__/decision-engine.test.ts` — add all 11 unit tests

---

## CRITICAL CONSTRAINTS

- **DO NOT** change Orb zone logic (it works)
- **DO NOT** change regime detection (it works)  
- **DO NOT** add MAX_INVESTED as a sell-down trigger (it's an accumulation ceiling)
- **DO NOT** change Core Hold Floor percentage (20%)
- **DO NOT** change daily trim cap values
- **DO NOT** change trim cap percentages per mode
- **DO NOT** remove the time restriction or max trades per day
- **Source of truth:** `~/clawd/guides/daily-report-guide.md` — if this spec contradicts the guide, the guide wins
