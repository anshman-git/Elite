import { Bell, Shield, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

// Accept both the redesign prop names (`onNotifications`, `onTheme`) and
// the legacy App prop names (`onOpenNotifications`, `onToggleDark`).
export function TopBar({
  onNotifications,
  onTheme,
  onOpenNotifications,
  onToggleDark,
  isAdmin,
  unreadCount = 0,
  user,
  dark,
}) {
  const openNotifications = onOpenNotifications || onNotifications || (() => {});
  const toggleTheme = onToggleDark || onTheme || (() => {});

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg-base/70 backdrop-blur-xl">
      <div className="flex items-center justify-between px-8 py-5">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-center gap-4"
        >
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-amber-500">ELITESTUDY</p>
            <h1 className="font-display text-2xl text-ink-100">Study Command Center</h1>
          </div>
          {isAdmin && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30"
              data-testid="admin-mode-badge"
            >
              <Shield className="w-3 h-3" /> ADMIN MODE
            </motion.span>
          )}
        </motion.div>
        <div className="flex items-center gap-3">
          <button onClick={openNotifications} data-testid="bell-btn" className="btn-ghost p-2.5 relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse-glow" />
            )}
          </button>
          <button onClick={toggleTheme} data-testid="theme-toggle-btn" className="btn-ghost p-2.5">
            <Sun className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
