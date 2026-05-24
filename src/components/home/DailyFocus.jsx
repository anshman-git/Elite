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
        <p className="font-display text-xl text-ink-100 leading-snug">&quot;{today.q}&quot;</p>
        <p className="mt-3 text-xs text-ink-400">- {today.a}</p>
      </div>
    </motion.div>
  );
}
