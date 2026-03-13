"""
Vercel Python Serverless Function — Flacko AI Backtest Engine
=============================================================
Endpoint: POST /api/backtest

Body JSON:
  { "condition": "rsi < 35", "ticker": "TSLA", "timeframe": "weekly" }
  { "scan": "bxt-consecutive-ll", "ticker": "TSLA", "minStreak": 6 }

Response JSON:
  { "result": { ... } }   on success
  { "error": "..." }      on failure
"""

import sys
import os
from pathlib import Path

# Add this directory to sys.path so `engine` and `indicators` are importable
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

from http.server import BaseHTTPRequestHandler
import json


class handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress default HTTP access logging (noisy in Vercel logs)
        pass

    def _send_json(self, status: int, data: dict):
        body = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length))
        except Exception as e:
            self._send_json(400, {"error": f"Invalid JSON body: {e}"})
            return

        condition = body.get("condition")
        scan = body.get("scan")
        ticker = body.get("ticker", "TSLA").upper()
        timeframe = body.get("timeframe", "weekly")
        min_streak = int(body.get("minStreak", 6))
        forward_raw = body.get("forward")  # list of ints or None

        if not condition and not scan:
            self._send_json(400, {"error": "Must provide either 'condition' or 'scan'"})
            return

        # Parse forward periods if provided
        forward = None
        if forward_raw:
            try:
                forward = [int(p) for p in forward_raw]
            except (TypeError, ValueError):
                forward = None

        try:
            from engine import run_condition, run_scan

            if scan:
                result = run_scan(
                    scan_name=scan,
                    ticker=ticker,
                    min_streak=min_streak,
                    forward=forward,
                )
            else:
                result = run_condition(
                    condition=condition,
                    ticker=ticker,
                    timeframe=timeframe,
                    forward=forward,
                )

            # Wrap in ticker key for frontend compatibility
            # Frontend expects: data.result[ticker] = { signals, summary, ... }
            self._send_json(200, {"result": {ticker: result}})

        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            self._send_json(500, {"error": str(e), "traceback": tb})
