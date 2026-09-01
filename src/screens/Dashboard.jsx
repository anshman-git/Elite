import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock,
  Flame,
  Bot,
  Sparkles,
  Trophy,
  Zap,
  Target,
} from 'lucide-react';
import { watchCollection, watchSubjects, watchUserAttempts } from '../firebase';
import AttemptReviewModal from '../components/AttemptReviewModal';
import { ScrollReveal } from '../components/motion/ScrollReveal';
import { TickerBar } from '../components/motion/TickerBar';
import { CountUp } from '../components/motion/CountUp';
import { SpotlightCard } from '../components/motion/SpotlightCard';
import { PlayerCard } from '../components/home/PlayerCard';
import { StatsCard } from '../components/InteractiveElements';
import {
  daysUntilExam,
  getDicebearAvatar,
  getDisplayName,
  getLevelFromXp,
  getLocalDayDifference,
} from '../utils';

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
    ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400'
    : tone === 'success'
      ? 'border-success/20 bg-success/10 text-success'
      : 'border-amber-500/20 bg-amber-500/10 text-amber-500';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group rounded-xl border border-line bg-bg-surface/80 p-4 shadow-card hover:border-line-strong transition-all duration-200 ease-out cursor-default"
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border font-semibold transition-all duration-200 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-ink-400">{label}</p>
          <p className="mt-1 truncate font-display text-lg font-black text-ink-100 group-hover:text-amber-500 transition-colors">{value}</p>
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
      <div className="pointer-events-none absolute -right-28 -top-28 hidden h-72 w-72 rounded-full bg-amber-radial blur-3xl opacity-70 transition-opacity duration-500 sm:block group-hover:opacity-90" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 hidden h-72 w-72 rounded-full bg-cyan-radial blur-3xl opacity-60 transition-opacity duration-500 sm:block group-hover:opacity-80" aria-hidden />

      <div className="relative grid gap-6 p-4 sm:p-7 lg:grid-cols-[1fr_360px] lg:p-8">
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-500 backdrop-blur-md transition-all duration-300"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate text-xs font-bold uppercase tracking-[0.2em]">
                  Command Center
                </span>
              </motion.div>
              <div className="hidden items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-cyan-400 text-xs font-bold sm:inline-flex">
                <Bot className="h-3.5 w-3.5" />
                <span>AI Study Mate Ready</span>
              </div>
            </div>

            <h1 className="mt-4 max-w-3xl font-display text-2xl font-black leading-tight text-ink-100 sm:mt-5 sm:text-4xl lg:text-5xl">
              {getGreeting()}, {displayName}.
              <span className="block mt-2 bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
                Keep the streak alive.
              </span>
            </h1>

            <p className="mt-3 hidden max-w-2xl text-sm leading-6 text-ink-300 sm:block sm:text-base">
              Your study pulse, rank pressure, and daily practice targets are gathered here so your next move is always clear.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:mt-8 sm:gap-3 sm:flex-row sm:flex-wrap">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStart}
              className="btn-game justify-center gap-2 px-5 py-3 text-sm font-semibold shadow-glow-amber transition-all duration-200 sm:px-6 sm:py-3.5"
            >
              <Zap className="h-4 w-4" />
              {isDailyDone ? 'Practice More' : 'Start Daily Sprint'}
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAnalytics}
              className="btn-ghost hidden justify-center gap-2 px-6 py-3.5 text-sm font-semibold transition-all duration-200 sm:inline-flex"
            >
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden rounded-2xl border border-line bg-bg-surface/60 p-6 shadow-card hover:shadow-card-hover backdrop-blur-xl transition-all duration-300 lg:block"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-amber-500">Today Progress</p>
              <h2 className="mt-3 font-display text-3xl font-black text-ink-100">{streakDays}<span className="text-amber-500 text-2xl ml-1">🔥</span></h2>
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
              <div className="relative grid h-16 w-16 place-items-center rounded-full border border-line bg-bg-surface shadow-soft">
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

      <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-[220px_1fr]">
        <div className="hidden rounded-2xl border border-line bg-bg-inset p-5 text-center md:block">
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
            <div key={subject.id} className="rounded-xl border border-line bg-bg-surface/70 p-3 sm:p-4">
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
    return dayDiff > 1 ? 0 : base;
  } catch {
    return base;
  }
}

export default function Dashboard({ setActive, user, notify, openProfile }) {
  const [leaderboard, setLeaderboard] = useState([]);
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

  const countdownText = `${daysUntilExam()} days`;
  const level = getLevelFromXp(user?.xp);
  const currentXp = Number(user?.xp || 0);
  const nextLevelXp = (level + 1) * 100;

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
    };
  }, [attempts, averageAccuracy]);

  const tickerItems = ['Daily mission active', 'Rankings are live', 'Open the arena to keep your streak'];

  return (
    <>
      <div className="space-y-6 sm:space-y-8">
        <ScrollReveal className="hidden sm:block">
          <TickerBar items={tickerItems} />
        </ScrollReveal>

        <ScrollReveal delay={0.03}>
          <DashboardHero
            displayName={getDisplayName(user) || 'Grinder'}
            streakDays={streakDays}
            isDailyDone={isDailyDone}
            attemptsToday={attemptsToday}
            countdownText={countdownText}
            onStart={() => setActive('quizzes')}
            onAnalytics={() => setActive('performance')}
          />
        </ScrollReveal>

        {/* Stats Section */}
        <ScrollReveal delay={0.04}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
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
            <div className="hidden lg:block">
              <StatsCard
              icon={Flame}
              label="Streak"
              value={`${streakDays} days`}
              trend={isDailyDone ? 'Daily done!' : 'Complete today'}
              trendPositive={true}
              />
            </div>
            <div className="hidden lg:block">
              <StatsCard
              icon={Zap}
              label="Level"
              value={`${level}`}
              trend={`${currentXp}/${nextLevelXp} XP`}
              trendPositive={true}
              />
            </div>
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

          <ScrollReveal delay={0.1} className="hidden xl:block">
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
        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[1fr_380px]">
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
                      className="rounded-xl border border-line bg-bg-inset p-4 min-w-0"
                    >
                      <p className="font-mono text-[10px] tracking-[0.2em] text-amber-500 truncate">
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
                          className="rounded-lg border border-line bg-bg-raised px-3 py-1.5 text-xs font-semibold text-ink-100 transition-all duration-200 ease-in-out hover:border-cyan-500/40 shrink-0"
                        >
                          Review
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-line bg-bg-inset p-6 text-center">
                  <Activity className="mx-auto h-8 w-8 text-ink-600" />
                  <p className="mt-3 font-display text-base sm:text-lg text-ink-100">
                    No attempts logged yet
                  </p>
                  <p className="mt-1 text-sm text-ink-400">
                    The arena is quiet for now. One sprint changes that.
                  </p>
                  <button
                    onClick={() => setActive('quizzes')}
                    className="btn-game mt-4 text-sm transition-all duration-200 ease-in-out shadow-glow-amber"
                  >
                    Enter the Arena
                  </button>
                </div>
              )}
            </SpotlightCard>
          </ScrollReveal>

          {/* Leaderboard */}
          <ScrollReveal delay={0.1} className="hidden xl:block">
            <SpotlightCard className="p-5 sm:p-7" glow="amber">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
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
                            : 'border-line bg-bg-inset hover:border-amber-500/30'
                        }`}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold text-amber-500 bg-bg-raised">
                          {index + 1}
                        </span>
                        <img
                          src={getDicebearAvatar(person.id, person.avatarStyle)}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg border border-line bg-bg-raised"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm text-ink-100">
                            {getDisplayName(person)}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-ink-400">
                            {isYou ? 'You' : 'Chasing the board'}
                          </p>
                        </div>
                        <p className="font-mono text-sm font-bold text-amber-500 shrink-0">
                          <CountUp to={Number(person.weeklyPoints) || 0} />
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-line bg-bg-inset p-6 text-center">
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
