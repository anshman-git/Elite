import { motion } from 'framer-motion';
import { Clock, Flame, TrendingUp, Trophy } from 'lucide-react';
import { CountUp } from '../motion/CountUp';
import { StaggerList } from '../motion/StaggerList';

const iconMap = {
  streak: Flame,
  exam: Clock,
  points: TrendingUp,
  rank: Trophy,
};

const tone = {
  amber: {
    icon: 'text-amber-500 border-amber-500/25 bg-amber-500/10 shadow-glow-amber',
    rail: 'from-amber-500 to-yellow-400',
    glow: 'bg-amber-radial',
  },
  cyan: {
    icon: 'text-cyan-500 border-cyan-500/25 bg-cyan-500/10 shadow-glow-cyan',
    rail: 'from-cyan-500 to-sky-400',
    glow: 'bg-cyan-radial',
  },
  danger: {
    icon: 'text-danger border-danger/25 bg-danger/10',
    rail: 'from-danger to-amber-400',
    glow: 'bg-amber-radial',
  },
};

export function StatGrid({ tiles }) {
  return (
    <StaggerList className="-m-2 grid grid-cols-1 gap-4 overflow-visible p-2 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon || iconMap[tile.id] || TrendingUp;
        const activeTone = tone[tile.color] || tone.cyan;
        return (
          <motion.div
            key={tile.id}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="cmd-card group overflow-hidden p-5 transform-gpu border border-line bg-bg-surface/85 shadow-soft backdrop-blur-md dark:bg-bg-surface/50"
            style={{ isolation: 'isolate', transform: 'translateZ(0)' }}
            data-testid={`stat-${tile.id}`}
          >
            <div className={`pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full ${activeTone.glow} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-80`} />
            <div className="relative flex items-start justify-between gap-3">
              <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${activeTone.icon}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-line bg-bg-raised/70 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">
                Live
              </span>
            </div>
            <div className="relative mt-5">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-ink-400">{tile.label}</p>
              <p className="mt-2 font-display text-3xl font-black leading-none tracking-tight text-ink-100 sm:text-4xl">
                {typeof tile.value === 'number' ? <CountUp to={tile.value} /> : tile.value}
              </p>
              <p className="mt-2 min-h-8 text-xs font-semibold leading-4 text-ink-400">{tile.sub}</p>
            </div>
            <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-bg-inset">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full origin-left rounded-full bg-gradient-to-r ${activeTone.rail}`}
              />
            </div>
          </motion.div>
        );
      })}
    </StaggerList>
  );
}
