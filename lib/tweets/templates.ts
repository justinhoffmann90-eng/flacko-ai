export type TweetTemplateType = "level" | "mode" | "scenario" | "keyLevel" | "hiro" | "morningBrief" | "eodWrap";

export const templates: Record<TweetTemplateType, string[]> = {
  level: [
    `$TSLA gamma strike: $\${level_price}

this is the line that changes the rules.

above it — positive gamma:
• dealers buy dips (mechanical support)
• trends run cleaner
• volatility compresses

below it — negative gamma:
• dealers sell weakness (amplifies moves)
• violent swings both ways
• stop losses get hunted

same ticker. two completely different markets.
know which one you're trading.`,

    `$TSLA pivot level: $\${level_price} (gamma strike)

most traders watch candles. the real edge is dealer positioning.

above gamma strike = dealers stabilize (buying dips)
below gamma strike = dealers destabilize (selling into weakness)

this is why TSLA can trend for 3 days then move 5% in an hour.
it's not random. it's a regime change at one level.`,

    `$\${level_price} — the only TSLA level that matters today.

gamma strike = where dealer behavior flips.

think of it as a thermostat:
above → AC on, smooth conditions
below → heat on, volatile conditions

same house. different climate.

most traders have no idea this level exists.`,

    `before you trade TSLA today, find $\${level_price} on your chart.

gamma strike.

the reason price "respects" levels isn't magic:

1. dealers sell options at strikes
2. they must hedge with stock as price moves
3. this creates mechanical support/resistance
4. above gamma strike = they help you
   below gamma strike = they hurt you`,
  ],

  mode: [
    `$TSLA mode update: \${mode}

daily cap: \${daily_cap}%
posture: \${posture}

\${mode_reason}

conviction without position sizing = gambling
structure without conviction = paralysis
structure + right size = edge

one approach survives drawdowns. the other creates them.`,

    `\${mode} mode — \${daily_cap}% max position.

\${mode_reason}

posture: \${posture}

most traders blow up from being right with wrong size.

the mode system prevents this:
• green = lean in (up to 25%)
• yellow = selective (up to 15%)
• orange = cautious (up to 10%)
• red = defend (up to 5%)

conditions > conviction.`,

    `$TSLA \${mode} mode activated.

\${mode_reason}

today's rules:
• max position: \${daily_cap}% of portfolio
• posture: \${posture}
• sizing based on conditions, not feelings

the best traders aren't always right.
they're always sized correctly.

green mode lets you push. red mode keeps you alive.
both are winning.`,

    `$TSLA daily briefing: \${mode} mode

\${mode_reason}

cap: \${daily_cap}% | posture: \${posture}

you can be right 70% of the time and still lose money
if you oversize on the 30%.

respect the mode. respect the cap.`,
  ],

  scenario: [
    `$TSLA scenarios — three paths, one plan:

bull case: \${bull_trigger}
→ \${bull_target}

base case: \${base_trigger}
→ \${base_target}

bear case: \${bear_trigger}
→ \${bear_target}

we don't predict which path. we prepare for all three.

the trigger tells you which one is playing out.
the plan tells you what to do.

react. don't predict.`,

    `$TSLA playbook — today's map:

if \${bull_trigger}: expect \${bull_target}
if \${base_trigger}: expect \${base_target}
if \${bear_trigger}: expect \${bear_target}

pre-market opinions are entertainment.
pre-market plans are edge.

know your triggers before the bell.
then let the market show its hand.`,

    `how we prepare for TSLA every morning:

1. identify scenarios
2. define triggers
3. size by mode
4. wait

today:
bull: \${bull_trigger} → \${bull_target}
base: \${base_trigger} → \${base_target}
bear: \${bear_trigger} → \${bear_target}

most traders have opinions. structured traders have plans.`,
  ],

  keyLevel: [
    `$\${key_level_price} — \${key_level_name}

why this level has teeth:

market makers sold options at this strike.
to stay neutral, they must hedge with stock.

as price approaches:
→ hedging intensifies
→ creates mechanical support or resistance
→ not because of lines on a chart
   but because of real money forced to act

this is the difference between technical analysis
and market structure analysis.`,

    `TSLA key level: $\${key_level_price} (\${key_level_name})

most traders draw lines from where price bounced before.
these lines come from where dealers are forced to buy or sell today.

history = where buyers showed up before (hope)
structure = where they must show up today (math)

one of these is edge.`,

    `$TSLA structural level: $\${key_level_price}

\${key_level_name} — built by options flow, not chart patterns.

how it works:
1. traders buy options at this strike
2. dealers sell those options
3. to hedge, dealers buy/sell stock as price approaches
4. creates real supply/demand at the level

chart patterns show you where price was.
options structure shows you where the money is.`,

    `the level most TSLA traders are missing: $\${key_level_price}

\${key_level_name}.

this isn't from a trendline or fibonacci.
it's from options market maker positioning.

when price hits this level, dealers are forced to act.
not because they want to — because their risk models require it.

forced buying = support. forced selling = resistance.
mechanical. repeatable. quantifiable.`,
  ],

  hiro: [
    `HIRO reading: \${hiro_reading}

\${hiro_context}

HIRO = Hedge Impact Real-time Oracle

• positive = institutions adding long exposure
• negative = institutions reducing/hedging
• flat = waiting for a catalyst

retail watches price candles.
institutions watch flow.

price tells you what happened.
flow tells you what's happening.`,

    `institutional flow update: \${hiro_reading}

\${hiro_context}

here's why this matters:

price is the last thing to move.

the sequence:
1. institutions reposition (flow)
2. options structure shifts (levels change)
3. price finally moves (what retail sees)

HIRO lets you see step 1.`,

    `$TSLA HIRO at \${hiro_reading}

\${hiro_context}

quick HIRO guide:
+$500M+ = institutions aggressively long
+$200-500M = moderate bullish positioning
-$200M+ = institutions hedging / reducing

this is what big money is doing — not saying.

earnings calls = marketing. positioning = truth.`,
  ],

  morningBrief: [
    `$TSLA Morning Brief — \${date}

\${mode_emoji} \${mode} MODE | Cap: \${daily_cap}%

\${mode_context}

Key Levels:
\${levels_block}

Game Plan:
\${plan}

Master Eject: \${master_eject}

Full report → flacko.ai`,

    `Good morning, TSLA traders.

\${mode_emoji} \${mode} mode. \${daily_cap}% max position.

\${mode_context}

Today's structure:
\${levels_block}

What I'd do:
\${plan}

Line in the sand: \${master_eject}

Full analysis → flacko.ai`,
  ],

  eodWrap: [
    `$TSLA EOD Wrap — \${date}

Open: $\${open} | Close: $\${close}
Range: $\${low} – $\${high} (\${change_pct}%)

Level Accuracy: \${accuracy_pct}% (\${hit}/\${total})

\${accuracy_breakdown}

\${insight}

Track record → flacko.ai/accuracy`,

    `$TSLA — how did the levels hold up?

Accuracy: \${accuracy_pct}% (\${hit}/\${total})

\${accuracy_breakdown}

\${insight}

Range: $\${low} – $\${high} (\${change_pct}%)

Full history → flacko.ai/accuracy`,
  ],
};
