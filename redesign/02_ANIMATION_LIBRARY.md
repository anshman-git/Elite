
````markdown
# EliteStudy Redesign — Animation Library (Part 2 of 4)

> Copy-paste-ready React components. Put them in `src/components/motion/`.

### Install dependencies

```bash
yarn add framer-motion lucide-react canvas-confetti clsx
yarn add -D tailwindcss-animate
```

---

## 1. `useReducedMotion.js`

```jsx
import { useEffect, useState } from 'react';
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(m.matches);
    const handler = (e) => setReduced(e.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);
  return reduced;
}
```

---

## 2. `CountUp.jsx`

```jsx
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function CountUp({ to, duration = 1200, prefix = '', suffix = '', className = '' }) {
  const [val, setVal] = useState(0);
  const reduced = useReducedMotion();
  const startRef = useRef(null);
  useEffect(() => {
    if (reduced) { setVal(to); return; }
    let raf;
    const tick = (t) => {
      if (!startRef.current) startRef.current = t;
      const p = Math.min((t - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, reduced]);
  return <span className={className}>{prefix}{val.toLocaleString()}{suffix}</span>;
}
```

---

## 3. `ScrollReveal.jsx`

```jsx
import { motion } from 'framer-motion';
export function ScrollReveal({ children, delay = 0, y = 24, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >{children}</motion.div>
  );
}
```

---

## 4. `StaggerList.jsx`

```jsx
import { motion } from 'framer-motion';
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } } };

export function StaggerList({ children, className = '' }) {
  return (
    <motion.div className={className} variants={container} initial="hidden" animate="show">
      {Array.isArray(children) ? children.map((c, i) => (
        <motion.div key={i} variants={item}>{c}</motion.div>
      )) : <motion.div variants={item}>{children}</motion.div>}
    </motion.div>
  );
}
```

---

## 5. `MagneticButton.jsx`

```jsx
import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function MagneticButton({ children, className = '', strength = 18, ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0); const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width - 0.5) * strength);
    y.set(((e.clientY - r.top) / r.height - 0.5) * strength);
  };
  const onLeave = () => { x.set(0); y.set(0); };
  return (
    <motion.button ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ x: sx, y: sy }} whileTap={{ scale: 0.95 }} className={className} {...props}>
      {children}
    </motion.button>
  );
}
```

---

## 6. `SpotlightCard.jsx`

```jsx
import { useRef } from 'react';
import clsx from 'clsx';

export function SpotlightCard({ children, className = '', glow = 'amber' }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  const tint = glow === 'cyan' ? 'rgba(34,211,238,0.10)' : 'rgba(255,165,0,0.10)';
  return (
    <div ref={ref} onMouseMove={onMove} className={clsx('cmd-card group p-6', className)} style={{ '--spot': tint }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           style={{ background: `radial-gradient(420px circle at var(--mx) var(--my), var(--spot), transparent 50%)` }} />
      <div className="relative">{children}</div>
    </div>
  );
}
```

---

## 7. `ConfettiBurst.jsx`

```jsx
import confetti from 'canvas-confetti';
export function fireConfetti(origin = { x: 0.5, y: 0.5 }) {
  const defaults = { startVelocity: 32, spread: 70, ticks: 80, gravity: 0.9, scalar: 0.9, origin };
  confetti({ ...defaults, particleCount: 60, colors: ['#FFA500', '#FFC233', '#22D3EE', '#34D399'] });
  setTimeout(() => confetti({ ...defaults, particleCount: 40, spread: 100, colors: ['#FFA500', '#FB7185'] }), 120);
}
```

---

## 8. `FloatingXP.jsx`

```jsx
import { AnimatePresence, motion } from 'framer-motion';

export function FloatingXP({ items }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {items.map((it) => (
          <motion.div key={it.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ position: 'absolute', left: it.x, top: it.y }}
            className="font-mono font-bold text-amber-500 text-2xl drop-shadow-[0_0_8px_rgba(255,165,0,0.6)]">
            +{it.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

---

## 9. `ProgressBar.jsx`

```jsx
import { motion } from 'framer-motion';

export function ProgressBar({ value, max = 100, color = 'amber', className = '' }) {
  const pct = Math.min(100, (value / max) * 100);
  const grad = color === 'cyan'
    ? 'linear-gradient(90deg, #06B6D4, #22D3EE)'
    : 'linear-gradient(90deg, #FFA500, #FFC233)';
  return (
    <div className={`relative h-2 rounded-full bg-bg-inset overflow-hidden ${className}`}>
      <motion.div className="h-full rounded-full relative" style={{ background: grad }}
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}>
        <div className="absolute inset-0 opacity-60 animate-shimmer"
          style={{ background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)', backgroundSize: '200% 100%' }} />
      </motion.div>
    </div>
  );
}
```

---

## 10. `StreakFlame.jsx`

```jsx
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

export function StreakFlame({ days }) {
  const intensity = Math.min(days / 30, 1);
  return (
    <motion.div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/40 bg-amber-500/10"
      animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
      <Flame className="text-amber-500"
        style={{ filter: `drop-shadow(0 0 ${8 + intensity * 16}px rgba(255,165,0,${0.4 + intensity * 0.5}))` }} />
      <span className="font-mono font-bold text-amber-400">{days}-DAY STREAK</span>
    </motion.div>
  );
}
```

---

## 11. `TickerBar.jsx`

```jsx
import { motion } from 'framer-motion';

export function TickerBar({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden rounded-full border border-cyan-500/30 bg-cyan-500/5 px-4 py-3">
      <motion.div className="flex gap-10 whitespace-nowrap font-mono text-sm tracking-wider text-cyan-400"
        animate={{ x: ['0%', '-50%'] }} transition={{ duration: 32, ease: 'linear', repeat: Infinity }}>
        {doubled.map((t, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            {t}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
```

---

## 12. `LevelUpModal.jsx`

```jsx
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { fireConfetti } from './ConfettiBurst';

export function LevelUpModal({ open, level, onClose }) {
  useEffect(() => { if (open) fireConfetti({ x: 0.5, y: 0.4 }); }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 backdrop-blur-md"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="relative px-12 py-10 rounded-2xl border border-amber-500/50 bg-bg-surface text-center shadow-glow-amber"
            initial={{ scale: 0.7, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
            <p className="font-mono text-amber-400 tracking-[0.3em] text-sm">LEVEL UP</p>
            <p className="mt-2 font-display text-6xl shimmer-text">LV {level}</p>
            <p className="mt-4 text-ink-200">New tier unlocked. Keep the streak.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 13. `PageTransition.jsx`

```jsx
import { motion } from 'framer-motion';
export const PageTransition = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
    {children}
  </motion.div>
);
```

Wrap routes with `<AnimatePresence mode="wait">` and put `<PageTransition>` inside each route component.
````
