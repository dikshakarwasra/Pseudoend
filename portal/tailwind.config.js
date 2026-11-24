/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"Plus Jakarta Sans"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0071e3', // Apple signature blue
          600: '#0062c4',
          700: '#004ea3',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        apple: {
          canvas: '#f5f5f7',
          card: '#ffffff',
          cardSubtle: '#fbfbfd',
          cardHover: '#f5f5f7',
          border: '#d2d2d7',
          borderSubtle: 'rgba(0, 0, 0, 0.06)',
          blue: '#0071e3',
          blueHover: '#0077ed',
          text: '#1d1d1f',
          secondary: '#6e6e73',
          tertiary: '#86868b',
          muted: '#a1a1a6',
          // Apple Store signature pastel palette
          sky: '#e8f2fc',
          skyText: '#0071e3',
          rose: '#fcecef',
          roseText: '#b62645',
          lavender: '#f1ecfd',
          lavenderText: '#6b21a8',
          mint: '#e8f5ec',
          mintText: '#166534',
          peach: '#fef3d6',
          peachText: '#b45309',
          coral: '#ffedd5',
          coralText: '#9a3412',
          navy: '#0b132b',
          plum: '#43144f',
        }
      },
      boxShadow: {
        'apple-card': '0 2px 14px rgba(0, 0, 0, 0.04)',
        'apple-card-hover': '0 6px 20px rgba(0, 0, 0, 0.08)',
        'apple-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'apple-md': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'apple-lg': '0 16px 40px rgba(0, 0, 0, 0.14)',
        'apple-blue': '0 2px 8px rgba(0, 113, 227, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
