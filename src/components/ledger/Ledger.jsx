import { ArrowRight, ArrowUpRight, Check, LockKeyhole } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { classNames } from '../../utils.js';
import { formatLedgerDate } from '../../utils/analytics';

const standingLabels = {
  strong: 'Strong',
  steady: 'Steady',
  focus: 'Focus',
  'not-attempted': 'Not attempted',
};

const standingClasses = {
  strong: 'text-success',
  steady: 'text-ink-200',
  focus: 'text-focus',
  'not-attempted': 'text-ink-400',
};

export function LedgerState({ title, body, action, tone = 'neutral' }) {
  return (
    <div className={classNames('ledger-state', tone === 'error' && 'ledger-state-error')} role={tone === 'error' ? 'alert' : undefined}>
      <p className="font-semibold text-ink-100">{title}</p>
      {body ? <p className="mt-1 text-sm leading-6 text-ink-400">{body}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function LedgerSkeleton({ rows = 3, className = '' }) {
  return (
    <div className={classNames('space-y-3', className)} aria-label="Loading" role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="ledger-skeleton-row" aria-hidden="true">
          <span className="ledger-skeleton-line w-1/4" />
          <span className="ledger-skeleton-line w-2/5" />
          <span className="ledger-skeleton-line w-1/6" />
        </div>
      ))}
    </div>
  );
}

export function ActionBlock({ focusSubject, dailyAttempts = 0, streakDays = 0, examDays, onStart }) {
  const subjectName = focusSubject?.name;
  const hasResult = focusSubject?.attemptCount > 0 && focusSubject.accuracy !== null;
  const title = subjectName ? `Practice ${subjectName}` : 'Start a practice set';
  const result = hasResult
    ? `Last result: ${focusSubject.accuracy}% · ${focusSubject.attemptCount} attempt${focusSubject.attemptCount === 1 ? '' : 's'}`
    : 'No completed attempts yet';
  const completed = Math.max(0, Math.min(2, dailyAttempts));

  return (
    <section className="ledger-action-block" aria-labelledby="next-practice-title">
      <div className="min-w-0">
        <p className="ledger-label text-accent">Next practice</p>
        <h2 id="next-practice-title" className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-ink-100 sm:text-[26px]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-ink-200">{result}</p>

        <div className="mt-6 max-w-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-ink-400">
            <span>Daily practice</span>
            <span className="ledger-tabular text-ink-200">{completed} of 2 completed today</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2" aria-label={`${completed} of 2 daily practice attempts completed`}>
            {[0, 1].map((tick) => (
              <span
                key={tick}
                className={classNames('h-2 rounded-full', tick < completed ? 'bg-accent' : 'border border-line bg-bg-inset')}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-400">
          <span><strong className="ledger-tabular font-semibold text-ink-100">{streakDays}</strong> day streak</span>
          <span>{examDays === null || examDays === undefined ? 'Exam date not set' : examDays === 0 ? 'Exam date passed' : <><strong className="ledger-tabular font-semibold text-ink-100">{examDays}</strong> days to exam</>}</span>
        </div>
      </div>

      <div className="flex items-start sm:justify-end">
        <button type="button" onClick={onStart} className="ledger-primary-action" aria-label={`${title}`}>
          Start practice
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export function MetricRail({ metrics = [] }) {
  return (
    <div className="ledger-metric-rail">
      {metrics.map((metric) => (
        <div key={metric.label} className="ledger-metric">
          <p className="text-xs text-ink-400">{metric.label}</p>
          <p className="ledger-tabular mt-2 font-display text-2xl font-semibold text-ink-100">
            {metric.value}
            {metric.detail ? <span className="ml-1 block font-sans text-[11px] font-medium text-ink-400">{metric.detail}</span> : null}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SectionHeader({ title, detail, action }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-base font-semibold text-ink-100">{title}</h2>
      <div className="flex items-center gap-3 text-xs text-ink-400">
        {detail ? <span>{detail}</span> : null}
        {action || null}
      </div>
    </div>
  );
}

export function SubjectTable({ subjects = [], onPractice, emptyTitle = 'No subject results yet', emptyBody = 'Complete a quiz to compare subject accuracy.' }) {
  if (!subjects.length) {
    return <LedgerState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div className="ledger-table-wrap">
      <table className="ledger-table ledger-subject-table">
        <thead>
          <tr>
            <th scope="col">Subject</th>
            <th scope="col">Attempts</th>
            <th scope="col">Standing</th>
            <th scope="col">Accuracy</th>
            <th scope="col" className="text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => {
            const standing = subject.standing || 'not-attempted';
            const accuracy = subject.accuracy;
            const canPractice = onPractice && standing !== 'strong';
            return (
              <tr key={subject.id || subject.name}>
                <td data-label="Subject">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-100">{subject.name}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-400">
                      {subject.description || (standing === 'focus' ? 'Focus area · review missed concepts' : 'Subject result')}
                    </p>
                    {canPractice ? (
                      <button type="button" onClick={() => onPractice(subject)} className="ledger-inline-action mt-2 md:hidden">
                        Practice {subject.name} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </td>
                <td data-label="Attempts" className="ledger-tabular text-xs text-ink-200">
                  {subject.attemptCount ? `${subject.attemptCount} attempt${subject.attemptCount === 1 ? '' : 's'}` : '—'}
                </td>
                <td data-label="Standing" className={classNames('text-xs font-semibold', standingClasses[standing])}>
                  {standingLabels[standing]}
                </td>
                <td data-label="Accuracy" className="ledger-meter-cell">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="hidden text-ink-400 md:inline">Accuracy</span>
                    <span className="ledger-tabular font-semibold text-ink-100">{accuracy === null || accuracy === undefined ? '—' : `${accuracy}%`}</span>
                  </div>
                  <div className="ledger-meter-track" aria-hidden="true">
                    <span
                      className={classNames(
                        'ledger-meter-fill',
                        standing === 'focus' ? 'bg-focus' : standing === 'strong' ? 'bg-success' : 'bg-accent',
                      )}
                      style={{ width: `${Math.max(0, Math.min(100, accuracy || 0))}%` }}
                    />
                  </div>
                </td>
                <td data-label="Score" className="ledger-tabular text-right text-xs text-ink-200">{subject.latestScore || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AttemptTable({ attempts = [], onReview, limit, emptyTitle = 'No completed quizzes yet', emptyBody = 'Start practice to build your result history.' }) {
  const visibleAttempts = limit ? attempts.slice(0, limit) : attempts;
  if (!visibleAttempts.length) {
    return <LedgerState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div className="ledger-table-wrap">
      <table className="ledger-table ledger-attempt-table">
        <thead>
          <tr>
            <th scope="col">Subject</th>
            <th scope="col">Quiz</th>
            <th scope="col">Score</th>
            <th scope="col">Date</th>
            <th scope="col"><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {visibleAttempts.map((attempt, index) => {
            const accuracy = Number(attempt.accuracy) || 0;
            const tone = accuracy >= 80 ? 'text-success' : accuracy < 60 ? 'text-focus' : 'text-ink-200';
            return (
              <tr key={attempt.id || `${attempt.subject}-${attempt.completedAt || index}`}>
                <td data-label="Subject" className="text-xs font-semibold text-ink-200">{attempt.subject || '—'}</td>
                <td data-label="Quiz" className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold text-ink-100" title={attempt.quizTitle || attempt.subject || 'Quiz attempt'}>
                    {attempt.quizTitle || attempt.subject || 'Quiz attempt'}
                  </p>
                </td>
                <td data-label="Score" className="ledger-tabular text-xs text-ink-200">
                  {attempt.score ?? '—'}/{attempt.total ?? '—'} correct · <strong className={tone}>{accuracy}%</strong>
                </td>
                <td data-label="Date" className="ledger-tabular text-xs text-ink-400">{formatLedgerDate(attempt.completedAt)}</td>
                <td data-label="Action" className="text-right">
                  <button type="button" onClick={() => onReview?.(attempt.id)} className="ledger-text-action ledger-attempt-action" disabled={!onReview}>
                    Review
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function WeekActivityChart({ data = [], loading = false, error = false, onRetry, reducedMotion = false }) {
  if (loading) return <LedgerSkeleton rows={4} className="py-4" />;
  if (error) {
    return (
      <LedgerState
        title="Activity could not be loaded."
        body="Your other progress data is still available."
        tone="error"
        action={<button type="button" className="ledger-text-action" onClick={onRetry}>Try again</button>}
      />
    );
  }
  if (!data.length || data.every((day) => day.count === 0)) {
    return <LedgerState title="No activity this week" body="Complete a quiz to see your daily attempt count here." />;
  }

  const maxCount = Math.max(...data.map((day) => day.count), 1);
  const chartData = data.map((day) => ({ ...day, axisDate: formatLedgerDate(day.date, { day: 'numeric', month: 'short' }) }));

  return (
    <div className="ledger-chart" aria-label="Completed quiz attempts by day for the current week">
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={chartData} margin={{ top: 12, right: 4, bottom: 4, left: -18 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: 'rgb(var(--color-ink-400))', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} />
          <YAxis allowDecimals={false} domain={[0, Math.max(maxCount, 3)]} tick={{ fill: 'rgb(var(--color-ink-400))', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} width={30} />
          <Tooltip
            cursor={{ fill: 'rgb(var(--color-bg-raised) / 0.55)' }}
            contentStyle={{ backgroundColor: 'rgb(var(--color-bg-surface))', border: '1px solid var(--color-line)', borderRadius: 6, color: 'rgb(var(--color-ink-100))', fontSize: 12 }}
            labelStyle={{ color: 'rgb(var(--color-ink-100))', fontWeight: 700 }}
            formatter={(value) => [`${value} attempt${Number(value) === 1 ? '' : 's'}`, 'Completed']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.axisDate || ''}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={!reducedMotion} animationDuration={180}>
            {chartData.map((day) => (
              <Cell key={day.key} fill={day.isToday ? 'rgb(var(--color-accent))' : day.count ? 'rgb(var(--color-success))' : 'rgb(var(--color-bg-raised))'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-[11px] text-ink-400">
        {data.reduce((sum, day) => sum + day.count, 0)} attempts · {data.filter((day) => day.count > 0).length} active days
      </p>
    </div>
  );
}

export function AccuracyTrendChart({ data = [], loading = false, reducedMotion = false }) {
  if (loading) return <LedgerSkeleton rows={4} className="py-4" />;
  if (data.length < 2) {
    return <LedgerState title="More results needed" body="Complete two quizzes to see your accuracy trend." />;
  }

  return (
    <div className="ledger-chart" aria-label="Accuracy trend across recent completed quizzes">
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: -18 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: 'rgb(var(--color-ink-400))', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: 'rgb(var(--color-ink-400))', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} width={38} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgb(var(--color-bg-surface))', border: '1px solid var(--color-line)', borderRadius: 6, color: 'rgb(var(--color-ink-100))', fontSize: 12 }}
            labelStyle={{ color: 'rgb(var(--color-ink-100))', fontWeight: 700 }}
            formatter={(value) => [`${value}%`, 'Accuracy']}
          />
          <Line type="monotone" dataKey="accuracy" stroke="rgb(var(--color-accent))" strokeWidth={2} dot={{ fill: 'rgb(var(--color-bg-surface))', stroke: 'rgb(var(--color-accent))', strokeWidth: 2, r: 3 }} activeDot={{ r: 4 }} isAnimationActive={!reducedMotion} animationDuration={220} />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-[11px] text-ink-400">Last {data.length} completed quizzes · accuracy by attempt</p>
    </div>
  );
}

export function StudySummary({ strongest, activityTrend, xpVelocity }) {
  return (
    <div className="ledger-summary-grid">
      <div className="ledger-summary-item">
        <p className="ledger-label">Strongest subject</p>
        <p className="mt-2 font-semibold text-ink-100">{strongest ? <>{strongest.name} <span className="ledger-tabular text-success">{strongest.accuracy}%</span></> : 'No result yet'}</p>
        <p className="mt-1 text-xs leading-5 text-ink-400">{strongest ? `Based on ${strongest.attemptCount} completed attempt${strongest.attemptCount === 1 ? '' : 's'}.` : 'Complete a quiz to compare subjects.'}</p>
      </div>
      <div className="ledger-summary-item">
        <p className="ledger-label">Active days</p>
        <p className="mt-2 font-semibold text-ink-100">{activityTrend?.currentDays || 0} this week</p>
        <p className="mt-1 text-xs leading-5 text-ink-400">{activityTrend?.detail || 'Activity is measured from completed attempts.'}</p>
      </div>
      <div className="ledger-summary-item">
        <p className="ledger-label">XP per attempt</p>
        <p className="ledger-tabular mt-2 font-semibold text-ink-100">{xpVelocity || 0} XP</p>
        <p className="mt-1 text-xs leading-5 text-ink-400">Average experience earned per completed quiz.</p>
      </div>
    </div>
  );
}

export function StudyRecord({ user, rank, quizzes }) {
  const rows = [
    ['Total XP', Number(user?.xp || 0).toLocaleString('en-IN')],
    ['Weekly points', Number(user?.weeklyPoints || 0).toLocaleString('en-IN')],
    ['Quizzes', Number(quizzes ?? user?.quizzesAttempted ?? 0).toLocaleString('en-IN')],
    ['Rank', typeof rank === 'number' ? `#${rank}` : rank || '—'],
    ['Streak', `${Number(user?.streak || 0)} days`],
  ];

  return (
    <div className="ledger-record-list">
      {rows.map(([label, value]) => (
        <div key={label} className="ledger-record-row">
          <span className="text-sm text-ink-200">{label}</span>
          <strong className="ledger-tabular text-lg font-semibold text-ink-100">{value}</strong>
        </div>
      ))}
    </div>
  );
}

export function AchievementRegister({ definitions = [], earnedIds = [] }) {
  return (
    <div className="ledger-register">
      {definitions.map((item) => {
        const unlocked = earnedIds.includes(item.id);
        const Icon = item.icon;
        return (
          <div key={item.id} className={classNames('ledger-register-row', !unlocked && 'ledger-register-row-muted')}>
            <span className={classNames('ledger-register-icon', unlocked ? 'text-success' : 'text-ink-400')}>
              {unlocked ? <Check className="h-4 w-4" aria-hidden="true" /> : Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-100">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-ink-400">{item.description}</p>
            </div>
            <span className={classNames('shrink-0 text-[11px] font-semibold', unlocked ? 'text-success' : 'text-ink-400')}>
              {unlocked ? 'Earned' : 'Locked'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AppearanceChoice({ label, options = [], value, onChange, renderPreview }) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-xs font-semibold text-ink-200">{label}</legend>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={classNames('ledger-choice', selected && 'ledger-choice-selected')}
            >
              {renderPreview ? renderPreview(option, selected) : <span className={classNames('h-2 w-2 rounded-full', selected ? 'bg-accent' : 'bg-line-strong')} aria-hidden="true" />}
              <span className="truncate">{option.label}</span>
              {selected ? <Check className="ml-auto h-3.5 w-3.5 text-accent" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}


