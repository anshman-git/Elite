import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Aarav Sharma',
      role: 'BCA, 2nd Year',
      text: "EliteStudy's daily MCQs helped me score 90+ in my Data Structures exam. The streak system kept me consistent for 45 days straight! Genuinely changed my study habits.",
      stars: 5,
      avatar: 'AS',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      name: 'Priya Mehta',
      role: 'BCA, 3rd Year',
      text: 'The study notes are incredibly well-organized. I literally stopped buying reference books. The analytics showed me exactly where I was weak, allowing me to focus.',
      stars: 5,
      avatar: 'PM',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      name: 'Rohan Gupta',
      role: 'BCA, 1st Year',
      text: 'The leaderboard competition with my classmates made studying fun for the first time. I went from an average student to a topper in just one semester.',
      stars: 5,
      avatar: 'RG',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Ananya Singh',
      role: 'B.Sc CS, 2nd Year',
      text: 'Love the gamification! The XP system and badges make me want to study more every day. My screen time on social media dropped by 60% after switching to EliteStudy.',
      stars: 4,
      avatar: 'AS',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      name: 'Vikram Patel',
      role: 'BCA, 3rd Year',
      text: 'The analytics dashboard is a game-changer. I can see my progress week by week and know exactly which topics need more work. Best study companion app.',
      stars: 5,
      avatar: 'VP',
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      name: 'Sneha Reddy',
      role: 'BCA, 2nd Year',
      text: 'I was skeptical about another study app, but EliteStudy is different. The quality of questions and notes is genuinely top-tier. Highly recommended for BCA students!',
      stars: 5,
      avatar: 'SR',
      gradient: 'from-rose-500 to-red-500',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
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
    <section id="testimonials" className="py-24 px-6 bg-bg-base relative overflow-hidden">
      <div className="mx-auto max-w-6xl w-full">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-display-lg font-display font-black tracking-tight text-ink-100 mb-4">
            Loved by Students
          </h2>
          <p className="text-base text-ink-200 leading-relaxed font-sans">
            Join thousands of college learners who have upgraded their revision process and achieved academic excellence.
          </p>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {testimonials.map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="cmd-card p-6 border border-line bg-bg-surface flex flex-col justify-between shadow-card hover:shadow-card-hover hover:border-line-strong transition-all duration-200 group cursor-default"
            >
              <div>
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className={`h-4 w-4 ${
                        starIdx < item.stars
                          ? 'fill-amber-500 text-amber-500'
                          : 'fill-ink-600/20 text-ink-600/20'
                      }`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-ink-200 leading-relaxed font-sans italic mb-6">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 border-t border-line-subtle pt-4">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-white font-display font-bold text-xs select-none shadow-soft`}>
                  {item.avatar}
                </div>
                <div>
                  <h4 className="font-display font-bold text-ink-100 text-sm">{item.name}</h4>
                  <p className="text-[10px] text-ink-400 font-semibold">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
