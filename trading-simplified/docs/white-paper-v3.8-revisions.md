# Trading Simplified — White Paper v3.8 (revised sections)

Replacement text for the sections of white paper v3.7 and the v3.7 Executive Summary most likely to draw pushback from a partner's compliance team. Paste each section over its v3.7 version.

**Fill in before sending.** Every `[bracket]` marks a decision only you can make:

- `[PARTNER]` — the regulated firm you execute through (broker-dealer, FCM, or exchange).
- `[REGISTRATION STATUS]` — whether Trading Simplified registers itself (broker-dealer, Introducing Broker) or operates only as a software vendor under the partner's registration. Confirm with counsel.
- `[TIER C LIMITS]` — the Tier C Predict stake, and confirmation that the 25% Smart Stake limit still applies at Tier C.

This is plain-language drafting, not legal advice. Have a securities/derivatives lawyer review before external distribution.

---

## Title block

**WHITE PAPER: TRADING SIMPLIFIED (v3.8)**
Risk-First Retail Onboarding & Graduated-Access Platform
Date: [Month] 2026
Subject: Retail Onboarding and Graduated Margin Access
Classification: Confidential — Proprietary Software Platform / Strategic Partnership Candidate

---

## 1. Executive Summary

Trading Simplified is an API-first software platform that helps a regulated partner bring new retail investors on board and move them, step by step, toward more advanced products.

New users start with small, fixed-risk index event contracts and cash-only stock trading. As their account grows and their trading record shows consistent risk management, the platform recommends them to the partner for expanded access, including margin. The partner keeps custody, the customer account, and every account-approval decision. Trading Simplified provides the interface, the pre-trade risk controls, and the graduation engine.

## 2. The Market Gap

Retail investors today mostly choose between two options. One is legacy broker interfaces built for experienced traders. The other is simplified apps that make trading easy but offer no structured path to more advanced products.

Trading Simplified fills that gap with a risk-first onboarding path. Position limits, pre-trade checks, and data-driven context come first. Expanded access comes later, and only after a user has shown they can manage risk.

## 3. Dual-Channel Product

**PREDICT Channel — fixed-risk event contracts**

- Users take positions in exchange-listed index event contracts [e.g., CME Group event contracts]. Every position has a fixed maximum loss that the user sees before confirming: $20 at Tier A, $100 at Tier B.
- **Exchange execution:** Each user position is a real order. It is routed through [PARTNER] to the listing exchange and centrally cleared. Trading Simplified does not take the other side of user positions and does not run an internal or synthetic book.

**TRADE Channel — stocks and options**

- Charting plus a Mechanical Data Dashboard showing IV Rank, Expected Move, and Probability of Profit. These metrics are displayed as market context. They are not recommendations to buy or sell.
- **Execution:** Orders are routed through [PARTNER], which is responsible for execution quality, clearing, and settlement.

## 4. Graduated Access (The Graduation Flywheel)

Access expands as a user's account grows **and** their trading record shows disciplined risk management.

| Tier | Account value | Predict stake | Max per order | Access |
|---|---|---|---|---|
| A | Under $2,000 | $20 | $500 | Cash account only (T+1 settlement) |
| B | $2,000 – $9,999 | $100 | $2,500 | Margin eligible, subject to partner approval |
| C | $10,000+ | [TIER C LIMITS] | Partner-defined | Expanded limits, subject to partner approval |

At every tier, no single order may exceed 25% of account equity (the Smart Stake limit, Section 5).

**How graduation works.** The graduation engine reviews two things:

1. Account value.
2. A discipline record: adherence to Smart Stake limits, use of defined exits, and drawdown history.

When a user qualifies, the engine **recommends** them to [PARTNER] for the next tier. [PARTNER] makes the final approval under its own account-approval process and applicable rules. These include the $2,000 minimum equity for margin accounts under FINRA Rule 4210 and options-account approval under FINRA Rule 2360. Margin accounts are also subject to [PARTNER]'s pattern-day-trading policy under current FINRA rules.

## 5. Architecture and Risk Controls

**Non-custodial software.** Trading Simplified does not hold customer money or securities. [PARTNER] performs custody, customer identification (KYC/CIP), and anti-money-laundering monitoring. Trading Simplified [REGISTRATION STATUS].

**Pre-trade risk controls ("Smart Stake").**

- No order may exceed 25% of account equity or the user's tier limit, whichever is lower.
- Orders that exceed the limit are rejected before they leave the platform and are never sent to [PARTNER] or the exchange.
- These controls are designed to complement [PARTNER]'s own pre-trade controls under SEC Rule 15c3-5 (the Market Access Rule).

**Safe-State kill switch.**

- If response time from [PARTNER]'s execution API exceeds 500 ms, the platform stops sending orders and switches to view-only mode. Market data stays available.
- This protects users from executing at stale prices and protects [PARTNER] from orders it cannot risk-check in time.

**Margin events.** If a margin account falls below its maintenance requirement, [PARTNER] handles calls and any liquidation under its disclosed margin policy. Trading Simplified notifies the user in-app as early as possible.

**Tax reporting support.** Users can export cost basis and realized gains and losses at any time. [PARTNER] issues official tax forms (e.g., Form 1099).

## 6. Growth: Viral Pulse

Users can share **Pulse Snapshots** to X with #TradingSimplified. A snapshot is a market-level card, for example "Market says 58% UP on SPY today."

Guardrails, because posts the platform prompts can be treated as the firm's own advertising (FINRA Rule 2210; NFA Rule 2-29):

- Snapshot templates are pre-approved by [PARTNER]'s compliance team.
- Snapshots never show personal profit and loss, win rates, or performance claims.
- Required risk disclosures are attached automatically.
- Sharing is optional, and users are never rewarded for posting.

Viral Pulse gives the platform a low-cost organic acquisition channel alongside paid marketing.

## 7. Partnership and Exit Strategy

Trading Simplified can operate as a white-label onboarding and customer-acquisition channel for a regulated partner: a broker-dealer, futures commission merchant, exchange, or neobank.

What the partner gets:

- New accounts that start with small, fixed-risk positions.
- A documented risk record for every user who reaches margin eligibility.
- An interface and risk-control layer ready to integrate with the partner's existing execution and custody systems.

Paths include licensing, revenue share, or acquisition.

## 8. Revenue Model

**Per-contract fees (PREDICT).** A fixed, disclosed fee per contract, [shared with PARTNER]. Revenue grows with active accounts and with users graduating to the TRADE channel, not with how often any one user trades.

**Order-routing revenue (TRADE channel only).**

- Where [PARTNER] receives payment for order flow on stock or options orders, any share paid to Trading Simplified is disclosed to customers (SEC Rule 606 reports and account disclosures).
- It does not change [PARTNER]'s duty to seek best execution (FINRA Rule 5310).
- Event contracts trade on the exchange and do not generate payment for order flow.

**Premium membership ($9.99/month).**

- Lower fee tiers.
- An automated trading journal.
- Faster access to deposited funds, subject to [PARTNER]'s credit policy.
- Optional seasonal challenges ranked on discipline metrics, not returns, with no cash prizes.

---

## Executive Summary v3.8 — replacement text

### The Core Proposition

Trading Simplified is an onboarding and risk-management platform for regulated firms: clearing firms, brokers, exchanges, and neobanks.

Retail platforms today tend to fall into two groups. Legacy interfaces turn away new investors. Simplified apps make trading easy but offer no structured path to advanced products. Trading Simplified bridges the gap: new investors start with fixed-risk positions and earn expanded access through a documented record of disciplined trading.

### Key Value Drivers

- **Real exchange execution:** Every PREDICT position is a real order on a regulated exchange, routed through our partner and centrally cleared. There is no synthetic betting book.
- **Graduated access:** The "Road to $2K" pipeline (Tiers A–C) expands access only as account value and trading discipline grow. The partner approves every margin upgrade.
- **Built-in risk controls:** Non-custodial architecture, pre-trade Smart Stake limits, and a Safe-State kill switch that pauses order routing when execution latency exceeds 500 ms.
- **Data-driven context:** The Mechanical Data Dashboard (IV Rank, Probability of Profit, Expected Move) gives users market context before every trade.
- **Organic growth:** Viral Pulse lets users share compliance-approved market snapshots (#TradingSimplified), adding a low-cost acquisition channel.

### Revenue

Per-contract fees, disclosed order-routing revenue on the TRADE channel, and a $9.99/month premium membership (see Section 8 of the white paper).

### Conclusion

Trading Simplified gives a regulated partner a ready-to-integrate onboarding channel. It brings in new retail investors, manages their risk from the first trade, and delivers them to margin eligibility with a documented discipline record. We are building the onboarding path the next generation of investors will use, and we are looking for the institutional partner to scale it.

---

## What changed and why

| v3.7 wording | v3.8 wording | Why |
|---|---|---|
| "No custodial, KYC, or AML liability"; "outsourcing custody and compliance risk" | Partner performs custody/KYC/AML; our registration status stated | Taking orders and earning per-contract fees usually requires registration, and registered intermediaries carry AML duties of their own. |
| "Routed directly to the clearinghouse" | Routed through the partner to the exchange, then cleared | Retail orders don't reach a clearinghouse directly. Diligence teams catch this immediately. |
| "Mirrored order for every contract"; "1:1 backing" | Each user position *is* the exchange order; no internal book | A second mirrored order means trading for your own account (dealer activity and a conflict of interest). |
| PFOF on "SPY directional flow" from the Up/Down interface | Order-routing revenue on the TRADE channel only, disclosed | Event contracts must trade on the exchange; PFOF comes with Rule 606 disclosure and best-execution duties. |
| "Conditions traders to follow the house rules," "force discipline," "non-toxic flow," "flow refinery" | "Graduated access," "risk-first onboarding," "documented discipline record" | This language matches what regulators have pursued as gamification and manipulative engagement design. |
| "Transactional velocity scales exponentially" | Revenue grows with active accounts and graduation | Contradicts the discipline story, and invites questions about encouraging overtrading. |
| "Graduation is automated" | Engine recommends; partner approves | Margin and options approval is the broker's decision (FINRA Rules 4210, 2360). |
| "Zero-CAC"; every trade is a social signal | Optional, pre-approved market snapshots; no P&L shared | Posts the firm prompts can count as firm advertising (FINRA 2210, NFA 2-29). |
| "Panic-liquidation protocols" | Partner-handled margin events under its disclosed policy | Liquidation must follow disclosed margin terms; "panic" invites the wrong questions. |
| "Instant deposit clearing" | Faster access to funds, subject to partner credit policy | Trading on unsettled deposits is a form of credit (Reg T). |
| "Competitive seasonal ladders" | Challenges ranked on discipline, not returns, no cash prizes | Return-based leaderboards are a common gamification finding. |
| Tier C "Unlimited Stake" | 25% Smart Stake applies at every tier | Resolves the contradiction with Section 5 (confirm this is your intent). |
| "Turnkey Acquisition Target" | "Strategic Partnership Candidate"; licensing, revenue share, or acquisition | Opens more deal paths and reads less like a sale pitch in a first meeting. |
