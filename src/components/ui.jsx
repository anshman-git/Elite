import { motion } from 'framer-motion';
import { Bell, Loader2, Moon, Search, Sun } from 'lucide-react';
import { classNames } from '../utils';

export function Card({ children, className = '', interactive = false, ...props }) {
  return (
    <motion.section
      layout
      whileHover={interactive ? { y: -2, scale: 1.01 } : undefined}
      className={classNames(
        'rounded-2xl border border-slate-800/80 bg-slate-950/95 p-4 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.75)] backdrop-blur-xl transition-all duration-200',
        interactive ? 'cursor-pointer hover:shadow-[0_0_30px_-8px_rgba(14,165,233,0.45)]' : '',
        className,
      )}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-slate-900 text-slate-100 hover:bg-slate-800',
    secondary: 'bg-slate-900/90 text-slate-300 hover:bg-slate-800',
    ghost: 'bg-transparent text-slate-300 hover:bg-white/10',
    accent: 'bg-[#0ea5e9] text-white hover:bg-[#22c7ff] shadow-[0_0_28px_-10px_rgba(14,165,233,0.75)]',
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
        'grid h-11 w-11 place-items-center rounded-xl border border-slate-700/80 bg-slate-900 text-slate-200 transition hover:bg-slate-800',
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
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/95 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">EliteStudy</p>
            <h1 className="text-lg font-black text-slate-100">Study command center</h1>
          </div>
          {user && (
            <div className={`hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-bold sm:flex ${
              isAdmin 
                ? 'bg-slate-800 text-amber-300' 
                : 'bg-slate-800 text-cyan-300'
            }`}>
              <div className={`h-2 w-2 rounded-full ${
                isAdmin ? 'bg-amber-300' : 'bg-cyan-300'
              }`} />
              {isAdmin ? 'Admin Mode' : 'Student Mode'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <IconButton label="Notifications" onClick={onOpenNotifications}>
            <Bell size={19} />
          </IconButton>
          <IconButton label="Toggle dark mode" onClick={onToggleDark} aria-pressed={dark}>
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </IconButton>
        </div>
      </div>
    </header>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search' }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-slate-300 shadow-[0_0_30px_-20px_rgba(14,165,233,0.45)]">
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
    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600"
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
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-cyan-300 shadow-[0_0_30px_-18px_rgba(14,165,233,0.6)]">
        <Search size={24} />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{body}</p>
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

export function Input({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={classNames(
          'min-h-12 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15',
          className,
        )}
      />
    </label>
  );
}

export function Select({ label, value, onChange, children, className = '' }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={classNames(
          'min-h-12 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15',
          className,
        )}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({ label, value, onChange, placeholder, className = '' }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className={classNames(
          'min-h-24 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15',
          className,
        )}
      />
    </label>
  );
}
