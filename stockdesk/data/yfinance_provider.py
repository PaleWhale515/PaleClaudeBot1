"""Real-data MarketDataProvider backed by yfinance (unofficial Yahoo
Finance client). Free, no API key, but best-effort: Yahoo's schema shifts
between yfinance versions and some fields are missing for some tickers, so
every lookup here degrades to a documented default instead of crashing the
whole pipeline over one bad ticker.

Known gaps vs. the interface (be aware of these before trusting the output):
  * Institutional ownership CHANGE (`net_institutional_change_pct`) isn't
    exposed by yfinance — it only has a current snapshot, not the
    quarter-over-quarter delta a real 13F feed would give you. This
    provider reports it as 0.0 (neutral). Insider buy/sell counts ARE real,
    pulled from `Ticker.insider_transactions` (Form 4 data).
  * `get_risk_events` only covers analyst downgrades (from
    `Ticker.upgrades_downgrades`). yfinance has no trading-halt feed, so
    halts are never reported here — don't read an empty GUARDIAN result as
    "no risk."
  * News sentiment is a crude keyword count over `Ticker.news` headlines,
    not a trained model — treat SENTIMENT scores as directional, not
    precise.
  * `get_open_positions` reads a local JSON ledger (see `positions.json`
    format below) since yfinance has no brokerage/account access.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd
import yfinance as yf

from stockdesk.data.base import MarketDataProvider
from stockdesk.models import (
    FundamentalSnapshot,
    InstitutionalActivity,
    MarketSnapshot,
    NewsSentiment,
    Position,
    RiskEvent,
)

_POSITIVE_WORDS = {"upgrade", "beat", "beats", "surge", "soar", "record", "rally",
                    "outperform", "buy", "strong", "growth", "bullish"}
_NEGATIVE_WORDS = {"downgrade", "miss", "misses", "plunge", "slump", "cut",
                    "underperform", "sell", "weak", "decline", "bearish", "probe",
                    "lawsuit", "investigation"}


def _rsi(closes: pd.Series, period: int = 14) -> float:
    delta = closes.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss.replace(0, float("nan"))
    rsi = 100 - (100 / (1 + rs))
    value = rsi.iloc[-1]
    if pd.isna(value):
        return 50.0
    return float(value)


def _atr(history: pd.DataFrame, period: int = 14) -> float:
    prev_close = history["Close"].shift(1)
    true_range = pd.concat([
        history["High"] - history["Low"],
        (history["High"] - prev_close).abs(),
        (history["Low"] - prev_close).abs(),
    ], axis=1).max(axis=1)
    value = true_range.rolling(period).mean().iloc[-1]
    return float(value) if pd.notna(value) else 0.0


def _score_headline(text: str) -> int:
    words = set(text.lower().split())
    return sum(1 for w in _POSITIVE_WORDS if w in words) - sum(1 for w in _NEGATIVE_WORDS if w in words)


class YFinanceDataProvider(MarketDataProvider):
    def __init__(self, universe: list[str], positions_file: str | Path | None = None):
        if not universe:
            raise ValueError("YFinanceDataProvider needs an explicit ticker universe/watchlist")
        self.universe = universe
        self.positions_file = Path(positions_file) if positions_file else None
        self._tickers: dict[str, yf.Ticker] = {}
        self._history_cache: dict[str, pd.DataFrame] = {}

    def _ticker(self, symbol: str) -> yf.Ticker:
        if symbol not in self._tickers:
            self._tickers[symbol] = yf.Ticker(symbol)
        return self._tickers[symbol]

    def _history(self, symbol: str) -> pd.DataFrame:
        if symbol not in self._history_cache:
            hist = self._ticker(symbol).history(period="1y", auto_adjust=False)
            if hist.empty:
                raise ValueError(f"yfinance returned no price history for {symbol!r}")
            self._history_cache[symbol] = hist
        return self._history_cache[symbol]

    def get_universe(self) -> list[str]:
        return list(self.universe)

    def get_market_snapshot(self, ticker: str) -> MarketSnapshot:
        hist = self._history(ticker)
        closes = hist["Close"]
        price = float(closes.iloc[-1])
        prior_close = float(closes.iloc[-2]) if len(closes) > 1 else price
        volume = int(hist["Volume"].iloc[-1])
        avg_volume_20d = int(hist["Volume"].tail(20).mean())

        return MarketSnapshot(
            ticker=ticker,
            price=round(price, 2),
            prior_close=round(prior_close, 2),
            volume=volume,
            avg_volume_20d=avg_volume_20d,
            high_52w=round(float(hist["High"].max()), 2),
            low_52w=round(float(hist["Low"].min()), 2),
            sma_20=round(float(closes.tail(20).mean()), 2),
            sma_50=round(float(closes.tail(50).mean()), 2),
            rsi_14=round(_rsi(closes), 1),
            atr_14=round(_atr(hist), 2),
        )

    def get_fundamentals(self, ticker: str) -> FundamentalSnapshot:
        info = self._ticker(ticker).get_info()

        next_earnings_date = None
        try:
            calendar = self._ticker(ticker).calendar
            raw_date = None
            if isinstance(calendar, dict):
                raw_date = calendar.get("Earnings Date")
                if isinstance(raw_date, list) and raw_date:
                    raw_date = raw_date[0]
            elif calendar is not None and not calendar.empty:
                raw_date = calendar.loc["Earnings Date"].iloc[0]
            if raw_date is not None:
                next_earnings_date = raw_date if isinstance(raw_date, date) else pd.Timestamp(raw_date).date()
        except Exception:
            next_earnings_date = None

        return FundamentalSnapshot(
            ticker=ticker,
            market_cap=float(info.get("marketCap") or 0.0),
            sector=info.get("sector") or "Unknown",
            next_earnings_date=next_earnings_date,
            short_interest_pct=round(float(info.get("shortPercentOfFloat") or 0.0) * 100, 1),
            beta=round(float(info.get("beta") or 1.0), 2),
        )

    def get_institutional_activity(self, ticker: str) -> InstitutionalActivity:
        buys = sells = 0
        try:
            transactions = self._ticker(ticker).insider_transactions
            if transactions is not None and not transactions.empty:
                cutoff = datetime.now() - timedelta(days=90)
                for _, row in transactions.iterrows():
                    start_date = pd.to_datetime(row.get("Start Date"), errors="coerce")
                    if pd.isna(start_date) or start_date < cutoff:
                        continue
                    text = str(row.get("Transaction", "")).lower()
                    if "purchase" in text or "buy" in text:
                        buys += 1
                    elif "sale" in text or "sell" in text:
                        sells += 1
        except Exception:
            pass

        return InstitutionalActivity(
            ticker=ticker,
            # yfinance has no historical 13F delta — see module docstring.
            net_institutional_change_pct=0.0,
            insider_buys_90d=buys,
            insider_sells_90d=sells,
        )

    def get_news_sentiment(self, ticker: str) -> NewsSentiment:
        headlines: list[str] = []
        score = 0
        recent_count = 0
        older_count = 0
        try:
            items = self._ticker(ticker).news or []
            cutoff = datetime.now() - timedelta(hours=24)
            for item in items:
                content = item.get("content", item)  # yfinance schema varies by version
                title = content.get("title") or ""
                if not title:
                    continue
                headlines.append(title)
                score += _score_headline(title)

                pub_raw = content.get("pubDate") or item.get("providerPublishTime")
                pub_time = pd.to_datetime(pub_raw, errors="coerce", utc=True)
                if pd.notna(pub_time) and pub_time.tz_localize(None) >= cutoff:
                    recent_count += 1
                else:
                    older_count += 1
        except Exception:
            pass

        sentiment_score = max(-1.0, min(1.0, score / 5)) if headlines else 0.0
        mention_change = 0.0
        if older_count > 0:
            mention_change = round((recent_count - older_count) / older_count * 100, 1)
        elif recent_count > 0:
            mention_change = 100.0

        return NewsSentiment(
            ticker=ticker,
            sentiment_score=round(sentiment_score, 2),
            mention_volume_change_pct=mention_change,
            headlines=headlines[:5],
        )

    def get_risk_events(self, ticker: str) -> list[RiskEvent]:
        events: list[RiskEvent] = []
        try:
            grades = self._ticker(ticker).upgrades_downgrades
            if grades is not None and not grades.empty:
                cutoff = datetime.now() - timedelta(days=14)
                recent = grades[grades.index >= cutoff] if grades.index.name == "GradeDate" else grades.head(0)
                for _, row in recent.iterrows():
                    if str(row.get("Action", "")).lower() == "down":
                        events.append(RiskEvent(
                            ticker=ticker,
                            kind="downgrade",
                            description=f"{row.get('Firm', 'Analyst')} downgraded to {row.get('ToGrade', 'n/a')}",
                            severity="medium",
                        ))
        except Exception:
            pass
        return events

    def get_open_positions(self) -> list[Position]:
        if self.positions_file is None or not self.positions_file.exists():
            return []
        raw = json.loads(self.positions_file.read_text())
        return [
            Position(
                ticker=p["ticker"],
                shares=float(p["shares"]),
                entry_price=float(p["entry_price"]),
                entry_date=date.fromisoformat(p["entry_date"]),
            )
            for p in raw
        ]
