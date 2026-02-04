export type TweetTemplateType = "level" | "mode" | "scenario" | "keyLevel" | "hiro";

export const templates: Record<TweetTemplateType, string[]> = {
  level: [
    `intel update: gamma strike at $\${level_price}

this is the line between two different wars.

above it:
• positive gamma regime
• trends run smooth
• dips get bought
• controlled expansion

below it:
• negative gamma regime
• violent swings
• nothing holds
• pure chaos

same battlefield. completely different rules.

$TSLA`,

    `battlefield update: $\${level_price} gamma strike

why this level runs the show:

dealers hedge options by buying/selling stock.

above gamma strike = they buy dips (stabilizing force)
below gamma strike = they sell weakness (amplifying force)

this is why tsla trends for days then moves 5% in an hour.

not random. regime change.

$TSLA`,

    `soldier reminder: gamma strike is $\${level_price}

most traders don't know this level exists.

they watch price candles while the real war happens in dealer positioning.

above this line = offense
below this line = defense

know where the line is before you deploy capital.

$TSLA`,
  ],

  mode: [
    `war room update: \${mode} mode activated

daily cap: \${daily_cap}%
posture: \${posture}

\${mode_reason}

the mode system exists because volatility isn't constant.

sizing based on conviction = emotional trading
sizing based on conditions = survival

one keeps you in the war. one makes you a casualty.

$TSLA`,

    `trenches report: \${mode} mode — \${daily_cap}% max position

posture: \${posture}

\${mode_reason}

here's what separates survivors from casualties:

recruits size based on how they feel.
soldiers size based on battlefield conditions.

high conviction + wrong conditions = supply for smarter traders.

$TSLA`,

    `campaign briefing: running \${mode} mode today

\${daily_cap}% position sizing
\${posture}

\${mode_reason}

most traders blow up not from being wrong.
they blow up from being wrong with too much size.

respect the conditions or become liquidity.

$TSLA`,
  ],

  scenario: [
    `intel update: today's battlefield scenarios

🐂 bull trigger: \${bull_trigger} → target \${bull_target}
📊 base case: \${base_trigger} → holds \${base_target}
🐻 bear trigger: \${bear_trigger} → risk to \${bear_target}

don't predict which path.
identify triggers. wait for confirmation. then deploy.

the market shows its hand to those patient enough to watch.

$TSLA`,

    `trenches report: three scenarios in play

bull case: \${bull_trigger}
base case: \${base_trigger}
bear case: \${bear_trigger}

recruits pick a direction and hope.
soldiers wait for the market to commit first.

hope is not a strategy.
structure is.

$TSLA`,
  ],

  keyLevel: [
    `battlefield update: \${key_level_name} at $\${key_level_price}

why this level matters:

dealers are short options at this strike.
to stay neutral they must hedge with stock.

as price approaches = hedging intensifies = mechanical support/resistance.

not patterns. not hope. math.

when everyone watches the same charts, edge comes from seeing what they can't.

$TSLA`,

    `intel update: $\${key_level_price} \${key_level_name}

this is a defensive line built by dealer positioning.

how it works:
1. traders buy options at strike
2. dealers sell those options
3. dealers hedge with stock as price moves
4. creates support/resistance through mechanics

retail sees price.
war room sees structure.

$TSLA`,

    `soldier reminder: watch $\${key_level_price}

\${key_level_name} — mechanical level from options flow.

most traders draw lines from price history.
these lines come from where dealers are forced to act.

history = where buyers showed up before
positioning = where they'll have to show up today

past vs present. hope vs math.

$TSLA`,
  ],

  hiro: [
    `war room update: hiro reading \${hiro_reading}

\${hiro_context}

hiro = hedge impact real-time oracle

tracks institutional hedging flow in real time:
• positive = adding long exposure
• negative = reducing/hedging
• flat = waiting

retail watches price.
command watches flow.

$TSLA`,

    `intel update: institutional flow at \${hiro_reading}

\${hiro_context}

hiro shows what smart money is doing — not saying.

positive flow = institutions getting long
negative flow = institutions hedging/reducing

price tells you what happened.
flow tells you what's happening.

$TSLA`,

    `trenches report: hiro showing \${hiro_reading}

\${hiro_context}

most traders react to candles.
war room monitors the flow beneath.

this is how you see the airstrike before it lands.

$TSLA`,
  ],
};
