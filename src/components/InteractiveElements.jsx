import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { classNames } from '../utils';

/**
 * Animated Checkbox with smooth transitions
 */
export function AnimatedCheckbox({ checked = false, onChange, label, className = '' }) {
  return (
    <label className={classNames('flex items-center gap-3 cursor-pointer group', className)}>
      <motion.div
        className="relative w-6 h-6 rounded-lg border-2 border-line bg-bg-surface flex items-center justify-center"
        animate={{
          borderColor: checked ? '#f59e0b' : '#3f3f46',
          backgroundColor: checked ? '#f59e0b' : '#27272a',
        }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 400 }}
          >
            <Check size={16} className="text-slate-950" strokeWidth={3} />
          </motion.div>
        )}
      </motion.div>
      {label && (
        <span className="text-sm font-semibold text-ink-200 group-hover:text-ink-100 transition-colors">
          {label}
        </span>
      )}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="hidden"
      />
    </label>
  );
}

/**
 * Animated Radio Button with smooth transitions
 */
export function AnimatedRadio({ checked = false, onChange, label, className = '' }) {
  return (
    <label className={classNames('flex items-center gap-3 cursor-pointer group', className)}>
      <motion.div
        className="relative w-6 h-6 rounded-full border-2 border-line bg-bg-surface flex items-center justify-center"
        animate={{
          borderColor: checked ? '#f59e0b' : '#3f3f46',
          scale: checked ? 1.05 : 1,
        }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
      >
        {checked && (
          <motion.div
            className="w-3 h-3 rounded-full bg-amber-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 400 }}
          />
        )}
      </motion.div>
      {label && (
        <span className="text-sm font-semibold text-ink-200 group-hover:text-ink-100 transition-colors">
          {label}
        </span>
      )}
      <input
        type="radio"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="hidden"
      />
    </label>
  );
}

/**
 * Animated Toggle Switch
 */
export function AnimatedSwitch({ enabled = false, onChange, label, className = '' }) {
  return (
    <label className={classNames('flex items-center gap-3 cursor-pointer', className)}>
      <motion.div
        className="relative w-12 h-6 rounded-full bg-bg-raised border border-line flex items-center"
        animate={{ backgroundColor: enabled ? '#fbbf24' : '#27272a' }}
        transition={{ duration: 0.3 }}
        onClick={() => onChange?.(!enabled)}
      >
        <motion.div
          className="absolute w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ left: enabled ? '20px' : '2px' }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 500 }}
        />
      </motion.div>
      {label && (
        <span className="text-sm font-semibold text-ink-200">{label}</span>
      )}
    </label>
  );
}

/**
 * Progress Ring - Circular progress indicator
 */
export function ProgressRing({ radius = 45, circumference = 282, percentage = 0, strokeWidth = 8, label = '', color = 'amber' }) {
  const colors = {
    amber: 'stroke-amber-500',
    emerald: 'stroke-emerald-500',
    cyan: 'stroke-cyan-500',
    rose: 'stroke-rose-500',
  };

  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg className="transform -rotate-90" width={radius * 2 + 20} height={radius * 2 + 20}>
        {/* Background circle */}
        <circle
          cx={radius + 10}
          cy={radius + 10}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="stroke-bg-raised"
        />
        {/* Progress circle */}
        <motion.circle
          cx={radius + 10}
          cy={radius + 10}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={colors[color]}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </svg>
      {label && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-2xl font-black text-ink-100">{Math.round(percentage)}%</p>
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">{label}</p>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Animated Stats Card with hover effects
 */
export function StatsCard({ icon: Icon, label, value, trend = null, trendPositive = true, className = '' }) {
  return (
    <motion.div
      className={classNames(
        'rounded-2xl border border-line bg-bg-surface/85 backdrop-blur-md p-5 shadow-soft',
        className
      )}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <motion.div
          className="p-3 rounded-xl bg-amber-500/10 text-amber-500"
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon size={20} />
        </motion.div>
        {trend && (
          <motion.div
            className={classNames(
              'text-xs font-bold px-2 py-1 rounded-lg',
              trendPositive
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/20 text-rose-300'
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, type: 'spring' }}
          >
            {trend}
          </motion.div>
        )}
      </div>
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">{label}</p>
      <motion.p
        className="text-2xl font-black text-ink-100 font-display"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {value}
      </motion.p>
    </motion.div>
  );
}

/**
 * Animated Dropdown Component
 */
export function AnimatedDropdown({ items = [], value, onChange, placeholder = 'Select...', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = items.find(item => item.value === value);

  return (
    <div className={classNames('relative w-full', className)}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-12 rounded-2xl border border-line bg-bg-surface px-4 text-left text-sm font-semibold text-ink-100 outline-none transition duration-200 focus:border-amber-500 focus:shadow-glow-amber dark:bg-bg-surface/50 flex items-center justify-between"
        animate={{ borderColor: isOpen ? '#f59e0b' : '#3f3f46' }}
      >
        <span>{selected?.label || placeholder}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className={isOpen ? 'text-amber-500' : 'text-ink-400'} />
        </motion.div>
      </motion.button>

      {isOpen && (
        <motion.div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-line bg-bg-surface/95 backdrop-blur-md shadow-lg z-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {items.map((item, index) => (
            <motion.button
              key={item.value}
              onClick={() => {
                onChange?.(item.value);
                setIsOpen(false);
              }}
              className={classNames(
                'w-full px-4 py-3 text-left text-sm font-semibold transition-colors duration-200',
                'hover:bg-amber-500/10 hover:text-amber-500',
                value === item.value && 'bg-amber-500/20 text-amber-500',
                index !== items.length - 1 && 'border-b border-line'
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {item.label}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/**
 * Notification Badge with pulse
 */
export function NotificationBadge({ count = 0, animated = true, className = '' }) {
  if (count === 0) return null;

  return (
    <motion.div
      className={classNames(
        'flex items-center justify-center w-6 h-6 rounded-full text-xs font-black text-white bg-rose-500',
        animated && 'animate-pulse',
        className
      )}
      initial={animated ? { scale: 0 } : {}}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  );
}

/**
 * Animated Slider Component
 */
export function AnimatedSlider({ value = 0, onChange, min = 0, max = 100, step = 1, label = '', className = '' }) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={classNames('w-full', className)}>
      {label && (
        <label className="block text-sm font-bold text-ink-200 mb-2">{label}</label>
      )}
      <div className="relative">
        <div className="h-2 bg-bg-raised rounded-full border border-line-subtle overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full origin-left"
            animate={{ scaleX: percentage / 100 }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="absolute top-0 w-full h-2 opacity-0 cursor-pointer accent-amber-500"
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg border border-amber-500/30 pointer-events-none"
          style={{ left: `${percentage}%` }}
          animate={{ left: `${percentage}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink-400 font-semibold">
        <span>{min}</span>
        <span className="text-amber-500">{value}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton Pulse
 */
export function PulsingSkeleton({ className = '', count = 1 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={classNames(
            'rounded-xl bg-bg-raised/70 border border-line-subtle',
            'relative overflow-hidden',
            'before:absolute before:inset-0 before:animate-shimmer before:bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.08)_45%,transparent_65%)] before:bg-[length:220%_100%]',
            className
          )}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

/**
 * Animated Stats Number Counter
 */
export function AnimatedNumber({ value = 0, decimals = 0, prefix = '', suffix = '', duration = 1, className = '' }) {
  const [displayValue, setDisplayValue] = useState(value);

  return (
    <motion.span
      className={className}
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onAnimationComplete={() => {
          setDisplayValue(value);
        }}
      >
        {prefix}
        {displayValue.toFixed(decimals)}
        {suffix}
      </motion.span>
    </motion.span>
  );
}
