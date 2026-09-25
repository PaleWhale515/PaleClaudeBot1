import { useMemo, useRef, useState } from 'react';

/**
 * Minimal single-series area chart with crosshair + tooltip.
 * Optional `band` draws a shaded ±expected-move envelope around the last price.
 */
export default function PriceChart({ data, height = 260, color = '#22c55e', band, format = (v) => v.toFixed(2), baseline }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 800;
  const H = height;
  const padR = 64;
  const padY = 16;

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
    const pad = (hi - lo) * 0.08 || 1;
    lo -= pad;
    hi += pad;
    const xs = data.map((_, i) => (i / (data.length - 1)) * (W - padR));
    const ys = data.map((v) => padY + (1 - (v - lo) / (hi - lo)) * (H - padY * 2));
    const path = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join('');
    const area = `${path}L${xs[xs.length - 1]},${H}L0,${H}Z`;
    return { min: lo, max: hi, path, area, xs, ys };
  }, [data, band, baseline, H]);

  const yOf = (v) => padY + (1 - (v - min) / (max - min)) * (H - padY * 2);
  const grid = [0.2, 0.4, 0.6, 0.8].map((f) => min + (max - min) * f);
  const gid = `g-${color.replace('#', '')}`;
  const last = data[data.length - 1];

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.max(0, Math.min(data.length - 1, Math.round((x / (W - padR)) * (data.length - 1))));
    setHover(i);
  };

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: `${W} / ${H}` }}>
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
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {grid.map((g) => (
          <line key={g} x1="0" x2={W - padR} y1={yOf(g)} y2={yOf(g)} stroke="#1c2430" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        ))}
        {band && (
          <>
            <rect x={0} width={W - padR} y={yOf(band.high)} height={yOf(band.low) - yOf(band.high)} fill="#f5a524" opacity="0.06" />
            <line x1="0" x2={W - padR} y1={yOf(band.high)} y2={yOf(band.high)} stroke="#f5a524" strokeOpacity="0.55" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            <line x1="0" x2={W - padR} y1={yOf(band.low)} y2={yOf(band.low)} stroke="#f5a524" strokeOpacity="0.55" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          </>
        )}
        {baseline != null && (
          <line x1="0" x2={W - padR} y1={yOf(baseline)} y2={yOf(baseline)} stroke="#5b6678" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
        )}
        <path d={area} fill={`url(#${gid})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {hover != null && (
          <line x1={xs[hover]} x2={xs[hover]} y1="0" y2={H} stroke="#5b6678" vectorEffect="non-scaling-stroke" />
        )}
      </svg>

      {/* HTML overlays keep text crisp regardless of SVG stretching */}
      <div className="pointer-events-none absolute inset-0">
        <PriceTag top={(yOf(last) / H) * 100} color={color} label={format(last)} />
        {band && (
          <>
            <AxisLabel top={(yOf(band.high) / H) * 100} text={`+EM ${format(band.high)}`} className="text-terminal" />
            <AxisLabel top={(yOf(band.low) / H) * 100} text={`−EM ${format(band.low)}`} className="text-terminal" />
          </>
        )}
        {baseline != null && <AxisLabel top={(yOf(baseline) / H) * 100} text={`Strike ${format(baseline)}`} className="text-ink-300" />}
        {hover != null && (
          <>
            <div
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-900"
              style={{ left: `${(xs[hover] / W) * 100}%`, top: `${(ys[hover] / H) * 100}%`, background: color }}
            />
            <div
              className="absolute top-2 -translate-x-1/2 rounded-md border border-ink-600 bg-ink-850/95 px-2 py-1 font-mono text-[11px] text-ink-100 shadow-lg"
              style={{ left: `${Math.min(88, Math.max(8, (xs[hover] / W) * 100))}%` }}
            >
              <span className="text-ink-400">T−{data.length - 1 - hover}m</span> <span className="num">{format(data[hover])}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PriceTag({ top, color, label }) {
  return (
    <div
      className="absolute right-0 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-950 num"
      style={{ top: `${top}%`, background: color }}
    >
      {label}
    </div>
  );
}

function AxisLabel({ top, text, className = '' }) {
  return (
    <div className={`absolute right-0 -translate-y-1/2 font-mono text-[10px] num ${className}`} style={{ top: `${top}%` }}>
      {text}
    </div>
  );
}
