import { Flame, Trophy, Zap, CheckCircle2, BookOpen, Clock, Target, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export default function DashboardPreview() {
  const chartData = [
    { day: 'Mon', score: 72 },
    { day: 'Tue', score: 85 },
    { day: 'Wed', score: 78 },
    { day: 'Thu', score: 92 },
    { day: 'Fri', score: 88 },
    { day: 'Sat', score: 95 },
    { day: 'Sun', score: 91 },
  ];

  const subjects = [
    { name: 'Data Structures (C++)', progress: 78, color: 'bg-amber-500', text: 'text-amber-500' },
    { name: 'Database Systems', progress: 65, color: 'bg-cyan-500', text: 'text-cyan-400' },
    { name: 'Operating Systems', progress: 52, color: 'bg-amber-400', text: 'text-amber-400' },
    { name: 'Computer Networks', progress: 89, color: 'bg-success', text: 'text-success' },
  ];

  const activities = [
    { icon: CheckCircle2, text: 'Completed OS Quiz - 92%', time: '2h ago' },
    { icon: BookOpen, text: 'Read DBMS Notes Ch.5', time: '5h ago' },
    { icon: Flame, text: 'Extended daily streak! 🔥', time: '1d ago' },
  ];

  const badges = [
    { emoji: '🏆', name: 'Quiz Master' },
    { emoji: '🔥', name: 'Streak King' },
    { emoji: '📚', name: 'Note Taker' },
    { emoji: '⭐', name: 'Top 10' },
  ];

  return (
    <section className="py-24 px-6 relative overflow-hidden bg-bg-surface/10 border-y border-line-subtle">
      {/* Decorative gradients */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-display-lg font-display font-black tracking-tight text-ink-100 mb-4">
            Your Command Center
          </h2>
          <p className="text-base text-ink-200 leading-relaxed font-sans">
            An intuitive study dashboard designed to keep you organized, motivated, and pushing forward every day.
          </p>
        </div>

        {/* 3D Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-5xl mx-auto border border-line-strong rounded-3xl bg-bg-surface/80 dark:bg-bg-surface/50 p-6 md:p-8 shadow-card grid-bg backdrop-blur-md"
        >
          {/* Mock Window Controls */}
          <div className="flex items-center justify-between border-b border-line pb-5 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-danger/80" />
              <span className="w-3.5 h-3.5 rounded-full bg-warn/80" />
              <span className="w-3.5 h-3.5 rounded-full bg-success/80" />
              <span className="text-xs text-ink-400 font-mono ml-3">dashboard.elitestudy.app/home</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-ink-400 bg-bg-raised border border-line px-3 py-1.5 rounded-lg">
              <Calendar className="h-3.5 w-3.5" />
              Exam Prep
            </div>
          </div>

          {/* Top Row: Mini Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Streak Card */}
            <div className="p-4 rounded-xl border border-line bg-bg-surface flex items-center justify-between shadow-card hover:border-line-strong transition-all duration-200">
              <div>
                <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Day Streak</span>
                <h4 className="text-3xl font-black text-ink-100 font-display mt-1">12</h4>
                <p className="text-[10px] text-ink-600 font-semibold mt-0.5">Best: 28 days</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Flame className="h-6 w-6 text-amber-500" />
              </div>
            </div>

            {/* Global Rank Card */}
            <div className="p-4 rounded-xl border border-line bg-bg-surface flex items-center justify-between shadow-card hover:border-line-strong transition-all duration-200">
              <div>
                <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Global Rank</span>
                <h4 className="text-3xl font-black text-ink-100 font-display mt-1">#4</h4>
                <p className="text-[10px] text-success font-bold mt-0.5">Top 2% of platform</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
            </div>

            {/* XP Points Card */}
            <div className="p-4 rounded-xl border border-line bg-bg-surface flex items-center justify-between shadow-card hover:border-line-strong transition-all duration-200">
              <div>
                <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Total XP</span>
                <h4 className="text-3xl font-black text-ink-100 font-display mt-1">2,450</h4>
                <p className="text-[10px] text-success font-bold mt-0.5">+120 XP today</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Middle Row: Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Subject Mastery */}
            <div className="lg:col-span-7 p-5 rounded-xl border border-line bg-bg-surface flex flex-col justify-between shadow-card">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-ink-100 text-sm flex items-center gap-2">
                    <Target className="h-4.5 w-4.5 text-amber-500" />
                    Subject Mastery
                  </h3>
                  <span className="text-xs text-ink-400 font-semibold">4 active courses</span>
                </div>
                <div className="space-y-4">
                  {subjects.map((sub, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-ink-200">{sub.name}</span>
                        <span className={sub.text}>{sub.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-bg-inset border border-line-subtle overflow-hidden">
                        <div className={`h-full ${sub.color} rounded-full transition-all duration-1000`} style={{ width: `${sub.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="lg:col-span-5 p-5 rounded-xl border border-line bg-bg-surface flex flex-col justify-between shadow-card">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-ink-100 text-sm flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-cyan-400" />
                    Recent Activity
                  </h3>
                  <span className="text-xs text-ink-400 font-semibold">Realtime feed</span>
                </div>
                <div className="space-y-3.5">
                  {activities.map((act, idx) => {
                    const ActIcon = act.icon;
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg border border-line flex items-center justify-center text-ink-200 bg-bg-raised">
                            <ActIcon className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-ink-200">{act.text}</span>
                        </div>
                        <span className="text-[10px] text-ink-600 font-bold">{act.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Recharts Chart & Badges */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart Area */}
            <div className="lg:col-span-8 p-5 rounded-xl border border-line bg-bg-surface shadow-card">
              <h3 className="font-display font-bold text-ink-100 text-sm mb-4">Weekly Practice Performance</h3>
              <div className="h-[200px] w-full font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFA500" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#FFA500" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="day" stroke="currentColor" className="text-ink-600" />
                    <YAxis stroke="currentColor" className="text-ink-600" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(var(--color-bg-surface))',
                        borderColor: 'var(--color-line-strong)',
                        borderRadius: '0.75rem',
                        color: 'rgb(var(--color-ink-100))',
                        fontWeight: '600',
                      }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#FFA500" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Badges Area */}
            <div className="lg:col-span-4 p-5 rounded-xl border border-line bg-bg-surface flex flex-col justify-between shadow-card">
              <div>
                <h3 className="font-display font-bold text-ink-100 text-sm mb-3">Earned Achievements</h3>
                <div className="grid grid-cols-2 gap-3">
                  {badges.map((badge, idx) => (
                    <div key={idx} className="p-3 border border-line rounded-lg bg-bg-raised/60 hover:bg-bg-raised transition-colors flex flex-col items-center justify-center text-center">
                      <span className="text-2xl mb-1.5 select-none">{badge.emoji}</span>
                      <span className="text-[10px] font-black text-ink-100 leading-tight">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
