import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Flame, Play, Quote, TrendingUp, Trophy, Clock } from 'lucide-react';
import { watchCollection, watchExamCountdown, watchSubjects, watchUserAttempts } from '../firebase';
import AttemptReviewModal from '../components/AttemptReviewModal';
import AnnouncementTicker from '../components/AnnouncementTicker';
import { daysUntilExam, formatPercent, getDicebearAvatar, getDisplayName, getLevelFromXp, getXpProgress, getStreakMotivation } from '../utils';
import { Button, Card, EmptyState, ProgressBar } from '../components/ui';

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
      setAttempts([]);
      return () => {};
    }

    unsubscribers.push(watchUserAttempts(user.uid, setAttempts, {
      take: 50,
      onError: () => notify('Could not load your attempt history.'),
    }));
    
    unsubscribers.push(watchSubjects(setSubjects, {
      take: 10,
      onError: () => console.error('Could not load subjects.'),
    }));
    
    return () => unsubscribers.forEach(unsub => unsub?.());
  }, [notify, user?.uid]);

  const getCountdownDisplay = () => {
    if (!examCountdown?.examDate) return null;
    
    const examDate = examCountdown.examDate.toDate ? examCountdown.examDate.toDate() : new Date(examCountdown.examDate);
    const now = new Date();
    const diffTime = examDate - now;
    
    if (diffTime <= 0) return { text: 'Exam has passed', urgent: false };
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return { text: `${diffDays} days ${diffHours} hours left`, urgent: diffDays <= 7 };
    } else if (diffHours > 0) {
      return { text: `${diffHours} hours left`, urgent: true };
    } else {
      return { text: 'Less than 1 hour left', urgent: true };
    }
  };

  const countdownDisplay = getCountdownDisplay();

  return (
    <>
      <AnnouncementTicker />
      <div className="space-y-4 sm:space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.75rem] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_35%),linear-gradient(180deg,#05070f_0%,#0d1221_100%)] p-5 text-white shadow-[0_30px_110px_-80px_rgba(14,165,233,0.35)] sm:p-7"
        >
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <div className="space-y-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Study command center</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {user?.displayName || 'Elite learner'}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 dark:text-slate-600">
                  The mission for today: keep your streak, level up faster, and close the gap on your rivals.
                </p>
              </div>
              <Button variant="accent" onClick={() => setActive('quizzes')} className="w-full sm:w-auto">
                <Play size={18} /> Launch quiz
              </Button>
            </div>

            <div className="grid gap-4 rounded-[1.5rem] border border-slate-800/90 bg-slate-950/80 p-4 shadow-[0_0_60px_-30px_rgba(14,165,233,0.22)] backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Level</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="rounded-2xl bg-cyan-500 px-3 py-1 text-sm font-black text-slate-950 shadow-[0_0_24px_-10px_rgba(14,165,233,0.55)]">LV {getLevelFromXp(user?.xp)}</span>
                    <span className="text-sm font-semibold text-slate-200 dark:text-slate-400">XP {Number(user?.xp || 0)} / next</span>
                  </div>
                </div>
                <div className="flex min-w-[160px] flex-col gap-2 rounded-3xl bg-slate-950/80 px-4 py-3 text-right text-white shadow-inner dark:bg-slate-800/90">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Current rank</p>
                  <p className="text-2xl font-black">#{rank || '-'}</p>
                  <p className="text-xs text-slate-300">Weekly leaderboard pulse</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-300">
                  <span>XP progress</span>
                  <span>{getXpProgress(user?.xp)} / 100</span>
                </div>
                <ProgressBar value={getXpProgress(user?.xp)} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-cyan-200">
                <Flame size={14} /> {user?.streak ? `🔥 ${user.streak} Day Streak` : 'Start your first streak today'}
              </div>
              <p className="text-sm text-slate-300">{getStreakMotivation(user?.streak)}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/90 p-4 text-white shadow-[0_0_40px_-20px_rgba(14,165,233,0.2)]">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Daily pulse</p>
              <p className="mt-2 text-lg font-black">{user?.streak ? `Keep the flame at ${user.streak} days` : 'Take today’s quiz'}</p>
              <p className="mt-2 text-sm text-slate-300">Complete one quiz to secure your streak, earn XP, and climb the weekly leaderboard.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {sortedLeaderboard.slice(0, 3).map((person, index) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => openProfile?.(person.id)}
                  className="group rounded-[1.5rem] border border-slate-800/70 bg-slate-950/80 p-3 text-left transition hover:border-cyan-400/70 hover:bg-cyan-500/10"
                >
                  <div className="flex items-center gap-3">
                    <img src={getDicebearAvatar(person.id)} alt="avatar" className="h-11 w-11 rounded-2xl border border-slate-700/70 object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{getDisplayName(person)}</p>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">#{index + 1}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs font-semibold text-slate-300">
                    <span>{person.weeklyPoints || 0} pts</span>
                    <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-cyan-200">{index === 0 ? 'Gold' : index === 1 ? 'Silver' : 'Bronze'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric icon={Flame} label="Streak" value={`${user?.streak || 0} days`} />
        {examCountdown ? (
          <Metric 
            icon={Clock} 
            label={examCountdown.title || "Exam Countdown"} 
            value={countdownDisplay?.text || 'Calculating...'} 
            urgent={countdownDisplay?.urgent}
          />
        ) : (
          <Metric icon={CalendarClock} label="Exam in" value={`${daysUntilExam()} days`} />
        )}
        <Metric icon={TrendingUp} label="Points" value={user?.points || 0} />
        <Metric icon={Trophy} label="Rank" value={rank || '-'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Subjects</p>
              <h3 className="mt-1 text-xl font-black text-slate-100">Preparation map</h3>
            </div>
            <Button variant="secondary" onClick={() => setActive('performance')}>View stats</Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {subjects.slice(0, 6).map((subject, index) => {
              const subjectAttempts = attempts.filter((attempt) => attempt.subject === subject.name);
              const progress = subjectAttempts.length
                ? Math.round(subjectAttempts.reduce((sum, attempt) => sum + (attempt.accuracy || 0), 0) / subjectAttempts.length)
                : 0;
              const tones = ['bg-cyan-500', 'bg-slate-950 text-white', 'bg-sky-500', 'bg-violet-500', 'bg-cyan-600', 'bg-emerald-500'];
              const tone = subject.tone || tones[index % tones.length];
              return (
                <button
                  key={subject.id}
                  onClick={() => setActive('quizzes')}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-4 text-left transition hover:border-cyan-400/70 hover:bg-cyan-500/10"
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-black text-white ${tone}`}>
                      {subject.name.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-100">{subject.name}</h4>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subject.description || 'No description'}</p>
                    </div>
                    <span className="text-sm font-black text-cyan-300">{formatPercent(progress)}</span>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={progress} />
                  </div>
                </button>
              );
            })}
            {subjects.length === 0 && (
              <div className="col-span-full">
                <EmptyState title="No subjects yet" body="Subjects will be added by administrators." />
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                <Quote size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-100">Focus line</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Small daily wins compound faster than last-night panic. Keep the streak honest.
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="font-black text-slate-100">Leaderboard preview</h3>
            {sortedLeaderboard.length ? (
              <div className="mt-3 space-y-3">
                {sortedLeaderboard.slice(0, 3).map((person, index) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => openProfile?.(person.id)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3 text-left transition hover:border-cyan-400/70 hover:bg-cyan-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900 text-xs font-black text-cyan-300 shadow-sm">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-slate-100">{getDisplayName(person)}</span>
                    </div>
                    <span className="text-sm font-black text-cyan-300">{person.weeklyPoints || 0}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3">
                <EmptyState title="No rankings yet" body="Rankings will appear after members complete quizzes." />
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-black text-slate-100">Attempt history</h3>
          <Button variant="secondary" onClick={() => setActive('performance')}>View all</Button>
        </div>
        {attempts.length ? (
          <div className="mt-3 space-y-3">
            {attempts.slice(0, 6).map((attempt) => (
              <div
                key={attempt.id}
                className="flex flex-col gap-3 rounded-2xl bg-slate-950/95 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-slate-100">
                    {attempt.quizTitle || attempt.subject || 'Quiz attempt'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Score {attempt.score}/{attempt.total} · {attempt.accuracy || 0}% · {formatAttemptDate(attempt.completedAt)}
                  </p>
                </div>
                <Button variant="accent" onClick={() => setReviewAttemptId(attempt.id)}>
                  Review Attempt
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState title="No attempts yet" body="Complete a quiz to see your attempt history here." />
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-black text-slate-100">Recent activity</h3>
        {activities.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {activities.map((activity) => (
              <div key={activity.id} className="rounded-2xl bg-slate-950/90 px-4 py-3 text-sm font-semibold text-slate-300">
                {activity.title}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState title="No activity yet" body="New activity will appear here after this member starts using the app." />
          </div>
        )}
      </Card>
      <AttemptReviewModal attemptId={reviewAttemptId} onClose={() => setReviewAttemptId(null)} />
      </div>
    </>
  );
}

function formatAttemptDate(value) {
  const date = value?.toDate?.();
  return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently';
}

function Metric({ icon: Icon, label, value, urgent }) {
  return (
    <Card className={`p-4 ${urgent ? 'ring-2 ring-red-500/50 bg-slate-900/70' : 'bg-slate-950/95'}`}>
      <Icon className={`text-cyan-300 ${urgent ? 'text-red-600' : ''}`} size={21} />
      <p className={`mt-3 text-xs font-bold uppercase tracking-[0.12em] ${urgent ? 'text-red-600' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-1 text-xl font-black ${urgent ? 'text-red-600' : 'text-slate-100'}`}>{value}</p>
    </Card>
  );
}
