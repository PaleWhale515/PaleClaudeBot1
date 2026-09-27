import { BookOpen, Check, Lock, Trophy } from 'lucide-react';

// Sample content shown blurred behind the upsell. Ladders rank discipline, never returns
// (white paper v3.8 §8), and carry no cash prizes.
const SAMPLE_JOURNAL = [
  { date: 'Sep 24', trade: 'SPY 651/649 put credit spread', note: 'Took profit at 50% as planned. Stayed inside Smart Stake.', tag: 'Followed plan' },
  { date: 'Sep 23', trade: 'SPY 672 long call', note: 'Stop-loss closed it at half the premium. Size was right.', tag: 'Stop respected' },
  { date: 'Sep 22', trade: 'SPY 642/644/673/675 iron condor', note: 'Held to expiration inside the range.', tag: 'Followed plan' },
  { date: 'Sep 19', trade: 'Will SPY close higher today? Up', note: 'Prediction at 57¢. Market closed lower.', tag: 'Review' },
];

const SAMPLE_LADDER = [
  { rank: 1, name: 'Northwind', score: 98, streak: 21 },
  { rank: 2, name: 'Quietfox', score: 96, streak: 18 },
  { rank: 3, name: 'Harbor', score: 95, streak: 17 },
  { rank: 4, name: 'You', score: null, streak: 9 },
  { rank: 5, name: 'Lumen', score: 90, streak: 12 },
];

const FEATURES = [
  'An automated journal of every trade, with your plan, stop and outcome',
  'Seasonal Ladders ranked on Discipline Score, never on returns',
  'Lower fee tiers',
  'Faster access to deposits, subject to [PARTNER] credit policy',
];

export default function JournalChannel({ score, notify }) {
  return (
    <div className="relative">
      {/* Locked preview: visible but blurred, and hidden from assistive tech and keyboard. */}
      <div aria-hidden="true" inert="" className="pointer-events-none select-none blur-[6px]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
              <BookOpen className="h-5 w-5 text-brand" /> Trading journal
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {SAMPLE_JOURNAL.map((j) => (
                <li key={j.date + j.trade} className="py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-ink">{j.trade}</p>
                    <span className="text-sm text-ink-3">{j.date}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-2">{j.note}</p>
                  <span className="mt-2 inline-block rounded-full bg-up-soft px-2 py-0.5 text-xs font-semibold text-up">{j.tag}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
              <Trophy className="h-5 w-5 text-gold" /> Fall Ladder
            </h2>
            <p className="mt-1 text-sm text-ink-3">Ranked on Discipline Score. No cash prizes.</p>
            <ol className="mt-4 divide-y divide-line">
              {SAMPLE_LADDER.map((l) => (
                <li key={l.rank} className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-sunken font-display text-sm font-bold text-ink">{l.rank}</span>
                    <span className={`font-medium ${l.name === 'You' ? 'text-brand' : 'text-ink'}`}>{l.name}</span>
                  </span>
                  <span className="text-sm text-ink-2 num">
                    {l.score ?? score} score, {l.streak}-day streak
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {/* Premium overlay */}
      <div className="absolute inset-0 flex items-start justify-center px-2 pt-8 sm:pt-12">
        <section
          aria-labelledby="upsell-title"
          className="w-full max-w-lg rounded-[28px] bg-surface/95 p-7 text-center shadow-pop ring-1 ring-line backdrop-blur sm:p-9"
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold-soft">
            <Lock className="h-6 w-6 text-gold-ink" />
          </span>
          <h2 id="upsell-title" className="mt-5 font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">
            Unlock Automated Trading Journal &amp; Seasonal Ladders
          </h2>
          <p className="mt-3 text-ink-2">
            Upgrade to Pro for <span className="font-semibold text-ink">$9.99/month</span>.
          </p>
          <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left text-sm text-ink-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => notify({ kind: 'info', title: 'Checkout opens here', body: 'In production, Pro is billed monthly through the app store or [PARTNER]. This prototype has no checkout.' })}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand py-3.5 font-semibold text-on-brand transition hover:brightness-110"
          >
            Upgrade to Pro, $9.99/month
          </button>
          <p className="mt-3 text-xs text-ink-3">Cancel anytime. Pro changes tools and fees only; it never changes your risk limits or approvals.</p>
        </section>
      </div>
    </div>
  );
}
