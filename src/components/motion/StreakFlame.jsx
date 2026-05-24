import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

export function StreakFlame({ days }) {
  const intensity = Math.min(days / 30, 1);

  return (
    <motion.div
      className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/40 bg-amber-500/10"
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Flame
        className="text-amber-500"
        style={{ filter: `drop-shadow(0 0 ${8 + intensity * 16}px rgba(255,165,0,${0.4 + intensity * 0.5}))` }}
      />
      <span className="font-mono font-bold text-amber-400">{days}-DAY STREAK</span>
    </motion.div>
  );
}
