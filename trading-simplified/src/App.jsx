import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import PredictChannel from './components/PredictChannel.jsx';
import TradeChannel from './components/TradeChannel.jsx';
import FlywheelPanel from './components/FlywheelPanel.jsx';
import Toasts from './components/Toasts.jsx';
import IntroScreen from './components/IntroScreen.jsx';
import JournalChannel from './components/JournalChannel.jsx';
import {
  DISCIPLINE_THRESHOLD,
  KILL_SWITCH_MS,
  PREDICT_FEE_PER_CONTRACT,
  RESUME_AFTER_MS,
  RESUME_BELOW_MS,
  STARTING_BALANCE,
  TIERS,
  TRADE_SYMBOLS,
  disciplineAudit,
  disciplineScore,
  fmtUSD,
  liveMark,
  smartStakeCap,
  tierFor,
} from './data/mock.js';
import { markLegs, mirrorOf, stopLossFor, tradeName } from './data/options.js';

const SPY_IV = TRADE_SYMBOLS.find((s) => s.symbol === 'SPY').iv / 100;

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
  const [optPositions, setOptPositions] = useState([]);
  const [optionsApproved, setOptionsApproved] = useState(false);
  const [optionsPending, setOptionsPending] = useState(false);
  // Real inputs to the Discipline Score, gathered from the customer's own orders.
  const [exits, setExits] = useState({ opened: 0, planned: 0, riskPctSum: 0, opensToday: 0 });
  const [slowLink, setSlowLink] = useState(false);
  const healthySince = useRef(null);
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
  const audit = disciplineAudit(disciplineGap, exits);
  // Margin graduation needs the balance AND a Discipline Score above the threshold.
  const score = disciplineScore(disciplineGap, exits);
  const disciplinePass = score > DISCIPLINE_THRESHOLD;
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

  // Mock feed of the partner's execution-API latency. "Simulate slow connection" (a demo
  // control, not a customer control) makes it degrade.
  useEffect(() => {
    const t = setInterval(() => {
      setLatency(slowLink ? 620 + Math.round(Math.random() * 400) : 12 + Math.round(Math.random() * 14));
    }, 1000);
    return () => clearInterval(t);
  }, [slowLink]);

  // Safe-State is automatic: it trips as soon as latency passes the limit, and resumes only
  // after the connection has stayed healthy for a while, so it can't flicker on and off.
  useEffect(() => {
    if (latency > KILL_SWITCH_MS) {
      healthySince.current = null;
      if (!killSwitch) {
        setKillSwitch(true);
        notify({ kind: 'warning', title: 'Trading paused automatically', body: `The connection to your broker is slower than ${KILL_SWITCH_MS} ms. No orders are sent until it recovers.` });
      }
    } else if (killSwitch) {
      if (latency >= RESUME_BELOW_MS) {
        healthySince.current = null;
      } else if (healthySince.current == null) {
        healthySince.current = Date.now();
      } else if (Date.now() - healthySince.current >= RESUME_AFTER_MS) {
        healthySince.current = null;
        setKillSwitch(false);
        notify({ kind: 'success', title: 'Trading resumed', body: 'The connection is healthy again. Orders are being sent.' });
      }
    }
  }, [latency, killSwitch, notify]);

  // announce tier changes
  useEffect(() => {
    if (prevTier.current !== tier.id) {
      const up = tier.id > prevTier.current;
      notify({
        kind: up ? 'success' : 'warning',
        title: up ? `Welcome to ${tier.name}` : `Back to ${tier.name} limits`,
        body: up
          ? `Your broker approved the upgrade. ${tier.margin ? 'Margin is now available on Trade.' : ''}`
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
    notify({ kind: 'info', title: `Sent for ${target.name} approval`, body: 'Your broker is reviewing the upgrade.' });
    setTimeout(() => {
      setApprovedTierId(target.id);
      setApprovalPending(false);
    }, 1800);
  };

  const applyOptions = () => {
    if (optionsApproved || optionsPending) return;
    setOptionsPending(true);
    notify({ kind: 'info', title: 'Options application sent', body: 'Your broker is reviewing it.' });
    setTimeout(() => {
      setOptionsPending(false);
      setOptionsApproved(true);
      notify({ kind: 'success', title: 'Options trading approved', body: tier.margin ? 'The whole slider is open to you.' : 'You can buy calls and puts. Spreads unlock at Tier B.' });
    }, 1800);
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
    if (killSwitch || stake > smartStakeCap(balance, tier)) return;
    const fee = Math.floor(stake / price) * PREDICT_FEE_PER_CONTRACT;
    setBalance((b) => b - stake - fee);
    setPositions((p) => [
      { id: Date.now(), title: market.title, side, price, stake, time: now() },
      ...p,
    ]);
    notify({
      kind: 'success',
      title: `You predicted ${side === 'UP' ? 'up' : 'down'}`,
      body: `${fmtUSD(stake, 0)} at ${Math.round(price * 100)}¢ plus a ${fmtUSD(fee)} exchange fee. Sent to the exchange.`,
    });
  };

  // ---- Options (Trade channel). Mock execution: orders fill at mid right away; realized P&L moves the balance.
  const spot = marks.SPY;
  const signed = (n) => `${n < 0 ? '−' : '+'}${fmtUSD(Math.abs(n))}`;
  const premium = (cost) => `${fmtUSD(Math.abs(cost))} ${cost < 0 ? 'credit' : 'debit'}`;
  const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const openRecord = (trade, contracts) => ({ id: newId(), time: now(), action: trade.cost < 0 ? 'Sell' : 'Buy', name: tradeName(trade), contracts, price: trade.cost, realized: null });

  const handleOpen = ({ trade, contracts, exitPlan, stopLoss }) => {
    if (killSwitch) return;
    setOptPositions((list) => [{ id: newId(), trade, contracts, exitPlan, stopLoss }, ...list]);
    setOrders((list) => [openRecord(trade, contracts), ...list]);
    const riskPct = ((trade.maxLoss * contracts) / smartStakeCap(balance, tier)) * 100;
    setExits((e) => ({ opened: e.opened + 1, planned: e.planned + (exitPlan ? 1 : 0), riskPctSum: e.riskPctSum + riskPct, opensToday: e.opensToday + 1 }));
    notify({
      kind: 'success',
      title: `Filled: ${trade.cost < 0 ? 'sold' : 'bought'} ${contracts} ${trade.kind.toLowerCase()}${contracts > 1 ? 's' : ''}`,
      body: `${tradeName(trade)} at ${premium(trade.cost)}. The options are in your own brokerage account.`,
    });
  };

  // Closes the given positions at the current price. Returns the total realized P&L.
  const closePositions = (ids, action) => {
    let total = 0;
    const records = [];
    for (const p of optPositions.filter((x) => ids.includes(x.id))) {
      const value = markLegs(p.trade.legs, spot, p.trade.days, SPY_IV);
      const realized = (value - p.trade.cost) * 100 * p.contracts;
      total += realized;
      records.push({ id: newId(), time: now(), action, name: tradeName(p.trade), contracts: p.contracts, price: value, realized });
    }
    setOptPositions((list) => list.filter((x) => !ids.includes(x.id)));
    setBalance((b) => b + total);
    setOrders((list) => [...records.reverse(), ...list]);
    return { total, count: records.length };
  };

  const handleClose = (id) => {
    const p = optPositions.find((x) => x.id === id);
    if (killSwitch || !p) return;
    const { total } = closePositions([id], 'Close');
    notify({ kind: 'success', title: `Closed ${tradeName(p.trade)}`, body: `Realized ${signed(total)}.` });
  };

  const handleCloseAll = () => {
    if (killSwitch) return;
    const { total, count } = closePositions(optPositions.map((p) => p.id), 'Close all');
    notify({ kind: 'success', title: `Closed ${count} position${count === 1 ? '' : 's'}`, body: `Realized ${signed(total)} in total.` });
  };

  // Reverse = close, then open the mirror trade (Up <-> Down) at the same chance, expiry and size.
  const handleReverse = (id) => {
    const p = optPositions.find((x) => x.id === id);
    if (killSwitch || !p || p.trade.direction === 'range') return;
    const mirror = mirrorOf(p.trade, spot, SPY_IV);
    if ((mirror.spreadNeeded && !tier.margin) || mirror.maxLoss * p.contracts > smartStakeCap(balance, tier)) return;
    const { total } = closePositions([id], 'Reverse');
    setOptPositions((list) => [{ id: newId(), trade: mirror, contracts: p.contracts, exitPlan: p.exitPlan, stopLoss: stopLossFor(mirror) }, ...list]);
    setOrders((list) => [openRecord(mirror, p.contracts), ...list]);
    notify({ kind: 'success', title: `Reversed to ${mirror.direction === 'up' ? 'Up' : 'Down'}`, body: `Now holding ${tradeName(mirror)}. Realized ${signed(total)} on the old trade.` });
  };

  // System-enforced stop-loss: on every price tick, close any position whose loss has reached
  // its stop. While Safe-State has paused routing, stops wait until trading resumes.
  useEffect(() => {
    if (killSwitch || optPositions.length === 0) return;
    const hit = optPositions.filter((p) => (markLegs(p.trade.legs, spot, p.trade.days, SPY_IV) - p.trade.cost) * 100 * p.contracts <= -p.stopLoss * p.contracts);
    if (hit.length === 0) return;
    const { total } = closePositions(
      hit.map((p) => p.id),
      'Stop-loss',
    );
    notify({ kind: 'warning', title: `Stop-loss closed ${hit.length === 1 ? tradeName(hit[0].trade) : `${hit.length} positions`}`, body: `Realized ${signed(total)}. The system-enforced stop did its job.` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceTick, killSwitch]);

  return (
    <div className="min-h-screen">
      <Header
        balance={balance}
        tier={tier}
        channel={channel}
        onChannel={setChannel}
        killSwitch={killSwitch}
        latency={latency}
        onOpenFlywheel={() => setFlywheelOpen(true)}
        eligibleFor={eligible ? nextTier : null}
        score={score}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto max-w-[1200px] px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        {channel === 'journal' ? (
          <JournalChannel orders={orders} score={score} notify={notify} />
        ) : channel === 'predict' ? (
          <PredictChannel killSwitch={killSwitch} balance={balance} tier={tier} cap={smartStakeCap(balance, tier)} positions={positions} onPredict={handlePredict} notify={notify} />
        ) : (
          <TradeChannel
            killSwitch={killSwitch}
            balance={balance}
            tier={tier}
            spot={spot}
            optionsApproved={optionsApproved}
            optionsPending={optionsPending}
            onApplyOptions={applyOptions}
            positions={optPositions}
            orders={orders}
            onOpen={handleOpen}
            onClose={handleClose}
            onCloseAll={handleCloseAll}
            onReverse={handleReverse}
            onOpenPath={() => setFlywheelOpen(true)}
            notify={notify}
          />
        )}

        <footer className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-sm text-ink-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl leading-relaxed">
            Prototype with simulated prices, balances and fills. In production, custody, execution and account approval come from each user's own broker. Not an offer to buy or
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
        score={score}
        slowLink={slowLink}
        setSlowLink={setSlowLink}
        killSwitch={killSwitch}
        latency={latency}
      />
      {introOpen && <IntroScreen onEnter={enterFromIntro} />}
      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
