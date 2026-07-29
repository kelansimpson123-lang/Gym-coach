/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Coach surface tones — a calm charcoal scale, not pure black,
        // so cards can separate from the page without borders everywhere.
        surface: {
          0: '#0B0D10', // page background
          1: '#14171B', // base card
          2: '#1C2026', // raised card / nav
          3: '#262B32', // hover / active surface
        },
        line: '#2A2F37', // hairline dividers
        ink: {
          primary: '#F2F4F7',
          secondary: '#A2ABB8',
          muted: '#6B7280',
        },
        // Single accent, used sparingly for primary actions and progress —
        // a muted amber-green ("progression" green) rather than a generic blue.
        accent: {
          DEFAULT: '#8FBF6B',
          dim: '#5C7A48',
          soft: 'rgba(143, 191, 107, 0.12)',
        },
        // Status colors used on the calendar (Phase 4+) — defined now so
        // they're consistent everywhere later.
        status: {
          complete: '#8FBF6B',
          cardio: '#6E9BD6',
          rest: '#4A505A',
          missed: '#D6716E',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
