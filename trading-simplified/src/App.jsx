import { useCallback, useEffect, useRef, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import Header from './components/Header.jsx';
import ChannelToggle from './components/ChannelToggle.jsx';
import PredictChannel from './components/PredictChannel.jsx';
import TradeChannel from './components/TradeChannel.jsx';
import FlywheelPanel from './components/FlywheelPanel.jsx';
import Toasts from './components/Toasts.jsx';
import { PREDICT_STAKE, STARTING_BALANCE, fmtNum, fmtUSD, tierFor } from './data/mock.js';

const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });

export default function App() {
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [channel, setChannel] = useState('predict');
  const [killSwitch, setKillSwitch] = useState(false);
  const [flywheelOpen, setFlywheelOpen] = useState(false);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [latency, setLatency] = useState(18);
  const prevTier = useRef(tierFor(STARTING_BALANCE).id);

  const tier = tierFor(balance);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback(
    (toast) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { ...toast, id }]);
      setTimeout(() => dismiss(id), 3800);
    },
    [dismiss],
  );

  // mock latency feed; spikes while the kill switch is engaged
  useEffect(() => {
    const t = setInterval(() => {
      setLatency(killSwitch ? 1400 + Math.round(Math.random() * 900) : 12 + Math.round(Math.random() * 14));
    }, 1200);
    return () => clearInterval(t);
  }, [killSwitch]);

  // celebrate tier changes
  useEffect(() => {
    if (prevTier.current !== tier.id) {
      const up = tier.id > prevTier.current;
      notify({
        kind: up ? 'success' : 'warning',
        title: up ? `Graduated to ${tier.name}` : `Moved to ${tier.name}`,
        body: tier.margin ? 'Margin enabled on the TRADE channel' : 'Cash only · max stake $500',
      });
      prevTier.current = tier.id;
    }
  }, [tier, notify]);

  const toggleKill = () => {
    const next = !killSwitch;
    setKillSwitch(next);
    notify(
      next
        ? { kind: 'warning', title: 'Safe-State Kill Switch engaged', body: 'API Latency: View-Only Mode' }
        : { kind: 'success', title: 'Execution restored', body: 'Order routing back online' },
    );
  };

  const handlePredict = ({ market, side, price }) => {
    if (killSwitch) return;
    setBalance((b) => b - PREDICT_STAKE);
    setPositions((p) => [
      { id: Date.now(), title: market.title, side, price, stake: PREDICT_STAKE, time: now() },
      ...p,
    ]);
    notify({
      kind: 'success',
      title: `Prediction placed: ${side}`,
      body: `${market.symbol} · ${fmtUSD(PREDICT_STAKE, 0)} @ ${Math.round(price * 100)}¢ · max payout ${fmtUSD(PREDICT_STAKE / price)}`,
    });
  };

  const handleOrder = (o) => {
    if (killSwitch) return;
    setOrders((list) => [{ ...o, id: Date.now(), time: now() }, ...list]);
    notify({
      kind: 'success',
      title: `Order routed: ${o.side} ${+o.qty.toFixed(3)} ${o.symbol}`,
      body: `Limit ${fmtNum(o.limit)} · notional ${fmtUSD(o.notional)} · ${o.margin ? 'margin' : 'cash'}`,
    });
  };

  return (
    <div className="min-h-screen">
      <Header
        balance={balance}
        tier={tier}
        killSwitch={killSwitch}
        onKillSwitch={toggleKill}
        latency={latency}
        onOpenFlywheel={() => setFlywheelOpen(true)}
      />

      <main className="mx-auto max-w-[1440px] px-4 py-5 lg:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <ChannelToggle channel={channel} onChange={setChannel} />
          <button
            onClick={() => setFlywheelOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-200 transition hover:border-terminal/50 hover:text-terminal"
          >
            <GraduationCap className="h-4 w-4" />
            Graduation Flywheel
          </button>
        </div>

        <div key={channel} className="animate-fade-in">
          {channel === 'predict' ? (
            <PredictChannel killSwitch={killSwitch} balance={balance} positions={positions} onPredict={handlePredict} notify={notify} />
          ) : (
            <TradeChannel killSwitch={killSwitch} balance={balance} tier={tier} orders={orders} onOrder={handleOrder} />
          )}
        </div>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-ink-800 pt-4 font-mono text-[10px] text-ink-500">
          <span>Trading Simplified · Prototype build · All market data, balances and fills are simulated.</span>
          <span>Not an offer to buy or sell securities or event contracts.</span>
        </footer>
      </main>

      <FlywheelPanel open={flywheelOpen} onClose={() => setFlywheelOpen(false)} balance={balance} setBalance={setBalance} tier={tier} />
      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
