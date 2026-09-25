# Trading Simplified — Pitch Prototype

A clickable, high-fidelity React prototype for partner pitches. **Every number is mock data.** Nothing connects to a broker, exchange, or prediction-market venue.

**Stack:** React 18 · Vite 5 · Tailwind CSS 3 · lucide-react

```bash
cd trading-simplified
npm install
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/ (relative paths, host anywhere)
```

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

1. **PREDICT:** pick a market and tap **UP** or **DOWN**. The tier's stake ($20 at Tier A, $100 at Tier B) comes off the balance, a toast confirms it, and the contract appears under *Open Contracts*. The share icon opens an X composer.
2. **TRADE:** raise the quantity until the **Smart Stake** meter turns red. The cap is 25% of equity, and Tier A also has a hard cap of $500. Use **Clamp**, then submit. Fractional shares are supported, so a Tier A balance can still buy SPY.
3. **Kill switch:** turn it on in the header. A red "API Latency: View-Only Mode" banner appears, latency jumps above the 500 ms trip point, and every execution button is grayed out.
4. **Graduation Flywheel:** click the Tier badge. Use the demo slider or the $2,450 / $12,800 presets to show graduation. Margin unlocks on the ticket at Tier B.

## Tier rules (white paper v3.7)

| Tier | Account value | Predict stake | Max Trade stake | Access |
|---|---|---|---|---|
| A | < $2,000 | $20 | $500 | Cash only (T+1) |
| B | $2,000 – $9,999 | $100 | $2,500 | Margin enabled |
| C | $10,000+ | $500 *(placeholder)* | No tier cap | Institutional limits |

The 25% Smart Stake cap applies at every tier, including Tier C. The white paper's tier table says "Unlimited Stake" for Tier C, but section 5 says the 25% limit is hard-coded for every order. The prototype follows section 5 until that's settled. The Safe-State kill switch trips when clearing-API latency is above 500 ms.

The Tier B line lines up with FINRA Rule 4210's $2,000 minimum equity for margin accounts. Check current FINRA, SEC, and CFTC rules before any live build.
