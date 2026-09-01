import { motion } from 'framer-motion';
import { Bot, Home } from 'lucide-react';
import { Button } from '../components/ui';
import { navigateHome } from '../routing';

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-bg-surface p-8 text-center shadow-card">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
        <motion.div
          aria-hidden
          animate={{ opacity: [0.7, 1, 0.7], y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="font-mono text-[5rem] sm:text-[6rem] font-black leading-none text-amber-500 font-display"
        >
          404
        </motion.div>
        <div className="mx-auto mt-4 grid h-14 w-14 place-items-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
          <Bot size={28} />
        </div>
        <h1 className="mt-5 font-display text-2xl sm:text-3xl font-bold text-ink-100">Lost in the command center.</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-400">
          This signal does not map to an EliteStudy route. Return to base and pick up your sprint from there.
        </p>
        <Button variant="primary" className="mt-6" onClick={navigateHome}>
          <Home size={16} /> Return to base
        </Button>
      </div>
    </div>
  );
}
