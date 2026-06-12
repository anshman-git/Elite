import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Check } from 'lucide-react';
import { Button, Input, Card, Toast } from './ui';
import { AnimatedCheckbox, PulsingSkeleton } from './InteractiveElements';
import { classNames } from '../utils';

/**
 * Enhanced Login Form with Interactive Validation
 */
export function EnhancedLoginForm({ onSubmit, isLoading = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(password) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setSuccessMessage('Login successful! Redirecting...');
    setTimeout(() => {
      onSubmit?.({ email, password, rememberMe });
      setSuccessMessage('');
    }, 1500);
  };

  return (
    <Card className="max-w-md w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-ink-100 font-display mb-2">Welcome Back</h2>
          <p className="text-sm text-ink-400">Sign in to your account</p>
        </div>

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          onBlur={() => handleBlur('email')}
          icon={Mail}
          placeholder="you@example.com"
          success={touched.email && !errors.email}
          error={touched.email && !!errors.email}
        />
        {touched.email && errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold text-red-500 flex items-center gap-1"
          >
            <AlertCircle size={14} /> {errors.email}
          </motion.p>
        )}

        <div className="relative">
          <label className="block text-sm font-bold text-ink-200 mb-2">
            <motion.span
              animate={{ color: touched.password && !errors.password ? '#f59e0b' : '#d0d0d0' }}
            >
              Password
            </motion.span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              className={classNames(
                'w-full min-h-12 rounded-2xl border border-line bg-bg-surface px-4 pr-12 text-sm font-semibold text-ink-100 outline-none transition duration-200 focus:border-amber-500 focus:shadow-glow-amber dark:bg-bg-surface/50',
                errors.password ? 'border-red-500' : '',
              )}
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </motion.button>
          </div>
        </div>
        {touched.password && errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold text-red-500 flex items-center gap-1"
          >
            <AlertCircle size={14} /> {errors.password}
          </motion.p>
        )}

        <AnimatedCheckbox
          checked={rememberMe}
          onChange={setRememberMe}
          label="Remember me"
        />

        <motion.button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-glow-amber border border-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </motion.button>

        <p className="text-center text-xs text-ink-400">
          Don't have an account?{' '}
          <motion.button
            type="button"
            className="text-amber-500 font-semibold hover:text-amber-400 transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            Sign up
          </motion.button>
        </p>
      </form>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-24 left-4 right-4 mx-auto max-w-sm flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/90 px-4 py-3.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-emerald-500"
            >
              <Check size={18} />
            </motion.div>
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/**
 * Enhanced Loading State with animated skeleton cards
 */
export function EnhancedLoadingCard() {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-4">
        <PulsingSkeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <PulsingSkeleton className="h-4 w-2/3" />
          <PulsingSkeleton className="h-4 w-1/2" />
        </div>
      </div>
      <PulsingSkeleton className="h-6 w-full" />
      <div className="grid grid-cols-3 gap-2">
        <PulsingSkeleton className="h-20" />
        <PulsingSkeleton className="h-20" />
        <PulsingSkeleton className="h-20" />
      </div>
    </Card>
  );
}

/**
 * Interactive Card with Expand/Collapse
 */
export function ExpandableCard({ title, subtitle, children, defaultExpanded = false, icon: Icon }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className="overflow-hidden">
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-1">
          {Icon && <Icon className="w-5 h-5 text-amber-500 flex-shrink-0" />}
          <div>
            <p className="text-sm font-bold text-ink-100">{title}</p>
            {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-5 h-5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-line">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/**
 * Progress Step Indicator
 */
export function StepIndicator({ steps = [], currentStep = 0, onStepClick }) {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <motion.button
            onClick={() => onStepClick?.(index)}
            className={classNames(
              'relative z-10 flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all duration-200 cursor-pointer',
              index < currentStep
                ? 'bg-emerald-500 text-white'
                : index === currentStep
                ? 'bg-amber-500 text-white shadow-glow-amber'
                : 'bg-bg-raised border border-line text-ink-400'
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {index < currentStep ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Check size={20} />
              </motion.div>
            ) : (
              index + 1
            )}
          </motion.button>

          {index < steps.length - 1 && (
            <motion.div
              className={classNames(
                'flex-1 h-1 mx-2 rounded-full',
                index < currentStep ? 'bg-emerald-500' : 'bg-bg-raised'
              )}
              animate={{
                background: index < currentStep ? '#10b981' : '#3f3f46',
              }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Animated Confirmation Dialog
 */
export function ConfirmationDialog({
  title,
  message,
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}) {
  if (!isOpen) return null;

  const variantStyles = {
    default: 'border-amber-500/30',
    danger: 'border-red-500/30',
    success: 'border-emerald-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className={classNames(
          'max-w-sm w-full rounded-2xl border bg-bg-surface/95 backdrop-blur-md p-6 space-y-4',
          variantStyles[variant]
        )}
      >
        <h3 className="text-lg font-bold text-ink-100 font-display">{title}</h3>
        <p className="text-sm text-ink-400">{message}</p>

        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
