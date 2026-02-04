export type TweetTemplateType = "level" | "mode" | "scenario" | "keyLevel";

export const templates: Record<TweetTemplateType, string[]> = {
  level: [
    `today's gamma strike: $\${level_price}

this is the line that changes everything.

above it:
• positive gamma regime
• trends are smooth
• dips get bought
• the casino is calm

below it:
• negative gamma regime
• moves are violent
• nothing holds
• the casino is chaos

same stock. completely different game depending on which side you're on.

$TSLA`,

    `$\${level_price} gamma strike — here's why it matters:

dealers hedge options by buying/selling stock.

above gamma strike = they buy dips (stabilizing)
below gamma strike = they sell into weakness (amplifying)

this is why tsla can trend smoothly for days, then suddenly move 5% in an hour.

it's not random. it's regime change.

$TSLA`,
  ],

  mode: [
    `\${mode} mode today — \${daily_cap}% max position size.

why? \${mode_reason}

the mode system exists because:
• volatility isn't constant
• position sizing should match conditions
• surviving bad days matters more than maximizing good ones

traders who ignore this blow up.
traders who respect it compound.

$TSLA`,

    `\${mode} mode = \${daily_cap}% max size.

\${mode_reason}

here's what most traders get wrong:

they size positions based on conviction.
they should size based on conditions.

high conviction + wrong conditions = blown account.
modest conviction + right sizing = still trading tomorrow.

$TSLA`,
  ],

  scenario: [
    `today's setup: \${scenario_prediction}

how to use this:

1. identify the trigger level
2. wait for price to reach it
3. watch for confirmation (or rejection)
4. act accordingly

most traders guess. structure traders wait for the market to show its hand.

$TSLA`,
  ],

  keyLevel: [
    `\${key_level_name}: $\${key_level_price}

why this level matters:

dealers are short options at this strike.
to hedge, they must buy/sell stock as price approaches.

this creates mechanical support or resistance — not hope, not patterns, just math.

when everyone's watching the same chart patterns, edge comes from seeing what they can't.

$TSLA`,

    `$\${key_level_price} \${key_level_name} — the level to watch today.

here's how dealer hedging works:

1. traders buy options at a strike
2. dealers sell those options
3. to stay neutral, dealers hedge with stock
4. as price moves toward the strike, hedging intensifies
5. this creates support/resistance

it's not magic. it's market mechanics.

$TSLA`,

    `\${key_level_name} at $\${key_level_price}

most traders draw support/resistance from price history.

these levels come from options positioning — where dealers are forced to act.

price history shows where buyers showed up before.
dealer positioning shows where they'll have to show up today.

past vs present. hope vs math.

$TSLA`,
  ],
};
