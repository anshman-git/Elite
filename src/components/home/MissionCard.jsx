import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Play, Zap } from 'lucide-react';
import { SpotlightCard } from '../motion/SpotlightCard';
import { MagneticButton } from '../motion/MagneticButton';
import { StreakFlame } from '../motion/StreakFlame';
import { fireConfetti } from '../motion/ConfettiBurst';

export function MissionCard({ streakDays = 0, isDailyDone = false, streakCopy, rewardXp = 50, onStart }) {
  const handleStart = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    fireConfetti({
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    });
    onStart?.();
  };

  return (
    <SpotlightCard className="p-5 sm:p-8 md:p-10 grid-bg" glow="amber">
      {/*
        Decorative blur accent — clipped inside an overflow-hidden wrapper so
        it cannot bleed onto adjacent cards / cause visual glitches.
      */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-amber-radial blur-2xl animate-drift opacity-60" />
      </div>

      {/* Header */}
      <div className="relative flex flex-wrap items-center gap-2 mb-5">
        <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="font-mono text-xs tracking-[0.3em] text-amber-500">TODAY&apos;S MISSION</p>
        <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 shrink-0">
          {isDailyDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
          {isDailyDone ? 'CLEARED' : 'ACTIVE CHALLENGE'}
        </span>
      </div>

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative font-display text-display-lg text-ink-100"
      >
        Solve today&apos;s <span className="shimmer-text">sprints</span>.
      </motion.h2>

      <p className="relative mt-2 sm:mt-3 max-w-lg text-sm sm:text-base text-ink-200">
        Two sprints. Six minutes. Then bragging rights. Daily multipliers are active,
        and the leaderboard is watching.
      </p>

      {/* Streak row */}
      <div className="relative mt-5 sm:mt-8 flex flex-wrap items-center gap-3">
        <StreakFlame days={streakDays} />
        <span className="text-ink-400 text-sm">{streakCopy || 'Grind a quiz to spark the streak.'}</span>
      </div>

      {/* CTA row */}
      <div className="relative mt-5 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
        <MagneticButton onClick={handleStart} className="btn-game" data-testid="start-sprints-btn">
          <Play className="w-4 h-4 fill-current" />
          {isDailyDone ? 'Practice More' : 'Enter the Arena'}
        </MagneticButton>
        <div className="flex items-center gap-1.5 text-sm text-ink-200">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          Reward:{' '}
          <span className="font-mono font-semibold text-amber-400">+{rewardXp} XP</span> bonus
        </div>
      </div>
    </SpotlightCard>
  );
}
