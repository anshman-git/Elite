import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Copy, Flame, Globe2, Trophy, UserCheck, UserPlus, UsersRound, Zap } from 'lucide-react';
import { followUser, unfollowUser, watchCollection, watchDocument, watchUserAttempts } from '../firebase';
import { useApp } from '../context/useApp';
import { navigateToProfile } from '../routing';
import { formatPercent, getDicebearAvatar, getDisplayName, getLevelFromXp, getXpProgress } from '../utils';
import { Button, Card, EmptyState, LoadingState, ProgressBar } from '../components/ui';

const bannerGradients = {
  cyber: 'radial-gradient(circle at top left, rgba(34,211,238,0.26), transparent 30%), radial-gradient(circle at 80% 10%, rgba(168,85,247,0.18), transparent 30%), linear-gradient(135deg, #020617, #0f172a 62%, #020617)',
  neon: 'radial-gradient(circle at top right, rgba(34,211,238,0.22), transparent 30%), radial-gradient(circle at 20% 0%, rgba(192,132,252,0.18), transparent 34%), linear-gradient(180deg, #020617, #111827)',
  aurora: 'radial-gradient(circle at center, rgba(168,85,247,0.22), transparent 30%), radial-gradient(circle at 90% 20%, rgba(34,211,238,0.16), transparent 28%), linear-gradient(135deg, #020617, #0f172a)',
};

export default function PublicProfile({ profileUserId, onBack, notify }) {
  const { user } = useApp();
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSavingFollow, setIsSavingFollow] = useState(false);
  const [activeTab, setActiveTab] = useState('followers');

  useEffect(() => {
    if (!profileUserId) return () => {};

    const unsubscribe = watchDocument('users', profileUserId, (userDoc) => {
      setProfile(userDoc);
      setIsFollowing(Boolean(userDoc?.followers?.includes(user?.uid)));
      setLoading(false);
    }, {
      onError: () => {
        setLoading(false);
        notify?.('Could not load this profile.');
      },
    });

    return unsubscribe;
  }, [profileUserId, notify, user?.uid]);

  useEffect(() => {
    const unsubscribers = [
      watchCollection('users', setLeaderboard, {
        sortField: 'weeklyPoints',
        take: 100,
      }),
      watchUserAttempts(profileUserId, setAttempts, {
        take: 8,
      }),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
  }, [profileUserId]);

  const rank = useMemo(() => {
    const sorted = [...leaderboard].sort(
      (left, right) => (Number(right.weeklyPoints) || 0) - (Number(left.weeklyPoints) || 0),
    );
    const index = sorted.findIndex((person) => person.id === profileUserId);
    return index >= 0 ? index + 1 : '-';
  }, [leaderboard, profileUserId]);

  const socialUsers = useMemo(() => {
    const ids = activeTab === 'followers' ? profile?.followers || [] : profile?.following || [];
    return ids.map((id) => leaderboard.find((person) => person.id === id)).filter(Boolean);
  }, [activeTab, leaderboard, profile]);

  const isOwnProfile = user?.uid === profileUserId;
  const followerCount = profile?.followers?.length || 0;
  const followingCount = profile?.following?.length || 0;

  const handleFollowToggle = async () => {
    if (!user?.uid || !profile?.id || isOwnProfile || isSavingFollow) return;
    const nextFollowing = !isFollowing;
    setIsSavingFollow(true);
    setIsFollowing(nextFollowing);
    setProfile((current) => {
      if (!current) return current;
      const currentFollowers = current.followers || [];
      return {
        ...current,
        followers: nextFollowing
          ? Array.from(new Set([...currentFollowers, user.uid]))
          : currentFollowers.filter((id) => id !== user.uid),
      };
    });

    try {
      if (nextFollowing) {
        await followUser(user.uid, profile.id, getDisplayName(user));
        notify?.('Followed. +5 XP sent their way.');
      } else {
        await unfollowUser(user.uid, profile.id);
        notify?.('Unfollowed.');
      }
    } catch (error) {
      console.error(error);
      setIsFollowing(!nextFollowing);
      notify?.(error.message || 'Could not update follow state.');
    } finally {
      setIsSavingFollow(false);
    }
  };

  const copyProfileLink = async () => {
    const url = `${window.location.origin}/profile/${profileUserId}`;
    try {
      await window.navigator.clipboard.writeText(url);
      notify?.('Profile link copied.');
    } catch {
      notify?.(url);
    }
  };

  if (loading) return <LoadingState />;

  if (!profile) {
    return (
      <Card>
        <p className="font-bold text-white">Profile not found.</p>
        <Button variant="secondary" className="mt-4" onClick={onBack}>
          <ArrowLeft size={17} /> Back
        </Button>
      </Card>
    );
  }

  const achievements = profile.achievements || [];
  const bannerBackground = bannerGradients[profile.bannerStyle] || bannerGradients.cyber;

  return (
    <div className="space-y-5">
      <Button variant="secondary" onClick={onBack}>
        <ArrowLeft size={17} /> Back
      </Button>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[1.75rem] border border-slate-800/90 text-white shadow-[0_35px_120px_-70px_rgba(34,211,238,0.45)]"
        style={{ backgroundImage: bannerBackground }}
      >
        <div className="bg-black/18 p-5 backdrop-blur-[1px] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <motion.img
                src={getDicebearAvatar(profile.id, profile.avatarStyle)}
                alt=""
                className="h-28 w-28 rounded-[1.75rem] border border-cyan-300/30 bg-slate-950 object-cover shadow-[0_0_38px_-12px_rgba(34,211,238,0.8)]"
                whileHover={{ rotate: -2, scale: 1.03 }}
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Weekly rank #{rank}</p>
                <h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{getDisplayName(profile)}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{profile.bio || 'No bio yet.'}</p>
                {profile.website ? (
                  <a href={profile.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 hover:text-white">
                    <Globe2 size={16} /> {profile.website}
                  </a>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={copyProfileLink}>
                <Copy size={17} /> Copy link
              </Button>
              {!isOwnProfile ? (
                <Button variant={isFollowing ? 'secondary' : 'accent'} onClick={handleFollowToggle} disabled={isSavingFollow}>
                  {isFollowing ? <UserCheck size={17} /> : <UserPlus size={17} />}
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <HeroStat label="Followers" value={followerCount} />
            <HeroStat label="Following" value={followingCount} />
            <HeroStat label="Level" value={getLevelFromXp(profile.xp)} />
            <HeroStat label="XP" value={profile.xp || 0} />
          </div>
          <div className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4">
            <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              <span>Progress</span>
              <span>{getXpProgress(profile.xp)}%</span>
            </div>
            <ProgressBar value={getXpProgress(profile.xp)} />
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat icon={Trophy} label="Total points" value={profile.points || 0} />
        <Stat icon={Trophy} label="Weekly" value={profile.weeklyPoints || 0} />
        <Stat icon={Zap} label="Quiz points" value={profile.totalCorrectAnswers || 0} />
        <Stat icon={Flame} label="Streak" value={`${profile.streak || 0}d`} />
        <Stat icon={Flame} label="Best streak" value={`${profile.bestStreak || 0}d`} />
        <Stat icon={UsersRound} label="Average" value={formatPercent(profile.averageScore || 0)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-white">Recent activity</h3>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{attempts.length} shown</span>
          </div>
          {attempts.length ? (
            <div className="mt-4 space-y-3">
              {attempts.slice(0, 5).map((attempt) => (
                <motion.div
                  key={attempt.id}
                  whileHover={{ x: 4 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"
                >
                  <p className="font-bold text-white">{attempt.quizTitle || attempt.subject || 'Quiz attempt'}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {attempt.score}/{attempt.total} correct - {attempt.accuracy || 0}% accuracy
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState title="No public activity" body="Quiz activity appears here after completed attempts." />
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-white">Achievements</h3>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
                {achievements.length} earned
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              {achievements.length ? achievements.map((badge) => (
                <motion.div
                  key={badge}
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-200"
                >
                  {badge}
                </motion.div>
              )) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-6 text-center text-sm text-slate-400">
                  No achievements yet.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-900 p-1">
              {['followers', 'following'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-3 py-2 text-sm font-black capitalize transition ${activeTab === tab ? 'bg-cyan-300 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-4 space-y-2"
              >
                {socialUsers.length ? socialUsers.slice(0, 8).map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => navigateToProfile(person.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-left transition hover:border-cyan-400/50"
                  >
                    <img src={getDicebearAvatar(person.id, person.avatarStyle)} alt="" className="h-10 w-10 rounded-xl bg-slate-950" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">{getDisplayName(person)}</p>
                      <p className="text-xs text-slate-400">LV {getLevelFromXp(person.xp)}</p>
                    </div>
                  </button>
                )) : (
                  <p className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-6 text-center text-sm text-slate-400">
                    No {activeTab} yet.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HeroStat({ label, value }) {
  return (
    <motion.div
      layout
      className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 text-center backdrop-blur-xl"
    >
      <motion.p key={value} initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="text-2xl font-black text-white">
        {value}
      </motion.p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-slate-800 bg-slate-950/95 p-4 text-center shadow-[0_20px_70px_-55px_rgba(0,0,0,0.85)]">
      <Icon className="mx-auto text-cyan-300" size={20} />
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </motion.div>
  );
}
