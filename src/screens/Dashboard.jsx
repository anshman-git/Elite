import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, BookOpen, Clock, Flame, TrendingUp, Trophy } from 'lucide-react';
import { watchCollection, watchExamCountdown, watchSubjects, watchUserAttempts } from '../firebase';
import AttemptReviewModal from '../components/AttemptReviewModal';
import { ScrollReveal } from '../components/motion/ScrollReveal';
import { TickerBar } from '../components/motion/TickerBar';
import { CountUp } from '../components/motion/CountUp';
import { SpotlightCard } from '../components/motion/SpotlightCard';
import { MissionCard } from '../components/home/MissionCard';
import { PlayerCard } from '../components/home/PlayerCard';
import { StatGrid } from '../components/home/StatGrid';
import { Roadmap } from '../components/home/Roadmap';
import { DailyFocus } from '../components/home/DailyFocus';
import {
  daysUntilExam,
  getDicebearAvatar,
  getDisplayName,
  getLevelFromXp,
  getStreakMotivation,
} from '../utils';

function getCountdownDisplay(examCountdown) {
  if (!examCountdown?.examDate) return null;

  const examDate = examCountdown.examDate.toDate ? examCountdown.examDate.toDate() : new Date(examCountdown.examDate);
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
  const subjectAttempts = attempts.filter((attempt) => attempt.subject === subject.name);
  if (!subjectAttempts.length) return 0;
  return Math.round(subjectAttempts.reduce((sum, attempt) => sum + (attempt.accuracy || 0), 0) / subjectAttempts.length);
}

function formatAttemptDate(value) {
  const date = value?.toDate?.();
  return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Just now';
}

export default function Dashboard({ setActive, user, notify, openProfile }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [activities, setActivities] = useState([]);
  const [examCountdown, setExamCountdown] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [reviewAttemptId, setReviewAttemptId] = useState(null);

  const sortedLeaderboard = useMemo(
    () => [...leaderboard].sort((left, right) => (Number(right.weeklyPoints) || 0) - (Number(left.weeklyPoints) || 0)),
    [leaderboard],
  );

  const rank = sortedLeaderboard.findIndex((person) => person.id === user?.uid) + 1;
  const displayRank = rank > 0 ? rank : null;

  useEffect(() => {
    const unsubscribers = [];

    unsubscribers.push(watchCollection('users', setLeaderboard, {
      sortField: 'weeklyPoints',
      take: 5,
      onError: () => notify('Could not load leaderboard from Firestore.'),
    }));

    unsubscribers.push(watchCollection('announcements', setActivities, {
      take: 4,
      onError: () => notify('Could not load recent activity from Firestore.'),
    }));

    unsubscribers.push(watchExamCountdown(setExamCountdown));

    if (!user?.uid) {
      const id = setTimeout(() => setAttempts([]), 0);
      return () => clearTimeout(id);
    }

    unsubscribers.push(watchUserAttempts(user.uid, setAttempts, {
      take: 50,
      onError: () => notify('Could not load your attempt history.'),
    }));

    unsubscribers.push(watchSubjects(setSubjects, {
      take: 10,
      onError: () => console.error('Could not load subjects.'),
    }));

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
  }, [notify, user?.uid]);

  const countdownDisplay = getCountdownDisplay(examCountdown);
  const level = getLevelFromXp(user?.xp);
  const currentXp = Number(user?.xp || 0);
  const nextLevelXp = (level + 1) * 100;
  const weeklyPoints = Number(user?.weeklyPoints || 0);
  const points = Number(user?.points || 0);
  const streakDays = Number(user?.streak || 0);

  const isDailyDone = attempts.some((attempt) => {
    if (!attempt.completedAt) return false;
    const date = attempt.completedAt.toDate ? attempt.completedAt.toDate() : new Date(attempt.completedAt);
    return date.toDateString() === new Date().toDateString();
  });

  const topUser = sortedLeaderboard[0];
  const pointsBehindLeader = topUser && topUser.id !== user?.uid
    ? Math.max(0, (Number(topUser.weeklyPoints) || 0) - weeklyPoints)
    : 0;

  const roadmapSubjects = useMemo(() => subjects.slice(0, 5).map((subject, index) => {
    const progress = getSubjectProgress(subject, attempts);
    const status = progress >= 80 ? 'done' : index === 0 || progress > 0 ? 'active' : 'locked';
    return { ...subject, progress, status };
  }), [subjects, attempts]);

  const statTiles = [
    {
      id: 'streak',
      label: 'GRIND STREAK',
      icon: Flame,
      value: `${streakDays} days`,
      sub: streakDays ? getStreakMotivation(streakDays) : 'First spark is waiting.',
      color: 'amber',
    },
    {
      id: 'exam',
      label: 'EXAM TARGET',
      icon: Clock,
      value: countdownDisplay?.text || `${daysUntilExam()} days`,
      sub: countdownDisplay?.urgent ? 'Tick. Tick. Tick.' : 'Keep the pressure steady.',
      color: 'danger',
    },
    {
      id: 'points',
      label: 'TOTAL XP',
      icon: TrendingUp,
      value: points,
      sub: `${Math.max(0, nextLevelXp - currentXp)} to next level`,
      color: 'cyan',
    },
    {
      id: 'rank',
      label: 'GLOBAL RANK',
      icon: Trophy,
      value: displayRank ? `#${displayRank}` : '-',
      sub: pointsBehindLeader ? `${pointsBehindLeader} XP behind #1` : 'Hold the line.',
      color: 'amber',
    },
  ];

  const tickerItems = activities.length
    ? activities.map((item) => item.title || item.body || 'New command center update')
    : ['Daily mission active', 'Rankings are live', 'Open the arena to keep your streak'];

  return (
    <>
      <div className="space-y-8">
        <ScrollReveal>
          <TickerBar items={tickerItems} />
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ScrollReveal className="lg:col-span-2" delay={0.05}>
            <MissionCard
              streakDays={streakDays}
              isDailyDone={isDailyDone}
              streakCopy={streakDays ? getStreakMotivation(streakDays) : 'Grind a quiz to spark your streak.'}
              rewardXp={50}
              onStart={() => setActive('quizzes')}
            />
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <PlayerCard
              name={getDisplayName(user) || 'Grinder'}
              level={level}
              xp={currentXp}
              xpToNext={nextLevelXp}
              rank={displayRank}
              weeklyPoints={weeklyPoints}
              avatarUrl={getDicebearAvatar(user?.uid, user?.avatarStyle)}
            />
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.1}>
          <StatGrid tiles={statTiles} />
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ScrollReveal className="lg:col-span-2">
            <Roadmap
              subjects={roadmapSubjects}
              onAnalytics={() => setActive('performance')}
              onSubjectSelect={() => setActive('quizzes')}
            />
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <DailyFocus />
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <ScrollReveal>
            <SpotlightCard className="p-7" glow="cyan">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  <p className="font-mono text-xs tracking-[0.3em] text-cyan-400">RECENT ATTEMPTS</p>
                </div>
                <button
                  onClick={() => setActive('performance')}
                  className="text-xs font-medium text-ink-400 hover:text-ink-100 transition-colors"
                >
                  View All
                </button>
              </div>

              {attempts.length ? (
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {attempts.slice(0, 3).map((attempt, index) => (
                    <motion.div
                      key={attempt.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.35 }}
                      className="rounded-xl border border-line bg-bg-inset p-4"
                    >
                      <p className="font-mono text-[10px] tracking-[0.2em] text-amber-400">{attempt.subject || 'SPRINT'}</p>
                      <h4 className="mt-2 truncate font-display text-lg text-ink-100">{attempt.quizTitle || 'Quiz sprint'}</h4>
                      <p className="mt-1 text-xs text-ink-400">
                        Score {attempt.score}/{attempt.total} - {attempt.accuracy || 0}% accuracy
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                        <span className="text-[10px] font-semibold text-ink-400">{formatAttemptDate(attempt.completedAt)}</span>
                        <button
                          onClick={() => setReviewAttemptId(attempt.id)}
                          className="rounded-lg border border-line bg-bg-raised px-3 py-1.5 text-xs font-semibold text-ink-100 transition-[background-color,border-color,color] duration-200 hover:border-cyan-500/40"
                        >
                          Review
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-line bg-bg-inset p-6 text-center">
                  <Activity className="mx-auto h-8 w-8 text-ink-600" />
                  <p className="mt-3 font-display text-lg text-ink-100">No attempts logged yet</p>
                  <p className="mt-1 text-sm text-ink-400">The arena is quiet for now. One sprint changes that.</p>
                </div>
              )}
            </SpotlightCard>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <SpotlightCard className="p-7" glow="amber">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <p className="font-mono text-xs tracking-[0.3em] text-amber-500">GRIND MASTERS</p>
              </div>

              {sortedLeaderboard.length ? (
                <div className="mt-6 space-y-3">
                  {sortedLeaderboard.slice(0, 5).map((person, index) => {
                    const isYou = person.id === user?.uid;
                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => openProfile?.(person.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 ${
                          isYou ? 'border-amber-500/50 bg-amber-500/10' : 'border-line bg-bg-inset hover:border-amber-500/30'
                        }`}
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-bg-raised font-mono text-xs font-bold text-amber-400">
                          {index + 1}
                        </span>
                        <img
                          src={getDicebearAvatar(person.id, person.avatarStyle)}
                          alt=""
                          className="h-9 w-9 rounded-lg border border-line bg-bg-raised"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm text-ink-100">{getDisplayName(person)}</p>
                          <p className="text-[10px] uppercase tracking-wider text-ink-400">{isYou ? 'You' : 'Chasing the board'}</p>
                        </div>
                        <p className="font-mono text-sm font-bold text-amber-400">
                          <CountUp to={Number(person.weeklyPoints) || 0} />
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-line bg-bg-inset p-6 text-center">
                  <Trophy className="mx-auto h-8 w-8 text-ink-600" />
                  <p className="mt-3 font-display text-lg text-ink-100">No rankings yet</p>
                  <p className="mt-1 text-sm text-ink-400">Solve quizzes to wake the board.</p>
                </div>
              )}
            </SpotlightCard>
          </ScrollReveal>
        </div>
      </div>

      <AttemptReviewModal attemptId={reviewAttemptId} onClose={() => setReviewAttemptId(null)} />
    </>
  );
}
