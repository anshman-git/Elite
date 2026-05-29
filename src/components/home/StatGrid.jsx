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
  amber: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
  danger: 'text-danger border-danger/30 bg-danger/5',
};

export function StatGrid({ tiles }) {
  return (
    <StaggerList className="-m-2 grid grid-cols-2 gap-4 overflow-visible p-2 lg:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon || iconMap[tile.id] || TrendingUp;
        return (
          <motion.div
            key={tile.id}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="cmd-card p-5 transform-gpu"
            style={{ isolation: 'isolate', transform: 'translateZ(0)' }}
            data-testid={`stat-${tile.id}`}
          >
            <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border ${tone[tile.color] || tone.cyan}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="mt-4 font-mono text-[10px] tracking-[0.25em] text-ink-400">{tile.label}</p>
            <p className="mt-1 font-display text-2xl text-ink-100">
              {typeof tile.value === 'number' ? <CountUp to={tile.value} /> : tile.value}
            </p>
            <p className="mt-1 text-xs text-ink-400">{tile.sub}</p>
          </motion.div>
        );
      })}
    </StaggerList>
  );
}
