"""
EMA Indicators
==============
Exponential Moving Average crosses, slopes, and distance metrics.

Usage:
    from indicators.ema import compute_ema, compute_ema_cross, compute_ema_slope, compute_ema_distance
    df["ema_9"] = compute_ema(df["close"], 9)
    df = compute_ema_cross(df, fast=9, slow=21)
    df = compute_ema_slope(df, period=9, lookback=3)
    df = compute_ema_distance(df, period=21)
"""

import pandas as pd
import numpy as np


def compute_ema(series: pd.Series, period: int) -> pd.Series:
    """
    Standard Exponential Moving Average using pandas ewm.

    Args:
        series: price series (usually close)
        period: EMA period

    Returns:
        EMA series
    """
    return series.ewm(span=period, adjust=False).mean().rename(f"ema_{period}")


def add_ema_columns(df: pd.DataFrame, periods: list = None, col: str = "close") -> pd.DataFrame:
    """
    Add multiple EMA columns to a DataFrame.

    Args:
        df: OHLCV DataFrame
        periods: list of EMA periods (default [9, 13, 21, 50, 200])
        col: price column (default 'close')

    Returns:
        DataFrame with EMA columns added
    """
    if periods is None:
        periods = [9, 13, 21, 50, 200]
    for p in periods:
        df[f"ema_{p}"] = compute_ema(df[col], p)
    return df


def compute_ema_cross(df: pd.DataFrame, fast: int = 9, slow: int = 21, col: str = "close") -> pd.DataFrame:
    """
    Detect EMA crossovers.

    Adds columns:
      - ema_{fast}: fast EMA
      - ema_{slow}: slow EMA
      - ema_cross_{fast}_{slow}: +1 = bullish cross, -1 = bearish cross, 0 = no cross
      - ema_bull_{fast}_{slow}: True when fast > slow (bullish alignment)

    Args:
        df: OHLCV DataFrame
        fast: fast EMA period
        slow: slow EMA period
        col: price column

    Returns:
        DataFrame with cross columns added
    """
    fast_col = f"ema_{fast}"
    slow_col = f"ema_{slow}"

    if fast_col not in df.columns:
        df[fast_col] = compute_ema(df[col], fast)
    if slow_col not in df.columns:
        df[slow_col] = compute_ema(df[col], slow)

    cross_col = f"ema_cross_{fast}_{slow}"
    bull_col = f"ema_bull_{fast}_{slow}"

    fast_above = df[fast_col] > df[slow_col]
    fast_above_prev = fast_above.shift(1)

    cross = pd.Series(0, index=df.index, name=cross_col)
    cross[fast_above & ~fast_above_prev] = 1   # bullish cross
    cross[~fast_above & fast_above_prev] = -1  # bearish cross

    df[cross_col] = cross
    df[bull_col] = fast_above

    return df


def compute_ema_slope(df: pd.DataFrame, period: int = 21, lookback: int = 3, col: str = "close") -> pd.DataFrame:
    """
    Compute EMA slope as percentage change over `lookback` bars.

    Adds columns:
      - ema_{period}: EMA values
      - ema_{period}_slope: % change over `lookback` bars (annualized per bar)

    Args:
        df: OHLCV DataFrame
        period: EMA period
        lookback: bars to look back for slope calculation
        col: price column

    Returns:
        DataFrame with slope column added
    """
    ema_col = f"ema_{period}"
    slope_col = f"ema_{period}_slope"

    if ema_col not in df.columns:
        df[ema_col] = compute_ema(df[col], period)

    df[slope_col] = df[ema_col].pct_change(lookback) * 100

    return df


def compute_ema_distance(df: pd.DataFrame, period: int = 21, col: str = "close") -> pd.DataFrame:
    """
    Compute price distance from EMA as percentage.

    Adds columns:
      - ema_{period}: EMA values
      - ema_{period}_dist: (price - EMA) / EMA * 100

    Positive = price above EMA (extended up)
    Negative = price below EMA (oversold from EMA perspective)

    Args:
        df: OHLCV DataFrame
        period: EMA period
        col: price column

    Returns:
        DataFrame with distance column added
    """
    ema_col = f"ema_{period}"
    dist_col = f"ema_{period}_dist"

    if ema_col not in df.columns:
        df[ema_col] = compute_ema(df[col], period)

    df[dist_col] = (df[col] - df[ema_col]) / df[ema_col] * 100

    return df


def weekly_emas_stacked(df: pd.DataFrame, periods: list = None, col: str = "close") -> pd.DataFrame:
    """
    Check if weekly EMAs are stacked in bullish alignment (fast > mid > slow)
    and price is above all of them.

    Adds columns:
      - ema_stacked: True when EMAs are in bullish order
      - price_above_all_emas: True when price is above all specified EMAs

    Args:
        df: weekly OHLCV DataFrame
        periods: EMA periods to check (default [9, 13, 21])
        col: price column

    Returns:
        DataFrame with stacked/alignment columns
    """
    if periods is None:
        periods = [9, 13, 21]

    for p in periods:
        ema_col = f"ema_{p}"
        if ema_col not in df.columns:
            df[ema_col] = compute_ema(df[col], p)

    ema_cols = [f"ema_{p}" for p in sorted(periods, reverse=True)]  # fast to slow

    # Stacked: each EMA > next slower EMA
    stacked = pd.Series(True, index=df.index)
    for i in range(len(ema_cols) - 1):
        stacked &= df[ema_cols[i]] > df[ema_cols[i + 1]]

    # Price above all
    above_all = pd.Series(True, index=df.index)
    for ec in ema_cols:
        above_all &= df[col] > df[ec]

    df["ema_stacked"] = stacked
    df["price_above_all_emas"] = above_all

    return df
