import { BookOpen, Menu, Moon, Shield, Sun, X } from 'lucide-react';
import { getDisplayName } from '../../utils';

/**
 * TopBar — compact, stable app header shared by authenticated screens.
 */
export function TopBar({
  onTheme,
  onToggleDark,
  onMenuToggle,
  menuOpen = false,
  isAdmin,
  user,
  dark,
}) {
  const toggleTheme = onToggleDark || onTheme || (() => {});
  const displayName = getDisplayName(user);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg-base" role="banner">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            className="ledger-focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-md border border-line bg-bg-surface text-ink-200 transition-colors hover:border-line-strong hover:text-ink-100 md:hidden"
          >
            {menuOpen ? <X className="h-[18px] w-[18px]" aria-hidden="true" /> : <Menu className="h-[18px] w-[18px]" aria-hidden="true" />}
          </button>

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-accent text-accent">
              <BookOpen className="h-[15px] w-[15px]" aria-hidden="true" />
            </div>
            <div className="min-w-0 leading-none">
              <span className="block truncate font-display text-[15px] font-bold tracking-[-0.03em] text-ink-100">
                Elite<span className="text-accent">Study</span>
              </span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                Study space
              </span>
            </div>
          </div>

          {isAdmin ? (
            <span
              className="hidden items-center gap-1 border-l border-line pl-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent sm:inline-flex"
              data-testid="admin-mode-badge"
            >
              <Shield className="h-3 w-3" aria-hidden="true" />
              Admin
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-3 text-xs text-ink-400 sm:flex">
            <span>{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date())}</span>
            <span className="h-4 w-px bg-line" aria-hidden="true" />
            <span className="flex items-center gap-2 font-semibold text-ink-200">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-line bg-bg-surface text-[11px] font-bold text-ink-100">
                {initial}
              </span>
              <span className="max-w-[9rem] truncate">{displayName}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            data-testid="theme-toggle-btn"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="ledger-focus-ring grid h-11 w-11 place-items-center rounded-md border border-line bg-bg-surface text-ink-200 transition-colors hover:border-line-strong hover:text-ink-100"
          >
            {dark ? <Sun className="h-[17px] w-[17px]" aria-hidden="true" /> : <Moon className="h-[17px] w-[17px]" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
