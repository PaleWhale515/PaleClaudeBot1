"""SENTIMENT — the crypto desk's SHILL, without the "key influencer calls"
framing. Tracks headline sentiment and mention-volume trend from a news
provider. It measures coverage, it doesn't chase promoters.
"""

from __future__ import annotations

from stockdesk.agents.base import Agent
from stockdesk.models import Setup


class SentimentAgent(Agent):
    name = "SENTIMENT"

    def run(self, setup: Setup) -> Setup:
        news = self.data.get_news_sentiment(setup.ticker)
        setup.sentiment = news

        score = 0.5 + news.sentiment_score * 0.4
        if news.mention_volume_change_pct > 30:
            score += 0.1
            setup.notes.append(f"news mention volume +{news.mention_volume_change_pct:.0f}%")

        setup.sentiment_score = max(0.0, min(score, 1.0))
        setup.notes.append(
            f"SENTIMENT score {setup.sentiment_score:.2f} "
            f"(headline sentiment {news.sentiment_score:+.2f})"
        )
        return setup
