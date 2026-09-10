import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        palette: {
          raspberry: '#D33F49',
          thistle: '#D7C0D0',
          beige: '#EFF0D1',
          teal: '#77BA99',
          shadow: '#262730',
          'shadow-dark': '#1d1e25',
          'shadow-surface': '#262730',
          'shadow-elevated': '#32333e',
          'shadow-border': '#3d3e4b',
        },
        primary: {
          50: '#eef2f7', 100: '#dce4ed', 200: '#bccddb', 300: '#8b9fc2',
          400: '#77BA99', 500: '#77BA99', 600: '#64a384', 700: '#528a6f',
          800: '#262730', 900: '#1d1e25', 950: '#14151a',
          DEFAULT: '#77BA99'
        },
        accent: {
          50: '#fef0f1', 100: '#fee0e2', 200: '#fccfc7', 300: '#faa89a',
          400: '#e25861', 500: '#D33F49', 600: '#bd333d', 700: '#a32831',
          800: '#802128', 900: '#5c171c', 950: '#380c10',
          DEFAULT: '#D33F49'
        },
        success: { 50: '#ecfdf5', 500: '#77BA99', 600: '#64a384', DEFAULT: '#77BA99' },
        warning: { 50: '#fffbeb', 500: '#f39c12', 600: '#d4870e', DEFAULT: '#f39c12' },
        surface: { 100: '#ffffff', 200: '#EFF0D1', 300: '#D7C0D0', 400: '#32333e', DEFAULT: '#262730' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05)',
        'elevated': '0 10px 40px -10px rgba(0,0,0,0.15)',
      },
      animation: {
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
export default config
