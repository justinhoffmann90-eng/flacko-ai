export type TweetTemplateType = "level" | "mode" | "scenario" | "keyLevel";

export const templates: Record<TweetTemplateType, string[]> = {
  level: [
    `yesterday's \${level_name} at $\${level_price} \${level_result}.

called it in the morning report before market open.

most traders react to levels after they break.

the edge is knowing them before.

$TSLA`,

    `\${level_name} = $\${level_price}.

price \${level_action}: $\${actual_price}.

\${level_emoji} \${level_result}.

not magic. just structure.

$TSLA`,

    `the \${level_name} at $\${level_price} \${level_result}.

dealers don't guess these levels.

they're mathematically forced to defend them.

knowing where = knowing when.

$TSLA`,
  ],

  mode: [
    `\${mode} mode yesterday.

tsla swung \${intraday_move_pct}% intraday.

max position size: \${daily_cap}%.

small size on volatile days = still in the game today.

the best trade is often the smallest one.

$TSLA`,

    `why \${mode} mode?

\${mode_reason}

yesterday's range: \${intraday_move_pct}%.

traders who ignored the mode got chopped.

traders who respected it kept their capital.

system > feelings.

$TSLA`,

    `\${mode} mode = \${daily_cap}% max size.

tsla moved \${intraday_move_pct}% intraday.

the casino was volatile.

smart players bet small.

$TSLA`,
  ],

  scenario: [
    `morning prediction: \${scenario_prediction}

actual:
high $\${high}
low $\${low}
close $\${close}

not psychic. just pattern recognition.

$TSLA`,

    `\${scenario_name} case played out.

called it at 7am.

range: $\${low} – $\${high}
close: $\${close}

structure tells you what's probable.

price confirms.

$TSLA`,
  ],

  keyLevel: [
    `\${key_level_name} at $\${key_level_price}.

price \${key_level_result}.

this level isn't random. it's where dealer hedging forces action.

knowing the level = knowing the setup.

$TSLA`,

    `\${key_level_name} = $\${key_level_price}.

result: \${key_level_result}.

most traders draw lines randomly.

these levels are calculated from options flow.

different game.

$TSLA`,

    `yesterday's \${key_level_name} ($\${key_level_price}):

\${key_level_result}.

the casino has rules.

learn them or get played by them.

$TSLA`,
  ],
};
