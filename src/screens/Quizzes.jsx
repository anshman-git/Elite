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
import { Button, EmptyState, Badge } from '../components/ui';
import { QuizArena } from '../components/quiz/QuizArena';
import { getFriendlyFirebaseError } from '../firebase';
import { ProgressRing } from '../components/InteractiveElements';
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
    correct: 'bg-success shadow-[0_0_8px_2px_rgba(52,211,153,0.35)]',
    wrong: 'bg-danger',
    answered: 'bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.35)]',
    unanswered: 'bg-bg-raised border border-line',
  }[status] || 'bg-bg-raised border border-line';
  return <span className={`block h-2.5 w-2.5 rounded-full ${cls}`} />;
}

function QuizMetadataBadge({ label, value, icon }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-line-subtle bg-bg-raised/60 px-3 py-2.5 text-center">
      {icon && <span className="text-cyan-500 dark:text-cyan-400">{icon}</span>}
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">{label}</p>
      <p className="text-sm font-black text-ink-100">{value}</p>
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

  const handleChooseAnswer = useCallback((value) => {
    if (!questionId || submitted) return;
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }, [questionId, submitted, setAnswers]);

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
                background: ['#22d3ee', '#a78bfa', '#34d399', '#ffa500', '#fb7185'][i % 5],
              }}
            />
          ))}
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-line bg-bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400">{activeQuiz.subject}</p>
            <h2 className="truncate text-lg font-black text-ink-100">{activeQuiz.title}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* Progress */}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-bg-inset">
                <motion.div
                  className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-400 to-amber-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: progressPercent / 100 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-bold text-ink-400">{answeredCount}/{questions.length}</span>
            </div>
            {/* Timer */}
            <div className={classNames(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-black transition-colors',
              timeWarning ? 'animate-pulse border-danger/30 bg-danger/15 text-danger' : 'border-line bg-bg-raised text-ink-100'
            )}>
              <Clock size={14} />
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
            </div>
            {!submitted && (
              <Button variant="primary" onClick={handleSubmit} disabled={submitting} className="hidden sm:inline-flex">
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
        <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r border-line bg-bg-surface/50 p-4 lg:flex">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Questions</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {questions.map((item, idx) => {
                const status = getStatus(item, idx);
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={classNames(
                      'flex h-10 w-10 items-center justify-center rounded-lg text-xs font-black transition-all duration-200 border',
                      isActive
                        ? 'border-amber-500 bg-amber-500 text-amber-50 shadow-soft ring-2 ring-amber-500/25'
                        : submitted
                          ? (status === 'correct'
                            ? 'border-success/40 bg-success/15 text-success font-bold'
                            : status === 'wrong'
                              ? 'border-danger/40 bg-danger/15 text-danger font-bold'
                              : status === 'answered'
                                ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 font-bold'
                                : 'border-line bg-bg-raised/70 text-ink-400')
                          : status === 'answered'
                            ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 font-bold'
                            : 'border-line bg-bg-raised/70 text-ink-400 hover:bg-bg-raised hover:text-ink-100 hover:border-line-strong',
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 rounded-xl border border-line-subtle bg-bg-raised/70 p-3 text-[11px] font-semibold text-ink-400">
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
              className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-4 text-center"
            >
              <Trophy className="mx-auto text-cyan-500 dark:text-cyan-400" size={26} />
              <p className="mt-2 text-2xl font-black text-ink-100">{score}/{questions.length}</p>
              <p className="text-xs font-semibold text-ink-400">+{estimatedXp} XP</p>
            </motion.div>
          )}

          {!submitted && (
            <Button variant="primary" onClick={handleSubmit} disabled={submitting} className="w-full">
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
                <div className="rounded-2xl border border-line bg-bg-surface p-6 text-center shadow-card sm:p-8">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
                    {score === questions.length
                      ? <Trophy size={40} className="text-amber-500" />
                      : score > questions.length / 2
                        ? <CheckCircle2 size={40} className="text-success" />
                        : <Star size={40} className="text-ink-400" />}
                  </div>
                  <h3 className="font-display text-2xl font-black text-ink-100 sm:text-3xl">
                    {score === questions.length ? 'Perfect Score! 🎉' : score > questions.length / 2 ? 'Well done!' : 'Keep Practicing!'}
                  </h3>
                  <p className="mt-1 text-ink-400">
                    You scored <span className="font-black text-cyan-500 dark:text-cyan-400">{score}</span> out of{' '}
                    <span className="font-black text-ink-100">{questions.length}</span>
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <Badge label="Score" value={`${score}/${questions.length}`} icon={<CheckCircle2 size={14} />} />
                    <Badge label="XP Earned" value={`+${estimatedXp}`} icon={<Zap size={14} />} />
                    <Badge label="Accuracy" value={`${questions.length ? Math.round((score / questions.length) * 100) : 0}%`} icon={<Flame size={14} />} />
                  </div>
                  <Button variant="primary" onClick={exitQuiz} className="mt-6 w-full">Back to Quizzes</Button>
                </div>
                {/* Review each question */}
                <div className="mt-6 space-y-4">
                  {questions.map((item, idx) => {
                    const qid = getQuestionId(item, idx);
                    const userAns = answers[qid];
                    const correct = userAns === item.answer;
                    return (
                      <div key={qid} className={classNames(
                        'rounded-xl border p-4 transition-colors',
                        correct ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'
                      )}>
                        <div className="flex items-start gap-3">
                          {correct
                            ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
                            : <XCircle size={18} className="mt-0.5 shrink-0 text-danger" />}
                          <div>
                            <p className="font-bold text-ink-100">{item.question}</p>
                            {!correct && (
                              <p className="mt-1 text-sm text-ink-400">
                                Correct: <span className="font-bold text-success">{item.answer}</span>
                                {userAns && <> · Your answer: <span className="font-bold text-danger">{userAns}</span></>}
                              </p>
                            )}
                            {item.explanation && (
                              <p className="mt-2 text-sm text-ink-400">{item.explanation}</p>
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
                <div className="mt-4 flex items-center justify-between gap-3">
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
                      <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
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
  const questionCount = quiz.questions?.length || 0;
  const completionPercent = Math.round((quiz.attemptedQuestions || 0) / Math.max(questionCount, 1) * 100) || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!attempted ? { y: -2 } : undefined}
      transition={{ duration: 0.25 }}
      className={classNames(
        'group relative overflow-hidden rounded-2xl border bg-bg-surface p-5 shadow-card transition-all duration-300',
        attempted
          ? 'border-line-subtle opacity-70 cursor-not-allowed bg-bg-surface/50'
          : 'border-line hover:border-line-strong hover:shadow-card-hover cursor-pointer',
      )}
    >
      {/* Subtle background glow */}
      {!attempted && (
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl opacity-50 transition-opacity duration-500 group-hover:opacity-100" />
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400">{quiz.subject}</p>
          <h3 className="mt-1.5 text-base font-black text-ink-100 transition-colors group-hover:text-amber-500">{quiz.title}</h3>
          <p className="mt-1 text-xs text-ink-400">{questionCount} questions • {quiz.timerMinutes || quiz.duration || 25}m timer</p>
        </div>
        
        {/* Progress Ring */}
        {attempted && (
          <div className="shrink-0">
            <ProgressRing
              percentage={completionPercent}
              size={52}
              color={completionPercent >= 80 ? 'emerald' : completionPercent >= 60 ? 'amber' : 'cyan'}
              width={3}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(quiz.dailyQuiz ?? quiz.isDaily) && (
          <Badge variant="info" animated>Daily Challenge</Badge>
        )}
        {attempted && <Badge variant="success" animated>Completed</Badge>}
      </div>
      
      <Button
        variant={attempted ? 'secondary' : 'primary'}
        className={classNames('mt-4 w-full', attempted ? 'opacity-60 cursor-not-allowed' : '')}
        disabled={attempted}
        onClick={onStart}
      >
        {attempted ? '✓ Completed' : 'Start Quiz →'}
      </Button>
      {attempted && (
        <p className="mt-2 text-center text-[11px] text-ink-600">Reattempts disabled for fair scoring</p>
      )}
    </motion.div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────────── */
export default function Quizzes() {
  const { user, notify } = useApp();
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

  const subjectCounts = useMemo(() => {
    const counts = { 'All': quizzes.filter((q) => q.published !== false).length };
    subjects.forEach((s) => {
      counts[s.name] = quizzes.filter((q) => (q.subject === s.name || q.subject === 'All') && q.published !== false).length;
    });
    return counts;
  }, [quizzes, subjects]);

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
      notify('You have already completed this quiz.');
      setSubmitted(true);
      setQuizInProgress(false);
      return;
    }
    setSubmitting(true);
    try {
      await submitAttempt(userId, activeQuiz.id, activeQuiz, answers);
      setSubmitted(true);
      setQuizInProgress(false);
      notify('Quiz submitted successfully!');
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
        notify(error.message);
      } else {
        notify(getFriendlyFirebaseError(error) || error.message || 'Failed to submit quiz. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [user, activeQuiz, answers, notify, attemptedQuizIds, submitting, questions, playSuccessTone]);

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
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400">Quiz Arena</p>
          <h2 className="font-display text-2xl font-black text-ink-100 sm:text-3xl">Subject-wise Sprints</h2>
          <p className="mt-1 text-sm text-ink-400">{filtered.length} quiz{filtered.length !== 1 ? 'zes' : ''} available</p>
        </div>
        <SlidersHorizontal className="text-ink-400" />
      </div>

      {/* Subject filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', ...subjects.map((item) => item.name)].map((item) => {
          const isSelected = subject === item;
          return (
            <motion.button
              key={item}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSubject(item)}
              className={classNames(
                'min-h-9 shrink-0 rounded-full px-4 text-sm font-bold transition-all duration-200 border',
                isSelected
                  ? 'border-amber-500 bg-amber-500 text-amber-50 shadow-soft'
                  : 'border-line bg-bg-surface text-ink-400 hover:border-line-strong hover:bg-bg-raised hover:text-ink-100',
              )}
            >
              {item} <span className={classNames('ml-1.5 rounded-full px-2 py-0.5 text-xs', isSelected ? 'bg-black/20 text-amber-50' : 'bg-bg-raised text-ink-400')}>{subjectCounts[item] || 0}</span>
            </motion.button>
          );
        })}
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
      <div className="hidden grid-cols-2 gap-3 rounded-2xl border border-line bg-bg-surface p-4 shadow-card sm:grid sm:grid-cols-4">
        <div className="p-2 text-center">
          <p className="text-2xl font-black text-ink-100">{filtered.length}</p>
          <p className="text-xs font-semibold text-ink-400">Available</p>
        </div>
        <div className="p-2 text-center">
          <p className="text-2xl font-black text-cyan-500 dark:text-cyan-400">{attemptedQuizIds.size}</p>
          <p className="text-xs font-semibold text-ink-400">Completed</p>
        </div>
        <div className="p-2 text-center">
          <p className="text-2xl font-black text-amber-500">{filtered.length - [...attemptedQuizIds].filter(id => filtered.some(q => q.id === id)).length}</p>
          <p className="text-xs font-semibold text-ink-400">Remaining</p>
        </div>
        <div className="p-2 text-center">
          <p className="text-2xl font-black text-success">
            {filtered.length ? Math.round(([...attemptedQuizIds].filter(id => filtered.some(q => q.id === id)).length / filtered.length) * 100) : 0}%
          </p>
          <p className="text-xs font-semibold text-ink-400">Completion</p>
        </div>
      </div>
    </div>
  );
}
