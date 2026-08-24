"""Runs the desk once: SEARCH -> RISK -> TIMING -> INSTITUTIONAL ->
SENTIMENT -> GUARDIAN -> HEAD_OF_DESK, plus EXIT on any open positions.

Equivalent to running the crypto desk's morning cycle, except every stage
here stops at a recommendation — nothing places an order.
"""

from __future__ import annotations

from stockdesk.agents import (
    ExitAgent,
    GuardianAgent,
    HeadOfDeskAgent,
    InstitutionalAgent,
    RiskAgent,
    SearchAgent,
    SentimentAgent,
    TimingAgent,
)
from stockdesk.config import DeskConfig
from stockdesk.data.base import MarketDataProvider
from stockdesk.models import DailyDeskReport


def run_desk(data: MarketDataProvider, config: DeskConfig | None = None) -> DailyDeskReport:
    config = config or DeskConfig()

    search = SearchAgent(data, config)
    risk = RiskAgent(data, config)
    timing = TimingAgent(data, config)
    institutional = InstitutionalAgent(data, config)
    sentiment = SentimentAgent(data, config)
    guardian = GuardianAgent(data, config)
    exit_agent = ExitAgent(data, config)
    head_of_desk = HeadOfDeskAgent(data, config)

    setups = search.run()
    processed = []
    for setup in setups:
        setup = risk.run(setup)
        if setup.disqualified:
            processed.append(setup)
            continue
        setup = timing.run(setup)
        setup = institutional.run(setup)
        setup = sentiment.run(setup)
        setup = guardian.run(setup)
        processed.append(setup)

    exit_plans = exit_agent.run()

    return head_of_desk.run(processed, exit_plans)
