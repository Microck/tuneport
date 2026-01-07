/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'spotify-green': '#1DB954',
        'tuneflow-blue': '#3B82F6',
        'tuneflow-purple': '#8B5CF6',
        'dark-bg': '#0F172A',
        'dark-surface': '#1E293B',
        'dark-border': '#334155'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite'
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}