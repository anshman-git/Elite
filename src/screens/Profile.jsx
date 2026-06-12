import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Copy, Flame, Globe2, LogOut, Moon, Settings, Sparkles, Star, Sunrise, Trophy, UserRound, Zap } from 'lucide-react';
import { logout, updateUser, watchCollection, watchUserAttempts } from '../firebase';
import { CountUp } from '../components/motion/CountUp';
import { useReducedMotion } from '../components/motion/useReducedMotion';
import { formatPercent, getDicebearAvatar, getDisplayName, getLevelFromXp, getXpProgress } from '../utils';
import { Button, Card, Input, ProgressBar, Textarea } from '../components/ui';
import { StatsCard, ProgressRing } from '../components/InteractiveElements';

const bannerOptions = [
  {
    value: 'cyber',
    label: 'Cyber Grid',
    gradient:
      'radial-gradient(circle at top left, rgba(14,165,233,0.24), transparent 28%), linear-gradient(135deg, rgba(15,23,42,0.95), rgba(7,10,25,0.96))',
  },
  {
    value: 'neon',
    label: 'Neon Flux',
    gradient:
      'radial-gradient(circle at top right, rgba(56,189,248,0.22), transparent 30%), linear-gradient(180deg, rgba(15,23,42,0.94), rgba(9,10,25,0.98))',
  },
  {
    value: 'aurora',
    label: 'Aurora Pulse',
    gradient:
      'radial-gradient(circle at center, rgba(34,211,238,0.14), transparent 28%), linear-gradient(135deg, rgba(7,10,25,0.92), rgba(15,23,42,0.9))',
  },
];

const avatarStyles = ['bottts', 'pixel-art', 'identicon', 'avataaars', 'adventurer', 'lorelei', 'notionists'];

const ACHIEVEMENT_DEFINITIONS = [
  { id: 'Perfect Score', title: 'Perfect Score', description: 'Flawless quiz completion.', icon: Flame },
  { id: 'Streak Master', title: 'Streak Master', description: 'Maintain a daily streak for a week.', icon: Zap },
  { id: 'Quiz Explorer', title: 'Quiz Explorer', description: 'Attempt quizzes in 5 different subjects.', icon: Globe2 },
  { id: 'Early Bird', title: 'Early Bird', description: 'Finish a quiz before 8 AM.', icon: Sunrise },
  { id: 'Night Owl', title: 'Night Owl', description: 'Complete a quiz after 11 PM.', icon: Moon },
  { id: 'Rising Star', title: 'Rising Star', description: 'Gain 500 XP in a single week.', icon: Star },
];

function formatDateKey(date) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString().slice(0, 10);
}

function buildHeatmapValues(attempts, activity) {
  const counts = new Map();
  const addDate = (dateValue) => {
    const key = formatDateKey(dateValue);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  };

  if (Array.isArray(activity) && activity.length > 0) {
    activity.forEach((entry) => {
      if (typeof entry === 'string') {
        addDate(entry);
      } else if (entry?.toDate) {
        addDate(entry.toDate());
      } else if (entry?.date) {
        addDate(entry.date);
      }
    });
  } else if (activity && typeof activity === 'object') {
    Object.entries(activity).forEach(([key, count]) => {
      if (Number(count) > 0) {
        addDate(key);
      }
    });
  } else {
    attempts.forEach((attempt) => {
      if (attempt?.completedAt?.toDate) {
        addDate(attempt.completedAt.toDate());
      } else if (attempt?.completedAt) {
        addDate(attempt.completedAt);
      }
    });
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

export default function Profile({ user, notify }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [name, setName] = useState(user?.name || user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [avatarStyle, setAvatarStyle] = useState(user?.avatarStyle || 'bottts');
  const [bannerStyle, setBannerStyle] = useState(user?.bannerStyle || 'cyber');
  const [isSaving, setIsSaving] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    return watchCollection('users', setLeaderboard, {
      sortField: 'weeklyPoints',
      take: 50,
    });
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;
    return watchUserAttempts(user.uid, setAttempts, {
      take: 365,
      onError: () => notify('Could not load activity history.'),
    });
  }, [user?.uid, notify]);

  const rank = useMemo(() => {
    const sorted = [...leaderboard].sort(
      (left, right) => (Number(right.weeklyPoints) || 0) - (Number(left.weeklyPoints) || 0),
    );
    const index = sorted.findIndex((person) => person.id === user?.uid);
    return index >= 0 ? index + 1 : '-';
  }, [leaderboard, user]);

  const bannerBackground = bannerOptions.find((option) => option.value === bannerStyle)?.gradient;
  const heatmapValues = useMemo(() => buildHeatmapValues(attempts, user?.activity), [attempts, user?.activity]);
  const heatmapEndDate = useMemo(() => new Date(), []);
  const heatmapStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 89);
    return date;
  }, []);
  const activityLabel = user?.streak >= 5 ? 'On fire' : heatmapValues.length ? 'Active now' : 'Ready for a run';

  const handleSave = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await updateUser(user.uid, {
        name,
        bio,
        website,
        avatarStyle,
        bannerStyle,
      });
      notify('Profile updated.');
    } catch (error) {
      console.error(error);
      notify('Unable to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyProfileLink = async () => {
    const url = `${window.location.origin}/profile/${user.uid}`;
    try {
      await window.navigator.clipboard.writeText(url);
      notify('Profile link copied.');
    } catch {
      notify(url);
    }
  };

  const achievements = user?.achievements || [];
  const xpValue = Number(user?.xp || 0);
  const xpProgress = getXpProgress(user?.xp);
  const level = getLevelFromXp(user?.xp);
  const xpToNext = xpProgress > 0 ? 100 - xpProgress : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Card>
          <div
            className="relative overflow-hidden rounded-[2rem] border border-slate-700/70 bg-slate-950/90 shadow-[0_30px_90px_-50px_rgba(14,165,233,0.45)]"
            style={{ backgroundImage: bannerBackground }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%)]" />
            <div className="relative grid gap-6 p-6 lg:grid-cols-[1.25fr_0.95fr] lg:items-end">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 via-slate-900/0 to-amber-400/20 blur-2xl" />
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-cyan-400/25 bg-slate-950 shadow-[0_0_40px_-20px_rgba(14,165,233,0.35)]">
                    <img
                      src={getDicebearAvatar(user?.uid, avatarStyle)}
                      alt="Profile avatar"
                      className="h-28 w-28 rounded-full border-2 border-slate-900 bg-slate-950 object-cover"
                    />
                    <div className="pointer-events-none absolute -right-2 -bottom-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-300 text-sm font-black shadow-lg shadow-amber-500/10">
                      L{level}
                    </div>
                  </div>
                </div>
                <div className="space-y-3 text-white">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-cyan-400/20 bg-slate-900/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Player identity</span>
                    <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-amber-300">{activityLabel}</span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{name || getDisplayName(user)}</h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{bio || 'A compact arena profile with streaks, rank, activity, and progression all in one place.'}</p>
                  <div className="grid gap-2 text-sm uppercase tracking-[0.18em] text-slate-400 sm:grid-cols-3">
                    <span>{user?.followers?.length || 0} followers</span>
                    <span>{user?.following?.length || 0} following</span>
                    <span>Joined {formatJoined(user?.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:text-right">
                <div className="rounded-3xl bg-slate-900/85 p-5 text-slate-200 shadow-inner shadow-slate-950/20">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">XP Pool</p>
                  <div className="mt-3 flex items-end gap-4">
                    <div>
                      <p className="text-3xl font-black text-white"><CountUp to={xpValue} /></p>
                      <p className="mt-1 text-sm text-slate-400">Total experience</p>
                    </div>
                    <div className="rounded-3xl bg-slate-950/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      +{xpToNext} to next
                    </div>
                  </div>
                </div>
                <div className="space-y-3 rounded-3xl bg-slate-900/85 p-5 text-slate-200">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                    <span>Progress to next level</span>
                    <span>{xpProgress}%</span>
                  </div>
                  <ProgressBar value={xpProgress} />
                  <div className="rounded-3xl bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
                    <div className="font-bold text-white">Level {level}</div>
                    <p className="mt-1 text-slate-400">Keep stacking XP to unlock the next tier.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white">Edit profile</h2>
                  <p className="mt-1 text-sm text-slate-400">Refresh your persona, links, and avatar style for the cyber arena.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={copyProfileLink}>
                    <Copy size={17} /> Copy profile link
                  </Button>
                  <Button variant="accent" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save profile'}
                  </Button>
                </div>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Input label="Display name" value={name} onChange={setName} placeholder="Enter your handle" />
                  <Input label="Website or socials" value={website} onChange={setWebsite} placeholder="https://" />
                </div>
                <Textarea label="Status / bio" value={bio} onChange={setBio} placeholder="Short mission statement" />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Avatar style</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {avatarStyles.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setAvatarStyle(style)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            avatarStyle === style
                              ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                              : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400/70 hover:bg-slate-800'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Banner theme</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {bannerOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setBannerStyle(option.value)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            bannerStyle === option.value
                              ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                              : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400/70 hover:bg-slate-800'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.075 }}>
            <div className="grid gap-4 md:grid-cols-2">
              <StatsCard
                icon={Trophy}
                label="Rank"
                value={typeof rank === 'number' ? `#${rank}` : rank}
                trend={`Top ${Math.round(100 / (rank || 1))}%`}
                trendPositive={true}
              />
              <StatsCard
                icon={Flame}
                label="Streak"
                value={`${user?.streak || 0} days`}
                trend={`Last activity today`}
                trendPositive={user?.streak > 0}
              />
              <StatsCard
                icon={Globe2}
                label="Followers"
                value={(user?.followers?.length || 0).toString()}
                trend={`${user?.following?.length || 0} following`}
                trendPositive={true}
              />
              <StatsCard
                icon={Star}
                label="Achievements"
                value={achievements.length.toString()}
                trend={`${Math.round((achievements.length / ACHIEVEMENT_DEFINITIONS.length) * 100)}% complete`}
                trendPositive={achievements.length > 0}
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">Achievement wall</h2>
                  <p className="mt-1 text-sm text-slate-400">Your earned badges and locked goals.</p>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan-300">
                  {achievements.length} earned
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {ACHIEVEMENT_DEFINITIONS.map((item) => {
                  const unlocked = achievements.includes(item.id);
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      whileHover={!reducedMotion ? { y: -3 } : {}}
                      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                      className={`rounded-3xl border p-4 transition ${
                        unlocked
                          ? 'border-cyan-400/25 bg-cyan-500/10 text-white shadow-[0_20px_60px_-40px_rgba(34,211,238,0.35)]'
                          : 'border-white/5 bg-slate-900/70 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`grid h-11 w-11 place-items-center rounded-2xl text-xl ${
                          unlocked ? 'bg-cyan-500/15 text-cyan-300' : 'bg-white/5 text-slate-500'
                        }`}>
                          <Icon size={20} />
                        </span>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                          unlocked ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-slate-500'
                        }`}>
                          {unlocked ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                      <div className="mt-4 space-y-1">
                        <p className="font-black text-white">{item.title}</p>
                        <p className="text-sm leading-6 text-slate-400">{item.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Identity</p>
                  <h2 className="text-3xl font-black text-white">Player profile</h2>
                  <p className="mt-1 text-sm text-slate-400">Your stats, streak, and activity in one panel.</p>
                </div>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                  {activityLabel}
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Stat value={user?.xp || 0} label="Total XP" accent="cyan" />
                <Stat value={user?.weeklyPoints || 0} label="Weekly points" accent="amber" />
                <Stat value={user?.quizzesAttempted || 0} label="Quizzes" accent="amber" />
                <Stat value={rank} label="Rank" accent="blue" />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">Activity heatmap</h2>
                  <p className="mt-1 text-sm text-slate-400">Daily quiz activity for the last 90 days.</p>
                </div>
                <div className="heatmap-legend flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="heatmap-legend-dot bg-slate-700" /> No activity
                  <span className="heatmap-legend-dot bg-cyan-500/30" /> Light
                  <span className="heatmap-legend-dot bg-cyan-500/70" /> Active
                  <span className="heatmap-legend-dot bg-amber-400" /> Peak
                </div>
              </div>
              <div className="mt-4 overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/70 p-3">
                {heatmapValues.length ? (
                  <CalendarHeatmap
                    startDate={heatmapStartDate}
                    endDate={heatmapEndDate}
                    values={heatmapValues}
                    gutterSize={3}
                    showWeekdayLabels={true}
                    classForValue={(value) => {
                      if (!value || !value.date) return 'heatmap-day heatmap-day-empty';
                      if (value.count >= 4) return 'heatmap-day heatmap-day-4';
                      if (value.count >= 3) return 'heatmap-day heatmap-day-3';
                      if (value.count >= 2) return 'heatmap-day heatmap-day-2';
                      if (value.count >= 1) return 'heatmap-day heatmap-day-1';
                      return 'heatmap-day heatmap-day-empty';
                    }}
                    titleForValue={(value) =>
                      value?.date
                        ? `${value.count || 0} attempt(s) on ${value.date}`
                        : 'No activity'
                    }
                  />
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-700/70 bg-slate-900/80 p-10 text-center text-sm text-slate-500">
                    No activity detected yet. Complete quizzes to populate your heatmap.
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
            <Card>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-3xl bg-cyan-400/10 text-cyan-300">
                  <UserRound size={20} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Member access</p>
                  <h2 className="text-lg font-black text-white">{user?.email || 'No email on file'}</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Keep your personal dashboard updated for faster rewards and streak tracking. Your profile name shows across the leaderboard and public profile cards.
              </p>
            </Card>
          </motion.div>

          <div className="grid gap-2">
            <Button variant="secondary" onClick={async () => {
              await logout();
              notify('Signed out.');
            }}>
              <LogOut size={17} /> Sign out
            </Button>
            <Button variant="ghost" onClick={() => notify('Account settings are coming soon.')}> 
              <Settings size={17} /> Account settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, accent }) {
  const accentClasses = {
    cyan: 'text-cyan-300',
    blue: 'text-sky-300',
    teal: 'text-emerald-300',
    amber: 'text-amber-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-slate-900/85 p-5 text-white shadow-[0_16px_50px_-35px_rgba(0,0,0,0.55)]"
    >
      <p className={`text-3xl font-black ${accentClasses[accent] || 'text-cyan-300'}`}>
        <CountUp to={Number(value) || 0} />
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
    </motion.div>
  );
}

function formatJoined(value) {
  const date = value?.toDate?.();
  return date ? date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'recently';
}

