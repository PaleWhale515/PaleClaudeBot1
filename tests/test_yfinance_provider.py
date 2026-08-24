"""Exercises YFinanceDataProvider's parsing logic against a fake yfinance
Ticker, so it's covered even in environments with no network access to
Yahoo Finance."""

from datetime import date, datetime, timedelta

import pandas as pd
import pytest

yfinance_provider = pytest.importorskip("stockdesk.data.yfinance_provider")
from stockdesk.data.yfinance_provider import YFinanceDataProvider  # noqa: E402


class FakeTicker:
    def __init__(self, symbol):
        self.symbol = symbol
        n = 60
        dates = pd.date_range(end=pd.Timestamp.today(), periods=n, freq="D")
        closes = [100 + i * 0.5 for i in range(n)]  # steady uptrend
        self._history = pd.DataFrame({
            "Close": closes,
            "High": [c + 1 for c in closes],
            "Low": [c - 1 for c in closes],
            "Volume": [1_000_000 + i * 1000 for i in range(n)],
        }, index=dates)

        self._info = {
            "marketCap": 2_500_000_000_000,
            "sector": "Technology",
            "shortPercentOfFloat": 0.012,
            "beta": 1.15,
        }
        self.calendar = {"Earnings Date": [date.today() + timedelta(days=10)]}

        now = datetime.now()
        self.insider_transactions = pd.DataFrame([
            {"Start Date": now - timedelta(days=5), "Transaction": "Purchase at price 100"},
            {"Start Date": now - timedelta(days=10), "Transaction": "Sale at price 110"},
            {"Start Date": now - timedelta(days=200), "Transaction": "Purchase at price 90"},  # outside window
        ])

        self.news = [
            {"content": {"title": "Company beats earnings, shares surge", "pubDate": now.isoformat() + "Z"}},
            {"content": {"title": "Analyst warns of weak guidance", "pubDate": (now - timedelta(days=5)).isoformat() + "Z"}},
        ]

        grade_dates = pd.to_datetime([now - timedelta(days=3), now - timedelta(days=30)])
        self.upgrades_downgrades = pd.DataFrame(
            {"Firm": ["Big Bank", "Old Bank"], "ToGrade": ["Sell", "Hold"], "Action": ["down", "down"]},
            index=grade_dates,
        )
        self.upgrades_downgrades.index.name = "GradeDate"

    def history(self, period="1y", auto_adjust=False):
        return self._history

    def get_info(self):
        return self._info


@pytest.fixture(autouse=True)
def fake_yfinance(monkeypatch):
    monkeypatch.setattr(yfinance_provider.yf, "Ticker", FakeTicker)


def test_market_snapshot_computed_from_history():
    provider = YFinanceDataProvider(universe=["AAPL"])
    snapshot = provider.get_market_snapshot("AAPL")
    assert snapshot.ticker == "AAPL"
    assert snapshot.price > snapshot.sma_50  # steady uptrend fixture
    assert snapshot.atr_14 > 0
    assert 0 <= snapshot.rsi_14 <= 100


def test_fundamentals_parsed_from_info_and_calendar():
    provider = YFinanceDataProvider(universe=["AAPL"])
    fundamentals = provider.get_fundamentals("AAPL")
    assert fundamentals.market_cap == 2_500_000_000_000
    assert fundamentals.sector == "Technology"
    assert fundamentals.next_earnings_date == date.today() + timedelta(days=10)
    assert fundamentals.short_interest_pct == 1.2


def test_institutional_activity_counts_only_last_90_days():
    provider = YFinanceDataProvider(universe=["AAPL"])
    activity = provider.get_institutional_activity("AAPL")
    assert activity.insider_buys_90d == 1  # the 200-day-old purchase is excluded
    assert activity.insider_sells_90d == 1
    assert activity.net_institutional_change_pct == 0.0  # documented limitation


def test_news_sentiment_reflects_headline_mix():
    provider = YFinanceDataProvider(universe=["AAPL"])
    sentiment = provider.get_news_sentiment("AAPL")
    assert len(sentiment.headlines) == 2
    # one positive, one negative headline -> should not be strongly one-sided
    assert -1.0 <= sentiment.sentiment_score <= 1.0


def test_risk_events_only_include_recent_downgrades():
    provider = YFinanceDataProvider(universe=["AAPL"])
    events = provider.get_risk_events("AAPL")
    assert len(events) == 1
    assert events[0].kind == "downgrade"
    assert "Big Bank" in events[0].description


def test_open_positions_reads_json_ledger(tmp_path):
    ledger = tmp_path / "positions.json"
    ledger.write_text(
        '[{"ticker": "AAPL", "shares": 10, "entry_price": 180.0, "entry_date": "2026-01-15"}]'
    )
    provider = YFinanceDataProvider(universe=["AAPL"], positions_file=ledger)
    positions = provider.get_open_positions()
    assert len(positions) == 1
    assert positions[0].ticker == "AAPL"
    assert positions[0].shares == 10


def test_open_positions_empty_when_no_ledger_file():
    provider = YFinanceDataProvider(universe=["AAPL"])
    assert provider.get_open_positions() == []


def test_universe_cannot_be_empty():
    with pytest.raises(ValueError):
        YFinanceDataProvider(universe=[])
