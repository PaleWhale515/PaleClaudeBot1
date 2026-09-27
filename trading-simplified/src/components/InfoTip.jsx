import { useId, useState } from 'react';
import { Info } from 'lucide-react';

/** Small info icon with a tooltip that opens on hover, keyboard focus, or tap. */
export default function InfoTip({ text, label = 'More information' }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="grid h-5 w-5 place-items-center rounded-full text-ink-3 hover:text-ink"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span role="tooltip" id={id} className="absolute right-0 top-7 z-50 w-64 rounded-xl bg-ink px-3 py-2 text-left text-xs font-normal leading-relaxed text-bg shadow-pop">
          {text}
        </span>
      )}
    </span>
  );
}
