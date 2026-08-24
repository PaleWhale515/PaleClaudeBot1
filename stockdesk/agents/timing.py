"""TIMING — the crypto desk's SNIPER, minus the millisecond execution.

There is no legitimate stock equivalent of "place the order the instant
risk clears" for a retail research tool — that's latency-arms-race
territory best left alone. This agent instead proposes a research entry
band and a technical stop, sized off ATR, for a human to act on manually
or via their broker's own order entry.
"""

from __future__ import annotations

from stockdesk.agents.base import Agent
from stockdesk.models import Setup


class TimingAgent(Agent):
    name = "TIMING"

    def run(self, setup: Setup) -> Setup:
        m = setup.market
        cfg = self.config
        band = m.atr_14 * cfg.entry_band_atr_multiple
        stop = m.price - m.atr_14 * cfg.stop_atr_multiple

        trend = "above" if m.price > m.sma_50 else "below"
        momentum = "overbought" if m.rsi_14 >= 70 else "oversold" if m.rsi_14 <= 30 else "neutral"

        setup.timing = {
            "entry_low": round(m.price - band, 2),
            "entry_high": round(m.price + band, 2),
            "suggested_stop": round(stop, 2),
            "trend": f"price is {trend} the 50d SMA",
            "momentum": f"RSI-14 {m.rsi_14} ({momentum})",
        }

        score = 0.5
        if trend == "above":
            score += 0.25
        if momentum == "neutral":
            score += 0.15
        elif momentum == "oversold":
            score += 0.1
        setup.notes.append(f"TIMING score {min(score, 1.0):.2f}")
        setup.timing["score"] = min(score, 1.0)
        return setup
