import { AnimatePresence, motion } from 'framer-motion';

export function FloatingXP({ items }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ position: 'absolute', left: item.x, top: item.y }}
            className="font-mono font-bold text-amber-500 text-2xl drop-shadow-[0_0_8px_rgba(255,165,0,0.6)]"
          >
            +{item.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
