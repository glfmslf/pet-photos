import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50:  '#fff8f4',
          100: '#ffe8d6',
          200: '#ffd4b8',
          300: '#ffbe94',
          400: '#ffa06b',
          500: '#ff7c3d',
          600: '#f05a1a',
          700: '#c44010',
          800: '#9a300b',
          900: '#7a2308',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
export default config
