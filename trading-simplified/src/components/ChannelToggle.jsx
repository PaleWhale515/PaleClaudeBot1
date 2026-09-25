import { BarChart3, Zap } from 'lucide-react';

const CHANNELS = [
  { id: 'predict', label: 'PREDICT', sub: 'Velocity Engine', icon: Zap },
  { id: 'trade', label: 'TRADE', sub: 'Wealth Builder', icon: BarChart3 },
];

export default function ChannelToggle({ channel, onChange }) {
  return (
    <div className="inline-flex w-full rounded-xl border border-ink-700 bg-ink-900 p-1 sm:w-auto" role="tablist">
      {CHANNELS.map(({ id, label, sub, icon: Icon }) => {
        const active = channel === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`group flex flex-1 items-center gap-2.5 rounded-lg px-4 py-2 text-left transition sm:flex-none sm:px-5 ${
              active ? 'bg-ink-700 shadow-inner shadow-black/40' : 'hover:bg-ink-800'
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? 'text-terminal' : 'text-ink-400 group-hover:text-ink-200'}`} />
            <span className="leading-tight">
              <span className={`block font-mono text-xs font-semibold tracking-[0.18em] ${active ? 'text-ink-100' : 'text-ink-300'}`}>{label}</span>
              <span className="block text-[11px] text-ink-400">{sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
