/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: '#1a9e5f', dark: '#168a52' } },
      maxWidth: { kiosk: '480px' },
    },
  },
  plugins: [],
}
