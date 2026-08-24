#!/usr/bin/env python3
"""Debug tool: pulls real yfinance data for one ticker and runs it through
every agent unconditionally, bypassing SEARCH's screening gate. Useful for
checking that the live-data path actually works end to end, independent of
whether a given ticker happens to clear today's screening thresholds.

Usage: py diagnose.py AAPL
"""

from __future__ import annotations

import sys

from stockdesk.agents import GuardianAgent, InstitutionalAgent, RiskAgent, SentimentAgent, TimingAgent
from stockdesk.config import DeskConfig
from stockdesk.data.yfinance_provider import YFinanceDataProvider
from stockdesk.models import Setup


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: py diagnose.py TICKER")
        sys.exit(1)
    ticker = sys.argv[1].upper()

    cfg = DeskConfig()
    data = YFinanceDataProvider(universe=[ticker])

    market = data.get_market_snapshot(ticker)
    print("MARKET SNAPSHOT")
    print(f"  price={market.price} prior_close={market.prior_close} pct_change={market.pct_change:.2f}%")
    print(f"  volume={market.volume} avg_volume_20d={market.avg_volume_20d} rel_volume={market.rel_volume:.2f}x")
    print(f"  52w range: {market.low_52w} - {market.high_52w}")
    print(f"  sma_20={market.sma_20} sma_50={market.sma_50} rsi_14={market.rsi_14} atr_14={market.atr_14}")
    dist_high = (market.high_52w - market.price) / market.high_52w * 100 if market.high_52w else None
    dist_low = (market.price - market.low_52w) / market.low_52w * 100 if market.low_52w else None
    print(f"  distance from 52w high: {dist_high:.2f}%  |  distance from 52w low: {dist_low:.2f}%")
    print(f"  (SEARCH thresholds: rel_volume>={cfg.min_rel_volume}, "
          f"near_high<={cfg.near_52w_high_pct}%, near_low<={cfg.near_52w_low_pct}%)")

    setup = Setup(ticker=ticker, market=market)

    setup = RiskAgent(data, cfg).run(setup)
    print("\nRISK")
    print(f"  fundamentals={setup.fundamentals}")
    print(f"  flags={setup.risk_flags} score={setup.risk_score} disqualified={setup.disqualified} reason={setup.disqualify_reason}")

    setup = TimingAgent(data, cfg).run(setup)
    print("\nTIMING")
    print(f"  {setup.timing}")

    setup = InstitutionalAgent(data, cfg).run(setup)
    print("\nINSTITUTIONAL")
    print(f"  {setup.institutional} score={setup.institutional_score}")

    setup = SentimentAgent(data, cfg).run(setup)
    print("\nSENTIMENT")
    print(f"  {setup.sentiment} score={setup.sentiment_score}")

    setup = GuardianAgent(data, cfg).run(setup)
    print("\nGUARDIAN")
    print(f"  events={setup.guardian_events}")


if __name__ == "__main__":
    main()
