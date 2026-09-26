import { ArrowRight } from 'lucide-react';
import Logo from './Logo.jsx';
import { KILL_SWITCH_MS, SMART_STAKE_PCT, TIERS, fmtUSD } from '../data/mock.js';

const CHANNELS = [
  {
    name: 'Predict',
    body: 'New users start with simple up-or-down questions on market indexes. Each has a fixed maximum loss shown before they confirm, and each is a real exchange order routed through the partner.',
  },
  {
    name: 'Trade',
    body: 'Stocks and options with plain-language market context (IV Rank, expected move, probability of profit) beside a simple limit-order ticket.',
  },
  {
    name: 'Graduate',
    body: 'Access grows only when account value and a discipline check both qualify. We recommend each upgrade. The partner approves it.',
  },
];

const CONTROLS = [
  { title: 'Smart Stake', body: `No order above ${SMART_STAKE_PCT * 100}% of the balance or the tier limit ever leaves the platform.` },
  { title: 'Safe-State switch', body: `Trading pauses if the partner's execution API is slower than ${KILL_SWITCH_MS} ms. Prices stay live.` },
  { title: 'Partner approval', body: 'Margin and options approval stays with the partner, under FINRA Rules 4210 and 2360.' },
];

const STEPS = [
  { title: 'Make a prediction', body: 'On Predict, tap Up or Down. Note the fixed stake and fee.' },
  { title: 'Hit the risk limit', body: 'On Trade, add shares until Smart Stake stops the order.' },
  { title: 'Pause trading', body: 'Turn on the Safe-State switch in the header.' },
  { title: 'Graduate a user', body: 'Open your balance, choose $2,450 and submit for approval.' },
];

export default function IntroScreen({ onEnter }) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-bg" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 pb-16 pt-[calc(env(safe-area-inset-top,0px)+2rem)] sm:px-6 lg:pt-16">
        <header className="flex flex-col gap-8">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <span className="rounded-full bg-gold-soft px-3 py-1 text-sm font-medium text-gold-ink">Partner preview</span>
          </div>
          <div className="max-w-3xl">
            <h1 id="intro-title" className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
              The on-ramp from first trade to margin-ready.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">
              Trading Simplified helps a regulated partner bring in new retail investors. They start with small, fixed-risk positions and earn more access through a
              documented record of disciplined trading.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => onEnter('predict')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-on-brand transition hover:brightness-110"
            >
              Open the prototype <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => onEnter('trade')} className="rounded-full px-6 py-3.5 font-semibold text-ink ring-1 ring-line transition hover:bg-surface">
              Start on Trade
            </button>
          </div>
        </header>

        <section aria-label="How it works" className="grid gap-8 border-t border-line pt-10 md:grid-cols-3">
          {CHANNELS.map((c, i) => (
            <div key={c.name}>
              <p className="font-display text-sm font-semibold text-gold-ink">Step {i + 1}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{c.name}</h2>
              <p className="mt-2 leading-relaxed text-ink-2">{c.body}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section aria-labelledby="tiers-title" className="min-w-0">
            <h2 id="tiers-title" className="font-display text-2xl font-semibold text-ink">
              Access grows in three tiers
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[440px] text-left">
                <thead className="text-sm text-ink-3">
                  <tr>
                    <th className="whitespace-nowrap py-2 pr-4 font-medium">Tier</th>
                    <th className="whitespace-nowrap py-2 pr-4 font-medium">Balance</th>
                    <th className="whitespace-nowrap py-2 pr-4 text-right font-medium">Prediction</th>
                    <th className="whitespace-nowrap py-2 pr-4 text-right font-medium">Per order</th>
                    <th className="py-2 font-medium">Account</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line border-t border-line">
                  {TIERS.map((t) => (
                    <tr key={t.id} className="text-ink">
                      <td className="py-3 pr-4">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-gold font-display text-sm font-bold text-ink">{t.id}</span>
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 num">{t.range}</td>
                      <td className="py-3 pr-4 text-right num">{fmtUSD(t.predictStake, 0)}</td>
                      <td className="whitespace-nowrap py-3 pr-4 text-right num">{t.maxStake ? fmtUSD(t.maxStake, 0) : 'Partner-set'}</td>
                      <td className="py-3 text-ink-2">{t.margin ? 'Margin, once approved' : 'Cash only'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-ink-3">The 25% Smart Stake cap applies at every tier. The Tier C prediction amount is a placeholder.</p>

            <h2 className="mt-10 font-display text-2xl font-semibold text-ink">Risk controls on every order</h2>
            <dl className="mt-4 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {CONTROLS.map((c) => (
                <div key={c.title}>
                  <dt className="font-semibold text-ink">{c.title}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink-2">{c.body}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="tour-title" className="card h-fit p-6 sm:p-8">
            <h2 id="tour-title" className="font-display text-2xl font-semibold text-ink">
              Try it in four steps
            </h2>
            <ol className="mt-5 space-y-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft font-display text-sm font-bold text-brand">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-ink">{s.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-2">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              onClick={() => onEnter('predict')}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 font-semibold text-on-brand transition hover:brightness-110"
            >
              Start with step 1 <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        </div>

        <footer className="border-t border-line pt-6 text-sm leading-relaxed text-ink-3">
          This prototype uses simulated prices, balances and fills. In production, custody, execution and account approval come from a regulated partner. Not an
          offer to buy or sell securities or event contracts.
        </footer>
      </div>
    </div>
  );
}
