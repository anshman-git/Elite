import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock,
  Flame,
  Sparkles,
  Trophy,
  Zap,
  Target,
} from 'lucide-react';
import { watchCollection, watchExamCountdown, watchSubjects, watchUserAttempts } from '../firebase';
import AttemptReviewModal from '../components/AttemptReviewModal';
import { ScrollReveal } from '../components/motion/ScrollReveal';
import { TickerBar } from '../components/motion/TickerBar';
import { CountUp } from '../components/motion/CountUp';
import { SpotlightCard } from '../components/motion/SpotlightCard';
import { PlayerCard } from '../components/home/PlayerCard';
import { StatsCard, ProgressRing } from '../components/InteractiveElements';
import {
  daysUntilExam,
  getDicebearAvatar,
  getDisplayName,
  getLevelFromXp,
  getLocalDayDifference,
} from '../utils';

function getCountdownDisplay(examCountdown) {
  if (!examCountdown?.examDate) return null;
  const examDate = examCountdown.examDate.toDate
    ? examCountdown.examDate.toDate()
    : new Date(examCountdown.examDate);
  const now = new Date();
  const diffTime = examDate - now;
  if (diffTime <= 0) return { text: 'Exam passed', urgent: false };
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (diffDays > 0) return { text: `${diffDays}D ${diffHours}H`, urgent: diffDays <= 7 };
  if (diffHours > 0) return { text: `${diffHours}H`, urgent: true };
  return { text: '<1H', urgent: true };
}

function getSubjectProgress(subject, attempts) {
  const subjectAttempts = attempts.filter((a) => a.subject === subject.name);
  if (!subjectAttempts.length) return 0;
  return Math.round(
    subjectAttempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / subjectAttempts.length,
  );
}

function formatAttemptDate(value) {
  const date = value?.toDate?.();
  return date
    ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : 'Just now';
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayAttempts(attempts) {
  return attempts.filter((attempt) => {
    if (!attempt.completedAt) return false;
    const date = attempt.completedAt.toDate ? attempt.completedAt.toDate() : new Date(attempt.completedAt);
    return date.toDateString() === new Date().toDateString();
  }).length;
}

function getAverageAccuracy(attempts) {
  if (!attempts.length) return 0;
  return Math.round(attempts.reduce((sum, attempt) => sum + (Number(attempt.accuracy) || 0), 0) / attempts.length);
}

function MiniMetric({ icon: Icon, label, value, tone = 'amber' }) {
  const toneClass = tone === 'cyan'
    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-glow-cyan group-hover:border-cyan-500/50 group-hover:shadow-glow-cyan'
    : tone === 'success'
      ? 'border-success/30 bg-success/10 text-success group-hover:border-success/50'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-glow-amber group-hover:border-amber-500/50 group-hover:shadow-glow-amber';

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group rounded-xl border border-line bg-gradient-to-br from-bg-surface/80 to-bg-surface/40 p-4 shadow-soft hover:shadow-card backdrop-blur-md transition-all duration-200 ease-out cursor-default"
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border font-semibold transition-all duration-200 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-ink-400">{label}</p>
          <p className="mt-1 truncate font-display text-lg font-black text-ink-100 group-hover:text-amber-400 transition-colors">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardHero({
  displayName,
  streakDays,
  isDailyDone,
  attemptsToday,
  countdownText,
  onStart,
  onAnalytics,
}) {
  const dailyProgress = Math.min(100, attemptsToday * 50);

  return (
    <SpotlightCard className="overflow-hidden p-0 group" glow="amber">
      <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-amber-radial blur-3xl opacity-70 group-hover:opacity-90 transition-opacity duration-500" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-cyan-radial blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" aria-hidden />

      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_360px] lg:p-8">
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-amber-500/10 px-3 py-2 text-amber-400 backdrop-blur-md hover:border-amber-500/50 transition-all duration-300"
            >
              <Sparkles className="h-4 w-4 shrink-0 animate-spin-slow" />
              <span className="truncate text-xs font-bold uppercase tracking-[0.2em]">
                Command center online
              </span>
            </motion.div>

            <h1 className="mt-6 max-w-3xl font-display text-3xl font-black leading-tight text-ink-100 sm:text-4xl lg:text-5xl">
              {getGreeting()}, {displayName}.
              <span className="block mt-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                Keep the streak alive.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-ink-300 sm:text-base">
              Your study pulse, rank pressure, and daily practice targets are gathered here so the next move is always obvious.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              className="btn-game justify-center gap-2 px-6 py-3.5 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Zap className="h-5 w-5" />
              {isDailyDone ? 'Practice More' : 'Start Daily Sprint'}
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAnalytics}
              className="btn-ghost justify-center gap-2 px-6 py-3.5 text-sm font-semibold hover:shadow-lg transition-all duration-200"
            >
              <BarChart3 className="h-5 w-5" />
              View Analytics
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-line/50 bg-gradient-to-br from-bg-surface/50 to-bg-inset/30 p-6 shadow-card hover:shadow-card-hover backdrop-blur-xl transition-all duration-300"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-amber-500">Today Progress</p>
              <h2 className="mt-3 font-display text-3xl font-black text-ink-100">{streakDays}<span className="text-amber-400 text-2xl">🔥</span></h2>
              <p className="mt-2 text-sm text-ink-400">
                {isDailyDone ? '✓ Daily sprint cleared!' : 'Complete 2 sprints to keep the streak'}
              </p>
            </div>
            <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-500/10 shadow-glow-amber">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-1.5 rounded-full"
                style={{
                  background: `conic-gradient(#FFA500 ${dailyProgress * 3.6}deg, rgba(148,163,184,0.2) 0deg)`,
                }}
              />
              <div className="relative grid h-16 w-16 place-items-center rounded-full border border-line bg-bg-surface shadow-lg">
                <Flame className="h-7 w-7 text-amber-500" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <MiniMetric icon={Activity} label="Sprints" value={`${attemptsToday}/2`} tone="cyan" />
            <MiniMetric icon={Clock} label="Exam" value={countdownText || '...'} tone="cyan" />
          </div>
        </motion.div>
      </div>
    </SpotlightCard>
  );
}

function ProgressSnapshot({ subjects, averageAccuracy, attempts, onAnalytics }) {
  const activeSubjects = subjects.filter((subject) => subject.status !== 'locked').length;

  return (
    <SpotlightCard className="p-5 sm:p-7" glow="cyan">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-cyan-400" />
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-400">PROGRESS PULSE</p>
        </div>
        <button
          onClick={onAnalytics}
          className="inline-flex items-center gap-1 text-xs font-semibold text-ink-400 transition-colors hover:text-ink-100"
        >
          Full report <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="rounded-2xl border border-line bg-bg-inset/70 p-5 text-center">
          <div
            className="mx-auto grid h-32 w-32 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#22D3EE ${averageAccuracy * 3.6}deg, rgba(148,163,184,0.18) 0deg)`,
            }}
          >
            <div className="grid h-24 w-24 place-items-center rounded-full border border-line bg-bg-surface">
              <div>
                <p className="font-display text-3xl font-black text-ink-100">{averageAccuracy}%</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">Average</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold text-ink-200">{attempts.length} attempts analyzed</p>
          <p className="mt-1 text-xs text-ink-400">{activeSubjects} subjects currently moving</p>
        </div>

        <div className="grid content-start gap-3">
          {subjects.length ? subjects.slice(0, 4).map((subject) => (
            <div key={subject.id} className="rounded-xl border border-line bg-bg-surface/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold text-ink-100">{subject.name}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-400">{subject.description || 'Practice momentum'}</p>
                </div>
                <span className="shrink-0 font-mono text-sm font-bold text-cyan-400">{subject.progress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full border border-line-subtle bg-bg-inset">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subject.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-amber-500"
                />
              </div>
            </div>
          )) : (
            <div className="rounded-xl border border-line bg-bg-surface/70 p-5">
              <p className="font-display text-lg text-ink-100">No subjects yet</p>
              <p className="mt-1 text-sm text-ink-400">Your mastery pulse appears as soon as subjects are available.</p>
            </div>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}

/**
 * Compute the "effective" streak for display only.
 * If the user missed more than one calendar day since their last attempt
 * their streak is shown as 0 even if Firestore still has the old value
 * (the DB value gets corrected on the next quiz submission via calculateStreak).
 */
function getEffectiveStreak(stored, lastAttemptDate) {
  const base = Number(stored) || 0;
  if (!lastAttemptDate || !base) return base;
  try {
    const lastAttempt =
      lastAttemptDate?.toDate?.() || new Date(lastAttemptDate);
    const dayDiff = getLocalDayDifference(lastAttempt);
    // dayDiff > 1 means they missed at least one full calendar day → streak broken
    return dayDiff > 1 ? 0 : base;
  } catch {
    return base;
  }
}

export default function Dashboard({ setActive, user, notify, openProfile }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [activities, setActivities] = useState([]);
  const [examCountdown, setExamCountdown] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [reviewAttemptId, setReviewAttemptId] = useState(null);

  const sortedLeaderboard = useMemo(
    () =>
      [...leaderboard].sort(
        (l, r) => (Number(r.weeklyPoints) || 0) - (Number(l.weeklyPoints) || 0),
      ),
    [leaderboard],
  );

  useEffect(() => {
    const unsubs = [];

    unsubs.push(
      watchCollection('users', setLeaderboard, {
        sortField: 'weeklyPoints',
        take: 5,
        onError: () => notify('Could not load leaderboard from Firestore.'),
      }),
    );

    unsubs.push(
      watchCollection('announcements', setActivities, {
        take: 4,
        onError: () => notify('Could not load recent activity from Firestore.'),
      }),
    );

    unsubs.push(watchExamCountdown(setExamCountdown));

    if (!user?.uid) {
      const id = setTimeout(() => setAttempts([]), 0);
      return () => clearTimeout(id);
    }

    unsubs.push(
      watchUserAttempts(user.uid, setAttempts, {
        take: 50,
        onError: () => notify('Could not load your attempt history.'),
      }),
    );

    unsubs.push(
      watchSubjects(setSubjects, {
        take: 10,
        onError: () => console.error('Could not load subjects.'),
      }),
    );

    return () => unsubs.forEach((u) => u?.());
  }, [notify, user?.uid]);

  const countdownDisplay = getCountdownDisplay(examCountdown);
  const level = getLevelFromXp(user?.xp);
  const currentXp = Number(user?.xp || 0);
  const nextLevelXp = (level + 1) * 100;

  // Effective streak: recalculate client-side so UI resets instantly after 24h inactivity
  const streakDays = useMemo(
    () => getEffectiveStreak(user?.streak, user?.lastAttemptDate),
    [user?.streak, user?.lastAttemptDate],
  );

  const attemptsToday = useMemo(() => getTodayAttempts(attempts), [attempts]);
  const averageAccuracy = useMemo(() => getAverageAccuracy(attempts), [attempts]);
  const isDailyDone = attemptsToday >= 2;

  const roadmapSubjects = useMemo(
    () =>
      subjects.slice(0, 5).map((subject, index) => {
        const progress = getSubjectProgress(subject, attempts);
        const status =
          progress >= 80 ? 'done' : index === 0 || progress > 0 ? 'active' : 'locked';
        return { ...subject, progress, status };
      }),
    [subjects, attempts],
  );

  // Get stats for StatsCard display
  const statsData = useMemo(() => {
    const totalAttempts = attempts.length;
    const thisWeekAttempts = attempts.filter((a) => {
      const date = a.completedAt?.toDate?.() || new Date(a.completedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;
    
    return {
      totalAttempts,
      thisWeekAttempts,
      averageAccuracy,
      currentRank: 5, // This would come from user data
    };
  }, [attempts, averageAccuracy]);

  const tickerItems = activities.length
    ? activities.map((item) => item.title || item.body || 'New command center update')
    : ['Daily mission active', 'Rankings are live', 'Open the arena to keep your streak'];

  return (
    <>
      <div className="space-y-6 sm:space-y-8">
        <ScrollReveal>
          <TickerBar items={tickerItems} />
        </ScrollReveal>

        <ScrollReveal delay={0.03}>
          <DashboardHero
            displayName={getDisplayName(user) || 'Grinder'}
            streakDays={streakDays}
            isDailyDone={isDailyDone}
            attemptsToday={attemptsToday}
            countdownText={countdownDisplay?.text || `${daysUntilExam()} days`}
            onStart={() => setActive('quizzes')}
            onAnalytics={() => setActive('performance')}
          />
        </ScrollReveal>

        {/* Enhanced Stats Section */}
        <ScrollReveal delay={0.04}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={Trophy}
              label="Total Attempts"
              value={statsData.totalAttempts.toString()}
              trend={`+${statsData.thisWeekAttempts} this week`}
              trendPositive={true}
            />
            <StatsCard
              icon={Target}
              label="Accuracy"
              value={`${averageAccuracy}%`}
              trend={averageAccuracy >= 80 ? 'Excellent!' : 'Keep practicing'}
              trendPositive={averageAccuracy >= 75}
            />
            <StatsCard
              icon={Flame}
              label="Streak"
              value={`${streakDays} days`}
              trend={isDailyDone ? 'Daily done!' : 'Complete today'}
              trendPositive={true}
            />
            <StatsCard
              icon={Zap}
              label="Level"
              value={`${level}`}
              trend={`${currentXp}/${nextLevelXp} XP`}
              trendPositive={true}
            />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[1fr_380px]">
          <ScrollReveal delay={0.05}>
            <ProgressSnapshot
              subjects={roadmapSubjects}
              averageAccuracy={averageAccuracy}
              attempts={attempts}
              onAnalytics={() => setActive('performance')}
            />
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <PlayerCard
              name={getDisplayName(user) || 'Grinder'}
              level={level}
              xp={currentXp}
              xpToNext={nextLevelXp}
              avatarUrl={getDicebearAvatar(user?.uid, user?.avatarStyle)}
            />
          </ScrollReveal>
        </div>

        {/* Recent attempts + Leaderboard */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 sm:gap-6">
          {/* Recent Attempts */}
          <ScrollReveal>
            <SpotlightCard className="p-5 sm:p-7" glow="cyan">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-cyan-400 shrink-0" />
                  <p className="font-mono text-xs tracking-[0.3em] text-cyan-400">
                    RECENT ATTEMPTS
                  </p>
                </div>
                <button
                  onClick={() => setActive('performance')}
                  className="text-xs font-medium text-ink-400 hover:text-ink-100 transition-all duration-200 ease-in-out shrink-0"
                >
                  View All
                </button>
              </div>

              {attempts.length ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {attempts.slice(0, 3).map((attempt, index) => (
                    <motion.div
                      key={attempt.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.35 }}
                      className="rounded-xl border border-line p-4 min-w-0"
                      style={{ backgroundColor: 'rgb(var(--color-bg-inset))' }}
                    >
                      <p className="font-mono text-[10px] tracking-[0.2em] text-amber-400 truncate">
                        {attempt.subject || 'SPRINT'}
                      </p>
                      <h4 className="mt-2 truncate font-display text-base sm:text-lg text-ink-100">
                        {attempt.quizTitle || 'Quiz sprint'}
                      </h4>
                      <p className="mt-1 text-xs text-ink-400">
                        Score {attempt.score}/{attempt.total} · {attempt.accuracy || 0}%
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                        <span className="text-[10px] font-semibold text-ink-400 shrink-0">
                          {formatAttemptDate(attempt.completedAt)}
                        </span>
                        <button
                          onClick={() => setReviewAttemptId(attempt.id)}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-100 transition-all duration-200 ease-in-out hover:border-cyan-500/40 shrink-0"
                          style={{ backgroundColor: 'rgb(var(--color-bg-raised))' }}
                        >
                          Review
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* Empty state — must be visible on all screen sizes */
                <div className="mt-5 rounded-xl border border-line p-6 text-center"
                     style={{ backgroundColor: 'rgb(var(--color-bg-inset))' }}>
                  <Activity className="mx-auto h-8 w-8 text-ink-600" />
                  <p className="mt-3 font-display text-base sm:text-lg text-ink-100">
                    No attempts logged yet
                  </p>
                  <p className="mt-1 text-sm text-ink-400">
                    The arena is quiet for now. One sprint changes that.
                  </p>
                  <button
                    onClick={() => setActive('quizzes')}
                    className="btn-game mt-4 text-sm transition-all duration-200 ease-in-out"
                  >
                    Enter the Arena
                  </button>
                </div>
              )}
            </SpotlightCard>
          </ScrollReveal>

          {/* Leaderboard */}
          <ScrollReveal delay={0.1}>
            <SpotlightCard className="p-5 sm:p-7" glow="amber">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                <p className="font-mono text-xs tracking-[0.3em] text-amber-500">
                  GRIND MASTERS
                </p>
              </div>

              {sortedLeaderboard.length ? (
                <div className="mt-5 space-y-2">
                  {sortedLeaderboard.slice(0, 5).map((person, index) => {
                    const isYou = person.id === user?.uid;
                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => openProfile?.(person.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ease-in-out hover:-translate-y-0.5 ${
                          isYou
                            ? 'border-amber-500/50 bg-amber-500/10'
                            : 'border-line hover:border-amber-500/30'
                        }`}
                        style={isYou ? undefined : { backgroundColor: 'rgb(var(--color-bg-inset))' }}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold text-amber-400"
                              style={{ backgroundColor: 'rgb(var(--color-bg-raised))' }}>
                          {index + 1}
                        </span>
                        <img
                          src={getDicebearAvatar(person.id, person.avatarStyle)}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg border border-line"
                          style={{ backgroundColor: 'rgb(var(--color-bg-raised))' }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm text-ink-100">
                            {getDisplayName(person)}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-ink-400">
                            {isYou ? 'You' : 'Chasing the board'}
                          </p>
                        </div>
                        <p className="font-mono text-sm font-bold text-amber-400 shrink-0">
                          <CountUp to={Number(person.weeklyPoints) || 0} />
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-line p-6 text-center"
                     style={{ backgroundColor: 'rgb(var(--color-bg-inset))' }}>
                  <Trophy className="mx-auto h-8 w-8 text-ink-600" />
                  <p className="mt-3 font-display text-base sm:text-lg text-ink-100">
                    No rankings yet
                  </p>
                  <p className="mt-1 text-sm text-ink-400">
                    Solve quizzes to wake the board.
                  </p>
                </div>
              )}
            </SpotlightCard>
          </ScrollReveal>
        </div>
      </div>

      <AttemptReviewModal
        attemptId={reviewAttemptId}
        onClose={() => setReviewAttemptId(null)}
      />
    </>
  );
}
