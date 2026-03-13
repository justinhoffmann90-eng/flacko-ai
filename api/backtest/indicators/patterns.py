"""
Price Pattern Detection
=======================
Common candlestick and chart patterns used in swing trading analysis.

Usage:
    from indicators.patterns import compute_patterns
    df = compute_patterns(df)

Patterns detected:
  - Hammer / Inverted Hammer (reversal candles)
  - Doji (indecision)
  - Engulfing (bullish/bearish)
  - Inside bar (consolidation)
  - Higher high / higher low / lower high / lower low (trend structure)
"""

import pandas as pd
import numpy as np


def compute_patterns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute common price patterns and add as boolean columns.

    Args:
        df: OHLCV DataFrame with columns: open, high, low, close

    Returns:
        DataFrame with pattern columns added:
          - hammer: bullish hammer (small body, long lower wick)
          - inverted_hammer: small body, long upper wick (at lows)
          - doji: very small body relative to range
          - bullish_engulfing: current candle engulfs prior bearish candle
          - bearish_engulfing: current candle engulfs prior bullish candle
          - inside_bar: high < prev high AND low > prev low
          - hh: higher high (trend continuation)
          - hl: higher low (bullish structure)
          - lh: lower high (bearish structure)
          - ll: lower low (bearish continuation)
    """
    body = (df["close"] - df["open"]).abs()
    candle_range = df["high"] - df["low"]
    upper_wick = df["high"] - df[["open", "close"]].max(axis=1)
    lower_wick = df[["open", "close"]].min(axis=1) - df["low"]
    is_bull = df["close"] >= df["open"]
    is_bear = df["close"] < df["open"]

    # Hammer: small body at top of range, long lower wick
    # Lower wick >= 2x body, upper wick <= 0.5x body, body <= 30% of range
    hammer = (
        (lower_wick >= 2 * body)
        & (upper_wick <= 0.5 * body.clip(lower=1e-6))
        & (body <= 0.3 * candle_range.clip(lower=1e-6))
    )
    df["hammer"] = hammer

    # Inverted hammer: small body at bottom, long upper wick
    inverted_hammer = (
        (upper_wick >= 2 * body)
        & (lower_wick <= 0.5 * body.clip(lower=1e-6))
        & (body <= 0.3 * candle_range.clip(lower=1e-6))
    )
    df["inverted_hammer"] = inverted_hammer

    # Doji: body <= 5% of range
    doji = body <= 0.05 * candle_range.clip(lower=1e-6)
    df["doji"] = doji

    # Engulfing patterns (require prior candle)
    prev_open = df["open"].shift(1)
    prev_close = df["close"].shift(1)
    prev_bull = prev_close >= prev_open
    prev_bear = prev_close < prev_open

    bullish_engulfing = (
        is_bull
        & prev_bear
        & (df["close"] > prev_open)
        & (df["open"] < prev_close)
    )
    df["bullish_engulfing"] = bullish_engulfing

    bearish_engulfing = (
        is_bear
        & prev_bull
        & (df["close"] < prev_open)
        & (df["open"] > prev_close)
    )
    df["bearish_engulfing"] = bearish_engulfing

    # Inside bar: range completely inside prior bar
    df["inside_bar"] = (df["high"] < df["high"].shift(1)) & (df["low"] > df["low"].shift(1))

    # Trend structure (using highs and lows)
    df["hh"] = df["high"] > df["high"].shift(1)  # higher high
    df["hl"] = df["low"] > df["low"].shift(1)    # higher low
    df["lh"] = df["high"] < df["high"].shift(1)  # lower high
    df["ll"] = df["low"] < df["low"].shift(1)    # lower low

    return df
