import { motion } from 'framer-motion';

export function ProgressBar({ value, max = 100, color = 'amber', className = '' }) {
  const pct = Math.min(1, value / max);
  const grad = color === 'cyan'
    ? 'linear-gradient(90deg, #06B6D4, #22D3EE)'
    : 'linear-gradient(90deg, #FFA500, #FFC233)';

  return (
    <div className={`relative h-2 rounded-full bg-bg-inset overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-full origin-left"
        style={{ background: grad }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct }}
        transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div
          className="absolute inset-0 opacity-60 animate-shimmer"
          style={{
            background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
          }}
        />
      </motion.div>
    </div>
  );
}
