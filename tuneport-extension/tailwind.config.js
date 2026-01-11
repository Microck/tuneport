/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Instrument Sans', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
      },
      colors: {
        // TuneFlow Boutique Palette
        'tf-white': '#FAFAFA',
        'tf-white-pure': '#FFFFFF',
        'tf-emerald': '#10B981',
        'tf-emerald-light': '#34D399',
        'tf-emerald-dark': '#059669',
        'tf-rose': '#E11D48',
        'tf-rose-light': '#FB7185',
        'tf-rose-dark': '#BE123C',
        'tf-slate': '#1E293B',
        'tf-slate-light': '#334155',
        'tf-slate-muted': '#64748B',
        'tf-gray': '#F1F5F9',
        'tf-gray-light': '#F8FAFC',
        'tf-border': '#E2E8F0',
        // Legacy (kept for compatibility)
        'spotify-green': '#10B981',
        'spotify-green-dark': '#059669',
        'spotify-green-light': '#34D399',
        'spotify-black': '#1E293B',
        'spotify-gray': '#F1F5F9',
        'spotify-gray-light': '#F8FAFC',
        'spotify-gray-lighter': '#E2E8F0',
        'spotify-white': '#FFFFFF',
        'spotify-text': '#64748B',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer-slide': 'shimmer-slide 2s ease-in-out infinite',
        'spin-around': 'spin-around calc(var(--speed) * 2) infinite linear',
        'border-beam': 'border-beam calc(var(--duration) * 1s) infinite linear',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'shimmer-slide': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'spin-around': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'border-beam': {
          '0%': { offsetDistance: '0%' },
          '100%': { offsetDistance: '100%' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'tf-gradient': 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, #FAFAFA 100%)',
        'tf-gradient-rose': 'linear-gradient(135deg, rgba(225, 29, 72, 0.05) 0%, transparent 50%)',
      },
      boxShadow: {
        'tf-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'tf-md': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
        'tf-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
        'tf-card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
        'tf-card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}