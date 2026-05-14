import { motion } from 'framer-motion';
import { Bell, Loader2, Moon, Search, Sun } from 'lucide-react';
import { classNames } from '../utils';

export function Card({ children, className = '', interactive = false }) {
  return (
    <motion.section
      layout
      whileHover={interactive ? { y: -2 } : undefined}
      className={classNames(
        'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft transition dark:border-white/10 dark:bg-slate-900',
        className,
      )}
    >
      {children}
    </motion.section>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10',
    accent: 'bg-blue-600 text-white hover:bg-blue-700 shadow-glow',
  };
  return (
    <button
      className={classNames(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={classNames(
        'grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TopBar({ dark, onToggleDark, onOpenNotifications, isAdmin, user }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-slate-50/85 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">EliteStudy</p>
            <h1 className="text-lg font-black text-slate-950 dark:text-white">Study command center</h1>
          </div>
          {user && (
            <div className={`hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-bold sm:flex ${
              isAdmin 
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100' 
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
            }`}>
              <div className={`h-2 w-2 rounded-full ${
                isAdmin ? 'bg-amber-600' : 'bg-blue-600'
              }`} />
              {isAdmin ? 'Admin Mode' : 'Student Mode'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <IconButton label="Notifications" onClick={onOpenNotifications}>
            <Bell size={19} />
          </IconButton>
          <IconButton label="Toggle dark mode" onClick={onToggleDark}>
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </IconButton>
        </div>
      </div>
    </header>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search' }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <Search size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
      />
    </label>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="h-full rounded-full bg-blue-600"
      />
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={classNames('animate-pulse rounded-xl bg-slate-200 dark:bg-white/10', className)} />;
}

export function LoadingState() {
  return (
    <div className="grid min-h-[280px] place-items-center text-slate-500">
      <Loader2 className="animate-spin" />
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <Card className="grid place-items-center py-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
        <Search size={24} />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-glow dark:bg-white dark:text-slate-950"
    >
      {message}
    </motion.div>
  );
}
