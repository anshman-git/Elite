export const classNames = (...values) => values.filter(Boolean).join(' ');

export function daysUntilExam(target = import.meta.env.VITE_EXAM_DATE || '2026-05-30') {
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
