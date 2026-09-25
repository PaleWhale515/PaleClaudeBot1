import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Clock, Lock, Share2, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import PriceChart from './PriceChart.jsx';
import { PREDICT_MARKETS, fmtCountdown, fmtNum, fmtUSD, makeSeries, seedFrom } from '../data/mock.js';

const RANGES = ['1H', '1D', '5D'];

export default function PredictChannel({ killSwitch, balance, tier, positions, onPredict, notify }) {
  const PREDICT_STAKE = tier.predictStake;
  const [marketId, setMarketId] = useState(PREDICT_MARKETS[0].id);
  const [range, setRange] = useState('1D');
  const [tick, setTick] = useState(0);
  const market = PREDICT_MARKETS.find((m) => m.id === marketId);

  // live-ish ticking: nudge the last point + countdown every second
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const baseSeries = useMemo(
    () => makeSeries(seedFrom(market.id + range), market.base, market.vol, range === '1H' ? 60 : range === '1D' ? 90 : 120),
    [market, range],
  );
  const series = useMemo(() => {
    const wobble = Math.sin(tick / 2.3) * market.vol * 0.6 + Math.cos(tick / 5.1) * market.vol * 0.4;
    return [...baseSeries.slice(1), baseSeries[baseSeries.length - 1] + wobble];
  }, [baseSeries, tick, market.vol]);

  const strike = baseSeries[0] + (market.base - baseSeries[0]) * 0.55;
  const last = series[series.length - 1];
  const isUp = last >= strike;
  const decimals = market.symbol === 'CPI' ? 3 : 2;
  const upPrice = Math.min(0.95, Math.max(0.05, market.upPrice + Math.sin(tick / 3) * 0.01));
  const downPrice = 1 - upPrice;
  const countdown = Math.max(0, market.expiresIn - tick);
  const insufficient = balance < PREDICT_STAKE;
  const disabled = killSwitch || insufficient;

  const share = () => {
    const text = `Pulse Snapshot: ${market.title} — market says ${Math.round(upPrice * 100)}% UP right now. #TradingSimplified`;
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    notify({ kind: 'info', title: 'Pulse Snapshot ready', body: 'Opened share composer for X' });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Chart + markets */}
      <section className="panel overflow-hidden">
        <div className="flex gap-2 overflow-x-auto border-b border-ink-700/80 p-2">
          {PREDICT_MARKETS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMarketId(m.id)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-left transition ${
                m.id === marketId ? 'border-terminal/50 bg-terminal/10' : 'border-transparent hover:border-ink-600 hover:bg-ink-800'
              }`}
            >
              <span className={`block font-mono text-[11px] font-semibold ${m.id === marketId ? 'text-terminal' : 'text-ink-300'}`}>{m.symbol}</span>
              <span className="block max-w-[180px] truncate text-xs text-ink-200">{m.title}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4 px-4 pt-4 sm:px-5">
          <div>
            <p className="label">Index Event Contract · Binary · Capped Risk</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink-100 sm:text-2xl">{market.title}</h2>
            <p className="mt-1 text-sm text-ink-400">{market.subtitle}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-semibold text-ink-100 num">{fmtNum(last, decimals)}</p>
            <p className={`flex items-center justify-end gap-1 font-mono text-xs num ${isUp ? 'text-up' : 'text-down'}`}>
              {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {isUp ? 'Above' : 'Below'} strike by {fmtNum(Math.abs(last - strike), decimals)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pt-4 sm:px-5">
          <div className="flex gap-1 rounded-md bg-ink-850 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded px-2.5 py-1 font-mono text-[11px] transition ${r === range ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-ink-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> <span className="num text-ink-200">{fmtCountdown(countdown)}</span>
            </span>
            <span className="hidden sm:inline">Vol <span className="text-ink-200">{market.volume}</span></span>
          </div>
        </div>

        <div className="px-2 pb-3 pt-2 sm:px-3">
          <PriceChart data={series} height={280} color={isUp ? '#22c55e' : '#f43f5e'} baseline={strike} format={(v) => fmtNum(v, decimals)} />
        </div>

        {/* Implied probability bar */}
        <div className="border-t border-ink-700/80 px-4 py-4 sm:px-5">
          <div className="mb-2 flex justify-between font-mono text-[11px]">
            <span className="text-up">UP {Math.round(upPrice * 100)}%</span>
            <span className="label">Market-Implied Probability</span>
            <span className="text-down">DOWN {Math.round(downPrice * 100)}%</span>
          </div>
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
            <div className="rounded-l-full bg-up/80 transition-all duration-700" style={{ width: `${upPrice * 100}%` }} />
            <div className="flex-1 rounded-r-full bg-down/80" />
          </div>
        </div>
      </section>

      {/* Execution rail */}
      <aside className="flex flex-col gap-4">
        <section className="panel p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="label">Quick Position</p>
            <span className="inline-flex items-center gap-1 rounded border border-ink-600 px-1.5 py-0.5 font-mono text-[10px] text-ink-300">
              <Lock className="h-2.5 w-2.5" /> Max loss {fmtUSD(PREDICT_STAKE, 0)}
            </span>
          </div>

          <div className="flex items-stretch gap-2">
            <div className="grid flex-1 gap-2">
              <ExecButton
                side="UP"
                stake={PREDICT_STAKE}
                price={upPrice}
                disabled={disabled}
                onClick={() => onPredict({ market, side: 'UP', price: upPrice, stake: PREDICT_STAKE })}
              />
              <ExecButton
                side="DOWN"
                stake={PREDICT_STAKE}
                price={downPrice}
                disabled={disabled}
                onClick={() => onPredict({ market, side: 'DOWN', price: downPrice, stake: PREDICT_STAKE })}
              />
            </div>
            <button
              onClick={share}
              className="group flex w-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border border-ink-600 bg-ink-850 text-ink-300 transition hover:-translate-y-0.5 hover:border-sky-400/60 hover:bg-sky-400/10 hover:text-sky-300"
              title="Viral Pulse — Share to X"
            >
              <span className="relative">
                <Share2 className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-sky-400" />
              </span>
              <span className="text-center font-mono text-[10px] leading-tight">
                Share
                <br />
                to X
              </span>
            </button>
          </div>

          {killSwitch && (
            <p className="mt-3 rounded-md border border-down/30 bg-down/10 px-2.5 py-2 font-mono text-[11px] text-down">
              Execution disabled — View-Only Mode.
            </p>
          )}
          {!killSwitch && insufficient && (
            <p className="mt-3 rounded-md border border-terminal/30 bg-terminal/10 px-2.5 py-2 font-mono text-[11px] text-terminal">
              Insufficient balance for a {fmtUSD(PREDICT_STAKE, 0)} stake.
            </p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-ink-700/80 pt-3 font-mono text-[11px]">
            <dt className="text-ink-400">Stake</dt>
            <dd className="text-right text-ink-100 num">{fmtUSD(PREDICT_STAKE)}</dd>
            <dt className="text-ink-400">Payout if UP wins</dt>
            <dd className="text-right text-up num">{fmtUSD(PREDICT_STAKE / upPrice)}</dd>
            <dt className="text-ink-400">Payout if DOWN wins</dt>
            <dd className="text-right text-down num">{fmtUSD(PREDICT_STAKE / downPrice)}</dd>
            <dt className="text-ink-400">Stake tier</dt>
            <dd className="text-right text-terminal">{tier.name}</dd>
            <dt className="text-ink-400">Contract</dt>
            <dd className="text-right text-ink-200">CME index event (mock)</dd>
          </dl>
        </section>

        <section className="panel flex-1">
          <div className="panel-header">
            <p className="label">Open Contracts</p>
            <span className="font-mono text-[11px] text-ink-400">{positions.length}</span>
          </div>
          {positions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <ShieldCheck className="h-6 w-6 text-ink-500" />
              <p className="text-sm text-ink-400">No open contracts. Every position here has a fixed, known max loss.</p>
            </div>
          ) : (
            <ul className="max-h-[280px] divide-y divide-ink-700/60 overflow-y-auto">
              {positions.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2.5 animate-fade-in">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-100">{p.title}</p>
                    <p className="font-mono text-[11px] text-ink-400">
                      {p.time} · @ {Math.round(p.price * 100)}¢
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-semibold ${p.side === 'UP' ? 'text-up' : 'text-down'}`}>
                      {p.side === 'UP' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {p.side}
                    </span>
                    <p className="font-mono text-[11px] text-ink-300 num">{fmtUSD(p.stake)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

function ExecButton({ side, stake, price, disabled, onClick }) {
  const up = side === 'UP';
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-exec group relative flex items-center justify-between overflow-hidden rounded-xl border px-4 py-4 text-left transition enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 ${
        up
          ? 'border-up/40 bg-up/10 enabled:hover:border-up enabled:hover:bg-up/20 enabled:hover:shadow-[0_8px_30px_-12px_rgba(34,197,94,0.6)]'
          : 'border-down/40 bg-down/10 enabled:hover:border-down enabled:hover:bg-down/20 enabled:hover:shadow-[0_8px_30px_-12px_rgba(244,63,94,0.6)]'
      }`}
    >
      <span>
        <span className={`flex items-center gap-1.5 text-lg font-semibold tracking-tight ${up ? 'text-up' : 'text-down'}`}>
          <Icon className="h-5 w-5" strokeWidth={2.5} />
          {side}
        </span>
        <span className="font-mono text-[11px] text-ink-300">Stake {fmtUSD(stake, 0)}</span>
      </span>
      <span className="text-right">
        <span className="block font-mono text-lg font-semibold text-ink-100 num">{Math.round(price * 100)}¢</span>
        <span className="font-mono text-[10px] text-ink-400">per contract</span>
      </span>
    </button>
  );
}
