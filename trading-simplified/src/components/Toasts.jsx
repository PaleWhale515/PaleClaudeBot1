import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const STYLES = {
  success: { icon: CheckCircle2, accent: 'text-up', bar: 'bg-up' },
  warning: { icon: AlertTriangle, accent: 'text-terminal', bar: 'bg-terminal' },
  info: { icon: Info, accent: 'text-sky-400', bar: 'bg-sky-400' },
};

export default function Toasts({ toasts, dismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const s = STYLES[t.kind] ?? STYLES.info;
        const Icon = s.icon;
        return (
          <div
            key={t.id}
            className="pointer-events-auto relative overflow-hidden rounded-lg border border-ink-600 bg-ink-850/95 p-3 pl-4 shadow-2xl shadow-black/50 backdrop-blur animate-toast-in"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${s.bar}`} />
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.accent}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-100">{t.title}</p>
                {t.body && <p className="mt-0.5 font-mono text-xs text-ink-300">{t.body}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded p-0.5 text-ink-400 hover:bg-ink-700 hover:text-ink-100" aria-label="Dismiss">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
