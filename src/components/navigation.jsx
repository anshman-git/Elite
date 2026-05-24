import { BarChart3, BookOpen, Home, ShieldCheck, Trophy, UserRound, UsersRound } from 'lucide-react';
import { classNames, confirmLeaveQuiz } from '../utils';

function navigate(setActive, target) {
  if (!confirmLeaveQuiz()) return;
  setActive(target);
}

const items = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'quizzes', label: 'Quiz', icon: BookOpen },
  { id: 'resources', label: 'Files', icon: ShieldCheck },
  { id: 'community', label: 'Social', icon: UsersRound },
  { id: 'leaderboard', label: 'Ranks', icon: Trophy },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
];

const desktopItems = [
  ...items,
  { id: 'performance', label: 'Performance', icon: BarChart3 },
];

export function BottomNav({ active, setActive, isAdmin }) {
  const visibleItems = isAdmin ? items : items.filter((item) => item.id !== 'admin');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-3 pt-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 lg:hidden">
      <div className={`mx-auto grid max-w-lg gap-1 ${isAdmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(setActive, item.id)}
              className={classNames(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition',
                isActive
                  ? 'bg-blue-600 text-white shadow-glow'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10',
              )}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import { Sidebar as LayoutSidebar } from './layout/Sidebar';

export function Sidebar({ active, setActive, isAdmin }) {
  // Wrap the redesign Sidebar so existing callers that pass `setActive`
  // continue to work without modifying `App.jsx`.
  return <LayoutSidebar active={active} setActive={setActive} isAdmin={isAdmin} />;
}
