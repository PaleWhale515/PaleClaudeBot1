# stockdesk

A small multi-agent research pipeline for stocks, structured like the
"8-agent crypto trading floor" people post about on X — but honest about
what that structure can and can't do once you're working with equities and
public data instead of on-chain tokens.

**This is a research/screening tool. It never places an order.** Every
agent produces notes for a human to review; nothing here is investment
advice, and nothing here is connected to a brokerage.

## Why it's not a 1:1 port of the crypto desk

The tweet's 8-agent floor (SEARCH / RISK / SNIPER / WHALE / RUG / EXIT /
SHILL / HEAD OF DESK) leans on things that don't have honest equivalents in
public equities: scraping "unindexed Telegram signals" ahead of other
traders, auditing a smart contract's mint function, firing an order the
millisecond a check clears, and auto-dumping a position the instant a dev
wallet moves. Claims like "$13,100 last week, zero bad fills" from an
account selling the setup are exactly the shape of hype marketing worth
being skeptical of — treat that post as a viral ad, not a spec.

So each role here is re-scoped to what's real and legal for a retail stock
account:

| Crypto desk | stockdesk agent | What actually changed |
|---|---|---|
| SEARCH (alpha scraping) | `SearchAgent` | Screens ordinary market data (relative volume, 52-week range) — no non-public "alpha." |
| RISK (contract audit) | `RiskAgent` | Checks market cap, short interest, beta, and earnings-date blackout — the things that actually blow up a stock position. |
| SNIPER (ms order fill) | `TimingAgent` | Proposes an entry band and ATR-based stop for a human to act on — no automated order placement. |
| WHALE (wallet tracking) | `InstitutionalAgent` | Reads public 13F/Form 4 filing deltas — institutional ownership change and insider buy/sell activity. |
| RUG (auto-dump) | `GuardianAgent` | Flags halts/downgrades/going-concern events; a human decides whether to exit. |
| EXIT (dynamic trailing stop) | `ExitAgent` | Trailing stop + scale-out levels for positions you already hold, same idea, no auto-execution. |
| SHILL (influencer tracking) | `SentimentAgent` | News headline sentiment and mention-volume trend — coverage, not promoter chasing. |
| HEAD OF DESK | `HeadOfDeskAgent` | Aggregates everything into a composite score and a short "needs human review" list. Never trades. |

## Layout

```
stockdesk/
  models.py           # shared dataclasses passed between agents
  config.py           # tunable thresholds (no magic numbers in agent code)
  data/
    base.py           # MarketDataProvider interface
    mock.py           # deterministic sample data, no API keys required
  agents/
    search.py risk.py timing.py institutional.py
    sentiment.py guardian.py exit.py head_of_desk.py
  orchestrator.py      # wires the agents into one run
  report.py            # renders a DailyDeskReport as text
run_desk.py             # CLI entry point
tests/test_desk.py
```

## Running it

```bash
pip install -r requirements.txt
python3 run_desk.py                       # sample universe
python3 run_desk.py --universe AAPL TSLA  # custom tickers
python3 -m pytest -q
```

Everything runs today against `MockDataProvider`, which generates
deterministic sample data so the pipeline is runnable and testable with no
external accounts.

## Wiring up real data

Nothing in `stockdesk/agents/` talks to the mock provider directly — every
agent depends only on the `MarketDataProvider` interface in
`stockdesk/data/base.py`. To go from sample data to something real,
implement that interface once:

- **Prices/technicals** (`get_market_snapshot`, `get_universe`) — a market
  data API such as Alpaca's or `yfinance`.
- **Fundamentals** (`get_fundamentals`) — a fundamentals API, or your
  broker's own data if it exposes one.
- **Institutional/insider activity** (`get_institutional_activity`) — SEC
  EDGAR's 13F and Form 4 filings (both public, free, and exactly the data
  the crypto desk's "whale tracking" is a shadow of).
- **News sentiment** (`get_news_sentiment`) — any headline/news API,
  scored with a sentiment model of your choice.
- **Risk events** (`get_risk_events`) — exchange halt feeds, analyst
  rating-change feeds, SEC 8-K filings.
- **Open positions** (`get_open_positions`) — your brokerage's account API
  or a local ledger file.

None of this requires code changes to `orchestrator.py` or any agent — swap
`MockDataProvider` for your real implementation in `run_desk.py` and the
whole pipeline runs on live data. Order placement, if you ever want it,
belongs in a new, explicitly-reviewed module — it is intentionally not part
of this pipeline.
