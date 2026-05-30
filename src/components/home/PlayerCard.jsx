import { motion } from 'framer-motion';
import { UserRound, Trophy } from 'lucide-react';
import { SpotlightCard } from '../motion/SpotlightCard';
import { ProgressBar } from '../motion/ProgressBar';
import { CountUp } from '../motion/CountUp';

export function PlayerCard({ name, level, xp, xpToNext, rank, weeklyPoints, avatarUrl }) {
  const safeMax = Math.max(Number(xpToNext) || 1, 1);
  const pct = Math.min(100, (Number(xp) / safeMax) * 100);

  return (
    <SpotlightCard className="p-7" glow="cyan">
      <div className="flex items-center gap-4">
        <motion.div
          className="relative h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center overflow-visible"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full rounded-2xl object-cover" />
          ) : (
            <UserRound className="h-8 w-8 text-cyan-400" />
          )}
          <span className="absolute -inset-1 rounded-2xl border border-cyan-400/40 animate-pulse-glow" aria-hidden />
        </motion.div>
        <div className="min-w-0">
          <p className="truncate font-display text-2xl text-ink-100">{name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs px-2 py-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">LV {level}</span>
            <span className="font-mono text-xs text-ink-400">
              <CountUp to={Number(xp) || 0} /> / {safeMax} XP
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-xs font-mono mb-2">
          <span className="text-ink-400">LEVEL PROGRESS</span>
          <span className="text-cyan-400">{Math.round(pct)}%</span>
        </div>
        <ProgressBar value={Number(xp) || 0} max={safeMax} color="cyan" />
      </div>

      <motion.div
        whileHover={{ y: -2 }}
        className="relative mt-6 flex items-center justify-between rounded-lg border border-line p-4 transform-gpu overflow-visible"
        style={{ backgroundColor: 'rgb(var(--color-bg-inset))', isolation: 'isolate', transform: 'translateZ(0)' }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] text-ink-400">WEEKLY PULSE</p>
            <p className="font-display text-lg text-ink-100">#{rank || '-'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-amber-400 font-bold">
            <CountUp to={Number(weeklyPoints) || 0} suffix=" pts" />
          </p>
          <p className="text-[10px] tracking-wider text-ink-400 uppercase">This Week</p>
        </div>
      </motion.div>
    </SpotlightCard>
  );
}
