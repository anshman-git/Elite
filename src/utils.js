export const classNames = (...values) => values.filter(Boolean).join(' ');

export function daysUntilExam(target = '2026-05-30') {
  const end = new Date(`${target}T00:00:00`);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}
