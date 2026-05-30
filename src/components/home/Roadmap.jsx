import { motion } from 'framer-motion';
import { Check, ChevronRight, Lock, Map } from 'lucide-react';
import clsx from 'clsx';
import { SpotlightCard } from '../motion/SpotlightCard';
import { ProgressBar } from '../motion/ProgressBar';

export function Roadmap({ subjects, onAnalytics, onSubjectSelect }) {
  return (
    <SpotlightCard className="p-7" glow="cyan">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-cyan-400" />
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-400">ROADMAP</p>
        </div>
        <button
          onClick={onAnalytics}
          className="text-xs text-ink-400 hover:text-ink-100 inline-flex items-center gap-1 transition-colors"
          data-testid="see-analytics-btn"
        >
          See Analytics <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <h3 className="font-display text-h1 text-ink-100">The Preparation Map</h3>

      <div className="mt-6 relative">
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/50 via-amber-500/30 to-line" />
        <ul className="space-y-4">
          {subjects.length ? subjects.map((subject, index) => (
            <motion.li
              key={subject.id}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="relative pl-12"
            >
              <span className={clsx(
                'absolute left-0 top-0 grid place-items-center h-8 w-8 rounded-full border-2',
                subject.status === 'done' && 'border-success bg-success/15 text-success',
                subject.status === 'active' && 'border-amber-500 bg-amber-500 text-white animate-pulse-glow',
                subject.status === 'locked' && 'border-line text-ink-600',
              )}
              style={subject.status === 'locked' ? { backgroundColor: 'rgb(var(--color-bg-inset))' } : undefined}>
                {subject.status === 'done' ? <Check className="w-4 h-4" /> :
                  subject.status === 'locked' ? <Lock className="w-3.5 h-3.5" /> :
                    <span className="font-mono text-xs font-bold">{index + 1}</span>}
              </span>
              <button onClick={() => onSubjectSelect?.(subject)} className="cmd-card w-full p-4 text-left">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className={clsx('truncate font-display text-lg', subject.status === 'locked' ? 'text-ink-600' : 'text-ink-100')}>
                      {subject.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-ink-400">{subject.description || 'No description yet'}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-amber-400 tracking-wider">{subject.progress}%</span>
                </div>
                <ProgressBar value={subject.progress} max={100} color={subject.status === 'active' ? 'amber' : 'cyan'} className="mt-3" />
              </button>
            </motion.li>
          )) : (
            <li className="relative pl-12">
              <span className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border-2 border-line text-ink-600"
                    style={{ backgroundColor: 'rgb(var(--color-bg-inset))' }}>
                <Lock className="w-3.5 h-3.5" />
              </span>
              <div className="cmd-card p-4">
                <p className="font-display text-lg text-ink-100">No roadmap yet</p>
                <p className="mt-1 text-sm text-ink-400">Add subjects to light up the preparation map.</p>
              </div>
            </li>
          )}
        </ul>
      </div>
    </SpotlightCard>
  );
}
