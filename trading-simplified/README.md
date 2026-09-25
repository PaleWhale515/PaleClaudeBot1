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

**Hosted demo:** https://claude.ai/artifact/PNL9tynU4ENZ54jVuu3miM (private until shared from the page's Share menu). First-time visitors see a partner intro screen. Its choice is remembered per browser, **Overview** reopens it, and adding `#demo` to the link skips it for live pitches. `build:artifact` writes `dist-artifact/trading-simplified.html`: one self-contained page with React, app JS and CSS all inlined (no script CDN), plus a visible fallback message if the app fails to start. Republish that file to update the link.

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
  data/positions.js          fills, average cost, new-risk math, reverse eligibility
  components/
    Header.jsx               logo, Predict/Trade switch, balance with Road to $2K, theme toggle, Safe-State switch
    ChannelToggle.jsx        Predict / Trade segmented control
    Logo.jsx                 three-step mark and wordmark
    PredictChannel.jsx       Velocity Engine: live chart, UP/DOWN $20 stakes, Share to X
    TradeChannel.jsx         Trade: price and chart, market context, positions (Reverse / Close / Close all), order history, order ticket
    FlywheelPanel.jsx        "Your path" drawer: next-tier checklist, discipline check, tiers, demo controls
    PriceChart.jsx           dependency-free SVG chart with crosshair tooltip
    IntroScreen.jsx          partner-facing overview shown on first visit
    Toasts.jsx               success / warning / info notifications
```

## Demo script

1. **PREDICT:** pick a market and tap **UP** or **DOWN**. The tier's stake ($20 at Tier A, $100 at Tier B) plus a disclosed $0.01-per-contract fee comes off the balance. The panel shows that every position is routed through the partner to the exchange and centrally cleared. The share button opens an X post containing market data only, with a risk disclosure.
2. **TRADE:** add shares until the **Smart Stake** meter turns red. It caps the *new risk* an order adds at 25% of the balance or the tier's per-order limit, whichever is lower. Closing or reducing a position is never capped. Use **Clamp**, then submit. In the demo, orders fill right away and prices drift gently, so positions show live P&L.
   - **Reverse position** (on each row of *Your positions*) flips long to short, or short to long, after an inline confirmation. Going short needs a margin account, so on Tier A (or before the partner approves Tier B) clicking it explains why and offers **See how to unlock margin**. It also explains when the flipped position would exceed the Smart Stake limit.
   - **Close** (on each row) sells or buys back just that position after a confirmation that shows the P&L you'd realize.
   - **Close all positions** sells or covers everything at the current price, after a confirmation step, and adds the realized P&L to the balance.
   - On a cash account, the ticket won't sell more shares than you own (no short sales without margin).
   - **Copy cost basis (CSV)** copies the order history for tax reporting.
3. **Kill switch:** turn it on in the header. A red View-Only banner appears, execution-API latency jumps above the 500 ms trip point, and every execution button is grayed out.
4. **Graduation (balance + discipline + partner approval):**
   - Click the balance in the header to open **Your path**, then pick the **$2,450** preset. The balance qualifies, but the tier **does not change**.
   - Tick **Simulate a discipline gap** to show that balance alone is not enough: the submit button stays locked.
   - Untick it, then click **Submit for Tier B approval**. After a short simulated review, the partner approves Tier B and margin unlocks on the ticket.
   - If the balance later falls below $2,000, limits drop back to Tier A automatically.

## Tier rules (white paper v3.8)

| Tier | Account value | Predict stake | Max per order | Access |
|---|---|---|---|---|
| A | < $2,000 | $20 | $500 | Cash account only (T+1) |
| B | $2,000 – $9,999 | $100 | $2,500 | Margin eligible, partner approval |
| C | $10,000+ | $500 *(placeholder for [TIER C LIMITS])* | Partner-defined | Expanded limits, partner approval |

The 25% Smart Stake cap applies at every tier. A user's effective tier is the lower of what the partner approved and what their balance supports. `[PARTNER]` appears in the UI wherever the production partner's name belongs.

Margin approval in a live account is the partner's decision under FINRA Rule 4210 ($2,000 minimum equity) and Rule 2360 (options). Check current FINRA, SEC, and CFTC rules before any live build.
