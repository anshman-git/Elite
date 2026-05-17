import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, SlidersHorizontal } from 'lucide-react';
import { watchQuizzes, submitAttempt, watchSubjects, watchUserAttempts } from '../firebase';
import { useApp } from '../context/useApp';
import { Button, Card, EmptyState } from '../components/ui';
import { getFriendlyFirebaseError } from '../firebase';
import { classNames, confirmLeaveQuiz, getQuestionId, isCompletedAttempt, setQuizInProgress } from '../utils';

export default function Quizzes({ notify }) {
  const { user, notify: globalNotify } = useApp();
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState('All');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(25 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState([]);

  const filtered = useMemo(
    () => {
      if (subject === 'All') return quizzes.filter(q => q.published !== false); // Only show published quizzes
      return quizzes.filter((quiz) => (quiz.subject === subject || quiz.subject === 'All') && quiz.published !== false);
    },
    [quizzes, subject],
  );

  const questions = activeQuiz?.questions || [];
  const attemptedQuizIds = useMemo(
    () => new Set(attempts.filter(isCompletedAttempt).map((item) => item.quizId)),
    [attempts],
  );
  const isQuizAttempted = activeQuiz ? attemptedQuizIds.has(activeQuiz.id) : false;

  const handleSubmit = useCallback(async () => {
    const userId = user?.uid || user?.id;
    if (!userId || !activeQuiz) return;
    if (submitting) return;

    if (attemptedQuizIds.has(activeQuiz.id)) {
      globalNotify('You have already completed this quiz.');
      setSubmitted(true);
      setQuizInProgress(false);
      return;
    }

    setSubmitting(true);
    try {
      await submitAttempt(userId, activeQuiz.id, activeQuiz, answers);
      setSubmitted(true);
      setQuizInProgress(false);
      globalNotify('Quiz submitted successfully!');
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      if (error?.code === 'already-attempted') {
        setSubmitted(true);
        globalNotify(error.message);
      } else {
        globalNotify(getFriendlyFirebaseError(error) || error.message || 'Failed to submit quiz. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [user, activeQuiz, answers, globalNotify, attemptedQuizIds, submitting]);

  useEffect(() => {
    const unsubscribers = [];
    
    unsubscribers.push(watchQuizzes(setQuizzes, {
      onError: () => notify('Could not load quizzes from Firestore.'),
    }));
    
    unsubscribers.push(watchSubjects(setSubjects, {
      take: 50,
      onError: () => console.error('Could not load subjects.'),
    }));
    
    return () => unsubscribers.forEach(unsub => unsub?.());
  }, [notify]);

  useEffect(() => {
    if (!user?.uid) {
      setAttempts([]);
      return () => {};
    }

    return watchUserAttempts(user.uid, setAttempts, {
      take: 200,
      onError: () => console.error('Could not load user attempts.'),
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!activeQuiz || submitted) return undefined;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeQuiz, submitted, handleSubmit]);

  useEffect(() => {
    setQuizInProgress(Boolean(activeQuiz && !submitted));
    return () => {
      if (!activeQuiz) setQuizInProgress(false);
    };
  }, [activeQuiz, submitted]);

  useEffect(() => {
    if (!activeQuiz || submitted) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeQuiz, submitted]);

  const exitQuiz = useCallback(() => {
    if (!submitted && !confirmLeaveQuiz()) return;
    setQuizInProgress(false);
    setActiveQuiz(null);
    setAnswers({});
    setSubmitted(false);
  }, [submitted]);

  const score = questions.reduce((total, item, index) => total + (answers[getQuestionId(item, index)] === item.answer ? 1 : 0), 0);

  if (activeQuiz) {
    return (
      <div className="space-y-4">
        <Card className="sticky top-[84px] z-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{activeQuiz.subject}</p>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">{activeQuiz.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-black dark:bg-white/10">
                <Clock size={17} /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
              </span>
              <Button variant="secondary" onClick={exitQuiz}>
                Exit
              </Button>
            </div>
          </div>
        </Card>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CheckCircle2 className="text-blue-600" size={34} />
                <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Score: {score}/{questions.length}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Time taken: {((activeQuiz.timerMinutes || activeQuiz.duration || 25) * 60) - seconds}s. Review the correct answers below.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={exitQuiz}>Back to quizzes</Button>
                </div>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="space-y-3">
          {questions.map((item, index) => {
            const questionId = getQuestionId(item, index);
            return (
            <Card key={questionId}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Question {index + 1}</p>
              <h3 className="mt-2 font-black text-slate-950 dark:text-white">{item.question}</h3>
              {item.image || isImageUrl(item.question) ? (
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950">
          <img
            src={normalizeImageUrl(item.image || item.question)}
            alt={item.question && !isImageUrl(item.question) ? item.question : 'Quiz image'}
            className="mx-auto max-h-[300px] w-full max-w-full object-contain"
          />
        </div>
      ) : null}
      <div className="mt-4 grid gap-2">
                {(item.options || []).map((option, optionIndex) => {
                  const optionValue = typeof option === 'object'
                    ? option.value || option.text || option.label || option.image || ''
                    : option;
                  const picked = answers[questionId] === optionValue;
                  const revealCorrect = submitted && optionValue === item.answer;
                  const revealWrong = submitted && picked && optionValue !== item.answer;
                  return (
                    <button
                      key={`${questionId}-${optionIndex}`}
                      disabled={submitted}
                      onClick={() => setAnswers((current) => ({ ...current, [questionId]: optionValue }))}
                      className={classNames(
                        'min-h-12 rounded-2xl border px-4 text-left text-sm font-bold transition',
                        picked ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10' : 'border-slate-200 dark:border-white/10',
                        revealCorrect && 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10',
                        revealWrong && 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10',
                      )}
                    >
                      {isImageUrl(optionValue) ? (
                        <img
                          src={normalizeImageUrl(optionValue)}
                          alt={`Option ${optionIndex + 1}`}
                          className="max-h-28 w-full object-contain"
                        />
                      ) : (
                        optionValue
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
            );
          })}
        </div>
        {!submitted ? (
          <Button variant="accent" onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'Submitting...' : 'Submit quiz'}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Quiz arena</p>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">Subject-wise sprints</h2>
        </div>
        <SlidersHorizontal className="text-slate-400" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', ...subjects.map((item) => item.name)].map((item) => (
          <button
            key={item}
            onClick={() => setSubject(item)}
            className={classNames(
              'min-h-10 shrink-0 rounded-xl px-4 text-sm font-bold transition',
              subject === item ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((quiz) => {
            const quizAttempted = attemptedQuizIds.has(quiz.id);
            return (
              <Card key={quiz.id} interactive>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">{quiz.subject}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950 dark:text-white">{quiz.title}</h3>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Badge label="MCQs" value={quiz.questions?.length || 0} />
                  <Badge label="Timer" value={`${quiz.timerMinutes || quiz.duration || 25}m`} />
                  <Badge label="Daily" value={(quiz.dailyQuiz ?? quiz.isDaily) ? 'Yes' : 'No'} />
                </div>
                <Button
                  variant="accent"
                  className="mt-4 w-full"
                  disabled={quizAttempted}
                  onClick={() => {
                    if (!confirmLeaveQuiz()) return;
                    setActiveQuiz(quiz);
                    setAnswers({});
                    setSeconds((quiz.timerMinutes || quiz.duration || 25) * 60);
                    setSubmitted(false);
                    setQuizInProgress(true);
                  }}
                >
                  {quizAttempted ? 'Already attempted' : 'Start quiz'}
                </Button>
                {quizAttempted ? (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">You already attempted this quiz. Reattempts are disabled to keep scoring fair.</p>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No quizzes found" body="Try another subject filter." />
      )}
    </div>
  );
}

function normalizeImageUrl(value) {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();

  const driveFileMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/([\w-]+)|open\?id=([\w-]+))/);
  const driveId = driveFileMatch?.[1] || driveFileMatch?.[2];
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
  }

  if (/dropbox\.com\//i.test(trimmed)) {
    return trimmed.replace('?dl=0', '?raw=1').replace('?dl=1', '?raw=1');
  }

  return trimmed;
}

function isImageUrl(value) {
  if (!value || typeof value !== 'string') return false;
  const normalized = value.trim();
  const imageExtension = /\.(png|jpe?g|gif|webp|bmp|svg)(?:\?.*)?$/i;
  return imageExtension.test(normalized)
    || /drive\.google\.com\//i.test(normalized)
    || /dropbox\.com\//i.test(normalized)
    || /githubusercontent\.com\//i.test(normalized);
}

function Badge({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
