/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        added: {
          bg: 'hsl(142, 60%, 12%)',
          bgLight: 'hsl(142, 50%, 92%)',
          text: 'hsl(142, 70%, 45%)',
          textLight: 'hsl(142, 60%, 30%)',
          border: 'hsl(142, 60%, 25%)',
          borderLight: 'hsl(142, 50%, 75%)',
          word: 'hsl(142, 70%, 20%)',
          wordLight: 'hsl(142, 60%, 80%)',
        },
        removed: {
          bg: 'hsl(0, 60%, 12%)',
          bgLight: 'hsl(0, 50%, 93%)',
          text: 'hsl(0, 70%, 55%)',
          textLight: 'hsl(0, 60%, 40%)',
          border: 'hsl(0, 60%, 25%)',
          borderLight: 'hsl(0, 50%, 78%)',
          word: 'hsl(0, 70%, 22%)',
          wordLight: 'hsl(0, 60%, 82%)',
        },
        modified: {
          bg: 'hsl(45, 80%, 10%)',
          bgLight: 'hsl(45, 80%, 92%)',
          text: 'hsl(45, 90%, 55%)',
          textLight: 'hsl(45, 80%, 35%)',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          raised: 'hsl(var(--surface-raised) / <alpha-value>)',
          border: 'hsl(var(--surface-border) / <alpha-value>)',
          muted: 'hsl(var(--surface-muted) / <alpha-value>)',
        },
        surfaceLight: {
          DEFAULT: 'hsl(0, 0%, 98%)',
          raised: 'hsl(0, 0%, 100%)',
          border: 'hsl(220, 13%, 88%)',
          muted: 'hsl(220, 10%, 55%)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'toast-in': 'toastIn 0.22s cubic-bezier(0.34, 1.4, 0.64, 1)',
        'view-in': 'viewIn 0.18s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateX(16px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        viewIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
