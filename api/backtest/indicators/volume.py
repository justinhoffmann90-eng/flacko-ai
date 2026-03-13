"""
Volume Indicators
=================
Volume spikes, On-Balance Volume (OBV), and relative volume.

Usage:
    from indicators.volume import compute_volume_spike, compute_obv, compute_relative_volume
    df = compute_volume_spike(df, lookback=20, threshold=2.0)
    df = compute_obv(df)
    df = compute_relative_volume(df, lookback=20)
"""

import pandas as pd
import numpy as np


def compute_volume_spike(
    df: pd.DataFrame,
    lookback: int = 20,
    threshold: float = 2.0,
) -> pd.DataFrame:
    """
    Detect volume spikes above a multiple of the rolling average.

    Adds columns:
      - volume_avg_{lookback}: rolling average volume
      - volume_ratio: current volume / avg volume
      - volume_spike: True when ratio >= threshold

    Args:
        df: OHLCV DataFrame (must have 'volume' column)
        lookback: rolling window for average (default 20)
        threshold: spike threshold as multiple of avg (default 2.0 = 2x avg)

    Returns:
        DataFrame with volume spike columns
    """
    avg_col = f"volume_avg_{lookback}"
    df[avg_col] = df["volume"].rolling(window=lookback).mean()
    df["volume_ratio"] = df["volume"] / df[avg_col]
    df["volume_spike"] = df["volume_ratio"] >= threshold
    return df


def compute_obv(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute On-Balance Volume (OBV).

    OBV increases when close > prev close, decreases when close < prev close.
    Adds column: obv

    Args:
        df: OHLCV DataFrame

    Returns:
        DataFrame with OBV column
    """
    direction = np.sign(df["close"].diff()).fillna(0)
    df["obv"] = (direction * df["volume"]).cumsum()
    return df


def compute_relative_volume(
    df: pd.DataFrame,
    lookback: int = 20,
) -> pd.DataFrame:
    """
    Compute relative volume (RVOL) — current volume vs average.

    RVOL = current_volume / avg_volume_over_lookback_period

    Adds columns:
      - rvol_{lookback}: relative volume ratio
      - rvol_signal: categorical ('low' < 0.5x, 'normal' 0.5-1.5x, 'elevated' 1.5-2x, 'high' > 2x)

    Args:
        df: OHLCV DataFrame
        lookback: rolling average window (default 20)

    Returns:
        DataFrame with RVOL columns
    """
    avg_vol = df["volume"].rolling(window=lookback).mean()
    rvol = df["volume"] / avg_vol
    rvol_col = f"rvol_{lookback}"
    df[rvol_col] = rvol

    # Categorical signal
    conditions = [
        rvol < 0.5,
        (rvol >= 0.5) & (rvol < 1.5),
        (rvol >= 1.5) & (rvol < 2.0),
        rvol >= 2.0,
    ]
    categories = ["low", "normal", "elevated", "high"]
    df[f"rvol_signal"] = np.select(conditions, categories, default="normal")

    return df
