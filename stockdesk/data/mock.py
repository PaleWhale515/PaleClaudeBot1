"""Deterministic sample data so the desk pipeline can be run and tested
end-to-end with no API keys. Replace with a real MarketDataProvider before
relying on this for anything.
"""

from __future__ import annotations

import hashlib
import random
from datetime import date, timedelta

from stockdesk.data.base import MarketDataProvider
from stockdesk.models import (
    FundamentalSnapshot,
    InstitutionalActivity,
    MarketSnapshot,
    NewsSentiment,
    Position,
    RiskEvent,
)

SAMPLE_UNIVERSE = [
    "AAPL", "MSFT", "NVDA", "AMD", "TSLA", "GOOGL", "AMZN", "META",
    "CRM", "SHOP", "PLTR", "SNOW", "UBER", "ABNB", "COIN", "SOFI",
]

_SECTORS = ["Technology", "Consumer Discretionary", "Communication Services",
            "Financials", "Industrials", "Healthcare"]


def _rng_for(ticker: str, salt: str) -> random.Random:
    seed = int(hashlib.sha256(f"{ticker}:{salt}".encode()).hexdigest(), 16) % (2**32)
    return random.Random(seed)


class MockDataProvider(MarketDataProvider):
    def __init__(self, universe: list[str] | None = None, as_of: date | None = None):
        self.universe = universe or SAMPLE_UNIVERSE
        self.as_of = as_of or date.today()

    def get_universe(self) -> list[str]:
        return list(self.universe)

    def get_market_snapshot(self, ticker: str) -> MarketSnapshot:
        rng = _rng_for(ticker, "market")
        base_price = rng.uniform(15, 450)
        prior_close = base_price * rng.uniform(0.95, 1.0)
        price = prior_close * rng.uniform(0.93, 1.09)
        avg_volume = rng.randint(500_000, 20_000_000)
        volume = int(avg_volume * rng.uniform(0.4, 3.2))
        sma_20 = price * rng.uniform(0.92, 1.05)
        sma_50 = sma_20 * rng.uniform(0.9, 1.08)
        atr = price * rng.uniform(0.015, 0.06)
        return MarketSnapshot(
            ticker=ticker,
            price=round(price, 2),
            prior_close=round(prior_close, 2),
            volume=volume,
            avg_volume_20d=avg_volume,
            high_52w=round(price * rng.uniform(1.02, 1.6), 2),
            low_52w=round(price * rng.uniform(0.5, 0.95), 2),
            sma_20=round(sma_20, 2),
            sma_50=round(sma_50, 2),
            rsi_14=round(rng.uniform(20, 85), 1),
            atr_14=round(atr, 2),
        )

    def get_fundamentals(self, ticker: str) -> FundamentalSnapshot:
        rng = _rng_for(ticker, "fundamentals")
        days_to_earnings = rng.randint(-5, 60)
        return FundamentalSnapshot(
            ticker=ticker,
            market_cap=round(rng.uniform(0.3e9, 900e9), -6),
            sector=rng.choice(_SECTORS),
            next_earnings_date=self.as_of + timedelta(days=days_to_earnings)
            if days_to_earnings >= 0 else None,
            short_interest_pct=round(rng.uniform(0.5, 22), 1),
            beta=round(rng.uniform(0.6, 2.4), 2),
        )

    def get_institutional_activity(self, ticker: str) -> InstitutionalActivity:
        rng = _rng_for(ticker, "institutional")
        return InstitutionalActivity(
            ticker=ticker,
            net_institutional_change_pct=round(rng.uniform(-8, 8), 2),
            insider_buys_90d=rng.randint(0, 4),
            insider_sells_90d=rng.randint(0, 6),
        )

    def get_news_sentiment(self, ticker: str) -> NewsSentiment:
        rng = _rng_for(ticker, "sentiment")
        score = round(rng.uniform(-1, 1), 2)
        headlines = [
            f"{ticker} analyst note: {rng.choice(['upgrade', 'downgrade', 'reiterate', 'coverage initiated'])}",
            f"{ticker} mentioned in sector roundup",
        ]
        return NewsSentiment(
            ticker=ticker,
            sentiment_score=score,
            mention_volume_change_pct=round(rng.uniform(-40, 120), 1),
            headlines=headlines,
        )

    def get_risk_events(self, ticker: str) -> list[RiskEvent]:
        rng = _rng_for(ticker, "risk_events")
        events: list[RiskEvent] = []
        if rng.random() < 0.08:
            events.append(RiskEvent(
                ticker=ticker, kind="downgrade",
                description="Sell-side downgrade on valuation concerns",
                severity="medium",
            ))
        if rng.random() < 0.03:
            events.append(RiskEvent(
                ticker=ticker, kind="halt",
                description="Trading halted pending news",
                severity="high",
            ))
        return events

    def get_open_positions(self) -> list[Position]:
        # Empty by default; a real provider would read this from a
        # brokerage account or a local ledger file.
        return []
