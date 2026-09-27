import { useMemo, useRef, useState } from 'react';
import { payoffAt } from '../data/options.js';
import { fmtNum, fmtUSD } from '../data/mock.js';

/**
 * Profit or loss at expiration across SPY prices, for `contracts` contracts.
 * Green above zero, red below, with today's price and the breakevens marked.
 */
export default function PayoffChart({ trade, spot, contracts = 1, height = 170 }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 600;
  const H = height;
  const padY = 12;

  const { xs, pts, lo, hi, minY, maxY } = useMemo(() => {
    const span = Math.max(trade.expectedMove * 2.6, ...trade.breakevens.map((b) => Math.abs(b - spot) * 1.35), 2);
    const lo = spot - span;
    const hi = spot + span;
    const n = 160;
    const xs = Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1));
    const pts = xs.map((x) => payoffAt(trade, x) * contracts);
    let minY = Math.min(...pts, 0);
    let maxY = Math.max(...pts, 0);
    const pad = (maxY - minY) * 0.12 || 1;
    return { xs, pts, lo, hi, minY: minY - pad, maxY: maxY + pad };
  }, [trade, spot, contracts]);

  const xOf = (x) => ((x - lo) / (hi - lo)) * W;
  const yOf = (v) => padY + (1 - (v - minY) / (maxY - minY)) * (H - padY * 2);
  const zeroY = yOf(0);
  const line = pts.map((v, i) => `${i ? 'L' : 'M'}${xOf(xs[i]).toFixed(1)},${yOf(v).toFixed(1)}`).join('');
  const area = `${line}L${W},${zeroY}L0,${zeroY}Z`;

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (xs.length - 1));
    setHover(Math.max(0, Math.min(xs.length - 1, i)));
  };

  return (
    <figure className="m-0">
      <div className="relative w-full max-w-full select-none" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label="Profit or loss at expiration by SPY price"
        >
          <defs>
            <clipPath id="above">
              <rect x="0" y="0" width={W} height={zeroY} />
            </clipPath>
            <clipPath id="below">
              <rect x="0" y={zeroY} width={W} height={H - zeroY} />
            </clipPath>
          </defs>
          <path d={area} clipPath="url(#above)" style={{ fill: 'rgb(var(--up))', opacity: 0.14 }} />
          <path d={area} clipPath="url(#below)" style={{ fill: 'rgb(var(--down))', opacity: 0.12 }} />
          <line x1="0" x2={W} y1={zeroY} y2={zeroY} vectorEffect="non-scaling-stroke" style={{ stroke: 'rgb(var(--line))' }} />
          <path d={line} clipPath="url(#above)" fill="none" strokeWidth="2.25" vectorEffect="non-scaling-stroke" style={{ stroke: 'rgb(var(--up))' }} />
          <path d={line} clipPath="url(#below)" fill="none" strokeWidth="2.25" vectorEffect="non-scaling-stroke" style={{ stroke: 'rgb(var(--down))' }} />
          <line x1={xOf(spot)} x2={xOf(spot)} y1="0" y2={H} strokeDasharray="4 5" vectorEffect="non-scaling-stroke" style={{ stroke: 'rgb(var(--ink-3))' }} />
          {hover != null && <line x1={xOf(xs[hover])} x2={xOf(xs[hover])} y1="0" y2={H} vectorEffect="non-scaling-stroke" style={{ stroke: 'rgb(var(--ink-2))', strokeOpacity: 0.5 }} />}
        </svg>
        <div className="pointer-events-none absolute inset-0">
          <span className="absolute top-0 -translate-x-1/2 rounded bg-surface/90 px-1 text-xs text-ink-3" style={{ left: `${(xOf(spot) / W) * 100}%` }}>
            Now
          </span>
          {hover != null && (
            <span
              className="absolute bottom-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-medium text-bg shadow-pop num"
              style={{ left: `${Math.min(84, Math.max(16, (xOf(xs[hover]) / W) * 100))}%` }}
            >
              SPY {fmtNum(xs[hover])}: {pts[hover] >= 0 ? '+' : '−'}
              {fmtUSD(Math.abs(pts[hover]), 0)}
            </span>
          )}
        </div>
      </div>
      <figcaption className="mt-1 flex justify-between text-xs text-ink-3 num">
        <span>{fmtNum(lo, 0)}</span>
        <span>
          Breakeven {trade.breakevens.map((b) => fmtNum(b)).join(' and ')}
        </span>
        <span>{fmtNum(hi, 0)}</span>
      </figcaption>
    </figure>
  );
}
