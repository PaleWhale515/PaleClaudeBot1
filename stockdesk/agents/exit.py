"""EXIT — trailing-stop and scale-out suggestions for positions you already
hold. Also runs GUARDIAN's risk-event check against each holding, since a
guardian trigger matters most on a position you're actually in.
"""

from __future__ import annotations

from stockdesk.agents.base import Agent
from stockdesk.models import ExitPlan


class ExitAgent(Agent):
    name = "EXIT"

    def run(self) -> list[ExitPlan]:
        plans = []
        for position in self.data.get_open_positions():
            market = self.data.get_market_snapshot(position.ticker)
            events = self.data.get_risk_events(position.ticker)

            unrealized_pct = (market.price - position.entry_price) / position.entry_price * 100
            stop = market.price - market.atr_14 * self.config.stop_atr_multiple
            # Never trail the stop below break-even once a position is up 2R+.
            risk_per_share = market.atr_14 * self.config.stop_atr_multiple
            if risk_per_share > 0 and (market.price - position.entry_price) / risk_per_share >= 2:
                stop = max(stop, position.entry_price)

            scale_out = [
                (round(position.entry_price + market.atr_14 * 2, 2), "trim 1/3 at +2 ATR"),
                (round(position.entry_price + market.atr_14 * 4, 2), "trim 1/3 at +4 ATR"),
            ]

            plans.append(
                ExitPlan(
                    ticker=position.ticker,
                    entry_price=position.entry_price,
                    current_price=market.price,
                    unrealized_pct=round(unrealized_pct, 2),
                    stop_price=round(stop, 2),
                    scale_out_levels=scale_out,
                    guardian_events=events,
                )
            )
        return plans
