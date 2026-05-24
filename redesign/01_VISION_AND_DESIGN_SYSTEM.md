
````markdown
# EliteStudy — UI/UX Redesign Master Brief (Part 1 of 4)

> **Goal:** Transform EliteStudy from a static gamified dashboard into a **fun, addictive, dopamine-driven Study Command Center** that students *want* to open every day.
>
> **Hand this entire `/redesign` folder to any AI coding agent (Cursor, Claude Code, Emergent, Copilot Workspace, etc.). Each file is self-contained and actionable.**

---

## 0. How to use this brief

There are 4 files in this folder. Apply them in order:

| # | File | What it covers |
|---|------|----------------|
| 1 | `01_VISION_AND_DESIGN_SYSTEM.md` | Vision, design tokens, typography, color, motion principles |
| 2 | `02_ANIMATION_LIBRARY.md` | Reusable animation primitives, hooks, components |
| 3 | `03_COMPONENT_REDESIGN.md` | Every component on the Home page — old vs new, with full code |
| 4 | `04_PAGES_AND_ROLLOUT.md` | Other pages (Quiz, Ranks, Profile…) + implementation order |

**Assumed stack:** React + Tailwind CSS + Framer Motion. If your stack differs, swap motion library equivalents (Vue → `@vueuse/motion`, Svelte → `svelte/motion`, plain JS → GSAP).

---

## 1. The Vision — "Study Command Center, not a study app"

Right now the dashboard *looks* gamified but *feels* static. The fix isn't more decoration — it's **kinetic feedback at every interaction.** Every click, hover, and scroll should reward the brain. Three pillars:

### Pillar 1 — **Living Surface**
The UI should breathe. Subtle ambient motion (pulsing glow on active streak, drifting gradient on the hero, parallax cards) makes the dashboard feel *alive* even when idle. Like a video game pause menu.

### Pillar 2 — **Reward Loops**
Every action triggers a satisfying micro-celebration:
- XP gain → number rolls up with a soft "chime" particle burst
- Streak day +1 → flame icon scales, color intensifies, screen-shake-lite
- Quiz answered → green pulse, +XP floats up and into the avatar
- Level-up → full-screen confetti + radial gradient flash

### Pillar 3 — **Personality**
EliteStudy isn't a productivity app — it's a **rival**. Copy should taunt, congratulate, and hype:
- "You're #2. Want #1?"
- "3 days to exam. The clock is louder than your excuses."
- "First sprint of the day. Make it count."

---

## 2. Design Tokens — paste into `tailwind.config.js`

Keep the existing **midnight + amber + cyan** palette (it's already strong). We're refining, not replacing.

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Backgrounds — true blacks with a hint of blue
        bg: {
          base:    '#070912',  // page background
          surface: '#0E1220',  // card background
          raised:  '#161B2E',  // hover / elevated card
          inset:   '#0A0E1A',  // input / nested
        },
        // Borders & dividers
        line: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT:'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)',
        },
        // Brand — amber (primary action, streaks, XP)
        amber: {
          50:  '#FFF8E1',
          400: '#FFC233',
          500: '#FFA500',  // primary
          600: '#E08900',
          glow:'rgba(255,165,0,0.35)',
        },
        // Accent — cyan (active states, levels, info)
        cyan: {
          400: '#22D3EE',
          500: '#06B6D4',
          glow:'rgba(34,211,238,0.35)',
        },
        // Semantic
        success: '#34D399',
        danger:  '#FB7185',
        warn:    '#FBBF24',
        // Text
        ink: {
          100: '#F5F7FB',  // headings
          200: '#C9D1E1',  // body
          400: '#7C879C',  // muted
          600: '#4A546B',  // disabled
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.5rem, 5vw, 4rem)',   { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2rem, 4vw, 3rem)',     { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        'h1':         ['1.875rem',                   { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'h2':         ['1.5rem',                     { lineHeight: '1.2',  letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        'xs': '0.375rem', 'sm': '0.5rem', 'md': '0.75rem',
        'lg': '1rem', 'xl': '1.25rem', '2xl':'1.5rem',
      },
      boxShadow: {
        'glow-amber': '0 0 0 1px rgba(255,165,0,0.4), 0 8px 32px -8px rgba(255,165,0,0.45)',
        'glow-cyan':  '0 0 0 1px rgba(34,211,238,0.4), 0 8px 32px -8px rgba(34,211,238,0.45)',
        'card':       '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.6)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.08) inset, 0 32px 60px -24px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'amber-radial': 'radial-gradient(80% 60% at 50% 0%, rgba(255,165,0,0.18) 0%, transparent 70%)',
        'cyan-radial':  'radial-gradient(80% 60% at 50% 0%, rgba(34,211,238,0.18) 0%, transparent 70%)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,165,0,0.5)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(255,165,0,0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'drift': {
          '0%':   { transform: 'translate(0,0)' },
          '50%':  { transform: 'translate(20px, -10px)' },
          '100%': { transform: 'translate(0,0)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.2s ease-in-out infinite',
        'shimmer':    'shimmer 2.4s linear infinite',
        'float':      'float 4s ease-in-out infinite',
        'drift':      'drift 12s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

Install the Google Fonts in `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```

---

## 3. Global CSS — paste into `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { color-scheme: dark; }
  body {
    @apply bg-bg-base text-ink-200 font-sans antialiased;
    background-image:
      radial-gradient(1200px 600px at 80% -10%, rgba(34,211,238,0.08), transparent 60%),
      radial-gradient(1000px 500px at -10% 10%, rgba(255,165,0,0.06), transparent 60%);
    background-attachment: fixed;
  }
  h1,h2,h3,h4 { @apply font-display text-ink-100; }
  ::selection { background: rgba(255,165,0,0.35); color: #fff; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 8px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,165,0,0.35); }
}

@layer components {
  .cmd-card {
    @apply relative rounded-xl bg-bg-surface border border-line shadow-card overflow-hidden;
    @apply transition-all duration-300 ease-out;
  }
  .cmd-card:hover { @apply border-line-strong shadow-card-hover -translate-y-0.5; }

  .grid-bg {
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%);
  }

  .shimmer-text {
    background: linear-gradient(110deg, #FFA500 30%, #FFE7A8 50%, #FFA500 70%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    @apply animate-shimmer;
  }

  .btn-game {
    @apply inline-flex items-center gap-2 px-5 py-3 rounded-lg font-display font-semibold;
    @apply bg-amber-500 text-bg-base shadow-glow-amber;
    @apply transition-all duration-200 ease-out;
  }
  .btn-game:hover { @apply -translate-y-0.5 brightness-110; }
  .btn-game:active{ @apply translate-y-0 scale-95 brightness-95; }

  .btn-ghost {
    @apply inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium;
    @apply bg-bg-raised border border-line text-ink-100;
    @apply transition-all duration-200 hover:border-line-strong hover:bg-bg-surface;
  }
}
```

---

## 4. Motion Principles

1. **Easing matters more than duration.** Use `cubic-bezier(0.2, 0.8, 0.2, 1)` for entrances.
2. **No `transition: all`.** Always list properties: `transition: transform 240ms ease, opacity 240ms ease`.
3. **150–250ms** for micro-interactions, **400–600ms** for entrances, **800–1200ms** only for hero reveals.
4. **Stagger child elements by 40–80ms.** Cinematic without dragging.
5. **Respect `prefers-reduced-motion`.**
6. **Animate `transform` and `opacity` only.** Avoid `width`/`height`/`top`/`left`.

---

## 5. Copy & Personality Rewrite

| Old (flat) | New (alive) |
|---|---|
| Daily Grind — Solve Today's Sprints | **TODAY'S MISSION** — *Don't break the chain. 2 days down.* |
| Start Sprints | **Enter the Arena →** |
| Grind Streak — 2 days | 🔥 **2-DAY STREAK** — *Day 3 is the dangerous one.* |
| Exam Target — 3d 15h left | ⏱ **3D 15H** — *Tick. Tick. Tick.* |
| Total Points — 240 | ⚡ **240 XP** — *160 to next level.* |
| Global Rank — #2 | 🥈 **RANK #2** — *#1 is 80 XP ahead. Catchable.* |
| Weekly Pulse #2 | **LEADERBOARD #2** — *Hold the line.* |

Rule: every label should either *tell the user where they stand* or *bait them into one more click.*

---

**Next file →** `02_ANIMATION_LIBRARY.md`
````

---

