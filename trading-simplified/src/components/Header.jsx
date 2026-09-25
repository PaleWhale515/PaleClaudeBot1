import { ChevronRight, Moon, PauseCircle, Sun } from 'lucide-react';
import Logo from './Logo.jsx';
import ChannelToggle from './ChannelToggle.jsx';
import { GRADUATION_TARGET, KILL_SWITCH_MS, fmtUSD } from '../data/mock.js';

export default function Header({ balance, tier, channel, onChannel, killSwitch, onKillSwitch, latency, onOpenFlywheel, eligibleFor, theme, onToggleTheme }) {
  const progress = Math.min(100, (balance / GRADUATION_TARGET) * 100);
  const reached = balance >= GRADUATION_TARGET;

  return (
    <header className="sticky z-40 border-b border-line bg-bg/90 backdrop-blur-md" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Logo />

        <div className="order-last w-full sm:order-none sm:w-auto">
          <ChannelToggle channel={channel} onChange={onChannel} />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenFlywheel}
            className="group hidden items-center gap-3 rounded-full py-1 pl-1 pr-3 text-left transition hover:bg-sunken md:flex"
            aria-label="Open your path to the next tier"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-soft font-display text-sm font-bold text-gold-ink">{tier.id}</span>
            <span className="flex flex-col gap-1">
              <span className="flex items-baseline gap-2">
                <span className="font-display text-lg font-semibold leading-none text-ink num">{fmtUSD(balance)}</span>
                <span className="text-xs text-ink-3">{reached ? 'Road to $2K reached' : `${fmtUSD(GRADUATION_TARGET - balance, 0)} to $2K`}</span>
              </span>
              <span className="block h-1.5 w-44 overflow-hidden rounded-full bg-sunken">
                <span className="block h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
              </span>
            </span>
            {eligibleFor ? (
              <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-on-brand">Tier {eligibleFor.id} ready</span>
            ) : (
              <ChevronRight className="h-4 w-4 text-ink-3 transition group-hover:translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onOpenFlywheel}
            className="flex items-center gap-2 rounded-full bg-gold-soft py-1.5 pl-1.5 pr-3 md:hidden"
            aria-label="Open your path to the next tier"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gold font-display text-xs font-bold text-ink">{tier.id}</span>
            <span className="text-sm font-semibold text-gold-ink num">{fmtUSD(balance, 0)}</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-2 transition hover:bg-sunken hover:text-ink"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          <div className="flex items-center gap-2 rounded-full border border-line py-1 pl-3 pr-1" title={`Pauses order routing when execution latency is above ${KILL_SWITCH_MS} ms`}>
            <span className="text-sm text-ink-2">Safe-State</span>
            <span className={`hidden text-xs num sm:inline ${killSwitch ? 'text-down' : 'text-ink-3'}`}>{latency} ms</span>
            <button
              role="switch"
              aria-checked={killSwitch}
              aria-label="Safe-State kill switch"
              onClick={onKillSwitch}
              className={`relative h-6 w-10 rounded-full transition ${killSwitch ? 'bg-down' : 'bg-line'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all ${killSwitch ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="h-1 bg-sunken md:hidden" aria-hidden="true">
        <div className="h-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {killSwitch && (
        <div className="border-t border-down/20 bg-down-soft">
          <div className="mx-auto flex max-w-[1200px] items-start gap-3 px-4 py-3 sm:px-6">
            <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-down" />
            <p className="text-sm text-ink">
              <span className="font-semibold text-down">API Latency: View-Only Mode.</span> The connection to [PARTNER] is slower than{' '}
              {KILL_SWITCH_MS} ms, so trading is paused until it recovers. Prices are still live.
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
