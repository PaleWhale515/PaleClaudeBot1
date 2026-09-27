# Trading Simplified — Pitch Prototype

A clickable, high-fidelity React prototype for partner pitches. **Every number is mock data.** Nothing connects to a broker, exchange, or prediction-market venue.

**Stack:** React 18 · Vite 5 · Tailwind CSS 3 · lucide-react

```bash
cd trading-simplified
npm install
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/ (relative paths, host anywhere)
npm run build:artifact   # single self-contained page for claude.ai hosting
```

**Hosted demo:** https://claude.ai/artifact/PNL9tynU4ENZ54jVuu3miM (currently shared as "anyone with the link"). First-time visitors see a partner intro screen. Its choice is remembered per browser, **Overview** reopens it, and adding `#demo` to the link skips it for live pitches. `build:artifact` writes `dist-artifact/trading-simplified.html`: one self-contained page with React, app JS and CSS all inlined (no script CDN), plus a visible fallback message if the app fails to start. Republish that file to update the link.

**Partner deck:** https://claude.ai/artifact/3FsxUgMfgXFGn2PrMfk9Lx, with a versioned copy of its slides in [`deck/`](deck/README.md). The white paper revisions are in [`docs/`](docs/white-paper-v3.8-revisions.md).

## Visual identity

Consumer direction: calm, spacious, and focused on one big number per screen. Tokens live in `src/index.css` (light by default, with a full dark theme that follows the device and can be switched from the header).

| Role | Light | Dark | Use |
|---|---|---|---|
| Brand, cobalt | `#2748D8` | `#8FA3FF` | Main actions, links, selected state |
| Graduation, marigold | `#E9A826` | `#F0B84A` | Road to $2K, tier badges, the logo's top step. Nothing else. |
| Up / down | `#0B7A52` / `#BF3A2B` | `#43C98F` / `#FF7F6E` | Price direction only, always with a word or arrow |
| Paper, ink | `#F3F4F0`, `#151B22` | `#0F1216`, `#EEF0F2` | Backgrounds and text |

Type: **Bricolage Grotesque** for headlines and big numbers, **Figtree** for everything else. The logo is three ascending steps (Tiers A, B and C), with the top step in marigold. Every text color meets WCAG AA contrast (4.5:1) in both themes, and no text is smaller than 12 px.

## Structure

```
src/
  App.jsx                    global state: balance, tier, channel, kill switch, toasts
  data/mock.js               tiers, Smart Stake math, markets, symbols, formatters
  data/options.js            SPY options engine: Black-Scholes pricing and Greeks, Probability Slider strike selection, payoffs
  components/
    Header.jsx               logo, Predict/Trade switch, balance with Road to $2K, theme toggle, Safe-State status
    ChannelToggle.jsx        Predict / Trade / Journal & Ladders tabs
    Logo.jsx                 three-step mark and wordmark
    PredictChannel.jsx       Velocity Engine: live chart, UP/DOWN $20 stakes, Share to X
    TradeChannel.jsx         Trade: SPY chart, market context, Probability Slider ticket (Simplified / Detailed), options positions, order history
    PayoffChart.jsx          profit or loss at expiration by SPY price
    JournalChannel.jsx       Journal & Ladders: locked, blurred preview with the $9.99/month Plus upsell
    InfoTip.jsx              accessible info tooltip (Discipline Score)
    FlywheelPanel.jsx        "Your path" drawer: next-tier checklist, discipline check, tiers, demo controls
    PriceChart.jsx           dependency-free SVG chart with crosshair tooltip
    IntroScreen.jsx          partner-facing overview shown on first visit
    Toasts.jsx               success / warning / info notifications
```

## Demo script

1. **PREDICT:** pick a market and tap **UP** or **DOWN**. The tier's stake ($20 at Tier A, $100 at Tier B) plus a disclosed $0.01-per-contract fee comes off the balance. The panel shows that every position is routed through the partner to the exchange and centrally cleared. The share button opens an X post containing market data only, with a risk disclosure.
2. **TRADE (SPY options, the Probability Slider):**
   - Apply for options trading (tick the options risk disclosure, then submit). Approval takes a moment.
   - Pick **Up**, **Down** or **Stay in range**, an expiration from today (0DTE) to 1 year, and an estimated chance of profit from 1% to 99%. The engine picks the strikes: below 50% it buys a call, put or butterfly; from 50% up it sells a put spread, call spread or iron condor.
   - "You could make" and "You could lose" always show side by side, with a payoff chart. **Detailed** adds legs, spread width, IV and Greeks.
   - On Tier A only single calls and puts are allowed; the 50–99% side (spreads) unlocks at Tier B. Smart Stake caps each trade's maximum loss.
   - Positions support **Reverse position** (Up ↔ Down at the same chance and expiry; in-range trades can't be reversed), **Close**, and **Close all positions**, each with a confirmation.
   - Every trade has a **System-Enforced Stop-Loss** (locked; half the premium for bought options, twice the credit for sold spreads). It updates as you drag the slider, and closes positions automatically on a price tick when hit.
   - **Copy cost basis (CSV)** copies order history with realized gains and losses.
3. **Safe-State (automatic):** open **Your path** and tick **Simulate a slow connection**. Latency jumps above 500 ms, trading pauses on its own, and the header shows "Trading paused". Untick it: trading resumes after 5 healthy seconds. Customers never see a switch.
4. **Journal & Ladders:** the third tab is locked and blurred behind a Plus upsell ($9.99/month). **Upgrade** shows where checkout would open.
5. **Graduation (balance + Discipline Score + partner approval):** the header shows **Discipline Score: 92/100 - Excellent** with a tooltip; margin needs $2,000 **and** a score above 85. The score has five factors (position sizing 20, planned exits 25, drawdown 20, trade frequency 15, consistency 20); sizing, exits and frequency come from the user's real orders. **Your path** shows each factor's points.
   - Click the balance in the header to open **Your path**, then pick the **$2,450** preset. The balance qualifies, but the tier **does not change**.
   - Tick **Simulate a discipline gap** (oversized trades, skipped exit plans): the score drops to 73 and the submit button stays locked, even with the balance met.
   - Untick it, then click **Submit for Tier B approval**. After a short simulated review, the partner approves Tier B and margin unlocks on the ticket.
   - If the balance later falls below $2,000, limits drop back to Tier A automatically.

## Tier rules (white paper v3.8)

| Tier | Account value | Predict stake | Max per order | Access |
|---|---|---|---|---|
| A | < $2,000 | $20 | $500 | Cash account; buy single calls and puts once options are approved |
| B | $2,000 – $9,999 | $100 | $2,500 | Margin and spreads, partner approval |
| C | $10,000+ | $500 *(placeholder for [TIER C LIMITS])* | Partner-defined | Expanded limits, partner approval |

The 25% Smart Stake cap applies at every tier, to predictions and options alike. It limits *new* risk (an option trade's maximum loss); closing a position is never blocked. A user's effective tier is the lower of what the partner approved and what their balance supports. `[PARTNER]` appears in the UI wherever the production partner's name belongs.

Margin approval in a live account is the partner's decision under FINRA Rule 4210 ($2,000 minimum equity) and Rule 2360 (options). Check current FINRA, SEC, and CFTC rules before any live build.
