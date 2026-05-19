import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Crown, Flame, Timer, UsersRound, Zap } from 'lucide-react';
import { watchCollection } from '../firebase';
import { getDicebearAvatar, getDisplayName } from '../utils';
import { Card, EmptyState, Button, Input } from '../components/ui';

export default function Leaderboard({ notify, openProfile }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isWeekly, setIsWeekly] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedLeaderboard = useMemo(() => {
    const scoreField = isWeekly ? 'weeklyPoints' : 'points';
    return [...leaderboard].sort((left, right) => {
      const scoreDiff = (Number(right[scoreField]) || 0) - (Number(left[scoreField]) || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return getDisplayName(left).localeCompare(getDisplayName(right));
    });
  }, [leaderboard, isWeekly]);

  useEffect(() => {
    return watchCollection('users', setLeaderboard, {
      sortField: isWeekly ? 'weeklyPoints' : 'points',
      take: 50,
      onError: () => notify('Could not load leaderboard from Firestore.'),
    });
  }, [notify, isWeekly]);

  const rankedLeaderboard = useMemo(() => {
    return sortedLeaderboard.map((person, index) => ({
      ...person,
      originalRank: index + 1,
    }));
  }, [sortedLeaderboard]);

  const filteredLeaderboard = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rankedLeaderboard;
    return rankedLeaderboard.filter((person) => {
      const name = getDisplayName(person).toLowerCase();
      const email = (person.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [searchQuery, rankedLeaderboard]);

  const gapByUserId = useMemo(() => {
    const scoreField = isWeekly ? 'weeklyPoints' : 'points';
    return rankedLeaderboard.reduce((map, person, index) => {
      if (index === 0) {
        map[person.id] = 0;
        return map;
      }
      const previousScore = Number(rankedLeaderboard[index - 1][scoreField]) || 0;
      map[person.id] = previousScore - (Number(person[scoreField]) || 0);
      return map;
    }, {});
  }, [rankedLeaderboard, isWeekly]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(320px,1fr)_auto] xl:grid-cols-[minmax(320px,1fr)_auto_260px]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Leaderboard</p>
          <h2 className="text-2xl font-black text-slate-100">
            {isWeekly ? 'Weekly' : 'All-time'} rankings
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isWeekly ? 'accent' : 'secondary'}
            onClick={() => setIsWeekly(true)}
            className="whitespace-nowrap"
          >
            Weekly
          </Button>
          <Button
            variant={!isWeekly ? 'accent' : 'secondary'}
            onClick={() => setIsWeekly(false)}
            className="whitespace-nowrap"
          >
            All-time
          </Button>
        </div>
        <div>
          <Input
            label="Search users"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name or email"
            className="max-w-full"
          />
        </div>
      </div>
      {rankedLeaderboard.length >= 3 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {rankedLeaderboard.slice(0, 3).map((person) => (
            <Card
              key={person.id}
              interactive
              onClick={() => openProfile?.(person.id)}
              className={`overflow-hidden p-4 ${person.originalRank === 1 ? 'border-cyan-300/60 shadow-[0_0_45px_-18px_rgba(34,211,238,0.8)]' : 'border-violet-300/20'}`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={getDicebearAvatar(person.id, person.avatarStyle)} alt="" className="h-14 w-14 rounded-2xl border border-slate-700 bg-slate-900" />
                  <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">#{person.originalRank}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-black text-white">{getDisplayName(person)}</p>
                  <p className="text-sm font-bold text-cyan-300">{person.weeklyPoints || 0} weekly pts</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
      <div className="space-y-3">
        {filteredLeaderboard.length ? (
          <AnimatePresence>
            {filteredLeaderboard.map((person, index) => {
              const scoreField = isWeekly ? 'weeklyPoints' : 'points';
              const points = Number(person[scoreField]) || 0;
              const best = person.originalRank === 1;
              const gapToAbove = gapByUserId[person.id] || 0;
              const badgeLabel = person.originalRank === 1 ? 'Gold' : person.originalRank === 2 ? 'Silver' : person.originalRank === 3 ? 'Bronze' : null;
              return (
                <motion.div
                  key={person.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card
                    interactive
                    className={best ? 'cursor-pointer border-cyan-400/50 bg-slate-950/95 shadow-[0_0_30px_-12px_rgba(14,165,233,0.35)]' : 'cursor-pointer bg-slate-950/95'}
                    onClick={() => openProfile?.(person.id)}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-lg font-black text-cyan-300 shadow-[0_0_16px_-8px_rgba(14,165,233,0.5)]">
                          #{person.originalRank}
                        </div>
                        <img src={getDicebearAvatar(person.id, person.avatarStyle)} alt="" className="h-12 w-12 rounded-2xl border border-slate-800 bg-slate-900" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-950 dark:text-white">{getDisplayName(person)}</span>
                            {badgeLabel ? (
                              <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-bold text-cyan-200">{badgeLabel}</span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1"><Timer size={12} /> Active</span>
                            <span className="inline-flex items-center gap-1"><Flame size={12} /> {person.streak || 0}d</span>
                            <span className="inline-flex items-center gap-1"><UsersRound size={12} /> {person.followers?.length || 0}</span>
                            <span className="inline-flex items-center gap-1"><Zap size={12} /> XP {person.xp || 0}</span>
                            <span>{isWeekly ? 'Weekly' : 'All-time'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 text-right sm:items-end">
                        <p className={`text-2xl font-black ${best ? 'text-cyan-300' : 'text-slate-100'}`}>
                          {points}
                        </p>
                        {index > 0 ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-xs font-bold text-slate-200">
                            <ArrowUpRight size={12} /> {gapToAbove} pts to overtake
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-1 text-xs font-bold text-cyan-200">
                            <Crown size={12} /> Holding the top spot
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <EmptyState title="No rankings yet" body="Rankings will appear after members earn points." />
        )}
      </div>
    </div>
  );
}
