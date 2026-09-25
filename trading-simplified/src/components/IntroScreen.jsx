import { ArrowRight, BarChart3, GraduationCap, Layers, Power, ShieldCheck, Zap } from 'lucide-react';
import { KILL_SWITCH_MS, SMART_STAKE_PCT, TIERS, fmtUSD } from '../data/mock.js';

const CHANNELS = [
  {
    icon: Zap,
    name: 'PREDICT',
    sub: 'Velocity Engine',
    body: 'New users start with binary index event contracts. Every position has a fixed maximum loss, shown before they confirm, and is a real exchange order routed through the partner.',
    facts: ['$20 fixed stake at Tier A', 'Centrally cleared', 'No internal book'],
  },
  {
    icon: BarChart3,
    name: 'TRADE',
    sub: 'Wealth Builder',
    body: 'Stocks and options with a Mechanical Data Dashboard (IV Rank, Expected Move, Probability of Profit) shown as market context beside a limit-order ticket.',
    facts: ['Cash account first (T+1)', 'Smart Stake cap on every order', 'Routed via partner'],
  },
  {
    icon: GraduationCap,
    name: 'GRADUATION',
    sub: 'Flywheel',
    body: 'Access expands only when account value and a discipline audit both qualify. Trading Simplified recommends each upgrade; the partner approves it.',
    facts: ['Balance + discipline', 'Partner approval', 'Limits shrink automatically'],
  },
];

const CONTROLS = [
  { icon: ShieldCheck, title: 'Smart Stake', body: `No order above ${SMART_STAKE_PCT * 100}% of equity or the tier limit ever leaves the platform.` },
  { icon: Power, title: 'Safe-State kill switch', body: `Order routing stops if partner execution-API latency exceeds ${KILL_SWITCH_MS} ms. Market data stays live.` },
  { icon: GraduationCap, title: 'Partner-approved access', body: 'Margin and options approval stays with the partner under FINRA Rules 4210 and 2360.' },
];

const STEPS = [
  { title: 'Place a prediction', body: 'On PREDICT, tap UP or DOWN. Note the fixed stake, the disclosed fee and the routing rows.' },
  { title: 'Hit the risk limit', body: 'On TRADE, raise the quantity until the Smart Stake meter turns red, then use Clamp.' },
  { title: 'Trip the kill switch', body: 'Turn on the Safe-State switch in the header. Every execution button locks.' },
  { title: 'Graduate a user', body: 'Open the Tier badge, choose $2,450, and submit for partner approval. Margin unlocks at Tier B.' },
];

export default function IntroScreen({ onEnter }) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-ink-950" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 500px at 85% -5%, rgba(245,165,36,0.08), transparent 60%), radial-gradient(700px 400px at -10% 100%, rgba(56,189,248,0.05), transparent 60%)',
        }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-12 pt-[calc(env(safe-area-inset-top,0px)+2rem)] sm:px-6 lg:pt-14">
        {/* Hero */}
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-terminal to-amber-600">
                <Layers className="h-4 w-4 text-ink-950" strokeWidth={2.5} />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">Partner preview · v3.8 prototype</span>
            </div>
            <h1 id="intro-title" className="mt-5 text-3xl font-semibold tracking-tight text-ink-100 sm:text-5xl" style={{ textWrap: 'balance' }}>
              Trading Simplified
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
              A risk-first onboarding platform for regulated partners. New retail investors start with fixed-risk positions and earn
              margin access through a documented record of disciplined trading.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-stretch">
            <button
              onClick={() => onEnter('predict')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-terminal px-5 py-3 text-sm font-semibold text-ink-950 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terminal"
            >
              Open the prototype <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEnter('trade')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-600 px-5 py-3 text-sm text-ink-200 transition hover:border-terminal/60 hover:text-terminal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terminal"
            >
              Start in TRADE
            </button>
          </div>
        </header>

        {/* Channels */}
        <section aria-label="How it works" className="grid gap-3 md:grid-cols-3">
          {CHANNELS.map(({ icon: Icon, name, sub, body, facts }) => (
            <article key={name} className="flex flex-col gap-3 rounded-xl border border-ink-700 bg-ink-900/80 p-5">
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-terminal" />
                <p className="font-mono text-xs font-semibold tracking-[0.18em] text-ink-100">{name}</p>
                <span className="text-xs text-ink-400">{sub}</span>
              </div>
              <p className="text-sm leading-relaxed text-ink-300">{body}</p>
              <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
                {facts.map((f) => (
                  <li key={f} className="rounded border border-ink-600 px-1.5 py-0.5 font-mono text-[10px] text-ink-300">
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          {/* Tiers */}
          <section aria-labelledby="tiers-title" className="min-w-0">
            <h2 id="tiers-title" className="label mb-3">Graduated access</h2>
            <div className="overflow-x-auto rounded-xl border border-ink-700">
              <table className="w-full min-w-[460px] text-left text-sm">
                <thead className="whitespace-nowrap bg-ink-900 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Tier</th>
                    <th className="px-4 py-2.5 font-medium">Account value</th>
                    <th className="px-4 py-2.5 text-right font-medium">Predict</th>
                    <th className="px-4 py-2.5 text-right font-medium">Max / order</th>
                    <th className="px-4 py-2.5 font-medium">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700/70 bg-ink-900/50">
                  {TIERS.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-3">
                        <span className="inline-grid h-6 w-6 place-items-center rounded bg-terminal/15 font-mono text-xs font-bold text-terminal">{t.id}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-200 num">{t.range}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-ink-100 num">{fmtUSD(t.predictStake, 0)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-ink-100 num">{t.maxStake ? fmtUSD(t.maxStake, 0) : 'Partner-set'}</td>
                      <td className="px-4 py-3 text-xs text-ink-300">{t.margin ? 'Margin eligible · partner approval' : 'Cash only · T+1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-ink-500">The 25% Smart Stake cap applies at every tier. Tier C Predict stake is a placeholder.</p>

            <h2 className="label mb-3 mt-8">Built-in risk controls</h2>
            <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {CONTROLS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex flex-col gap-1.5">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink-100">
                    <Icon className="h-4 w-4 text-up" /> {title}
                  </p>
                  <p className="text-xs leading-relaxed text-ink-400">{body}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Demo path */}
          <section aria-labelledby="tour-title" className="rounded-xl border border-terminal/30 bg-gradient-to-br from-terminal/[0.07] to-transparent p-5">
            <h2 id="tour-title" className="label">Try it in four steps</h2>
            <ol className="mt-4 flex flex-col gap-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-terminal/50 font-mono text-[11px] text-terminal">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-ink-100">{s.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              onClick={() => onEnter('predict')}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-terminal/50 py-2.5 text-sm font-medium text-terminal transition hover:bg-terminal/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terminal"
            >
              Start with step 1 <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        </div>

        <footer className="border-t border-ink-800 pt-4 text-[11px] leading-relaxed text-ink-500">
          Prototype with simulated market data, balances and fills. In production, custody, execution and account approval are provided by
          a regulated partner. Not an offer to buy or sell securities or event contracts.
        </footer>
      </div>
    </div>
  );
}
