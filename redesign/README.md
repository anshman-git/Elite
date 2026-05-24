
````markdown
# EliteStudy Redesign Brief

A complete UI/UX overhaul brief for the EliteStudy "Study Command Center" — designed to be handed to any AI coding agent (Cursor, Claude Code, Emergent, Copilot, etc.) and implemented end-to-end.

## What's inside

| File | What it is |
|------|------------|
| [`01_VISION_AND_DESIGN_SYSTEM.md`](./01_VISION_AND_DESIGN_SYSTEM.md) | Vision, design tokens (colors, fonts, shadows), tailwind config, global CSS, motion principles, copy rewrite |
| [`02_ANIMATION_LIBRARY.md`](./02_ANIMATION_LIBRARY.md) | 13 reusable React motion components (CountUp, ConfettiBurst, MagneticButton, SpotlightCard, ProgressBar, etc.) |
| [`03_COMPONENT_REDESIGN.md`](./03_COMPONENT_REDESIGN.md) | Full Home page rebuilt: TopBar, Sidebar, MissionCard, PlayerCard, StatGrid, Roadmap, DailyFocus |
| [`04_PAGES_AND_ROLLOUT.md`](./04_PAGES_AND_ROLLOUT.md) | Quiz, Ranks, Profile, Files, Social, Performance patterns + 9-day rollout order |

## How to use

1. Open file `01` and replace your `tailwind.config.js` and `src/index.css` with the snippets there.
2. Install deps:
   ```bash
   yarn add framer-motion lucide-react canvas-confetti clsx
   yarn add -D tailwindcss-animate
   ```
3. Add the Google Fonts link to your `index.html`.
4. Create the motion components from file `02` into `src/components/motion/`.
5. Create the layout + home components from file `03` and swap in the new `Home.jsx`.
6. Follow file `04` for the rest of the pages and the rollout order.

## Tech assumptions

- React + Tailwind CSS + Framer Motion
- If different stack, swap motion primitives accordingly (GSAP, @vueuse/motion, svelte/motion)

## The core idea

Transform a *static gamified dashboard* into an *addictive command center* using three pillars:
- **Living surface** — ambient motion, breathing UI
- **Reward loops** — confetti, count-up XP, level-up celebrations, combo counters
- **Personality** — copy that taunts, hypes, and pulls users back in

Every interaction triggers feedback. The streak creates loss aversion. The leaderboard creates competition. Confetti creates dopamine. The loop is the product.
````

---

