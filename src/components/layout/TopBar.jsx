import { Bell, Menu, Shield, Sun, X, Flame, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * TopBar — sticky app header.
 */
export function TopBar({
  onNotifications,
  onTheme,
  onOpenNotifications,
  onToggleDark,
  onMenuToggle,
  menuOpen = false,
  isAdmin,
  unreadCount = 0,
  user,
  dark,
}) {
  const openNotifications = onOpenNotifications || onNotifications || (() => {});
  const toggleTheme = onToggleDark || onTheme || (() => {});

  return (
    <header className="sticky top-0 z-30 border-b border-line backdrop-blur-md bg-bg-surface/80 dark:bg-bg-surface/70 shadow-soft">
      <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6">

        {/* Left: hamburger (mobile) + brand identity + admin badge */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-center gap-3 min-w-0"
        >
          {/* Hamburger — only on < md */}
          <button
            onClick={onMenuToggle}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-bg-surface text-ink-250 hover:text-amber-500 transition-colors shadow-soft shrink-0"
          >
            {menuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>

          {/* Wordmark & Brand Icon */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-glow-amber transition-transform shrink-0">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-display text-base font-bold text-ink-100 tracking-tight block leading-tight">
                Elite<span className="text-amber-500">Study</span>
              </span>
              <span className="text-[9px] text-ink-400 font-bold tracking-wider uppercase block leading-none">
                Command Center
              </span>
            </div>
          </div>

          {/* Admin badge */}
          {isAdmin && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden sm:inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full text-[9px] font-mono tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 shrink-0"
              data-testid="admin-mode-badge"
            >
              <Shield className="w-3 h-3" /> ADMIN
            </motion.span>
          )}
        </motion.div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openNotifications}
            data-testid="bell-btn"
            aria-label="Open notifications"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-bg-surface/50 text-ink-200 hover:border-amber-500/30 hover:text-amber-500 transition-all duration-200 shadow-soft relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse-glow" />
            )}
          </button>
          
          <button
            onClick={toggleTheme}
            data-testid="theme-toggle-btn"
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-bg-surface/50 text-ink-200 hover:border-amber-500/30 hover:text-amber-500 transition-all duration-200 shadow-soft"
          >
            {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
