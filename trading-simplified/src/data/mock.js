// All figures in this file are mock data for demo purposes only.

export const STARTING_BALANCE = 1482.5;
export const GRADUATION_TARGET = 2000;
export const SMART_STAKE_PCT = 0.25;

// Tier policy per Trading Simplified white paper v3.8. Balance makes a user
// eligible; the discipline audit must pass and the partner must approve.
export const TIERS = [
  {
    id: 'A',
    name: 'Tier A',
    title: 'Starter',
    min: 0,
    max: 1999.99,
    range: '< $2,000',
    predictStake: 20,
    maxStake: 500,
    margin: false,
    perks: ['Cash account, trades settle next business day', '$20 per prediction', 'Up to $500 per order'],
  },
  {
    id: 'B',
    name: 'Tier B',
    title: 'Margin',
    min: 2000,
    max: 9999.99,
    range: '$2,000 – $9,999',
    predictStake: 100,
    maxStake: 2500,
    margin: true,
    perks: ['Margin, once the partner approves', '$100 per prediction', 'Up to $2,500 per order'],
  },
  {
    id: 'C',
    name: 'Tier C',
    title: 'Advanced',
    min: 10000,
    max: Infinity,
    range: '$10,000+',
    // v3.8 leaves Tier C Predict sizing as [TIER C LIMITS] — placeholder.
    predictStake: 500,
    maxStake: null,
    margin: true,
    perks: ['Higher limits, once the partner approves', 'Order limits set by the partner', 'The 25% Smart Stake cap still applies'],
  },
];

/** Partner execution-API latency above this trips the Safe-State kill switch. */
export const KILL_SWITCH_MS = 500;

/** Disclosed per-contract fee on PREDICT (mock). */
export const PREDICT_FEE_PER_CONTRACT = 0.01;

/** Mock discipline audit. `gap` simulates a user who fails one check. */
export function disciplineAudit(gap = false) {
  return [
    { label: 'Stayed within Smart Stake limits', value: '100%', pass: true },
    { label: 'Orders with a planned exit', value: gap ? '71%' : '92%', pass: !gap, need: 'Needs 80%' },
    { label: 'Largest drop in 30 days', value: '−6.4%', pass: true, need: 'Limit 15%' },
    { label: 'Active trading days', value: '19 of 21', pass: true },
  ];
}

export function tierFor(balance) {
  return TIERS.find((t) => balance >= t.min && balance <= t.max) ?? TIERS[TIERS.length - 1];
}

/** Max notional per order: 25% of equity, further capped by the tier's hard limit. */
export function smartStakeCap(balance, tier = tierFor(balance)) {
  const pctCap = balance * SMART_STAKE_PCT;
  return tier.maxStake ? Math.min(pctCap, tier.maxStake) : pctCap;
}

export const PREDICT_MARKETS = [
  {
    id: 'spy-close',
    label: 'SPY today',
    symbol: 'SPY',
    title: 'Will SPY close higher today?',
    subtitle: 'Compared with yesterday’s close of $656.42. Settles at 4:00 p.m. ET.',
    base: 658.1,
    vol: 0.35,
    upPrice: 0.57,
    volume: '$4.21M',
    expiresIn: 3 * 3600 + 42 * 60,
  },
  {
    id: 'ndx-hour',
    label: 'Nasdaq this hour',
    symbol: 'NDX',
    title: 'Will the Nasdaq-100 rise this hour?',
    subtitle: 'Compared with this hour’s open of 24,318.40.',
    base: 24331.2,
    vol: 6,
    upPrice: 0.52,
    volume: '$1.87M',
    expiresIn: 38 * 60,
  },
  {
    id: 'btc-15',
    label: 'Bitcoin, 15 min',
    symbol: 'BTC',
    title: 'Will Bitcoin be higher in 15 minutes?',
    subtitle: 'Compared with the reference price of $112,480.',
    base: 112520,
    vol: 45,
    upPrice: 0.49,
    volume: '$2.96M',
    expiresIn: 11 * 60 + 20,
  },
  {
    id: 'cpi',
    label: 'Core inflation',
    symbol: 'CPI',
    title: 'Will core inflation beat 0.3% this month?',
    subtitle: 'Settles when the Bureau of Labor Statistics publishes CPI.',
    base: 0.31,
    vol: 0.004,
    upPrice: 0.44,
    volume: '$6.02M',
    expiresIn: 2 * 86400 + 5 * 3600,
  },
];

export const TRADE_SYMBOLS = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', price: 658.14, change: 0.26, ivRank: 43, expectedMove: 5.38, pop: 67, iv: 14.2, beta: 1.0 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 592.44, change: 0.41, ivRank: 37, expectedMove: 7.12, pop: 63, iv: 17.8, beta: 1.12 },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 241.37, change: -0.62, ivRank: 52, expectedMove: 6.23, pop: 61, iv: 24.5, beta: 1.21 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 178.92, change: 1.84, ivRank: 71, expectedMove: 9.84, pop: 57, iv: 41.3, beta: 1.74 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 402.15, change: -1.12, ivRank: 63, expectedMove: 24.61, pop: 54, iv: 52.9, beta: 2.05 },
];

/** Seeded random walk so charts are stable between renders. */
export function makeSeries(seed, base, vol, points = 90) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const out = [];
  let v = base - vol * 6;
  for (let i = 0; i < points; i++) {
    v += (rand() - 0.46) * vol;
    out.push(v);
  }
  // pin the last point to the quoted price
  const shift = base - out[out.length - 1];
  return out.map((x) => x + shift);
}

export function seedFrom(str) {
  let h = 7;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 2147483647;
  return h || 1;
}

export const fmtUSD = (n, digits = 2) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtNum = (n, digits = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function fmtCountdown(sec) {
  if (sec <= 0) return 'Settling';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
