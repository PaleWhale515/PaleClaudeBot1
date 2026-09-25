import { Activity, ChevronRight, Layers, ShieldAlert, Wallet } from 'lucide-react';
import { GRADUATION_TARGET, KILL_SWITCH_MS, fmtUSD } from '../data/mock.js';

export default function Header({ balance, tier, killSwitch, onKillSwitch, latency, onOpenFlywheel, eligibleFor }) {
  const progress = Math.min(100, (balance / GRADUATION_TARGET) * 100);
  const graduated = balance >= GRADUATION_TARGET;

  return (
    <header style={{ top: 'env(safe-area-inset-top, 0px)' }} className="sticky z-40 border-b border-ink-700/80 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 lg:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-terminal to-amber-600 shadow-[0_0_24px_-6px_rgba(245,165,36,0.6)]">
            <Layers className="h-4 w-4 text-ink-950" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-ink-100">Trading Simplified</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">Prototype · Mock Data</p>
          </div>
        </div>

        {/* Account metrics */}
        <div className="order-3 flex w-full flex-wrap items-center gap-x-6 gap-y-3 md:order-none md:w-auto md:flex-1 md:justify-center">
          <Metric icon={Wallet} label="Account Balance">
            <span className="font-mono text-base font-semibold text-ink-100 num">{fmtUSD(balance)}</span>
          </Metric>

          <button onClick={onOpenFlywheel} className="group text-left" aria-label="Open graduation flywheel">
            <Metric label="Tier Level">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-terminal/40 bg-terminal/10 px-2 py-0.5 font-mono text-xs font-semibold text-terminal transition group-hover:border-terminal group-hover:bg-terminal/20">
                {tier.name}
                <ChevronRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </span>
              {eligibleFor && (
                <span className="ml-1.5 inline-flex items-center gap-1 rounded-md border border-sky-400/40 bg-sky-400/10 px-1.5 py-0.5 font-mono text-[10px] text-sky-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
                  {eligibleFor.id} eligible
                </span>
              )}
            </Metric>
          </button>

          <div className="min-w-[200px] flex-1 md:max-w-[280px]">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="label">Road to $2K</span>
              <span className="font-mono text-[11px] text-ink-300 num">
                {graduated ? (tier.margin ? 'Margin approved ✓' : 'Balance met ✓') : `${fmtUSD(GRADUATION_TARGET - balance, 0)} to go`}
              </span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-ink-700">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-600 to-terminal transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
              {[25, 50, 75].map((m) => (
                <span key={m} className="absolute inset-y-0 w-0.5 bg-ink-950" style={{ left: `${m}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Kill switch */}
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <div className="hidden text-right sm:block">
            <p className="label">Exec API · trip {KILL_SWITCH_MS}ms</p>
            <p className={`flex items-center justify-end gap-1 font-mono text-xs num ${killSwitch ? 'text-down' : 'text-up'}`}>
              <Activity className="h-3 w-3" />
              {latency} ms
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-2.5 py-1.5 transition hover:border-ink-500">
            <ShieldAlert className={`h-4 w-4 ${killSwitch ? 'text-down' : 'text-ink-400'}`} />
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300 lg:inline">Safe-State Kill Switch</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300 lg:hidden">Kill Switch</span>
            <button
              role="switch"
              aria-checked={killSwitch}
              onClick={onKillSwitch}
              className={`relative h-5 w-9 rounded-full transition ${killSwitch ? 'bg-down' : 'bg-ink-600'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${killSwitch ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </label>
        </div>
      </div>

      {killSwitch && (
        <div className="border-t border-down/30 bg-down/10 animate-fade-in">
          <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-2 font-mono text-xs text-down lg:px-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-down opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-down" />
            </span>
            <span className="font-semibold uppercase tracking-wider">API Latency: View-Only Mode</span>
            <span className="hidden text-down/70 sm:inline">— Partner execution-API latency above {KILL_SWITCH_MS} ms. Safe-State engaged; no orders are sent. Market data remains live.</span>
          </div>
        </div>
      )}
    </header>
  );
}

function Metric({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="label flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      {children}
    </div>
  );
}
