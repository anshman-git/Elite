import { useEffect, useState } from 'react';
import { Flame, Timer } from 'lucide-react';
import { watchCollection } from '../firebase';
import { Card, EmptyState } from '../components/ui';

export default function Leaderboard({ notify }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    return watchCollection('users', setLeaderboard, {
      sortField: 'points',
      take: 50,
      onError: () => notify('Could not load leaderboard from Firestore.'),
    });
  }, [notify]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Leaderboard</p>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">Weekly rankings</h2>
      </div>
      <div className="space-y-3">
        {leaderboard.length ? leaderboard.map((person, index) => (
          <Card key={person.id} className={index === 0 ? 'border-blue-300 bg-blue-50 dark:bg-blue-500/10' : ''}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                  #{index + 1}
                </div>
                <div>
                  <h3 className="font-black text-slate-950 dark:text-white">{person.name || person.displayName || person.email || 'Elite learner'}</h3>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1"><Timer size={14} /> Active member</span>
                    <span className="inline-flex items-center gap-1"><Flame size={14} /> {person.streak || 0} days</span>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-black text-blue-600">{person.points || 0}</p>
            </div>
          </Card>
        )) : (
          <EmptyState title="No rankings yet" body="Rankings will appear after members earn points." />
        )}
      </div>
    </div>
  );
}
