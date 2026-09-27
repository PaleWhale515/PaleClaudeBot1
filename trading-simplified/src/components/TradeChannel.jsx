import { useMemo, useState } from 'react';
import { ArrowDown, ArrowLeftRight, ArrowUp, ClipboardCopy, FileText, Loader2, Lock, Minus, MoveHorizontal, Plus, X, XCircle } from 'lucide-react';
import PriceChart from './PriceChart.jsx';
import PayoffChart from './PayoffChart.jsx';
import { SMART_STAKE_PCT, TRADE_SYMBOLS, fmtNum, fmtUSD, makeSeries, seedFrom, smartStakeCap } from '../data/mock.js';
import { DIRECTIONS, EXPIRATIONS, WIDTHS, buildTrade, expiryLabel, markLegs, mirrorOf, stopLossFor, stopLossRule, tradeName } from '../data/options.js';

const SPY = TRADE_SYMBOLS.find((s) => s.symbol === 'SPY');
const BASE_IV = SPY.iv / 100;

export default function TradeChannel({
  killSwitch,
  balance,
  tier,
  spot,
  optionsApproved,
  optionsPending,
  onApplyOptions,
  positions,
  orders,
  onOpen,
  onClose,
  onCloseAll,
  onReverse,
  onOpenPath,
  notify,
}) {
  const [mode, setMode] = useState('simple');
  const [direction, setDirection] = useState('up');
  const [expIdx, setExpIdx] = useState(EXPIRATIONS.indexOf(7));
  const [target, setTarget] = useState(70);
  const [width, setWidth] = useState(null);
  const [contracts, setContracts] = useState(1);
  const [exitPlan, setExitPlan] = useState(true);
  const days = EXPIRATIONS[expIdx];

  const trade = useMemo(() => buildTrade({ S: spot, baseIv: BASE_IV, days, direction, target: target / 100, width }), [spot, days, direction, target, width]);
  const cap = smartStakeCap(balance, tier);
  const maxContracts = Math.max(0, Math.floor(cap / trade.maxLoss));
  const qty = Math.min(Math.max(1, contracts), Math.max(1, maxContracts));
  const block = killSwitch
    ? 'paused'
    : !optionsApproved
      ? 'options'
      : trade.spreadNeeded && !tier.margin
        ? 'spreads'
        : maxContracts < 1
          ? 'size'
          : null;

  const series = useMemo(() => makeSeries(seedFrom('trade-spy'), SPY.price, SPY.price * 0.0028, 110), []);
  const liveSeries = useMemo(() => [...series.slice(1), spot], [series, spot]);
  const change = SPY.change + ((spot - SPY.price) / SPY.price) * 100;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-ink-2">SPY options, {SPY.name}</p>
            <p className="text-sm text-ink-3">Shaded: the move the options market expects by {expiryDate(days)}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1">
            <p className="font-display text-5xl font-semibold tracking-tight text-ink num">{fmtUSD(spot)}</p>
            <p className={`flex items-center gap-1 pb-1.5 text-[15px] font-medium num ${change >= 0 ? 'text-up' : 'text-down'}`}>
              {change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {Math.abs(change).toFixed(2)}% today
            </p>
          </div>
          <div className="mt-6">
            <PriceChart data={liveSeries} height={220} tone="brand" band={{ low: spot - trade.expectedMove, high: spot + trade.expectedMove }} format={(v) => fmtNum(v)} />
          </div>
        </section>

        <section aria-labelledby="context-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="context-title" className="font-display text-xl font-semibold text-ink">
              Before you trade
            </h2>
            <p className="text-sm text-ink-3">Market context, not a recommendation.</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Stat label="IV Rank" value={`${SPY.ivRank}%`} note="Options cost about what they usually do this year." />
            <Stat label={`Expected move by ${expiryDate(days)}`} value={`±${fmtUSD(trade.expectedMove)}`} note={`Roughly ${fmtNum(spot - trade.expectedMove)} to ${fmtNum(spot + trade.expectedMove)}.`} />
            <Stat label="Your chance of profit" value={`${Math.round(trade.pop * 100)}%`} note="Estimated from option prices. It moves with the slider." />
          </div>
        </section>

        <PositionsCard positions={positions} spot={spot} balance={balance} tier={tier} killSwitch={killSwitch} onClose={onClose} onCloseAll={onCloseAll} onReverse={onReverse} onOpenPath={onOpenPath} />

        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">Order history</h2>
            <button
              onClick={() => copyCostBasis(orders, notify)}
              disabled={orders.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-brand transition enabled:hover:bg-brand-soft disabled:opacity-45"
            >
              <ClipboardCopy className="h-4 w-4" /> Copy cost basis (CSV)
            </button>
          </div>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">No orders yet. In this demo, orders fill right away at the middle of the bid and ask.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-ink-3">
                    <th className="py-2 pr-4 font-medium">Time</th>
                    <th className="py-2 pr-4 font-medium">Order</th>
                    <th className="py-2 pr-4 text-right font-medium">Contracts</th>
                    <th className="py-2 pr-4 text-right font-medium">Price</th>
                    <th className="py-2 text-right font-medium">Realized</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.map((o) => (
                    <tr key={o.id} className="animate-flash text-ink">
                      <td className="py-3 pr-4 text-ink-3 num">{o.time}</td>
                      <td className="py-3 pr-4">
                        <span className="font-semibold">{o.action}</span> {o.name}
                      </td>
                      <td className="py-3 pr-4 text-right num">{o.contracts}</td>
                      <td className="py-3 pr-4 text-right num">{premiumLabel(o.price)}</td>
                      <td className={`py-3 text-right num ${o.realized > 0 ? 'text-up' : o.realized < 0 ? 'text-down' : 'text-ink-3'}`}>
                        {o.realized == null ? '—' : signed(o.realized)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <aside className="card order-first flex h-fit flex-col gap-5 p-6 lg:sticky lg:top-28 lg:order-none" aria-labelledby="ticket-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="ticket-title" className="font-display text-xl font-semibold text-ink">
            Build a SPY trade
          </h2>
          <div className="flex rounded-full bg-sunken p-0.5 text-sm" role="tablist" aria-label="Detail level">
            {[
              ['simple', 'Simplified'],
              ['pro', 'Detailed'],
            ].map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={`rounded-full px-3 py-1 font-medium transition ${mode === id ? 'bg-surface text-ink shadow-card' : 'text-ink-3 hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Approval gates come first, so nobody fills in a ticket they can't send. */}
        <Gate block={block} optionsPending={optionsPending} onApplyOptions={onApplyOptions} onOpenPath={onOpenPath} />

        {/* 1. Direction */}
        <div>
          <p className="text-sm text-ink-2">Where do you think SPY finishes?</p>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-sunken p-1">
            {DIRECTIONS.map((d) => {
              const Icon = d.id === 'up' ? ArrowUp : d.id === 'down' ? ArrowDown : MoveHorizontal;
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    setDirection(d.id);
                    setWidth(null);
                  }}
                  aria-pressed={direction === d.id}
                  className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-sm font-semibold transition ${
                    direction === d.id ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${d.id === 'up' ? 'text-up' : d.id === 'down' ? 'text-down' : 'text-brand'}`} />
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Expiration */}
        <label className="block">
          <span className="flex items-baseline justify-between text-sm">
            <span className="text-ink-2">Expires</span>
            <span className="font-semibold text-ink">
              {expiryLabel(days)}, {expiryDate(days)}
            </span>
          </span>
          <input
            id="expiry"
            type="range"
            min={0}
            max={EXPIRATIONS.length - 1}
            value={expIdx}
            onChange={(e) => {
              setExpIdx(Number(e.target.value));
              setWidth(null);
            }}
            className="mt-2 w-full accent-[rgb(var(--brand))]"
            aria-valuetext={expiryLabel(days)}
          />
          <span className="flex justify-between text-xs text-ink-3">
            <span>Today</span>
            <span>1 year</span>
          </span>
        </label>

        {/* 3. Probability slider */}
        <div className="rounded-2xl bg-brand-soft p-4">
          <label htmlFor="pop" className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-ink">Estimated chance of profit</span>
            <span className="font-display text-4xl font-semibold text-brand num">{target}%</span>
          </label>
          <input
            id="pop"
            type="range"
            min={1}
            max={99}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="mt-2 w-full accent-[rgb(var(--brand))]"
            aria-valuetext={`${target}% chance of profit`}
          />
          <span className="flex justify-between text-xs text-ink-2">
            <span>Bigger payout, lower chance</span>
            <span>Higher chance, smaller payout</span>
          </span>
          {Math.abs(Math.round(trade.pop * 100) - target) > 1 && (
            <p className="mt-2 text-xs text-ink-2">Closest available match: {Math.round(trade.pop * 100)}%.</p>
          )}
        </div>

        {/* Result */}
        <div>
          <p className="text-[15px] font-medium leading-snug text-ink">{describe(trade)}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-up-soft p-3">
              <p className="text-sm text-ink-2">You could make</p>
              <p className="font-display text-2xl font-semibold text-up num">{trade.maxProfit === Infinity ? 'No cap' : fmtUSD(trade.maxProfit * qty, 0)}</p>
            </div>
            <div className="rounded-2xl bg-down-soft p-3">
              <p className="text-sm text-ink-2">You could lose</p>
              <p className="font-display text-2xl font-semibold text-down num">{fmtUSD(trade.maxLoss * qty, 0)}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-ink-3">
            {trade.maxProfit === Infinity
              ? `Risk ${fmtUSD(trade.maxLoss * qty, 0)} for a gain with no cap.`
              : `Risk ${fmtUSD(trade.maxLoss * qty, 0)} to make ${fmtUSD(trade.maxProfit * qty, 0)}. `}
            {trade.maxProfit !== Infinity && 'A higher chance of profit always means a smaller payout for the risk.'}
          </p>
          <div className="mt-3">
            <PayoffChart trade={trade} spot={spot} contracts={qty} />
          </div>
        </div>

        {mode === 'pro' && <ProDetails trade={trade} days={days} qty={qty} width={width} setWidth={setWidth} />}

        {/* System-enforced stop-loss: always on, follows the slider, can't be removed. */}
        <div className="rounded-2xl border border-line bg-surface p-4" aria-labelledby="stop-label">
          <div className="flex items-center justify-between gap-3">
            <p id="stop-label" className="flex items-center gap-2 text-sm font-medium text-ink">
              <Lock className="h-4 w-4 text-ink-2" aria-hidden="true" />
              System-Enforced Stop-Loss
            </p>
            <span className="rounded-full bg-sunken px-2 py-0.5 text-xs font-medium text-ink-2">Always on</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <output htmlFor="pop" aria-readonly="true" className="font-display text-2xl font-semibold text-down num">
              −{fmtUSD(stopLossFor(trade) * qty, 0)}
            </output>
            <span className="text-sm text-ink-3 num">{Math.round((stopLossFor(trade) / trade.maxLoss) * 100)}% of the max loss</span>
          </div>
          <p className="mt-1 text-sm text-ink-3">
            Closes the trade automatically if it loses {stopLossRule(trade)}. It moves with the slider and can't be removed. A stop closes at the next available price,
            which can be worse in a fast market.
          </p>
        </div>

        {/* Size */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] text-ink">Contracts</p>
            <p className="text-sm text-ink-3 num">Up to {maxContracts} within your limit</p>
          </div>
          <div className="flex items-center rounded-xl bg-sunken">
            <button onClick={() => setContracts(Math.max(1, qty - 1))} className="p-3 text-ink-2 hover:text-ink" aria-label="Fewer contracts">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-display text-lg font-semibold text-ink num">{qty}</span>
            <button onClick={() => setContracts(Math.min(Math.max(1, maxContracts), qty + 1))} className="p-3 text-ink-2 hover:text-ink" aria-label="More contracts">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={`rounded-2xl p-4 ${block === 'size' ? 'bg-down-soft' : 'bg-sunken'}`}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-ink">Smart Stake</p>
            <p className="text-sm text-ink-2 num">
              {fmtUSD(trade.maxLoss * qty)} of {fmtUSD(cap)} at risk
            </p>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface">
            <div className={`h-full rounded-full ${block === 'size' ? 'bg-down' : 'bg-brand'}`} style={{ width: `${Math.min(100, ((trade.maxLoss * qty) / cap) * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-ink-3">
            {block === 'size'
              ? `One contract can lose ${fmtUSD(trade.maxLoss, 0)}, over your limit. Try a shorter expiration, a narrower spread or a different chance.`
              : `The most you can lose on one order is ${SMART_STAKE_PCT * 100}% of your balance${tier.maxStake ? ` or ${fmtUSD(tier.maxStake, 0)}` : ''}.`}
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
          <input id="exit-plan" type="checkbox" checked={exitPlan} onChange={(e) => setExitPlan(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--brand))]" />
          <span>
            Plan my exit: close when I've made {trade.cost < 0 ? '50% of the maximum profit' : 'back double what I paid'}
            <span className="block text-ink-3">Counts toward your discipline check.</span>
          </span>
        </label>

        <button
          onClick={() => onOpen({ trade, contracts: qty, exitPlan, stopLoss: stopLossFor(trade) })}
          disabled={Boolean(block)}
          className="btn-exec rounded-full bg-brand py-3.5 text-base font-semibold text-on-brand transition enabled:hover:brightness-110 enabled:active:scale-[0.99]"
        >
          {killSwitch ? 'Trading paused' : `${trade.cost < 0 ? 'Sell' : 'Buy'} ${qty} ${trade.kind.toLowerCase()}${qty > 1 ? 's' : ''}`}
        </button>
        <p className="text-xs leading-relaxed text-ink-3">
          Sent to [PARTNER] as one order; the options sit in your own account. Chance of profit is an estimate from option prices, not a guarantee. SPY options can be exercised early,
          and each contract covers 100 shares. Commission $0; regulatory fees may apply.
        </p>
      </aside>
    </div>
  );
}

function Gate({ block, optionsPending, onApplyOptions, onOpenPath }) {
  const [ack, setAck] = useState(false);
  if (block === 'options') {
    return (
      <div className="rounded-2xl bg-gold-soft p-4 text-sm text-gold-ink">
        <p className="flex items-start gap-2 font-semibold">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" /> Options trading needs approval from [PARTNER]
        </p>
        <label className="mt-3 flex cursor-pointer items-start gap-2">
          <input id="odd-ack" type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--brand))]" />
          <span>
            I've read <span className="inline-flex items-center gap-1 font-semibold"><FileText className="h-3.5 w-3.5" />Characteristics and Risks of Standardized Options</span>.
          </span>
        </label>
        <button
          onClick={onApplyOptions}
          disabled={!ack || optionsPending}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand py-2.5 font-semibold text-on-brand transition enabled:hover:brightness-110 disabled:opacity-45"
        >
          {optionsPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {optionsPending ? 'Partner is reviewing' : 'Apply for options trading'}
        </button>
      </div>
    );
  }
  if (block === 'spreads') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gold-soft p-4 text-sm text-gold-ink">
        <p className="flex items-start gap-2">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">The 50–99% side sells spreads,</span> which need a margin account (Tier B, with partner approval). Below 50% you can buy single calls and puts today.
          </span>
        </p>
        <button onClick={onOpenPath} className="rounded-full bg-brand px-4 py-1.5 font-semibold text-on-brand hover:brightness-110">
          See how to unlock spreads
        </button>
      </div>
    );
  }
  return null;
}

function ProDetails({ trade, days, qty, width, setWidth }) {
  const g = trade.greeks;
  const showWidth = trade.width && trade.kind !== 'Call butterfly';
  return (
    <div className="rounded-2xl bg-sunken p-4 text-sm">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold text-ink">{tradeName(trade)}</p>
        <p className="text-ink-3">IV {(trade.atm * 100).toFixed(1)}%</p>
      </div>
      <table className="mt-3 w-full">
        <thead>
          <tr className="text-left text-ink-3">
            <th className="pb-1 font-medium">Leg</th>
            <th className="pb-1 text-right font-medium">Strike</th>
            <th className="pb-1 text-right font-medium">Delta</th>
            <th className="pb-1 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody className="text-ink">
          {trade.legs.map((l, i) => (
            <tr key={i} className="border-t border-line">
              <td className="py-1.5">
                <span className={l.side === 'buy' ? 'text-up' : 'text-down'}>{l.side === 'buy' ? 'Buy' : 'Sell'}</span> {l.qty > 1 ? `${l.qty}× ` : ''}
                {l.type}
              </td>
              <td className="py-1.5 text-right num">{l.strike}</td>
              <td className="py-1.5 text-right num">{l.greeks.delta.toFixed(2)}</td>
              <td className="py-1.5 text-right num">{l.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 grid grid-cols-4 gap-2 border-t border-line pt-3 text-center">
        {[
          ['Delta', g.delta * qty, 1],
          ['Gamma', g.gamma * qty, 2],
          ['Theta', g.theta * qty, 2],
          ['Vega', g.vega * qty, 2],
        ].map(([label, v, d]) => (
          <div key={label}>
            <p className="text-xs text-ink-3">{label}</p>
            <p className="font-semibold text-ink num">{v.toFixed(d)}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-3">
        Position Greeks for {qty} contract{qty > 1 ? 's' : ''}. Theta is dollars per day; vega is dollars per 1 point of IV. Expires {expiryLabel(days).toLowerCase()}.
      </p>
      {showWidth && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-ink-2">Spread width</span>
          {WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => setWidth(w)}
              aria-pressed={trade.width === w}
              className={`rounded-full px-2.5 py-0.5 font-medium num ${trade.width === w ? 'bg-brand text-on-brand' : 'bg-surface text-ink-2 ring-1 ring-line hover:text-ink'}`}
            >
              ${w}
            </button>
          ))}
          {width != null && (
            <button onClick={() => setWidth(null)} className="text-brand hover:underline">
              Auto
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PositionsCard({ positions, spot, balance, tier, killSwitch, onClose, onCloseAll, onReverse, onOpenPath }) {
  const [pending, setPending] = useState(null); // { id, action: 'reverse' | 'close' | 'blocked' }
  const [confirmAll, setConfirmAll] = useState(false);
  const cap = smartStakeCap(balance, tier);
  const rows = positions.map((p) => {
    const now = markLegs(p.trade.legs, spot, p.trade.days, BASE_IV);
    return { ...p, pnl: (now - p.trade.cost) * 100 * p.contracts };
  });
  const total = rows.reduce((s, r) => s + r.pnl, 0);

  return (
    <section className="card p-6" aria-labelledby="positions-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="positions-title" className="font-display text-xl font-semibold text-ink">
            Your positions
          </h2>
          {rows.length > 0 && <p className={`text-sm num ${total >= 0 ? 'text-up' : 'text-down'}`}>{signed(total)} unrealized</p>}
        </div>
        {rows.length > 0 &&
          (confirmAll ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-2">Close all {rows.length} at the current price?</span>
              <button onClick={() => setConfirmAll(false)} className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-sunken">
                Cancel
              </button>
              <button
                onClick={() => {
                  onCloseAll();
                  setConfirmAll(false);
                }}
                disabled={killSwitch}
                className="btn-exec rounded-full bg-down px-4 py-1.5 text-sm font-semibold text-surface enabled:hover:brightness-110"
              >
                Yes, close all
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAll(true)}
              disabled={killSwitch}
              className="btn-exec inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-down ring-1 ring-down/40 enabled:hover:bg-down-soft"
            >
              <XCircle className="h-4 w-4" /> Close all positions
            </button>
          ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">No open positions. Build a trade with the slider and it will show up here.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {rows.map((p) => {
            const confirming = pending?.id === p.id ? pending.action : null;
            const blocked = reverseBlock(p, cap, tier, killSwitch, spot);
            const dir = p.trade.direction;
            return (
              <li key={p.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <div className="min-w-[200px]">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg font-semibold text-ink">{tradeName(p.trade)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          dir === 'up' ? 'bg-up-soft text-up' : dir === 'down' ? 'bg-down-soft text-down' : 'bg-brand-soft text-brand'
                        }`}
                      >
                        {dir === 'up' ? 'Up' : dir === 'down' ? 'Down' : 'In range'}
                      </span>
                    </p>
                    <p className="text-sm text-ink-3 num">
                      {p.contracts} contract{p.contracts > 1 ? 's' : ''}, {premiumLabel(p.trade.cost)} each, expires {expiryDate(p.trade.days)}
                      {p.exitPlan ? ', exit planned' : ''}, stop at −{fmtUSD(p.stopLoss * p.contracts, 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className={`font-semibold num ${p.pnl >= 0 ? 'text-up' : 'text-down'}`}>{signed(p.pnl)}</p>
                    {!confirming && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setPending({ id: p.id, action: blocked ? 'blocked' : 'reverse' })}
                          disabled={killSwitch}
                          aria-label={`Reverse position ${tradeName(p.trade)}`}
                          className="btn-exec inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-brand ring-1 ring-brand/40 enabled:hover:bg-brand-soft"
                        >
                          <ArrowLeftRight className="h-4 w-4" /> Reverse position
                        </button>
                        <button
                          onClick={() => setPending({ id: p.id, action: 'close' })}
                          disabled={killSwitch}
                          aria-label={`Close position ${tradeName(p.trade)}`}
                          className="btn-exec inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-2 ring-1 ring-line enabled:hover:bg-sunken enabled:hover:text-ink"
                        >
                          <X className="h-4 w-4" /> Close
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {confirming === 'reverse' && (
                  <Confirm tone="brand" onCancel={() => setPending(null)} onConfirm={() => (onReverse(p.id), setPending(null))} label="Confirm reverse" disabled={killSwitch}>
                    Close this and open the same trade pointing {dir === 'up' ? 'down' : 'up'}, at the same chance of profit and expiration.
                  </Confirm>
                )}
                {confirming === 'close' && (
                  <Confirm tone="ink" onCancel={() => setPending(null)} onConfirm={() => (onClose(p.id), setPending(null))} label="Confirm close" disabled={killSwitch}>
                    Close {p.contracts} contract{p.contracts > 1 ? 's' : ''} at the current price. You'd realize{' '}
                    <span className={`font-semibold num ${p.pnl >= 0 ? 'text-up' : 'text-down'}`}>{signed(p.pnl)}</span>.
                  </Confirm>
                )}
                {confirming === 'blocked' && blocked && (
                  <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gold-soft px-4 py-3">
                    <p className="flex items-start gap-2 text-sm text-gold-ink">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <span className="font-semibold">Can't reverse this yet.</span> {blocked.text}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setPending(null)} className="rounded-full px-3 py-1.5 text-sm font-medium text-gold-ink hover:bg-surface">
                        OK
                      </button>
                      {blocked.code === 'spreads' && (
                        <button onClick={() => (setPending(null), onOpenPath())} className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-on-brand hover:brightness-110">
                          See how to unlock spreads
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Confirm({ children, tone, onCancel, onConfirm, label, disabled }) {
  return (
    <div className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 ${tone === 'brand' ? 'bg-brand-soft' : 'bg-sunken'}`}>
      <p className="text-sm text-ink">{children}</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-surface">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={disabled}
          className={`btn-exec rounded-full px-4 py-1.5 text-sm font-semibold enabled:hover:brightness-110 ${tone === 'brand' ? 'bg-brand text-on-brand' : 'bg-ink text-bg'}`}
        >
          {label}
        </button>
      </div>
    </div>
  );
}

/** Why a position can't be reversed, or null. Mirrors the rules on the ticket. */
export function reverseBlock(p, cap, tier, killSwitch, spot) {
  if (killSwitch) return { code: 'paused', text: 'Trading is paused.' };
  if (p.trade.direction === 'range') return { code: 'range', text: 'An in-range trade has no opposite direction. Close it instead.' };
  const mirror = mirrorOf(p.trade, spot, BASE_IV);
  if (mirror.spreadNeeded && !tier.margin) return { code: 'spreads', text: 'The reversed trade is a spread, which needs a margin account (Tier B, with partner approval).' };
  if (mirror.maxLoss * p.contracts > cap) return { code: 'size', text: `The reversed trade could lose ${fmtUSD(mirror.maxLoss * p.contracts)}, over your ${fmtUSD(cap)} Smart Stake limit.` };
  return null;
}

function Stat({ label, value, note }) {
  return (
    <div className="rounded-2xl bg-surface p-5 ring-1 ring-line">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-ink num">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-3">{note}</p>
    </div>
  );
}

// ---- helpers ---------------------------------------------------------------

export function expiryDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(days > 300 ? { year: 'numeric' } : {}) });
}

const signed = (n) => `${n >= 0 ? '+' : '−'}${fmtUSD(Math.abs(n))}`;
const premiumLabel = (cost) => (cost < 0 ? `${fmtUSD(-cost)} credit` : `${fmtUSD(cost)} debit`);

function describe(t) {
  const on = `on ${expiryDate(t.days)}`;
  const b = t.breakevens.map((x) => fmtUSD(x));
  const strikes = [...new Set(t.legs.map((l) => l.strike))];
  switch (t.kind) {
    case 'Long call':
      return `Buy the ${strikes[0]} call. You profit if SPY finishes above ${b[0]} ${on}.`;
    case 'Long put':
      return `Buy the ${strikes[0]} put. You profit if SPY finishes below ${b[0]} ${on}.`;
    case 'Put credit spread':
      return `Sell the ${strikes.join('/')} put spread. You profit if SPY finishes above ${b[0]} ${on}.`;
    case 'Call credit spread':
      return `Sell the ${strikes.join('/')} call spread. You profit if SPY finishes below ${b[0]} ${on}.`;
    case 'Iron condor':
      return `Sell an iron condor. You profit if SPY finishes between ${b[0]} and ${b[1]} ${on}.`;
    default:
      return `Buy a butterfly centered at ${strikes[1]}. You profit if SPY finishes between ${b[0]} and ${b[1]} ${on}.`;
  }
}

/** Tax-reporting support (white paper §5): cost basis and realized P&L; official 1099s come from the partner. */
function copyCostBasis(orders, notify) {
  const rows = [
    ['time', 'action', 'trade', 'contracts', 'price_per_share', 'total', 'realized'],
    ...orders.map((o) => [o.time, o.action, o.name, o.contracts, o.price.toFixed(2), (o.price * 100 * o.contracts).toFixed(2), o.realized == null ? '' : o.realized.toFixed(2)]),
  ];
  const csv = rows.map((r) => r.join(',')).join('\n');
  const done = () => notify({ kind: 'success', title: 'Cost basis copied', body: `${orders.length} order${orders.length === 1 ? '' : 's'} as CSV, with realized gains and losses.` });
  const fail = () => notify({ kind: 'warning', title: "Couldn't copy", body: 'Your browser blocked clipboard access.' });
  try {
    navigator.clipboard.writeText(csv).then(done, fail);
  } catch {
    fail();
  }
}

