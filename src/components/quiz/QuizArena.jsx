import { AnimatePresence, motion } from 'framer-motion';
import { Check, Flame, ImageIcon, X, Zap } from 'lucide-react';
import { fireConfetti } from '../motion/ConfettiBurst';
import { useReducedMotion } from '../motion/useReducedMotion';

function shakeScreen() {
  if (typeof document === 'undefined' || !document.body?.animate) return;
  document.body.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 200 },
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

  const motionProps =
    !reduceMotion && !selectedAnswer
      ? { whileHover: { y: -2 }, whileTap: { scale: 0.98 } }
      : {};

  const progressTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.9, ease: 'linear' };

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
    <div className="cmd-card p-4 sm:p-6 lg:p-8 grid-bg relative overflow-hidden">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
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
                <Flame className="h-3 w-3" /> {combo}x COMBO
              </motion.span>
            )}
          </AnimatePresence>
          <span className="inline-flex items-center gap-1 font-mono text-cyan-400 text-xs sm:text-sm">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 10 XP
          </span>
        </div>
      </div>

      {/* Question text */}
      <motion.h2
        key={question}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-lg sm:text-h1 text-ink-100 mb-5 leading-snug"
      >
        {question}
      </motion.h2>

      {/* Optional question image */}
      {questionImage || isImageUrl(question) ? (
        <div className="mb-5 overflow-hidden rounded-xl border border-line bg-bg-inset p-3">
          <img
            src={normalizeImageUrl(questionImage || question)}
            alt="Question visual"
            className="mx-auto max-h-60 w-full object-contain"
          />
        </div>
      ) : null}

      {/* Options grid — single column on mobile, two on sm+ */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {options.map((option, index) => {
          const isPicked = selectedAnswer === option.value;
          const isCorrect = option.value === correctAnswer;
          const state =
            !selectedAnswer
              ? 'idle'
              : isPicked && isCorrect
              ? 'right'
              : isPicked && !isCorrect
              ? 'wrong'
              : isCorrect
              ? 'reveal'
              : 'idle';

          return (
            <motion.button
              key={`${option.value}-${index}`}
              onClick={(e) => choose(option, e)}
              data-testid={`quiz-option-${index}`}
              {...motionProps}
              className={[
                // Base layout — tighter padding on mobile
                'group relative flex items-center justify-between gap-2 p-3 sm:p-4 rounded-xl border text-left w-full',
                'transition-[background-color,border-color,color] duration-200',
                state === 'idle' &&
                  'bg-bg-surface border-line hover:border-amber-500/50 hover:bg-bg-raised',
                state === 'right'  && 'bg-success/10 border-success text-success',
                state === 'wrong'  && 'bg-danger/10 border-danger text-danger',
                state === 'reveal' && 'bg-success/5 border-success/40 text-success',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Label letter + text/image */}
              <span className="flex min-w-0 items-center gap-2 sm:gap-3 font-medium">
                <span className="grid h-6 w-6 sm:h-7 sm:w-7 shrink-0 place-items-center rounded-lg border border-line bg-bg-inset font-mono text-xs text-ink-400">
                  {option.label}
                </span>
                {option.isImage ? (
                  <span className="flex min-w-0 items-center gap-2">
                    <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <img
                      src={normalizeImageUrl(option.value)}
                      alt={`Option ${index + 1}`}
                      className="max-h-20 sm:max-h-24 w-full object-contain"
                    />
                  </span>
                ) : (
                  <span className="min-w-0 break-words text-sm sm:text-base leading-snug">
                    {option.value}
                  </span>
                )}
              </span>

              {/* Correct / wrong icon */}
              <AnimatePresence>
                {state === 'right' || state === 'reveal' ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="shrink-0"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.span>
                ) : state === 'wrong' ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {selectedAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mt-4 rounded-xl border border-line bg-bg-inset p-4"
          >
            <p
              className={`text-sm font-bold ${
                selectedAnswer === correctAnswer ? 'text-success' : 'text-danger'
              }`}
            >
              {selectedAnswer === correctAnswer
                ? 'Correct. Keep the combo alive.'
                : `Correct answer: ${correctAnswer}`}
            </p>
            {explanation && (
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{explanation}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer progress bar — contained within card via overflow-hidden on card */}
      <div className="absolute left-0 bottom-0 h-1 w-full bg-bg-inset rounded-b-xl overflow-hidden">
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
