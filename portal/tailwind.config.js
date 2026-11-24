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
          bg: '#000000',
          surface: '#161617',
          elevated: '#1d1d1f',
          hover: '#262629',
          border: '#333336',
          borderSubtle: 'rgba(255, 255, 255, 0.08)',
          blue: '#0071e3',
          blueHover: '#0077ed',
          blueLight: '#2997ff',
          text: '#f5f5f7',
          secondary: '#a1a1a6',
          tertiary: '#86868b',
          muted: '#6e6e73',
        }
      },
      boxShadow: {
        'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'apple-md': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'apple-blue': '0 0 20px -3px rgba(0, 113, 227, 0.35)',
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
