// SPY options engine for the Probability Slider (mock data, Black-Scholes pricing).
// The user picks a direction, an expiration and a target chance of profit; the engine
// mechanically picks the strikes. Below 50% it buys a single option (or a butterfly for
// "in range"); from 50% up it sells a defined-risk spread (or an iron condor).

const R = 0.04; // risk-free rate
const MULT = 100; // shares per contract

export const EXPIRATIONS = [0, 1, 2, 3, 4, 7, 14, 21, 30, 45, 60, 90, 120, 180, 270, 365];
export const WIDTHS = [1, 2, 5, 10, 25];
export const DIRECTIONS = [
  { id: 'up', label: 'Up', hint: 'SPY finishes higher' },
  { id: 'down', label: 'Down', hint: 'SPY finishes lower' },
  { id: 'range', label: 'Stay in range', hint: 'SPY stays near today' },
];

/** Years to expiration. 0DTE uses the hours left in today's session. */
export function yearsFor(days) {
  return days === 0 ? 3.7 / 24 / 365 : days / 365;
}

export function expiryLabel(days) {
  if (days === 0) return 'Today (0DTE)';
  if (days === 1) return 'Tomorrow';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return '1 year';
}

const erf = (x) => {
  // Abramowitz & Stegun 7.1.26
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
};
const N = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
const pdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

/** At-the-money IV for an expiration: short-dated options carry a little more. */
export function atmIv(baseIv, days) {
  const term = days < 1 ? 1.18 : 1 + 0.12 * Math.exp(-days / 20) + 0.04 * Math.min(days / 365, 1);
  return baseIv * term;
}

/** IV with a mild put skew, measured in standard deviations from spot. */
function ivAt(S, K, T, atm) {
  const z = Math.log(K / S) / (atm * Math.sqrt(T));
  return Math.min(atm * 2.5, Math.max(atm * 0.6, atm * (1 - 0.06 * z + 0.015 * z * z)));
}

/** Black-Scholes price and Greeks for one option. */
export function price(type, S, K, T, iv) {
  if (T <= 0) return { px: Math.max(0, type === 'call' ? S - K : K - S), delta: 0, gamma: 0, theta: 0, vega: 0, iv };
  const sq = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (R + (iv * iv) / 2) * T) / (iv * sq);
  const d2 = d1 - iv * sq;
  const disc = Math.exp(-R * T);
  const call = type === 'call';
  const px = call ? S * N(d1) - K * disc * N(d2) : K * disc * N(-d2) - S * N(-d1);
  const common = (-S * pdf(d1) * iv) / (2 * sq);
  return {
    px: Math.max(0.01, px),
    delta: call ? N(d1) : N(d1) - 1,
    gamma: pdf(d1) / (S * iv * sq),
    theta: (call ? common - R * K * disc * N(d2) : common + R * K * disc * N(-d2)) / 365,
    vega: (S * pdf(d1) * sq) / 100,
    iv,
  };
}

/** Risk-neutral chance SPY finishes above X at expiration. */
function probAbove(S, X, T, iv) {
  if (X <= 0) return 1;
  return N((Math.log(S / X) + (R - (iv * iv) / 2) * T) / (iv * Math.sqrt(T)));
}

const round2 = (n) => Math.round(n * 100) / 100;

function leg(side, type, strike, S, T, atm, qty = 1) {
  const p = price(type, S, strike, T, ivAt(S, strike, T, atm));
  return { side, type, strike, qty, price: round2(p.px), greeks: p };
}

/** Value of holding the legs (debit positive), per share. */
function holdValue(legs) {
  return legs.reduce((sum, l) => sum + (l.side === 'buy' ? 1 : -1) * l.qty * l.price, 0);
}

function finish(kind, direction, legs, S, T, atm, extra) {
  const cost = round2(holdValue(legs)); // >0 debit paid, <0 credit received
  const greeks = legs.reduce(
    (g, l) => {
      const s = (l.side === 'buy' ? 1 : -1) * l.qty * MULT;
      g.delta += s * l.greeks.delta;
      g.gamma += s * l.greeks.gamma;
      g.theta += s * l.greeks.theta;
      g.vega += s * l.greeks.vega;
      return g;
    },
    { delta: 0, gamma: 0, theta: 0, vega: 0 },
  );
  return { kind, direction, legs, cost, greeks, iv: atm, ...extra({ cost }) };
}

// ---- structures ----------------------------------------------------------

function longSingle(type, direction, S, T, atm, K) {
  const legs = [leg('buy', type, K, S, T, atm)];
  return finish(type === 'call' ? 'Long call' : 'Long put', direction, legs, S, T, atm, ({ cost }) => {
    const be = type === 'call' ? K + cost : K - cost;
    const pop = type === 'call' ? probAbove(S, be, T, atm) : 1 - probAbove(S, be, T, atm);
    return { pop, breakevens: [be], maxLoss: cost * MULT, maxProfit: type === 'call' ? Infinity : be * MULT, spreadNeeded: false };
  });
}

function creditVertical(type, direction, S, T, atm, K, W) {
  const far = type === 'put' ? K - W : K + W;
  const legs = [leg('sell', type, K, S, T, atm), leg('buy', type, far, S, T, atm)];
  return finish(type === 'put' ? 'Put credit spread' : 'Call credit spread', direction, legs, S, T, atm, ({ cost }) => {
    const credit = -cost;
    const be = type === 'put' ? K - credit : K + credit;
    const pop = type === 'put' ? probAbove(S, be, T, atm) : 1 - probAbove(S, be, T, atm);
    return { pop, breakevens: [be], maxLoss: (W - credit) * MULT, maxProfit: credit * MULT, spreadNeeded: true, width: W };
  });
}

function ironCondor(S, T, atm, d, W) {
  const kp = Math.floor(S - d);
  const kc = Math.ceil(S + d);
  const legs = [leg('buy', 'put', kp - W, S, T, atm), leg('sell', 'put', kp, S, T, atm), leg('sell', 'call', kc, S, T, atm), leg('buy', 'call', kc + W, S, T, atm)];
  return finish('Iron condor', 'range', legs, S, T, atm, ({ cost }) => {
    const credit = -cost;
    const lo = kp - credit;
    const hi = kc + credit;
    return { pop: probAbove(S, lo, T, atm) - probAbove(S, hi, T, atm), breakevens: [lo, hi], maxLoss: (W - credit) * MULT, maxProfit: credit * MULT, spreadNeeded: true, width: W };
  });
}

function butterfly(S, T, atm, w) {
  const c = Math.round(S);
  const legs = [leg('buy', 'call', c - w, S, T, atm), leg('sell', 'call', c, S, T, atm, 2), leg('buy', 'call', c + w, S, T, atm)];
  return finish('Call butterfly', 'range', legs, S, T, atm, ({ cost }) => {
    const debit = Math.max(0.01, cost);
    const lo = c - w + debit;
    const hi = c + w - debit;
    const pop = hi > lo ? probAbove(S, lo, T, atm) - probAbove(S, hi, T, atm) : 0;
    return { pop, breakevens: [lo, hi], maxLoss: debit * MULT, maxProfit: (w - debit) * MULT, spreadNeeded: true, width: w };
  });
}

/** Default spread width for an expiration: wider for longer-dated trades. */
export function defaultWidth(days) {
  return days <= 7 ? 2 : days <= 45 ? 5 : 10;
}

/**
 * Pick the structure whose chance of profit is closest to `target` (0-1).
 * `width` applies to spreads; pass null for the default.
 */
export function buildTrade({ S, baseIv, days, direction, target, width }) {
  const T = yearsFor(days);
  const atm = atmIv(baseIv, days);
  const sd = S * atm * Math.sqrt(T);
  const lo = Math.max(1, Math.floor(S - 5 * sd));
  const hi = Math.ceil(S + 5 * sd);
  const W = width ?? defaultWidth(days);
  const candidates = [];

  if (target < 0.5) {
    if (direction === 'up') for (let k = lo; k <= hi; k++) candidates.push(longSingle('call', 'up', S, T, atm, k));
    else if (direction === 'down') for (let k = lo; k <= hi; k++) candidates.push(longSingle('put', 'down', S, T, atm, k));
    else for (let w = 1; w <= Math.max(2, Math.ceil(3 * sd)); w++) candidates.push(butterfly(S, T, atm, w));
  } else if (direction === 'up') {
    for (let k = lo; k <= Math.ceil(S + sd); k++) candidates.push(creditVertical('put', 'up', S, T, atm, k, W));
  } else if (direction === 'down') {
    for (let k = Math.floor(S - sd); k <= hi; k++) candidates.push(creditVertical('call', 'down', S, T, atm, k, W));
  } else {
    for (let d = 0; d <= 5 * sd; d += 1) candidates.push(ironCondor(S, T, atm, d, W));
  }

  // Credits must be positive and max loss real; drop degenerate strikes.
  // Every trade must move real premium (at least $0.01) and have a real max loss.
  const valid = candidates.filter((c) => c.maxLoss > 0 && Math.abs(c.cost) >= 0.01 && c.maxProfit > 0 && c.pop > 0 && c.pop < 1);
  const best = valid.reduce((a, b) => (Math.abs(b.pop - target) < Math.abs(a.pop - target) ? b : a), valid[0]);
  return { ...best, days, T, atm, expectedMove: sd, target };
}

/** Current value of held legs (debit-positive, per share) at spot S. */
export function markLegs(legs, S, days, baseIv) {
  const T = yearsFor(days);
  const atm = atmIv(baseIv, days);
  return round2(legs.reduce((sum, l) => sum + (l.side === 'buy' ? 1 : -1) * l.qty * price(l.type, S, l.strike, T, ivAt(S, l.strike, T, atm)).px, 0));
}

/** P&L per contract at expiration for SPY = x. */
export function payoffAt(trade, x) {
  const intrinsic = trade.legs.reduce((sum, l) => {
    const v = l.type === 'call' ? Math.max(0, x - l.strike) : Math.max(0, l.strike - x);
    return sum + (l.side === 'buy' ? 1 : -1) * l.qty * v;
  }, 0);
  return (intrinsic - trade.cost) * MULT;
}

/** Short names like "SPY 650/648 put credit spread". */
export function tradeName(t) {
  const strikes = [...new Set(t.legs.map((l) => l.strike))].join('/');
  return `SPY ${strikes} ${t.kind.toLowerCase()}`;
}

/** The same trade pointing the other way (Up <-> Down), at the same chance, expiry and width. */
export function mirrorOf(trade, S, baseIv) {
  return buildTrade({ S, baseIv, days: trade.days, direction: trade.direction === 'up' ? 'down' : 'up', target: trade.target, width: trade.width ?? null });
}

export { MULT as CONTRACT_MULTIPLIER };
