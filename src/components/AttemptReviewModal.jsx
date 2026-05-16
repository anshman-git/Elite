import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { watchDocument } from '../firebase';
import { classNames } from '../utils';
import { Button, Card, LoadingState } from './ui';

export default function AttemptReviewModal({ attemptId, onClose }) {
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) {
      setAttempt(null);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    return watchDocument('attempts', attemptId, (doc) => {
      setAttempt(doc);
      setLoading(false);
    }, {
      onError: () => setLoading(false),
    });
  }, [attemptId]);

  const reviewItems = useMemo(() => buildReviewItems(attempt), [attempt]);

  return (
    <AnimatePresence>
      {attemptId ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="mx-auto flex h-full max-w-3xl flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <Card className="flex max-h-full flex-col overflow-hidden p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Review answers</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                    {attempt?.quizTitle || attempt?.subject || 'Quiz attempt'}
                  </h3>
                  {attempt ? (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Score: {attempt.score}/{attempt.total} ({attempt.accuracy || 0}%)
                    </p>
                  ) : null}
                </div>
                <Button variant="ghost" className="h-10 w-10 shrink-0 p-0" onClick={onClose}>
                  <X size={18} />
                </Button>
              </div>

              <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
                {loading ? (
                  <LoadingState />
                ) : reviewItems.length ? (
                  reviewItems.map((item, index) => {
                    const isCorrect = item.selectedAnswer === item.correctAnswer;
                    return (
                      <Card key={item.questionId || index} className="p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          Question {index + 1}
                        </p>
                        <h4 className="mt-2 font-black text-slate-950 dark:text-white">{item.question}</h4>

                        <div className="mt-4 space-y-2 text-sm">
                          <ReviewRow
                            label="Your answer"
                            value={item.selectedAnswer || 'Not answered'}
                            tone={isCorrect ? 'correct' : 'wrong'}
                            icon={isCorrect ? CheckCircle2 : XCircle}
                          />
                          {!isCorrect ? (
                            <ReviewRow label="Correct answer" value={item.correctAnswer} tone="correct" icon={CheckCircle2} />
                          ) : null}
                        </div>

                        {item.options?.length ? (
                          <div className="mt-4 grid gap-2">
                            {item.options.map((option) => {
                              const picked = item.selectedAnswer === option;
                              const isAnswer = item.correctAnswer === option;
                              return (
                                <div
                                  key={option}
                                  className={classNames(
                                    'rounded-2xl border px-4 py-3 text-sm font-bold',
                                    isAnswer && 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10',
                                    picked && !isAnswer && 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10',
                                    !picked && !isAnswer && 'border-slate-200 dark:border-white/10',
                                  )}
                                >
                                  {option}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </Card>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Review data is not available for this attempt.
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ReviewRow({ label, value, tone, icon: Icon }) {
  const toneClass = tone === 'correct'
    ? 'text-emerald-700 dark:text-emerald-300'
    : 'text-rose-700 dark:text-rose-300';

  return (
    <div className={classNames('flex items-start gap-2 font-semibold', toneClass)}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span><span className="font-bold">{label}:</span> {value}</span>
    </div>
  );
}

function buildReviewItems(attempt) {
  if (!attempt) return [];

  if (Array.isArray(attempt.reviewItems) && attempt.reviewItems.length) {
    return attempt.reviewItems;
  }

  const questions = attempt.questions || [];
  const selectedAnswers = attempt.selectedAnswers || [];
  const correctAnswers = attempt.correctAnswers || [];
  const legacyAnswers = attempt.answers || {};

  return questions.map((question, index) => {
    const questionId = `question-${index}`;
    const selectedAnswer = selectedAnswers[index] ?? legacyAnswers[questionId] ?? null;
    const correctAnswer = correctAnswers[index] ?? null;
    return {
      questionId,
      question,
      options: [],
      selectedAnswer,
      correctAnswer,
    };
  });
}
