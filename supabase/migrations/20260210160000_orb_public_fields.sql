ALTER TABLE orb_setup_definitions ADD COLUMN IF NOT EXISTS public_name TEXT;
ALTER TABLE orb_setup_definitions ADD COLUMN IF NOT EXISTS category_tags TEXT[];
ALTER TABLE orb_setup_definitions ADD COLUMN IF NOT EXISTS one_liner TEXT;
ALTER TABLE orb_setup_definitions ADD COLUMN IF NOT EXISTS public_description TEXT;

UPDATE orb_setup_definitions
SET
  public_name = 'Oversold Gauge',
  category_tags = ARRAY['Momentum', 'Oversold'],
  one_liner = 'Tracking momentum recovery from deeply oversold conditions',
  public_description = 'When momentum reaches deeply oversold levels, we start a gauge that tracks recovery toward a positive target. History shows most recoveries complete within 2-3 weeks with a median return of +7.25%.'
WHERE id = 'smi-oversold-gauge';

UPDATE orb_setup_definitions
SET
  public_name = 'Generational Oversold',
  category_tags = ARRAY['Deep Value', 'Rare'],
  one_liner = 'Once-in-a-cycle deep oversold condition — historically the highest-return signal',
  public_description = 'TSLA is severely dislocated from long-term trend support. This signal has fired only 8 times in 3.5 years. At 60 days, it has a 100% win rate with +51.59% average return. When this fires, it overrides everything.'
WHERE id = 'oversold-extreme';

UPDATE orb_setup_definitions
SET
  public_name = 'Regime Shift',
  category_tags = ARRAY['Structural', 'Weekly'],
  one_liner = 'Weekly timeframe confirms the correction is over',
  public_description = 'The weekly chart signals a structural turn — momentum shifts from bearish to recovering AND price reclaims a key weekly support level. This catches the moment a correction officially ends. 89.5% of the time, price is higher 10 days later.'
WHERE id = 'regime-shift';

UPDATE orb_setup_definitions
SET
  public_name = 'Deep Value',
  category_tags = ARRAY['Oversold', 'Reversal'],
  one_liner = 'Meaningful oversold conditions with first signs of recovery',
  public_description = 'Price is significantly below long-term trend with the first signs that selling pressure is exhausting. Not as extreme as Generational, but fires more frequently and still carries a strong edge. 82.4% win rate through 20 days.'
WHERE id = 'deep-value';

UPDATE orb_setup_definitions
SET
  public_name = 'Green Shoots',
  category_tags = ARRAY['Momentum', 'Reversal'],
  one_liner = 'First momentum turn in structurally oversold territory',
  public_description = 'Daily momentum flips from accelerating selling to exhaustion while price sits below long-term trend support. This is the "first green shoots of recovery" signal — it catches the turn before the crowd sees it.'
WHERE id = 'green-shoots';

UPDATE orb_setup_definitions
SET
  public_name = 'Momentum Flip',
  category_tags = ARRAY['Momentum', 'Confirmation'],
  one_liner = 'Selling exhaustion confirmed — buying pressure now taking over',
  public_description = 'Momentum transitions from "selling exhausting" to "buying confirmed" while conditions aren''t overheated. This is the point where the turn is proven. You''re not catching a knife — you''re entering after the bottom is in.'
WHERE id = 'momentum-flip';

UPDATE orb_setup_definitions
SET
  public_name = 'Trend Confirmation',
  category_tags = ARRAY['Momentum', 'Trend'],
  one_liner = 'Both momentum indicators agree — bullish conditions confirmed',
  public_description = 'Two independent momentum signals align bullish simultaneously. When both agree, the trend has real conviction behind it. 67.7% win rate at 20 days with a healthy +9.22% average return.'
WHERE id = 'trend-confirm';

UPDATE orb_setup_definitions
SET
  public_name = 'Trend Ride',
  category_tags = ARRAY['Trend', 'Frequent'],
  one_liner = 'Healthy daily trend with weekly structure intact — the bread and butter',
  public_description = 'Daily momentum is positive and price sits above key support levels on both timeframes. This fires frequently — about once a week on average — and produces steady base-hit returns. Size smaller; repeat often.'
WHERE id = 'trend-ride';

UPDATE orb_setup_definitions
SET
  public_name = 'Trend Continuation',
  category_tags = ARRAY['Trend', 'Weekly'],
  one_liner = 'Weekly structure fully aligned bullish with daily momentum confirming',
  public_description = 'The weekly chart shows a perfectly healthy trend — all major moving averages aligned and rising — with daily momentum confirming. Best suited for longer holds where the 60-day edge shines (+10.90% avg).'
WHERE id = 'trend-continuation';

UPDATE orb_setup_definitions
SET
  public_name = 'Goldilocks Zone',
  category_tags = ARRAY['Momentum', 'Sweet Spot'],
  one_liner = 'The sweet spot — trend confirmed, momentum positive, not overbought',
  public_description = 'Three conditions align simultaneously: trend is confirmed, momentum is positive but not extended, and the market isn''t overbought. This catches the window after a move is proven but before it gets crowded. The 87.2% win rate at 60 days is the highest of any trend signal in our dataset.'
WHERE id = 'goldilocks';

UPDATE orb_setup_definitions
SET
  public_name = 'Capitulation Bounce',
  category_tags = ARRAY['Oversold', 'Short-Term'],
  one_liner = 'Extended selling streak meets oversold momentum — snap-back imminent',
  public_description = 'TSLA has dropped for multiple consecutive days and momentum is oversold. Panic selling exhausts weak hands, and the snap-back is statistically the most reliable short-term signal we track. 72.2% win rate at 5 days — the fastest-acting buy signal in the dataset.'
WHERE id = 'capitulation';

UPDATE orb_setup_definitions
SET
  public_name = 'Overbought Gauge',
  category_tags = ARRAY['Overbought', 'Caution'],
  one_liner = 'Momentum is extremely overbought — tracking until it resets',
  public_description = 'Momentum has reached extreme overbought levels. We track until it resets. 75% of the time, price is lower by the time the reset completes. Do not open new call positions.'
WHERE id = 'smi-overbought';

UPDATE orb_setup_definitions
SET
  public_name = 'Double Downtrend',
  category_tags = ARRAY['Bearish', 'Structural'],
  one_liner = 'Both daily and weekly momentum aligned bearish — no floor',
  public_description = 'Both timeframes confirm accelerating selling pressure. There is no structural support. Historically, price is lower 58% of the time after 20 days. Do not buy calls. Do not try to catch the bottom.'
WHERE id = 'dual-ll';

UPDATE orb_setup_definitions
SET
  public_name = 'Overextended',
  category_tags = ARRAY['Extended', 'Trim'],
  one_liner = 'Price is far above long-term trend — gravity wins at these levels',
  public_description = 'Price has run significantly above its long-term trend average. At these levels, the 60-day outlook is brutal: only 28.2% of the time is price higher. This is trim territory, not buying territory.'
WHERE id = 'overextended';

UPDATE orb_setup_definitions
SET
  public_name = 'Momentum Crack',
  category_tags = ARRAY['Momentum', 'Warning'],
  one_liner = 'Elevated momentum just broke sharply — the initial bounce is a trap',
  public_description = 'Momentum was elevated and dropped sharply. The 5-day bounce looks like "just a pullback" but by 10-20 days the damage is done. Consistently below-50% win rates beyond the initial bounce.'
WHERE id = 'momentum-crack';
