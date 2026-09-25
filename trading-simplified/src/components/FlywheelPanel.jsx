import { Check, CircleDashed, GraduationCap, Loader2, Lock, Send, X } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Graduation Flywheel">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-ink-700 bg-ink-900 animate-panel-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-700 bg-ink-900/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-terminal" />
            <div>
              <p className="text-sm font-semibold text-ink-100">The Graduation Flywheel</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">Balance + discipline · partner approves</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-700 hover:text-ink-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          {/* Current status */}
          <div className="rounded-xl border border-terminal/30 bg-gradient-to-br from-terminal/10 to-transparent p-4">
            <p className="label">Current status</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-ink-100">
                  {tier.name} <span className="text-ink-400">· {tier.title}</span>
                </p>
                <p className="mt-0.5 font-mono text-xs text-ink-300 num">Equity {fmtUSD(balance)}</p>
              </div>
              <div className="text-right">
                <p className="label">Max per order</p>
                <p className="font-mono text-sm text-ink-100 num">{fmtUSD(smartStakeCap(balance, tier))}</p>
              </div>
            </div>
            {next && (
              <div className="mt-4 border-t border-terminal/20 pt-3">
                <p className="label">Road to {next.name}</p>
                <ul className="mt-2 space-y-1.5 text-xs">
                  <Step done={balanceQualifies} label={`Account value ≥ ${fmtUSD(next.min, 0)}`} detail={balanceQualifies ? 'Met' : `${fmtUSD(next.min - balance)} to go`} />
                  <Step done={audit.every((d) => d.pass)} label="Discipline audit passes" detail={audit.every((d) => d.pass) ? 'Met' : 'Gap found'} />
                  <Step done={false} pending={approvalPending} label="Partner approves account upgrade" detail={approvalPending ? 'In review' : 'Required'} />
                </ul>
                <button
                  onClick={onRequestUpgrade}
                  disabled={!eligible || approvalPending}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-terminal py-2 text-sm font-semibold text-ink-950 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-ink-400"
                >
                  {approvalPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {approvalPending ? 'Partner reviewing…' : eligible ? `Submit for ${next.name} approval` : `Not yet eligible for ${next.name}`}
                </button>
              </div>
            )}
          </div>

          {/* Discipline audit — graduation is gated on behavior, not just balance */}
          <div className="rounded-xl border border-ink-700 bg-ink-850/60 p-4">
            <div className="flex items-center justify-between">
              <p className="label">Discipline Audit</p>
              <span className="font-mono text-[10px] text-ink-400">Rolling 30 days</span>
            </div>
            <ul className="mt-3 space-y-2">
              {audit.map((d) => (
                <li key={d.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-ink-200">
                    {d.pass ? <Check className="h-3.5 w-3.5 text-up" /> : <CircleDashed className="h-3.5 w-3.5 text-terminal" />}
                    {d.label}
                    {d.need && <span className="font-mono text-[10px] text-ink-500">{d.need}</span>}
                  </span>
                  <span className={`font-mono num ${d.pass ? 'text-ink-100' : 'text-terminal'}`}>{d.value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Flywheel visual */}
          <FlywheelRing activeIdx={idx} />

          {/* Tier ladder */}
          <ol className="relative flex flex-col gap-3">
            {TIERS.map((t, i) => {
              const state = i < idx ? 'done' : i === idx ? 'active' : 'locked';
              return (
                <li
                  key={t.id}
                  className={`rounded-xl border p-4 transition ${
                    state === 'active' ? 'border-terminal/60 bg-ink-850 shadow-[0_0_0_1px_rgba(245,165,36,0.15)]' : 'border-ink-700 bg-ink-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-md font-mono text-xs font-bold ${
                          state === 'active' ? 'bg-terminal text-ink-950' : state === 'done' ? 'bg-up/20 text-up' : 'bg-ink-700 text-ink-400'
                        }`}
                      >
                        {state === 'done' ? <Check className="h-3.5 w-3.5" /> : t.id}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink-100">
                          {t.name} · {t.title}
                        </p>
                        <p className="font-mono text-[11px] text-ink-400">{t.range}</p>
                      </div>
                    </div>
                    {state === 'locked' && <Lock className="h-3.5 w-3.5 text-ink-500" />}
                    {state === 'active' && <span className="rounded bg-terminal/15 px-1.5 py-0.5 font-mono text-[10px] text-terminal">YOU</span>}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {t.perks.map((p) => (
                      <li key={p} className={`flex items-center gap-2 text-xs ${state === 'locked' ? 'text-ink-400' : 'text-ink-200'}`}>
                        <span className={`h-1 w-1 rounded-full ${state === 'locked' ? 'bg-ink-500' : 'bg-terminal'}`} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>

          {/* Demo control */}
          <div className="rounded-xl border border-dashed border-ink-600 p-4">
            <div className="flex items-center justify-between">
              <p className="label">Demo · Simulate account value</p>
              <span className="font-mono text-xs text-ink-100 num">{fmtUSD(balance, 0)}</span>
            </div>
            <input
              type="range"
              min={100}
              max={15000}
              step={10}
              value={Math.min(15000, Math.round(balance))}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="mt-3 w-full accent-terminal"
              aria-label="Simulated account value"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {[1482.5, 2450, 12800].map((v) => (
                <button
                  key={v}
                  onClick={() => setBalance(v)}
                  className="rounded-md border border-ink-600 px-2 py-1 font-mono text-[11px] text-ink-300 transition hover:border-terminal/60 hover:text-terminal"
                >
                  {fmtUSD(v, 0)}
                </button>
              ))}
            </div>
            <label className="mt-3 flex cursor-pointer items-center justify-between border-t border-ink-700 pt-3 text-xs text-ink-300">
              Simulate a discipline gap
              <input type="checkbox" checked={disciplineGap} onChange={(e) => setDisciplineGap(e.target.checked)} className="h-4 w-4 accent-terminal" />
            </label>
          </div>

          <p className="text-[11px] leading-relaxed text-ink-500">
            Trading Simplified recommends upgrades; the partner makes the final account-approval decision under its own process and
            applicable rules, including FINRA Rule 4210 ($2,000 minimum equity for margin) and Rule 2360 (options approval). Margin
            accounts are subject to the partner's pattern-day-trading policy. All figures are mock data.
          </p>
        </div>
      </aside>
    </div>
  );
}

function FlywheelRing({ activeIdx }) {
  const labels = ['Predict', 'Grow', 'Graduate', 'Trade'];
  const r = 64;
  return (
    <div className="flex items-center gap-5 rounded-xl border border-ink-700 bg-ink-850/60 p-4">
      <svg viewBox="0 0 160 160" className="h-28 w-28 shrink-0" aria-hidden="true">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#1c2430" strokeWidth="10" />
        {TIERS.map((t, i) => {
          const seg = (2 * Math.PI * r) / 3;
          return (
            <circle
              key={t.id}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={i <= activeIdx ? '#f5a524' : '#283241'}
              strokeOpacity={i === activeIdx ? 1 : i < activeIdx ? 0.55 : 1}
              strokeWidth="10"
              strokeDasharray={`${seg - 6} ${2 * Math.PI * r}`}
              strokeDashoffset={-seg * i}
              transform="rotate(-90 80 80)"
              strokeLinecap="round"
            />
          );
        })}
        <text x="80" y="76" textAnchor="middle" className="fill-ink-100 font-mono" fontSize="26" fontWeight="600">
          {TIERS[activeIdx].id}
        </text>
        <text x="80" y="96" textAnchor="middle" className="fill-ink-400 font-mono" fontSize="9" letterSpacing="1.5">
          TIER
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {labels.map((l, i) => (
          <div key={l} className="flex items-center gap-1.5 text-xs text-ink-300">
            <span className="font-mono text-[10px] text-terminal">0{i + 1}</span>
            {l}
          </div>
        ))}
        <p className="col-span-2 mt-1 text-[11px] leading-snug text-ink-400">
          Capped-risk predictions build the balance; each tier unlocks deeper tools.
        </p>
      </div>
    </div>
  );
}

function Step({ done, pending, label, detail }) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-ink-200">
        {done ? (
          <Check className="h-3.5 w-3.5 text-up" />
        ) : pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-terminal" />
        ) : (
          <CircleDashed className="h-3.5 w-3.5 text-ink-500" />
        )}
        {label}
      </span>
      <span className={`font-mono text-[10px] ${done ? 'text-up' : 'text-ink-400'}`}>{detail}</span>
    </li>
  );
}
