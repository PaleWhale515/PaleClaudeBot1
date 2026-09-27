# Kalshi Builders Application: Trading Simplified

Sep 27, 2026 · Live version: https://claude.ai/code/artifact/10cc3c7d-ccd8-44f8-a0e9-8c481bc80c41

Draft answers for the [Kalshi Builders](https://kalshi.com/builders) form. Grants reportedly run up to $10,000 in USDC; the form's exact questions weren't reachable from here, so paste each section into the matching field.

## Project summary

**Trading Simplified** turns Kalshi markets into one tap: pick UP or DOWN on a short-horizon event contract, with a fixed $20 stake. It is built for first-time traders, the people who find an order book intimidating. Every stake is capped at 25% of the account, and a Discipline Score rewards planned exits and steady sizing instead of trading volume. A working prototype is live today; the grant funds connecting it to the Kalshi API and running a 100-user pilot.

## What's built, and how Kalshi fits

The prototype is a complete, clickable app: [live demo](https://claude.ai/artifact/PNL9tynU4ENZ54jVuu3miM) (add `#demo` to skip the intro). All numbers are mock data today.

- **Predict channel (the Kalshi integration):** market cards with a live chart, UP and DOWN buttons, the stake and fee shown before every order, and a Share to X card that posts market data only, never personal P&L.
- **Built-in guardrails:** a 25% cap on each stake, an automatic pause when the connection slows past 500 ms, and a Discipline Score that tracks sizing, planned exits and trade frequency.
- **A path upward:** customers who show steady habits graduate to a defined-risk options channel through a licensed broker, so Kalshi gets the entry point and new traders stay in regulated markets.

Why Kalshi: it is the CFTC-regulated exchange for event contracts, its API supports third-party apps, and builder codes let a front end like ours bring new volume while Kalshi handles matching and clearing.

What the integration uses: Kalshi's market data for the cards and charts, order placement on each user's own Kalshi account, and a builder code on every order routed through the app.

## Milestones and use of funds

The ask is $10,000 to take the Predict channel live on Kalshi and prove it with 100 real users in 16 weeks.

1. **Weeks 1–2:** form the Iowa LLC, get Kalshi API keys, and complete a legal review of the order flow.
2. **Weeks 3–6:** connect the Predict channel to Kalshi's demo environment, then production, with the builder code on every order.
3. **Weeks 7–10:** closed beta with 25 users; fix what they hit.
4. **Weeks 11–16:** open the pilot to 100 users and share a report with Kalshi: active users, orders, 30-day retention, and how often the stake cap stopped an oversized order.

| Use | Amount (estimate) |
| --- | --- |
| Founder build time (4 months, part-time) | $3,000 |
| Legal review of the Kalshi order flow and builder-code fees | $3,000 |
| Pilot outreach: content and ads, with no trading rewards | $2,300 |
| Hosting, database, market data and monitoring (12 months) | $1,500 |
| Iowa LLC filing, app store accounts | $200 |
| **Total** | **$10,000** |

## Builder and compliance

**Builder:** solo founder based in Iowa; designed and built the full prototype, the partner deck and the white paper. The company will be an Iowa LLC ($50 state filing fee, $30 online biennial report ([Iowa SOS](https://help.sos.iowa.gov/how-do-i-file-biennial-report))). Contact: [NAME], [EMAIL], [X HANDLE].

**Compliance by design:** users trade in their own Kalshi accounts; we never hold funds or positions and never take the other side. Sharing shows market data only, and nobody is rewarded for posting or for trading more.

Questions to ask Kalshi before accepting:

- [ ] Does earning builder-code fees require us to register with the NFA as an introducing broker?
- [ ] Is the builder code for on-chain markets only (Solana, Base), or also for API orders on Kalshi accounts?
- [ ] How are grants paid: USDC to a crypto wallet, or US dollars to a bank account?
- [ ] Can users authorize our app without sharing their Kalshi API keys with us?
