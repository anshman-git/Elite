import { BarChart3, BookOpen, ChevronLeft, ChevronRight, Home, Shield, Trophy, User, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { classNames, confirmLeaveQuiz, getDisplayName, getDicebearAvatar } from '../../utils';

const nav = [
  { id: 'dashboard', path: '/', label: 'Today', icon: Home, testId: 'nav-home-btn' },
  { id: 'quizzes', path: '/quizzes', label: 'Practice', icon: BookOpen, testId: 'nav-quiz-btn' },
  { id: 'performance', path: '/performance', label: 'Progress', icon: BarChart3, testId: 'nav-perf-btn' },
  { id: 'leaderboard', path: '/leaderboard', label: 'Rankings', icon: Trophy, testId: 'nav-ranks-btn' },
  { id: 'community', path: '/community', label: 'Community', icon: Users, testId: 'nav-social-btn' },
  { id: 'profile', path: '/profile', label: 'Profile', icon: User, testId: 'nav-profile-btn' },
  { id: 'admin', path: '/admin', label: 'Admin', icon: Shield, testId: 'nav-admin-btn' },
];

function NavList({ items, active, handler, collapsed = false }) {
  return (
    <nav className="mt-7 flex flex-col gap-1" role="navigation" aria-label="Main navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            onClick={(e) => handler(e, item.id)}
            data-testid={item.testId}
            aria-current={isActive ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
            className={classNames(
              'ledger-focus-ring group flex min-h-11 items-center gap-3 border-l-2 px-3 text-left text-ink-400 transition-colors duration-150',
              collapsed ? 'justify-center px-0' : 'rounded-r-md',
              isActive
                ? 'border-accent bg-bg-raised text-accent'
                : 'border-transparent hover:border-line-strong hover:bg-bg-raised hover:text-ink-100',
            )}
          >
            <Icon
              className={classNames(
                'h-[18px] w-[18px] shrink-0 stroke-[1.8]',
                isActive ? 'text-accent' : 'text-ink-400 group-hover:text-ink-100',
              )}
              aria-hidden="true"
            />
            {!collapsed ? <span className="truncate text-sm font-semibold">{item.label}</span> : null}
          </NavLink>
        );
      })}
    </nav>
  );
}

function ProfileCard({ user, collapsed, onClick }) {
  const displayName = getDisplayName(user);
  const avatar = user?.photoURL || getDicebearAvatar(user?.uid);
  const handleClick = (e) => {
    if (e && !confirmLeaveQuiz()) {
      e.preventDefault();
      return;
    }
    onClick?.('profile');
  };

  if (collapsed) {
    return (
      <NavLink
        to="/profile"
        onClick={handleClick}
        className="ledger-focus-ring mx-auto grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-line bg-bg-surface transition-colors hover:border-line-strong"
        title={displayName}
        aria-label="Open profile"
      >
        <img src={avatar} alt={displayName} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
      </NavLink>
    );
  }

  return (
    <NavLink
      to="/profile"
      onClick={handleClick}
      className="ledger-focus-ring flex min-h-11 w-full items-center gap-3 rounded-md px-2 text-left transition-colors hover:bg-bg-raised"
      aria-label="Open profile"
    >
      <img src={avatar} alt={displayName} className="h-8 w-8 shrink-0 rounded-full border border-line object-cover" loading="lazy" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink-100">{displayName}</p>
        {user?.email ? <p className="mt-0.5 truncate text-[11px] text-ink-400">{user.email}</p> : null}
      </div>
    </NavLink>
  );
}

/** Desktop compact rail and mobile overflow drawer. */
export function Sidebar({ active, onSelect, setActive, isAdmin = false, isOpen = false, onClose, collapsed = true, onToggleCollapse, user }) {
  const navigate = onSelect || setActive || (() => {});
  const handler = (e, id) => {
    if (e && !confirmLeaveQuiz()) {
      e.preventDefault(); // block NavLink navigation while a quiz is active
      return;
    }
    navigate(id);
    onClose?.();
  };
  const visibleNav = isAdmin ? nav : nav.filter((item) => item.id !== 'admin');
  const primaryNav = visibleNav.filter((item) => item.id !== 'admin');
  const adminNav = visibleNav.filter((item) => item.id === 'admin');

  return (
    <>
      <aside
        className={classNames(
          'ledger-sidebar fixed left-0 top-16 z-20 hidden h-[calc(100vh-4rem)] flex-col border-r border-line bg-bg-base px-3 py-5 md:flex',
          collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-expanded-width)]',
        )}
        aria-label="Desktop navigation"
      >
        <div className={classNames('flex items-center', collapsed ? 'justify-center' : 'justify-end')}>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="ledger-focus-ring grid h-11 w-11 place-items-center rounded-md border border-line bg-bg-surface text-ink-200 transition-colors hover:border-line-strong hover:text-ink-100"
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? <ChevronRight className="h-[17px] w-[17px]" aria-hidden="true" /> : <ChevronLeft className="h-[17px] w-[17px]" aria-hidden="true" />}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavList items={primaryNav} active={active} handler={handler} collapsed={collapsed} />
          {adminNav.length ? (
            <div className="mt-6 border-t border-line pt-4">
              <NavList items={adminNav} active={active} handler={handler} collapsed={collapsed} />
            </div>
          ) : null}
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <ProfileCard user={user} collapsed={collapsed} onClick={handler} />
        </div>
      </aside>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              type="button"
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-bg-base/70 md:hidden"
              onClick={onClose}
              aria-label="Close navigation"
            />
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] flex-col border-r border-line bg-bg-surface px-4 py-5 md:hidden"
              aria-label="More navigation"
            >
              <div className="flex items-center justify-between border-b border-line pb-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">More</p>
                  <p className="mt-1 font-display text-lg font-semibold text-ink-100">Explore EliteStudy</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="ledger-focus-ring grid h-11 w-11 place-items-center rounded-md border border-line text-ink-200"
                  aria-label="Close navigation"
                >
                  <ChevronLeft className="h-[17px] w-[17px]" aria-hidden="true" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <NavList items={visibleNav} active={active} handler={handler} />
              </div>
              <div className="mt-4 border-t border-line pt-4">
                <ProfileCard user={user} collapsed={false} onClick={handler} />
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
