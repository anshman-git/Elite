import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Flame, Trophy } from 'lucide-react';
import { watchCollection, watchDocument } from '../firebase';
import { formatPercent, getDicebearAvatar, getDisplayName, getLevelFromXp, getXpProgress } from '../utils';
import { Button, Card, LoadingState, ProgressBar } from '../components/ui';

export default function PublicProfile({ profileUserId, onBack, notify }) {
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileUserId) return () => {};

    setLoading(true);
    const unsubscribe = watchDocument('users', profileUserId, (userDoc) => {
      setProfile(userDoc);
      setLoading(false);
    }, {
      onError: () => {
        setLoading(false);
        notify?.('Could not load this profile.');
      },
    });

    return unsubscribe;
  }, [profileUserId, notify]);

  useEffect(() => {
    return watchCollection('users', setLeaderboard, {
      sortField: 'weeklyPoints',
      take: 100,
    });
  }, []);

  const rank = useMemo(() => {
    const sorted = [...leaderboard].sort(
      (left, right) => (Number(right.weeklyPoints) || 0) - (Number(left.weeklyPoints) || 0),
    );
    const index = sorted.findIndex((person) => person.id === profileUserId);
    return index >= 0 ? index + 1 : '-';
  }, [leaderboard, profileUserId]);

  if (loading) {
    return <LoadingState />;
  }

  if (!profile) {
    return (
      <Card>
        <p className="font-bold text-slate-950 dark:text-white">Profile not found.</p>
        <Button variant="secondary" className="mt-4" onClick={onBack}>
          <ArrowLeft size={17} /> Back
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="secondary" onClick={onBack}>
        <ArrowLeft size={17} /> Back
      </Button>

      <Card>
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-blue-500/10 bg-slate-950/90 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={getDicebearAvatar(profile?.id)}
              alt="avatar"
              className="h-16 w-16 rounded-3xl border border-white/10 object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-blue-300">Public profile</p>
              <h2 className="mt-2 text-3xl font-black text-white">{getDisplayName(profile)}</h2>
              <p className="mt-1 text-sm text-slate-300">Weekly rank #{rank}</p>
            </div>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-sm font-semibold text-blue-200">Level {getLevelFromXp(profile?.xp)}</p>
            <p className="text-2xl font-black text-white">XP {Number(profile?.xp || 0)}</p>
            <div className="rounded-3xl bg-white/10 p-2">
              <ProgressBar value={getXpProgress(profile?.xp)} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={Trophy} label="Total points" value={profile.points || 0} />
        <Stat icon={Trophy} label="Weekly points" value={profile.weeklyPoints || 0} />
        <Stat label="Quizzes attempted" value={profile.quizzesAttempted || 0} />
        <Stat label="Average score" value={formatPercent(profile.averageScore || 0)} />
        <Stat icon={Flame} label="Streak" value={`${profile.streak || 0} days`} />
        <Stat label="Weekly rank" value={rank} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <Card className="p-4 text-center">
      {Icon ? <Icon className="mx-auto text-blue-600" size={20} /> : null}
      <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="text-xs font-bold text-slate-400">{label}</p>
    </Card>
  );
}
