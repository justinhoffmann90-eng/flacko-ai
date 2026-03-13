"""
SMI — Stochastic Momentum Index
================================
Matches the live Orb engine (compute-indicators.ts) EXACTLY.

Verified parameters (Justin's TradingView screenshot, 2026-03-13):
  %K Length (k_length)  = 10
  %D Length (d_length)  = 3
  EMA Length (ema_length) = 3

Formula (ported from TypeScript):
  hl_diff = high - low  (range)
  cl_diff = close - (high + low) / 2  (distance from midpoint)
  d1 = ema(cl_diff, k_length)
  r1 = ema(hl_diff, k_length)
  d2 = ema(d1, d_length)
  r2 = ema(r1, d_length)
  smi = 100 * d2 / (r2 / 2)   where r2 != 0, else 0
  signal = ema(smi, ema_length)

Range: approximately -100 to +100

Usage:
    from indicators.smi import compute_smi, add_smi_columns
    smi_vals, signal_vals = compute_smi(close, high, low)
    df = add_smi_columns(df)
"""

import pandas as pd
import numpy as np


def _ema(series: pd.Series, length: int) -> pd.Series:
    """EMA using pandas ewm (matches TypeScript ema() function)."""
    return series.ewm(span=length, adjust=False).mean()


def compute_smi(
    close: pd.Series,
    high: pd.Series,
    low: pd.Series,
    k_length: int = 10,
    d_length: int = 3,
    ema_length: int = 3,
) -> tuple[pd.Series, pd.Series]:
    """
    Compute Stochastic Momentum Index.

    Matches compute-indicators.ts smi() function exactly.

    Args:
        close: close prices
        high: high prices
        low: low prices
        k_length: %K smoothing length (default 10)
        d_length: %D smoothing length (default 3)
        ema_length: signal line EMA length (default 3)

    Returns:
        (smi_values, signal_values) as pandas Series
    """
    hl_diff = high - low
    cl_diff = close - (high + low) / 2

    d1 = _ema(cl_diff, k_length)
    r1 = _ema(hl_diff, k_length)

    d2 = _ema(d1, d_length)
    r2 = _ema(r1, d_length)

    # Avoid division by zero
    smi = pd.Series(np.where(r2 != 0, 100 * d2 / (r2 / 2), 0), index=close.index, name="smi")
    signal = _ema(smi, ema_length).rename("smi_signal")

    return smi, signal


def add_smi_columns(
    df: pd.DataFrame,
    k_length: int = 10,
    d_length: int = 3,
    ema_length: int = 3,
    close_col: str = "close",
    high_col: str = "high",
    low_col: str = "low",
) -> pd.DataFrame:
    """
    Add SMI columns to a OHLCV DataFrame.

    Adds columns:
        smi: SMI value
        smi_signal: signal line
        smi_bull_cross: True on bar where SMI crosses above signal
        smi_bear_cross: True on bar where SMI crosses below signal
        smi_prev: prior bar SMI value
        smi_signal_prev: prior bar signal value

    Args:
        df: OHLCV DataFrame (must have close/high/low columns)
        k_length: %K length (default 10)
        d_length: %D length (default 3)
        ema_length: signal EMA length (default 3)

    Returns:
        DataFrame with SMI columns added
    """
    smi, signal = compute_smi(
        df[close_col], df[high_col], df[low_col],
        k_length=k_length, d_length=d_length, ema_length=ema_length
    )

    df["smi"] = smi
    df["smi_signal"] = signal
    df["smi_prev"] = smi.shift(1)
    df["smi_signal_prev"] = signal.shift(1)

    # Cross detection (matches TypeScript smi_bull_cross / smi_bear_cross)
    bull_cross = (df["smi_prev"] <= df["smi_signal_prev"]) & (df["smi"] > df["smi_signal"])
    bear_cross = (df["smi_prev"] >= df["smi_signal_prev"]) & (df["smi"] < df["smi_signal"])

    df["smi_bull_cross"] = bull_cross.fillna(False)
    df["smi_bear_cross"] = bear_cross.fillna(False)

    return df


def smi_condition(
    df: pd.DataFrame,
    threshold: float,
    op: str = "<",
    col: str = "smi",
) -> pd.Series:
    """
    Return boolean Series for SMI condition.

    Args:
        df: DataFrame with smi column
        threshold: comparison value (e.g. -60 for oversold, +75 for overbought)
        op: operator ('<', '>', '<=', '>=', '==')
        col: column name (default 'smi')

    Returns:
        boolean Series
    """
    ops = {
        "<":  df[col] < threshold,
        ">":  df[col] > threshold,
        "<=": df[col] <= threshold,
        ">=": df[col] >= threshold,
        "==": df[col] == threshold,
    }
    if op not in ops:
        raise ValueError(f"Unknown operator: {op}")
    return ops[op]
