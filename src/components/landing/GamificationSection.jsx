import { Zap, Flame, Award, Swords, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GamificationSection() {
  const leaderBoardUsers = [
    { rank: '🥇', name: 'Aarav Sharma', xp: '3,200 XP', active: false },
    { rank: '🥈', name: 'Priya Mehta', xp: '2,890 XP', active: false },
    { rank: '🥉', name: 'You', xp: '2,450 XP', active: true },
  ];

  return (
    <section id="gamification" className="py-24 px-6 relative overflow-hidden bg-bg-surface/10 border-b border-line-subtle">
      {/* Decorative gradients */}
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl w-full">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-display-lg font-display font-black tracking-tight text-ink-100 mb-4">
            Level Up Your Study Game
          </h2>
          <p className="text-base text-ink-200 leading-relaxed font-sans">
            Studying doesn't have to be a chore. EliteStudy turns college learning into an interactive adventure.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* XP Card - Col span 2 */}
          <div className="md:col-span-2 cmd-card p-6 border border-line bg-bg-surface flex flex-col justify-between shadow-soft hover:shadow-glow-amber hover:border-amber-500/30 transition-all duration-300">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Zap className="h-4.5 w-4.5 text-amber-500" />
                </div>
                <h3 className="font-display font-bold text-ink-100 text-base">XP Progression</h3>
              </div>
              <p className="text-xs text-ink-400 font-semibold mb-6">
                Earn experience points (XP) for every correct MCQ solved and study note read. Level up to unlock new avatars and badges.
              </p>
            </div>
            
            {/* Visual Progress bar */}
            <div className="space-y-2 mt-auto">
              <div className="flex justify-between items-end">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-ink-100 font-display">2,450</span>
                  <span className="text-xs text-ink-600 font-bold">/ 3,000 XP</span>
                </div>
                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Level 12</span>
              </div>
              <div className="w-full h-3 rounded-full bg-bg-inset border border-line-subtle overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '81.6%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                />
              </div>
              <p className="text-[10px] text-ink-600 font-bold mt-1">⚡ You need 550 XP more to reach Level 13</p>
            </div>
          </div>

          {/* Weekly Challenge Card - Col span 1 */}
          <div className="cmd-card p-6 border border-line bg-bg-surface flex flex-col justify-between shadow-soft hover:shadow-glow-cyan hover:border-cyan-500/30 transition-all duration-300">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Swords className="h-4.5 w-4.5 text-cyan-500" />
                </div>
                <h3 className="font-display font-bold text-ink-100 text-base">Weekly Challenge</h3>
              </div>
              <p className="text-xs text-ink-400 font-semibold mb-6">
                Complete quests to earn bonus chest multipliers and rank boosts.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line-subtle bg-bg-raised/60 mt-auto">
              <div className="flex justify-between items-start mb-2.5">
                <span className="text-xs font-black text-ink-100">BCA MCQ Crusader</span>
                <span className="text-xs font-bold text-cyan-500">34 / 50</span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-inset border border-line-subtle overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '68%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-cyan-500 rounded-full"
                />
              </div>
              <span className="text-[9px] font-bold text-ink-600">Reward: +500 XP & Silver Badge</span>
            </div>
          </div>

          {/* Ranking System - Col span 1 */}
          <div className="cmd-card p-6 border border-line bg-bg-surface flex flex-col justify-between shadow-soft hover:shadow-glow-amber hover:border-amber-500/30 transition-all duration-300">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Crown className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                </div>
                <h3 className="font-display font-bold text-ink-100 text-base">Competitive Rankings</h3>
              </div>
              <p className="text-xs text-ink-400 font-semibold mb-4">
                Watch yourself scale rankings and push boundaries.
              </p>
            </div>

            <div className="space-y-2.5 mt-auto">
              {leaderBoardUsers.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    item.active
                      ? 'bg-amber-500/10 border-amber-500/30 font-bold'
                      : 'bg-bg-raised/40 border-line-subtle text-ink-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="select-none">{item.rank}</span>
                    <span className="font-sans text-ink-100">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-ink-100 font-display">{item.xp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Flame Card - Col span 1 */}
          <div className="cmd-card p-6 border border-line bg-bg-surface flex flex-col justify-between shadow-soft hover:shadow-glow-amber hover:border-amber-500/30 transition-all duration-300">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Flame className="h-4.5 w-4.5 text-amber-500" />
                </div>
                <h3 className="font-display font-bold text-ink-100 text-base">Daily Streaks</h3>
              </div>
              <p className="text-xs text-ink-400 font-semibold mb-6">
                Consistency is key. Answer 1 MCQ daily to preserve your streak.
              </p>
            </div>

            <div className="mt-auto">
              <div className="flex items-baseline gap-1.5 mb-3.5">
                <span className="text-3xl font-black text-ink-100 font-display">12</span>
                <span className="text-xs text-ink-400 font-bold uppercase tracking-wider">Days Streak</span>
              </div>
              {/* Row of week days */}
              <div className="flex items-center justify-between gap-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                  const active = idx < 5; // Mon-Fri active
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div
                        className={`h-7.5 w-7.5 rounded-lg border flex items-center justify-center text-xs font-bold transition-colors ${
                          active
                            ? 'bg-amber-500 border-amber-600 text-white shadow-glow-amber'
                            : 'bg-bg-inset border-line-subtle text-ink-600'
                        }`}
                      >
                        {active ? '🔥' : day}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Achievement Badges Card - Col span 1 */}
          <div className="cmd-card p-6 border border-line bg-bg-surface flex flex-col justify-between shadow-soft hover:shadow-glow-cyan hover:border-cyan-500/30 transition-all duration-300">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Award className="h-4.5 w-4.5 text-cyan-500 animate-bounce" />
                </div>
                <h3 className="font-display font-bold text-ink-100 text-base">Unlock Badges</h3>
              </div>
              <p className="text-xs text-ink-400 font-semibold mb-6">
                Represent your milestones with pride. Showcase your collection on your profile.
              </p>
            </div>

            <div className="flex items-center justify-around gap-2 mt-auto">
              {[
                { emoji: '📚', name: 'First Quiz' },
                { emoji: '🔥', name: '10d Streak' },
                { emoji: '🏆', name: 'Top 100' },
              ].map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-line-subtle bg-bg-raised/40 w-16">
                  <span className="text-xl select-none">{badge.emoji}</span>
                  <span className="text-[8px] font-black text-ink-200 text-center leading-tight">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
