from stockdesk.agents import RiskAgent, SearchAgent
from stockdesk.config import DeskConfig
from stockdesk.data.mock import MockDataProvider
from stockdesk.orchestrator import run_desk


def test_search_agent_returns_candidates_with_reasons():
    data = MockDataProvider(universe=["AAPL", "MSFT", "NVDA", "TSLA"])
    agent = SearchAgent(data, DeskConfig())
    candidates = agent.run()
    assert isinstance(candidates, list)
    for c in candidates:
        assert c.notes, f"{c.ticker} was returned with no screening reason"


def test_risk_agent_disqualifies_earnings_blackout():
    data = MockDataProvider(universe=["AAPL"])
    agent = SearchAgent(data, DeskConfig())
    candidates = agent.run() or [None]
    ticker = "AAPL"
    from stockdesk.models import Setup
    market = data.get_market_snapshot(ticker)
    setup = Setup(ticker=ticker, market=market)

    config = DeskConfig(earnings_blackout_days=9999)  # force everyone into blackout
    risk_agent = RiskAgent(data, config)
    result = risk_agent.run(setup)
    fundamentals = data.get_fundamentals(ticker)
    if fundamentals.next_earnings_date is not None:
        assert result.disqualified
        assert result.disqualify_reason == "earnings blackout"


def test_run_desk_end_to_end_produces_report_with_disclaimer():
    data = MockDataProvider()
    report = run_desk(data, DeskConfig())
    assert report.universe_scanned == len(data.get_universe())
    assert "is investment advice" in report.disclaimer.lower()
    assert len(report.top_setups) <= DeskConfig().max_top_setups
    for setup in report.top_setups:
        assert not setup.disqualified


def test_run_desk_is_deterministic_for_same_universe():
    universe = ["AAPL", "MSFT", "NVDA"]
    report_a = run_desk(MockDataProvider(universe=universe))
    report_b = run_desk(MockDataProvider(universe=universe))
    tickers_a = [s.ticker for s in report_a.top_setups]
    tickers_b = [s.ticker for s in report_b.top_setups]
    assert tickers_a == tickers_b
