import { Lock } from 'lucide-react';

const CHANNELS = [
  { id: 'predict', label: 'Predict' },
  { id: 'trade', label: 'Trade' },
  { id: 'journal', label: 'Journal & Ladders', short: 'Journal', locked: true },
];

export default function ChannelToggle({ channel, onChange }) {
  return (
    <div className="inline-flex w-full rounded-full bg-sunken p-1 sm:w-auto" role="tablist" aria-label="Channel">
      {CHANNELS.map(({ id, label, short, locked }) => {
        const active = channel === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[15px] font-semibold transition sm:flex-none sm:px-5 ${
              active ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {locked && <Lock className="h-3.5 w-3.5 text-gold-ink" aria-label="Premium" />}
            {short ? (
              <>
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </>
            ) : (
              label
            )}
          </button>
        );
      })}
    </div>
  );
}
