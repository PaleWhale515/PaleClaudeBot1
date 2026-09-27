/** Three ascending steps: Tiers A, B and C. The top step is the graduation gold. */
export default function Logo({ size = 28, withWordmark = true }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect x="0" y="0" width="32" height="32" rx="9" style={{ fill: 'rgb(var(--brand))' }} />
        <rect x="7" y="18" width="5" height="7" rx="1.5" style={{ fill: 'rgb(var(--on-brand))', opacity: 0.55 }} />
        <rect x="13.5" y="13" width="5" height="12" rx="1.5" style={{ fill: 'rgb(var(--on-brand))', opacity: 0.8 }} />
        <rect x="20" y="7" width="5" height="18" rx="1.5" style={{ fill: 'rgb(var(--gold))' }} />
      </svg>
      {withWordmark && (
        <span className="font-display text-[19px] font-semibold leading-none tracking-tight text-ink">
          Trading Simplified
        </span>
      )}
    </span>
  );
}
