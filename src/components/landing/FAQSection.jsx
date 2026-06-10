import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'Is EliteStudy really free?',
      answer: "Yes! EliteStudy is completely free to use. We believe quality education should be accessible to every student. All core features including MCQs, syllabus-aligned notes, daily streaks, and leaderboards are available at zero cost.",
    },
    {
      question: 'What subjects are covered?',
      answer: 'We cover all major BCA and college CS subjects, including Data Structures (C++/Java), Database Management Systems (DBMS), Operating Systems, Computer Networks, Web Technologies, Software Engineering, and more. New content is regularly added.',
    },
    {
      question: 'How does the streak system work?',
      answer: 'Complete at least one quiz or read one study note set daily to maintain your streak. Streaks earn you bonus XP multipliers and unlock exclusive badges. Your streak resets at midnight if no activity is logged.',
    },
    {
      question: 'Can I compete with my classmates?',
      answer: 'Absolutely! Our global and weekly leaderboard systems let you compare your XP against peers. You can view other students profiles, compare achievements, and compete for the top weekly slots.',
    },
    {
      question: 'How are the MCQ questions curated?',
      answer: 'Our questions are curated by subject matter experts and experienced educators to map exactly to popular university syllabi. Every question contains a detailed explanation to help you understand the core concepts instead of just memorizing answers.',
    },
    {
      question: 'Is my progress saved across devices?',
      answer: 'Yes! Your progress, streaks, XP, bookmarks, and badges are fully synced to the cloud. You can sign in from any phone, tablet, or laptop and continue studying right where you left off.',
    },
  ];

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 px-6 bg-bg-surface/10 border-t border-line-subtle relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-3xl w-full">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-display-lg font-display font-black tracking-tight text-ink-100 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-ink-200 leading-relaxed font-sans">
            Got questions about EliteStudy? We have got you covered.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="cmd-card border border-line bg-bg-surface overflow-hidden shadow-soft transition-all duration-300"
              >
                {/* Question Row */}
                <button
                  onClick={() => handleToggle(idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-5 text-left outline-none"
                >
                  <span className="font-display font-bold text-sm sm:text-base text-ink-100">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-ink-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-amber-500' : ''
                    }`}
                  />
                </button>

                {/* Answer Row (Animated height) */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 border-t border-line-subtle pt-3 text-sm text-ink-400 leading-relaxed font-sans bg-bg-raised/20">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
