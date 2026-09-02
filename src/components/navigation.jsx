import { BarChart3, BookOpen, Home, MoreHorizontal, UserRound } from 'lucide-react';
import { classNames, confirmLeaveQuiz } from '../utils';
import { Sidebar as LayoutSidebar } from './layout/Sidebar';

function navigate(setActive, target) {
  if (!confirmLeaveQuiz()) return;
  setActive(target);
}

const mobileItems = [
  { id: 'dashboard', label: 'Today', icon: Home },
  { id: 'quizzes', label: 'Practice', icon: BookOpen },
  { id: 'performance', label: 'Progress', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

export function BottomNav({ active, setActive, onMore }) {
  return (
    <nav className="ledger-bottom-nav bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-bg-base px-2 pt-2" aria-label="Mobile navigation">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(setActive, item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={classNames(
                'ledger-focus-ring flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold transition-colors duration-150',
                isActive ? 'bg-bg-raised text-accent' : 'text-ink-400 hover:text-ink-100',
              )}
            >
              <Icon className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          className="ledger-focus-ring flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold text-ink-400 transition-colors duration-150 hover:text-ink-100"
          aria-label="Open more navigation"
        >
          <MoreHorizontal className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden="true" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}

/** Sidebar wrapper kept stable for App.jsx callers. */
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
