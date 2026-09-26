# Partner deck

Source files for the Trading Simplified partner deck (13 slides, 16:9).

**Live deck:** https://claude.ai/artifact/3FsxUgMfgXFGn2PrMfk9Lx (private until shared from its Share menu). It is built from the claude.ai Slides type, and these files are a versioned copy of its content.

```
deck/
  deck.json          slide order, outline sections, typefaces (Bricolage Grotesque, Figtree)
  slides/<id>.html   one <section> per slide, 1920×1080, inline styles only; speaker notes in <aside>
```

| # | Slide | What it covers |
|---|---|---|
| 1 | `cover` | Thesis: the on-ramp from first trade to margin-ready |
| 2 | `gap` | Legacy broker apps vs simplified apps vs our path |
| 3 | `how` | Predict, Trade, Graduate |
| 4 | `predict` | Order flow: user → Smart Stake → partner → exchange → clearing; $20 / $100 stakes |
| 5 | `trade` | Market context metrics; ticket rules incl. Reverse / Close / Close all |
| 6 | `graduation` | Three gates and the tier table |
| 7 | `controls` | Smart Stake, Safe-State switch, partner approval, non-custodial |
| 8 | `statement` | "Every position is a real exchange order." |
| 9 | `growth` | Pulse Snapshot and sharing guardrails |
| 10 | `revenue` | Per-contract fee, order-routing revenue (Trade only), $9.99 membership |
| 11 | `partner` | What the partner gets; deal paths |
| 12 | `demo` | Four-step live demo with a link to the prototype |
| 13 | `next` | Next steps and contact |

**Placeholders to fill before sending:** `[Presenter name]`, `[Title]`, `[Month]`, `[PARTNER]`, `[e.g., CME Group]`, `[REGISTRATION STATUS]`, the `[$__]` fee (slides 4 and 10), `[TIER C]`, `[Shared with PARTNER.]`, `[scope]`, `[target date]`, `[Name]`, `[email]`, `[phone]`.

**Keeping the two in sync:** edits made in the live deck are not written back here automatically. After editing there, ask Claude to copy the live deck into this folder again (or republish from these files to push repo edits to the live deck).
