import { Check, Circle, Loader2, Lock, X } from 'lucide-react';
import { TIERS, fmtUSD, smartStakeCap } from '../data/mock.js';

export default function FlywheelPanel({
  open,
  onClose,
  balance,
  setBalance,
  tier,
  audit,
  disciplineGap,
  setDisciplineGap,
  balanceQualifies,
  eligible,
  approvalPending,
  onRequestUpgrade,
}) {
  if (!open) return null;
  const idx = TIERS.findIndex((t) => t.id === tier.id);
  const next = TIERS[idx + 1];
  const auditPass = audit.every((d) => d.pass);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="path-title">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-bg shadow-pop animate-panel-in">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg/95 px-6 py-4 backdrop-blur">
          <h2 id="path-title" className="font-display text-xl font-semibold text-ink">
            Your path
          </h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-sunken hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-8 px-6 pb-10">
          {/* Where you are */}
          <section>
            <p className="eyebrow">
              You're on {tier.name}, {tier.title}
            </p>
            <p className="mt-1 font-display text-5xl font-semibold tracking-tight text-ink num">{fmtUSD(balance)}</p>
            <p className="mt-1 text-ink-2">
              Up to <span className="font-semibold text-ink num">{fmtUSD(smartStakeCap(balance, tier))}</span> per order, {fmtUSD(tier.predictStake, 0)} per prediction.
            </p>
          </section>

          {/* Next tier checklist */}
          {next && (
            <section className="card p-5">
              <h3 className="font-display text-lg font-semibold text-ink">To reach {next.name}</h3>
              <ol className="mt-4 space-y-4">
                <Step done={balanceQualifies} title={`Grow your balance to ${fmtUSD(next.min, 0)}`} detail={balanceQualifies ? 'Done' : `${fmtUSD(next.min - balance)} to go`} />
                <Step done={auditPass} title="Pass the discipline check" detail={auditPass ? 'Done' : 'One item needs work, see below'} />
                <Step done={false} pending={approvalPending} title={`${next.margin && !tier.margin ? 'Margin' : 'The upgrade'} is approved by [PARTNER]`} detail={approvalPending ? 'In review' : 'Last step'} />
              </ol>
              <button
                onClick={onRequestUpgrade}
                disabled={!eligible || approvalPending}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 font-semibold text-on-brand transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-3"
              >
                {approvalPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {approvalPending ? 'Partner is reviewing' : eligible ? `Submit for ${next.name} approval` : `Not ready for ${next.name} yet`}
              </button>
            </section>
          )}

          {/* Discipline check */}
          <section>
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg font-semibold text-ink">Discipline check</h3>
              <span className="text-sm text-ink-3">Last 30 days</span>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {audit.map((d) => (
                <li key={d.label} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex items-center gap-2.5 text-ink">
                    {d.pass ? <Check className="h-4 w-4 text-up" strokeWidth={2.5} aria-label="Passed" /> : <Circle className="h-4 w-4 text-down" aria-label="Needs work" />}
                    {d.label}
                  </span>
                  <span className="text-right">
                    <span className={`block font-semibold num ${d.pass ? 'text-ink' : 'text-down'}`}>{d.value}</span>
                    {d.need && <span className="block text-xs text-ink-3">{d.need}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Tiers */}
          <section>
            <h3 className="font-display text-lg font-semibold text-ink">All tiers</h3>
            <ol className="mt-3 space-y-3">
              {TIERS.map((t, i) => {
                const state = i < idx ? 'done' : i === idx ? 'current' : 'locked';
                return (
                  <li key={t.id} className={`rounded-2xl p-4 ${state === 'current' ? 'bg-surface shadow-card ring-2 ring-gold' : 'bg-surface ring-1 ring-line'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-full font-display text-sm font-bold ${
                            state === 'locked' ? 'bg-sunken text-ink-3' : 'bg-gold text-ink'
                          }`}
                        >
                          {state === 'done' ? <Check className="h-4 w-4" strokeWidth={3} /> : t.id}
                        </span>
                        <div>
                          <p className="font-semibold text-ink">
                            {t.name}, {t.title}
                          </p>
                          <p className="text-sm text-ink-3">{t.range}</p>
                        </div>
                      </div>
                      {state === 'current' && <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-semibold text-gold-ink">You're here</span>}
                      {state === 'locked' && <Lock className="h-4 w-4 text-ink-3" aria-label="Locked" />}
                    </div>
                    <ul className="mt-3 space-y-1 pl-11 text-sm text-ink-2">
                      {t.perks.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Demo controls */}
          <section className="rounded-2xl border border-dashed border-line p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold text-ink">Demo controls</h3>
              <span className="font-semibold text-ink num">{fmtUSD(balance, 0)}</span>
            </div>
            <input
              id="demo-balance"
              type="range"
              min={100}
              max={15000}
              step={10}
              value={Math.min(15000, Math.round(balance))}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="mt-3 w-full accent-[rgb(var(--brand))]"
              aria-label="Simulated account value"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {[1482.5, 2450, 12800].map((v) => (
                <button
                  key={v}
                  onClick={() => setBalance(v)}
                  className="rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-ink-2 ring-1 ring-line transition hover:text-ink hover:ring-brand"
                >
                  {fmtUSD(v, 0)}
                </button>
              ))}
            </div>
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 border-t border-line pt-4 text-sm text-ink">
              Simulate a discipline gap
              <input id="demo-gap" type="checkbox" checked={disciplineGap} onChange={(e) => setDisciplineGap(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--brand))]" />
            </label>
          </section>

          <p className="text-sm leading-relaxed text-ink-3">
            We recommend upgrades. [PARTNER] makes the final decision under its own process and the rules that apply, including FINRA Rule 4210 ($2,000 minimum
            for margin) and Rule 2360 (options). Margin accounts follow Rule 4210's intraday margin standards, which replaced the pattern-day-trader rule on June 4, 2026 (partners may phase them in through October 20, 2027). All figures are mock data.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Step({ done, pending, title, detail }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${done ? 'bg-up text-surface' : 'bg-sunken text-ink-3'}`}>
        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : pending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" /> : <Circle className="h-2 w-2" />}
      </span>
      <span className="flex-1">
        <span className="block text-ink">{title}</span>
        <span className={`block text-sm ${done ? 'text-up' : 'text-ink-3'}`}>{detail}</span>
      </span>
    </li>
  );
}
