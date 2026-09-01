import { BookOpen, Home, ShieldCheck, Trophy, UserRound, UsersRound } from 'lucide-react';
import { classNames, confirmLeaveQuiz } from '../utils';
import { Sidebar as LayoutSidebar } from './layout/Sidebar';

function navigate(setActive, target) {
  if (!confirmLeaveQuiz()) return;
  setActive(target);
}

const items = [
  { id: 'dashboard',   label: 'Home',    icon: Home },
  { id: 'quizzes',     label: 'Quiz',    icon: BookOpen },
  { id: 'community',   label: 'Social',  icon: UsersRound },
  { id: 'leaderboard', label: 'Ranks',   icon: Trophy },
  { id: 'profile',     label: 'Profile', icon: UserRound },
  { id: 'admin',       label: 'Admin',   icon: ShieldCheck },
];

export function BottomNav({ active, setActive, isAdmin }) {
  const visibleItems = isAdmin ? items : items.filter((item) => item.id !== 'admin');

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-line px-2 pt-2 backdrop-blur-md lg:hidden"
         style={{ backgroundColor: 'rgb(var(--color-bg-base) / 0.95)' }}>
      <div className={`mx-auto grid max-w-lg gap-1 ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(setActive, item.id)}
              className={classNames(
                'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition-[background-color,color] duration-200',
                isActive
                  ? 'bg-amber-500/15 text-amber-500'
                  : 'text-ink-400 hover:text-ink-100',
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Sidebar — thin wrapper that passes all props (incl. mobile drawer props)
 * to the layout Sidebar so App.jsx callers don't need direct imports.
 */
export function Sidebar({ active, setActive, isAdmin, isOpen, onClose, collapsed, onToggleCollapse, user }) {
  return (
    <LayoutSidebar
      active={active}
      setActive={setActive}
      isAdmin={isAdmin}
      isOpen={isOpen}
      onClose={onClose}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      user={user}
    />
  );
}
