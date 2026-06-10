import { useState } from 'react';
import { GraduationCap, KeyRound, Mail, UserRound } from 'lucide-react';
import { firebaseEnabled, getFriendlyFirebaseError, loginWithEmail, resetPassword, signupWithEmail } from '../firebase';
import { Button, Card } from '../components/ui';

export default function Auth({ notify, onBack }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
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
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-md p-5 sm:p-7">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-glow">
          <GraduationCap size={28} />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 dark:text-white">EliteStudy</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Private-style prep space for MCQs, notes, rankings, and exam focus.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === 'signup' ? (
            <Field icon={UserRound} placeholder="Full name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          ) : null}
          <Field icon={Mail} placeholder="Email address" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          {mode !== 'forgot' ? (
            <Field icon={KeyRound} placeholder="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
          ) : null}
          <Button variant="accent" disabled={loading} className="w-full">
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Login'}
          </Button>
        </form>

        <div className="mt-4 grid gap-2 text-center text-sm font-semibold">
          <button className="text-blue-600" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
            {mode === 'signup' ? 'Already have an account? Login' : 'New here? Create an account'}
          </button>
          <button className="text-slate-500 dark:text-slate-400" onClick={() => setMode(mode === 'forgot' ? 'login' : 'forgot')}>
            {mode === 'forgot' ? 'Back to login' : 'Forgot password?'}
          </button>
          {onBack && (
            <button className="mt-2 text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" onClick={onBack}>
              &larr; Back to Landing Page
            </button>
          )}
        </div>
      </Card>
    </main>
  );
}

function Field({ icon: Icon, value, onChange, ...props }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-500 dark:border-white/10 dark:bg-slate-950">
      <Icon size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
        {...props}
      />
    </label>
  );
}
