"""Shared data structures passed between desk agents."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Optional


@dataclass
class MarketSnapshot:
    """A single point-in-time read of price/volume/technicals for a ticker."""

    ticker: str
    price: float
    prior_close: float
    volume: int
    avg_volume_20d: int
    high_52w: float
    low_52w: float
    sma_20: float
    sma_50: float
    rsi_14: float
    atr_14: float

    @property
    def pct_change(self) -> float:
        if self.prior_close == 0:
            return 0.0
        return (self.price - self.prior_close) / self.prior_close * 100

    @property
    def rel_volume(self) -> float:
        if self.avg_volume_20d == 0:
            return 0.0
        return self.volume / self.avg_volume_20d


@dataclass
class FundamentalSnapshot:
    ticker: str
    market_cap: float
    sector: str
    next_earnings_date: Optional[date]
    short_interest_pct: float
    beta: float


@dataclass
class InstitutionalActivity:
    """Derived from public 13F (institutional) and Form 4 (insider) filings."""

    ticker: str
    net_institutional_change_pct: float
    insider_buys_90d: int
    insider_sells_90d: int


@dataclass
class NewsSentiment:
    ticker: str
    sentiment_score: float  # -1 (bearish) .. +1 (bullish)
    mention_volume_change_pct: float
    headlines: list[str] = field(default_factory=list)


@dataclass
class RiskEvent:
    ticker: str
    kind: str  # halt | downgrade | going_concern | delisting_notice | guidance_cut
    description: str
    severity: str  # low | medium | high


@dataclass
class Position:
    ticker: str
    shares: float
    entry_price: float
    entry_date: date


@dataclass
class Setup:
    """A candidate ticker as it moves through the desk pipeline, accumulating
    each agent's findings. Nothing in here is an order — it's a research
    record that a human reviews before any trade is placed."""

    ticker: str
    market: MarketSnapshot
    fundamentals: Optional[FundamentalSnapshot] = None
    risk_flags: list[str] = field(default_factory=list)
    risk_score: float = 0.0
    disqualified: bool = False
    disqualify_reason: Optional[str] = None
    timing: Optional[dict] = None
    institutional: Optional[InstitutionalActivity] = None
    institutional_score: float = 0.0
    sentiment: Optional[NewsSentiment] = None
    sentiment_score: float = 0.0
    guardian_events: list[RiskEvent] = field(default_factory=list)
    composite_score: float = 0.0
    notes: list[str] = field(default_factory=list)


@dataclass
class ExitPlan:
    ticker: str
    entry_price: float
    current_price: float
    unrealized_pct: float
    stop_price: float
    scale_out_levels: list[tuple[float, str]]  # (price, description)
    guardian_events: list[RiskEvent] = field(default_factory=list)


@dataclass
class DailyDeskReport:
    run_date: date
    universe_scanned: int
    candidates_found: int
    candidates_qualified: int
    top_setups: list[Setup]
    exit_plans: list[ExitPlan]
    needs_human_review: list[str]
    disclaimer: str
