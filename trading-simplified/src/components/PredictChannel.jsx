import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Clock, Share2 } from 'lucide-react';
import PriceChart from './PriceChart.jsx';
import { PREDICT_FEE_PER_CONTRACT, PREDICT_MARKETS, fmtCountdown, fmtNum, fmtUSD, makeSeries, seedFrom } from '../data/mock.js';

const RANGES = ['1H', '1D', '5D'];

export default function PredictChannel({ killSwitch, balance, tier, positions, onPredict, notify }) {
  const stake = tier.predictStake;
  const [marketId, setMarketId] = useState(PREDICT_MARKETS[0].id);
  const [range, setRange] = useState('1D');
  const [tick, setTick] = useState(0);
  const market = PREDICT_MARKETS.find((m) => m.id === marketId);

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
  const insufficient = balance < stake;
  const disabled = killSwitch || insufficient;

  const shareText = `Pulse Snapshot: ${market.title} The market says ${Math.round(upPrice * 100)}% up right now. #TradingSimplified\n\nMarket data only, not advice. Event contracts involve risk of loss.`;
  const shareUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="flex min-w-0 flex-col gap-6">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Markets">
          {PREDICT_MARKETS.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={m.id === marketId}
              onClick={() => setMarketId(m.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                m.id === marketId ? 'bg-ink text-bg' : 'bg-surface text-ink-2 ring-1 ring-line hover:text-ink'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[40px]">{market.title}</h1>
          <p className="mt-2 text-ink-2">{market.subtitle}</p>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-5xl font-semibold tracking-tight text-ink num">{fmtNum(last, decimals)}</p>
              <p className={`mt-1 flex items-center gap-1 text-[15px] font-medium num ${isUp ? 'text-up' : 'text-down'}`}>
                {isUp ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {fmtNum(Math.abs(last - strike), decimals)} {isUp ? 'above' : 'below'} the line
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm text-ink-2">
                <Clock className="h-4 w-4" />
                Closes in <span className="font-semibold text-ink num">{fmtCountdown(countdown)}</span>
              </span>
              <div className="flex rounded-full bg-sunken p-0.5">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${r === range ? 'bg-surface text-ink shadow-card' : 'text-ink-3 hover:text-ink'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <PriceChart data={series} height={260} tone={isUp ? 'up' : 'down'} baseline={strike} baselineLabel="Line" format={(v) => fmtNum(v, decimals)} />
          </div>

          <div className="mt-6">
            <div className="flex h-2 gap-1 overflow-hidden rounded-full">
              <div className="rounded-full bg-up transition-all duration-700" style={{ width: `${upPrice * 100}%` }} />
              <div className="flex-1 rounded-full bg-down" />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="font-medium text-up num">{Math.round(upPrice * 100)}% say up</span>
              <span className="text-ink-3">{market.volume} traded</span>
              <span className="font-medium text-down num">{Math.round(downPrice * 100)}% say down</span>
            </div>
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-6">
        <div className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Make a prediction</h2>
            <span className="text-sm text-ink-3">Tier {tier.id}</span>
          </div>
          <p className="mt-1 text-sm text-ink-2">
            You stake {fmtUSD(stake, 0)}. That's the most you can lose.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <ChoiceButton side="UP" stake={stake} price={upPrice} disabled={disabled} onClick={() => onPredict({ market, side: 'UP', price: upPrice, stake })} />
            <ChoiceButton side="DOWN" stake={stake} price={downPrice} disabled={disabled} onClick={() => onPredict({ market, side: 'DOWN', price: downPrice, stake })} />
          </div>

          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => notify({ kind: 'info', title: 'Pulse Snapshot ready', body: 'It shares market data only. Your balance and results stay private.' })}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-soft"
          >
            <Share2 className="h-4 w-4" /> Share to X
          </a>

          {killSwitch && <p className="mt-3 rounded-xl bg-down-soft px-4 py-3 text-sm text-down">Trading is paused. You can still watch prices.</p>}
          {!killSwitch && insufficient && (
            <p className="mt-3 rounded-xl bg-gold-soft px-4 py-3 text-sm text-gold-ink">You need at least {fmtUSD(stake, 0)} to make a prediction.</p>
          )}

          <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
            <Row label="If up wins, you get" value={fmtUSD(stake / upPrice)} />
            <Row label="If down wins, you get" value={fmtUSD(stake / downPrice)} />
            <Row label="Fee" value={`${fmtUSD(PREDICT_FEE_PER_CONTRACT)} per contract`} />
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-ink-3">
            Each prediction is a real order on the exchange, sent through [PARTNER] and centrally cleared. We never take the other side.
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Your predictions</h2>
            <span className="text-sm text-ink-3 num">{positions.length}</span>
          </div>
          {positions.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">Nothing open yet. Each one has a fixed, known maximum loss.</p>
          ) : (
            <ul className="mt-3 max-h-[280px] divide-y divide-line overflow-y-auto">
              {positions.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                    <p className="text-xs text-ink-3 num">
                      {p.time}, bought at {Math.round(p.price * 100)}¢
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${p.side === 'UP' ? 'text-up' : 'text-down'}`}>{p.side === 'UP' ? 'Up' : 'Down'}</p>
                    <p className="text-xs text-ink-3 num">{fmtUSD(p.stake, 0)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function ChoiceButton({ side, stake, price, disabled, onClick }) {
  const up = side === 'UP';
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={`${up ? 'UP' : 'DOWN'} (Stake $${stake}) at ${Math.round(price * 100)} cents`}
      className={`btn-exec flex flex-col items-start gap-3 rounded-2xl p-4 text-left transition enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 ${
        up ? 'bg-up-soft enabled:hover:ring-2 enabled:hover:ring-up' : 'bg-down-soft enabled:hover:ring-2 enabled:hover:ring-down'
      }`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-full ${up ? 'bg-up text-surface' : 'bg-down text-surface'}`}>
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span>
        <span className={`block font-display text-2xl font-semibold ${up ? 'text-up' : 'text-down'}`}>{up ? 'Up' : 'Down'}</span>
        <span className="text-sm text-ink-2 num">
          Stake {fmtUSD(stake, 0)} at {Math.round(price * 100)}¢
        </span>
      </span>
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-2">{label}</dt>
      <dd className="font-medium text-ink num">{value}</dd>
    </div>
  );
}
