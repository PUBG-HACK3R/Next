import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['var(--font-parkinsans)', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        'parkinsans': ['var(--font-parkinsans)', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Enhanced dark blue theme colors matching #101320
        dark: {
          50: '#101320',
          100: '#1a1d35',
          200: '#242849',
          300: '#2e335d',
          400: '#383e71',
          500: '#4a5085',
          600: '#6b7299',
          700: '#8c94ad',
          800: '#adb5c1',
          900: '#ced6d5',
        }
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #101320 0%, #1a1d35 100%)',
        'gradient-green-dark': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-blue-dark': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'gradient-purple-dark': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        'card-gradient': 'linear-gradient(145deg, #1a1d35 0%, #242849 100%)',
        'auth-gradient': 'linear-gradient(135deg, #101320 0%, #1a1d35 50%, #242849 100%)',
      },
      boxShadow: {
        'dark': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(34, 197, 94, 0.5)' },
        },
      }
    },
  },
  plugins: [],
};

export default config;
