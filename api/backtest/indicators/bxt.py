"""
BX-Trender Indicator
====================
Reads the TradingView TSLA Weekly BXT CSV export (ground truth).

Key metric: bxt_consecutive_ll
  - Counts consecutive weeks where BXT is strictly lower than prior week AND negative
  - Resets to 0 when BXT rises OR goes positive
  - Signal fires at the FIRST bar where BXT rises after a streak (the "higher low")

CSV format:
  - 'time' column = Unix timestamp
  - Last column = 'B-Xtrender Osc. - Histogram' (TV ground truth values)

Usage:
    from indicators.bxt import compute_bxt_consecutive_ll
    df = compute_bxt_consecutive_ll(bxt_csv_path)
    # df has columns: date, close, bxt, consec_ll, is_signal, streak_at_signal
"""

import pandas as pd
import numpy as np
from pathlib import Path

BXT_COL = "B-Xtrender Osc. - Histogram"
DEFAULT_CSV = Path(__file__).parent.parent / "data" / "cache" / "tv-tsla-weekly-bxt.csv"
ALT_CSV = Path("~/clawd/data/tv-tsla-weekly-bxt.csv").expanduser()


def load_bxt_csv(csv_path: str = None) -> pd.DataFrame:
    """Load and parse the TradingView BXT CSV."""
    if csv_path is None:
        if DEFAULT_CSV.exists():
            csv_path = DEFAULT_CSV
        elif ALT_CSV.exists():
            csv_path = ALT_CSV
        else:
            raise FileNotFoundError(
                f"BXT CSV not found. Expected at:\n  {DEFAULT_CSV}\n  {ALT_CSV}\n"
                "Export from TradingView: Chart > ... > Export data"
            )

    df = pd.read_csv(csv_path)
    df["date"] = pd.to_datetime(df["time"], unit="s")

    if BXT_COL not in df.columns:
        raise ValueError(
            f"Column '{BXT_COL}' not found in CSV.\n"
            f"Available columns: {list(df.columns)}"
        )

    # Filter to rows with valid BXT data
    df = df[df[BXT_COL].notna()].copy().reset_index(drop=True)
    df["bxt"] = df[BXT_COL].astype(float)

    return df[["date", "open", "high", "low", "close", "bxt"]].copy()


def compute_bxt_consecutive_ll(csv_path: str = None) -> pd.DataFrame:
    """
    Compute BXT consecutive lower-lows indicator from TV CSV.

    Returns DataFrame with columns:
      - date, open, high, low, close, bxt
      - consec_ll: consecutive weeks BXT strictly lower AND negative
      - is_signal: True on the first bar where BXT rises after streak >= min_streak
      - streak_at_signal: the streak length that triggered the signal
    """
    df = load_bxt_csv(csv_path)

    # Compute consec_ll
    consec_ll = []
    count = 0
    for i in range(len(df)):
        bxt = df["bxt"].iloc[i]
        if i == 0:
            count = 1 if bxt <= 0 else 0
            consec_ll.append(count)
            continue
        bxt_prev = df["bxt"].iloc[i - 1]
        if bxt < 0 and bxt < bxt_prev:
            count += 1
        else:
            count = 0
        consec_ll.append(count)

    df["consec_ll"] = consec_ll
    df["bxt_prev"] = df["bxt"].shift(1)

    return df


def find_signals(
    df: pd.DataFrame,
    min_streak: int = 6,
    include_ongoing: bool = True,
) -> list:
    """
    Find all BXT consecutive LL signal instances.

    A signal fires on the FIRST bar where BXT rises (higher low) after
    a streak of >= min_streak consecutive lower lows.

    The "current" signal is an ongoing streak that hasn't resolved yet.

    Returns list of dicts:
      {signal_date, signal_close, streak_len, signal_idx, completed}
    """
    signals = []
    in_streak = False
    max_streak = 0

    for i in range(len(df)):
        count = df["consec_ll"].iloc[i]

        if count >= 1 and not in_streak:
            in_streak = True
            max_streak = count
        elif count > max_streak and in_streak:
            max_streak = count
        elif count == 0 and in_streak:
            # Streak ended — this bar is the first higher low (signal fires here)
            if max_streak >= min_streak:
                signals.append(
                    {
                        "signal_date": df["date"].iloc[i],
                        "signal_close": float(df["close"].iloc[i]),
                        "streak_len": max_streak,
                        "signal_idx": i,
                        "completed": True,
                    }
                )
            in_streak = False
            max_streak = 0

    # Ongoing streak — signal not yet fired
    if in_streak and max_streak >= min_streak and include_ongoing:
        last_idx = len(df) - 1
        signals.append(
            {
                "signal_date": df["date"].iloc[last_idx],
                "signal_close": float(df["close"].iloc[last_idx]),
                "streak_len": max_streak,
                "signal_idx": last_idx,
                "completed": False,
            }
        )

    return signals
