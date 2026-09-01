import { AnimatePresence, motion } from 'framer-motion';
import { Check, Flame, ImageIcon, X, Zap } from 'lucide-react';
import { useReducedMotion } from '../motion/useReducedMotion';
import { classNames } from '../../utils';

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

  const timerScale = totalSeconds
    ? Math.max(0, Math.min(1, seconds / totalSeconds))
    : 0;

  const motionProps =
    !reduceMotion && !locked
      ? {
          whileHover: { scale: 1.008, y: -1 },
          whileTap: { scale: 0.98 },
        }
      : {};

  const progressTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.9, ease: 'linear' };

  const choose = (option) => {
    if (locked) return;
    onChoose(option.value);
  };

  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-line bg-bg-surface p-4 shadow-card sm:p-6 lg:p-8">
      {/* Content Wrapper */}
      <div className="relative z-10 pb-2">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold tracking-[0.25em] text-amber-500">
            Q {questionNumber} / {totalQuestions}
          </span>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {combo >= 3 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.82, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-bold text-amber-500"
                >
                  <Flame className="h-3 w-3 text-amber-500" />
                  {combo}x COMBO
                </motion.span>
              )}
            </AnimatePresence>

            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-cyan-500 dark:text-cyan-400 sm:text-sm">
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              10 XP
            </span>
          </div>
        </div>

        {/* Question */}
        <motion.h2
          key={question}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 font-display text-lg font-black leading-snug text-ink-100 sm:text-xl md:text-2xl"
        >
          {question}
        </motion.h2>

        {/* Question Image */}
        {questionImage || isImageUrl(question) ? (
          <div className="mb-5 overflow-hidden rounded-xl border border-line bg-bg-inset p-3">
            <img
              src={normalizeImageUrl(questionImage || question)}
              alt="Question visual"
              className="mx-auto max-h-60 w-full rounded-lg object-contain"
            />
          </div>
        ) : null}

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {options.map((option, index) => {
            const isAnswered = selectedAnswer === option.value;
            const isCorrect = option.value === correctAnswer;

            let state;
            if (!locked) {
              // During quiz: only show selection state
              state = isAnswered ? 'selected' : 'idle';
            } else {
              // After final submission: show correct/wrong state
              if (isAnswered && isCorrect) {
                state = 'right';
              } else if (isAnswered && !isCorrect) {
                state = 'wrong';
              } else if (isCorrect) {
                state = 'reveal';
              } else {
                state = 'idle';
              }
            }

            return (
              <motion.button
                key={`${option.value}-${index}`}
                onClick={() => choose(option)}
                data-testid={`quiz-option-${index}`}
                {...motionProps}
                className={classNames(
                  'group relative flex w-full min-w-0 items-start justify-between gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-200 sm:p-4',
                  state === 'idle' &&
                    'border-line bg-bg-raised/50 text-ink-100 hover:border-line-strong hover:bg-bg-raised hover:shadow-card',
                  state === 'selected' &&
                    'border-amber-500 bg-amber-500/10 text-ink-100 shadow-soft ring-1 ring-amber-500/40',
                  state === 'right' &&
                    'border-success/60 bg-success/15 text-ink-100 font-semibold',
                  state === 'wrong' &&
                    'border-danger/60 bg-danger/15 text-ink-100 font-semibold',
                  state === 'reveal' &&
                    'border-success/60 bg-success/15 text-ink-100 font-semibold',
                )}
              >
                {/* Option Content */}
                <span className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 font-medium">
                  {/* Option Label */}
                  <span
                    className={classNames(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-lg border font-mono text-xs font-bold transition-colors',
                      state === 'selected'
                        ? 'border-amber-500 bg-amber-500 text-amber-50'
                        : state === 'right' || state === 'reveal'
                          ? 'border-success bg-success text-white'
                          : state === 'wrong'
                            ? 'border-danger bg-danger text-white'
                            : 'border-line bg-bg-inset text-ink-400 group-hover:border-line-strong group-hover:text-ink-100',
                    )}
                  >
                    {option.label}
                  </span>

                  {/* Image Option */}
                  {option.isImage ? (
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <ImageIcon className="h-3.5 w-3.5 shrink-0 text-ink-400 sm:h-4 sm:w-4" />
                      <img
                        src={normalizeImageUrl(option.value)}
                        alt={`Option ${index + 1}`}
                        className="max-h-20 max-w-full w-auto rounded object-contain sm:max-h-24"
                      />
                    </span>
                  ) : (
                    /* Text Option */
                    <span className="block min-w-0 flex-1 break-words whitespace-normal text-sm leading-snug sm:text-base">
                      {option.value}
                    </span>
                  )}
                </span>

                {/* Status Icon */}
                <AnimatePresence>
                  {state === 'right' || state === 'reveal' ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="shrink-0 text-success"
                    >
                      <Check className="h-5 w-5" />
                    </motion.span>
                  ) : state === 'wrong' ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="shrink-0 text-danger"
                    >
                      <X className="h-5 w-5" />
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {locked && selectedAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 rounded-xl border border-line bg-bg-inset p-4"
            >
              <p
                className={classNames(
                  'text-sm font-bold',
                  selectedAnswer === correctAnswer ? 'text-success' : 'text-danger',
                )}
              >
                {selectedAnswer === correctAnswer
                  ? '✓ Correct! Keep the combo alive.'
                  : `Correct answer: ${correctAnswer}`}
              </p>

              {explanation && (
                <p className="mt-2 text-sm leading-relaxed text-ink-400">
                  {explanation}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timer Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1.5 w-full overflow-hidden bg-bg-inset">
        <motion.div
          className={classNames(
            'h-full origin-left rounded-full transition-colors duration-300',
            timerScale < 0.2 ? 'bg-danger' : timerScale < 0.4 ? 'bg-amber-400' : 'bg-amber-500',
          )}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: timerScale }}
          transition={progressTransition}
        />
      </div>
    </div>
  );
}