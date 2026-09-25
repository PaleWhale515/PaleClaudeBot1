/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: {
          950: '#07090d',
          900: '#0b0f15',
          850: '#0f141c',
          800: '#141a23',
          700: '#1c2430',
          600: '#283241',
          500: '#3a4556',
          400: '#5b6678',
          300: '#8792a3',
          200: '#b4bdc9',
          100: '#e4e8ee',
        },
        terminal: '#f5a524',
        up: '#22c55e',
        down: '#f43f5e',
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: 0, transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'panel-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
      },
      animation: {
        'toast-in': 'toast-in 180ms ease-out',
        'panel-in': 'panel-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'fade-in 160ms ease-out',
      },
    },
  },
  plugins: [],
};
