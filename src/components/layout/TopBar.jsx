import { Bell, Menu, Shield, Sun, X } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * TopBar — sticky app header.
 *
 * Props (all optional for backwards compat):
 *   onNotifications / onOpenNotifications — open notification drawer
 *   onTheme / onToggleDark               — toggle colour scheme
 *   onMenuToggle                          — open/close mobile sidebar drawer
 *   menuOpen (bool)                       — controls the hamburger ↔ X icon
 *   isAdmin (bool)
 *   unreadCount (number)
 *   user
 *   dark (bool)
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
    <header className="sticky top-0 z-30 border-b border-line backdrop-blur-md"
            style={{ backgroundColor: 'rgb(var(--color-bg-base) / 0.9)' }}>
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 sm:px-6 sm:py-3">

        {/* Left: hamburger (mobile) + wordmark + admin badge */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-center gap-2 sm:gap-3 min-w-0"
        >
          {/* Hamburger — only on < md */}
          <button
            onClick={onMenuToggle}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            className="md:hidden btn-ghost p-2 shrink-0"
          >
            {menuOpen
              ? <X className="w-5 h-5" />
              : <Menu className="w-5 h-5" />}
          </button>

          {/* Wordmark */}
          <div className="min-w-0">
            <p className="font-mono text-[9px] sm:text-[10px] tracking-[0.3em] text-amber-500 leading-none">
              ELITESTUDY
            </p>
            <h1 className="font-display text-base sm:text-xl leading-tight text-ink-100 truncate">
              Study Command Center
            </h1>
          </div>

          {/* Admin badge */}
          {isAdmin && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 shrink-0"
              data-testid="admin-mode-badge"
            >
              <Shield className="w-3 h-3" /> ADMIN
            </motion.span>
          )}
        </motion.div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={openNotifications}
            data-testid="bell-btn"
            aria-label="Open notifications"
            className="btn-ghost p-2 sm:p-2.5 relative"
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
            className="btn-ghost p-2 sm:p-2.5"
          >
            <Sun className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
