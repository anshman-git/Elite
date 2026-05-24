
````markdown
# EliteStudy Redesign — Other Pages & Rollout Plan (Part 4 of 4)

> Patterns for Quiz, Ranks, Profile, Files, Social, Performance — plus the order to ship in so you see wins fast.

---

## 1. Quiz Page — `QuizArena.jsx`

```jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap } from 'lucide-react';
import { fireConfetti } from '../components/motion/ConfettiBurst';

export function QuizArena({ question, options, correctIndex, onNext }) {
  const [picked, setPicked] = useState(null);
  const [locked, setLocked] = useState(false);

  const choose = (i, e) => {
    if (locked) return;
    setPicked(i); setLocked(true);
    if (i === correctIndex) {
      const r = e.currentTarget.getBoundingClientRect();
      fireConfetti({
        x: (r.left + r.width/2)/window.innerWidth,
        y: (r.top + r.height/2)/window.innerHeight
      });
    } else {
      document.body.animate(
        [{ transform: 'translateX(0)' },{ transform: 'translateX(-6px)' },
         { transform: 'translateX(6px)' },{ transform: 'translateX(0)' }],
        { duration: 220 }
      );
    }
    setTimeout(() => { setPicked(null); setLocked(false); onNext(); }, 900);
  };

  return (
    <div className="cmd-card p-8 grid-bg relative">
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-xs tracking-[0.3em] text-amber-500">QUESTION 3 / 10</span>
        <span className="inline-flex items-center gap-1 font-mono text-cyan-400 text-sm">
          <Zap className="w-3.5 h-3.5" /> 10 XP
        </span>
      </div>

      <motion.h2 key={question}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="font-display text-display-lg text-ink-100 mb-8">
        {question}
      </motion.h2>

      <div className="grid sm:grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === correctIndex;
          const state =
            !locked ? 'idle' :
            isPicked && isCorrect ? 'right' :
            isPicked && !isCorrect ? 'wrong' :
            isCorrect ? 'reveal' : 'idle';
          return (
            <motion.button key={i} onClick={(e) => choose(i, e)}
              whileHover={!locked ? { y: -2 } : {}}
              whileTap={!locked ? { scale: 0.98 } : {}}
              data-testid={`quiz-option-${i}`}
              className={[
                'group relative flex items-center justify-between p-5 rounded-xl border text-left transition-all',
                state === 'idle'   && 'bg-bg-surface border-line hover:border-amber-500/50 hover:bg-bg-raised',
                state === 'right'  && 'bg-success/10 border-success text-success',
                state === 'wrong'  && 'bg-danger/10  border-danger  text-danger',
                state === 'reveal' && 'bg-success/5  border-success/40 text-success',
              ].filter(Boolean).join(' ')}>
              <span className="font-medium">{opt}</span>
              <AnimatePresence>
                {state === 'right' || state === 'reveal' ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="w-5 h-5" />
                  </motion.span>
                ) : state === 'wrong' ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <X className="w-5 h-5" />
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <motion.div className="absolute left-0 bottom-0 h-1 bg-amber-500 rounded-full"
        initial={{ width: '100%' }} animate={{ width: '0%' }}
        transition={{ duration: 20, ease: 'linear' }} />
    </div>
  );
}
```

### Quiz feel-good additions
- **Combo counter** — "🔥 3x COMBO" badge grows after 3 right answers in a row
- **Streak break sound** — soft "thud" if combo breaks
- **End-of-quiz summary screen** with confetti, XP breakdown, accuracy %, "Share rank" button

---

## 2. Ranks Page — `LeaderRow.jsx`

```jsx
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal } from 'lucide-react';

const podiumIcons = { 1: Crown, 2: Medal, 3: Medal };
const podiumColor = { 1: 'text-amber-400', 2: 'text-cyan-300', 3: 'text-amber-600' };

export function LeaderRow({ rank, name, xp, isYou }) {
  const Icon = podiumIcons[rank] || Trophy;
  return (
    <motion.div layout whileHover={{ x: 4 }}
      className={`cmd-card p-4 flex items-center gap-4 ${isYou ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
      data-testid={`leader-row-${rank}`}>
      <span className="font-display text-3xl text-ink-400 w-12 text-center">{rank}</span>
      {rank <= 3 && <Icon className={`w-5 h-5 ${podiumColor[rank]}`} />}
      <div className="flex-1">
        <p className="font-display text-lg text-ink-100">
          {name} {isYou && <span className="text-xs text-amber-400 ml-2">YOU</span>}
        </p>
      </div>
      <p className="font-mono text-amber-400 font-bold">{xp.toLocaleString()} XP</p>
    </motion.div>
  );
}
```

> ⚡ The `layout` prop is the magic — when rankings change, rows physically swap with spring motion. **This single touch turns the leaderboard into something people refresh repeatedly.**

---

## 3. Profile Page — show off achievements

- **Avatar frame** upgrades visually with level (1–5: thin border, 6–10: glowing, 11+: animated gradient)
- **Achievement wall** — grid of badges. Locked = silhouettes with lock icon; unlocked = hover tilt + glow
- **Activity heatmap** (GitHub-style) — use `react-calendar-heatmap` or build with CSS grid
- **"Brag card"** — generate shareable image of stats (use `html-to-image`), formatted for Instagram stories

---

## 4. Files Page — premium uploads

- **Drag-and-drop zone** with dotted border that pulses cyan on dragover
- **Upload progress** as circular ring around file icon
- **File cards** with hover-tilt and PDF first-page preview
- Use Framer Motion `layout` for filter transitions — cards reflow with spring

---

## 5. Social Page — feed with personality

- **Activity feed**: "Anshman just hit a 5-day streak 🔥", "Priya climbed to Rank #4 ⚡"
- Each item slides in from the right on new event
- Optimistic UI on reactions (heart, fire, lightning)
- **Study rooms** — pulsing dot showing live concurrent count

---

## 6. Performance Page — video-game stats screen

- Use `recharts` with custom amber/cyan dark theme colors
- **Radar chart** of subject mastery (great for game vibe)
- **Streak calendar** with intensity gradient
- Big "personal record" callouts: "Longest streak: 12 days", "Best accuracy: 94%"

---

## 7. Global enhancements

### A. Sound design (optional but powerful)
Use `use-sound` library:
- Correct answer → soft "ping" (300ms)
- Wrong answer → muted "thud"
- Level up → ascending chime
- Master mute toggle in top bar
- Free SFX: [freesound.org](https://freesound.org) or [zapsplat.com](https://zapsplat.com)

### B. Empty states with personality
Instead of "No quizzes yet", say: *"The arena is quiet… for now. Upload your first quiz and let the grind begin."*

### C. Loading states
Replace spinners with **skeleton shimmer** (use `animate-shimmer` keyframe) shaped exactly like the card being loaded.

### D. 404 page
*"Lost in the command center. Return to base →"* with a glitching number animation.

### E. Onboarding (first-time users)
Three-step tour with spotlight overlay:
1. "Here's your daily mission."
2. "Watch your streak. Don't break it."
3. "Climb the ranks. #1 isn't out of reach."

---

## 8. Performance & polish checklist

- [ ] Lazy-load route components with `React.lazy + Suspense`
- [ ] Wrap heavy charts in `react-window` if list is long
- [ ] Add `will-change: transform` to animated cards (remove after animation ends)
- [ ] Test on low-end phone — if anything stutters, reduce blur/shadow
- [ ] Run Lighthouse — target 90+ accessibility
- [ ] Verify `prefers-reduced-motion` disables non-essential animations

---

## 9. Rollout order (ship wins fast)

1. **Foundations** — paste design tokens, install deps, drop in motion primitives. *Nothing visible yet, but everything is possible.*
2. **Hero + Player Card** — rebuild MissionCard + PlayerCard. *Dashboard feels 2x more alive.*
3. **Stat Grid + Ticker + Sidebar morph** — high impact, low effort. *Whole top half is kinetic.*
4. **Roadmap + DailyFocus** — completes Home page.
5. **Quiz Arena** — biggest behavior driver. Confetti, combo counter, end-of-quiz celebration.
6. **Ranks page** — animated leaderboard is the secret weapon.
7. **Profile + achievements** — gives users a reason to come back.
8. **Performance + Files + Social** — round it out.
9. **Sound + onboarding + 404** — final polish.

---

## 10. The "addictive loop" you're building

```
Open app → see streak (loss aversion: don't break it)
       → see "you're #2, #1 is catchable" (competition)
       → click Enter Arena (confetti reward)
       → answer questions (instant green/red feedback)
       → combo builds (escalating excitement)
       → quiz ends → confetti + XP count-up
       → progress bar fills toward level → almost level up!
       → "one more sprint?" → repeat
```

Every loop element is implemented in files 1–3. **The loop is the product. The visuals are just the wrapping.**

---

## 11. Things to NOT do

- ❌ Don't add purple/violet gradients (AI-slop aesthetic)
- ❌ Don't use `transition: all` anywhere
- ❌ Don't autoplay sounds without user gesture
- ❌ Don't use emoji as icons (use lucide-react). Copy text can use 🔥⚡🏆 sparingly
- ❌ Don't animate `width`/`height`/`top`/`left`. Only `transform` and `opacity`
- ❌ Don't make every card glow — pick hero + level card. Rest stay calm for contrast
- ❌ Don't forget mobile — test every animation on small viewport

---

## 12. Quick deliverable for the AI agent

> "Implement files 1–4 in this order:
> 1. Replace `tailwind.config.js` with config from file 1
> 2. Replace `src/index.css` with CSS from file 1
> 3. Install: `yarn add framer-motion lucide-react canvas-confetti clsx && yarn add -D tailwindcss-animate`
> 4. Create `src/components/motion/` with all 13 files from file 2
> 5. Create `src/components/layout/` and `src/components/home/` with components from file 3
> 6. Replace Home page with `src/pages/Home.jsx` from file 3
> 7. Add Google Fonts link to `index.html`
> 8. Verify dev server runs, all `data-testid` attributes present, `prefers-reduced-motion` honored
> 9. Apply Quiz Arena + Ranks patterns from file 4
> 10. Polish per file 4 sections 7–9"

That's the whole brief. Ship it, then iterate.

— End of brief —
````

