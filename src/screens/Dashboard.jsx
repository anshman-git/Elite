import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { watchCollection, watchSubjects, watchUserAttempts } from '../firebase';
import AttemptReviewModal from '../components/AttemptReviewModal';
import {
  ActionBlock,
  AttemptTable,
  LedgerSkeleton,
  LedgerState,
  MetricRail,
  SectionHeader,
  SubjectTable,
} from '../components/ledger';
import {
  getAttemptsToday,
  getAverageAccuracy,
  getCompletedAttempts,
  getFocusSubject,
  getSubjectStats,
  sortSubjectStats,
} from '../utils/analytics';
import {
  daysUntilExam,
  getDicebearAvatar,
  getDisplayName,
  getLevelFromXp,
  getLocalDayDifference,
} from '../utils';

function getEffectiveStreak(stored, lastAttemptDate) {
  const base = Number(stored) || 0;
  if (!lastAttemptDate || !base) return base;
  try {
    const lastAttempt = lastAttemptDate?.toDate?.() || new Date(lastAttemptDate);
    return getLocalDayDifference(lastAttempt) > 1 ? 0 : base;
  } catch {
    return base;
  }
}

function formatToday() {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date());
}

function RankingsPreview({ leaderboard, user, onOpenProfile, onViewAll }) {
  const ranked = [...leaderboard]
    .sort((left, right) => (Number(right.weeklyPoints) || 0) - (Number(left.weeklyPoints) || 0))
    .slice(0, 3);

  if (!ranked.length) {
    return (
      <LedgerState
        title="Rankings are not available yet"
        body="Weekly points will appear here as students complete quizzes."
      />
    );
  }

  return (
    <div className="hidden md:block">
      <SectionHeader
        title="Rankings"
        action={(
          <button type="button" onClick={onViewAll} className="ledger-text-action">
            See rankings <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      />
      <div className="ledger-ranking-list">
        {ranked.map((person, index) => {
          const isYou = person.id === user?.uid;
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => onOpenProfile?.(person.id)}
              className={isYou ? 'ledger-ranking-row ledger-ranking-row-current' : 'ledger-ranking-row'}
            >
              <span className="ledger-tabular text-xs text-ink-400">{String(index + 1).padStart(2, '0')}</span>
              <img
                src={getDicebearAvatar(person.id, person.avatarStyle)}
                alt=""
                className="h-7 w-7 rounded-full border border-line bg-bg-raised object-cover"
                loading="lazy"
              />
              <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-ink-100">
                {getDisplayName(person)}{isYou ? <span className="ml-2 text-xs font-medium text-accent">You</span> : null}
              </span>
              <span className="ledger-tabular text-xs text-ink-200">{Number(person.weeklyPoints) || 0}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard({ setActive, user, notify, openProfile }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [reviewAttemptId, setReviewAttemptId] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const [regionState, setRegionState] = useState({
    attempts: 'loading',
    subjects: 'loading',
    leaderboard: 'loading',
  });

  useEffect(() => {
    const unsubs = [];

    unsubs.push(
      watchCollection('users', (items) => {
        setLeaderboard(items);
        setRegionState((current) => ({ ...current, leaderboard: 'ready' }));
      }, {
        sortField: 'weeklyPoints',
        take: 5,
        onError: () => {
          setRegionState((current) => ({ ...current, leaderboard: 'error' }));
          notify('Rankings could not be loaded.');
        },
      }),
    );

    if (!user?.uid) {
      return () => unsubs.forEach((unsubscribe) => unsubscribe?.());
    }

    unsubs.push(
      watchUserAttempts(user.uid, (items) => {
        setAttempts(items);
        setRegionState((current) => ({ ...current, attempts: 'ready' }));
      }, {
        take: 50,
        onError: () => {
          setRegionState((current) => ({ ...current, attempts: 'error' }));
          notify('Attempts could not be loaded.');
        },
      }),
    );

    unsubs.push(
      watchSubjects((items) => {
        setSubjects(items);
        setRegionState((current) => ({ ...current, subjects: 'ready' }));
      }, {
        take: 10,
        onError: () => {
          setRegionState((current) => ({ ...current, subjects: 'error' }));
          notify('Subjects could not be loaded.');
        },
      }),
    );

    return () => unsubs.forEach((unsubscribe) => unsubscribe?.());
  }, [notify, retryToken, user?.uid]);

  const completedAttempts = useMemo(() => getCompletedAttempts(attempts), [attempts]);
  const attemptsToday = useMemo(() => getAttemptsToday(completedAttempts), [completedAttempts]);
  const averageAccuracy = useMemo(() => getAverageAccuracy(completedAttempts), [completedAttempts]);
  const subjectStats = useMemo(
    () => sortSubjectStats(getSubjectStats(subjects, completedAttempts)),
    [subjects, completedAttempts],
  );
  const focusSubject = useMemo(
    () => getFocusSubject(subjectStats, completedAttempts, attemptsToday),
    [subjectStats, completedAttempts, attemptsToday],
  );
  const level = getLevelFromXp(user?.xp);
  const currentXp = Number(user?.xp || 0);
  const nextLevelXp = (level + 1) * 100;
  const streakDays = useMemo(
    () => getEffectiveStreak(user?.streak, user?.lastAttemptDate),
    [user?.streak, user?.lastAttemptDate],
  );

  const metrics = [
    { label: 'Attempts', value: completedAttempts.length },
    { label: 'Average accuracy', value: `${averageAccuracy}%` },
    { label: 'Streak', value: streakDays, detail: 'days' },
    { label: 'Level', value: level, detail: `${currentXp.toLocaleString('en-IN')} / ${nextLevelXp.toLocaleString('en-IN')} XP` },
  ];

  const retry = () => setRetryToken((value) => value + 1);
  const subjectsLoading = regionState.subjects === 'loading';
  const attemptsLoading = regionState.attempts === 'loading';

  return (
    <div className="ledger-page space-y-8 sm:space-y-10">
      <header className="ledger-page-header">
        <div>
          <h1 className="ledger-page-title">Today</h1>
          <p className="mt-2 text-sm text-ink-400">Choose the next useful practice, then keep a clear record of the work.</p>
        </div>
        <div className="ledger-page-meta">
          <span>{formatToday()}</span>
          <span className="h-4 w-px bg-line" aria-hidden="true" />
          <span className="ledger-tabular text-ink-200">{completedAttempts.length} attempts · {averageAccuracy}% average</span>
        </div>
      </header>

      <ActionBlock
        focusSubject={focusSubject}
        dailyAttempts={attemptsLoading ? 0 : attemptsToday}
        streakDays={streakDays}
        examDays={daysUntilExam()}
        onStart={() => setActive('quizzes')}
      />

      <MetricRail metrics={metrics} />

      <section>
        <SectionHeader title="Subject progress" detail="Sorted by next action" />
        {subjectsLoading ? (
          <LedgerSkeleton rows={2} />
        ) : regionState.subjects === 'error' ? (
          <LedgerState
            title="Subjects could not be loaded."
            body="Try again without losing the rest of your study record."
            tone="error"
            action={<button type="button" className="ledger-text-action" onClick={retry}>Try again</button>}
          />
        ) : (
          <SubjectTable subjects={subjectStats.slice(0, 5)} onPractice={() => setActive('quizzes')} />
        )}
      </section>

      <section>
        <SectionHeader
          title="Recent attempts"
          action={(
            <button type="button" onClick={() => setActive('performance')} className="ledger-text-action">
              All attempts <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        />
        {attemptsLoading ? (
          <LedgerSkeleton rows={3} />
        ) : regionState.attempts === 'error' ? (
          <LedgerState
            title="Attempts could not be loaded."
            body="Your other study sections are still available."
            tone="error"
            action={<button type="button" className="ledger-text-action" onClick={retry}>Try again</button>}
          />
        ) : (
          <AttemptTable
            attempts={completedAttempts}
            limit={3}
            onReview={setReviewAttemptId}
          />
        )}
      </section>

      <RankingsPreview
        leaderboard={regionState.leaderboard === 'error' ? [] : leaderboard}
        user={user}
        onOpenProfile={openProfile}
        onViewAll={() => setActive('leaderboard')}
      />

      <AttemptReviewModal attemptId={reviewAttemptId} onClose={() => setReviewAttemptId(null)} />
    </div>
  );
}
