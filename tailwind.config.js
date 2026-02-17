/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Amani Brand Colors - Canadian Maple inspired
        amani: {
          50: '#fef7f0',
          100: '#fdebd6',
          200: '#fad4ab',
          300: '#f6b576',
          400: '#f18c3f',
          500: '#ed6d1a', // Primary brand orange
          600: '#de5310',
          700: '#b83d10',
          800: '#933215',
          900: '#772b14',
          950: '#401307',
        },
        maple: {
          50: '#fdf4f3',
          100: '#fce7e4',
          200: '#fad3cd',
          300: '#f5b3a9',
          400: '#ed8677',
          500: '#e05a4a', // Canadian red
          600: '#cc3f2f',
          700: '#ab3224',
          800: '#8d2d22',
          900: '#752b23',
          950: '#3f120d',
        },
        navy: {
          50: '#f0f5ff',
          100: '#e0eaff',
          200: '#c7d8fe',
          300: '#a4bdfc',
          400: '#7e98f8',
          500: '#5b73f1',
          600: '#3f4de5',
          700: '#333dca',
          800: '#2c35a3',
          900: '#1a2055', // Deep navy
          950: '#0f1235',
        },
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(237, 109, 26, 0.3)',
        'glow-lg': '0 0 40px rgba(237, 109, 26, 0.4)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'maple-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ed6d1a' fill-opacity='0.05'%3E%3Cpath d='M30 30l15-15v30l-15-15zm0 0L15 15v30l15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
