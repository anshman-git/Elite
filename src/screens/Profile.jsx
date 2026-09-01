import { useEffect, useMemo, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Copy, Flame, Globe2, LogOut, Moon, Settings, Star, Sunrise, UserRound, Zap } from 'lucide-react';
import { logout, updateUser, watchCollection, watchUserAttempts } from '../firebase';
import { AchievementRegister, AppearanceChoice, LedgerSkeleton, LedgerState, SectionHeader, StudyRecord } from '../components/ledger';
import { Button, Card, Input, Textarea } from '../components/ui';
import { getDicebearAvatar, getDisplayName } from '../utils';

const bannerOptions = [
  { value: 'cyber', label: 'Paper mark' },
  { value: 'neon', label: 'Underline' },
  { value: 'aurora', label: 'Archive' },
];

const avatarStyles = ['bottts', 'pixel-art', 'identicon', 'notionists'];

const ACHIEVEMENT_DEFINITIONS = [
  { id: 'Perfect Score', title: 'Perfect Score', description: 'Complete a flawless quiz.', icon: Flame },
  { id: 'Streak Master', title: 'Streak Master', description: 'Maintain a daily streak for a week.', icon: Zap },
  { id: 'Quiz Explorer', title: 'Quiz Explorer', description: 'Attempt quizzes in five different subjects.', icon: Globe2 },
  { id: 'Early Bird', title: 'Early Bird', description: 'Finish a quiz before 8 AM.', icon: Sunrise },
  { id: 'Night Owl', title: 'Night Owl', description: 'Complete a quiz after 11 PM.', icon: Moon },
  { id: 'Rising Star', title: 'Rising Star', description: 'Gain 500 XP in a single week.', icon: Star },
];

function formatDateKey(date) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-');
}

function buildHeatmapValues(attempts, activity) {
  const counts = new Map();
  const addDate = (dateValue, amount = 1) => {
    const key = formatDateKey(dateValue);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + Math.max(1, Number(amount) || 1));
  };

  if (Array.isArray(activity) && activity.length) {
    activity.forEach((entry) => {
      if (typeof entry === 'string') addDate(entry);
      else if (entry?.toDate) addDate(entry.toDate());
      else if (entry?.date) addDate(entry.date, entry.count);
    });
  } else if (activity && typeof activity === 'object') {
    Object.entries(activity).forEach(([key, count]) => {
      if (Number(count) > 0) addDate(key, count);
    });
  } else {
    attempts.forEach((attempt) => addDate(attempt?.completedAt?.toDate?.() || attempt?.completedAt));
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

function formatJoined(value) {
  const date = value?.toDate?.();
  return date ? new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(date) : 'recently';
}

function ProfileIdentity({ user, avatarStyle }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const displayName = getDisplayName(user);
  const avatarUrl = user?.photoURL || getDicebearAvatar(user?.uid, avatarStyle);

  return (
    <div className="ledger-profile-header">
      <div className="ledger-profile-identity">
        <div className="ledger-profile-avatar">
          {avatarFailed ? (
            <UserRound className="h-7 w-7 text-ink-200" aria-hidden="true" />
          ) : (
            <img src={avatarUrl} alt={`${displayName} profile avatar`} onError={() => setAvatarFailed(true)} loading="lazy" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-ink-100">{displayName}</h2>
          <p className="mt-1 text-sm text-ink-200">{user?.bio || 'Add a short status to your profile.'}</p>
          <p className="mt-2 text-xs text-ink-400">
            {user?.followers?.length || 0} followers · {user?.following?.length || 0} following · Joined {formatJoined(user?.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActivityHeatmap({ values, loading, error, onRetry }) {
  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 89);
    return date;
  }, []);

  return (
    <section>
      <SectionHeader title="Activity" detail="Daily quiz activity · last 90 days" />
      {loading ? (
        <LedgerSkeleton rows={5} />
      ) : error ? (
        <LedgerState
          title="Activity could not be loaded."
          body="Try again to refresh the record."
          tone="error"
          action={<button type="button" onClick={onRetry} className="ledger-text-action">Try again</button>}
        />
      ) : (
        <div className="ledger-heatmap-wrap">
          <div className="mb-3 flex items-center justify-end gap-2 text-[11px] text-ink-400">
            <span>Less</span>
            <span className="heatmap-legend-dot bg-bg-raised" />
            <span className="heatmap-legend-dot bg-success/50" />
            <span className="heatmap-legend-dot bg-accent" />
            <span>More</span>
          </div>
          <div className="overflow-x-auto border-y border-line py-4">
            <CalendarHeatmap
              startDate={startDate}
              endDate={endDate}
              values={values}
              gutterSize={3}
              showWeekdayLabels
              classForValue={(value) => {
                if (!value || !value.date) return 'heatmap-day heatmap-day-empty';
                if (value.count >= 4) return 'heatmap-day heatmap-day-4';
                if (value.count >= 3) return 'heatmap-day heatmap-day-3';
                if (value.count >= 2) return 'heatmap-day heatmap-day-2';
                if (value.count >= 1) return 'heatmap-day heatmap-day-1';
                return 'heatmap-day heatmap-day-empty';
              }}
              titleForValue={(value) => (value?.date ? `${value.count || 0} attempt(s) on ${value.date}` : 'No activity')}
            />
          </div>
        </div>
      )}
    </section>
  );
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
  const [saveState, setSaveState] = useState('idle');
  const [leaderboardStatus, setLeaderboardStatus] = useState('loading');
  const [attemptsStatus, setAttemptsStatus] = useState(user?.uid ? 'loading' : 'ready');
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    return watchCollection('users', (items) => {
      setLeaderboard(items);
      setLeaderboardStatus('ready');
    }, {
      sortField: 'weeklyPoints',
      take: 50,
      onError: () => {
        setLeaderboardStatus('error');
        notify('Rankings could not be loaded.');
      },
    });
  }, [notify, retryToken]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    return watchUserAttempts(user.uid, (items) => {
      setAttempts(items);
      setAttemptsStatus('ready');
    }, {
      take: 365,
      onError: () => {
        setAttemptsStatus('error');
        notify('Activity could not be loaded.');
      },
    });
  }, [user?.uid, notify, retryToken]);

  const userId = user?.uid;
  const activity = user?.activity;
  const rank = useMemo(() => {
    const sorted = [...leaderboard].sort((left, right) => (Number(right.weeklyPoints) || 0) - (Number(left.weeklyPoints) || 0));
    const index = sorted.findIndex((person) => person.id === userId);
    return index >= 0 ? index + 1 : '—';
  }, [leaderboard, userId]);

  const heatmapValues = useMemo(() => buildHeatmapValues(attempts, activity), [attempts, activity]);
  const achievements = user?.achievements || [];
  const activityLabel = user?.streak > 0 ? 'Active today' : heatmapValues.length ? 'Recently active' : 'No activity yet';

  const handleSave = async () => {
    if (!user?.uid || isSaving) return;
    setIsSaving(true);
    setSaveState('saving');
    try {
      await updateUser(user.uid, { name, bio, website, avatarStyle, bannerStyle });
      setSaveState('saved');
      notify('Profile updated.');
      window.setTimeout(() => setSaveState('idle'), 1800);
    } catch (error) {
      console.error(error);
      setSaveState('error');
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

  return (
    <div className="ledger-page space-y-8 sm:space-y-10">
      <header className="ledger-page-header">
        <div>
          <h1 className="ledger-page-title">Profile</h1>
          <p className="mt-2 text-sm text-ink-400">Keep your public identity and study record in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={copyProfileLink} className="ledger-text-action">
            <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy profile link
          </button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving} className="hidden sm:inline-flex">
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save changes'}
          </Button>
        </div>
      </header>

      <ProfileIdentity user={{ ...user, name: name || user?.name, bio }} avatarStyle={avatarStyle} />

      <div className="ledger-profile-grid">
        <section>
          <SectionHeader title="Profile details" detail="Public identity" />
          <Card className="ledger-form-card">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Display name" value={name} onChange={setName} placeholder="Enter your name" />
              <Input label="Website or socials" value={website} onChange={setWebsite} placeholder="https://" />
            </div>
            <Textarea label="Status / bio" value={bio} onChange={setBio} placeholder="Short status" className="mt-5" />
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <AppearanceChoice
                label="Avatar style"
                value={avatarStyle}
                onChange={setAvatarStyle}
                options={avatarStyles.map((style) => ({ value: style, label: style.replace('-', ' ') }))}
              />
              <AppearanceChoice label="Banner pattern" value={bannerStyle} onChange={setBannerStyle} options={bannerOptions} />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5 sm:hidden">
              <Button variant="primary" onClick={handleSave} disabled={isSaving} className="w-full">
                {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save changes'}
              </Button>
            </div>
            {saveState === 'error' ? <p className="mt-3 text-sm text-focus" role="alert">Unable to save profile. Your changes are still here.</p> : null}
          </Card>
        </section>

        <section>
          <SectionHeader title="Study record" detail="Current totals" />
          {leaderboardStatus === 'error' ? (
            <LedgerState title="Rank is unavailable" body="Other study totals are still shown." />
          ) : null}
          <StudyRecord user={user} rank={rank} quizzes={attempts.length} />
          <div className="mt-5 flex items-center gap-2 text-xs text-ink-400">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            {activityLabel}
          </div>
        </section>
      </div>

      <ActivityHeatmap
        values={heatmapValues}
        loading={attemptsStatus === 'loading'}
        error={attemptsStatus === 'error'}
        onRetry={() => setRetryToken((value) => value + 1)}
      />

      <section>
        <SectionHeader title="Achievements" detail={`${achievements.length} of ${ACHIEVEMENT_DEFINITIONS.length} earned`} />
        <AchievementRegister definitions={ACHIEVEMENT_DEFINITIONS} earnedIds={achievements} />
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5 text-xs">
        <p><span className="text-ink-400">Signed in as</span> <span className="ml-2 text-ink-200">{user?.email || 'No email on file'}</span></p>
        <div className="flex items-center gap-5">
          <button type="button" onClick={() => notify('Account settings are coming soon.')} className="ledger-text-action"><Settings className="h-3.5 w-3.5" aria-hidden="true" /> Account settings</button>
          <button type="button" onClick={async () => { await logout(); notify('Signed out.'); }} className="ledger-text-action"><LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out</button>
        </div>
      </footer>
    </div>
  );
}
