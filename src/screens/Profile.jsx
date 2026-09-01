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
      'radial-gradient(circle at top left, rgba(6,182,212,0.22), transparent 30%), linear-gradient(135deg, rgba(6,182,212,0.12), rgba(255,165,0,0.06))',
  },
  {
    value: 'neon',
    label: 'Neon Flux',
    gradient:
      'radial-gradient(circle at top right, rgba(34,211,238,0.2), transparent 30%), linear-gradient(180deg, rgba(34,211,238,0.1), rgba(244,63,94,0.06))',
  },
  {
    value: 'aurora',
    label: 'Aurora Pulse',
    gradient:
      'radial-gradient(circle at center, rgba(34,211,238,0.16), transparent 28%), linear-gradient(135deg, rgba(168,85,247,0.12), rgba(6,182,212,0.08))',
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
        <div
          className="relative overflow-hidden rounded-2xl border border-line bg-bg-surface shadow-card transition-all duration-300"
          style={{ backgroundImage: bannerBackground }}
        >
          <div className="relative bg-bg-surface/50 p-6 backdrop-blur-md sm:p-8 lg:grid lg:grid-cols-[1.25fr_0.95fr] lg:items-end lg:gap-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
              <div className="relative flex items-center justify-center self-start">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 via-transparent to-amber-500/20 blur-xl" />
                <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full border-4 border-cyan-500/30 bg-bg-surface shadow-soft">
                  <img
                    src={getDicebearAvatar(user?.uid, avatarStyle)}
                    alt="Profile avatar"
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border border-line bg-bg-raised object-cover"
                  />
                  <div className="pointer-events-none absolute -right-1 -bottom-1 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-amber-500 text-bg-base font-display text-xs sm:text-sm font-black shadow-glow-amber">
                    L{level}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-500">
                    Player identity
                  </span>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-500">
                    {activityLabel}
                  </span>
                </div>
                <h1 className="text-3xl font-black font-display tracking-tight text-ink-100 sm:text-4xl lg:text-5xl">
                  {name || getDisplayName(user)}
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-ink-200 sm:text-base">
                  {bio || 'A compact arena profile with streaks, rank, activity, and progression all in one place.'}
                </p>
                <div className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-ink-400 sm:grid-cols-3">
                  <span>{user?.followers?.length || 0} followers</span>
                  <span>{user?.following?.length || 0} following</span>
                  <span>Joined {formatJoined(user?.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:mt-0 sm:text-right">
              <div className="rounded-xl border border-line bg-bg-surface/80 backdrop-blur-md p-5 text-ink-200 shadow-soft">
                <p className="text-xs uppercase tracking-wider font-bold text-ink-400">XP Pool</p>
                <div className="mt-3 flex items-end justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-3xl font-black font-display text-ink-100"><CountUp to={xpValue} /></p>
                    <p className="mt-0.5 text-xs text-ink-400">Total experience</p>
                  </div>
                  <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-500">
                    +{xpToNext} to next
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-xl border border-line bg-bg-surface/80 backdrop-blur-md p-5 text-ink-200 shadow-soft">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider font-bold text-ink-400">
                  <span>Progress to next level</span>
                  <span className="text-ink-100">{xpProgress}%</span>
                </div>
                <ProgressBar value={xpProgress} />
                <div className="rounded-lg border border-line bg-bg-raised/70 px-4 py-3 text-sm text-left">
                  <div className="font-bold text-ink-100">Level {level}</div>
                  <p className="mt-0.5 text-xs text-ink-400">Keep stacking XP to unlock the next tier.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black font-display text-ink-100">Edit profile</h2>
                  <p className="mt-1 text-sm text-ink-400">Refresh your persona, links, and avatar style for the arena.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={copyProfileLink}>
                    <Copy size={17} /> Copy profile link
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={isSaving}>
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
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-400">Avatar style</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {avatarStyles.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setAvatarStyle(style)}
                          className={`rounded-lg border px-4 py-2.5 text-left text-sm font-semibold capitalize transition-all duration-200 ${
                            avatarStyle === style
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-soft'
                              : 'border-line bg-bg-surface text-ink-200 hover:border-line-strong hover:bg-bg-raised hover:text-ink-100'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-400">Banner theme</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {bannerOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setBannerStyle(option.value)}
                          className={`rounded-lg border px-4 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
                            bannerStyle === option.value
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-soft'
                              : 'border-line bg-bg-surface text-ink-200 hover:border-line-strong hover:bg-bg-raised hover:text-ink-100'
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
                trend="Last activity today"
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
                  <h2 className="text-lg font-black font-display text-ink-100">Achievement wall</h2>
                  <p className="mt-1 text-sm text-ink-400">Your earned badges and locked goals.</p>
                </div>
                <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-500">
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
                      className={`rounded-xl border p-4 transition-all duration-200 ${
                        unlocked
                          ? 'border-cyan-500/30 bg-cyan-500/5 text-ink-100 shadow-card-hover'
                          : 'border-line-subtle bg-bg-raised/40 text-ink-400 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`grid h-11 w-11 place-items-center rounded-lg text-xl ${
                          unlocked ? 'bg-cyan-500/15 text-cyan-500' : 'bg-bg-raised text-ink-600'
                        }`}>
                          <Icon size={20} />
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          unlocked ? 'bg-success/15 text-success' : 'bg-bg-raised text-ink-600'
                        }`}>
                          {unlocked ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                      <div className="mt-4 space-y-1">
                        <p className="font-black text-ink-100">{item.title}</p>
                        <p className="text-xs leading-relaxed text-ink-400">{item.description}</p>
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-500">Identity</p>
                  <h2 className="text-2xl sm:text-3xl font-black font-display text-ink-100">Player profile</h2>
                  <p className="mt-1 text-sm text-ink-400">Your stats, streak, and activity in one panel.</p>
                </div>
                <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-500">
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
                  <h2 className="text-lg font-black font-display text-ink-100">Activity heatmap</h2>
                  <p className="mt-1 text-sm text-ink-400">Daily quiz activity for the last 90 days.</p>
                </div>
                <div className="heatmap-legend flex flex-wrap items-center gap-2 text-xs font-medium text-ink-400">
                  <span className="heatmap-legend-dot bg-bg-inset border border-line" /> No activity
                  <span className="heatmap-legend-dot bg-cyan-500/40" /> Light
                  <span className="heatmap-legend-dot bg-cyan-500/70" /> Active
                  <span className="heatmap-legend-dot bg-amber-500" /> Peak
                </div>
              </div>
              <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-bg-surface/50 p-4">
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
                  <div className="rounded-xl border border-dashed border-line bg-bg-raised/40 p-8 text-center text-sm text-ink-400">
                    No activity detected yet. Complete quizzes to populate your heatmap.
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
            <Card>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-500">
                  <UserRound size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider font-bold text-ink-400">Member access</p>
                  <h2 className="text-base sm:text-lg font-black text-ink-100 truncate">{user?.email || 'No email on file'}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-200">
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
    cyan: 'text-cyan-500',
    blue: 'text-cyan-500',
    teal: 'text-success',
    amber: 'text-amber-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-line bg-bg-surface p-4 sm:p-5 shadow-soft transition-all duration-200 hover:border-line-strong hover:shadow-card-hover"
    >
      <p className={`text-2xl sm:text-3xl font-black font-display ${accentClasses[accent] || 'text-cyan-500'}`}>
        <CountUp to={Number(value) || 0} />
      </p>
      <p className="mt-1 text-xs uppercase tracking-wider font-bold text-ink-400">{label}</p>
    </motion.div>
  );
}

function formatJoined(value) {
  const date = value?.toDate?.();
  return date ? date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'recently';
}

