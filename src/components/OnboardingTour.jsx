import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, Flame, Trophy, X } from 'lucide-react';
import { useReducedMotion } from './motion/useReducedMotion';

const STEPS = [
  {
    icon: Crosshair,
    title: 'Your daily mission lives here.',
    body: 'Start with one sprint. The command center rewards consistency before heroics.',
  },
  {
    icon: Flame,
    title: 'Protect the streak.',
    body: 'Every completed quiz keeps your chain warm. Miss a day and the pressure resets.',
  },
  {
    icon: Trophy,
    title: 'Climb the ranks.',
    body: 'Weekly points decide the board. The next player above you is the target.',
  },
];

export function OnboardingTour({ open, onDone }) {
  const [step, setStep] = useState(0);
  const reduceMotion = useReducedMotion();
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    setStep(0);
    onDone?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center bg-bg-base/85 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Skip onboarding"
            onClick={finish}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl border border-line bg-bg-raised text-ink-200 transition-[background-color,border-color,color] duration-200 hover:border-amber-500/40 hover:text-ink-100"
          >
            <X size={18} />
          </button>

          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-bg-surface p-6 shadow-card"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
          >
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-glow-amber">
              <Icon size={24} />
            </div>

            <p className="mt-6 font-mono text-xs tracking-[0.3em] text-cyan-400">STEP {step + 1} / {STEPS.length}</p>
            <h2 id="onboarding-title" className="mt-2 font-display text-2xl text-ink-100">{current.title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink-200">{current.body}</p>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {STEPS.map((item, index) => (
                  <span
                    key={item.title}
                    className={`h-2 rounded-full transition-[background-color,transform] duration-200 ${index === step ? 'w-7 bg-amber-400' : 'w-2 bg-line-strong'}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((value) => value - 1)}
                    className="rounded-xl border border-line bg-bg-raised px-4 py-2 text-sm font-semibold text-ink-200 transition-[background-color,border-color,color] duration-200 hover:border-cyan-400/40 hover:text-ink-100"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (isLast ? finish() : setStep((value) => value + 1))}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-bg-base shadow-glow-amber transition-[filter,transform,opacity] duration-200 hover:brightness-110 active:scale-95"
                >
                  {isLast ? 'Enter Base' : 'Next'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
