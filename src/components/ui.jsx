import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, AlertCircle, CheckCircle, Info, Sparkles, X, Check } from 'lucide-react';
import { TopBar as LayoutTopBar } from './layout/TopBar';
import { classNames } from '../utils';

export function Card({ children, className = '', interactive = false, hover = 'glow', ...props }) {
  const [isHovered, setIsHovered] = useState(false);

  const hoverVariants = {
    glow: { y: -3, scale: 1.005, transition: { duration: 0.25, ease: 'easeOut' } },
    lift: { y: -8, scale: 1.02, transition: { duration: 0.25, ease: 'easeOut' } },
    brighten: { scale: 1.005, transition: { duration: 0.25, ease: 'easeOut' } },
  };

  return (
    <motion.section
      layout
      whileHover={interactive ? hoverVariants[hover] : undefined}
      onHoverStart={() => interactive && setIsHovered(true)}
      onHoverEnd={() => interactive && setIsHovered(false)}
      className={classNames(
        'rounded-2xl border border-line bg-bg-surface/85 backdrop-blur-md p-5 shadow-soft transition-all duration-300 dark:bg-bg-surface/50',
        interactive ? 'cursor-pointer hover:border-line-strong hover:shadow-glow-amber' : '',
        className,
      )}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const [ripple, setRipple] = useState(null);

  const styles = {
    primary: 'bg-amber-500 text-slate-950 font-bold hover:brightness-[1.06] active:scale-[0.98] shadow-glow-amber border border-amber-500/25',
    secondary: 'bg-bg-raised text-ink-100 border border-line hover:border-line-strong hover:bg-bg-surface active:scale-[0.98]',
    ghost: 'bg-transparent text-ink-200 hover:bg-bg-raised/70 hover:text-ink-100 active:scale-[0.98]',
    accent: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:brightness-[1.06] active:scale-[0.98] shadow-glow-amber border border-amber-500/20',
  };

  const handleMouseDown = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { x, y, id: Date.now() };
    setRipple(newRipple);
    
    setTimeout(() => setRipple(null), 600);
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={classNames(
        'relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden',
        styles[variant],
        className,
      )}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {ripple && (
        <motion.div
          className="absolute bg-white/25 rounded-full pointer-events-none"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            width: 20,
            height: 20,
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      {children}
    </motion.button>
  );
}

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={classNames(
        'grid h-11 w-11 place-items-center rounded-xl border border-line bg-bg-surface text-ink-200 transition-all duration-200 hover:bg-bg-raised hover:text-ink-100 hover:border-line-strong shadow-soft',
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
    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-bg-surface/65 backdrop-blur-md px-4 text-ink-400 transition-all duration-200 focus-within:border-amber-500 focus-within:shadow-glow-amber">
      <Search size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-semibold text-ink-100 outline-none placeholder:text-ink-600"
      />
    </label>
  );
}

export function ProgressBar({ value, max = 100 }) {
  const pct = Math.max(0, Math.min(1, Number(value || 0) / max));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-bg-inset border border-line-subtle">
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-500 to-amber-500"
      />
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div
      className={classNames(
        'relative overflow-hidden rounded-xl bg-bg-raised/70 border border-line-subtle',
        'before:absolute before:inset-0 before:animate-shimmer before:bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.08)_45%,transparent_65%)] before:bg-[length:220%_100%]',
        className,
      )}
      aria-hidden="true"
    />
  );
}

export function LoadingState() {
  return (
    <div className="grid min-h-[280px] place-items-center text-ink-400">
      <div className="grid gap-4 text-center">
        <Loader2 className="mx-auto animate-spin text-amber-500" size={24} />
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
    <Card className="grid place-items-center overflow-hidden py-10 text-center relative grid-bg">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-glow-amber animate-pulse">
        <Icon size={24} />
      </div>
      <h3 className="mt-4 text-base font-bold text-ink-100 font-display">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-400 leading-relaxed font-sans">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function Toast({ toasts = [] }) {
  const styles = {
    success: 'border-emerald-500/30 bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-500/20 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.15)]',
    error: 'border-rose-500/30 bg-rose-50/90 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-500/20 shadow-[0_10px_40px_-10px_rgba(244,63,94,0.15)]',
    warning: 'border-amber-500/30 bg-amber-50/90 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300 dark:border-amber-500/20 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.15)]',
    info: 'border-line bg-bg-surface/90 text-ink-150 dark:bg-bg-surface/95 dark:text-ink-100 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.15)]',
  };

  const icons = {
    success: <CheckCircle className="text-success shrink-0" size={18} />,
    error: <AlertCircle className="text-danger shrink-0" size={18} />,
    warning: <AlertCircle className="text-amber-500 shrink-0" size={18} />,
    info: <Info className="text-cyan-500 shrink-0" size={18} />,
  };

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto flex max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350, delay: index * 0.05 }}
            className={classNames(
              'flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold shadow-soft backdrop-blur-xl',
              styles[toast.type] || styles.info
            )}
          >
            {icons[toast.type] || icons.info}
            <span className="flex-1 truncate leading-snug">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Input({ label, value, onChange, placeholder, type = 'text', className = '', icon: Icon, success = false, error = false }) {
  const [focused, setFocused] = useState(false);

  return (
    <label className="grid gap-2 text-sm font-bold text-ink-200">
      <motion.span
        animate={{ color: focused ? '#f59e0b' : error ? '#ef4444' : '#d0d0d0' }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.span>
      <motion.div
        className="relative flex items-center gap-2"
        initial={false}
        animate={{ borderColor: focused ? '#f59e0b' : error ? '#ef4444' : '#3f3f46' }}
      >
        {Icon && <Icon className={classNames('w-4 h-4', focused ? 'text-amber-500' : error ? 'text-red-500' : 'text-ink-400')} />}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={classNames(
            'min-h-12 rounded-2xl border border-line bg-bg-surface px-4 text-sm font-semibold text-ink-100 outline-none transition duration-200 focus:border-amber-500 focus:shadow-glow-amber focus:ring-1 focus:ring-amber-500/10 dark:bg-bg-surface/50 flex-1',
            error && 'border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgba(239,68,68,0.3)]',
            success && 'border-emerald-500 focus:border-emerald-500',
            Icon && 'pl-10',
            className,
          )}
        />
        {success && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500"><Check size={18} /></motion.div>}
        {error && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-500"><AlertCircle size={18} /></motion.div>}
      </motion.div>
    </label>
  );
}

export function Select({ label, value, onChange, children, className = '' }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink-200">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={classNames(
          'min-h-12 rounded-2xl border border-line bg-bg-surface px-4 text-sm font-semibold text-ink-100 outline-none transition duration-200 focus:border-amber-500 focus:shadow-glow-amber focus:ring-1 focus:ring-amber-500/10 dark:bg-bg-surface/50',
          className,
        )}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({ label, value, onChange, placeholder, className = '' }) {
  const [focused, setFocused] = useState(false);

  return (
    <label className="grid gap-2 text-sm font-bold text-ink-200">
      <motion.span
        animate={{ color: focused ? '#f59e0b' : '#d0d0d0' }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={4}
        className={classNames(
          'min-h-24 rounded-2xl border border-line bg-bg-surface px-4 py-3 text-sm font-semibold text-ink-100 outline-none transition duration-200 focus:border-amber-500 focus:shadow-glow-amber focus:ring-1 focus:ring-amber-500/10 dark:bg-bg-surface/50',
          className,
        )}
      />
    </label>
  );
}

export function Tooltip({ children, label, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
            className={classNames(
              'absolute left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-lg bg-slate-950 text-white text-xs font-semibold whitespace-nowrap pointer-events-none',
              positionClasses[position]
            )}
          >
            {label}
            <div className={classNames(
              'absolute w-2 h-2 bg-slate-950 rotate-45',
              position === 'top' && '-bottom-1 left-1/2 -translate-x-1/2',
              position === 'bottom' && '-top-1 left-1/2 -translate-x-1/2',
              position === 'left' && '-right-1 top-1/2 -translate-y-1/2',
              position === 'right' && '-left-1 top-1/2 -translate-y-1/2',
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Badge({ children, variant = 'default', animated = true, className = '' }) {
  const styles = {
    default: 'bg-bg-raised border border-line text-ink-100',
    success: 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300',
    warning: 'bg-amber-500/20 border border-amber-500/40 text-amber-300',
    danger: 'bg-rose-500/20 border border-rose-500/40 text-rose-300',
    info: 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300',
  };

  return (
    <motion.span
      initial={animated ? { scale: 0.9, opacity: 0 } : {}}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={classNames(
        'inline-block px-3 py-1 rounded-full text-xs font-semibold',
        styles[variant],
        className,
      )}
    >
      {children}
    </motion.span>
  );
}

export function AnimatedCheckmark({ checked = true }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -45 }}
      animate={checked ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -45 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white"
    >
      {checked && <Check size={16} />}
    </motion.div>
  );
}

export function Tabs({ tabs, defaultTab = 0, onChange }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (index) => {
    setActiveTab(index);
    onChange?.(index);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-line">
        {tabs.map((tab, index) => (
          <motion.button
            key={index}
            onClick={() => handleTabChange(index)}
            className={classNames(
              'relative px-4 py-3 text-sm font-semibold transition-colors duration-200',
              activeTab === index ? 'text-amber-500' : 'text-ink-400 hover:text-ink-200'
            )}
          >
            {tab.label}
            {activeTab === index && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600"
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tabs[activeTab]?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export { AnimatePresence };
