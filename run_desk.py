#!/usr/bin/env python3
"""CLI entry point: run the stock desk once against sample data and print
the report. See README.md before wiring this to a real broker/data feed."""

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
    args = parser.parse_args()

    data = MockDataProvider(universe=args.universe)
    report = run_desk(data, DeskConfig())
    print(render_text(report))


if __name__ == "__main__":
    main()
