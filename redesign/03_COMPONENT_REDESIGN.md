
````markdown
# EliteStudy Redesign — Home Page Components (Part 3 of 4)

> Each section below = one component on your Home page. Replace your current JSX with these.

Folder structure for new components:
```
src/
├─ components/
│  ├─ motion/         ← from file 2
│  ├─ layout/
│  │   ├─ TopBar.jsx
│  │   └─ Sidebar.jsx
│  └─ home/
│      ├─ MissionCard.jsx
│      ├─ PlayerCard.jsx
│      ├─ StatGrid.jsx
│      ├─ Roadmap.jsx
│      └─ DailyFocus.jsx
└─ pages/
   └─ Home.jsx
```

---

## 1. `TopBar.jsx`

```jsx
import { Bell, Sun, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export function TopBar({ onNotifications, onTheme, isAdmin }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg-base/70 backdrop-blur-xl">
      <div className="flex items-center justify-between px-8 py-5">
        <motion.div
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-center gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-amber-500">ELITESTUDY</p>
            <h1 className="font-display text-2xl text-ink-100">Study Command Center</h1>
          </div>
          {isAdmin && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30"
              data-testid="admin-mode-badge">
              <Shield className="w-3 h-3" /> ADMIN MODE
            </motion.span>
          )}
        </motion.div>
        <div className="flex items-center gap-3">
          <button onClick={onNotifications} data-testid="bell-btn" className="btn-ghost p-2.5 relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse-glow" />
          </button>
          <button onClick={onTheme} data-testid="theme-toggle-btn" className="btn-ghost p-2.5">
            <Sun className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

---

## 2. `Sidebar.jsx` — with morphing active pill

```jsx
import { Home, BookOpen, FileText, Users, Trophy, User, Shield, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const nav = [
  { id: 'home',  label: 'Home',        icon: Home },
  { id: 'quiz',  label: 'Quiz',        icon: BookOpen },
  { id: 'files', label: 'Files',       icon: FileText },
  { id: 'social',label: 'Social',      icon: Users },
  { id: 'ranks', label: 'Ranks',       icon: Trophy },
  { id: 'profile',label:'Profile',     icon: User },
  { id: 'admin', label: 'Admin',       icon: Shield },
  { id: 'perf',  label: 'Performance', icon: BarChart3 },
];

export function Sidebar({ active, onSelect }) {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-line bg-bg-base/40 backdrop-blur-sm py-6 px-3">
      <nav className="flex flex-col gap-1">
        {nav.map((n, i) => {
          const Icon = n.icon;
          const isActive = active === n.id;
          return (
            <motion.button
              key={n.id} onClick={() => onSelect(n.id)} data-testid={`nav-${n.id}-btn`}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className={clsx(
                'group relative flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-bg-raised',
                isActive ? 'text-bg-base' : 'text-ink-200 hover:text-ink-100'
              )}>
              {isActive && (
                <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-ink-100"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <Icon className={clsx('relative z-10 w-4 h-4',
                isActive ? 'text-bg-base' : 'text-ink-400 group-hover:text-amber-400')} />
              <span className="relative z-10 font-medium">{n.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}
```

---

## 3. `MissionCard.jsx` — the hero card

```jsx
import { motion } from 'framer-motion';
import { Calendar, Play, Zap } from 'lucide-react';
import { SpotlightCard } from '../motion/SpotlightCard';
import { MagneticButton } from '../motion/MagneticButton';
import { StreakFlame } from '../motion/StreakFlame';
import { fireConfetti } from '../motion/ConfettiBurst';

export function MissionCard({ streakDays = 2, onStart }) {
  const handleStart = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    fireConfetti({
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height / 2) / window.innerHeight
    });
    onStart?.();
  };
  return (
    <SpotlightCard className="p-8 md:p-10 grid-bg" glow="amber">
      <div aria-hidden className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-amber-radial blur-2xl animate-drift" />

      <div className="relative flex items-center gap-3 mb-6">
        <Calendar className="w-4 h-4 text-amber-500" />
        <p className="font-mono text-xs tracking-[0.3em] text-amber-500">TODAY'S MISSION</p>
        <span className="ml-auto px-3 py-1.5 rounded-full text-xs font-mono tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30">
          ACTIVE CHALLENGE
        </span>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-display text-display-lg text-ink-100">
        Solve today's <span className="shimmer-text">sprints</span>.
      </motion.h2>

      <p className="mt-3 max-w-lg text-ink-200">
        Two sprints. Six minutes. Then bragging rights. Daily multipliers active — break the chain and you reset to zero.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <StreakFlame days={streakDays} />
        <span className="text-ink-400 text-sm">Day {streakDays + 1} is the dangerous one. Don't blink.</span>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <MagneticButton onClick={handleStart} className="btn-game" data-testid="start-sprints-btn">
          <Play className="w-4 h-4 fill-current" />
          Enter the Arena
        </MagneticButton>
        <div className="flex items-center gap-2 text-sm text-ink-200">
          <Zap className="w-4 h-4 text-amber-500" />
          Reward: <span className="font-mono font-semibold text-amber-400">+50 XP</span> bonus
        </div>
      </div>
    </SpotlightCard>
  );
}
```

---

## 4. `PlayerCard.jsx`

```jsx
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { SpotlightCard } from '../motion/SpotlightCard';
import { ProgressBar } from '../motion/ProgressBar';
import { CountUp } from '../motion/CountUp';

export function PlayerCard({ name, level, xp, xpToNext, rank, weeklyPoints, avatarUrl }) {
  const pct = (xp / xpToNext) * 100;
  return (
    <SpotlightCard className="p-7" glow="cyan">
      <div className="flex items-center gap-4">
        <motion.div
          className="relative h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center overflow-hidden"
          animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 3, repeat: Infinity }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            : <span className="text-3xl">👾</span>}
          <span className="absolute -inset-1 rounded-2xl border border-cyan-400/40 animate-pulse-glow" aria-hidden />
        </motion.div>
        <div>
          <p className="font-display text-2xl text-ink-100">{name}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">LV {level}</span>
            <span className="font-mono text-xs text-ink-400">
              <CountUp to={xp} /> / {xpToNext} XP
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-xs font-mono mb-2">
          <span className="text-ink-400">LEVEL PROGRESS</span>
          <span className="text-cyan-400">{Math.round(pct)}%</span>
        </div>
        <ProgressBar value={xp} max={xpToNext} color="cyan" />
      </div>

      <motion.div whileHover={{ y: -2 }}
        className="mt-6 flex items-center justify-between p-4 rounded-lg bg-bg-inset border border-line">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] text-ink-400">WEEKLY PULSE</p>
            <p className="font-display text-lg text-ink-100">#{rank}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-amber-400 font-bold">
            <CountUp to={weeklyPoints} suffix=" pts" />
          </p>
          <p className="text-[10px] tracking-wider text-ink-400 uppercase">This Week</p>
        </div>
      </motion.div>
    </SpotlightCard>
  );
}
```

---

## 5. `StatGrid.jsx`

```jsx
import { motion } from 'framer-motion';
import { Flame, Clock, TrendingUp, Trophy } from 'lucide-react';
import { CountUp } from '../motion/CountUp';
import { StaggerList } from '../motion/StaggerList';

const tiles = [
  { id:'streak', label:'GRIND STREAK', icon: Flame,       value:'2 days',    sub:"Day 3 is dangerous.",     color:'amber'  },
  { id:'exam',   label:'EXAM TARGET',  icon: Clock,       value:'3D 15H',    sub:'Tick. Tick. Tick.',       color:'danger' },
  { id:'points', label:'TOTAL XP',     icon: TrendingUp,  value:240,         sub:'160 to next level',       color:'cyan'   },
  { id:'rank',   label:'GLOBAL RANK',  icon: Trophy,      value:'#2',        sub:'80 XP behind #1',         color:'amber'  },
];

const tone = {
  amber:  'text-amber-400  border-amber-500/30  bg-amber-500/5',
  cyan:   'text-cyan-400   border-cyan-500/30   bg-cyan-500/5',
  danger: 'text-danger     border-danger/30     bg-danger/5',
};

export function StatGrid() {
  return (
    <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <motion.div key={t.id} whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="cmd-card p-5" data-testid={`stat-${t.id}`}>
            <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border ${tone[t.color]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="mt-4 font-mono text-[10px] tracking-[0.25em] text-ink-400">{t.label}</p>
            <p className="mt-1 font-display text-2xl text-ink-100">
              {typeof t.value === 'number' ? <CountUp to={t.value} /> : t.value}
            </p>
            <p className="mt-1 text-xs text-ink-400">{t.sub}</p>
          </motion.div>
        );
      })}
    </StaggerList>
  );
}
```

---

## 6. `Roadmap.jsx`

```jsx
import { motion } from 'framer-motion';
import { Map, Check, Lock, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { SpotlightCard } from '../motion/SpotlightCard';

const stops = [
  { id:1, title:'C Language Foundations', status:'done' },
  { id:2, title:'CSA Unit 1',              status:'done' },
  { id:3, title:'Data Structures Sprint',  status:'active' },
  { id:4, title:'OS & Networks',           status:'locked' },
  { id:5, title:'Final Mock Arena',        status:'locked' },
];

export function Roadmap() {
  return (
    <SpotlightCard className="p-7" glow="cyan">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-cyan-400" />
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-400">ROADMAP</p>
        </div>
        <button className="text-xs text-ink-400 hover:text-ink-100 inline-flex items-center gap-1 transition-colors" data-testid="see-analytics-btn">
          See Analytics <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <h3 className="font-display text-h1 text-ink-100">The Preparation Map</h3>

      <div className="mt-6 relative">
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/50 via-amber-500/30 to-line" />
        <ul className="space-y-4">
          {stops.map((s, i) => (
            <motion.li key={s.id}
              initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              className="relative pl-12">
              <span className={clsx(
                'absolute left-0 top-0 grid place-items-center h-8 w-8 rounded-full border-2',
                s.status === 'done'   && 'border-success bg-success/15 text-success',
                s.status === 'active' && 'border-amber-500 bg-amber-500 text-bg-base animate-pulse-glow',
                s.status === 'locked' && 'border-line bg-bg-inset text-ink-600',
              )}>
                {s.status === 'done' ? <Check className="w-4 h-4" /> :
                 s.status === 'locked' ? <Lock className="w-3.5 h-3.5" /> :
                 <span className="font-mono text-xs font-bold">{s.id}</span>}
              </span>
              <div className="cmd-card p-4 flex items-center justify-between">
                <p className={clsx('font-display text-lg', s.status === 'locked' ? 'text-ink-600' : 'text-ink-100')}>
                  {s.title}
                </p>
                {s.status === 'active' && (
                  <span className="font-mono text-xs text-amber-400 tracking-wider">IN PROGRESS</span>
                )}
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </SpotlightCard>
  );
}
```

---

## 7. `DailyFocus.jsx`

```jsx
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const quotes = [
  { q: 'Small wins compound into rankings.', a: 'EliteStudy' },
  { q: 'You cannot cram what you can drill daily.', a: 'EliteStudy' },
  { q: 'The streak is the strategy.', a: 'EliteStudy' },
];

export function DailyFocus() {
  const today = quotes[new Date().getDate() % quotes.length];
  return (
    <motion.div whileHover={{ y: -3 }} className="cmd-card p-7 relative overflow-hidden" data-testid="daily-focus-card">
      <div aria-hidden className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-amber-radial blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/30 grid place-items-center">
            <Quote className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-mono text-xs tracking-[0.3em] text-amber-500">DAILY FOCUS</p>
        </div>
        <p className="font-display text-xl text-ink-100 leading-snug">"{today.q}"</p>
        <p className="mt-3 text-xs text-ink-400">— {today.a}</p>
      </div>
    </motion.div>
  );
}
```

---

## 8. `Home.jsx` — putting it all together

```jsx
import { useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { Sidebar } from '../components/layout/Sidebar';
import { TickerBar } from '../components/motion/TickerBar';
import { ScrollReveal } from '../components/motion/ScrollReveal';
import { MissionCard } from '../components/home/MissionCard';
import { PlayerCard } from '../components/home/PlayerCard';
import { StatGrid } from '../components/home/StatGrid';
import { Roadmap } from '../components/home/Roadmap';
import { DailyFocus } from '../components/home/DailyFocus';
import { LevelUpModal } from '../components/motion/LevelUpModal';

export default function Home() {
  const [active, setActive] = useState('home');
  const [levelUp, setLevelUp] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar isAdmin onTheme={() => {}} onNotifications={() => {}} />
      <div className="flex flex-1">
        <Sidebar active={active} onSelect={setActive} />
        <main className="flex-1 px-6 lg:px-10 py-8 space-y-8 max-w-[1500px] mx-auto w-full">
          <ScrollReveal>
            <TickerBar items={['T 1', 'C LANGUAGE QUIZ UPLOADED', 'CSA UNIT 1', 'NEW RANKINGS LIVE']} />
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ScrollReveal className="lg:col-span-2" delay={0.05}>
              <MissionCard streakDays={2} onStart={() => setLevelUp(true)} />
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <PlayerCard name="Anshman" level={1} xp={0} xpToNext={200} rank={2} weeklyPoints={240} />
            </ScrollReveal>
          </div>

          <ScrollReveal delay={0.1}>
            <StatGrid />
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ScrollReveal className="lg:col-span-2"><Roadmap /></ScrollReveal>
            <ScrollReveal delay={0.1}><DailyFocus /></ScrollReveal>
          </div>
        </main>
      </div>
      <LevelUpModal open={levelUp} level={2} onClose={() => setLevelUp(false)} />
    </div>
  );
}
```
````

