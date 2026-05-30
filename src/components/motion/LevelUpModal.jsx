import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { fireConfetti } from './ConfettiBurst';

export function LevelUpModal({ open, level, onClose }) {
  useEffect(() => {
    if (open) fireConfetti({ x: 0.5, y: 0.4 });
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
          style={{ backgroundColor: 'rgb(var(--color-bg-base) / 0.8)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative px-12 py-10 rounded-2xl border border-amber-500/50 text-center shadow-glow-amber"
            style={{ backgroundColor: 'rgb(var(--color-bg-surface))' }}
            initial={{ scale: 0.7, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            <p className="font-mono text-amber-400 tracking-[0.3em] text-sm">LEVEL UP</p>
            <p className="mt-2 font-display text-6xl shimmer-text">LV {level}</p>
            <p className="mt-4 text-ink-200">New tier unlocked. Keep the streak.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
