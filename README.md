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
python3 run_desk.py                                    # sample universe, mock data
python3 run_desk.py --universe AAPL TSLA NVDA           # custom tickers, mock data
python3 run_desk.py --provider yfinance --universe AAPL TSLA NVDA   # real data
python3 -m pytest -q
```

By default everything runs against `MockDataProvider`, which generates
deterministic sample data so the pipeline is runnable and testable with no
external accounts. Pass `--provider yfinance` to pull real market data
instead (see below).

## The yfinance provider

`stockdesk/data/yfinance_provider.py` implements `MarketDataProvider` on
top of [`yfinance`](https://github.com/ranaroussi/yfinance) (an unofficial
Yahoo Finance client — free, no API key, but also unofficial: Yahoo can
change its schema or rate-limit you without notice). It needs no
credentials, just `pip install -r requirements.txt`.

```bash
python3 run_desk.py --provider yfinance --universe AAPL MSFT NVDA TSLA
```

**What's real vs. approximated**, so you know what to trust:

| Field | Source | Note |
|---|---|---|
| Price, volume, SMA/RSI/ATR | `Ticker.history()` | Computed directly from real OHLCV data. |
| Market cap, sector, beta, short interest | `Ticker.get_info()` | Real, but Yahoo's `info` dict is inconsistently populated — missing fields default to 0 / "Unknown" rather than crashing the run. |
| Next earnings date | `Ticker.calendar` | Real when Yahoo has it; `None` otherwise (RISK's earnings-blackout check is then simply skipped for that ticker). |
| Insider buy/sell counts (90d) | `Ticker.insider_transactions` | Real Form 4 data. |
| **Institutional ownership change %** | — | **Not real.** yfinance only exposes a current-snapshot ownership %, not the quarter-over-quarter delta a 13F feed gives you. Always reported as `0.0` (neutral) — wire in SEC EDGAR's 13F filings if you want this field to mean something. |
| News sentiment | `Ticker.news` + a keyword lexicon | Real headlines, but sentiment scoring is a crude positive/negative word count, not a trained model — directional at best. |
| Risk events | `Ticker.upgrades_downgrades` | Only covers analyst downgrades. **No halt feed** — GUARDIAN will never flag a halt through this provider, so an empty result there is not "no risk," it's "not checked." |
| Open positions | a local JSON ledger (`--positions-file`) | yfinance has no brokerage access; point this at a file shaped like `[{"ticker": "AAPL", "shares": 10, "entry_price": 180.0, "entry_date": "2026-01-15"}]`. |

This sandbox's own network policy currently blocks `finance.yahoo.com`
(outbound access is controlled per-environment — see the Claude Code on
the web docs), so the provider is covered by tests against a fake
`yfinance.Ticker` (`tests/test_yfinance_provider.py`) rather than a live
call. Run it against a network that can actually reach Yahoo before relying
on its output.

## Wiring up other data sources

Nothing in `stockdesk/agents/` talks to a specific provider directly —
every agent depends only on the `MarketDataProvider` interface in
`stockdesk/data/base.py`. To fill the yfinance provider's gaps above (real
13F deltas, halt feeds, a proper sentiment model) or swap to a paid data
vendor or broker API (e.g. Alpaca), implement that interface once and pass
your provider to `run_desk()` — no changes needed to `orchestrator.py` or
any agent. Order placement, if you ever want it, belongs in a new,
explicitly-reviewed module — it is intentionally not part of this
pipeline.
