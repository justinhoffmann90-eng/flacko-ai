#!/usr/bin/env python3
"""
Flacko AI Backtest Engine
==========================
CLI for running backtests on historical price data using pre-defined scans
or ad-hoc conditions.

Also importable as a module:
    from engine import run_condition, run_scan

Usage (CLI):
    python3 engine.py --scan bxt-consecutive-ll --ticker TSLA
    python3 engine.py --condition "rsi < 35" --ticker TSLA --tf weekly
"""

import sys
import os
import json
import argparse
import re
import time
from pathlib import Path
from typing import Optional

import pandas as pd
import numpy as np

# ── Path setup ────────────────────────────────────────────────────────────────
ENGINE_DIR = Path(__file__).parent
sys.path.insert(0, str(ENGINE_DIR))

# Use /tmp for cache on Vercel (ephemeral, warm-lambda reuse)
TMP_CACHE_DIR = Path("/tmp/flacko-backtest-cache")
TMP_CACHE_DIR.mkdir(exist_ok=True)

# Local data dir (for CLI use when present)
_LOCAL_DATA_DIR = ENGINE_DIR / "data" / "cache"

# ── Import indicators ──────────────────────────────────────────────────────────
from indicators.bxt import compute_bxt_consecutive_ll, find_signals, load_bxt_csv
from indicators.rsi import compute_rsi
from indicators.ema import compute_ema, add_ema_columns


# ═══════════════════════════════════════════════════════════════════════════════
# DATA LOADING
# ═══════════════════════════════════════════════════════════════════════════════

def _get_cache_path(ticker: str, timeframe: str) -> Path:
    """
    Get cache path: prefer /tmp (Vercel-safe), fall back to local data dir.
    Cache TTL: 1h for weekly, 1h for daily, 4h for 4h, 24h for monthly.
    """
    return TMP_CACHE_DIR / f"{ticker}-{timeframe}.json"


def _cache_is_fresh(path: Path, ttl_seconds: int) -> bool:
    if not path.exists():
        return False
    age = time.time() - path.stat().st_mtime
    return age < ttl_seconds


def _load_json_cache(cache_path: Path) -> Optional[pd.DataFrame]:
    """
    Load a cached JSON file into a normalized OHLCV DataFrame.

    Handles two formats:
      1. dict-of-dicts keyed by date string (old load_price_data format)
      2. yfinance columnar JSON (from DataFrame.to_json)
    """
    with open(cache_path) as f:
        raw = json.load(f)

    if not isinstance(raw, dict) or len(raw) == 0:
        return None

    first_key = next(iter(raw))
    first_val = raw[first_key]

    # Format 1: date-keyed dict-of-dicts
    if isinstance(first_val, dict) and any(k.lower() in ("open", "close", "high", "low") for k in first_val):
        dates = sorted(raw.keys())
        records = []
        for d in dates:
            r = raw[d]
            records.append({
                "date": pd.Timestamp(d),
                "open":   float(r.get("Open",   r.get("open",   0))),
                "high":   float(r.get("High",   r.get("high",   0))),
                "low":    float(r.get("Low",    r.get("low",    0))),
                "close":  float(r.get("Close",  r.get("close",  0))),
                "volume": float(r.get("Volume", r.get("volume", 0))),
            })
        df = pd.DataFrame(records).reset_index(drop=True)
        return df

    # Format 2: yfinance columnar JSON
    df = pd.read_json(cache_path)
    return _normalize_yf_df(df)


def _normalize_yf_df(data) -> pd.DataFrame:
    """Normalize a yfinance DataFrame to a standard OHLCV DataFrame."""
    if isinstance(data, pd.DataFrame):
        df = data.copy()
    else:
        df = pd.DataFrame(data)

    # Flatten MultiIndex columns
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [c[0] if isinstance(c, tuple) else c for c in df.columns]

    df.columns = [str(c).lower() for c in df.columns]

    # Move index → 'date' column if needed
    if "date" not in df.columns:
        if df.index.name and df.index.name.lower() in ("date", "datetime", "timestamp"):
            df = df.reset_index().rename(columns={df.index.name: "date"})
        else:
            df = df.reset_index().rename(columns={"index": "date"})

    df["date"] = pd.to_datetime(df["date"], utc=True, errors="coerce")
    df["date"] = df["date"].dt.tz_localize(None)
    df = df.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)

    keep = ["date", "open", "high", "low", "close", "volume"]
    for col in keep:
        if col not in df.columns:
            df[col] = 0.0
    df = df[keep].copy()

    for col in ["open", "high", "low", "close", "volume"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    return df


def _fetch_yfinance(ticker: str, period: str = "max", interval: str = "1wk") -> pd.DataFrame:
    """Fetch data from yfinance and return normalized DataFrame."""
    import yfinance as yf
    data = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=True)
    if data.empty:
        raise ValueError(f"yfinance returned no data for {ticker} ({interval})")

    # Flatten MultiIndex if present
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = [c[0] for c in data.columns]

    return _normalize_yf_df(data)


def load_weekly_data(ticker: str) -> pd.DataFrame:
    """
    Fetch weekly OHLCV data via yfinance with 1h cache.
    Used for non-TSLA tickers or when BXT CSV isn't available.
    """
    cache_path = _get_cache_path(ticker, "weekly")

    if _cache_is_fresh(cache_path, 3600):
        try:
            df = _load_json_cache(cache_path)
            if df is not None and len(df) > 0:
                return df
        except Exception:
            pass

    print(f"  📡 Fetching {ticker} weekly data from yfinance…")
    df = _fetch_yfinance(ticker, period="max", interval="1wk")
    df.to_json(cache_path, date_format="iso", orient="records")
    return df


def load_daily_data(ticker: str) -> pd.DataFrame:
    """Fetch daily OHLCV data via yfinance with 1h cache."""
    cache_path = _get_cache_path(ticker, "daily")

    if _cache_is_fresh(cache_path, 3600):
        try:
            df = _load_json_cache(cache_path)
            if df is not None and len(df) > 0:
                return df
        except Exception:
            pass

    print(f"  📡 Fetching {ticker} daily data from yfinance…")
    df = _fetch_yfinance(ticker, period="max", interval="1d")
    df.to_json(cache_path, date_format="iso", orient="records")
    return df


def load_4h_data(ticker: str) -> pd.DataFrame:
    """Fetch 60-day 1h bars aggregated to 4h, with 4h cache."""
    cache_path = _get_cache_path(ticker, "4h")

    if _cache_is_fresh(cache_path, 14400):
        try:
            df = _load_json_cache(cache_path)
            if df is not None and len(df) > 0:
                return df
        except Exception:
            pass

    import yfinance as yf
    print(f"  📡 Fetching {ticker} 1H data from yfinance (60d window)…")
    data = yf.download(ticker, period="60d", interval="1h", progress=False, auto_adjust=True)
    if data.empty:
        raise ValueError(f"yfinance returned no data for {ticker} (1h)")

    if isinstance(data.columns, pd.MultiIndex):
        data.columns = [c[0] for c in data.columns]

    data.columns = [c.lower() for c in data.columns]
    data.index.name = "date"

    data_4h = data.resample("4h").agg({
        "open": "first",
        "high": "max",
        "low": "min",
        "close": "last",
        "volume": "sum",
    }).dropna(subset=["close"])

    data_4h.to_json(cache_path, date_format="iso")
    df = _normalize_yf_df(data_4h)
    return df


def load_monthly_data(ticker: str) -> pd.DataFrame:
    """Build monthly bars from weekly yfinance data, with 24h cache."""
    cache_path = _get_cache_path(ticker, "monthly")

    if _cache_is_fresh(cache_path, 86400):
        try:
            df = _load_json_cache(cache_path)
            if df is not None and len(df) > 0:
                return df
        except Exception:
            pass

    weekly_df = load_weekly_data(ticker)
    weekly_df = weekly_df.set_index("date")

    agg_dict = {
        "open": "first",
        "high": "max",
        "low": "min",
        "close": "last",
    }
    if "volume" in weekly_df.columns:
        agg_dict["volume"] = "sum"
    monthly = weekly_df.resample("ME").agg(agg_dict).dropna(subset=["close"])
    if "volume" not in monthly.columns:
        monthly["volume"] = 0.0

    df = _normalize_yf_df(monthly)
    df.to_json(cache_path, date_format="iso", orient="records")
    return df


# ── Forward period defaults per timeframe ─────────────────────────────────────
TIMEFRAME_PERIODS = {
    "weekly":  [1, 2, 4, 6, 8, 10, 13],
    "daily":   [1, 2, 5, 10, 20, 40, 60],
    "4h":      [1, 2, 3, 5, 10],
    "monthly": [1, 2, 3, 6, 12],
}

TIMEFRAME_PERIOD_LABELS = {
    "weekly":  ["1w", "2w", "4w", "6w", "8w", "10w", "13w"],
    "daily":   ["1d", "2d", "5d", "10d", "20d", "40d", "60d"],
    "4h":      ["1d", "2d", "3d", "5d", "10d"],
    "monthly": ["1m", "2m", "3m", "6m", "12m"],
}


def compute_all_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute ALL standard indicators on any timeframe DataFrame.
    Adds: rsi, bxt, consec_ll, ema_9, ema_13, ema_21, sma_200
    """
    from indicators.rsi import compute_rsi
    from indicators.ema import compute_ema

    df["rsi"] = compute_rsi(df["close"], length=14)

    # BXT = RSI(EMA(close,5) - EMA(close,20), 5) - 50
    ema5  = df["close"].ewm(span=5,  adjust=False).mean()
    ema20 = df["close"].ewm(span=20, adjust=False).mean()
    df["bxt"] = compute_rsi(ema5 - ema20, length=5) - 50

    # BXT consecutive LL
    consec_ll = []
    count = 0
    for i in range(len(df)):
        bxt_val = df["bxt"].iloc[i]
        if i == 0:
            count = 1 if (not pd.isna(bxt_val) and bxt_val <= 0) else 0
            consec_ll.append(count)
            continue
        bxt_prev = df["bxt"].iloc[i - 1]
        if not pd.isna(bxt_val) and not pd.isna(bxt_prev) and bxt_val < 0 and bxt_val < bxt_prev:
            count += 1
        else:
            count = 0
        consec_ll.append(count)
    df["consec_ll"] = consec_ll

    df["ema_9"]  = compute_ema(df["close"], 9)
    df["ema_13"] = compute_ema(df["close"], 13)
    df["ema_21"] = compute_ema(df["close"], 21)
    df["sma_200"] = df["close"].rolling(200, min_periods=1).mean()
    df["weekly_rsi"] = df["rsi"]
    df["bxt_consecutive_ll"] = df["consec_ll"]

    return df


def load_timeframe_data(ticker: str, timeframe: str) -> pd.DataFrame:
    """
    Load OHLCV data for the requested timeframe, compute all indicators.
    Always uses yfinance (no local CSV dependency).
    """
    tf = timeframe.lower()

    if tf == "weekly":
        df = load_weekly_data(ticker)
        df = compute_all_indicators(df)

    elif tf == "daily":
        df = load_daily_data(ticker)
        df = compute_all_indicators(df)

    elif tf == "4h":
        df = load_4h_data(ticker)
        df = compute_all_indicators(df)

    elif tf == "monthly":
        df = load_monthly_data(ticker)
        df = compute_all_indicators(df)

    else:
        raise ValueError(f"Unknown timeframe '{timeframe}'. Use: weekly, daily, 4h, monthly")

    return df


# ═══════════════════════════════════════════════════════════════════════════════
# FORWARD RETURNS
# ═══════════════════════════════════════════════════════════════════════════════

def compute_forward_returns(price_df: pd.DataFrame, signals: list, periods: list) -> dict:
    results = {p: [] for p in periods}

    for sig in signals:
        sig_close = sig["signal_close"]
        sig_date = pd.Timestamp(sig["signal_date"])

        date_diff = (price_df["date"] - sig_date).abs()
        closest_idx = int(date_diff.argmin())

        for p in periods:
            fwd_idx = closest_idx + p
            if fwd_idx >= len(price_df) or not sig.get("completed", True):
                results[p].append({
                    "signal_date": sig["signal_date"],
                    "signal_close": sig_close,
                    "streak_len": sig.get("streak_len", 0),
                    "return_pct": None,
                    "max_upside_pct": None,
                    "max_downside_pct": None,
                    "max_drawdown_pct": None,
                    "completed": False,
                })
                continue

            fwd_close = float(price_df["close"].iloc[fwd_idx])
            ret = (fwd_close - sig_close) / sig_close * 100

            window = price_df.iloc[closest_idx: fwd_idx + 1]
            max_upside = max_downside = None

            if "high" in window.columns:
                max_upside = (float(window["high"].max()) - sig_close) / sig_close * 100
            if "low" in window.columns:
                max_downside = (float(window["low"].min()) - sig_close) / sig_close * 100

            window_close = window["close"].values
            peak = window_close[0]
            max_dd = 0.0
            for c in window_close:
                if c > peak:
                    peak = c
                dd = (c - peak) / peak * 100
                if dd < max_dd:
                    max_dd = dd

            results[p].append({
                "signal_date": sig["signal_date"],
                "signal_close": sig_close,
                "streak_len": sig.get("streak_len", 0),
                "return_pct": round(ret, 2),
                "max_upside_pct": round(max_upside, 2) if max_upside is not None else None,
                "max_downside_pct": round(max_downside, 2) if max_downside is not None else None,
                "max_drawdown_pct": round(max_dd, 2),
                "completed": True,
            })

    return results


def compute_summary(results_by_period: dict) -> dict:
    summary = {}
    for p, returns in results_by_period.items():
        done = [r for r in returns if r.get("completed") and r["return_pct"] is not None]
        n = len(done)
        if n == 0:
            summary[p] = {"n": 0}
            continue

        rets = [r["return_pct"] for r in done]
        wins = [r for r in rets if r > 0]
        upsides = [r["max_upside_pct"] for r in done if r.get("max_upside_pct") is not None]
        downsides = [r["max_downside_pct"] for r in done if r.get("max_downside_pct") is not None]
        drawdowns = [r["max_drawdown_pct"] for r in done if r.get("max_drawdown_pct") is not None]

        summary[p] = {
            "n": n,
            "wins": len(wins),
            "win_rate": round(len(wins) / n, 4),
            "win_rate_pct": f"{len(wins)/n*100:.0f}%",
            "avg_return": round(float(np.mean(rets)), 1),
            "median_return": round(float(np.median(rets)), 1),
            "best": round(float(max(rets)), 1),
            "worst": round(float(min(rets)), 1),
            "avg_max_upside": round(float(np.mean(upsides)), 1) if upsides else None,
            "avg_max_downside": round(float(np.mean(downsides)), 1) if downsides else None,
            "avg_max_drawdown": round(float(np.mean(drawdowns)), 1) if drawdowns else None,
        }
    return summary


# ═══════════════════════════════════════════════════════════════════════════════
# IMPORTABLE API
# ═══════════════════════════════════════════════════════════════════════════════

def run_condition(
    condition: str,
    ticker: str,
    timeframe: str = "weekly",
    forward: list = None,
) -> dict:
    """
    Run an ad-hoc condition string. Returns a dict (JSON-safe).

    Args:
        condition: e.g. "rsi < 35" or "weekly_rsi < 40 AND bxt_consecutive_ll >= 7"
        ticker: e.g. "TSLA"
        timeframe: "weekly" | "daily" | "4h" | "monthly"
        forward: list of int periods (default: auto per timeframe)

    Returns:
        dict with keys: condition, ticker, timeframe, signal_count, completed_count,
                        signals, summary, forward_periods, period_labels
    """
    tf = timeframe.lower()
    periods = forward if forward else TIMEFRAME_PERIODS.get(tf, TIMEFRAME_PERIODS["weekly"])
    period_labels = TIMEFRAME_PERIOD_LABELS.get(tf, [f"{p}w" for p in periods])

    df = load_timeframe_data(ticker, tf)

    col_map = {
        "weekly_rsi":         "df['rsi']",
        "bxt_consecutive_ll": "df['consec_ll']",
        "sma_200":            "df['sma_200']",
        "ema_9":              "df['ema_9']",
        "ema_13":             "df['ema_13']",
        "ema_21":             "df['ema_21']",
        "volume":             "df['volume']",
        "close":              "df['close']",
        "open":               "df['open']",
        "high":               "df['high']",
        "low":                "df['low']",
        "rsi":                "df['rsi']",
        "bxt":                "df['bxt']",
    }

    _sorted_cols = sorted(col_map.keys(), key=len, reverse=True)
    _col_pattern = re.compile(
        r'\b(' + '|'.join(re.escape(c) for c in _sorted_cols) + r')\b'
    )

    def replace_cols(text: str) -> str:
        return _col_pattern.sub(lambda m: col_map[m.group(0)], text)

    tokens = re.split(r'\b(AND|OR)\b', condition, flags=re.IGNORECASE)
    parts = []
    ops = []
    for tok in tokens:
        tok = tok.strip()
        if tok.upper() == 'AND':
            ops.append('&')
        elif tok.upper() == 'OR':
            ops.append('|')
        elif tok:
            parts.append(f"({replace_cols(tok)})")

    py_expr = parts[0]
    for i, op in enumerate(ops):
        py_expr = f"({py_expr} {op} {parts[i+1]})"

    try:
        mask = eval(py_expr)
    except Exception as e:
        return {"error": f"Condition parse error: {e}", "condition": condition}

    matched = df[mask].copy()

    if len(matched) == 0:
        return {
            "condition": condition,
            "ticker": ticker,
            "timeframe": tf,
            "period_labels": period_labels,
            "signal_count": 0,
            "completed_count": 0,
            "signals": [],
            "summary": {},
            "forward_periods": periods,
        }

    recency_days = {
        "weekly": 13 * 7,
        "daily": 60,
        "4h": 30,
        "monthly": 12 * 30,
    }.get(tf, 13 * 7)

    last_date = df["date"].iloc[-1]
    signals = []
    for idx, row in matched.iterrows():
        dt = row["date"]
        is_current = (last_date - dt).days < recency_days
        rsi_val = float(row["rsi"]) if "rsi" in row and not pd.isna(row["rsi"]) else None
        signals.append({
            "signal_date": dt,
            "signal_close": float(row["close"]),
            "streak_len": int(row.get("consec_ll", 0)),
            "signal_idx": idx,
            "rsi": round(rsi_val, 1) if rsi_val is not None else None,
            "completed": not is_current,
        })

    completed_sigs = [s for s in signals if s["completed"]]

    if completed_sigs:
        results_by_period = compute_forward_returns(df, completed_sigs, periods)
        summary = compute_summary(results_by_period)
    else:
        summary = {}

    return {
        "condition": condition,
        "ticker": ticker,
        "timeframe": tf,
        "period_labels": period_labels,
        "signal_count": len(signals),
        "completed_count": len(completed_sigs),
        "signals": [
            {
                **{k: v for k, v in s.items() if k not in ("signal_date", "signal_idx")},
                "signal_date": str(pd.Timestamp(s["signal_date"]).date()),
            }
            for s in signals
        ],
        "summary": summary,
        "forward_periods": periods,
    }


def run_scan(
    scan_name: str,
    ticker: str,
    min_streak: int = 6,
    forward: list = None,
) -> dict:
    """
    Run a named scan. Returns a dict (JSON-safe).

    Currently supported scans:
      - bxt-consecutive-ll

    Args:
        scan_name: scan identifier
        ticker: e.g. "TSLA"
        min_streak: minimum streak for bxt-consecutive-ll (default 6)
        forward: list of int periods (default: weekly defaults)

    Returns:
        dict with scan results
    """
    name = scan_name.lower().strip()
    periods = forward if forward else TIMEFRAME_PERIODS["weekly"]

    if name == "bxt-consecutive-ll":
        return _run_scan_bxt_consecutive_ll(
            ticker=ticker,
            periods=periods,
            min_streak=min_streak,
        )

    return {"error": f"Unknown scan: {scan_name}. Available: bxt-consecutive-ll"}


def _run_scan_bxt_consecutive_ll(
    ticker: str,
    periods: list,
    min_streak: int = 6,
    completed_cutoff_year: int = 2025,
) -> dict:
    """
    Run the BXT Consecutive Lower Lows scan using computed BXT (no CSV needed).
    """
    # Load weekly data and compute indicators via yfinance
    df = load_timeframe_data(ticker, "weekly")

    # find_signals works on any df with consec_ll column
    all_signals = find_signals(df, min_streak=min_streak, include_ongoing=True)

    historical = [
        s for s in all_signals
        if s["completed"] and pd.Timestamp(s["signal_date"]).year < completed_cutoff_year
    ]
    current_fired = [
        s for s in all_signals
        if s["completed"] and pd.Timestamp(s["signal_date"]).year >= completed_cutoff_year
    ]
    ongoing = [s for s in all_signals if not s["completed"]]

    n_completed = len(historical)

    # Forward returns on historical signals
    results_by_period = compute_forward_returns(df, historical, periods)
    summary = compute_summary(results_by_period)

    return {
        "scan": "bxt-consecutive-ll",
        "ticker": ticker,
        "min_streak": min_streak,
        "completed_cutoff_year": completed_cutoff_year,
        "counts": {
            "total": len(all_signals),
            "completed": n_completed,
            "current": len(current_fired),
            "active_streak": len(ongoing),
        },
        "signals": [
            {
                **{k: v for k, v in s.items() if k != "signal_date"},
                "signal_date": str(pd.Timestamp(s["signal_date"]).date()),
            }
            for s in all_signals
        ],
        "summary": summary,
        "forward_periods": periods,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# PERIOD PARSER
# ═══════════════════════════════════════════════════════════════════════════════

def parse_periods(period_str: str) -> list:
    parts = period_str.replace("w", "").replace("d", "").replace("m", "").split(",")
    return sorted([int(p.strip()) for p in parts if p.strip()])


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN CLI (unchanged interface)
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Flacko AI Backtest Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--scan", type=str)
    parser.add_argument("--condition", type=str)
    parser.add_argument("--ticker", type=str, default="TSLA")
    parser.add_argument("--forward", type=str, default=None)
    parser.add_argument("--timeframe", "--tf", dest="timeframe", type=str, default="weekly",
                        choices=["weekly", "daily", "4h", "monthly"])
    parser.add_argument("--chart", action="store_true")
    parser.add_argument("--min-streak", type=int, default=6)
    parser.add_argument("--json", action="store_true")

    args = parser.parse_args()
    tickers = [t.strip().upper() for t in args.ticker.split(",")]
    tf = args.timeframe.lower()

    if args.forward is not None:
        periods = parse_periods(args.forward)
    else:
        periods = TIMEFRAME_PERIODS.get(tf, TIMEFRAME_PERIODS["weekly"])

    all_results = {}

    for ticker in tickers:
        if args.scan:
            result = run_scan(
                scan_name=args.scan,
                ticker=ticker,
                min_streak=args.min_streak,
                forward=periods,
            )
            all_results[ticker] = result

        elif args.condition:
            result = run_condition(
                condition=args.condition,
                ticker=ticker,
                timeframe=tf,
                forward=periods,
            )
            all_results[ticker] = result

        else:
            parser.print_help()
            print("\n❌ Error: specify --scan or --condition")
            sys.exit(1)

    if args.json:
        print("\n" + json.dumps(all_results, indent=2, default=str))
    else:
        # Print summary
        for t, result in all_results.items():
            print(f"\n{t}: {result.get('signal_count', result.get('counts', {}).get('total', '?'))} signals")
            if "summary" in result:
                for p, s in sorted(result["summary"].items()):
                    if s.get("n", 0) > 0:
                        print(f"  {p}p: {s['win_rate_pct']} ({s['wins']}/{s['n']}) avg {s['avg_return']:+.1f}%")


if __name__ == "__main__":
    main()
