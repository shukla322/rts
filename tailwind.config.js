/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-white': '#fffdf8',
        'bg-beige': '#fef2d7',
        'header-purple': '#580b46',
        'highlight-orange': '#fe9c00',
        'auction-green': '#8bc98a',
        'auction-yellow': '#f6d743',
        'auction-orange': '#f4a340',
        'auction-red': '#e2534d',
        'soft-pink': '#f9a8d4',
      },
      fontFamily: {
        display: ['"Public Sans"', 'system-ui', 'sans-serif'],
        body: ['"Public Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 45px -15px rgba(88, 11, 70, 0.35)',
        glow: '0 0 0 6px rgba(254, 156, 0, 0.25)',
        'glow-pink': '0 0 0 6px rgba(249, 168, 212, 0.35)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.85) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
