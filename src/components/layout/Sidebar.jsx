import { BarChart3, BookOpen, FileText, Home, Shield, Trophy, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const nav = [
  { id: 'dashboard', label: 'Home', icon: Home, testId: 'nav-home-btn' },
  { id: 'quizzes', label: 'Quiz', icon: BookOpen, testId: 'nav-quiz-btn' },
  { id: 'resources', label: 'Files', icon: FileText, testId: 'nav-files-btn' },
  { id: 'community', label: 'Social', icon: Users, testId: 'nav-social-btn' },
  { id: 'leaderboard', label: 'Ranks', icon: Trophy, testId: 'nav-ranks-btn' },
  { id: 'profile', label: 'Profile', icon: User, testId: 'nav-profile-btn' },
  { id: 'admin', label: 'Admin', icon: Shield, testId: 'nav-admin-btn' },
  { id: 'performance', label: 'Performance', icon: BarChart3, testId: 'nav-perf-btn' },
];

export function Sidebar({ active, onSelect, setActive, isAdmin = false }) {
  const handler = onSelect || setActive || (() => {});
  const visibleNav = isAdmin ? nav : nav.filter((item) => item.id !== 'admin');

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-line bg-bg-base/40 backdrop-blur-sm py-6 px-3">
      <nav className="flex flex-col gap-1">
        {visibleNav.map((item, index) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
              <motion.button
                key={item.id}
                onClick={() => handler(item.id)}
              data-testid={item.testId}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.4 }}
              className={clsx(
                'group relative flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-bg-raised',
                'transition-[background-color,color,transform,opacity] duration-200',
                isActive ? 'text-bg-base' : 'text-ink-200 hover:text-ink-100',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-lg bg-ink-100"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className={clsx('relative z-10 w-4 h-4', isActive ? 'text-bg-base' : 'text-ink-400 group-hover:text-amber-400')} />
              <span className="relative z-10 font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}
