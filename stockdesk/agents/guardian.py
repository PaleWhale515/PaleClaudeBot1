"""GUARDIAN — the crypto desk's RUG agent, minus the auto-dump.

The crypto version watches a dev wallet and liquidates automatically the
instant liquidity moves. This tool never places orders, so GUARDIAN's job
is narrower: surface halts, downgrades, going-concern language, and
delisting notices so a human can decide whether to exit — on both new
candidates and anything already held.
"""

from __future__ import annotations

from stockdesk.agents.base import Agent
from stockdesk.models import Setup


class GuardianAgent(Agent):
    name = "GUARDIAN"

    def run(self, setup: Setup) -> Setup:
        events = self.data.get_risk_events(setup.ticker)
        setup.guardian_events = events

        for event in events:
            setup.notes.append(f"GUARDIAN: {event.kind} ({event.severity}) — {event.description}")
            if event.severity == "high":
                setup.disqualified = True
                setup.disqualify_reason = f"guardian: {event.kind}"

        return setup
