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

**Hosted demo:** https://claude.ai/artifact/PNL9tynU4ENZ54jVuu3miM (private until shared from the page's Share menu). `build:artifact` writes `dist-artifact/trading-simplified.html`: app JS and CSS are inlined, and React 18.3.1 loads from cdnjs. Republish that file to update the link.

## Structure

```
src/
  App.jsx                    global state: balance, tier, channel, kill switch, toasts
  data/mock.js               tiers, Smart Stake math, markets, symbols, formatters
  components/
    Header.jsx               balance · tier badge · Road to $2K · Safe-State Kill Switch
    ChannelToggle.jsx        PREDICT / TRADE switch
    PredictChannel.jsx       Velocity Engine: live chart, UP/DOWN $20 stakes, Share to X
    TradeChannel.jsx         Wealth Builder: Mechanical Data Dashboard, order ticket, blotter
    FlywheelPanel.jsx        Graduation Flywheel side panel + demo balance slider
    PriceChart.jsx           dependency-free SVG chart with crosshair tooltip
    Toasts.jsx               success / warning / info notifications
```

## Demo script

1. **PREDICT:** pick a market and tap **UP** or **DOWN**. The tier's stake ($20 at Tier A, $100 at Tier B) plus a disclosed $0.01-per-contract fee comes off the balance. The panel shows that every position is routed through the partner to the exchange and centrally cleared. The share button opens an X post containing market data only, with a risk disclosure.
2. **TRADE:** raise the quantity until the **Smart Stake** meter turns red. The cap is 25% of equity or the tier's per-order limit, whichever is lower. Use **Clamp**, then submit. **Copy cost basis CSV** in the blotter copies a tax-reporting export to the clipboard.
3. **Kill switch:** turn it on in the header. A red View-Only banner appears, execution-API latency jumps above the 500 ms trip point, and every execution button is grayed out.
4. **Graduation Flywheel (balance + discipline + partner approval):**
   - Click the Tier badge, then pick the **$2,450** preset. The balance qualifies, but the tier **does not change**.
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
