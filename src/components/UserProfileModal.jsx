import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Trophy, X } from 'lucide-react';
import { watchDocument } from '../firebase';
import { formatPercent, getDicebearAvatar, getDisplayName, getLevelFromXp, getXpProgress } from '../utils';
import { Button, Card, LoadingState, ProgressBar } from './ui';

export default function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loadedUserId, setLoadedUserId] = useState(null);

  useEffect(() => {
    if (!userId) return undefined;

    const unsubscribe = watchDocument('users', userId, (userDoc) => {
      setProfile(userDoc);
      setLoadedUserId(userId);
    }, {
      onError: () => setLoadedUserId(userId),
    });

    return unsubscribe;
  }, [userId]);

  const loading = Boolean(userId && loadedUserId !== userId);

  return (
    <AnimatePresence>
      {userId ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="w-full max-w-md"
            onClick={(event) => event.stopPropagation()}
          >
            <Card className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={getDicebearAvatar(profile?.id)}
                  alt="avatar"
                  className="h-16 w-16 rounded-3xl border border-slate-200/20 object-cover"
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Member profile</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                    {getDisplayName(profile)}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Level {getLevelFromXp(profile?.xp)}</p>
                </div>
              </div>
              <Button variant="ghost" className="h-10 w-10 shrink-0 p-0" onClick={onClose}>
                <X size={18} />
              </Button>
            </div>

              {loading ? (
                <div className="mt-6">
                  <LoadingState />
                </div>
              ) : profile ? (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <ProfileStat icon={Trophy} label="Total points" value={profile.points || 0} />
                  <ProfileStat icon={Trophy} label="Weekly points" value={profile.weeklyPoints || 0} />
                  <ProfileStat label="Quizzes attempted" value={profile.quizzesAttempted || 0} />
                  <ProfileStat label="Average score" value={formatPercent(profile.averageScore || 0)} />
                  <ProfileStat icon={Flame} label="Streak" value={`${profile.streak || 0} days`} className="col-span-2" />
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">Profile could not be loaded.</p>
              )}
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ProfileStat({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={`rounded-2xl bg-slate-50 p-4 dark:bg-white/5 ${className}`}>
      {Icon ? <Icon className="text-blue-600" size={18} /> : null}
      <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}
