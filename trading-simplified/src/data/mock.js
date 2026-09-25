// All figures in this file are mock data for demo purposes only.

export const STARTING_BALANCE = 1482.5;
export const GRADUATION_TARGET = 2000;
export const SMART_STAKE_PCT = 0.25;
export const PREDICT_STAKE = 20;

export const TIERS = [
  {
    id: 'A',
    name: 'Tier A',
    title: 'Foundation',
    min: 0,
    max: 1999.99,
    range: '< $2,000',
    maxStake: 500,
    margin: false,
    perks: ['Cash account only', 'Max stake $500 per order', 'Predict + Trade channels'],
  },
  {
    id: 'B',
    name: 'Tier B',
    title: 'Margin',
    min: 2000,
    max: 9999.99,
    range: '$2,000 – $9,999',
    maxStake: null,
    margin: true,
    perks: ['Margin enabled (2:1 overnight)', 'Smart Stake at 25% of equity', 'Defined-risk options spreads'],
  },
  {
    id: 'C',
    name: 'Tier C',
    title: 'Institutional',
    min: 10000,
    max: Infinity,
    range: '$10,000+',
    maxStake: null,
    margin: true,
    perks: ['Institutional position limits', 'Priority routing & API access', 'Portfolio-level risk analytics'],
  },
];

export function tierFor(balance) {
  return TIERS.find((t) => balance >= t.min && balance <= t.max) ?? TIERS[TIERS.length - 1];
}

/** Max notional per order: 25% of equity, further capped by the tier's hard limit. */
export function smartStakeCap(balance) {
  const tier = tierFor(balance);
  const pctCap = balance * SMART_STAKE_PCT;
  return tier.maxStake ? Math.min(pctCap, tier.maxStake) : pctCap;
}

export const PREDICT_MARKETS = [
  {
    id: 'spy-close',
    symbol: 'SPY',
    title: 'SPY closes higher today?',
    subtitle: 'Settles 4:00 PM ET vs. prior close $656.42',
    base: 658.1,
    vol: 0.35,
    upPrice: 0.57,
    volume: '$4.21M',
    expiresIn: 3 * 3600 + 42 * 60,
  },
  {
    id: 'ndx-hour',
    symbol: 'NDX',
    title: 'Nasdaq-100 up this hour?',
    subtitle: 'Settles top of the hour vs. open 24,318.40',
    base: 24331.2,
    vol: 6,
    upPrice: 0.52,
    volume: '$1.87M',
    expiresIn: 38 * 60,
  },
  {
    id: 'btc-15',
    symbol: 'BTC',
    title: 'Bitcoin up in 15 minutes?',
    subtitle: 'Settles vs. reference $112,480',
    base: 112520,
    vol: 45,
    upPrice: 0.49,
    volume: '$2.96M',
    expiresIn: 11 * 60 + 20,
  },
  {
    id: 'cpi',
    symbol: 'CPI',
    title: 'Core CPI MoM above 0.3%?',
    subtitle: 'Event contract · settles on BLS release',
    base: 0.31,
    vol: 0.004,
    upPrice: 0.44,
    volume: '$6.02M',
    expiresIn: 2 * 86400 + 5 * 3600,
  },
];

export const TRADE_SYMBOLS = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', price: 658.1, change: 0.26, ivRank: 45, expectedMove: 5.5, pop: 68, iv: 14.2, beta: 1.0 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 592.44, change: 0.41, ivRank: 38, expectedMove: 7.1, pop: 64, iv: 17.8, beta: 1.12 },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 241.3, change: -0.62, ivRank: 52, expectedMove: 6.2, pop: 61, iv: 24.5, beta: 1.21 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 178.92, change: 1.84, ivRank: 71, expectedMove: 9.8, pop: 57, iv: 41.3, beta: 1.74 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 402.15, change: -1.12, ivRank: 63, expectedMove: 24.6, pop: 55, iv: 52.9, beta: 2.05 },
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
