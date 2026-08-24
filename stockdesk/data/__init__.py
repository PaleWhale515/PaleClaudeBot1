from stockdesk.data.base import MarketDataProvider
from stockdesk.data.mock import MockDataProvider

__all__ = ["MarketDataProvider", "MockDataProvider"]

try:
    from stockdesk.data.yfinance_provider import YFinanceDataProvider  # noqa: F401
    __all__.append("YFinanceDataProvider")
except ImportError:
    pass  # yfinance/pandas not installed — `pip install -r requirements.txt`
