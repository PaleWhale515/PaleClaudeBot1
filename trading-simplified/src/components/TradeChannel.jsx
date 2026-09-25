import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowLeftRight, ArrowUp, ClipboardCopy, Lock, Minus, Plus, X, XCircle } from 'lucide-react';
import PriceChart from './PriceChart.jsx';
import { SMART_STAKE_PCT, TRADE_SYMBOLS, fmtNum, fmtUSD, makeSeries, seedFrom, smartStakeCap } from '../data/mock.js';
import { newRiskQty, reverseBlockReason } from '../data/positions.js';

export default function TradeChannel({ killSwitch, balance, tier, nextTier, orders, holdings, marks, onOrder, onReverse, onClose, onCloseAll, notify }) {
  const [symbol, setSymbol] = useState('SPY');
  const q = TRADE_SYMBOLS.find((s) => s.symbol === symbol);
  const mark = marks[symbol];
  const baseSeries = useMemo(() => makeSeries(seedFrom('trade' + symbol), q.price, q.price * 0.0028, 110), [symbol, q.price]);
  const series = useMemo(() => [...baseSeries.slice(1), mark], [baseSeries, mark]);
  const band = { low: q.price - q.expectedMove, high: q.price + q.expectedMove };
  const change = q.change + ((mark - q.price) / q.price) * 100;
  const up = change >= 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Symbols">
          {TRADE_SYMBOLS.map((s) => (
            <button
              key={s.symbol}
              role="tab"
              aria-selected={s.symbol === symbol}
              onClick={() => setSymbol(s.symbol)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                s.symbol === symbol ? 'bg-ink text-bg' : 'bg-surface text-ink-2 ring-1 ring-line hover:text-ink'
              }`}
            >
              {s.symbol}
            </button>
          ))}
        </div>

        <section className="card p-6 sm:p-8">
          <p className="text-ink-2">{q.name}</p>
          <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1">
            <p className="font-display text-5xl font-semibold tracking-tight text-ink num">{fmtUSD(mark)}</p>
            <p className={`flex items-center gap-1 pb-1.5 text-[15px] font-medium num ${up ? 'text-up' : 'text-down'}`}>
              {up ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {Math.abs(change).toFixed(2)}% today
            </p>
          </div>
          <div className="mt-6">
            <PriceChart data={series} height={240} tone="brand" band={band} format={(v) => fmtNum(v)} />
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-3">
            <span className="h-3 w-5 rounded-sm bg-gold/30" aria-hidden="true" /> Shaded band: the range the options market expects this week
          </p>
        </section>

        <section aria-labelledby="context-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="context-title" className="font-display text-xl font-semibold text-ink">
              Before you trade
            </h2>
            <p className="text-sm text-ink-3">Market context from the Mechanical Data Dashboard. Not a recommendation.</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Stat label="IV Rank" value={`${q.ivRank}%`} note={q.ivRank >= 50 ? 'Options cost more than usual compared with the past year.' : 'Options cost about what they usually do this year.'} />
            <Stat label="Expected move" value={`±${fmtUSD(q.expectedMove)}`} note={`The market expects ${fmtNum(band.low)} to ${fmtNum(band.high)} this week.`} />
            <Stat label="Probability of profit" value={`${q.pop}%`} note="Estimated for this setup at today's price." />
          </div>
        </section>

        <PositionsCard holdings={holdings} marks={marks} balance={balance} tier={tier} killSwitch={killSwitch} onReverse={onReverse} onClose={onClose} onCloseAll={onCloseAll} onSelect={setSymbol} />

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
            <p className="mt-3 text-sm text-ink-2">No orders yet. In this demo, orders fill right away at their limit price.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-left text-ink-3">
                    <th className="py-2 pr-4 font-medium">Time</th>
                    <th className="py-2 pr-4 font-medium">Order</th>
                    <th className="py-2 pr-4 text-right font-medium">Limit</th>
                    <th className="py-2 pr-4 text-right font-medium">Total</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.map((o) => (
                    <tr key={o.id} className="animate-flash text-ink">
                      <td className="py-3 pr-4 text-ink-3 num">{o.time}</td>
                      <td className="py-3 pr-4">
                        <span className={`font-semibold ${o.side === 'BUY' ? 'text-up' : 'text-down'}`}>{o.side === 'BUY' ? 'Buy' : 'Sell'}</span> {fmtQty(o.qty)} {o.symbol}
                      </td>
                      <td className="py-3 pr-4 text-right num">{fmtNum(o.limit)}</td>
                      <td className="py-3 pr-4 text-right num">{fmtUSD(o.notional)}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-up-soft px-2 py-0.5 text-xs font-medium text-up">Filled</span>
                        {o.note && <span className="ml-1.5 text-xs text-ink-3">{o.note}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <OrderTicket key={symbol} quote={q} mark={mark} held={holdings[symbol]?.qty ?? 0} balance={balance} tier={tier} nextTier={nextTier} killSwitch={killSwitch} onOrder={onOrder} />
    </div>
  );
}

function PositionsCard({ holdings, marks, balance, tier, killSwitch, onReverse, onClose, onCloseAll, onSelect }) {
  // { symbol, action: 'reverse' | 'close' } while a row is asking for confirmation
  const [pending, setPending] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const rows = Object.entries(holdings).map(([symbol, h]) => {
    const mark = marks[symbol];
    return { symbol, ...h, mark, value: h.qty * mark, pnl: (mark - h.avg) * h.qty };
  });
  const cap = smartStakeCap(balance, tier);
  const totalPnl = rows.reduce((sum, p) => sum + p.pnl, 0);

  return (
    <section className="card p-6" aria-labelledby="positions-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="positions-title" className="font-display text-xl font-semibold text-ink">
            Your positions
          </h2>
          {rows.length > 0 && (
            <p className={`text-sm num ${totalPnl >= 0 ? 'text-up' : 'text-down'}`}>
              {totalPnl >= 0 ? '+' : '−'}
              {fmtUSD(Math.abs(totalPnl))} unrealized
            </p>
          )}
        </div>
        {rows.length > 0 &&
          (confirmClose ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-2">
                Sell or cover all {rows.length} at market?
              </span>
              <button onClick={() => setConfirmClose(false)} className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-sunken">
                Cancel
              </button>
              <button
                onClick={() => {
                  onCloseAll();
                  setConfirmClose(false);
                }}
                disabled={killSwitch}
                className="btn-exec rounded-full bg-down px-4 py-1.5 text-sm font-semibold text-surface enabled:hover:brightness-110"
              >
                Yes, close all
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClose(true)}
              disabled={killSwitch}
              className="btn-exec inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-down ring-1 ring-down/40 enabled:hover:bg-down-soft"
            >
              <XCircle className="h-4 w-4" /> Close all positions
            </button>
          ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">You don't hold anything yet. Buy shares with the ticket and they'll appear here.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {rows.map((p) => {
            const blocked = reverseBlockReason({ qty: p.qty, mark: p.mark, cap, tier, killSwitch });
            const long = p.qty > 0;
            const confirming = pending?.symbol === p.symbol ? pending.action : null;
            return (
              <li key={p.symbol} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <button onClick={() => onSelect(p.symbol)} className="min-w-[140px] text-left">
                    <span className="flex items-center gap-2">
                      <span className="font-display text-lg font-semibold text-ink">{p.symbol}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${long ? 'bg-up-soft text-up' : 'bg-down-soft text-down'}`}>{long ? 'Long' : 'Short'}</span>
                    </span>
                    <span className="block text-sm text-ink-3 num">
                      {fmtQty(Math.abs(p.qty))} shares, avg {fmtNum(p.avg)}
                    </span>
                  </button>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-medium text-ink num">{fmtUSD(Math.abs(p.value))}</p>
                      <p className={`text-sm num ${p.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                        {p.pnl >= 0 ? '+' : '−'}
                        {fmtUSD(Math.abs(p.pnl))}
                      </p>
                    </div>
                    {!confirming && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setPending({ symbol: p.symbol, action: 'reverse' })}
                          disabled={Boolean(blocked)}
                          aria-describedby={blocked ? `rev-why-${p.symbol}` : undefined}
                          aria-label={`Reverse position in ${p.symbol}`}
                          className="btn-exec inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-brand ring-1 ring-brand/40 enabled:hover:bg-brand-soft"
                        >
                          <ArrowLeftRight className="h-4 w-4" /> Reverse position
                        </button>
                        <button
                          onClick={() => setPending({ symbol: p.symbol, action: 'close' })}
                          disabled={killSwitch}
                          aria-label={`Close position in ${p.symbol}`}
                          className="btn-exec inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-2 ring-1 ring-line enabled:hover:bg-sunken enabled:hover:text-ink"
                        >
                          <X className="h-4 w-4" /> Close
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {confirming === 'reverse' && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-soft px-4 py-3">
                    <p className="text-sm text-ink">
                      {long ? 'Sell' : 'Buy'} {fmtQty(Math.abs(p.qty) * 2)} {p.symbol} at about {fmtNum(p.mark)}. You'll go from{' '}
                      {long ? 'long' : 'short'} to {long ? 'short' : 'long'} {fmtQty(Math.abs(p.qty))} shares.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setPending(null)} className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-surface">
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onReverse(p.symbol);
                          setPending(null);
                        }}
                        disabled={Boolean(blocked)}
                        className="btn-exec rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-on-brand enabled:hover:brightness-110"
                      >
                        Confirm reverse
                      </button>
                    </div>
                  </div>
                )}
                {confirming === 'close' && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sunken px-4 py-3">
                    <p className="text-sm text-ink">
                      {long ? 'Sell' : 'Buy back'} {fmtQty(Math.abs(p.qty))} {p.symbol} at about {fmtNum(p.mark)}. You'd realize{' '}
                      <span className={`font-semibold num ${p.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                        {p.pnl >= 0 ? '+' : '−'}
                        {fmtUSD(Math.abs(p.pnl))}
                      </span>
                      .
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setPending(null)} className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-surface">
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onClose(p.symbol);
                          setPending(null);
                        }}
                        disabled={killSwitch}
                        className="btn-exec rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-bg enabled:hover:brightness-110"
                      >
                        Confirm close
                      </button>
                    </div>
                  </div>
                )}
                {blocked && (
                  <p id={`rev-why-${p.symbol}`} className="mt-2 text-sm text-ink-3">
                    Reverse unavailable: {blocked}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
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

function OrderTicket({ quote, mark, held, balance, tier, nextTier, killSwitch, onOrder }) {
  const [side, setSide] = useState('BUY');
  const [limit, setLimit] = useState(mark.toFixed(2));
  const [qty, setQty] = useState(() => Math.min(1, floor3(smartStakeCap(balance, tier) / mark)));
  const [useMargin, setUseMargin] = useState(false);

  useEffect(() => {
    if (!tier.margin) setUseMargin(false);
  }, [tier.margin]);

  const cap = smartStakeCap(balance, tier);
  const limitNum = parseFloat(limit) || 0;
  const notional = qty * limitNum;
  const signed = side === 'BUY' ? qty : -qty;
  const canShort = tier.margin && useMargin;
  // Smart Stake limits new risk only; closing or reducing a position is always allowed.
  const riskNotional = newRiskQty(held, signed) * limitNum;
  const usage = cap > 0 ? riskNotional / cap : 0;
  const over = riskNotional > cap;
  // A short sale needs a margin account (Reg T): cash accounts can only sell shares they own.
  const shortBlocked = held + signed < -0.0005 && !canShort;
  const capQty = limitNum > 0 ? floor3(cap / limitNum) : 0;
  const reducible = side === 'BUY' ? Math.max(0, -held) : Math.max(0, held);
  const maxQty = floor3(reducible + (side === 'SELL' && !canShort && held >= 0 ? 0 : capQty));
  const invalid = !(qty > 0) || limitNum <= 0;
  const disabled = killSwitch || over || shortBlocked || invalid;
  const tierCapped = tier.maxStake && balance * SMART_STAKE_PCT > tier.maxStake;

  return (
    <aside className="card flex h-fit flex-col gap-5 p-6 lg:sticky lg:top-28">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold text-ink">
          {side === 'BUY' ? 'Buy' : 'Sell'} {quote.symbol}
        </h2>
        <span className="text-sm text-ink-3">Limit order, good for today</span>
      </div>

      <div className="grid grid-cols-2 rounded-full bg-sunken p-1">
        {['BUY', 'SELL'].map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`rounded-full py-2 text-[15px] font-semibold transition ${side === s ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'}`}
          >
            {s === 'BUY' ? 'Buy' : 'Sell'}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="flex justify-between text-sm">
          <span className="text-ink-2">Shares</span>
          <span className="text-ink-3 num">{held !== 0 ? `You hold ${held > 0 ? '' : '−'}${fmtQty(Math.abs(held))}. ` : ''}Up to {fmtQty(maxQty)}</span>
        </span>
        <span className="mt-1.5 flex items-center rounded-xl bg-sunken ring-brand focus-within:ring-2">
          <button type="button" onClick={() => setQty((n) => floor3(Math.max(0.001, n - (n > 1 ? 1 : 0.1))))} className="p-3 text-ink-2 hover:text-ink" aria-label="Fewer shares">
            <Minus className="h-4 w-4" />
          </button>
          <input
            id="ticket-qty"
            type="number"
            min={0}
            step="0.001"
            value={qty}
            onChange={(e) => setQty(Math.max(0, floor3(parseFloat(e.target.value || '0'))))}
            className="w-full bg-transparent text-center font-display text-xl font-semibold text-ink outline-none num"
          />
          <button type="button" onClick={() => setQty((n) => floor3(n + (n >= 1 ? 1 : 0.1)))} className="p-3 text-ink-2 hover:text-ink" aria-label="More shares">
            <Plus className="h-4 w-4" />
          </button>
        </span>
      </label>

      <label className="block">
        <span className="flex justify-between text-sm">
          <span className="text-ink-2">Limit price</span>
          <button type="button" onClick={() => setLimit(mark.toFixed(2))} className="font-medium text-brand hover:underline">
            Use {fmtNum(mark)}
          </button>
        </span>
        <span className="mt-1.5 flex items-center rounded-xl bg-sunken px-4 ring-brand focus-within:ring-2">
          <span className="text-ink-3">$</span>
          <input
            id="ticket-limit"
            type="number"
            step="0.01"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full bg-transparent py-3 pl-1 font-display text-xl font-semibold text-ink outline-none num"
          />
        </span>
      </label>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[15px] text-ink">Use margin</p>
          <p className="text-sm text-ink-3">
            {tier.margin ? `Buying power ${fmtUSD(useMargin ? balance * 2 : balance)}, updated through the day` : `Unlocks at ${nextTier?.name ?? 'Tier B'} with partner approval`}
          </p>
        </div>
        {tier.margin ? (
          <button
            role="switch"
            aria-checked={useMargin}
            aria-label="Use margin"
            onClick={() => setUseMargin((m) => !m)}
            className={`relative h-6 w-10 shrink-0 rounded-full transition ${useMargin ? 'bg-brand' : 'bg-line'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all ${useMargin ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        ) : (
          <Lock className="h-4 w-4 shrink-0 text-ink-3" aria-label="Locked" />
        )}
      </div>

      <div className={`rounded-2xl p-4 ${over ? 'bg-down-soft' : 'bg-sunken'}`}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-ink">Smart Stake</p>
          <p className="text-sm text-ink-2 num">
            {fmtUSD(riskNotional)} of {fmtUSD(cap)}
          </p>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface">
          <div className={`h-full rounded-full transition-all duration-300 ${over ? 'bg-down' : 'bg-brand'}`} style={{ width: `${Math.min(100, usage * 100)}%` }} />
        </div>
        <p className="mt-2 text-sm text-ink-3">
          {riskNotional === 0 && qty > 0
            ? "This order only closes or reduces a position, so it doesn't count toward the limit."
            : tierCapped
              ? `${tier.name} orders are capped at ${fmtUSD(tier.maxStake, 0)}.`
              : `Each order can add up to ${SMART_STAKE_PCT * 100}% of your balance in new risk.`}
        </p>
        {over && (
          <div className="mt-3 flex items-start justify-between gap-3">
            <p className="flex items-start gap-2 text-sm text-down">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {fmtUSD(riskNotional - cap)} over the limit.
            </p>
            <button type="button" onClick={() => setQty(maxQty)} className="shrink-0 rounded-full bg-surface px-3 py-1 text-sm font-semibold text-down ring-1 ring-down/40 hover:bg-down-soft">
              Clamp to {fmtQty(maxQty)}
            </button>
          </div>
        )}
      </div>

      {shortBlocked && (
        <p className="flex items-start gap-2 rounded-2xl bg-gold-soft px-4 py-3 text-sm text-gold-ink">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          {held > 0 ? `You own ${fmtQty(held)} ${quote.symbol}. Selling more would open a short position,` : `You don't own ${quote.symbol}. Selling it would open a short position,`}{' '}
          {tier.margin ? 'so turn on margin first.' : `which needs a margin account (${nextTier?.name ?? 'Tier B'}, with partner approval).`}
        </p>
      )}

      <dl className="space-y-2 text-sm">
        <SummaryRow label="Estimated total" value={fmtUSD(notional)} strong />
        <SummaryRow label="Share of your balance" value={`${balance > 0 ? ((notional / balance) * 100).toFixed(1) : '0.0'}%`} />
        <SummaryRow label="Settles" value="Next business day" />
        <SummaryRow label="Sent through" value="[PARTNER]" />
      </dl>

      <button
        onClick={() => onOrder({ side, symbol: quote.symbol, qty, limit: limitNum, notional, margin: useMargin })}
        disabled={disabled}
        className="btn-exec rounded-full bg-brand py-3.5 text-base font-semibold text-on-brand transition enabled:hover:brightness-110 enabled:active:scale-[0.99]"
      >
        {killSwitch ? 'Trading paused' : `${side === 'BUY' ? 'Buy' : 'Sell'} ${fmtQty(qty)} ${quote.symbol} at ${fmtNum(limitNum)}`}
      </button>
      {killSwitch && <p className="-mt-2 text-center text-sm text-down">API Latency: View-Only Mode</p>}
    </aside>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-2">{label}</dt>
      <dd className={`num ${strong ? 'font-semibold text-ink' : 'text-ink'}`}>{value}</dd>
    </div>
  );
}

/** Tax-reporting support (v3.8 §5): user-side cost-basis export; official 1099s come from the partner. */
function copyCostBasis(orders, notify) {
  const rows = [['time', 'side', 'symbol', 'qty', 'limit', 'notional', 'account'], ...orders.map((o) => [o.time, o.side, o.symbol, o.qty, o.limit.toFixed(2), o.notional.toFixed(2), o.margin ? 'margin' : 'cash'])];
  const csv = rows.map((r) => r.join(',')).join('\n');
  const done = () => notify({ kind: 'success', title: 'Cost basis copied', body: `${orders.length} order${orders.length === 1 ? '' : 's'} as CSV. Paste it into a spreadsheet.` });
  const fail = () => notify({ kind: 'warning', title: "Couldn't copy", body: 'Your browser blocked clipboard access.' });
  try {
    navigator.clipboard.writeText(csv).then(done, fail);
  } catch {
    fail();
  }
}

const floor3 = (n) => Math.floor(n * 1000) / 1000;
const fmtQty = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, ''));
