// Position math for the TRADE channel (mock fills, average-cost accounting).
// Quantities are signed: positive = long, negative = short.
import { fmtUSD } from './mock.js';

const round3 = (n) => Math.round(n * 1000) / 1000;

/**
 * Apply a fill of `signedQty` shares at `price` to `holdings` ({ [symbol]: { qty, avg } }).
 * Returns the new holdings and the realized P&L from any shares closed.
 */
export function applyFill(holdings, symbol, signedQty, price) {
  const { qty: q0 = 0, avg: a0 = 0 } = holdings[symbol] ?? {};
  const newQty = round3(q0 + signedQty);
  let avg = a0;
  let realized = 0;

  if (q0 === 0 || Math.sign(q0) === Math.sign(signedQty)) {
    avg = (q0 * a0 + signedQty * price) / newQty;
  } else {
    const closed = Math.min(Math.abs(signedQty), Math.abs(q0));
    realized = closed * (price - a0) * Math.sign(q0);
    if (newQty !== 0 && Math.sign(newQty) !== Math.sign(q0)) avg = price; // crossed through zero
  }

  const next = { ...holdings };
  if (newQty === 0) delete next[symbol];
  else next[symbol] = { qty: newQty, avg };
  return { holdings: next, realized };
}

/**
 * Shares of NEW risk an order adds. Closing or reducing a position adds none;
 * crossing through zero counts the whole new position.
 */
export function newRiskQty(held, signedQty) {
  const after = round3(held + signedQty);
  if (held === 0 || Math.sign(after) === Math.sign(held)) return Math.max(0, Math.abs(after) - Math.abs(held));
  return Math.abs(after);
}

/** Why reversing this position is blocked, or null when it's allowed. */
export function reverseBlockReason({ qty, mark, cap, tier, killSwitch }) {
  if (killSwitch) return 'Trading is paused.';
  if (qty > 0 && !tier.margin) return 'Going short needs a margin account (Tier B, with partner approval).';
  const newRisk = Math.abs(qty) * mark;
  if (newRisk > cap) return `The reversed position would be about ${fmtUSD(newRisk)}, over your ${fmtUSD(cap)} Smart Stake limit.`;
  return null;
}
