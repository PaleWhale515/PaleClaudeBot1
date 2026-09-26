const CHANNELS = [
  { id: 'predict', label: 'Predict' },
  { id: 'trade', label: 'Trade' },
];

export default function ChannelToggle({ channel, onChange }) {
  return (
    <div className="inline-flex w-full rounded-full bg-sunken p-1 sm:w-auto" role="tablist" aria-label="Channel">
      {CHANNELS.map(({ id, label }) => {
        const active = channel === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`flex-1 rounded-full px-6 py-2 text-[15px] font-semibold transition sm:flex-none ${
              active ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
