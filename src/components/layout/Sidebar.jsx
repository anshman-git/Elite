import { BarChart3, BookOpen, ChevronLeft, ChevronRight, FileText, Home, Shield, Trophy, User, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { classNames } from '../../utils';

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

function NavList({ items, active, handler, collapsed }) {
  return (
    <nav className="flex flex-col gap-2 mt-6 space-y-1" role="navigation" aria-label="Main navigation">
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <motion.button
            key={item.id}
            onClick={() => handler(item.id)}
            data-testid={item.testId}
            aria-current={isActive ? 'page' : undefined}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * index, duration: 0.35 }}
            className={classNames(
              'group relative flex items-center gap-3 rounded-xl py-3 px-4 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface',
              collapsed && 'justify-center px-3',
              isActive 
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-500 border-l-2 border-amber-500 font-bold shadow-soft' 
                : 'text-ink-300 border-l-2 border-transparent hover:bg-bg-raised/50 hover:text-ink-100 hover:border-amber-500/30 active:bg-amber-500/10 active:text-amber-400'
            )}
            title={collapsed ? item.label : undefined}
          >
            {/* Active indicator dot */}
            {isActive && !collapsed && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute left-0 top-1/2 h-1.5 w-1.5 rounded-full bg-amber-500 -translate-y-1/2 -translate-x-2"
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              />
            )}
            <Icon
              className={classNames(
                'w-5 h-5 shrink-0 transition-all duration-200',
                isActive ? 'text-amber-500' : 'text-ink-400 group-hover:text-amber-400/70 group-focus-visible:text-amber-400'
              )}
            />
            {!collapsed && (
              <span className="font-display text-sm font-semibold tracking-wide truncate">
                {item.label}
              </span>
            )}
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
 *   collapsed — desktop collapsed state (controlled by parent)
 *   onToggleCollapse — toggle desktop collapsed state
 *   isOpen    — mobile drawer open state (controlled by parent)
 *   onClose   — close mobile drawer,collapsed = false, onToggleCollapse 
 */
export function Sidebar({ active, onSelect, setActive, isAdmin = false, isOpen = false, onClose, collapsed = false, onToggleCollapse }) {
  const navigate = onSelect || setActive || (() => {});

  const handler = (id) => {
    navigate(id);
    onClose?.(); // Close drawer on mobile after selecting
  };

  const visibleNav = isAdmin ? nav : nav.filter((item) => item.id !== 'admin');

  return (
    <>
      {/* ── Desktop rail (FIXED positioning) ────────────────────────────── */}
      <aside className={classNames(
        'hidden md:fixed md:flex flex-col border-r border-line backdrop-blur-md py-6 px-3 transition-all duration-300 shrink-0 h-[calc(100vh-4rem)] top-16 left-0 z-20 bg-bg-surface/90 dark:bg-bg-surface/80',
        collapsed ? 'w-20' : 'w-64'
      )}>
        {/* Header with toggle button */}
        <div className="flex items-center justify-between px-2 mb-4">
          {!collapsed && (
            <p className="font-display font-black text-xs tracking-[0.25em] text-amber-500">ELITESTUDY</p>
          )}
          <button
            onClick={onToggleCollapse}
            className={classNames(
              'flex items-center justify-center w-8 h-8 rounded-lg border border-line bg-bg-surface hover:bg-bg-raised text-ink-200 hover:text-ink-100 transition-colors shadow-soft',
              collapsed ? 'mx-auto' : 'ml-auto'
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <NavList items={visibleNav} active={active} handler={handler} collapsed={collapsed} />
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
              className="fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-line shadow-xl py-6 px-3 md:hidden bg-bg-surface/95 dark:bg-bg-surface/90 backdrop-blur-lg"
            >
              {/* Branding strip */}
              <div className="mb-6 px-4">
                <p className="font-display font-black text-[10px] tracking-[0.3em] text-amber-500">ELITESTUDY</p>
                <p className="font-display font-bold text-lg text-ink-100">Navigation</p>
              </div>
              <NavList items={visibleNav} active={active} handler={handler} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
