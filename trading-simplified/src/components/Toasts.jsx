import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const STYLES = {
  success: { icon: CheckCircle2, tone: 'text-up' },
  warning: { icon: AlertTriangle, tone: 'text-down' },
  info: { icon: Info, tone: 'text-brand' },
};

export default function Toasts({ toasts, dismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const s = STYLES[t.kind] ?? STYLES.info;
        const Icon = s.icon;
        return (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-pop ring-1 ring-line animate-toast-in">
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.tone}`} strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{t.title}</p>
              {t.body && <p className="mt-0.5 text-sm text-ink-2">{t.body}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded-lg p-1 text-ink-3 hover:bg-sunken hover:text-ink" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
