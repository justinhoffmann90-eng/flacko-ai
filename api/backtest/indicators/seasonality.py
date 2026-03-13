"""
Seasonality Indicators
======================
Calendar-based return and volatility patterns.
Uses VIX data for volatility seasonality and historical TSLA data for return patterns.

Usage:
    from indicators.seasonality import compute_seasonality
    df = compute_seasonality(df, vix_df=None)

Metrics computed:
  - month: calendar month (1-12)
  - week_of_year: ISO week number
  - day_of_week: 0=Mon, 4=Fri
  - options_expiry_week: True if week contains monthly OpEx (3rd Friday)
  - q_end: True if last week of quarter (Q1/Q2/Q3/Q4)
  - seasonal_return_avg: avg historical return for this month (from same ticker)
  - seasonal_vol_avg: avg VIX for this month
  - vix_percentile: current VIX vs historical range (0-100)
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path

VIX_CACHE = Path(__file__).parent.parent / "data" / "cache" / "VIX-daily.json"


def load_vix_data() -> pd.DataFrame:
    """Load VIX daily data from cache."""
    if not VIX_CACHE.exists():
        return None
    with open(VIX_CACHE) as f:
        raw = json.load(f)
    dates = sorted(raw.keys())
    records = [{"date": pd.Timestamp(d), **raw[d]} for d in dates]
    df = pd.DataFrame(records)
    df = df.rename(columns=str.lower)
    return df


def compute_seasonality(df: pd.DataFrame, vix_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Add calendar-based seasonality columns to price DataFrame.

    Args:
        df: OHLCV DataFrame with 'date' column (datetime)
        vix_df: optional VIX DataFrame; loaded from cache if None

    Returns:
        DataFrame with seasonality columns:
          - month, week_of_year, day_of_week
          - options_expiry_week, q_end
          - vix_current (if VIX data available)
          - vix_percentile_1y (VIX vs 1-year range)
          - historical_month_return_avg (avg % return for same month historically)
    """
    if "date" not in df.columns:
        raise ValueError("DataFrame must have a 'date' column")

    dates = pd.to_datetime(df["date"])

    df["month"] = dates.dt.month
    df["week_of_year"] = dates.dt.isocalendar().week.astype(int)
    df["day_of_week"] = dates.dt.dayofweek  # 0=Mon, 4=Fri
    df["quarter"] = dates.dt.quarter
    df["year"] = dates.dt.year

    # Options expiry week: 3rd Friday of each month
    def is_opex_week(dt):
        """True if the week contains the 3rd Friday of the month."""
        # Find 3rd Friday of the month
        first_day = dt.replace(day=1)
        # First Friday
        days_until_friday = (4 - first_day.weekday()) % 7
        first_friday = first_day + pd.Timedelta(days=days_until_friday)
        third_friday = first_friday + pd.Timedelta(weeks=2)
        # Check if dt's week contains this Friday
        week_start = dt - pd.Timedelta(days=dt.weekday())
        week_end = week_start + pd.Timedelta(days=6)
        return week_start <= third_friday <= week_end

    df["options_expiry_week"] = dates.apply(is_opex_week)

    # Quarter-end week: last week of Mar, Jun, Sep, Dec
    quarter_end_months = {3, 6, 9, 12}
    df["q_end"] = dates.apply(
        lambda d: d.month in quarter_end_months and d.day >= 22
    )

    # Historical monthly return avg (from this ticker's own data)
    if "close" in df.columns and len(df) > 50:
        monthly_returns = []
        for i in range(len(df)):
            m = dates.iloc[i].month
            # Get all historical instances of this month (excluding current)
            mask = (dates.dt.month == m) & (dates < dates.iloc[i])
            if mask.sum() >= 3:
                hist = df.loc[mask, "close"].pct_change().dropna()
                monthly_returns.append(float(hist.mean() * 100))
            else:
                monthly_returns.append(np.nan)
        df["historical_month_return_avg"] = monthly_returns

    # VIX data
    if vix_df is None:
        vix_df = load_vix_data()

    if vix_df is not None:
        vix_dates = pd.to_datetime(vix_df["date"])
        vix_close = vix_df.set_index(vix_dates)["close"]

        # Merge closest VIX to each row
        vix_vals = []
        vix_pcts = []
        for dt in dates:
            # Find nearest VIX date
            diff = (vix_close.index - dt).abs()
            if diff.min() <= pd.Timedelta(days=5):
                nearest_idx = diff.argmin()
                vix_val = float(vix_close.iloc[nearest_idx])
                # 1-year VIX percentile
                one_year_ago = dt - pd.Timedelta(days=365)
                vix_1y = vix_close[(vix_close.index >= one_year_ago) & (vix_close.index <= dt)]
                if len(vix_1y) >= 10:
                    pct = float((vix_1y <= vix_val).mean() * 100)
                else:
                    pct = np.nan
                vix_vals.append(vix_val)
                vix_pcts.append(pct)
            else:
                vix_vals.append(np.nan)
                vix_pcts.append(np.nan)

        df["vix_current"] = vix_vals
        df["vix_percentile_1y"] = vix_pcts

    return df


def monthly_return_heatmap(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate a month x year heatmap of returns.

    Args:
        df: OHLCV DataFrame with 'date' and 'close' columns

    Returns:
        DataFrame indexed by year, columns = months 1-12, values = % return
    """
    dates = pd.to_datetime(df["date"])
    df2 = df.copy()
    df2["year"] = dates.dt.year
    df2["month"] = dates.dt.month
    df2["monthly_ret"] = df2["close"].pct_change() * 100

    pivot = df2.groupby(["year", "month"])["monthly_ret"].mean().unstack(level=1)
    return pivot
