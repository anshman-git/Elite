import { UserPlus, Brain, TrendingUp, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      icon: UserPlus,
      title: 'Create Free Account',
      description: 'Sign up in 30 seconds using Google or your email. Instantly gain access to all features with no credit card required.',
      color: 'from-amber-500 to-amber-600 border-amber-500/30',
    },
    {
      icon: Brain,
      title: 'Practice Daily Quizzes',
      description: 'Test your understanding with fresh, curated MCQs matched to your university syllabus. Get detailed explanations instantly.',
      color: 'from-amber-600 to-cyan-500 border-amber-500/30',
    },
    {
      icon: TrendingUp,
      title: 'Track Performance Analytics',
      description: 'Visualize your progress. Find your strengths and weaknesses automatically computed by our learning algorithm.',
      color: 'from-cyan-500 to-cyan-600 border-cyan-500/30',
    },
    {
      icon: Trophy,
      title: 'Climb The Leaderboards',
      description: 'Earn XP, unlock achievements, and maintain your streak. Compete with peers globally or in your class.',
      color: 'from-cyan-600 to-emerald-500 border-cyan-500/30',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="how-it-works" className="py-24 px-6 bg-bg-base relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-10 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-4xl w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-display-lg font-display font-black tracking-tight text-ink-100 mb-4">
            Start Study in 60 Seconds
          </h2>
          <p className="text-base text-ink-200 leading-relaxed font-sans">
            A simple, habit-forming loop built to streamline your revision process and guarantee academic growth.
          </p>
        </div>

        {/* Timeline Path */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="relative pl-8 md:pl-0"
        >
          {/* Vertical central line */}
          <div className="absolute left-4 md:left-1/2 top-2 bottom-2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-amber-500 via-cyan-500 to-emerald-500 opacity-60" />

          {/* Timeline Steps */}
          <div className="space-y-12">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isEven = idx % 2 === 0;

              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className={`relative flex flex-col md:flex-row items-stretch ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Outer point circle */}
                  <div className="absolute left-4 md:left-1/2 top-4 -translate-x-1/2 flex items-center justify-center z-10">
                    <div className="h-9 w-9 rounded-full bg-bg-surface border border-line-strong flex items-center justify-center font-display font-bold text-xs text-ink-100 shadow-soft">
                      {idx + 1}
                    </div>
                  </div>

                  {/* Spacer for desktop layout alignment */}
                  <div className="hidden md:block w-1/2" />

                  {/* Card Content container */}
                  <div className="w-full md:w-1/2 md:px-8">
                    <div className={`cmd-card p-6 border group hover:shadow-glow-amber transition-all duration-300 bg-bg-surface relative ${step.color}`}>
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-4 ${step.color}`}>
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display font-bold text-ink-100 text-lg mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-ink-400 leading-relaxed font-sans">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
