# Trading Simplified White Paper v4.0

Sep 27, 2026 · Live version, with diagrams: https://claude.ai/code/artifact/683f1854-91f8-463b-957f-dfe129d16f3c

Trading Simplified is a non-custodial front end that turns prediction contracts and SPY options into three plain choices, then routes every order to a regulated partner. Version 4.0 replaces v3.7 and the v3.8 revisions, and describes the product as it is built in the current prototype.

**Status:** confidential draft for buyers and pilot partners. Bracketed items such as [PARTNER], [REGISTRATION STATUS] and [TIER C LIMITS] are placeholders to fill before sharing. All figures are mock data from the prototype. This paper is not legal advice; counsel must confirm every regulatory statement before launch.

## Executive summary

We bring first-time traders in through $20 predictions and graduate them to defined-risk SPY options only when their balance and their habits both qualify. Every order is the customer's own, placed through [PARTNER]; we never hold funds, positions or tokens.

- **Predict:** UP or DOWN on short-horizon event contracts, $20 per stake at Tier A, routed to a CFTC-regulated exchange.
- **Trade:** the Probability Slider. The customer picks a direction, an expiration from 0DTE to 1 year, and a chance of profit from 1% to 99%. The engine picks the strikes and the strategy; every trade has a fixed maximum loss.
- **Graduate:** margin needs a $2,000 balance, a Discipline Score above 85 and partner approval. Balance alone never upgrades anyone.
- **Protect:** Smart Stake caps new risk at 25% of equity, a system-enforced stop-loss sits on every options trade, and an automatic Safe-State pauses trading when latency passes 500 ms.
- **Earn:** a per-side micro-commission on every contract, a disclosed share of options order-flow payments, and Plus membership at $9.99 per month.

The company is built to be sold whole to a strategic buyer (an exchange, a broker, or a foreign firm entering the US) once a live pilot proves traction.

## Market gap

New traders arrive through prediction markets but have no safe path from a $20 contract to a real options account. Brokers hand them an options chain; prediction venues never graduate them.

| Today | Trading Simplified |
| --- | --- |
| Options chains with dozens of strikes and Greeks | Three choices: direction, expiration, chance of profit |
| Undefined-risk trades available on day one | Defined-risk only; maximum loss shown before every order |
| Margin unlocked by balance alone | Balance, Discipline Score and partner approval |
| Stops optional and easy to remove | A system-enforced stop-loss on every options trade |
| Customer must notice outages | Trading pauses automatically on high latency |

Partners gain a funnel of customers who have already shown disciplined sizing and exits before they reach margin.

## Predict channel

Predict is the entry point: one tap on UP or DOWN buys a fixed stake of a short-horizon event contract. The stake is $20 at Tier A and $100 at Tier B, plus a disclosed commission of $0.01 per contract per side.

- Every position routes through [PARTNER] to a CFTC-regulated exchange and is centrally cleared; we are never the counterparty.
- Smart Stake applies here too: a stake that would exceed 25% of equity is blocked with an explanation.
- The live chart and outcome are shown in plain words; no leverage, no averaging down.
- Share to X posts market data only, with a risk disclosure, never the customer's P&L (see Growth).

## Trade channel: the Probability Slider

The customer picks a chance of profit, not a strike. Trade is options-only on SPY and replaces the stock ticket; the engine turns three answers into one defined-risk trade.

1. **Direction:** Up, Down or Stay in range.
2. **Expiration:** today (0DTE) to 365 days.
3. **Estimated chance of profit:** a slider from 1% to 99%. Lower means a bigger payout for the risk; higher means a smaller one.

| Slider | Up | Down | Stay in range | Account needed |
| --- | --- | --- | --- | --- |
| 1–49% | Buy a call | Buy a put | Buy a butterfly | Cash, options approved (butterfly: Tier B) |
| 50–99% | Sell a put spread | Sell a call spread | Sell an iron condor | Margin, Tier B |

The engine never sells uncovered options. Chance of profit is a risk-neutral estimate from option prices (Black-Scholes with a skew and term model), not a guarantee.

**Example (mock data):** Up, 7 days, 70%. The engine sells the SPY 652/650 put spread. The customer profits if SPY finishes above $651.45, could make $55 and could lose $145.

### System-enforced stop-loss

Every options trade carries a stop that the customer cannot remove or widen. It appears as a locked field on the ticket and updates as the slider moves.

| Trade type | Stop triggers at a loss of | Example |
| --- | --- | --- |
| Bought options (calls, puts, butterflies) | 50% of the premium paid | $200 premium, stop at −$100 |
| Sold spreads (credit spreads, iron condors) | 2× the credit received | $55 credit, stop at −$110 |

The stop is always capped at the trade's maximum loss. It is checked on every price update and fills at the next available price, so it is disclosed as not guaranteed. While Safe-State has paused trading, stops wait and fire when trading resumes.

### Views and position tools

- **Simplified view (default):** "You could make" and "You could lose" side by side at equal size, plus a payoff chart at expiration.
- **Detailed view:** legs, spread width, implied volatility and Greeks for experienced users.
- **Positions:** Close, Close all positions and Reverse position (Up to Down at the same chance and expiry), each with a confirmation. Reverse needs margin; in-range trades can't be reversed.
- **Records:** order history and a cost-basis CSV with realized gains and losses.

### Execution and disclosures

Each trade is the customer's own order, placed through [PARTNER] and routed to an options exchange under best-execution rules (FINRA 5310) with Rule 606 routing reports. We do not buy the options ourselves, pool orders or issue tokens. Before the first trade the customer acknowledges the Options Disclosure Document (Characteristics and Risks of Standardized Options) and applies for options approval under FINRA Rule 2360.

## Graduated access

Balance alone never upgrades anyone: margin needs a $2,000 balance, a Discipline Score above 85 and [PARTNER]'s approval. A customer's effective tier is the lower of what the partner approved and what the balance supports.

*(Diagram in the live version: Tier A → $2,000 balance → Score above 85 → Partner approval → Tier B → Tier C; a balance under $2,000 drops limits back to Tier A.)*

We recommend an upgrade when both measured gates pass; the partner decides under its own process.

| Tier | Account value | Predict stake | Max at risk per order | Access |
| --- | --- | --- | --- | --- |
| A | Under $2,000 | $20 | $500 | Cash account; buy single calls and puts once options are approved |
| B | $2,000 – $9,999 | $100 | $2,500 | Margin; spreads, butterflies and iron condors; partner approval |
| C | $10,000+ | [TIER C LIMITS] | Partner-set | Higher limits; partner approval |

### Discipline Score

The score runs from 0 to 100 over the last 30 days and shows in the header next to the Road to $2K bar (90+ Excellent, above 85 Good, 70+ Fair). Sizing, exits and frequency come from the customer's real orders.

| Factor | Points | Full marks when |
| --- | --- | --- |
| Planned exits | 25 | An exit plan is set on every trade |
| Position sizing | 20 | Trades use 50% or less of the Smart Stake limit |
| Drawdown control | 20 | Losses stay within 15% over 30 days |
| Consistency | 20 | Trading is steady across days, not in bursts |
| Trade frequency | 15 | 6 or fewer new trades a day |

### Margin rules in 2026

Margin accounts follow FINRA Rule 4210's intraday margin standards, which replaced the pattern-day-trader rule and its $25,000 minimum on June 4, 2026 (SR-FINRA-2025-017, Regulatory Notice 26-10). Firms may phase them in through October 20, 2027, so [PARTNER]'s own schedule applies. The $2,000 minimum equity for margin is unchanged.

## Architecture and risk controls

We are a non-custodial software layer: [PARTNER] holds every account, dollar and position, and we add three controls the customer cannot switch off.

*(Diagram in the live version: Customer app → our risk layer (Smart Stake, enforced stop-loss, automatic Safe-State) → [PARTNER] (custody, KYC, AML, options approval, margin under 4210) → exchanges (options exchanges, CFTC event venue, central clearing). Link latency is watched: above 500 ms, all orders pause.)*

No tokens: a tokenized option would still be a security, and issuing or holding one would make us custodian and counterparty. Each order is the customer's own, one for one, in their own account.

| Control | Rule | What the customer sees |
| --- | --- | --- |
| Smart Stake | New risk per order is capped at 25% of equity or the tier limit, whichever is lower. For options, risk is the maximum loss. Closing is never blocked. | A meter on the ticket; oversized orders are blocked with the reason |
| System-enforced stop-loss | 50% of premium for bought options, 2× credit for sold spreads, capped at maximum loss; fills at the next available price | A locked field that moves with the slider |
| Automatic Safe-State | Trips when partner latency passes 500 ms; blocks all orders, including closes, while the route is unsafe; resumes after 5 seconds under 200 ms | A status pill: "Live" or "Trading paused"; there is no switch |

These controls complement, and do not replace, the partner's pre-trade risk controls under SEC Rule 15c3-5.

- **Margin events:** the partner issues and enforces margin calls; we surface them in plain words and block new risk until they are met.
- **Tax records:** order history and a cost-basis CSV with realized gains and losses; the partner's 1099 remains the record of truth.

## Growth: Viral Pulse

Customers can share Pulse Snapshots to X with #TradingSimplified, giving us a low-cost organic channel beside paid marketing. A snapshot is a market-level card, for example "Market says 58% UP on SPY today."

Posts the platform prompts can count as the firm's own advertising (FINRA Rule 2210, NFA Rule 2-29), so the guardrails are fixed:

- Snapshot templates are pre-approved by [PARTNER]'s compliance team.
- Snapshots never show personal P&L, win rates or performance claims.
- Required risk disclosures attach automatically.
- Sharing is optional, and no one is rewarded for posting.

## Revenue

Three streams: a micro-commission on every contract, a disclosed share of options order-flow payments, and Plus at $9.99 per month. Each is worded to survive a buyer's due diligence.

| Stream | Channel | How it works | Disclosure |
| --- | --- | --- | --- |
| Per-contract commission | Predict and Trade | A micro-fee charged per side (open and close) on every contract executed: $0.01 in the prototype, final [FEE], shared with [PARTNER] | Shown on every ticket and confirmation |
| Order-routing revenue (PFOF) | Trade: SPY options | [PARTNER] routes each customer's options order to market makers or exchanges that pay for order flow and shares a portion with us | SEC Rule 606 reports and account disclosures; [PARTNER]'s best-execution duty (FINRA 5310) is unchanged |
| Plus membership | All | $9.99 per month, recurring | Plan terms at checkout |

Payment for order flow remains legal in the US: the SEC withdrew its proposed Order Competition Rule and Regulation Best Execution on June 12, 2025 ([SEC](https://www.sec.gov/rules-regulations/2025/06/order-competition-rule)). Event contracts trade on the exchange and generate no order-flow payments.

**Plus** unlocks the Journal & Ladders tab, shown today as a locked, blurred preview:

- Instant deposits: trade before a deposit settles, as credit extended by [PARTNER] under its Regulation T policy.
- Reduced commission brackets.
- An automated trading journal: every trade with its plan, stop and outcome.
- Seasonal Ladders: competitive seasons ranked on Discipline Score, never on returns, with no cash prizes.

Plus changes tools and fees only. It never changes a customer's risk limits, stops or approvals.

### Why the wording differs from the pitch draft

| Pitch draft | This paper | Why |
| --- | --- | --- |
| "Transactional velocity and volume per user scale exponentially" | Revenue grows with active accounts and graduation | Contradicts the Discipline Score, which docks points for overtrading; regulators treat engagement-driven trading as a gamification risk |
| "Aggregated, non-toxic retail directional flow" | Each customer's own order, routed by [PARTNER] | "Aggregated" implies pooling orders; "non-toxic" tells a regulator the flow is sold because customers are the less-informed side |
| "The clearing firm internalizes SPY flow" | Routed to market makers or exchanges that pay for order flow | Listed options must execute on an exchange; internalization describes stock orders |
| "Instant deposit clearing" | Instant deposits as partner-extended credit | Trading unsettled funds is credit under Regulation T, so the partner decides |

## Exit strategy: built to be acquired

The goal is to sell the whole company (product, code, brand and customers) to a strategic buyer. The buyer supplies the licenses, custody and clearing; we supply the onboarding path and the risk layer.

Acquirers pay for four things: customers and traction, technology that shortens their roadmap, a team, and a design that passes their compliance review. Today we have the last two in prototype form; live traction is what turns this into a sale.

| Buyer type | Examples | Why they would buy |
| --- | --- | --- |
| Prediction-market exchanges | Kalshi, Polymarket | Keep customers who outgrow event contracts, instead of losing them to brokers |
| Online brokers | Interactive Brokers, Robinhood, Webull | A beginner options front end with a documented discipline record for every customer who reaches margin |
| Foreign brokers or exchanges entering the US | [TARGET] | A US-facing product already designed around FINRA, SEC and CFTC rules |

Path to a sale:

1. Launch a small live pilot on a broker's API, with that broker as the licensed partner.
2. Prove the numbers buyers ask for: funded accounts, cost to acquire, graduation rate to Tier B, 90-day retention and Plus conversion.
3. Approach buyers' corporate development teams with a data room: metrics, code, compliance map and this paper.

Our registration status: [REGISTRATION STATUS], to be confirmed by counsel.

## Regulatory reference

Each rule below shapes a specific product decision; counsel must confirm how each applies to our final structure.

| Rule | What it requires | Where the product meets it |
| --- | --- | --- |
| [FINRA Rule 4210](https://www.finra.org/rules-guidance/rulebooks/finra-rules/4210) | $2,000 minimum equity for margin; intraday margin standards replaced the pattern-day-trader rule on June 4, 2026, phase-in through October 20, 2027 ([Regulatory Notice 26-10](https://www.finra.org/rules-guidance/notices/26-10)) | Balance gate for Tier B; partner's margin schedule applies |
| [FINRA Rule 2360](https://www.finra.org/rules-guidance/rulebooks/finra-rules/2360) | Options account approval; Options Disclosure Document | Options application and ODD acknowledgment before the first trade |
| Regulation T | No short sales or uncovered writing in cash accounts | Tier A buys calls and puts only; spreads need margin |
| [SEC Rule 15c3-5](https://www.ecfr.gov/current/title-17/section-240.15c3-5) | Pre-trade risk controls for market access | Smart Stake and Safe-State add to the partner's controls |
| SEC Rule 606 | Order-routing and payment-for-order-flow reports | Routing revenue disclosed |
| [FINRA Rule 5310](https://www.finra.org/rules-guidance/rulebooks/finra-rules/5310) | Best execution | Unchanged by any routing revenue |
| [FINRA Rule 2210](https://www.finra.org/rules-guidance/rulebooks/finra-rules/2210) and NFA Rule 2-29 | Communications with the public | Pre-approved Pulse Snapshots, no P&L |
| CFTC exchange rules | Event contracts trade on a registered exchange and are centrally cleared | Predict routes through [PARTNER]; we are never counterparty |
| Securities laws on tokenization | A token representing an option is still a security | No tokens; customers hold their own options at [PARTNER] |

## Open decisions and next steps

Six items must be settled before this paper goes to a buyer or pilot partner.

- [ ] Choose a pilot broker partner and replace every [PARTNER]; buyer shortlist in Exit strategy.
- [ ] Counsel confirms [REGISTRATION STATUS] and every row of the regulatory table.
- [ ] Set the final per-side commission [FEE] and the partner's share of commissions and order-flow payments.
- [ ] Set Tier C prediction stake and order limits [TIER C LIMITS].
- [ ] Replace mock drawdown and consistency inputs with live account data.
- [ ] Confirm the partner's intraday-margin phase-in date under Regulatory Notice 26-10.

Done in v4.0: Tier A accounts open the slider on a bought option (Up, 7 days, 20% chance of profit, about $176 at risk), and bought options stay at or out of the money, so first trades fit inside Smart Stake.

Prototype: [Trading Simplified demo](https://claude.ai/artifact/PNL9tynU4ENZ54jVuu3miM). Partner deck: [Trading Simplified deck](https://claude.ai/artifact/3FsxUgMfgXFGn2PrMfk9Lx).
