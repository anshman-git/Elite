# EliteStudy - Critical Fixes & Implementation Guide

**Quick Reference:** Use this document to implement the critical fixes in priority order.

---

## 🔴 FIX #1: Firestore Security Rules (2 hours)

**Current Status:** 🔴 CRITICAL - Database is completely open

### Step 1: Add Complete Firestore Rules

Go to **Firebase Console → Firestore → Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function signedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return signedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if signedIn();
      allow create: if signedIn() && isOwner(userId);
      allow update: if isOwner(userId) && (
        !('role' in request.resource.data) || 
        (request.resource.data.role == resource.data.role)
      );
      allow delete: if isOwner(userId);
    }

    // Quizzes - readable by all, writable by admins
    match /quizzes/{quizId} {
      allow read: if signedIn();
      allow create, update, delete: if isAdmin();
    }

    // Attempts - user sees only their own, admins see all
    match /attempts/{attemptId} {
      allow read: if signedIn() && (
        resource.data.userId == request.auth.uid || 
        isAdmin()
      );
      allow create: if signedIn() && 
        request.resource.data.userId == request.auth.uid;
      allow update, delete: if false; // Immutable
    }

    // Resources - readable by all, writable by admins
    match /resources/{resourceId} {
      allow read: if signedIn();
      allow create, update, delete: if isAdmin();
    }

    // Announcements - readable by all, writable by admins
    match /announcements/{announcementId} {
      allow read: if signedIn();
      allow create, update, delete: if isAdmin();
    }
  }
}
```

### Step 2: Test Rules (in Firebase Console)

1. Click **Rules** tab
2. Click **Test rules** at bottom
3. Test permissions:
   - ✅ User can read own profile
   - ❌ User cannot read other user's email
   - ✅ Admin can create quizzes
   - ❌ Student cannot create quizzes

---

## 🔴 FIX #2: Save Quiz Attempts (3-4 hours)

### Step 1: Update firebase.js

Add these imports at the top:
```javascript
import { increment, updateDoc, where } from 'firebase/firestore';
```

Add these functions at the end of the file:

```javascript
export async function submitAttempt(userId, quizId, quizData, answers) {
  if (!db) throw new Error('Firebase not configured');
  
  const questions = quizData.questions || [];
  
  // Calculate score
  const score = questions.reduce((total, item, index) => {
    const questionId = item.id || item.question || `question-${index}`;
    return total + (answers[questionId] === item.answer ? 1 : 0);
  }, 0);
  
  const accuracy = questions.length > 0 ? (score / questions.length) * 100 : 0;
  
  // Create attempt document
  const attemptRef = await addDoc(collection(db, 'attempts'), {
    userId,
    quizId,
    subject: quizData.subject,
    score,
    total: questions.length,
    accuracy: Math.round(accuracy),
    timeTaken: quizData.duration * 60, // Will be updated with actual time
    answers: Object.keys(answers).length > 0 ? answers : {},
    completedAt: serverTimestamp(),
  });

  // Update user points and last active
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: increment(Math.min(100, score * 10)),
      lastActiveAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update user points:', error);
    // Don't throw - attempt is saved even if points update fails
  }

  return attemptRef;
}

export function watchUserAttempts(userId, callback, options = {}) {
  const { take = 50, onError } = options;
  
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const userAttemptsQuery = query(
    collection(db, 'attempts'),
    where('userId', '==', userId),
    orderBy('completedAt', 'desc'),
    limit(take)
  );

  return onSnapshot(
    userAttemptsQuery,
    (snapshot) => {
      callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    },
    (error) => {
      console.error('Error watching user attempts:', error);
      callback([]);
      onError?.(error);
    }
  );
}
```

### Step 2: Update Quizzes.jsx

Replace the quiz submission logic:

```javascript
// In Quizzes.jsx, replace the submit quiz handler

const handleSubmitQuiz = async () => {
  try {
    setSubmitted(true); // Show results immediately
    
    // Save to Firestore in background
    await submitAttempt(user.uid, activeQuiz.id, activeQuiz, answers);
    notify('✅ Quiz saved to your performance history');
  } catch (error) {
    console.error('Failed to save attempt:', error);
    notify('⚠️ Quiz completed but could not save. Please retry.');
  }
};

// Add this where you have the submit button:
{!submitted ? (
  <Button 
    variant="accent" 
    onClick={handleSubmitQuiz}
    className="w-full"
  >
    Submit quiz
  </Button>
) : null}
```

### Step 3: Update Performance.jsx

Replace the attempts fetch:

```javascript
import { useApp } from '../context/AppContext';
import { watchUserAttempts } from '../firebase';

export default function Performance({ notify }) {
  const { user } = useApp();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    return watchUserAttempts(user.uid, (data) => {
      setAttempts(data);
      setLoading(false);
    }, {
      onError: () => {
        notify('⚠️ Could not load performance data');
        setLoading(false);
      },
    });
  }, [user?.uid, notify]);

  // No need to filter - data is already user-specific!
  const userAttempts = attempts;

  if (loading) {
    return <LoadingState />;
  }

  return (
    // ... existing JSX ...
  );
}
```

---

## 🔴 FIX #3: Global State Management (4-5 hours)

### Step 1: Create Context

Create `src/context/AppContext.jsx`:

```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import { watchAuth, watchCollection } from '../firebase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('elitestudy-theme') === 'dark';
  });
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Watch auth state
  useEffect(() => {
    const unsubscribe = watchAuth((sessionUser) => {
      setUser(sessionUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Watch announcements
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = watchCollection('announcements', setNotifications, {
      take: 10,
      onError: (error) => {
        console.error('Failed to load announcements:', error);
        addToast('Could not load notifications', 'error');
      },
    });

    return unsubscribe;
  }, [user]);

  // Update document class for dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('elitestudy-theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Toast notification system
  const addToast = (message, type = 'info', duration = 3200) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return () => clearTimeout(timer);
  };

  // Alias for consistency
  const notify = addToast;

  const toggleDark = () => setDark((prev) => !prev);

  const value = {
    user,
    dark,
    toggleDark,
    notifications,
    notify,
    toasts,
    loading,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
    clearToasts: () => setToasts([]),
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return context;
}
```

### Step 2: Update App.jsx

Replace entire App.jsx with:

```javascript
import { AppProvider } from './context/AppContext';
import { AppContent } from './AppContent';

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
```

### Step 3: Create AppContent.jsx

Create `src/AppContent.jsx`:

```javascript
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { BottomNav, Sidebar } from './components/navigation';
import { Button, Card, EmptyState, Toast, TopBar, LoadingState } from './components/ui';
import { useApp } from './context/AppContext';
import Admin from './screens/Admin';
import Auth from './screens/Auth';
import Dashboard from './screens/Dashboard';
import Leaderboard from './screens/Leaderboard';
import Performance from './screens/Performance';
import Profile from './screens/Profile';
import Quizzes from './screens/Quizzes';
import Resources from './screens/Resources';
import { useState } from 'react';

export function AppContent() {
  const { user, loading, dark, toggleDark, notifications, notify, toasts, isAdmin } = useApp();
  const [active, setActive] = useState('dashboard');
  const [drawer, setDrawer] = useState(false);

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Auth />;
  }

  const safeActive = active === 'admin' && !isAdmin ? 'dashboard' : active;

  const page = {
    dashboard: <Dashboard setActive={setActive} />,
    quizzes: <Quizzes />,
    resources: <Resources />,
    leaderboard: <Leaderboard />,
    performance: <Performance />,
    profile: <Profile />,
    admin: isAdmin ? <Admin /> : <Dashboard setActive={setActive} />,
  }[safeActive];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition dark:bg-slate-950 dark:text-slate-100">
      <TopBar dark={dark} onToggleDark={toggleDark} onOpenNotifications={() => setDrawer(true)} />
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar active={safeActive} setActive={setActive} isAdmin={isAdmin} />
        <main className="min-w-0 flex-1 px-4 pb-28 pt-4 sm:px-6 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={safeActive}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {page}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <BottomNav active={safeActive} setActive={setActive} isAdmin={isAdmin} />

      {/* Toast notifications */}
      <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast.message} type={toast.type} />
          ))}
        </AnimatePresence>
      </div>

      {/* Notifications drawer */}
      <AnimatePresence>
        {drawer ? (
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 p-4 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          >
            <motion.div
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ type: 'spring', damping: 30, stiffness: 260 }}
              className="ml-auto h-full w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Notifications</h2>
                <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => setDrawer(false)}>
                  <X size={18} />
                </Button>
              </div>
              {notifications.length ? (
                <div className="mt-4 space-y-3">
                  {notifications.map((item) => (
                    <Card key={item.id} className="p-4">
                      <p className="font-black text-slate-950 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.body}</p>
                      <p className="mt-3 text-xs font-bold text-blue-600">{formatDate(item.createdAt)}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState title="No notifications" body="Announcements will appear here." />
                </div>
              )}
            </motion.div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function formatDate(value) {
  const date = value?.toDate?.() || null;
  return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'just now';
}
```

### Step 4: Update Components to Use Context

Update all screens to use `useApp()`:

```javascript
// Dashboard.jsx
import { useApp } from '../context/AppContext';

export default function Dashboard({ setActive }) {
  const { user, notify } = useApp();
  // Remove notify from props
}

// Quizzes.jsx
import { useApp } from '../context/AppContext';

export default function Quizzes() {
  const { notify } = useApp();
  // Remove notify from props
}

// Same for all other screens...
```

---

## 🔴 FIX #4: Input Validation (3-4 hours)

### Step 1: Create Validation Module

Create `src/validation.js`:

```javascript
export const VALIDATION_RULES = {
  QUIZ_TITLE_MAX: 200,
  QUESTION_MAX: 1000,
  OPTION_MAX: 500,
  EXPLANATION_MAX: 2000,
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 6,
  MIN_QUIZ_QUESTIONS: 1,
  MAX_QUIZ_QUESTIONS: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 6,
};

export function validateEmail(email) {
  if (!email?.trim()) {
    return 'Email is required';
  }
  if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    return 'Invalid email address';
  }
  return null;
}

export function validatePassword(password) {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < VALIDATION_RULES.MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export function validateName(name) {
  if (!name?.trim()) {
    return 'Full name is required';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  if (name.length > 100) {
    return 'Name must be less than 100 characters';
  }
  return null;
}

export function validateQuiz(quiz) {
  const errors = [];

  // Validate title
  if (!quiz.title?.trim()) {
    errors.push('Quiz title is required');
  } else if (quiz.title.length > VALIDATION_RULES.QUIZ_TITLE_MAX) {
    errors.push(`Quiz title must be under ${VALIDATION_RULES.QUIZ_TITLE_MAX} characters`);
  }

  // Validate questions array
  if (!quiz.questions?.length) {
    errors.push('At least 1 question is required');
  } else if (quiz.questions.length > VALIDATION_RULES.MAX_QUIZ_QUESTIONS) {
    errors.push(`Maximum ${VALIDATION_RULES.MAX_QUIZ_QUESTIONS} questions allowed`);
  }

  // Validate each question
  quiz.questions?.forEach((q, idx) => {
    if (!q.question?.trim()) {
      errors.push(`Question ${idx + 1}: Question text is required`);
    } else if (q.question.length > VALIDATION_RULES.QUESTION_MAX) {
      errors.push(`Question ${idx + 1}: Too long (max ${VALIDATION_RULES.QUESTION_MAX} chars)`);
    }

    const options = (q.options || []).filter((opt) => opt?.trim());
    if (options.length < VALIDATION_RULES.MIN_OPTIONS) {
      errors.push(`Question ${idx + 1}: At least ${VALIDATION_RULES.MIN_OPTIONS} options required`);
    } else if (options.length > VALIDATION_RULES.MAX_OPTIONS) {
      errors.push(`Question ${idx + 1}: Maximum ${VALIDATION_RULES.MAX_OPTIONS} options allowed`);
    }

    // Check for duplicate options
    const uniqueOptions = new Set(options.map((opt) => opt.toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      errors.push(`Question ${idx + 1}: Options must be unique`);
    }

    if (!q.answer?.trim()) {
      errors.push(`Question ${idx + 1}: Correct answer is required`);
    } else if (!options.includes(q.answer.trim())) {
      errors.push(`Question ${idx + 1}: Answer must match an option exactly`);
    }

    if (q.explanation && q.explanation.length > VALIDATION_RULES.EXPLANATION_MAX) {
      errors.push(`Question ${idx + 1}: Explanation is too long`);
    }
  });

  return errors;
}

export function validateAnnouncement(announcement) {
  const errors = [];

  if (!announcement.title?.trim()) {
    errors.push('Announcement title is required');
  } else if (announcement.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (!announcement.body?.trim()) {
    errors.push('Announcement message is required');
  } else if (announcement.body.length > 2000) {
    errors.push('Message must be less than 2000 characters');
  }

  return errors;
}
```

### Step 2: Update Auth.jsx

```javascript
import { validateEmail, validatePassword, validateName } from '../validation';

export default function Auth() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const { notify } = useApp();

  const validateForm = () => {
    const newErrors = {};

    if (mode === 'signup') {
      const nameError = validateName(form.name);
      if (nameError) newErrors.name = nameError;
    }

    const emailError = validateEmail(form.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(form.password);
    if (passwordError) newErrors.password = passwordError;

    if (mode === 'signup' && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function submit(event) {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === 'signup') {
        const result = await signupWithEmail(form);
        notify(
          result.profileCreated
            ? '✅ Account created! Welcome to EliteStudy.'
            : '✅ Account created. Please try logging in.'
        );
      } else if (mode === 'forgot') {
        await resetPassword(form.email);
        notify('✅ Password reset email sent');
      } else {
        await loginWithEmail(form.email, form.password);
        notify('✅ Welcome back!');
      }
    } catch (error) {
      notify(`❌ ${getFriendlyFirebaseError(error)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    // ... existing JSX ...
  );
}
```

---

## 🟡 FIX #5: Error Boundaries (2-3 hours)

### Create Error Boundary

Create `src/components/ErrorBoundary.jsx`:

```javascript
import { Component } from 'react';
import { Button, Card } from './ui';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Send to error tracking service (Sentry, etc.)
    // captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center p-4">
          <Card className="max-w-md text-center">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
              Oops! Something went wrong
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer font-mono text-xs">Details</summary>
                <pre className="mt-2 overflow-auto rounded bg-slate-100 p-2 text-xs dark:bg-slate-800">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Reload page
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                className="flex-1"
              >
                Go home
              </Button>
            </div>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}
```

### Update App.jsx

```javascript
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import { AppContent } from './AppContent';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
```

---

## 🟡 FIX #6: Loading States (2-3 hours)

### Update ui.jsx with improved loading states

```javascript
// Add to components/ui.jsx

export function Skeleton({ className = '' }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={classNames(
        'rounded-2xl bg-slate-200 dark:bg-white/10',
        className
      )}
    />
  );
}

export function LoadingCard() {
  return (
    <Card>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-4 w-24" />
      <Skeleton className="mt-3 h-12" />
      <Skeleton className="mt-2 h-12" />
    </Card>
  );
}

export function LoadingState() {
  return (
    <div className="grid min-h-[280px] place-items-center">
      <div className="text-center">
        <div className="inline-block">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading...
        </p>
      </div>
    </div>
  );
}
```

### Update Dashboard.jsx with loading states

```javascript
export default function Dashboard() {
  const { user, notify } = useApp();
  const [leaderboard, setLeaderboard] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    return watchCollection('users', (data) => {
      setLeaderboard(data);
      setLoading(false);
    }, {
      sortField: 'points',
      take: 3,
      onError: () => {
        notify('⚠️ Could not load leaderboard');
        setLoading(false);
      },
    });
  }, [notify]);

  useEffect(() => {
    return watchCollection('announcements', setActivities, {
      take: 4,
      onError: () => notify('⚠️ Could not load activity'),
    });
  }, [notify]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    // ... existing JSX ...
  );
}
```

---

## ✅ VERIFICATION CHECKLIST

After implementing all fixes, verify:

- [ ] Firestore rules are deployed and tested
- [ ] Quiz attempts are saved to Firestore
- [ ] User points increment after quiz
- [ ] No prop drilling (all screens use `useApp()`)
- [ ] Error boundaries catch crashes gracefully
- [ ] Validation prevents bad data from being saved
- [ ] Loading spinners show while fetching
- [ ] All tests pass: `npm run lint`

---

## 🚀 NEXT STEPS

1. **Implement fixes in order** (most critical first)
2. **Test thoroughly** with real data
3. **Add unit tests** for validation functions
4. **Deploy to staging** Firebase project
5. **Load test** with multiple concurrent users
6. **Monitor Firestore costs** (watch the rules!)

---

**Total Implementation Time:** ~15-20 hours of focused work

**You've got this!** 🎯
