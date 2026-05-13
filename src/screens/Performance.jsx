import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { subjects } from '../data/mockData';
import { Card, ProgressBar } from '../components/ui';

export default function Performance() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Analytics</p>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">Performance overview</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><BarChart3 className="text-blue-600" /><p className="mt-3 text-2xl font-black">42</p><p className="text-sm text-slate-500">Quizzes attempted</p></Card>
        <Card><TrendingUp className="text-emerald-600" /><p className="mt-3 text-2xl font-black">84%</p><p className="text-sm text-slate-500">Average accuracy</p></Card>
        <Card><TrendingDown className="text-rose-600" /><p className="mt-3 text-2xl font-black">Stats</p><p className="text-sm text-slate-500">Weakest subject</p></Card>
      </div>
      <Card>
        <h3 className="font-black text-slate-950 dark:text-white">Subject strengths</h3>
        <div className="mt-4 space-y-4">
          {subjects.map((subject) => (
            <div key={subject.id}>
              <div className="mb-2 flex justify-between text-sm font-bold">
                <span>{subject.name}</span>
                <span className="text-blue-600">{subject.progress}%</span>
              </div>
              <ProgressBar value={subject.progress} />
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="font-black text-slate-950 dark:text-white">Weekly progress</h3>
        <div className="mt-4 flex h-48 items-end gap-2">
          {[42, 55, 38, 70, 82, 76, 91].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-2xl bg-blue-600" style={{ height: `${height}%` }} />
              <span className="text-xs font-bold text-slate-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
