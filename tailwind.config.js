import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Manrope"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h1: ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        h2: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        xs: '0.375rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.08)',
        glow: '0 18px 60px rgba(37, 99, 235, 0.20)',
        'glow-amber': '0 0 0 1px rgba(255,165,0,0.4), 0 8px 32px -8px rgba(255,165,0,0.45)',
        'glow-cyan': '0 0 0 1px rgba(34,211,238,0.4), 0 8px 32px -8px rgba(34,211,238,0.45)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.6)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.08) inset, 0 32px 60px -24px rgba(0,0,0,0.7)',
      },
      colors: {
        bg: {
          base: '#070912',
          surface: '#0E1220',
          raised: '#161B2E',
          inset: '#0A0E1A',
        },
        line: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)',
        },
        ink: {
          100: '#F5F7FB',
          200: '#C9D1E1',
          400: '#7C879C',
          600: '#4A546B',
          DEFAULT: '#101828',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        amber: {
          50: '#FFF8E1',
          400: '#FFC233',
          500: '#FFA500',
          600: '#E08900',
          glow: 'rgba(255,165,0,0.35)',
        },
        cyan: {
          400: '#22D3EE',
          500: '#06B6D4',
          glow: 'rgba(34,211,238,0.35)',
        },
        success: '#34D399',
        danger: '#FB7185',
        warn: '#FBBF24',
      },
      backgroundImage: {
        'amber-radial': 'radial-gradient(80% 60% at 50% 0%, rgba(255,165,0,0.18) 0%, transparent 70%)',
        'cyan-radial': 'radial-gradient(80% 60% at 50% 0%, rgba(34,211,238,0.18) 0%, transparent 70%)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,165,0,0.5)' },
          '50%': { boxShadow: '0 0 0 12px rgba(255,165,0,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        drift: {
          '0%': { transform: 'translate(0,0)' },
          '50%': { transform: 'translate(20px, -10px)' },
          '100%': { transform: 'translate(0,0)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.2s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        float: 'float 4s ease-in-out infinite',
        drift: 'drift 12s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
