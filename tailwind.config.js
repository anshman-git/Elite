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
        'display-lg': ['clamp(1.25rem, 3.5vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h1: ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        h2: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        xs: '0.25rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: 'var(--shadow-card)',
        'glow-amber': 'none',
        'glow-cyan': 'none',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      colors: {
        bg: {
          base: 'rgb(var(--color-bg-base) / <alpha-value>)',
          surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
          raised: 'rgb(var(--color-bg-raised) / <alpha-value>)',
          inset: 'rgb(var(--color-bg-inset) / <alpha-value>)',
        },
        line: {
          subtle: 'var(--color-line-subtle)',
          DEFAULT: 'var(--color-line)',
          strong: 'var(--color-line-strong)',
        },
        ink: {
          100: 'rgb(var(--color-ink-100) / <alpha-value>)',
          200: 'rgb(var(--color-ink-200) / <alpha-value>)',
          400: 'rgb(var(--color-ink-400) / <alpha-value>)',
          600: 'rgb(var(--color-ink-600) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-ink-100) / <alpha-value>)',
        },
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        focus: 'rgb(var(--color-focus) / <alpha-value>)',
        danger: 'rgb(var(--color-focus) / <alpha-value>)',
        warn: 'rgb(var(--color-accent) / <alpha-value>)',
        amber: {
          50: '#fbf4e7',
          400: 'rgb(var(--color-accent) / <alpha-value>)',
          500: 'rgb(var(--color-accent) / <alpha-value>)',
          600: 'rgb(var(--color-accent) / <alpha-value>)',
          glow: 'rgb(var(--color-accent) / 0.25)',
        },
        cyan: {
          400: 'rgb(var(--color-success) / <alpha-value>)',
          500: 'rgb(var(--color-success) / <alpha-value>)',
          glow: 'rgb(var(--color-success) / 0.22)',
        },
      },
      backgroundImage: {
        'amber-radial': 'none',
        'cyan-radial': 'none',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: 'none' },
          '50%': { boxShadow: 'none' },
        },
        shimmer: {
          '0%, 100%': { backgroundPosition: '0 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
        },
      },
      animation: {
        'pulse-glow': 'none',
        shimmer: 'none',
        float: 'none',
        drift: 'none',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
