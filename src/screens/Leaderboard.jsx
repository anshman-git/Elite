import { useEffect, useMemo, useState } from 'react';
import { Flame, Timer } from 'lucide-react';
import { watchCollection } from '../firebase';
import { getDisplayName } from '../utils';
import { Card, EmptyState, Button } from '../components/ui';

export default function Leaderboard({ notify, openProfile }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isWeekly, setIsWeekly] = useState(true);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Leaderboard</p>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">
            {isWeekly ? 'Weekly' : 'All-time'} rankings
          </h2>
        </div>
        <div className="flex gap-2">
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
      </div>
      <div className="space-y-3">
        {sortedLeaderboard.length ? sortedLeaderboard.map((person, index) => {
          const badge = index === 0 ? '🥇 Gold' : index === 1 ? '🥈 Silver' : index === 2 ? '🥉 Bronze' : null;
          const highlight = index < 3;
          return (
            <Card
              key={person.id}
              interactive
              className={highlight ? 'cursor-pointer border-blue-300 bg-blue-50 dark:bg-blue-500/10' : 'cursor-pointer'}
              onClick={() => openProfile?.(person.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950 dark:text-white">{getDisplayName(person)}</h3>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1"><Timer size={14} /> Active member</span>
                      <span className="inline-flex items-center gap-1"><Flame size={14} /> {person.streak || 0} days</span>
                      <span className="inline-flex items-center gap-1">{isWeekly ? 'Weekly' : 'Total'}</span>
                      {badge && <span className="inline-flex items-center gap-1">{badge}</span>}
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-black text-blue-600">
                  {isWeekly ? (person.weeklyPoints || 0) : (person.points || 0)}
                </p>
              </div>
            </Card>
          );
        }) : (
          <EmptyState title="No rankings yet" body="Rankings will appear after members earn points." />
        )}
      </div>
    </div>
  );
}
