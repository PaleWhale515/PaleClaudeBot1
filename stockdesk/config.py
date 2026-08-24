"""Thresholds the desk uses. Tune these instead of editing agent logic."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class DeskConfig:
    # SEARCH: a ticker must clear at least one of these to become a candidate.
    min_rel_volume: float = 1.5
    near_52w_high_pct: float = 5.0   # within X% of 52w high
    near_52w_low_pct: float = 5.0    # within X% of 52w low (mean-reversion watch)

    # RISK
    min_market_cap: float = 300_000_000
    max_short_interest_pct: float = 25.0
    earnings_blackout_days: int = 2   # disqualify if earnings within this many days
    max_beta: float = 3.0

    # TIMING
    stop_atr_multiple: float = 1.5
    entry_band_atr_multiple: float = 0.5

    # INSTITUTIONAL / SENTIMENT scoring weights (composite score inputs)
    weight_timing: float = 0.35
    weight_institutional: float = 0.20
    weight_sentiment: float = 0.20
    weight_risk: float = 0.25

    # HEAD_OF_DESK
    review_score_threshold: float = 0.65
    max_top_setups: int = 5
