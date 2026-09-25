import { useMemo, useRef, useState } from 'react';

/**
 * Single-series area chart with a hover crosshair. Colors are theme tokens
 * (e.g. 'up', 'down', 'brand') so the chart follows light and dark mode.
 * Optional `band` shades an expected-move range; `baseline` draws a reference line.
 */
export default function PriceChart({ data, height = 260, tone = 'brand', band, baseline, baselineLabel = 'Strike', format = (v) => v.toFixed(2) }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 800;
  const H = height;
  const padR = 8;
  const padY = 14;
  const color = `rgb(var(--${tone}))`;

  const { min, max, path, area, xs, ys } = useMemo(() => {
    let lo = Math.min(...data);
    let hi = Math.max(...data);
    if (band) {
      lo = Math.min(lo, band.low);
      hi = Math.max(hi, band.high);
    }
    if (baseline != null) {
      lo = Math.min(lo, baseline);
      hi = Math.max(hi, baseline);
    }
    const pad = (hi - lo) * 0.1 || 1;
    lo -= pad;
    hi += pad;
    const xs = data.map((_, i) => (i / (data.length - 1)) * (W - padR));
    const ys = data.map((v) => padY + (1 - (v - lo) / (hi - lo)) * (H - padY * 2));
    const path = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join('');
    const area = `${path}L${xs[xs.length - 1]},${H}L0,${H}Z`;
    return { min: lo, max: hi, path, area, xs, ys };
  }, [data, band, baseline, H]);

  const yOf = (v) => padY + (1 - (v - min) / (max - min)) * (H - padY * 2);
  const gid = `fill-${tone}`;
  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    setHover(Math.max(0, Math.min(data.length - 1, Math.round((x / (W - padR)) * (data.length - 1)))));
  };

  return (
    <div className="relative w-full max-w-full select-none" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Price chart"
      >
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.16 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {band && (
          <rect x={0} width={W} y={yOf(band.high)} height={yOf(band.low) - yOf(band.high)} style={{ fill: 'rgb(var(--gold))', opacity: 0.12 }} />
        )}
        {baseline != null && (
          <line x1="0" x2={W} y1={yOf(baseline)} y2={yOf(baseline)} strokeDasharray="5 6" vectorEffect="non-scaling-stroke" style={{ stroke: 'rgb(var(--ink-3))', strokeOpacity: 0.7 }} />
        )}
        <path d={area} style={{ fill: `url(#${gid})` }} />
        <path d={path} fill="none" strokeWidth="2.25" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" style={{ stroke: color }} />
        {hover != null && <line x1={xs[hover]} x2={xs[hover]} y1="0" y2={H} vectorEffect="non-scaling-stroke" style={{ stroke: 'rgb(var(--line))' }} />}
      </svg>

      <div className="pointer-events-none absolute inset-0">
        <span
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-surface"
          style={{ left: `${(lastX / W) * 100}%`, top: `${(lastY / H) * 100}%`, background: color }}
        />
        {band && (
          <>
            <Tag top={(yOf(band.high) / H) * 100} text={`High ${format(band.high)}`} />
            <Tag top={(yOf(band.low) / H) * 100} text={`Low ${format(band.low)}`} />
          </>
        )}
        {baseline != null && <Tag top={(yOf(baseline) / H) * 100} text={`${baselineLabel} ${format(baseline)}`} />}
        {hover != null && (
          <>
            <span
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-surface"
              style={{ left: `${(xs[hover] / W) * 100}%`, top: `${(ys[hover] / H) * 100}%`, background: color }}
            />
            <span
              className="absolute top-0 -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-xs font-medium text-bg shadow-pop num"
              style={{ left: `${Math.min(90, Math.max(10, (xs[hover] / W) * 100))}%` }}
            >
              {format(data[hover])} · {data.length - 1 - hover} min ago
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Tag({ top, text }) {
  return (
    <span className="absolute left-0 -translate-y-full pb-1 text-xs text-ink-3 num" style={{ top: `${top}%` }}>
      {text}
    </span>
  );
}
