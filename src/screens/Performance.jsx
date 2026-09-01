import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, BookOpen, CheckCircle, Trophy, TrendingUp, Target, Flame } from 'lucide-react';
import { ResponsiveContainer, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Tooltip } from 'recharts';
import { watchUserAttempts, watchSubjects } from '../firebase';
import AttemptReviewModal from '../components/AttemptReviewModal';
import { useApp } from '../context/useApp';
import { Button, Card, Skeleton } from '../components/ui';
import { CountUp } from '../components/motion/CountUp';
import { useReducedMotion } from '../components/motion/useReducedMotion';
import { getLocalDayDifference, toTimestampDate } from '../utils';
import { StatsCard } from '../components/InteractiveElements';

/* ─── chart tokens ───────────────────────────────────────────────────────────── */
const CHART_TOKENS = {
  polarGrid: 'var(--color-line, rgba(148, 163, 184, 0.2))',
  axisText: 'var(--color-ink-400, #94a3b8)',
  radarStroke: '#22d3ee',
  radarFill: '#ffa500',
  tooltipBg: 'var(--color-bg-surface, #0f172a)',
  tooltipBorder: 'var(--color-line, rgba(148, 163, 184, 0.2))',
  tooltipText: 'var(--color-ink-100, #ffffff)',
};

/* ─── helpers ───────────────────────────────────────────────────────────────── */
function getWeeklyBars(attempts) {
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  attempts.forEach((attempt) => {
    const date = attempt.completedAt?.toDate?.();
    if (!date) return;
    const index = (date.getDay() + 6) % 7;
    buckets[index] = Math.min(100, buckets[index] + 20);
  });
  return buckets;
}

function progressColor(pct) {
  if (pct >= 75) return { bar: 'from-amber-400 to-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/15' };
  if (pct >= 45) return { bar: 'from-cyan-400 to-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/15' };
  if (pct >= 20) return { bar: 'from-ink-400 to-ink-400/60', text: 'text-ink-400', bg: 'bg-bg-raised' };
  return { bar: 'from-danger/70 to-danger', text: 'text-danger', bg: 'bg-danger/15' };
}

function getDayKey(date) {
  const parsed = date instanceof Date ? date : date?.toDate?.();
  return parsed ? `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}` : null;
}

function SubjectBar({ subject, delay }) {
  const col = progressColor(subject.progress);
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-bold text-ink-200">{subject.name}</span>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${col.bg} ${col.text}`}>
            {subject.progress >= 75 ? 'Strong' : subject.progress >= 45 ? 'Good' : subject.progress >= 20 ? 'Improving' : 'Needs Work'}
          </span>
          <span className={`text-sm font-black ${col.text}`}>{subject.progress}%</span>
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-raised border border-line-subtle">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(0, Math.min(1, subject.progress / 100)) }}
          transition={{ delay: delay + 0.1, duration: 0.6, ease: 'easeOut' }}
          className={`h-full origin-left rounded-full bg-gradient-to-r ${col.bar}`}
        />
      </div>
    </motion.div>
  );
}

export default function Performance({ notify }) {
  const { user, notify: globalNotify } = useApp();
  const reducedMotion = useReducedMotion();
  const [attempts, setAttempts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [reviewAttemptId, setReviewAttemptId] = useState(null);
  const [loadedAttemptsUserId, setLoadedAttemptsUserId] = useState(null);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribers = [];

    if (user?.uid) {
      unsubscribers.push(watchUserAttempts(user.uid, (items) => {
        setAttempts(items);
        setLoadedAttemptsUserId(user.uid);
      }, {
        onError: () => globalNotify('Could not load your attempts from Firestore.'),
      }));
    }

    unsubscribers.push(watchSubjects((items) => {
      setSubjects(items);
      setSubjectsLoaded(true);
    }, {
      take: 50,
      onError: () => console.error('Could not load subjects.'),
    }));

    return () => unsubscribers.forEach((unsub) => unsub?.());
  }, [user?.uid, globalNotify]);

  const attemptsLoaded = user?.uid ? loadedAttemptsUserId === user.uid : true;
  const loading = !attemptsLoaded || !subjectsLoaded;

  const averageAccuracy = useMemo(() => (
    attempts.length ? Math.round(attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / attempts.length) : 0
  ), [attempts]);

  const subjectStats = useMemo(() => subjects.map((subject) => {
    const subAttempts = attempts.filter((a) => a.subject === subject.name);
    const progress = subAttempts.length
      ? Math.round(subAttempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / subAttempts.length)
      : 0;
    return { ...subject, progress };
  }), [subjects, attempts]);

  const strongestSubject = useMemo(() => subjectStats
    .filter((s) => s.progress > 0)
    .sort((a, b) => b.progress - a.progress)[0] || null,
  [subjectStats]);

  const weakestSubject = useMemo(() => subjectStats
    .filter((s) => s.progress > 0)
    .sort((a, b) => a.progress - b.progress)[0] || null,
  [subjectStats]);

  const totalXp = useMemo(() => attempts.reduce((sum, a) => sum + (a.xp || (a.score || 0) * 10), 0), [attempts]);
  const weeklyBars = useMemo(() => getWeeklyBars(attempts), [attempts]);
  const maxBar = Math.max(...weeklyBars, 1);
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const radarData = useMemo(() => subjectStats
    .filter((subject) => subject.progress >= 0)
    .sort((left, right) => right.progress - left.progress)
    .slice(0, 6)
    .map((subject) => ({ subject: subject.name, score: subject.progress, fullMark: 100 })),
  [subjectStats]);

  const recentHistory = useMemo(() => [...attempts].sort((left, right) => {
    const leftDate = toTimestampDate(left.completedAt)?.getTime() || 0;
    const rightDate = toTimestampDate(right.completedAt)?.getTime() || 0;
    return rightDate - leftDate;
  }), [attempts]);

  const activityTrend = useMemo(() => {
    const now = new Date();
    const last7 = new Set();
    const prev7 = new Set();

    attempts.forEach((attempt) => {
      const date = toTimestampDate(attempt.completedAt);
      if (!date) return;
      const key = getDayKey(date);
      if (!key) return;
      const diff = getLocalDayDifference(date, now);
      if (diff >= 0 && diff < 7) last7.add(key);
      if (diff >= 7 && diff < 14) prev7.add(key);
    });

    const delta = last7.size - prev7.size;
    const label = delta > 0 ? 'Momentum up' : delta < 0 ? 'Cooling down' : 'Steady pace';
    const detail = delta > 0
      ? 'You are trending toward more active learning days.'
      : delta < 0
        ? 'Daily activity slowed from the previous week.'
        : 'Your activity is consistent week over week.';

    return { label, detail, delta, last7: last7.size, prev7: prev7.size };
  }, [attempts]);

  const xpVelocity = useMemo(() => (attempts.length ? Math.round(totalXp / attempts.length) : 0), [attempts, totalXp]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Player intelligence</p>
        <h2 className="text-3xl font-black text-ink-100 font-display">Performance command center</h2>
        <p className="mt-1 text-sm text-ink-400">Actionable insights from your quiz performance and subject mastery.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.75fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <StatsCard
            icon={BarChart3}
            label="Quizzes Taken"
            value={attempts.length.toString()}
            trend="Total attempts so far"
            trendPositive={true}
          />
          <StatsCard
            icon={TrendingUp}
            label="Avg. Accuracy"
            value={`${averageAccuracy}%`}
            trend={averageAccuracy >= 70 ? 'Strong consistency' : 'Focus on accuracy'}
            trendPositive={averageAccuracy >= 70}
          />
          <StatsCard
            icon={Target}
            label="Weakest Subject"
            value={weakestSubject?.name || '—'}
            trend={weakestSubject ? `${weakestSubject.progress}% accuracy` : 'No data yet'}
            trendPositive={false}
          />
          <StatsCard
            icon={Flame}
            label="XP Velocity"
            value={xpVelocity.toString()}
            trend="Average XP per attempt"
            trendPositive={true}
          />
        </div>

        <div className="rounded-2xl border border-line bg-bg-surface/85 backdrop-blur-md p-6 shadow-card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold">Radar overview</p>
              <h3 className="mt-2 text-lg font-black text-ink-100 font-display">Skill coverage</h3>
            </div>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Live profile
            </span>
          </div>
          <div className="h-[320px] w-full sm:h-[340px]">
            {loading ? (
              <div className="grid h-full place-items-center rounded-2xl border border-dashed border-line bg-bg-raised/40 p-6 text-ink-400">
                <Skeleton className="h-4 w-40" />
              </div>
            ) : radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="65%" margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <PolarGrid stroke={CHART_TOKENS.polarGrid} radialLines={false} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: CHART_TOKENS.axisText, fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Progress"
                    dataKey="score"
                    stroke={CHART_TOKENS.radarStroke}
                    fill={CHART_TOKENS.radarFill}
                    fillOpacity={0.2}
                    animationDuration={reducedMotion ? 0 : 900}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART_TOKENS.tooltipBg,
                      borderColor: CHART_TOKENS.tooltipBorder,
                      borderRadius: 12,
                      color: CHART_TOKENS.tooltipText,
                      boxShadow: 'var(--shadow-card, 0 8px 30px rgba(0,0,0,0.12))',
                    }}
                    labelStyle={{ color: CHART_TOKENS.tooltipText, fontWeight: 700 }}
                    itemStyle={{ color: CHART_TOKENS.tooltipText }}
                    formatter={(value) => [`${value}%`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-2xl border border-dashed border-line bg-bg-raised/40 px-4 text-center text-ink-400">
                <p className="font-semibold">Radar data will appear once subjects are attempted.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4 rounded-2xl border border-line bg-bg-surface/85 backdrop-blur-md p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <h3 className="text-lg font-black text-ink-100 font-display">Performance intelligence</h3>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-xl border border-line bg-bg-raised/60 p-5 transition-colors hover:border-line-strong">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold">Strongest</p>
              <p className="mt-3 text-xl font-black text-ink-100 font-display">{strongestSubject?.name || 'No data yet'}</p>
              <p className="mt-2 text-sm text-ink-400">
                {strongestSubject ? `Highest subject accuracy at ${strongestSubject.progress}%` : 'Attempt quizzes to generate subject ratings.'}
              </p>
            </Card>
            <Card className="rounded-xl border border-line bg-bg-raised/60 p-5 transition-colors hover:border-line-strong">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold">Weakest</p>
              <p className="mt-3 text-xl font-black text-ink-100 font-display">{weakestSubject?.name || 'No data yet'}</p>
              <p className="mt-2 text-sm text-ink-400">
                {weakestSubject ? `Lowest subject accuracy at ${weakestSubject.progress}%` : 'Your weakest subject will surface once you attempt quizzes.'}
              </p>
            </Card>
            <Card className="rounded-xl border border-line bg-bg-raised/60 p-5 transition-colors hover:border-line-strong">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold">Trend</p>
              <p className="mt-3 text-xl font-black text-ink-100 font-display">{activityTrend.label}</p>
              <p className="mt-2 text-sm text-ink-400">{activityTrend.detail}</p>
            </Card>
            <Card className="rounded-xl border border-line bg-bg-raised/60 p-5 transition-colors hover:border-line-strong">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold">Velocity</p>
              <p className="mt-3 text-xl font-black text-ink-100 font-display"><CountUp to={xpVelocity} suffix="xp" /></p>
              <p className="mt-2 text-sm text-ink-400">Average XP earned per quiz attempt.</p>
            </Card>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-bg-surface/85 backdrop-blur-md p-6 shadow-card">
          <div className="mb-5 flex items-center gap-2">
            <BookOpen size={18} className="text-cyan-400" />
            <h3 className="font-black text-ink-100 font-display">Weekly activity</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="flex h-44 items-end gap-2">
              {weeklyBars.map((value, i) => {
                const heightPct = (value / maxBar) * 100;
                const isToday = i === (new Date().getDay() + 6) % 7;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="relative flex h-full w-full flex-col items-end justify-end overflow-hidden rounded-xl bg-bg-raised border border-line-subtle">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(heightPct, 8)}%` }}
                        transition={{ delay: reducedMotion ? 0 : i * 0.05, duration: 0.5, ease: 'easeOut' }}
                        className={`w-full rounded-t-lg ${isToday ? 'bg-gradient-to-t from-amber-500 to-amber-400' : 'bg-gradient-to-t from-cyan-600 to-cyan-400'}`}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ${isToday ? 'text-amber-500 font-bold' : 'text-ink-400'}`}>{DAYS[i]}</span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-xs text-ink-400 flex items-center">
            <span className="inline-flex h-2 w-2 rounded-full bg-cyan-400 mr-2" />Active day
            <span className="ml-4 inline-flex h-2 w-2 rounded-full bg-amber-500 mr-2" />Current day
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-bg-surface/85 backdrop-blur-md p-6 shadow-card">
        <div className="mb-5 flex items-center gap-2">
          <CheckCircle size={18} className="text-cyan-400" />
          <h3 className="font-black text-ink-100 font-display">Recent attempts</h3>
        </div>
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : attempts.length ? (
            <div className="space-y-3">
              {recentHistory.slice(0, 8).map((attempt, index) => {
                const accuracy = attempt.accuracy || 0;
                const col = progressColor(accuracy);
                return (
                  <motion.div
                    key={attempt.id || `${attempt.subject}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reducedMotion ? 0 : index * 0.03, duration: 0.35 }}
                    className="flex items-center gap-4 rounded-xl border border-line bg-bg-raised/50 px-4 py-3 transition hover:border-cyan-500/40 hover:bg-bg-raised/80"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${col.bg}`}>
                      <CheckCircle size={18} className={col.text} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-ink-100">{attempt.quizTitle || attempt.subject || 'Quiz attempt'}</p>
                      <p className="text-xs text-ink-400">{attempt.score}/{attempt.total} correct · {accuracy}% accuracy</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-black ${col.text}`}>{accuracy}%</p>
                      <Button variant="secondary" size="sm" onClick={() => setReviewAttemptId(attempt.id)} className="text-xs rounded-lg">
                        Review
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="grid h-44 place-items-center rounded-2xl border border-dashed border-line bg-bg-raised/40 px-4 text-center text-ink-400">
              <p className="font-semibold">No attempts yet. Complete your first quiz to populate insights.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <AttemptReviewModal attemptId={reviewAttemptId} onClose={() => setReviewAttemptId(null)} />
    </div>
  );
}

