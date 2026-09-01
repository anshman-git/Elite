import { ArrowRight, Play, Flame, Trophy, Award, Zap, BookOpen, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection({ onGetStarted }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <section className="relative min-h-[92vh] flex items-center pt-32 pb-20 px-6 overflow-hidden bg-amber-radial dark:bg-cyan-radial">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl -z-10 animate-drift" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl -z-10 animate-drift" style={{ animationDelay: '2s' }} />

      <div className="mx-auto max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Hero Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6 flex flex-col gap-6 text-center lg:text-left z-10"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center self-center lg:self-start gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 backdrop-blur-md">
            <Bot className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
              The Gamified BCA & College Study Suite
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-display-xl font-display font-black tracking-tight text-ink-100 leading-[1.05]"
          >
            Master Your Subjects.<br />
            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
              Crush
            </span>{' '}
            Every Exam.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg leading-relaxed text-ink-200 max-w-xl mx-auto lg:mx-0 font-sans"
          >
            The ultimate companion for college students. Turn tedious study sessions into an exciting adventure with daily sprints, curated PYQs & notes, leaderboards, and personalized analytics.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-2"
          >
            <button
              onClick={onGetStarted}
              className="btn-game px-8 py-4 text-base font-bold shadow-glow-amber w-full sm:w-auto"
              id="hero-cta-primary"
            >
              Start Learning Free
              <ArrowRight className="h-5 w-5" />
            </button>
            <a
              href="#features"
              className="btn-ghost px-8 py-4 text-base font-bold w-full sm:w-auto justify-center"
              id="hero-cta-secondary"
            >
              <Play className="h-4 w-4 fill-ink-100/10 text-ink-100" />
              View Features
            </a>
          </motion.div>

          {/* Micro social proof */}
          <motion.p variants={itemVariants} className="text-xs text-ink-400 font-semibold mt-4">
            🔥 Join <span className="text-amber-500 font-bold">12,000+ BCA & College students</span> leveling up their prep.
          </motion.p>
        </motion.div>

        {/* Hero Preview Card / Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="lg:col-span-6 relative flex justify-center lg:justify-end"
        >
          {/* Main Mockup Card */}
          <div className="w-full max-w-[480px] cmd-card cmd-card-clip grid-bg p-6 border border-line shadow-card backdrop-blur-md rounded-2xl relative">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-danger/80" />
                <span className="w-3 h-3 rounded-full bg-warn/80" />
                <span className="w-3 h-3 rounded-full bg-success/80" />
                <span className="text-xs text-ink-400 font-mono ml-2">elitestudy-dashboard.app</span>
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-bg-raised text-[10px] font-bold text-ink-400 border border-line">
                Level 12
              </div>
            </div>

            {/* Mock Header Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center text-amber-50 font-display font-bold text-lg shadow-soft">
                JD
              </div>
              <div>
                <h4 className="font-display font-bold text-ink-100 text-sm">Jayesh Deshmukh</h4>
                <p className="text-xs text-ink-400">BCA - Semester 4</p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-bg-raised/60 border border-line flex flex-col items-center">
                <Flame className="h-5 w-5 text-amber-500 mb-1" />
                <span className="text-base font-black text-ink-100 font-display">12 Days</span>
                <span className="text-[10px] text-ink-400">Streak</span>
              </div>
              <div className="p-3 rounded-xl bg-bg-raised/60 border border-line flex flex-col items-center">
                <Trophy className="h-5 w-5 text-amber-500 mb-1" />
                <span className="text-base font-black text-ink-100 font-display">#4</span>
                <span className="text-[10px] text-ink-400">Rank</span>
              </div>
              <div className="p-3 rounded-xl bg-bg-raised/60 border border-line flex flex-col items-center">
                <Zap className="h-5 w-5 text-cyan-500 mb-1" />
                <span className="text-base font-black text-ink-100 font-display">2,450</span>
                <span className="text-[10px] text-ink-400">XP</span>
              </div>
            </div>

            {/* Activity Block */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Subject Mastery</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-ink-200">Data Structures (C++)</span>
                    <span className="text-amber-500 font-mono font-bold">78%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-bg-inset border border-line-subtle overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-ink-200">Database Systems</span>
                    <span className="text-cyan-400 font-mono font-bold">65%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-bg-inset border border-line-subtle overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Cards */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-8 -right-6 md:-right-8 p-3 rounded-xl bg-bg-surface/90 border border-line shadow-card flex items-center gap-3 backdrop-blur-md"
          >
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Award className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink-100">Quiz Master</p>
              <p className="text-[10px] text-ink-400">Solved 10+ quizzes</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-6 -left-6 md:-left-8 p-3 rounded-xl bg-bg-surface/90 border border-line shadow-card flex items-center gap-3 backdrop-blur-md"
          >
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink-100">5 Notes Read</p>
              <p className="text-[10px] text-ink-400">Weekly Goal Met</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
