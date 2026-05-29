import { BarChart3, BookOpen, FileText, Home, Shield, Trophy, User, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

const nav = [
  { id: 'dashboard',   label: 'Home',        icon: Home,     testId: 'nav-home-btn' },
  { id: 'quizzes',     label: 'Quiz',         icon: BookOpen, testId: 'nav-quiz-btn' },
  { id: 'resources',   label: 'Files',        icon: FileText, testId: 'nav-files-btn' },
  { id: 'community',   label: 'Social',       icon: Users,    testId: 'nav-social-btn' },
  { id: 'leaderboard', label: 'Ranks',        icon: Trophy,   testId: 'nav-ranks-btn' },
  { id: 'profile',     label: 'Profile',      icon: User,     testId: 'nav-profile-btn' },
  { id: 'admin',       label: 'Admin',        icon: Shield,   testId: 'nav-admin-btn' },
  { id: 'performance', label: 'Performance',  icon: BarChart3,testId: 'nav-perf-btn' },
];

function NavList({ items, active, handler }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <motion.button
            key={item.id}
            onClick={() => handler(item.id)}
            data-testid={item.testId}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * index, duration: 0.35 }}
            className={clsx(
              'group relative flex items-center gap-3 px-4 py-3 rounded-lg text-left',
              'transition-[background-color,color] duration-200',
              isActive ? 'text-bg-base' : 'text-ink-200 hover:bg-bg-raised hover:text-ink-100',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-lg bg-ink-100"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Icon
              className={clsx(
                'relative z-10 w-4 h-4 shrink-0',
                isActive ? 'text-bg-base' : 'text-ink-400 group-hover:text-amber-400',
              )}
            />
            <span className="relative z-10 font-medium">{item.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}

/**
 * Sidebar — desktop rail + mobile slide-in drawer.
 *
 * Props:
 *   active    — current screen id
 *   onSelect / setActive — navigation handler
 *   isAdmin   — show admin item
 *   isOpen    — mobile drawer open state (controlled by parent)
 *   onClose   — close mobile drawer
 */
export function Sidebar({ active, onSelect, setActive, isAdmin = false, isOpen = false, onClose }) {
  const navigate = onSelect || setActive || (() => {});

  const handler = (id) => {
    navigate(id);
    onClose?.(); // Close drawer on mobile after selecting
  };

  const visibleNav = isAdmin ? nav : nav.filter((item) => item.id !== 'admin');

  return (
    <>
      {/* ── Desktop rail (always visible on md+) ─────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-line bg-bg-base/40 backdrop-blur-sm py-6 px-3">
        <NavList items={visibleNav} active={active} handler={handler} />
      </aside>

      {/* ── Mobile drawer (slide in from left) ───────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-ink-100/30 backdrop-blur-sm md:hidden"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-line bg-bg-base shadow-xl py-6 px-3 md:hidden"
            >
              {/* Branding strip */}
              <div className="mb-6 px-4">
                <p className="font-mono text-[9px] tracking-[0.3em] text-amber-500">ELITESTUDY</p>
                <p className="font-display text-sm text-ink-100">Navigation</p>
              </div>
              <NavList items={visibleNav} active={active} handler={handler} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
