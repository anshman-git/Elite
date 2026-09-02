import { useState } from 'react';
import { AlertCircle, Check, CheckCircle, Info, Loader2, Search, Sparkles, X } from 'lucide-react';
import { TopBar as LayoutTopBar } from './layout/TopBar';
import { classNames } from '../utils';

export function Card({ children, className = '', interactive = false, ...props }) {
  return (
    <section
      className={classNames('rounded-md border border-line bg-bg-surface p-5 shadow-card', interactive && 'cursor-pointer hover:border-line-strong', className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function Button({ children, variant = 'primary', className = '', size = 'md', ...props }) {
  const styles = {
    primary: 'border-accent bg-accent text-bg-base hover:bg-accent/85',
    secondary: 'border-line bg-bg-raised text-ink-100 hover:border-line-strong hover:bg-bg-surface',
    ghost: 'border-transparent bg-transparent text-ink-200 hover:bg-bg-raised hover:text-ink-100',
    accent: 'border-accent bg-accent text-bg-base hover:bg-accent/85',
  };
  const sizes = {
    sm: 'min-h-10 px-3 text-xs',
    md: 'min-h-11 px-5 text-sm',
    lg: 'min-h-12 px-6 text-base',
  };

  return (
    <button
      type={props.type || 'button'}
      className={classNames(
        'ledger-focus-ring inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        sizes[size] || sizes.md,
        styles[variant] || styles.primary,
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
      type="button"
      aria-label={label}
      title={label}
      className={classNames('ledger-focus-ring grid h-11 w-11 place-items-center rounded-md border border-line bg-bg-surface text-ink-200 transition-colors hover:border-line-strong hover:text-ink-100', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export const TopBar = LayoutTopBar;

export function SearchInput({ value, onChange, placeholder = 'Search' }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-md border border-line bg-bg-surface px-4 text-ink-400 transition-colors focus-within:border-accent">
      <Search className="h-[18px] w-[18px]" aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-semibold text-ink-100 outline-none placeholder:text-ink-600"
      />
    </label>
  );
}

export function ProgressBar({ value, max = 100, color = 'accent' }) {
  const pct = Math.max(0, Math.min(1, Number(value || 0) / max));
  const colorClass = {
    accent: 'bg-accent',
    amber: 'bg-accent',
    cyan: 'bg-success',
    emerald: 'bg-success',
    success: 'bg-success',
    danger: 'bg-focus',
  }[color] || 'bg-accent';
  return (
    <div className="h-2 overflow-hidden rounded-full bg-bg-inset" aria-label={`${Math.round(pct * 100)}% complete`}>
      <div className={classNames('h-full rounded-full transition-[width] duration-150', colorClass)} style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={classNames('rounded-md bg-bg-raised', className)} aria-hidden="true" />;
}

export function LoadingState() {
  return (
    <div className="grid min-h-[220px] place-items-center text-ink-400" role="status" aria-label="Loading">
      <div className="grid gap-3 text-center">
        <Loader2 className="mx-auto h-5 w-5 text-accent" aria-hidden="true" />
        <span className="text-sm">Loading your study space…</span>
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action, icon: Icon = Sparkles }) {
  return (
    <Card className="py-8 text-center">
      <Icon className="mx-auto h-5 w-5 text-ink-400" aria-hidden="true" />
      <h3 className="mt-3 font-display text-base font-semibold text-ink-100">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-ink-400">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function Toast({ toasts = [] }) {
  const styles = {
    success: 'border-success/50 text-success',
    error: 'border-focus/60 text-focus',
    warning: 'border-accent/60 text-accent',
    info: 'border-line text-ink-100',
  };
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
  };

  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto flex max-w-sm flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || icons.info;
        return (
          <div key={toast.id} className={classNames('flex items-center gap-3 rounded-md border bg-bg-surface px-4 py-3 text-sm font-semibold shadow-card', styles[toast.type] || styles.info)}>
            <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Input({ label, value, onChange, placeholder, type = 'text', className = '', icon: Icon, success = false, error = false }) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink-200">
      <span className={classNames(focused ? 'text-accent' : error ? 'text-focus' : 'text-ink-200')}>{label}</span>
      <span className="relative flex items-center gap-2">
        {Icon ? <Icon className={classNames('absolute left-3.5 h-4 w-4', focused ? 'text-accent' : 'text-ink-400')} aria-hidden="true" /> : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={classNames('ledger-focus-ring min-h-11 w-full rounded-md border border-line bg-bg-inset px-3.5 text-sm font-medium text-ink-100 outline-none transition-colors focus:border-accent', Icon && 'pl-10', error && 'border-focus focus:border-focus', success && 'border-success', className)}
        />
        {success ? <Check className="absolute right-3 h-4 w-4 text-success" aria-hidden="true" /> : null}
        {error ? <AlertCircle className="absolute right-3 h-4 w-4 text-focus" aria-hidden="true" /> : null}
      </span>
    </label>
  );
}

export function Select({ label, value, onChange, children, className = '' }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink-200">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={classNames('ledger-focus-ring min-h-11 rounded-md border border-line bg-bg-inset px-3.5 text-sm font-medium text-ink-100 outline-none focus:border-accent', className)}>
        {children}
      </select>
    </label>
  );
}

export function Textarea({ label, value, onChange, placeholder, className = '' }) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink-200">
      <span className={focused ? 'text-accent' : undefined}>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={4}
        className={classNames('ledger-focus-ring min-h-24 w-full resize-y rounded-md border border-line bg-bg-inset px-3.5 py-3 text-sm font-medium text-ink-100 outline-none transition-colors focus:border-accent', className)}
      />
    </label>
  );
}

export function Tooltip({ children, label }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-bg-surface px-3 py-2 text-xs font-semibold text-ink-100 shadow-card group-hover:block group-focus-within:block">
        {label}
      </span>
    </span>
  );
}

export function Badge({ children, label, value, icon: Icon, variant = 'default', className = '' }) {
  const styles = {
    default: 'border-line bg-bg-raised text-ink-200',
    success: 'border-success/50 bg-success/10 text-success',
    warning: 'border-accent/50 bg-accent/10 text-accent',
    danger: 'border-focus/50 bg-focus/10 text-focus',
    info: 'border-line bg-bg-raised text-ink-200',
  };
  return (
    <span className={classNames('inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold', styles[variant] || styles.default, className)}>
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {label ? <span>{label}</span> : null}
      {value ? <strong>{value}</strong> : null}
      {!label && !value ? children : null}
    </span>
  );
}

export function AnimatedCheckmark({ checked = true }) {
  return <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success text-bg-base">{checked ? <Check className="h-4 w-4" aria-hidden="true" /> : null}</span>;
}

export function Tabs({ tabs, defaultTab = 0, onChange }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const handleTabChange = (index) => {
    setActiveTab(index);
    onChange?.(index);
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-line" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.label || index}
            type="button"
            role="tab"
            aria-selected={activeTab === index}
            onClick={() => handleTabChange(index)}
            className={classNames('ledger-focus-ring min-h-11 border-b-2 px-4 text-sm font-semibold transition-colors', activeTab === index ? 'border-accent text-accent' : 'border-transparent text-ink-400 hover:text-ink-100')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tabs[activeTab]?.content}</div>
    </div>
  );
}

export { X };
