import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { watchSubjects, watchUserAttempts } from '../firebase';
import AttemptReviewModal from '../components/AttemptReviewModal';
import {
  AttemptTable,
  AccuracyTrendChart,
  LedgerSkeleton,
  LedgerState,
  SectionHeader,
  StudySummary,
  SubjectTable,
  WeekActivityChart,
} from '../components/ledger';
import { useApp } from '../context/useApp';
import { useReducedMotion } from '../components/motion/useReducedMotion';
import {
  getActivitySummary,
  getActivityTrend,
  getAverageAccuracy,
  getCompletedAttempts,
  getAttemptsToday,
  getFocusSubject,
  getSubjectStats,
  getXpVelocity,
  sortSubjectStats,
} from '../utils/analytics';
import { toTimestampDate } from '../utils';

function formatProgressDate() {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

export default function Performance({ notify, setActive = () => {} }) {
  const { user, notify: globalNotify } = useApp();
  const report = notify || globalNotify;
  const reducedMotion = useReducedMotion();
  const [attempts, setAttempts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [reviewAttemptId, setReviewAttemptId] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const [attemptsStatus, setAttemptsStatus] = useState(user?.uid ? 'loading' : 'ready');
  const [subjectsStatus, setSubjectsStatus] = useState('loading');

  useEffect(() => {
    const unsubscribers = [];

    if (user?.uid) {
      unsubscribers.push(
        watchUserAttempts(user.uid, (items) => {
          setAttempts(items);
          setAttemptsStatus('ready');
        }, {
          take: 200,
          onError: () => {
            setAttemptsStatus('error');
            report?.('Attempts could not be loaded.');
          },
        }),
      );
    }

    unsubscribers.push(
      watchSubjects((items) => {
        setSubjects(items);
        setSubjectsStatus('ready');
      }, {
        take: 50,
        onError: () => {
          setSubjectsStatus('error');
          report?.('Subjects could not be loaded.');
        },
      }),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
  }, [report, retryToken, user?.uid]);

  const completedAttempts = useMemo(() => getCompletedAttempts(attempts), [attempts]);
  const averageAccuracy = useMemo(() => getAverageAccuracy(completedAttempts), [completedAttempts]);
  const subjectStats = useMemo(
    () => sortSubjectStats(getSubjectStats(subjects, completedAttempts)),
    [subjects, completedAttempts],
  );
  const strongestSubject = useMemo(
    () => subjectStats.filter((subject) => subject.attemptCount > 0).sort((left, right) => (right.accuracy ?? 0) - (left.accuracy ?? 0))[0] || null,
    [subjectStats],
  );
  const focusSubject = useMemo(
    () => getFocusSubject(subjectStats, completedAttempts, getAttemptsToday(completedAttempts)),
    [subjectStats, completedAttempts],
  );
  const activitySummary = useMemo(() => getActivitySummary(completedAttempts), [completedAttempts]);
  const activityTrend = useMemo(() => getActivityTrend(completedAttempts), [completedAttempts]);
  const xpVelocity = useMemo(() => getXpVelocity(completedAttempts), [completedAttempts]);
  const recentHistory = useMemo(
    () => [...completedAttempts].sort((left, right) => (toTimestampDate(right.completedAt)?.getTime() || 0) - (toTimestampDate(left.completedAt)?.getTime() || 0)),
    [completedAttempts],
  );
  const accuracyTrend = useMemo(
    () => [...completedAttempts]
      .sort((left, right) => (toTimestampDate(left.completedAt)?.getTime() || 0) - (toTimestampDate(right.completedAt)?.getTime() || 0))
      .slice(-8)
      .map((attempt, index) => ({
        label: `#${index + 1}`,
        accuracy: Math.max(0, Math.min(100, Math.round(Number(attempt.accuracy) || 0))),
      })),
    [completedAttempts],
  );

  const retry = () => setRetryToken((value) => value + 1);
  const focusLabel = focusSubject?.attemptCount ? `Focus next: ${focusSubject.name} · ${focusSubject.accuracy}% across ${focusSubject.attemptCount} attempt${focusSubject.attemptCount === 1 ? '' : 's'}` : 'Complete a quiz to compare subjects';

  return (
    <div className="ledger-page space-y-8 sm:space-y-10">
      <header className="ledger-page-header">
        <div>
          <h1 className="ledger-page-title">Progress</h1>
          <p className="mt-2 text-sm text-ink-400">
            <span className="ledger-tabular text-ink-200">{averageAccuracy}% average accuracy</span> across {completedAttempts.length} completed attempt{completedAttempts.length === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="ledger-page-meta">Updated {formatProgressDate()}</div>
      </header>

      <div className="ledger-focus-line">
        <p className="text-sm text-ink-100">
          <span className="font-semibold text-accent">{focusLabel}</span>
        </p>
        {focusSubject ? (
          <button type="button" onClick={() => setActive('quizzes')} className="ledger-text-action text-accent">
            Practice {focusSubject.name} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)]">
        <section>
          <SectionHeader title="Subject comparison" detail="Lowest accuracy first" />
          {subjectsStatus === 'loading' ? (
            <LedgerSkeleton rows={3} />
          ) : subjectsStatus === 'error' ? (
            <LedgerState
              title="Subjects could not be loaded."
              body="Your attempt history is still available below."
              tone="error"
              action={<button type="button" className="ledger-text-action" onClick={retry}>Try again</button>}
            />
          ) : (
            <SubjectTable
              subjects={subjectStats}
              onPractice={() => setActive('quizzes')}
              emptyTitle="No subjects to compare"
              emptyBody="Subjects will appear here when they are available."
            />
          )}
        </section>

        <section>
          <SectionHeader title="Activity this week" detail="Attempts" />
          <WeekActivityChart
            data={activitySummary.data}
            loading={attemptsStatus === 'loading'}
            error={attemptsStatus === 'error'}
            onRetry={retry}
            reducedMotion={reducedMotion}
          />
        </section>

        <section>
          <SectionHeader title="Accuracy trend" detail="Recent quizzes" />
          <AccuracyTrendChart data={accuracyTrend} loading={attemptsStatus === 'loading'} reducedMotion={reducedMotion} />
        </section>
      </div>

      <section>
        <SectionHeader title="Study summary" detail="Based on completed attempts" />
        <StudySummary strongest={strongestSubject} activityTrend={activityTrend} xpVelocity={xpVelocity} />
      </section>

      <section>
        <SectionHeader title="Recent attempts" detail="Latest 5 · newest first" />
        {attemptsStatus === 'loading' ? (
          <LedgerSkeleton rows={5} />
        ) : attemptsStatus === 'error' ? (
          <LedgerState
            title="Attempts could not be loaded."
            body="Try again to refresh your result history."
            tone="error"
            action={<button type="button" className="ledger-text-action" onClick={retry}>Try again</button>}
          />
        ) : (
          <AttemptTable
            attempts={recentHistory}
            limit={5}
            onReview={setReviewAttemptId}
            emptyTitle="No completed quizzes yet"
            emptyBody="Complete a quiz to populate your progress history."
          />
        )}
      </section>

      <AttemptReviewModal attemptId={reviewAttemptId} onClose={() => setReviewAttemptId(null)} />
    </div>
  );
}
