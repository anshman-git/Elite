import { getLocalDayDifference, isCompletedAttempt, toTimestampDate } from '../utils.js';

const STANDING_ORDER = {
  focus: 0,
  steady: 1,
  strong: 2,
  'not-attempted': 3,
};

export function getCompletedAttempts(attempts = []) {
  return attempts.filter(isCompletedAttempt);
}

export function getLocalDateKey(value) {
  const date = toTimestampDate(value);
  if (!date) return null;
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function formatLedgerDate(value, options = { day: 'numeric', month: 'short' }) {
  const date = toTimestampDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

export function formatAttemptScore(attempt = {}) {
  const score = Number.isFinite(Number(attempt.score)) ? attempt.score : '—';
  const total = Number.isFinite(Number(attempt.total)) ? attempt.total : '—';
  const accuracy = Number.isFinite(Number(attempt.accuracy)) ? `${Math.round(Number(attempt.accuracy))}%` : '—';
  return `${score}/${total} · ${accuracy}`;
}

export function getSubjectStanding(progress, attemptCount) {
  if (!attemptCount) return 'not-attempted';
  if (progress < 60) return 'focus';
  if (progress < 80) return 'steady';
  return 'strong';
}

export function getSubjectStats(subjects = [], attempts = []) {
  const completed = getCompletedAttempts(attempts);

  return subjects.map((subject) => {
    const subjectAttempts = completed
      .filter((attempt) => attempt.subject === subject.name)
      .sort((left, right) => (toTimestampDate(right.completedAt)?.getTime() || 0) - (toTimestampDate(left.completedAt)?.getTime() || 0));
    const attemptCount = subjectAttempts.length;
    const accuracy = attemptCount
      ? Math.round(subjectAttempts.reduce((sum, attempt) => sum + (Number(attempt.accuracy) || 0), 0) / attemptCount)
      : null;
    const latestAttempt = subjectAttempts[0] || null;
    const progress = accuracy ?? 0;

    return {
      ...subject,
      attemptCount,
      accuracy,
      progress,
      standing: getSubjectStanding(progress, attemptCount),
      latestAttempt,
      latestScore: latestAttempt ? `${latestAttempt.score ?? '—'}/${latestAttempt.total ?? '—'}` : null,
    };
  });
}

export function sortSubjectStats(subjectStats = []) {
  return [...subjectStats].sort((left, right) => {
    const standingDifference = STANDING_ORDER[left.standing] - STANDING_ORDER[right.standing];
    if (standingDifference !== 0) return standingDifference;
    if (left.accuracy === null && right.accuracy !== null) return 1;
    if (left.accuracy !== null && right.accuracy === null) return -1;
    return (left.accuracy ?? 101) - (right.accuracy ?? 101);
  });
}

export function getCurrentWeekBounds(now = new Date()) {
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);
  const mondayOffset = (current.getDay() + 6) % 7;
  const start = new Date(current);
  start.setDate(current.getDate() - mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getCurrentWeekActivity(attempts = [], now = new Date()) {
  const { start } = getCurrentWeekBounds(now);
  const completed = getCompletedAttempts(attempts);
  const counts = new Map();
  completed.forEach((attempt) => {
    const key = getLocalDateKey(attempt.completedAt);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = getLocalDateKey(date);
    const count = counts.get(key) || 0;
    return {
      key,
      date,
      label: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date),
      count,
      isToday: getLocalDateKey(date) === getLocalDateKey(now),
    };
  });
}

export function getActivityTrend(attempts = [], now = new Date()) {
  const completed = getCompletedAttempts(attempts);
  const currentDays = new Set();
  const previousDays = new Set();

  completed.forEach((attempt) => {
    const date = toTimestampDate(attempt.completedAt);
    if (!date) return;
    const difference = getLocalDayDifference(date, now);
    const key = getLocalDateKey(date);
    if (!key) return;
    if (difference >= 0 && difference < 7) currentDays.add(key);
    if (difference >= 7 && difference < 14) previousDays.add(key);
  });

  const delta = currentDays.size - previousDays.size;
  return {
    currentDays: currentDays.size,
    previousDays: previousDays.size,
    delta,
    label: delta > 0 ? 'More active this week' : delta < 0 ? 'Less active this week' : 'Steady activity',
    detail: delta > 0
      ? `${delta} more active day${delta === 1 ? '' : 's'} than the previous seven days.`
      : delta < 0
        ? `${Math.abs(delta)} fewer active day${Math.abs(delta) === 1 ? '' : 's'} than the previous seven days.`
        : 'The number of active days matches the previous seven days.',
  };
}

export function getFocusSubject(subjectStats = [], attempts = [], attemptsToday = 0) {
  const attempted = subjectStats
    .filter((subject) => subject.attemptCount > 0)
    .sort((left, right) => (left.accuracy ?? 101) - (right.accuracy ?? 101));
  const unattempted = subjectStats.find((subject) => subject.attemptCount === 0);

  if (attemptsToday < 2 && attempted[0]) return attempted[0];
  if (unattempted) return unattempted;

  const latestAttempt = getCompletedAttempts(attempts)
    .slice()
    .sort((left, right) => (toTimestampDate(right.completedAt)?.getTime() || 0) - (toTimestampDate(left.completedAt)?.getTime() || 0))[0];
  return subjectStats.find((subject) => subject.name === latestAttempt?.subject) || attempted[0] || null;
}

export function getAverageAccuracy(attempts = []) {
  const completed = getCompletedAttempts(attempts);
  if (!completed.length) return 0;
  return Math.round(completed.reduce((sum, attempt) => sum + (Number(attempt.accuracy) || 0), 0) / completed.length);
}

export function getXpVelocity(attempts = []) {
  const completed = getCompletedAttempts(attempts);
  if (!completed.length) return 0;
  const totalXp = completed.reduce((sum, attempt) => sum + (Number(attempt.xp) || (Number(attempt.score) || 0) * 10), 0);
  return Math.round(totalXp / completed.length);
}

export function getAttemptsToday(attempts = [], now = new Date()) {
  const today = getLocalDateKey(now);
  return getCompletedAttempts(attempts).filter((attempt) => getLocalDateKey(attempt.completedAt) === today).length;
}

export function getActivitySummary(attempts = [], now = new Date()) {
  const data = getCurrentWeekActivity(attempts, now);
  return {
    data,
    total: data.reduce((sum, day) => sum + day.count, 0),
    activeDays: data.filter((day) => day.count > 0).length,
  };
}
