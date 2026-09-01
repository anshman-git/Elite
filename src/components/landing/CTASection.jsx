import { ArrowRight, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection({ onGetStarted }) {
  return (
    <section className="relative py-28 px-6 overflow-hidden bg-bg-surface border-t border-line">
      {/* Grid Overlay */}
      <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />

      {/* Decorative Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-4xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6"
        >
          {/* Flame Icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-glow-amber mb-2">
            <Flame className="h-7 w-7 text-amber-50" />
          </div>

          <h2 className="text-display-lg font-display font-black tracking-tight text-ink-100 leading-tight">
            Your Journey to{' '}
            <span className="shimmer-text bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
              Academic Excellence
            </span>{' '}
            Starts Here.
          </h2>

          <p className="text-base sm:text-lg text-ink-300 leading-relaxed max-w-xl font-sans font-medium">
            Join over 12,000+ BCA and college students who are already studying smarter, tracking progress, and climbing the ranks.
          </p>

          <button
            onClick={onGetStarted}
            className="btn-game px-10 py-4 text-base font-bold shadow-glow-amber transition-all mt-4 w-full sm:w-auto"
            id="cta-bottom-btn"
          >
            Start Learning Free
            <ArrowRight className="h-5 w-5" />
          </button>

          {/* Micro trust details */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs font-bold text-ink-400 mt-4 select-none">
            <span>⚡ Setup in 30 seconds</span>
            <span className="hidden sm:inline text-ink-600">•</span>
            <span>🛡️ No credit card required</span>
            <span className="hidden sm:inline text-ink-600">•</span>
            <span>🎁 100% Free for college students</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
