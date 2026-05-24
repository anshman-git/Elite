import { AnimatePresence, motion } from 'framer-motion';
import { Check, ImageIcon, X, Zap } from 'lucide-react';
import { fireConfetti } from '../motion/ConfettiBurst';
import { useReducedMotion } from '../motion/useReducedMotion';

function shakeScreen() {
  if (typeof document === 'undefined' || !document.body?.animate) return;
  document.body.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 220 },
  );
}

export function QuizArena({
  question,
  questionImage,
  options,
  correctAnswer,
  selectedAnswer,
  locked = false,
  questionNumber,
  totalQuestions,
  seconds,
  totalSeconds,
  combo = 0,
  explanation,
  isImageUrl,
  normalizeImageUrl,
  onChoose,
}) {
  const reduceMotion = useReducedMotion();
  const timerScale = totalSeconds ? Math.max(0, Math.min(1, seconds / totalSeconds)) : 0;
  const motionProps = !reduceMotion && !selectedAnswer ? {
    whileHover: { y: -2 },
    whileTap: { scale: 0.98 },
  } : {};
  const progressTransition = reduceMotion ? { duration: 0 } : { duration: 0.9, ease: 'linear' };

  const choose = (option, event) => {
    if (locked || selectedAnswer) return;

    const isCorrect = option.value === correctAnswer;
    if (isCorrect && event?.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      fireConfetti({
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      });
    } else if (!isCorrect) {
      shakeScreen();
    }

    onChoose(option.value, isCorrect);
  };

  return (
    <div className="cmd-card p-6 sm:p-8 grid-bg relative">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <span className="font-mono text-xs tracking-[0.3em] text-amber-500">
          QUESTION {questionNumber} / {totalQuestions}
        </span>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {combo >= 3 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.82, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-xs font-bold text-amber-400 shadow-glow-amber"
              >
                🔥 {combo}x COMBO
              </motion.span>
            )}
          </AnimatePresence>
          <span className="inline-flex items-center gap-1 font-mono text-cyan-400 text-sm">
            <Zap className="w-3.5 h-3.5" /> 10 XP
          </span>
        </div>
      </div>

      <motion.h2
        key={question}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-h1 sm:text-display-lg text-ink-100 mb-6"
      >
        {question}
      </motion.h2>

      {questionImage || isImageUrl(question) ? (
        <div className="mb-6 overflow-hidden rounded-xl border border-line bg-bg-inset p-3">
          <img
            src={normalizeImageUrl(questionImage || question)}
            alt="Question visual"
            className="mx-auto max-h-72 w-full object-contain"
          />
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3">
        {options.map((option, index) => {
          const isPicked = selectedAnswer === option.value;
          const isCorrect = option.value === correctAnswer;
          const state =
            !selectedAnswer ? 'idle' :
              isPicked && isCorrect ? 'right' :
                isPicked && !isCorrect ? 'wrong' :
                  isCorrect ? 'reveal' : 'idle';

          return (
            <motion.button
              key={`${option.value}-${index}`}
              onClick={(event) => choose(option, event)}
              data-testid={`quiz-option-${index}`}
              {...motionProps}
              className={[
                'group relative flex items-center justify-between gap-3 p-5 rounded-xl border text-left',
                'transition-[background-color,border-color,color,transform,box-shadow] duration-200',
                state === 'idle' && 'bg-bg-surface border-line hover:border-amber-500/50 hover:bg-bg-raised',
                state === 'right' && 'bg-success/10 border-success text-success',
                state === 'wrong' && 'bg-danger/10 border-danger text-danger',
                state === 'reveal' && 'bg-success/5 border-success/40 text-success',
              ].filter(Boolean).join(' ')}
            >
              <span className="flex min-w-0 items-center gap-3 font-medium">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line bg-bg-inset font-mono text-xs text-ink-400">
                  {option.label}
                </span>
                {option.isImage ? (
                  <span className="flex min-w-0 items-center gap-2">
                    <ImageIcon className="h-4 w-4 shrink-0" />
                    <img src={normalizeImageUrl(option.value)} alt={`Option ${index + 1}`} className="max-h-24 w-full object-contain" />
                  </span>
                ) : (
                  <span className="min-w-0 break-words">{option.value}</span>
                )}
              </span>
              <AnimatePresence>
                {state === 'right' || state === 'reveal' ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="w-5 h-5" />
                  </motion.span>
                ) : state === 'wrong' ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <X className="w-5 h-5" />
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mt-5 rounded-xl border border-line bg-bg-inset p-4"
          >
            <p className={`text-sm font-bold ${selectedAnswer === correctAnswer ? 'text-success' : 'text-danger'}`}>
              {selectedAnswer === correctAnswer ? 'Correct. Keep the combo alive.' : `Correct answer: ${correctAnswer}`}
            </p>
            {explanation && <p className="mt-2 text-sm leading-relaxed text-ink-400">{explanation}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute left-0 bottom-0 h-1 w-full overflow-hidden rounded-full bg-bg-inset">
        <motion.div
          className="h-full origin-left rounded-full bg-amber-500"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: timerScale }}
          transition={progressTransition}
        />
      </div>
    </div>
  );
}
