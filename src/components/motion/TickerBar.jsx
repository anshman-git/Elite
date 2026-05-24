import { motion } from 'framer-motion';

export function TickerBar({ items }) {
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden rounded-full border border-cyan-500/30 bg-cyan-500/5 px-4 py-3">
      <motion.div
        className="flex gap-10 whitespace-nowrap font-mono text-sm tracking-wider text-cyan-400"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 32, ease: 'linear', repeat: Infinity }}
      >
        {doubled.map((text, index) => (
          <span key={index} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
