"""RISK — public-data due diligence, not a contract audit.

Crypto's RISK agent reads mint functions and LP locks; there's no stock
equivalent of a rug pull, so this checks the things that actually blow up a
stock position: an earnings print landing inside the hold window, thin
market cap, high short interest (squeeze/volatility risk), and beta.
"""

from __future__ import annotations

from datetime import date

from stockdesk.agents.base import Agent
from stockdesk.models import Setup


class RiskAgent(Agent):
    name = "RISK"

    def run(self, setup: Setup) -> Setup:
        fundamentals = self.data.get_fundamentals(setup.ticker)
        setup.fundamentals = fundamentals
        cfg = self.config
        score = 0.0
        flags = []

        if fundamentals.market_cap < cfg.min_market_cap:
            flags.append(f"market cap ${fundamentals.market_cap/1e6:.0f}M below floor")
            score += 0.4

        if fundamentals.short_interest_pct > cfg.max_short_interest_pct:
            flags.append(f"short interest {fundamentals.short_interest_pct:.1f}% — squeeze/volatility risk")
            score += 0.2

        if fundamentals.beta > cfg.max_beta:
            flags.append(f"beta {fundamentals.beta:.2f} above tolerance")
            score += 0.15

        if fundamentals.next_earnings_date is not None:
            days_out = (fundamentals.next_earnings_date - date.today()).days
            if 0 <= days_out <= cfg.earnings_blackout_days:
                flags.append(f"earnings in {days_out}d — inside blackout window")
                setup.disqualified = True
                setup.disqualify_reason = "earnings blackout"
                score += 0.5

        setup.risk_flags = flags
        setup.risk_score = min(score, 1.0)
        return setup
