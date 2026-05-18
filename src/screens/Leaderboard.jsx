import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Crown, Flame, Timer } from 'lucide-react';
import { watchCollection } from '../firebase';
import { getDisplayName } from '../utils';
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
      <div className="space-y-3">
        {filteredLeaderboard.length ? (
          <AnimatePresence>
            {filteredLeaderboard.map((person, index) => {
              const scoreField = isWeekly ? 'weeklyPoints' : 'points';
              const points = Number(person[scoreField]) || 0;
              const best = person.originalRank === 1;
              const previousScore = index > 0 ? Number(filteredLeaderboard[index - 1][scoreField]) || 0 : 0;
              const gapToAbove = index > 0 ? previousScore - points : 0;
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
