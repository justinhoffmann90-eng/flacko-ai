"""
RSI — Wilder's Relative Strength Index
=======================================
Standard 14-period RSI using Wilder's smoothing (EMA alpha = 1/length).

Usage:
    from indicators.rsi import compute_rsi
    df["rsi_14"] = compute_rsi(df["close"], length=14)
    df["rsi_9"] = compute_rsi(df["close"], length=9)

Columns added (when using add_rsi_columns):
    - rsi_{length}: RSI value
"""

import pandas as pd
import numpy as np


def compute_rsi(series: pd.Series, length: int = 14) -> pd.Series:
    """
    Compute Wilder's RSI for any numeric series.

    Works on price series (close), or derived series (e.g., EMA diff for BXT).
    Uses Wilder smoothing: EMA with alpha=1/length.

    Args:
        series: pandas Series of values
        length: RSI lookback period (default 14)

    Returns:
        pandas Series of RSI values (0–100), NaN for first `length` bars
    """
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = (-delta).clip(lower=0)

    avg_gain = gain.ewm(alpha=1 / length, min_periods=length, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / length, min_periods=length, adjust=False).mean()

    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi.rename(f"rsi_{length}")


def add_rsi_columns(df: pd.DataFrame, lengths: list = None, col: str = "close") -> pd.DataFrame:
    """
    Add RSI columns to a OHLCV DataFrame.

    Args:
        df: DataFrame with price data
        lengths: list of RSI periods (default [14])
        col: column to compute RSI on (default 'close')

    Returns:
        DataFrame with RSI columns added in-place
    """
    if lengths is None:
        lengths = [14]
    for length in lengths:
        df[f"rsi_{length}"] = compute_rsi(df[col], length)
    return df


def rsi_condition(df: pd.DataFrame, col: str = "rsi_14", op: str = "<", threshold: float = 40.0) -> pd.Series:
    """
    Return boolean Series for RSI condition.

    Args:
        df: DataFrame with RSI column
        col: RSI column name
        op: operator string ('<', '>', '<=', '>=', '==')
        threshold: comparison value

    Returns:
        boolean Series
    """
    ops = {
        "<": df[col] < threshold,
        ">": df[col] > threshold,
        "<=": df[col] <= threshold,
        ">=": df[col] >= threshold,
        "==": df[col] == threshold,
    }
    if op not in ops:
        raise ValueError(f"Unknown operator: {op}. Use one of: {list(ops.keys())}")
    return ops[op]
