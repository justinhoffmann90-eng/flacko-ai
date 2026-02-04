export type TweetTemplateType = "level" | "mode" | "scenario" | "keyLevel";

export const templates: Record<TweetTemplateType, string[]> = {
  level: [
    `\${level_name} at $\${level_price} \${level_result}.

this is where dealer hedging creates a structural pivot.

above it: bullish regime.
below it: bearish regime.

know the line before it matters.

$TSLA`,

    `$\${level_price} = today's \${level_name}.

\${level_emoji} \${level_result}.

not magic. just math.

dealers hedge options at these prices.

their hedging moves the stock.

$TSLA`,

    `the \${level_name} is $\${level_price}.

dealers don't guess these levels.

they're calculated from options positioning.

knowing where = knowing when.

$TSLA`,
  ],

  mode: [
    `\${mode} mode today.

max position size: \${daily_cap}%.

\${mode_reason}

small size on uncertain days = still trading tomorrow.

the best trade is often the smallest one.

$TSLA`,

    `why \${mode} mode?

\${mode_reason}

traders who ignore the mode get chopped.

traders who respect it keep their capital.

system > feelings.

$TSLA`,

    `\${mode} mode = \${daily_cap}% max size.

the casino sets the rules.

smart players adjust their bets.

$TSLA`,
  ],

  scenario: [
    `base case: \${scenario_prediction}

structure tells you what's probable.

price confirms.

$TSLA`,

    `\${scenario_name} scenario in play.

\${scenario_prediction}

watch the levels. they'll tell you which way.

$TSLA`,
  ],

  keyLevel: [
    `\${key_level_name} at $\${key_level_price} \${key_level_result}.

this isn't a random line on a chart.

it's where dealer hedging forces action.

knowing the level = knowing the setup.

$TSLA`,

    `\${key_level_name} = $\${key_level_price}.

\${key_level_result}.

most traders draw lines randomly.

these levels are calculated from options flow.

different game.

$TSLA`,

    `$\${key_level_price} \${key_level_name}:

\${key_level_result}.

the casino has rules.

learn them or get played by them.

$TSLA`,
  ],
};
