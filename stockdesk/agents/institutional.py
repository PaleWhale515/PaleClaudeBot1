"""INSTITUTIONAL — the crypto desk's WHALE, run on public filings only.

There's no on-chain wallet graph for stocks. What's public and legal to use
is 13F institutional-ownership deltas and Form 4 insider transactions,
both filed with the SEC — this reads those, it doesn't infer anything
non-public.
"""

from __future__ import annotations

from stockdesk.agents.base import Agent
from stockdesk.models import Setup


class InstitutionalAgent(Agent):
    name = "INSTITUTIONAL"

    def run(self, setup: Setup) -> Setup:
        activity = self.data.get_institutional_activity(setup.ticker)
        setup.institutional = activity

        score = 0.5
        if activity.net_institutional_change_pct > 0:
            score += 0.2
            setup.notes.append(
                f"institutional ownership +{activity.net_institutional_change_pct:.1f}% QoQ"
            )
        else:
            score -= 0.1
            setup.notes.append(
                f"institutional ownership {activity.net_institutional_change_pct:.1f}% QoQ"
            )

        net_insider = activity.insider_buys_90d - activity.insider_sells_90d
        if net_insider > 0:
            score += 0.2
            setup.notes.append(f"insiders net buyers over 90d ({activity.insider_buys_90d}b/{activity.insider_sells_90d}s)")
        elif net_insider < 0:
            score -= 0.1
            setup.notes.append(f"insiders net sellers over 90d ({activity.insider_buys_90d}b/{activity.insider_sells_90d}s)")

        setup.institutional_score = max(0.0, min(score, 1.0))
        setup.notes.append(f"INSTITUTIONAL score {setup.institutional_score:.2f}")
        return setup
