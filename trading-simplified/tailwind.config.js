/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        sunken: token('sunken'),
        line: token('line'),
        ink: token('ink'),
        'ink-2': token('ink-2'),
        'ink-3': token('ink-3'),
        brand: token('brand'),
        'brand-soft': token('brand-soft'),
        'on-brand': token('on-brand'),
        up: token('up'),
        'up-soft': token('up-soft'),
        down: token('down'),
        'down-soft': token('down-soft'),
        gold: token('gold'),
        'gold-soft': token('gold-soft'),
        'gold-ink': token('gold-ink'),
      },
      borderRadius: { card: '20px' },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.06), 0 8px 24px -12px rgb(var(--shadow) / 0.12)',
        pop: '0 12px 40px -12px rgb(var(--shadow) / 0.35)',
      },
      keyframes: {
        'toast-in': { '0%': { opacity: 0.4, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'panel-in': { '0%': { transform: 'translateX(24px)', opacity: 0.6 }, '100%': { transform: 'translateX(0)', opacity: 1 } },
        flash: { '0%': { backgroundColor: 'rgb(var(--brand) / 0.14)' }, '100%': { backgroundColor: 'transparent' } },
      },
      animation: {
        'toast-in': 'toast-in 180ms ease-out',
        'panel-in': 'panel-in 200ms ease-out',
        flash: 'flash 900ms ease-out',
      },
    },
  },
  plugins: [],
};
