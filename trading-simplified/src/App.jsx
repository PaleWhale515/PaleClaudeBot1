import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import PredictChannel from './components/PredictChannel.jsx';
import TradeChannel from './components/TradeChannel.jsx';
import FlywheelPanel from './components/FlywheelPanel.jsx';
import Toasts from './components/Toasts.jsx';
import IntroScreen from './components/IntroScreen.jsx';
import { KILL_SWITCH_MS, PREDICT_FEE_PER_CONTRACT, STARTING_BALANCE, TIERS, TRADE_SYMBOLS, disciplineAudit, fmtNum, fmtUSD, liveMark, tierFor } from './data/mock.js';
import { applyFill } from './data/positions.js';

const INTRO_KEY = 'ts-intro-seen';

// Intro shows on first visit; a #demo link skips it (for live pitches).
function shouldShowIntro() {
  if (typeof window === 'undefined') return false;
  if (window.location.hash === '#demo') return false;
  try {
    return window.localStorage.getItem(INTRO_KEY) !== '1';
  } catch {
    return true;
  }
}

const THEME_KEY = 'ts-theme';

// Follows the viewer's saved choice, then the host page's theme, then the OS.
function initialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable */
  }
  const stamped = document.documentElement.getAttribute('data-theme');
  if (stamped === 'light' || stamped === 'dark') return stamped;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });

export default function App() {
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [channel, setChannel] = useState('predict');
  const [killSwitch, setKillSwitch] = useState(false);
  const [flywheelOpen, setFlywheelOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(shouldShowIntro);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [holdings, setHoldings] = useState({});
  const [toasts, setToasts] = useState([]);
  const [latency, setLatency] = useState(18);
  const [theme, setTheme] = useState(initialTheme);
  const [priceTick, setPriceTick] = useState(0);
  const marks = Object.fromEntries(TRADE_SYMBOLS.map((q) => [q.symbol, liveMark(q, priceTick)]));

  useEffect(() => {
    const t = setInterval(() => setPriceTick((n) => n + 1), 1500);
    return () => clearInterval(t);
  }, []);
  const [approvedTierId, setApprovedTierId] = useState(tierFor(STARTING_BALANCE).id);
  const [approvalPending, setApprovalPending] = useState(false);
  const [disciplineGap, setDisciplineGap] = useState(false);
  const prevTier = useRef(approvedTierId);
  const wasEligible = useRef(false);

  // v3.8: balance alone never upgrades a user. Effective tier is the lower of
  // what the partner approved and what the balance supports (limits shrink
  // automatically if the account falls).
  const balanceIdx = TIERS.indexOf(tierFor(balance));
  const approvedIdx = TIERS.findIndex((t) => t.id === approvedTierId);
  const tier = TIERS[Math.min(balanceIdx, approvedIdx)];
  const tierIdx = TIERS.indexOf(tier);
  const audit = disciplineAudit(disciplineGap);
  const disciplinePass = audit.every((a) => a.pass);
  const nextTier = TIERS[tierIdx + 1];
  const balanceQualifies = balanceIdx > tierIdx;
  const eligible = balanceQualifies && disciplinePass;

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback(
    (toast) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { ...toast, id }]);
      setTimeout(() => dismiss(id), 3800);
    },
    [dismiss],
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable: choice lasts for this visit */
    }
  };

  // mock latency feed; spikes while the kill switch is engaged
  useEffect(() => {
    const t = setInterval(() => {
      setLatency(killSwitch ? 620 + Math.round(Math.random() * 400) : 12 + Math.round(Math.random() * 14));
    }, 1200);
    return () => clearInterval(t);
  }, [killSwitch]);

  // announce tier changes
  useEffect(() => {
    if (prevTier.current !== tier.id) {
      const up = tier.id > prevTier.current;
      notify({
        kind: up ? 'success' : 'warning',
        title: up ? `Welcome to ${tier.name}` : `Back to ${tier.name} limits`,
        body: up
          ? `[PARTNER] approved the upgrade. ${tier.margin ? 'Margin is now available on Trade.' : ''}`
          : `Your balance is below ${fmtUSD(TIERS[tierIdx + 1].min, 0)}, so lower limits apply until it recovers.`,
      });
      prevTier.current = tier.id;
    }
  }, [tier, notify]);

  // announce new eligibility once
  useEffect(() => {
    if (eligible && !wasEligible.current && nextTier) {
      notify({ kind: 'info', title: `You qualify for ${nextTier.name}`, body: 'Open your path to send it for partner approval.' });
    }
    wasEligible.current = eligible;
  }, [eligible, nextTier, notify]);

  const requestUpgrade = () => {
    if (!eligible || approvalPending) return;
    const target = nextTier;
    setApprovalPending(true);
    notify({ kind: 'info', title: `Sent for ${target.name} approval`, body: '[PARTNER] is reviewing the upgrade.' });
    setTimeout(() => {
      setApprovedTierId(target.id);
      setApprovalPending(false);
    }, 1800);
  };

  const toggleKill = () => {
    const next = !killSwitch;
    setKillSwitch(next);
    notify(
      next
        ? { kind: 'warning', title: 'Trading paused', body: `Execution is slower than ${KILL_SWITCH_MS} ms. The app is in view-only mode.` }
        : { kind: 'success', title: 'Trading resumed', body: 'Orders are being sent again.' },
    );
  };

  const enterFromIntro = (startChannel) => {
    setChannel(startChannel);
    setIntroOpen(false);
    window.scrollTo(0, 0);
    try {
      window.localStorage.setItem(INTRO_KEY, '1');
    } catch {
      /* storage unavailable: intro simply shows again next visit */
    }
  };

  const handlePredict = ({ market, side, price, stake }) => {
    if (killSwitch) return;
    const fee = Math.floor(stake / price) * PREDICT_FEE_PER_CONTRACT;
    setBalance((b) => b - stake - fee);
    setPositions((p) => [
      { id: Date.now(), title: market.title, side, price, stake, time: now() },
      ...p,
    ]);
    notify({
      kind: 'success',
      title: `You predicted ${side === 'UP' ? 'up' : 'down'}`,
      body: `${fmtUSD(stake, 0)} at ${Math.round(price * 100)}¢ plus a ${fmtUSD(fee)} fee. Sent to the exchange.`,
    });
  };

  // Mock execution: orders fill immediately at their price. Realized P&L moves the balance.
  const markOf = (symbol) => marks[symbol];
  const fill = (book, o) => {
    const { holdings: next, realized } = applyFill(book, o.symbol, o.side === 'BUY' ? o.qty : -o.qty, o.limit);
    return { next, realized, record: { ...o, id: `${Date.now()}-${o.symbol}-${Math.random().toString(36).slice(2, 6)}`, time: now(), realized } };
  };
  const fmtSigned = (n) => `${n < 0 ? '−' : '+'}${fmtUSD(Math.abs(n))}`;

  const handleOrder = (o) => {
    if (killSwitch) return;
    const { next, realized, record } = fill(holdings, o);
    setHoldings(next);
    setBalance((b) => b + realized);
    setOrders((list) => [record, ...list]);
    notify({
      kind: 'success',
      title: `Filled: ${o.side === 'BUY' ? 'bought' : 'sold'} ${+o.qty.toFixed(3)} ${o.symbol}`,
      body: `At ${fmtNum(o.limit)}, about ${fmtUSD(o.notional)}.${realized ? ` Realized ${fmtSigned(realized)}.` : ''}`,
    });
  };

  const handleReverse = (symbol) => {
    const h = holdings[symbol];
    if (killSwitch || !h) return;
    const mark = markOf(symbol);
    const qty = Math.abs(h.qty) * 2;
    const { next, realized, record } = fill(holdings, { side: h.qty > 0 ? 'SELL' : 'BUY', symbol, qty, limit: mark, notional: qty * mark, margin: true, note: 'Reverse' });
    setHoldings(next);
    setBalance((b) => b + realized);
    setOrders((list) => [record, ...list]);
    notify({
      kind: 'success',
      title: `Reversed ${symbol}`,
      body: `Now ${next[symbol].qty > 0 ? 'long' : 'short'} ${+Math.abs(next[symbol].qty).toFixed(3)} shares at ${fmtNum(mark)}. Realized ${fmtSigned(realized)}.`,
    });
  };

  // Sells or covers the given symbols at the current price. Returns the total realized P&L.
  const closeSymbols = (symbols, note) => {
    let book = holdings;
    let total = 0;
    const records = [];
    for (const symbol of symbols) {
      const h = book[symbol];
      if (!h) continue;
      const mark = markOf(symbol);
      const qty = Math.abs(h.qty);
      const res = fill(book, { side: h.qty > 0 ? 'SELL' : 'BUY', symbol, qty, limit: mark, notional: qty * mark, margin: h.qty < 0, note });
      book = res.next;
      total += res.realized;
      records.push(res.record);
    }
    setHoldings(book);
    setBalance((b) => b + total);
    setOrders((list) => [...records.reverse(), ...list]);
    return { total, count: records.length };
  };

  const handleClose = (symbol) => {
    const h = holdings[symbol];
    if (killSwitch || !h) return;
    const { total } = closeSymbols([symbol], 'Close');
    notify({
      kind: 'success',
      title: `Closed ${symbol}`,
      body: `${h.qty > 0 ? 'Sold' : 'Bought back'} ${+Math.abs(h.qty).toFixed(3)} shares at ${fmtNum(markOf(symbol))}. Realized ${fmtSigned(total)}.`,
    });
  };

  const handleCloseAll = () => {
    if (killSwitch) return;
    const { total, count } = closeSymbols(Object.keys(holdings), 'Close all');
    notify({
      kind: 'success',
      title: `Closed ${count} position${count === 1 ? '' : 's'}`,
      body: `Realized ${fmtSigned(total)} in total. You're now fully in cash.`,
    });
  };

  return (
    <div className="min-h-screen">
      <Header
        balance={balance}
        tier={tier}
        channel={channel}
        onChannel={setChannel}
        killSwitch={killSwitch}
        onKillSwitch={toggleKill}
        latency={latency}
        onOpenFlywheel={() => setFlywheelOpen(true)}
        eligibleFor={eligible ? nextTier : null}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto max-w-[1200px] px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        {channel === 'predict' ? (
          <PredictChannel killSwitch={killSwitch} balance={balance} tier={tier} positions={positions} onPredict={handlePredict} notify={notify} />
        ) : (
          <TradeChannel killSwitch={killSwitch} balance={balance} tier={tier} nextTier={nextTier} orders={orders} holdings={holdings} marks={marks} onOrder={handleOrder} onReverse={handleReverse} onClose={handleClose} onCloseAll={handleCloseAll} onOpenPath={() => setFlywheelOpen(true)} notify={notify} />
        )}

        <footer className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-sm text-ink-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl leading-relaxed">
            Prototype with simulated prices, balances and fills. In production, custody, execution and account approval come from [PARTNER]. Not an offer to buy or
            sell securities or event contracts.
          </p>
          <div className="flex shrink-0 gap-4">
            <button onClick={() => setFlywheelOpen(true)} className="font-medium text-brand hover:underline">
              Your path
            </button>
            <button onClick={() => setIntroOpen(true)} className="font-medium text-brand hover:underline">
              Overview
            </button>
          </div>
        </footer>
      </main>

      <FlywheelPanel
        open={flywheelOpen}
        onClose={() => setFlywheelOpen(false)}
        balance={balance}
        setBalance={setBalance}
        tier={tier}
        audit={audit}
        disciplineGap={disciplineGap}
        setDisciplineGap={setDisciplineGap}
        balanceQualifies={balanceQualifies}
        eligible={eligible}
        approvalPending={approvalPending}
        onRequestUpgrade={requestUpgrade}
      />
      {introOpen && <IntroScreen onEnter={enterFromIntro} />}
      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
