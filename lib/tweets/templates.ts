export type TweetTemplateType = "level" | "mode" | "scenario" | "keyLevel";

export const templates: Record<TweetTemplateType, string[]> = {
  level: [
    "Yesterday's ${level_name} at $${level_price} ${level_result} ${level_emoji}\n\nFlacko AI called it in the morning report.\n\nFull accuracy tracker → flacko.ai/accuracy\n\n$TSLA",
    "${level_name} at $${level_price} was ${level_result}.\nActual ${level_action}: $${actual_price} ${level_emoji}\n\nflacko.ai/accuracy\n\n$TSLA",
    "Morning report: ${level_name} = $${level_price}. Result: ${level_result} ${level_emoji}\n\nTrack the record → flacko.ai/accuracy\n\n$TSLA",
    "$${level_price} ${level_name} — ${level_result}. ${level_emoji}\n\nCalled it ahead of time.\n\nflacko.ai/accuracy\n\n$TSLA",
    "Flacko AI's ${level_name} ($${level_price}) ${level_result}. ${level_emoji}\n\nAccuracy matters.\n\nflacko.ai/accuracy\n\n$TSLA",
    "Called ${level_name} at $${level_price}. Price ${level_action} $${actual_price} ${level_emoji}\n\nFull track record → flacko.ai/accuracy\n\n$TSLA",
  ],
  mode: [
    "${mode} mode kept risk small yesterday.\nTSLA moved ${intraday_move_pct}% intraday.\n\nSmall size = small damage.\n\n$TSLA",
    "${mode} mode = ${daily_cap}% max size.\nYesterday's swing: ${intraday_move_pct}%.\n\nDiscipline wins.\n\n$TSLA",
    "Why ${mode} mode? ${mode_reason}\n\nMarket moved ${intraday_move_pct}% intraday.\nManaged risk stayed intact.\n\n$TSLA",
    "${mode} mode saved accounts yesterday.\nVolatility hit ${intraday_move_pct}% intraday.\n\nSystem > emotions.\n\n$TSLA",
    "The mode system works. ${mode} → small size → small pain.\nIntraday range: ${intraday_move_pct}%.\n\n$TSLA",
  ],
  scenario: [
    "Base case: ${scenario_prediction}\nActual: H $${high} / L $${low} / C $${close}\n\nflacko.ai/accuracy\n\n$TSLA",
    "Called it. ${scenario_name} scenario played out.\nActual range: $${low}–$${high}.\n\nflacko.ai/accuracy\n\n$TSLA",
    "Morning prediction vs reality:\n${scenario_prediction}\nActual close: $${close}\n\n$TSLA",
    "${scenario_name} case hit. Report called it at 7am.\nHigh $${high}, Low $${low}, Close $${close}.\n\n$TSLA",
    "Scenario check: ${scenario_prediction}\nActual range: $${low}–$${high}. ✅\n\nflacko.ai/accuracy\n\n$TSLA",
  ],
  keyLevel: [
    "${key_level_name} at $${key_level_price} got tested.\nPrice ${key_level_result}.\n\nSpotGamma levels + Flacko analysis = edge.\n\n$TSLA",
    "Key level check: ${key_level_name} $${key_level_price}.\nPrice ${key_level_result}.\n\nflacko.ai/accuracy\n\n$TSLA",
    "${key_level_name} = $${key_level_price}.\nResult: ${key_level_result}.\n\n$TSLA",
    "Yesterday's ${key_level_name} at $${key_level_price}: ${key_level_result}.\n\nEdge comes from structure.\n\n$TSLA",
    "SpotGamma key level ${key_level_name} ($${key_level_price}) → ${key_level_result}.\n\n$TSLA",
  ],
};
