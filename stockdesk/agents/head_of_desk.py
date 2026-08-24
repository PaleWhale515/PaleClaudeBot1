"""HEAD_OF_DESK — never scans, never scores a ticker itself, never trades.

Aggregates what SEARCH/RISK/TIMING/INSTITUTIONAL/SENTIMENT/GUARDIAN found,
computes each qualified setup's composite score, and — this is the part
worth keeping from the tweet's framing — surfaces the smallest possible
list of things that actually need a human to look at, instead of a wall of
data. It does not decide anything on its own.
"""

from __future__ import annotations

from datetime import date

from stockdesk.agents.base import Agent
from stockdesk.models import DailyDeskReport, ExitPlan, Setup

DISCLAIMER = (
    "Research and screening output only. Nothing here is investment advice "
    "and no agent in this pipeline is authorized to place an order. Every "
    "figure is derived from public data (or, in the default MockDataProvider, "
    "synthetic sample data) — verify independently before acting. Past "
    "screening criteria matching does not predict future returns."
)


class HeadOfDeskAgent(Agent):
    name = "HEAD_OF_DESK"

    def run(self, setups: list[Setup], exit_plans: list[ExitPlan]) -> DailyDeskReport:
        cfg = self.config
        scanned = len(self.data.get_universe())
        found = len(setups)

        qualified = [s for s in setups if not s.disqualified]
        for s in qualified:
            timing_score = (s.timing or {}).get("score", 0.5)
            risk_component = 1.0 - s.risk_score
            s.composite_score = round(
                timing_score * cfg.weight_timing
                + s.institutional_score * cfg.weight_institutional
                + s.sentiment_score * cfg.weight_sentiment
                + risk_component * cfg.weight_risk,
                3,
            )

        qualified.sort(key=lambda s: s.composite_score, reverse=True)
        top = qualified[: cfg.max_top_setups]

        needs_review = []
        for s in top:
            if s.composite_score >= cfg.review_score_threshold:
                needs_review.append(
                    f"{s.ticker}: composite {s.composite_score:.2f} clears the review "
                    f"threshold — confirm entry band {s.timing['entry_low']}-{s.timing['entry_high']} "
                    f"and stop {s.timing['suggested_stop']} before placing anything manually."
                )
            bullish_timing = (s.timing or {}).get("score", 0.5) >= 0.6
            bearish_sentiment = s.sentiment_score < 0.4
            if bullish_timing and bearish_sentiment:
                needs_review.append(
                    f"{s.ticker}: technical setup is bullish but news sentiment is negative — "
                    "conflicting signal, worth a manual read of the headlines before acting."
                )

        for plan in exit_plans:
            high_severity = [e for e in plan.guardian_events if e.severity == "high"]
            if high_severity:
                needs_review.append(
                    f"{plan.ticker}: held position has a high-severity guardian event "
                    f"({high_severity[0].kind}) — review for an early exit."
                )

        return DailyDeskReport(
            run_date=date.today(),
            universe_scanned=scanned,
            candidates_found=found,
            candidates_qualified=len(qualified),
            top_setups=top,
            exit_plans=exit_plans,
            needs_human_review=needs_review,
            disclaimer=DISCLAIMER,
        )
