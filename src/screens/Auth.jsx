import { useState } from 'react';
import { Bot, GraduationCap, KeyRound, Mail, Sparkles, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { firebaseEnabled, getFriendlyFirebaseError, loginWithEmail, resetPassword, signupWithEmail } from '../firebase';
import { Button, Card, Input } from '../components/ui';
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
    <main className="grid min-h-screen place-items-center bg-bg-base p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="w-full overflow-hidden border border-line shadow-card p-0">
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <motion.div 
                className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-amber-50 shadow-glow-amber"
                whileHover={{ scale: 1.05 }}
              >
                <GraduationCap size={24} />
              </motion.div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-400 text-xs font-bold">
                <Bot className="h-3.5 w-3.5" />
                <span>AI Powered</span>
              </div>
            </div>
            
            <h1 className="mt-5 text-2xl font-black tracking-tight text-ink-100 font-display">
              {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Sign in to EliteStudy'}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-400">
              Premium prep space for BCA MCQs, notes, rankings, and exam mastery.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <div>
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
                  {touched.name && errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs font-semibold text-danger"
                    >
                      {errors.name}
                    </motion.p>
                  )}
                </div>
              )}

              <div>
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
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-xs font-semibold text-danger"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>

              {mode !== 'forgot' && (
                <div>
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
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs font-semibold text-danger"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </div>
              )}

              {mode === 'login' && (
                <div className="pt-1">
                  <AnimatedCheckbox
                    checked={form.rememberMe}
                    onChange={(value) => setForm({ ...form, rememberMe: value })}
                    label="Remember me"
                  />
                </div>
              )}

              <Button 
                type="submit" 
                variant="primary" 
                disabled={loading} 
                className="w-full mt-4"
              >
                {loading ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity }} 
                      className="w-4 h-4 border-2 border-amber-50/30 border-t-amber-50 rounded-full"
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

            <div className="mt-6 space-y-2 text-center text-sm font-semibold border-t border-line pt-4">
              <button 
                type="button"
                className="block text-amber-500 hover:text-amber-400 transition-colors w-full py-1 text-xs sm:text-sm"
                onClick={() => {
                  setMode(mode === 'signup' ? 'login' : 'signup');
                  setErrors({});
                  setTouched({});
                }}
              >
                {mode === 'signup' ? '← Already have an account? Login' : 'New here? Create an account'}
              </button>
              
              <button 
                type="button"
                className="block text-ink-400 hover:text-ink-200 transition-colors w-full py-1 text-xs sm:text-sm"
                onClick={() => {
                  setMode(mode === 'forgot' ? 'login' : 'forgot');
                  setErrors({});
                  setTouched({});
                }}
              >
                {mode === 'forgot' ? '← Back to login' : 'Forgot password?'}
              </button>

              {onBack && (
                <button 
                  type="button"
                  className="block text-xs text-ink-400 hover:text-ink-200 transition-colors w-full pt-2"
                  onClick={onBack}
                >
                  ← Back to Landing Page
                </button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}
