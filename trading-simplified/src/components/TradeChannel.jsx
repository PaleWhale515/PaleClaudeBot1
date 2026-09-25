import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, Gauge, Lock, Minus, Percent, Plus, Ruler, ShieldCheck, Target } from 'lucide-react';
import PriceChart from './PriceChart.jsx';
import { SMART_STAKE_PCT, TRADE_SYMBOLS, fmtNum, fmtUSD, makeSeries, seedFrom, smartStakeCap } from '../data/mock.js';

export default function TradeChannel({ killSwitch, balance, tier, nextTier, orders, onOrder }) {
  const [symbol, setSymbol] = useState('SPY');
  const q = TRADE_SYMBOLS.find((s) => s.symbol === symbol);
  const series = useMemo(() => makeSeries(seedFrom('trade' + symbol), q.price, q.price * 0.0028, 110), [symbol, q.price]);
  const band = { low: q.price - q.expectedMove, high: q.price + q.expectedMove };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="flex min-w-0 flex-col gap-4">
        {/* Symbol strip */}
        <div className="panel flex gap-1 overflow-x-auto p-1.5">
          {TRADE_SYMBOLS.map((s) => (
            <button
              key={s.symbol}
              onClick={() => setSymbol(s.symbol)}
              className={`flex shrink-0 items-baseline gap-2 rounded-lg px-3 py-2 font-mono text-xs transition ${
                s.symbol === symbol ? 'bg-ink-700 text-ink-100' : 'text-ink-300 hover:bg-ink-800 hover:text-ink-100'
              }`}
            >
              <span className="font-semibold">{s.symbol}</span>
              <span className="num">{fmtNum(s.price)}</span>
              <span className={`num ${s.change >= 0 ? 'text-up' : 'text-down'}`}>
                {s.change >= 0 ? '+' : ''}
                {s.change.toFixed(2)}%
              </span>
            </button>
          ))}
        </div>

        {/* Mechanical Data Dashboard */}
        <section className="panel">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-terminal" />
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ink-100">Mechanical Data Dashboard</p>
              <span className="hidden rounded border border-ink-600 px-1.5 py-0.5 font-mono text-[10px] text-ink-400 sm:inline">Market context · not a recommendation</span>
            </div>
            <span className="font-mono text-[11px] text-ink-400">
              {q.symbol} · {q.name}
            </span>
          </div>
          <div className="grid grid-cols-1 divide-y divide-ink-700/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <StatTile
              icon={Percent}
              label="IV Rank"
              value={`${q.ivRank}%`}
              meter={q.ivRank}
              note={q.ivRank >= 50 ? 'Elevated — premium selling favored' : 'Moderate — neutral vol regime'}
              sub={`IV ${q.iv.toFixed(1)}% · 52-wk range`}
            />
            <StatTile
              icon={Ruler}
              label="Expected Move"
              value={`±${fmtUSD(q.expectedMove)}`}
              sub={`${((q.expectedMove / q.price) * 100).toFixed(2)}% · weekly, 1σ`}
              note={`${fmtNum(band.low)} – ${fmtNum(band.high)}`}
            />
            <StatTile
              icon={Target}
              label="Probability of Profit"
              value={`${q.pop}%`}
              meter={q.pop}
              sub="Model est. at current strike"
              note={q.pop >= 60 ? 'Edge: favorable' : 'Edge: marginal'}
            />
          </div>
          <div className="border-t border-ink-700/80 px-2 pb-3 pt-3 sm:px-3">
            <div className="mb-1 flex items-center justify-between px-2">
              <p className="label">Price vs. Expected-Move Envelope</p>
              <span className="flex items-center gap-3 font-mono text-[10px] text-ink-400">
                <span className="flex items-center gap-1">
                  <span className="h-0.5 w-3 rounded bg-sky-400" /> {q.symbol}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-0 w-3 border-t border-dashed border-terminal" /> ±1σ EM
                </span>
              </span>
            </div>
            <PriceChart data={series} height={240} color="#38bdf8" band={band} format={(v) => fmtNum(v)} />
          </div>
        </section>

        {/* Blotter */}
        <section className="panel">
          <div className="panel-header">
            <p className="label">Order Blotter</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-ink-400">{orders.length} working</span>
              <button
                onClick={() => exportCostBasis(orders)}
                disabled={orders.length === 0}
                className="inline-flex items-center gap-1 rounded border border-ink-600 px-2 py-0.5 font-mono text-[10px] text-ink-300 transition enabled:hover:border-terminal/60 enabled:hover:text-terminal disabled:opacity-40"
              >
                <Download className="h-3 w-3" /> Cost basis CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] font-mono text-xs">
              <thead>
                <tr className="text-left text-ink-400">
                  {['Time', 'Side', 'Symbol', 'Qty', 'Limit', 'Notional', 'Status'].map((h) => (
                    <th key={h} className={`px-4 py-2 font-medium ${['Qty', 'Limit', 'Notional'].includes(h) ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-ink-500">
                      No orders yet — use the ticket to route a simulated order.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="animate-fade-in text-ink-200">
                      <td className="px-4 py-2 text-ink-400">{o.time}</td>
                      <td className={`px-4 py-2 font-semibold ${o.side === 'BUY' ? 'text-up' : 'text-down'}`}>{o.side}</td>
                      <td className="px-4 py-2">{o.symbol}</td>
                      <td className="px-4 py-2 text-right num">{fmtQty(o.qty)}</td>
                      <td className="px-4 py-2 text-right num">{fmtNum(o.limit)}</td>
                      <td className="px-4 py-2 text-right num">{fmtUSD(o.notional)}</td>
                      <td className="px-4 py-2">
                        <span className="rounded bg-sky-400/10 px-1.5 py-0.5 text-[10px] text-sky-300">WORKING</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <OrderTicket key={symbol} quote={q} balance={balance} tier={tier} nextTier={nextTier} killSwitch={killSwitch} onOrder={onOrder} />
    </div>
  );
}

function StatTile({ icon: Icon, label, value, sub, note, meter }) {
  return (
    <div className="p-4 sm:p-5">
      <p className="label flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-ink-100 num">{value}</p>
      <p className="mt-1 font-mono text-[11px] text-ink-400">{sub}</p>
      {meter != null && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-700">
          <div className="h-full rounded-full bg-terminal" style={{ width: `${meter}%` }} />
        </div>
      )}
      <p className="mt-2 text-xs text-ink-300">{note}</p>
    </div>
  );
}

function OrderTicket({ quote, balance, tier, nextTier, killSwitch, onOrder }) {
  const [side, setSide] = useState('BUY');
  const [limit, setLimit] = useState(quote.price.toFixed(2));
  // fractional shares: default to 1 share, or the largest slice that fits the cap
  const [qty, setQty] = useState(() => Math.min(1, floor3(smartStakeCap(balance, tier) / quote.price)));
  const [useMargin, setUseMargin] = useState(false);

  useEffect(() => {
    if (!tier.margin) setUseMargin(false);
  }, [tier.margin]);

  const cap = smartStakeCap(balance, tier);
  const limitNum = parseFloat(limit) || 0;
  const notional = qty * limitNum;
  const usage = cap > 0 ? notional / cap : 0;
  const over = notional > cap;
  const maxQty = limitNum > 0 ? floor3(cap / limitNum) : 0;
  const buyingPower = useMargin ? balance * 2 : balance;
  const invalid = !(qty > 0) || limitNum <= 0;
  const disabled = killSwitch || over || invalid;
  const tierCapped = tier.maxStake && balance * SMART_STAKE_PCT > tier.maxStake;

  const submit = () => {
    onOrder({ side, symbol: quote.symbol, qty, limit: limitNum, notional, margin: useMargin });
  };

  return (
    <aside className="panel flex h-fit flex-col xl:sticky xl:top-24">
      <div className="panel-header">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ink-100">Order Entry</p>
        <span className="font-mono text-[11px] text-ink-400">
          {quote.symbol} · Limit · DAY
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Side */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink-850 p-1">
          {['BUY', 'SELL'].map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`rounded-md py-2 font-mono text-xs font-semibold tracking-wider transition ${
                side === s
                  ? s === 'BUY'
                    ? 'bg-up/15 text-up ring-1 ring-up/50'
                    : 'bg-down/15 text-down ring-1 ring-down/50'
                  : 'text-ink-400 hover:bg-ink-800 hover:text-ink-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Quantity */}
        <Field label="Quantity" hint={`Max ${fmtQty(maxQty)} sh · fractional OK`}>
          <div className="flex items-center rounded-lg border border-ink-600 bg-ink-850 focus-within:border-terminal/70">
            <button onClick={() => setQty((n) => floor3(Math.max(0.001, n - (n > 1 ? 1 : 0.1))))} className="p-2.5 text-ink-400 hover:text-ink-100" aria-label="Decrease quantity">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min={0}
              step="0.001"
              value={qty}
              onChange={(e) => setQty(Math.max(0, floor3(parseFloat(e.target.value || '0'))))}
              className="w-full bg-transparent text-center font-mono text-sm text-ink-100 outline-none num"
            />
            <button onClick={() => setQty((n) => floor3(n + (n >= 1 ? 1 : 0.1)))} className="p-2.5 text-ink-400 hover:text-ink-100" aria-label="Increase quantity">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </Field>

        {/* Limit price */}
        <Field
          label="Limit Price"
          hint={
            <button onClick={() => setLimit(quote.price.toFixed(2))} className="text-terminal hover:underline">
              Mid {fmtNum(quote.price)}
            </button>
          }
        >
          <div className="flex items-center rounded-lg border border-ink-600 bg-ink-850 px-3 focus-within:border-terminal/70">
            <span className="font-mono text-sm text-ink-400">$</span>
            <input
              type="number"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full bg-transparent py-2.5 pl-1 font-mono text-sm text-ink-100 outline-none num"
            />
          </div>
        </Field>

        {/* Margin toggle */}
        <div className="flex items-center justify-between rounded-lg border border-ink-700 px-3 py-2.5">
          <div>
            <p className="text-sm text-ink-200">Use margin</p>
            <p className="font-mono text-[10px] text-ink-400">{tier.margin ? `Buying power ${fmtUSD(buyingPower)} · partner-approved` : `Locked · requires ${nextTier?.name ?? 'Tier B'} + partner approval`}</p>
          </div>
          {tier.margin ? (
            <button
              role="switch"
              aria-checked={useMargin}
              onClick={() => setUseMargin((m) => !m)}
              className={`relative h-5 w-9 rounded-full transition ${useMargin ? 'bg-terminal' : 'bg-ink-600'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${useMargin ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          ) : (
            <Lock className="h-4 w-4 text-ink-500" />
          )}
        </div>

        {/* Smart Stake meter */}
        <div className={`rounded-lg border p-3 transition ${over ? 'border-down/50 bg-down/5' : 'border-ink-700 bg-ink-850/60'}`}>
          <div className="flex items-center justify-between">
            <p className="label flex items-center gap-1.5">
              <ShieldCheck className={`h-3 w-3 ${over ? 'text-down' : 'text-up'}`} /> Smart Stake
            </p>
            <p className="font-mono text-[11px] text-ink-300 num">
              {fmtUSD(notional)} / {fmtUSD(cap)}
            </p>
          </div>
          <div className="relative mt-2.5 h-2 overflow-hidden rounded-full bg-ink-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${over ? 'bg-down' : usage > 0.8 ? 'bg-terminal' : 'bg-up'}`}
              style={{ width: `${Math.min(100, usage * 100)}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-ink-500">
            <span>0%</span>
            <span>Cap = 25% of equity{tierCapped ? ` · ${tier.name} hard cap ${fmtUSD(tier.maxStake, 0)}` : ''}</span>
          </div>
          {over && (
            <div className="mt-2.5 flex items-start justify-between gap-2 animate-fade-in">
              <p className="flex items-start gap-1.5 text-xs text-down">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Order exceeds Smart Stake limit by {fmtUSD(notional - cap)}.
              </p>
              <button
                onClick={() => setQty(maxQty)}
                className="shrink-0 rounded border border-down/40 px-2 py-0.5 font-mono text-[10px] text-down hover:bg-down/10"
              >
                Clamp to {fmtQty(maxQty)}
              </button>
            </div>
          )}
        </div>

        {/* Summary */}
        <dl className="grid grid-cols-2 gap-y-1.5 font-mono text-[11px]">
          <dt className="text-ink-400">Est. notional</dt>
          <dd className="text-right text-ink-100 num">{fmtUSD(notional)}</dd>
          <dt className="text-ink-400">% of equity</dt>
          <dd className="text-right text-ink-100 num">{balance > 0 ? ((notional / balance) * 100).toFixed(1) : '0.0'}%</dd>
          <dt className="text-ink-400">Account type</dt>
          <dd className="text-right text-ink-100">{useMargin ? 'Margin' : 'Cash'}</dd>
          <dt className="text-ink-400">Settlement</dt>
          <dd className="text-right text-ink-100">T+1</dd>
          <dt className="text-ink-400">Routing</dt>
          <dd className="text-right text-ink-100">[PARTNER] · best ex</dd>
        </dl>

        <button
          onClick={submit}
          disabled={disabled}
          className={`btn-exec rounded-lg py-3 text-sm font-semibold tracking-wide text-ink-950 transition enabled:hover:brightness-110 enabled:active:scale-[0.99] ${
            side === 'BUY' ? 'bg-up enabled:hover:shadow-[0_8px_30px_-10px_rgba(34,197,94,0.7)]' : 'bg-down enabled:hover:shadow-[0_8px_30px_-10px_rgba(244,63,94,0.7)]'
          }`}
        >
          {killSwitch ? 'View-Only Mode' : `${side === 'BUY' ? 'Buy' : 'Sell'} ${fmtQty(qty)} ${quote.symbol} @ ${fmtNum(limitNum)}`}
        </button>
        {killSwitch && <p className="-mt-2 text-center font-mono text-[11px] text-down">API Latency: View-Only Mode</p>}
      </div>
    </aside>
  );
}

/** Tax-reporting support (v3.8 §5): user-side cost-basis export; official 1099s come from the partner. */
function exportCostBasis(orders) {
  const rows = [['time', 'side', 'symbol', 'qty', 'limit', 'notional', 'account'], ...orders.map((o) => [o.time, o.side, o.symbol, o.qty, o.limit.toFixed(2), o.notional.toFixed(2), o.margin ? 'margin' : 'cash'])];
  const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'trading-simplified-cost-basis.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

const floor3 = (n) => Math.floor(n * 1000) / 1000;
const fmtQty = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, ''));

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="font-mono text-[10px] text-ink-400">{hint}</span>
      </div>
      {children}
    </div>
  );
}
