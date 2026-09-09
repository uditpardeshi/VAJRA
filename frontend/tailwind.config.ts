import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2f7', 100: '#dce4ed', 200: '#bccddb', 300: '#8b9fc2',
          400: '#5f7aa3', 500: '#3e5a80', 600: '#2d4567', 700: '#1e314a',
          800: '#142133', 900: '#0f1924', 950: '#080d14',
          DEFAULT: '#3e5a80'
        },
        accent: {
          50: '#fef0f1', 100: '#fee0e2', 200: '#fccfc7', 300: '#faa89a',
          400: '#f7745d', 500: '#e94560', 600: '#d62d4a', 700: '#b81f3a',
          800: '#941b33', 900: '#771a2f', 950: '#400815',
          DEFAULT: '#e94560'
        },
        success: { 50: '#ecfdf5', 500: '#27ae60', 600: '#1e8a49', DEFAULT: '#27ae60' },
        warning: { 50: '#fffbeb', 500: '#f39c12', 600: '#d4870e', DEFAULT: '#f39c12' },
        surface: { 100: '#ffffff', 200: '#f8fafc', 300: '#f1f5f9', 400: '#e2e8f0', DEFAULT: '#ffffff' },
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
