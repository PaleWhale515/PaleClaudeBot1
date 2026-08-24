from __future__ import annotations

from abc import ABC, abstractmethod

from stockdesk.config import DeskConfig
from stockdesk.data.base import MarketDataProvider


class Agent(ABC):
    """One desk role. Each agent does one job and hands its output to the
    next stage — nobody on this desk places an order."""

    name: str = "agent"

    def __init__(self, data: MarketDataProvider, config: DeskConfig):
        self.data = data
        self.config = config

    @abstractmethod
    def run(self, *args, **kwargs):
        ...
