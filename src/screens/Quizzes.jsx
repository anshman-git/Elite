import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Flame,
  SlidersHorizontal,
  Star,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import { watchQuizzes, submitAttempt, watchSubjects, watchUserAttempts } from '../firebase';
import { useApp } from '../context/useApp';
import { Button, EmptyState } from '../components/ui';
import { QuizArena } from '../components/quiz/QuizArena';
import { getFriendlyFirebaseError } from '../firebase';
import { classNames, confirmLeaveQuiz, getQuestionId, isCompletedAttempt, setQuizInProgress } from '../utils';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function normalizeImageUrl(value) {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();
  const driveFileMatch = trimmed.match(
    /drive\.google\.com\/(?:file\/d\/([\w-]+)|open\?id=([\w-]+)|uc\?.*id=([\w-]+))/
  );
  const driveId = driveFileMatch?.[1] || driveFileMatch?.[2] || driveFileMatch?.[3];
  if (driveId) return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
  if (/dropbox\.com\//i.test(trimmed)) return trimmed.replace('?dl=0', '?raw=1').replace('?dl=1', '?raw=1');
  return trimmed;
}

function isImageUrl(value) {
  if (!value || typeof value !== 'string') return false;
  const normalized = value.trim();
  return (
    /\.(png|jpe?g|gif|webp|bmp|svg)(?:\?.*)?$/i.test(normalized) ||
    /drive\.google\.com\//i.test(normalized) ||
    /dropbox\.com\//i.test(normalized) ||
    /githubusercontent\.com\//i.test(normalized)
  );
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

/* ─── sub-components ────────────────────────────────────────────────────────── */
function QuizStatusDot({ status }) {
  const cls = {
    correct: 'bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.45)]',
    wrong: 'bg-rose-500',
    answered: 'bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.4)]',
    unanswered: 'bg-slate-700',
  }[status] || 'bg-slate-700';
  return <span className={`block h-2.5 w-2.5 rounded-full ${cls}`} />;
}

function Badge({ label, value, icon }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 px-3 py-2.5 text-center">
      {icon && <span className="text-cyan-400">{icon}</span>}
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-sm font-black text-white">{value}</p>
    </div>
  );
}

/* ─── Quiz workspace (active quiz) ─────────────────────────────────────────── */
function QuizWorkspace({ activeQuiz, answers, setAnswers, submitted, submitting, seconds, handleSubmit, exitQuiz, showConfetti, playSuccessTone }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const questions = activeQuiz?.questions || [];
  const score = questions.reduce((t, item, i) => t + (answers[getQuestionId(item, i)] === item.answer ? 1 : 0), 0);
  const answeredCount = questions.filter((item, i) => answers[getQuestionId(item, i)]).length;
  const progressPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const estimatedXp = score * 10 + (questions.length > 0 && score === questions.length ? 20 : 0);
  const timeWarning = seconds < 120;
  const totalSeconds = (activeQuiz.timerMinutes || activeQuiz.duration || 25) * 60;

  const getStatus = useCallback((item, idx) => {
    const qid = getQuestionId(item, idx);
    const ans = answers[qid];
    if (!ans) return 'unanswered';
    if (submitted) return ans === item.answer ? 'correct' : 'wrong';
    return 'answered';
  }, [answers, submitted]);

  const currentItem = questions[activeIndex];
  const questionId = currentItem ? getQuestionId(currentItem, activeIndex) : null;
  const answeredValue = questionId ? answers[questionId] : null;
  const currentOptions = (currentItem?.options || []).map((option, optIdx) => {
    const value = typeof option === 'object'
      ? option.value || option.text || option.label || option.image || ''
      : option;
    return {
      value,
      label: OPTION_LABELS[optIdx] || String(optIdx + 1),
      isImage: isImageUrl(value),
    };
  });

  const handleChooseAnswer = useCallback((value, isCorrect) => {
    if (!questionId || answeredValue || submitted) return;
    setAnswers((current) => ({ ...current, [questionId]: value }));
    if (isCorrect) {
      setCombo((current) => current + 1);
      playSuccessTone();
    } else {
      setCombo(0);
    }
  }, [answeredValue, playSuccessTone, questionId, setAnswers, submitted]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Confetti */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {[...Array(28)].map((_, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], y: [-10, -320], x: [(i % 7 - 3) * 40], scale: [0, 1.2, 0.6] }}
              transition={{ duration: 1.8 + (i % 3) * 0.3, ease: 'easeOut', delay: i * 0.04 }}
              className="absolute h-3 w-3 rounded-full"
              style={{
                left: `${8 + (i * 3.2) % 85}%`,
                top: '90%',
                background: ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f472b6'][i % 5],
              }}
            />
          ))}
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{activeQuiz.subject}</p>
            <h2 className="truncate text-lg font-black text-white">{activeQuiz.title}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* Progress */}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-400 to-amber-400"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: progressPercent / 100 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-bold text-slate-400">{answeredCount}/{questions.length}</span>
            </div>
            {/* Timer */}
            <div className={classNames(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black',
              timeWarning ? 'animate-pulse bg-rose-500/20 text-rose-300' : 'bg-white/10 text-white'
            )}>
              <Clock size={14} />
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
            </div>
            {!submitted && (
              <Button variant="accent" onClick={handleSubmit} disabled={submitting} className="hidden sm:block">
                {submitting ? 'Submitting…' : 'Submit'}
              </Button>
            )}
            <Button variant="secondary" onClick={exitQuiz}>Exit</Button>
          </div>
        </div>
      </div>

      {/* Body: split layout */}
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-0">

        {/* LEFT — question navigator */}
        <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r border-white/10 p-4 lg:flex">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Questions</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {questions.map((item, idx) => {
                const status = getStatus(item, idx);
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={classNames(
                      'flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black transition-[background-color,color,box-shadow,transform] duration-200',
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_16px_-4px_rgba(34,211,238,0.7)]'
                        : status === 'correct' ? 'bg-emerald-500/20 text-emerald-300'
                        : status === 'wrong' ? 'bg-rose-500/20 text-rose-300'
                        : status === 'answered' ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 rounded-2xl bg-white/5 p-3 text-[11px] font-semibold text-slate-400">
            <div className="flex items-center gap-2"><QuizStatusDot status="answered" /> Answered</div>
            <div className="flex items-center gap-2"><QuizStatusDot status="unanswered" /> Not visited</div>
            {submitted && <div className="flex items-center gap-2"><QuizStatusDot status="correct" /> Correct</div>}
            {submitted && <div className="flex items-center gap-2"><QuizStatusDot status="wrong" /> Wrong</div>}
          </div>

          {/* Score summary on submit */}
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-center"
            >
              <Trophy className="mx-auto text-cyan-300" size={26} />
              <p className="mt-2 text-2xl font-black text-white">{score}/{questions.length}</p>
              <p className="text-xs text-slate-400">+{estimatedXp} XP</p>
            </motion.div>
          )}

          {!submitted && (
            <Button variant="accent" onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? 'Submitting…' : 'Submit Quiz'}
            </Button>
          )}
        </aside>

        {/* RIGHT — question workspace */}
        <main className="flex-1 p-4 lg:p-6">
          <AnimatePresence mode="wait">
            {submitted ? (
              /* Result card */
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto max-w-lg"
              >
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center shadow-2xl">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400/10">
                    {score === questions.length
                      ? <Trophy size={40} className="text-yellow-400" />
                      : score > questions.length / 2
                        ? <CheckCircle2 size={40} className="text-emerald-400" />
                        : <Star size={40} className="text-slate-400" />}
                  </div>
                  <h3 className="text-3xl font-black text-white">
                    {score === questions.length ? 'Perfect Score! 🎉' : score > questions.length / 2 ? 'Well done!' : 'Keep Practicing!'}
                  </h3>
                  <p className="mt-1 text-slate-400">
                    You scored <span className="font-black text-cyan-300">{score}</span> out of{' '}
                    <span className="font-black text-white">{questions.length}</span>
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <Badge label="Score" value={`${score}/${questions.length}`} icon={<CheckCircle2 size={14} />} />
                    <Badge label="XP Earned" value={`+${estimatedXp}`} icon={<Zap size={14} />} />
                    <Badge label="Accuracy" value={`${questions.length ? Math.round((score / questions.length) * 100) : 0}%`} icon={<Flame size={14} />} />
                  </div>
                  <Button onClick={exitQuiz} className="mt-6 w-full">Back to Quizzes</Button>
                </div>
                {/* Review each question */}
                <div className="mt-6 space-y-4">
                  {questions.map((item, idx) => {
                    const qid = getQuestionId(item, idx);
                    const userAns = answers[qid];
                    const correct = userAns === item.answer;
                    return (
                      <div key={qid} className={classNames(
                        'rounded-2xl border p-4',
                        correct ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'
                      )}>
                        <div className="flex items-start gap-3">
                          {correct
                            ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                            : <XCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />}
                          <div>
                            <p className="font-bold text-white">{item.question}</p>
                            {!correct && (
                              <p className="mt-1 text-sm text-slate-400">
                                Correct: <span className="font-bold text-emerald-400">{item.answer}</span>
                                {userAns && <> · Your answer: <span className="font-bold text-rose-400">{userAns}</span></>}
                              </p>
                            )}
                            {item.explanation && (
                              <p className="mt-2 text-sm text-slate-500">{item.explanation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : currentItem ? (
              /* Single question rendered by QuizArena (presentation only) */
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-2xl"
              >
                <QuizArena
                  question={currentItem.question}
                  questionImage={currentItem.image}
                  options={currentOptions}
                  correctAnswer={currentItem.answer}
                  selectedAnswer={answeredValue}
                  locked={submitted}
                  questionNumber={activeIndex + 1}
                  totalQuestions={questions.length}
                  seconds={seconds}
                  totalSeconds={totalSeconds}
                  combo={combo}
                  explanation={currentItem.explanation}
                  isImageUrl={isImageUrl}
                  normalizeImageUrl={normalizeImageUrl}
                  onChoose={handleChooseAnswer}
                />
                {/* Prev / Next navigation stays with QuizWorkspace */}
                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="secondary"
                    onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                    disabled={activeIndex === 0}
                  >
                    ← Prev
                  </Button>
                  {activeIndex < questions.length - 1 ? (
                    <Button
                      variant="secondary"
                      onClick={() => setActiveIndex((i) => i + 1)}
                    >
                      Next →
                    </Button>
                  ) : (
                    !submitted && (
                      <Button variant="accent" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Submitting…' : 'Submit Quiz'}
                      </Button>
                    )
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ─── Quiz list card ────────────────────────────────────────────────────────── */
function QuizCard({ quiz, attempted, onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={classNames(
        'group relative overflow-hidden rounded-3xl border bg-slate-900/80 p-5 transition-[background-color,border-color,box-shadow,transform,opacity] duration-300',
        attempted
          ? 'border-white/5'
          : 'border-white/10 hover:border-cyan-500/40 hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.3)]',
      )}
    >
      {/* Gradient accent top-right */}
      {!attempted && (
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl transition-[background-color,opacity,transform] duration-500 group-hover:bg-cyan-500/20" />
      )}
      <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{quiz.subject}</p>
      <h3 className="mt-1.5 text-base font-black text-white">{quiz.title}</h3>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Badge label="MCQs" value={quiz.questions?.length || 0} />
        <Badge label="Timer" value={`${quiz.timerMinutes || quiz.duration || 25}m`} icon={<Clock size={12} />} />
        <Badge label="Daily" value={(quiz.dailyQuiz ?? quiz.isDaily) ? 'Yes' : 'No'} icon={(quiz.dailyQuiz ?? quiz.isDaily) ? <Zap size={12} /> : null} />
      </div>
      <Button
        variant={attempted ? 'secondary' : 'accent'}
        className="mt-4 w-full"
        disabled={attempted}
        onClick={onStart}
      >
        {attempted ? '✓ Attempted' : 'Start Quiz →'}
      </Button>
      {attempted && (
        <p className="mt-2 text-center text-[11px] text-slate-600">Reattempts disabled for fair scoring</p>
      )}
    </motion.div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────────── */
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
  const [showConfetti, setShowConfetti] = useState(false);

  const filtered = useMemo(
    () => {
      if (subject === 'All') return quizzes.filter((q) => q.published !== false);
      return quizzes.filter((quiz) => (quiz.subject === subject || quiz.subject === 'All') && quiz.published !== false);
    },
    [quizzes, subject],
  );

  const questions = useMemo(() => activeQuiz?.questions || [], [activeQuiz]);
  const attemptedQuizIds = useMemo(
    () => new Set(attempts.filter(isCompletedAttempt).map((item) => item.quizId)),
    [attempts],
  );

  const playSuccessTone = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(520, audioContext.currentTime);
      gain.gain.setValueAtTime(0.08, audioContext.currentTime);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch (error) {
      console.warn('Audio feedback not available', error);
    }
  }, []);

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
      const finalScore = questions.reduce((total, item, index) => total + (answers[getQuestionId(item, index)] === item.answer ? 1 : 0), 0);
      if (questions.length > 0 && finalScore === questions.length) {
        setShowConfetti(true);
        playSuccessTone();
        setTimeout(() => setShowConfetti(false), 4200);
      }
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
  }, [user, activeQuiz, answers, globalNotify, attemptedQuizIds, submitting, questions, playSuccessTone]);

  useEffect(() => {
    const unsubscribers = [];
    unsubscribers.push(watchQuizzes(setQuizzes, { onError: () => notify('Could not load quizzes from Firestore.') }));
    unsubscribers.push(watchSubjects(setSubjects, { take: 50, onError: () => console.error('Could not load subjects.') }));
    return () => unsubscribers.forEach((unsub) => unsub?.());
  }, [notify]);

  useEffect(() => {
    if (!user?.uid) return;
    return watchUserAttempts(user.uid, setAttempts, { take: 200, onError: () => console.error('Could not load user attempts.') });
  }, [user?.uid]);

  useEffect(() => {
    if (!activeQuiz || submitted) return undefined;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) { handleSubmit(); return 0; }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeQuiz, submitted, handleSubmit]);

  useEffect(() => {
    setQuizInProgress(Boolean(activeQuiz && !submitted));
    return () => { if (!activeQuiz) setQuizInProgress(false); };
  }, [activeQuiz, submitted]);

  useEffect(() => {
    if (!activeQuiz || submitted) return undefined;
    const handleBeforeUnload = (event) => { event.preventDefault(); event.returnValue = ''; };
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

  /* ── Active quiz view ── */
  if (activeQuiz) {
    return (
      <QuizWorkspace
        activeQuiz={activeQuiz}
        answers={answers}
        setAnswers={setAnswers}
        submitted={submitted}
        submitting={submitting}
        seconds={seconds}
        handleSubmit={handleSubmit}
        exitQuiz={exitQuiz}
        showConfetti={showConfetti}
        playSuccessTone={playSuccessTone}
      />
    );
  }

  /* ── Quiz list view ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Quiz Arena</p>
          <h2 className="text-3xl font-black text-white">Subject-wise Sprints</h2>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} quiz{filtered.length !== 1 ? 'zes' : ''} available</p>
        </div>
        <SlidersHorizontal className="text-slate-600" />
      </div>

      {/* Subject filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', ...subjects.map((item) => item.name)].map((item) => (
          <motion.button
            key={item}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSubject(item)}
            className={classNames(
              'min-h-9 shrink-0 rounded-full px-4 text-sm font-bold transition-[background-color,color,box-shadow,transform] duration-200',
              subject === item
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_16px_-4px_rgba(34,211,238,0.6)]'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white',
            )}
          >
            {item}
          </motion.button>
        ))}
      </div>

      {/* Quiz grid */}
      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              attempted={attemptedQuizIds.has(quiz.id)}
              onStart={() => {
                if (!confirmLeaveQuiz()) return;
                setActiveQuiz(quiz);
                setAnswers({});
                setSeconds((quiz.timerMinutes || quiz.duration || 25) * 60);
                setSubmitted(false);
                setQuizInProgress(true);
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No quizzes found" body="Try a different subject filter or check back later." />
      )}

      {/* Stats summary bar */}
      <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-slate-900/60 p-4 sm:grid-cols-4">
        <div className="text-center">
          <p className="text-2xl font-black text-white">{filtered.length}</p>
          <p className="text-xs text-slate-500">Available</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-cyan-300">{attemptedQuizIds.size}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-amber-300">{filtered.length - [...attemptedQuizIds].filter(id => filtered.some(q => q.id === id)).length}</p>
          <p className="text-xs text-slate-500">Remaining</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-emerald-300">
            {filtered.length ? Math.round(([...attemptedQuizIds].filter(id => filtered.some(q => q.id === id)).length / filtered.length) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-500">Completion</p>
        </div>
      </div>
    </div>
  );
}
