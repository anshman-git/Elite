import { AnimatePresence, motion } from 'framer-motion';
import { Check, Flame, ImageIcon, X, Zap } from 'lucide-react';
import { fireConfetti } from '../motion/ConfettiBurst';
import { useReducedMotion } from '../motion/useReducedMotion';

function shakeScreen() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(100);
  }
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

  const timerScale = totalSeconds
    ? Math.max(0, Math.min(1, seconds / totalSeconds))
    : 0;

  const motionProps =
    !reduceMotion && !locked
      ? {
          whileHover: { scale: 1.01 },
          whileTap: { scale: 0.98 },
        }
      : {};

  const progressTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.9, ease: 'linear' };

  const choose = (option, event) => {
    if (locked) return;
    onChoose(option.value);
  };

  return (
    <div className="cmd-card grid-bg relative isolate p-4 sm:p-6 lg:p-8">
      {/* Content Wrapper */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs tracking-[0.3em] text-amber-500">
            Q {questionNumber} / {totalQuestions}
          </span>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {combo >= 3 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.82, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-bold text-amber-400"
                >
                  <Flame className="h-3 w-3" />
                  {combo}x COMBO
                </motion.span>
              )}
            </AnimatePresence>

            <span className="inline-flex items-center gap-1 font-mono text-xs text-cyan-400 sm:text-sm">
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              10 XP
            </span>
          </div>
        </div>

        {/* Question */}
        <motion.h2
          key={question}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 font-display text-lg leading-snug text-ink-100 sm:text-h1"
        >
          {question}
        </motion.h2>

        {/* Question Image */}
        {questionImage || isImageUrl(question) ? (
          <div className="mb-5 rounded-xl border border-line p-3"
               style={{ backgroundColor: 'rgb(var(--color-bg-inset))' }}>
            <img
              src={normalizeImageUrl(questionImage || question)}
              alt="Question visual"
              className="mx-auto max-h-60 w-full object-contain"
            />
          </div>
        ) : null}

        {/* Options */}
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
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
                onClick={(e) => choose(option, e)}
                data-testid={`quiz-option-${index}`}
                {...motionProps}
                className={[
                  'transform-gpu backface-hidden group relative flex w-full min-w-0 items-start justify-between gap-2 overflow-hidden rounded-xl border p-3 text-left transition-[background-color,border-color,color] duration-200 sm:p-4',

                  state === 'idle' &&
                    'border-line hover:border-amber-500/50',

                  state === 'selected' &&
                    'border-amber-500/50 bg-amber-500/10',

                  state === 'right' &&
                    'border-green-600 bg-green-600 text-white',

                  state === 'wrong' &&
                    'border-red-600 bg-red-600 text-white',

                  state === 'reveal' &&
                    'border-green-600 bg-green-600 text-white',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={state === 'idle' ? { backgroundColor: 'rgb(var(--color-bg-surface))' } : undefined}
              >
                {/* Option Content */}
                <span className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 font-medium">
                  {/* Option Label */}
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-line font-mono text-xs text-ink-400 sm:h-7 sm:w-7"
                        style={{ backgroundColor: 'rgb(var(--color-bg-inset))' }}>
                    {option.label}
                  </span>

                  {/* Image Option */}
                  {option.isImage ? (
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <ImageIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

                      <img
                        src={normalizeImageUrl(option.value)}
                        alt={`Option ${index + 1}`}
                        className="max-h-20 max-w-full w-auto object-contain will-change-auto sm:max-h-24"
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
                      className="shrink-0"
                    >
                      <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                    </motion.span>
                  ) : state === 'wrong' ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-4 rounded-xl border border-line p-4"
              style={{ backgroundColor: 'rgb(var(--color-bg-inset))' }}
            >
              <p
                className={`text-sm font-bold ${
                  selectedAnswer === correctAnswer
                    ? 'text-success'
                    : 'text-danger'
                }`}
              >
                {selectedAnswer === correctAnswer
                  ? 'Correct. Keep the combo alive.'
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

      {/* Timer Progress */}
      <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden rounded-b-xl"
           style={{ backgroundColor: 'rgb(var(--color-bg-inset))' }}>
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