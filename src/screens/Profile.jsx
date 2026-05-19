import { useEffect, useMemo, useState } from 'react';
import { Copy, LogOut, Settings, UserRound } from 'lucide-react';
import { logout, updateUser, watchCollection } from '../firebase';
import { formatPercent, getDicebearAvatar, getDisplayName, getLevelFromXp, getXpProgress } from '../utils';
import { Button, Card, Input, ProgressBar, Textarea } from '../components/ui';

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
      'radial-gradient(circle at center, rgba(168,85,247,0.14), transparent 28%), linear-gradient(135deg, rgba(7,10,25,0.92), rgba(15,23,42,0.9))',
  },
];

const avatarStyles = ['bottts', 'pixel-art', 'identicon', 'avataaars', 'adventurer', 'lorelei', 'notionists'];

export default function Profile({ user, notify }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('bottts');
  const [bannerStyle, setBannerStyle] = useState('cyber');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return watchCollection('users', setLeaderboard, {
      sortField: 'weeklyPoints',
      take: 50,
    });
  }, []);

  useEffect(() => {
    setName(user?.name || user?.displayName || '');
    setBio(user?.bio || '');
    setWebsite(user?.website || '');
    setAvatarStyle(user?.avatarStyle || 'bottts');
    setBannerStyle(user?.bannerStyle || 'cyber');
  }, [user]);

  const rank = useMemo(() => {
    const sorted = [...leaderboard].sort(
      (left, right) => (Number(right.weeklyPoints) || 0) - (Number(left.weeklyPoints) || 0),
    );
    const index = sorted.findIndex((person) => person.id === user?.uid);
    return index >= 0 ? index + 1 : '-';
  }, [leaderboard, user?.uid]);

  const bannerBackground = bannerOptions.find((option) => option.value === bannerStyle)?.gradient;

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

  return (
    <div className="space-y-6">
      <Card>
        <div
          className="relative overflow-hidden rounded-[2rem] border border-slate-700/70 bg-slate-950/90 shadow-[0_30px_90px_-50px_rgba(14,165,233,0.45)]"
          style={{ backgroundImage: bannerBackground }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%)]" />
          <div className="relative grid gap-6 p-6 sm:grid-cols-[1.3fr_0.95fr] sm:items-end">
            <div className="flex items-end gap-4">
              <img
                src={getDicebearAvatar(user?.uid, avatarStyle)}
                alt="profile avatar"
                className="h-24 w-24 rounded-[2rem] border border-cyan-400/20 bg-slate-950 object-cover shadow-[0_0_30px_-10px_rgba(14,165,233,0.35)]"
              />
              <div className="space-y-2 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Cyber Scout</p>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{name || getDisplayName(user)}</h1>
                <p className="max-w-xl text-sm text-slate-300 sm:text-base">{bio || 'Keep your mission profile sharp with a new name, badge, and status message.'}</p>
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  <span>{user?.followers?.length || 0} followers</span>
                  <span>{user?.following?.length || 0} following</span>
                  <span>Joined {formatJoined(user?.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:text-right">
              <div className="rounded-3xl bg-slate-900/80 px-5 py-4 text-slate-200 shadow-inner shadow-slate-950/20">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Level</p>
                <p className="mt-2 text-3xl font-black text-white">{getLevelFromXp(user?.xp)}</p>
                <p className="mt-1 text-sm text-slate-400">XP {Number(user?.xp || 0)}</p>
              </div>
              <div className="space-y-2 rounded-3xl bg-slate-900/85 p-4 text-slate-200">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span>Progress to next level</span>
                  <span>{getXpProgress(user?.xp)}%</span>
                </div>
                <ProgressBar value={getXpProgress(user?.xp)} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
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

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">Performance matrix</h2>
                <p className="mt-1 text-sm text-slate-400">Your current streak, quiz total, average score, and rank.</p>
              </div>
              <div className="rounded-3xl bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                Current rank #{rank}
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Stat value={user?.streak || 0} label="Streak" accent="cyan" />
              <Stat value={user?.quizzesAttempted || 0} label="Quizzes" accent="violet" />
              <Stat value={formatPercent(user?.averageScore || 0)} label="Average" accent="blue" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat value={user?.points || 0} label="Points" accent="teal" />
              <Stat value={user?.weeklyPoints || 0} label="Weekly" accent="purple" />
              <Stat value={rank} label="Rank" accent="cyan" />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
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

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">Achievement grid</h2>
                <p className="mt-1 text-sm text-slate-400">Unlock and display earned badges.</p>
              </div>
              <span className="rounded-full border border-cyan-400/20 bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan-300">
                {achievements.length} earned
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {achievements.length > 0 ? (
                achievements.map((badge) => (
                  <div key={badge} className="rounded-2xl border border-slate-700/70 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                    {badge}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-700/70 bg-slate-900 px-4 py-7 text-center text-sm text-slate-400">
                  No achievements yet. Complete quizzes and climb the leaderboard to earn badges.
                </div>
              )}
            </div>
          </Card>

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
    violet: 'text-violet-300',
    blue: 'text-sky-300',
    teal: 'text-emerald-300',
    purple: 'text-fuchsia-300',
  };

  return (
    <div className="rounded-3xl bg-slate-900/85 p-4 text-white shadow-[0_16px_50px_-35px_rgba(0,0,0,0.55)]">
      <p className={`text-3xl font-black ${accentClasses[accent] || 'text-cyan-300'}`}>{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
    </div>
  );
}

function formatJoined(value) {
  const date = value?.toDate?.();
  return date ? date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'recently';
}
