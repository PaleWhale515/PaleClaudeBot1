"""SEARCH — screens the universe for tickers worth a closer look.

Public-data equivalent of the crypto desk's "scrape alpha before CT finds
it": here that's just relative volume and proximity to 52-week range
extremes, computed from ordinary market data. No non-public information.
"""

from __future__ import annotations

from stockdesk.agents.base import Agent
from stockdesk.models import Setup


class SearchAgent(Agent):
    name = "SEARCH"

    def run(self) -> list[Setup]:
        candidates: list[Setup] = []
        for ticker in self.data.get_universe():
            market = self.data.get_market_snapshot(ticker)
            reasons = []

            if market.rel_volume >= self.config.min_rel_volume:
                reasons.append(f"relative volume {market.rel_volume:.1f}x 20d avg")

            if market.high_52w > 0:
                dist_from_high = (market.high_52w - market.price) / market.high_52w * 100
                if dist_from_high <= self.config.near_52w_high_pct:
                    reasons.append(f"within {dist_from_high:.1f}% of 52w high")

            if market.low_52w > 0:
                dist_from_low = (market.price - market.low_52w) / market.low_52w * 100
                if dist_from_low <= self.config.near_52w_low_pct:
                    reasons.append(f"within {dist_from_low:.1f}% of 52w low")

            if reasons:
                candidates.append(Setup(ticker=ticker, market=market, notes=reasons))

        return candidates
