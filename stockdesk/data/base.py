"""Interface every data provider must implement.

Swap MockDataProvider for a real one (Alpaca/yfinance for prices, SEC EDGAR
for 13F/Form 4 filings, a news API for headlines) without touching any
agent code — agents only depend on this interface.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from stockdesk.models import (
    FundamentalSnapshot,
    InstitutionalActivity,
    MarketSnapshot,
    NewsSentiment,
    Position,
    RiskEvent,
)


class MarketDataProvider(ABC):
    @abstractmethod
    def get_universe(self) -> list[str]:
        """Tickers the SEARCH agent is allowed to scan."""

    @abstractmethod
    def get_market_snapshot(self, ticker: str) -> MarketSnapshot:
        ...

    @abstractmethod
    def get_fundamentals(self, ticker: str) -> FundamentalSnapshot:
        ...

    @abstractmethod
    def get_institutional_activity(self, ticker: str) -> InstitutionalActivity:
        ...

    @abstractmethod
    def get_news_sentiment(self, ticker: str) -> NewsSentiment:
        ...

    @abstractmethod
    def get_risk_events(self, ticker: str) -> list[RiskEvent]:
        ...

    @abstractmethod
    def get_open_positions(self) -> list[Position]:
        """Positions currently held (from your brokerage or a local ledger)."""
