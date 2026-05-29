import { motion } from 'framer-motion';
import { Bell, Loader2, Moon, Search, Sun, AlertCircle, CheckCircle, Info, Sparkles, X } from 'lucide-react';
import { TopBar as LayoutTopBar } from './layout/TopBar';
import { classNames } from '../utils';

export function Card({ children, className = '', interactive = false, ...props }) {
  return (
    <motion.section
      layout
      whileHover={interactive ? { y: -3, scale: 1.006 } : undefined}
      className={classNames(
        'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-xl transition-[transform,opacity,border-color,background-color,box-shadow] duration-300 dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]',
        interactive ? 'cursor-pointer hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgba(59,130,246,0.06)] dark:hover:border-amber-500/40 dark:hover:shadow-[0_20px_50px_rgba(245,158,11,0.06)]' : '',
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
    primary: 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm',
    secondary: 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700',
    ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200',
    accent: 'bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold shadow-[0_4px_20px_rgba(245,158,11,0.22)] dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400',
  };
  return (
    <button
      className={classNames(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200 disabled:cursor-not-allowed disabled:opacity-60',
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
        'grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export const TopBar = LayoutTopBar;

export function SearchInput({ value, onChange, placeholder = 'Search' }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-500 transition-[background-color,border-color,color,box-shadow] duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:focus-within:border-amber-500 dark:focus-within:ring-amber-500/15">
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
  const pct = Math.max(0, Math.min(1, Number(value || 0) / 100));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-500 to-amber-500 dark:from-cyan-500 dark:to-amber-400"
      />
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div
      className={classNames(
        'relative overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800/50',
        'before:absolute before:inset-0 before:animate-shimmer before:bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.16)_45%,transparent_65%)] before:bg-[length:220%_100%]',
        className,
      )}
      aria-hidden="true"
    />
  );
}

export function LoadingState() {
  return (
    <div className="grid min-h-[280px] place-items-center text-slate-400 dark:text-zinc-500">
      <div className="grid gap-4 text-center">
        <Loader2 className="mx-auto animate-spin text-amber-400" size={24} />
        <div className="space-y-2">
          <Skeleton className="mx-auto h-3 w-40" />
          <Skeleton className="mx-auto h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action, icon: Icon = Sparkles }) {
  return (
    <Card className="grid place-items-center overflow-hidden py-10 text-center">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.08)]">
        <Icon size={24} />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-zinc-400">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function Toast({ message, type = 'info' }) {
  if (!message) return null;

  const styles = {
    success: 'border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-500/20 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.15)]',
    error: 'border-rose-500/30 bg-rose-50 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-500/20 shadow-[0_10px_40px_-10px_rgba(244,63,94,0.15)]',
    warning: 'border-amber-500/30 bg-amber-50 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300 dark:border-amber-500/20 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.15)]',
    info: 'border-blue-500/30 bg-blue-50 text-blue-850 dark:bg-zinc-950/95 dark:text-zinc-200 dark:border-zinc-800/80 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.15)]',
  };

  const icons = {
    success: <CheckCircle className="text-emerald-500 shrink-0" size={18} />,
    error: <AlertCircle className="text-rose-500 shrink-0" size={18} />,
    warning: <AlertCircle className="text-amber-500 shrink-0" size={18} />,
    info: <Info className="text-blue-500 shrink-0" size={18} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className={classNames(
        'fixed bottom-24 left-4 right-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl',
        styles[type] || styles.info
      )}
    >
      {icons[type] || icons.info}
      <span className="flex-1 truncate leading-snug">{message}</span>
    </motion.div>
  );
}

export function Input({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-zinc-300">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={classNames(
          'min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-amber-500 dark:focus:ring-amber-500/15',
          className,
        )}
      />
    </label>
  );
}

export function Select({ label, value, onChange, children, className = '' }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-zinc-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={classNames(
          'min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-amber-500 dark:focus:ring-amber-500/15',
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
    <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-zinc-300">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className={classNames(
          'min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-amber-500 dark:focus:ring-amber-500/15',
          className,
        )}
      />
    </label>
  );
}
