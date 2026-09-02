export const classNames = (...values) => values.filter(Boolean).join(' ');

export function daysUntilExam(target = import.meta.env.VITE_EXAM_DATE) {
  if (!target) return null;
  const end = new Date(`${target}T00:00:00`);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function toLocalDayKey(date) {
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

export function getLocalDayDifference(fromDate, toDate = new Date()) {
  const from = fromDate instanceof Date ? fromDate : fromDate?.toDate?.() || new Date(fromDate);
  const to = toDate instanceof Date ? toDate : new Date(toDate);
  const fromMs = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const toMs = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

export function getQuestionId(item, index) {
  return item.id || item.question || `question-${index}`;
}

export function buildAttemptReviewData(questions = [], answers = {}) {
  const questionTexts = [];
  const selectedAnswers = [];
  const correctAnswers = [];
  const reviewItems = [];

  questions.forEach((item, index) => {
    const questionId = getQuestionId(item, index);
    const selectedAnswer = answers[questionId] ?? null;
    questionTexts.push(item.question);
    selectedAnswers.push(selectedAnswer);
    correctAnswers.push(item.answer);
    reviewItems.push({
      questionId,
      question: item.question,
      options: item.options || [],
      selectedAnswer,
      correctAnswer: item.answer,
    });
  });

  return { questionTexts, selectedAnswers, correctAnswers, reviewItems };
}

export function calculateStreak(currentStreak, lastAttemptDate, now = new Date()) {
  const streak = Number(currentStreak) || 0;

  if (!lastAttemptDate) {
    return 1;
  }

  const lastAttempt = lastAttemptDate?.toDate?.() || new Date(lastAttemptDate);
  const dayDiff = getLocalDayDifference(lastAttempt, now);

  if (dayDiff <= 0) {
    return Math.max(streak, 1);
  }

  if (dayDiff === 1) {
    return streak + 1;
  }

  return 1;
}

export function calculateAverageScore(currentAverage, currentAttempts, nextAccuracy) {
  const attempts = Number(currentAttempts) || 0;
  const average = Number(currentAverage) || 0;
  const nextAttempts = attempts + 1;
  return Math.round(((average * attempts) + nextAccuracy) / nextAttempts);
}

export function getDisplayName(user) {
  return user?.name || user?.displayName || user?.email || 'Elite learner';
}

export function getDicebearAvatar(uid, style = 'bottts') {
  const safeStyle = encodeURIComponent(style || 'bottts');
  const safeId = encodeURIComponent(uid || 'guest');
  return `https://api.dicebear.com/7.x/${safeStyle}/svg?seed=${safeId}&scale=100`;
}

export function getLevelFromXp(xp = 0) {
  const value = Number(xp) || 0;
  return Math.floor(value / 100) + 1;
}

export function getXpProgress(xp = 0) {
  const value = Number(xp) || 0;
  return Math.min(100, Math.max(0, value % 100));
}

export function getStreakMotivation(streak = 0) {
  if (streak >= 10) return 'Legendary streak — keep the fire alive.';
  if (streak >= 5) return 'You are on a roll. Don’t break the flame.';
  if (streak >= 2) return 'Daily focus is building fast.';
  return 'Complete one quiz today to ignite your streak.';
}

export function toTimestampDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isSameLocalDay(a, b) {
  const left = toTimestampDate(a);
  const right = toTimestampDate(b);
  if (!left || !right) return false;
  return toLocalDayKey(left) === toLocalDayKey(right);
}

const QUIZ_GUARD_KEY = 'elitestudy-quiz-in-progress';

export function setQuizInProgress(active) {
  if (typeof window === 'undefined') return;
  if (active) {
    sessionStorage.setItem(QUIZ_GUARD_KEY, '1');
  } else {
    sessionStorage.removeItem(QUIZ_GUARD_KEY);
  }
}

export function isQuizInProgress() {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(QUIZ_GUARD_KEY) === '1';
}

export function confirmLeaveQuiz() {
  if (!isQuizInProgress()) return true;
  const leave = window.confirm('Leave quiz? Your progress will be lost.');
  if (leave) setQuizInProgress(false);
  return leave;
}

/** Completed attempts count for scoring / lockout. Legacy docs without status use completedAt. */
export function isCompletedAttempt(attempt) {
  if (!attempt) return false;
  if (attempt.status === 'completed') return true;
  if (attempt.status === 'pending' || attempt.status === 'failed') return false;
  return Boolean(attempt.completedAt);
}
