import { motion } from 'framer-motion';
import { CalendarClock, Flame, Play, Quote, TrendingUp, Trophy } from 'lucide-react';
import { activities, leaderboard, subjects } from '../data/mockData';
import { daysUntilExam, formatPercent } from '../utils';
import { Button, Card, EmptyState, ProgressBar } from '../components/ui';

export default function Dashboard({ setActive, user }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-glow dark:bg-white dark:text-slate-950 sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-200 dark:text-blue-700">Welcome back</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {user?.displayName || 'Elite learner'}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 dark:text-slate-600">
              Today is built for one focused quiz, one revision pass, and one clean win.
            </p>
          </div>
          <Button variant="accent" onClick={() => setActive('quizzes')} className="w-full sm:w-auto">
            <Play size={18} /> Start today's quiz
          </Button>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric icon={Flame} label="Streak" value={`${user?.streak || 0} days`} />
        <Metric icon={CalendarClock} label="Exam in" value={`${daysUntilExam()} days`} />
        <Metric icon={TrendingUp} label="Accuracy" value="0%" />
        <Metric icon={Trophy} label="Rank" value="-" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Subjects</p>
              <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Preparation map</h3>
            </div>
            <Button variant="secondary" onClick={() => setActive('performance')}>View stats</Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setActive('quizzes')}
                className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:hover:bg-blue-500/10"
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-black text-white ${subject.tone}`}>
                    {subject.name.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-950 dark:text-white">{subject.name}</h4>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subject.strength}</p>
                  </div>
                  <span className="text-sm font-black text-blue-600">{formatPercent(subject.progress)}</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={subject.progress} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
                <Quote size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-950 dark:text-white">Focus line</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Small daily wins compound faster than last-night panic. Keep the streak honest.
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="font-black text-slate-950 dark:text-white">Leaderboard preview</h3>
            {leaderboard.length ? (
              <div className="mt-3 space-y-3">
                {leaderboard.slice(0, 3).map((person) => (
                  <div key={person.rank} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-xs font-black shadow-sm dark:bg-slate-900">
                        #{person.rank}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{person.name}</span>
                    </div>
                    <span className="text-sm font-black text-blue-600">{person.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3">
                <EmptyState title="No rankings yet" body="Rankings will appear after members complete quizzes." />
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="font-black text-slate-950 dark:text-white">Recent activity</h3>
        {activities.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {activities.map((activity) => (
              <div key={activity} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                {activity}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState title="No activity yet" body="New activity will appear here after this member starts using the app." />
          </div>
        )}
      </Card>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <Card className="p-4">
      <Icon className="text-blue-600" size={21} />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">{value}</p>
    </Card>
  );
}
