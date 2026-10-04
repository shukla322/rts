/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-white': '#ffffff',
        'bg-beige': '#FCE6F3',
        'header-purple': '#580b46',
        'highlight-orange': '#fe9c00',
        'light-orange': '#fff1d7',
        'num-red': '#c23b3b',
        'auction-green': '#8bc98a',
        'auction-yellow': '#f6d743',
        'auction-orange': '#f4a340',
        'auction-red': '#c23b3b',
        'soft-pink': '#f9a8d4',
      },
      // Type scale: caption (labels, hints) and body (default UI text). Larger sizes use
      // Tailwind's own text-sm / text-lg / text-xl / text-2xl.
      fontSize: {
        caption: ['11px', { lineHeight: '1.4' }],
        body: ['13px', { lineHeight: '1.5' }],
      },
      fontFamily: {
        display: ['"Montserrat"', 'system-ui', 'sans-serif'],
        body: ['"Montserrat"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 28px -22px rgba(88,11,70,.44), inset 0 1px 0 #fff',
        glow: '0 0 0 6px rgba(253, 155, 8, 0.25)',
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
