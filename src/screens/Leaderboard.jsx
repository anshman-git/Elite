import { Flame, Timer } from 'lucide-react';
import { leaderboard } from '../data/mockData';
import { Card } from '../components/ui';

export default function Leaderboard() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Leaderboard</p>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">Weekly rankings</h2>
      </div>
      <div className="space-y-3">
        {leaderboard.map((person) => (
          <Card key={person.rank} className={person.rank === 1 ? 'border-blue-300 bg-blue-50 dark:bg-blue-500/10' : ''}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                  #{person.rank}
                </div>
                <div>
                  <h3 className="font-black text-slate-950 dark:text-white">{person.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1"><Timer size={14} /> {person.time}</span>
                    <span className="inline-flex items-center gap-1"><Flame size={14} /> {person.streak} days</span>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-black text-blue-600">{person.score}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
