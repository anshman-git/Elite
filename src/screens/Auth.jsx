import { useState } from 'react';
import { GraduationCap, KeyRound, Mail, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { firebaseEnabled, getFriendlyFirebaseError, loginWithEmail, resetPassword, signupWithEmail } from '../firebase';
import { Button, Card, Input, Toast } from '../components/ui';
import { AnimatedCheckbox } from '../components/InteractiveElements';

export default function Auth({ notify, onBack }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  const validateName = (value) => {
    if (!value) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(form.email) }));
    } else if (field === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(form.password) }));
    } else if (field === 'name') {
      setErrors(prev => ({ ...prev, name: validateName(form.name) }));
    }
  };

  async function submit(event) {
    event.preventDefault();
    
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);
    const nameError = mode === 'signup' ? validateName(form.name) : '';

    if (emailError || passwordError || nameError) {
      setErrors({ email: emailError, password: passwordError, name: nameError });
      setTouched({ email: true, password: true, name: true });
      return;
    }

    if (!firebaseEnabled) {
      notify('Firebase is not configured yet. Add your .env credentials.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'forgot') {
        await resetPassword(form.email);
        notify('Password reset email sent.');
      } else if (mode === 'signup') {
        const result = await signupWithEmail(form);
        notify(
          result.profileCreated
            ? 'Account created. Welcome to EliteStudy.'
            : 'Account created. Profile setup needs Firestore rules checked.',
        );
      } else {
        await loginWithEmail(form.email, form.password);
        notify('Signed in successfully.');
      }
    } catch (error) {
      notify(getFriendlyFirebaseError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md overflow-hidden border border-amber-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-cyan-500/5 pointer-events-none" />
          <div className="relative p-5 sm:p-7">
            <motion.div 
              className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-glow-amber"
              whileHover={{ scale: 1.05 }}
            >
              <GraduationCap size={28} />
            </motion.div>
            
            <h1 className="mt-5 text-3xl font-black tracking-tight text-ink-100 font-display">
              EliteStudy
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-400">
              Premium prep space for MCQs, notes, rankings, and exam mastery.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <Input
                  label="Full Name"
                  placeholder="Enter your name"
                  icon={UserRound}
                  value={form.name}
                  onChange={(value) => setForm({ ...form, name: value })}
                  onBlur={() => handleBlur('name')}
                  error={touched.name && !!errors.name}
                  success={touched.name && !errors.name && form.name}
                />
              )}
              {touched.name && errors.name && mode === 'signup' && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-semibold text-red-500"
                >
                  {errors.name}
                </motion.p>
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={Mail}
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
                onBlur={() => handleBlur('email')}
                error={touched.email && !!errors.email}
                success={touched.email && !errors.email && form.email}
              />
              {touched.email && errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-semibold text-red-500"
                >
                  {errors.email}
                </motion.p>
              )}

              {mode !== 'forgot' && (
                <>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    icon={KeyRound}
                    value={form.password}
                    onChange={(value) => setForm({ ...form, password: value })}
                    onBlur={() => handleBlur('password')}
                    error={touched.password && !!errors.password}
                    success={touched.password && !errors.password && form.password}
                  />
                  {touched.password && errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-semibold text-red-500"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </>
              )}

              {mode === 'login' && (
                <AnimatedCheckbox
                  checked={form.rememberMe}
                  onChange={(value) => setForm({ ...form, rememberMe: value })}
                  label="Remember me"
                />
              )}

              <Button 
                type="submit" 
                variant="primary" 
                disabled={loading} 
                className="w-full mt-6"
              >
                {loading ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity }} 
                      className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full"
                    />
                    {mode === 'signup' ? 'Creating account...' : mode === 'forgot' ? 'Sending...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In'}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm font-semibold">
              <motion.button 
                className="block text-amber-500 hover:text-amber-400 transition-colors w-full"
                onClick={() => {
                  setMode(mode === 'signup' ? 'login' : 'signup');
                  setErrors({});
                  setTouched({});
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {mode === 'signup' ? '← Already have an account? Login' : 'New here? Create an account'}
              </motion.button>
              
              <motion.button 
                className="block text-ink-500 hover:text-ink-300 transition-colors w-full"
                onClick={() => {
                  setMode(mode === 'forgot' ? 'login' : 'forgot');
                  setErrors({});
                  setTouched({});
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {mode === 'forgot' ? '← Back to login' : 'Forgot password?'}
              </motion.button>

              {onBack && (
                <motion.button 
                  className="block text-xs text-ink-600 hover:text-ink-500 transition-colors w-full mt-4"
                  onClick={onBack}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ← Back to Landing Page
                </motion.button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}
