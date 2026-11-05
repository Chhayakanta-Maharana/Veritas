/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sentinel: {
          950: '#020617', // Pitch black base
          900: '#090d16', // Primary dark surface
          850: '#0f172a', // Card / panel background
          800: '#1e293b', // Elevated borders
          700: '#334155', // Subtle divider
          600: '#475569', // Muted text
          400: '#94a3b8', // Secondary text
          200: '#e2e8f0', // Primary text
          50: '#f8fafc',
        },
        crimson: {
          900: '#450a0a',
          800: '#7f1d1d',
          700: '#991b1b',
          600: '#dc2626',
          500: '#ef4444',
          400: '#f87171',
          300: '#fca5a5',
        },
        cyan: {
          950: '#083344',
          900: '#164e63',
          800: '#155e75',
          600: '#0891b2',
          500: '#06b6d4',
          400: '#22d3ee',
          300: '#67e8f9',
        },
        emerald: {
          900: '#064e3b',
          700: '#047857',
          500: '#10b981',
          400: '#34d399',
        },
        doom: {
          950: '#020d07', // Deepest Latverian obsidian green
          900: '#051f12', // Shadow cowl green
          850: '#092d1b', // Dark hooded cloak
          800: '#0f4429', // Tunic forest green
          700: '#15613c', // Latverian emerald
          600: '#168054', // Rich toxic green
          500: '#10b981', // Piercing emerald glow
          400: '#34d399', // Bright neon highlight
          300: '#6ee7b7', // Ocular beam green
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-crimson': '0 0 25px -5px rgba(239, 68, 68, 0.3)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'glow-doom': '0 0 25px -4px rgba(16, 185, 129, 0.45)',
        'glow-doom-lg': '0 0 45px -8px rgba(16, 185, 129, 0.65)',
      }
    },
  },
  plugins: [],
};

