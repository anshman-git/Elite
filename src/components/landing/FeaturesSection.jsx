import { Brain, FileText, Trophy, Flame, BarChart3, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: 'MCQ Practice',
      description: 'Thousands of curated questions across all BCA subjects. Instant feedback, detailed explanations, and adaptive difficulty levels.',
      color: 'bg-amber-500/10 text-amber-500',
      accent: 'border-line hover:border-amber-500/30',
    },
    {
      icon: FileText,
      title: 'Study Notes & PYQs',
      description: 'Comprehensive, well-structured lecture and revision notes for every semester. Highlight, annotate, and learn with active recall helper cards.',
      color: 'bg-cyan-500/10 text-cyan-400',
      accent: 'border-line hover:border-cyan-500/30',
    },
    {
      icon: Trophy,
      title: 'Global Leaderboards',
      description: 'Compete with peers, climb the ranks, and earn your place at the top of the leaderboards. Updated in real-time with XP earned.',
      color: 'bg-amber-500/10 text-amber-500',
      accent: 'border-line hover:border-amber-500/30',
    },
    {
      icon: Flame,
      title: 'Daily Streak System',
      description: 'Build studying habits that stick. Maintain your streak, earn bonus XP multipliers, and challenge your friends to keep their flames lit.',
      color: 'bg-amber-500/10 text-amber-500',
      accent: 'border-line hover:border-amber-500/30',
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Deep, actionable insights into your study habits. Know your strongest subjects, weakest topics, and accuracy/time statistics.',
      color: 'bg-cyan-500/10 text-cyan-400',
      accent: 'border-line hover:border-cyan-500/30',
    },
    {
      icon: Target,
      title: 'Progress Tracking',
      description: 'Visual progress roadmaps for every subject and topic. Track your completion percentage and stay focused on what matters.',
      color: 'bg-success/10 text-success',
      accent: 'border-line hover:border-success/30',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="features" className="py-24 px-6 relative overflow-hidden bg-bg-base">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl w-full">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-display-lg font-display font-black tracking-tight text-ink-100 mb-4">
            Everything You Need to Excel
          </h2>
          <p className="text-base text-ink-200 leading-relaxed font-sans">
            A comprehensive ecosystem of features engineered to make studying effective, engaging, and structured.
          </p>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                variants={cardVariants}
                className={`cmd-card p-6 flex flex-col items-start gap-4 border group cursor-default transition-all duration-200 shadow-card hover:shadow-card-hover ${feature.accent}`}
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${feature.color}`}>
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-ink-100 text-lg mb-2 group-hover:text-amber-500 transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-ink-400 leading-relaxed font-sans">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
