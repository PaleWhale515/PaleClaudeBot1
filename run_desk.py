#!/usr/bin/env python3
"""CLI entry point: run the stock desk and print the report.

--provider mock (default) needs nothing. --provider yfinance pulls real
market data via yfinance — see README.md for what that provider can and
can't give you before trusting its output.
"""

from __future__ import annotations

import argparse

from stockdesk.config import DeskConfig
from stockdesk.data.mock import SAMPLE_UNIVERSE, MockDataProvider
from stockdesk.orchestrator import run_desk
from stockdesk.report import render_text


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the stock research desk once.")
    parser.add_argument(
        "--universe", nargs="*", default=SAMPLE_UNIVERSE,
        help="Tickers to scan (default: built-in sample list).",
    )
    parser.add_argument(
        "--provider", choices=["mock", "yfinance"], default="mock",
        help="Data source: 'mock' (deterministic sample data) or 'yfinance' (real market data).",
    )
    parser.add_argument(
        "--positions-file", default=None,
        help="JSON ledger of open positions for the EXIT agent (yfinance provider only). "
             "Format: [{\"ticker\": \"AAPL\", \"shares\": 10, \"entry_price\": 180.0, \"entry_date\": \"2026-01-15\"}]",
    )
    args = parser.parse_args()

    if args.provider == "yfinance":
        from stockdesk.data.yfinance_provider import YFinanceDataProvider
        data = YFinanceDataProvider(universe=args.universe, positions_file=args.positions_file)
    else:
        data = MockDataProvider(universe=args.universe)

    report = run_desk(data, DeskConfig())
    print(render_text(report))


if __name__ == "__main__":
    main()
