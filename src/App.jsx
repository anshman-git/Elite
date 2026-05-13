import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { BottomNav, Sidebar } from './components/navigation';
import { Button, Card, Toast, TopBar } from './components/ui';
import { notifications } from './data/mockData';
import { watchAuth } from './firebase';
import Admin from './screens/Admin';
import Auth from './screens/Auth';
import Dashboard from './screens/Dashboard';
import Leaderboard from './screens/Leaderboard';
import Performance from './screens/Performance';
import Profile from './screens/Profile';
import Quizzes from './screens/Quizzes';
import Resources from './screens/Resources';

const demoUser = {
  displayName: 'Elite learner',
  email: 'demo@elitestudy.app',
  role: 'student',
};

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [demo, setDemo] = useState(false);
  const [demoRole, setDemoRole] = useState('student');
  const [dark, setDark] = useState(() => localStorage.getItem('elitestudy-theme') === 'dark');
  const [toast, setToast] = useState('');
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const unsubscribe = watchAuth((sessionUser) => setUser(sessionUser));
    return unsubscribe;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('elitestudy-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const authedUser = useMemo(() => user || (demo ? { ...demoUser, role: demoRole } : null), [demo, demoRole, user]);
  const isAdmin = authedUser?.role === 'admin';
  const safeActive = active === 'admin' && !isAdmin ? 'dashboard' : active;

  function notify(message) {
    setToast(message);
    window.clearTimeout(window.eliteStudyToastTimer);
    window.eliteStudyToastTimer = window.setTimeout(() => setToast(''), 3200);
  }

  const page = useMemo(() => {
    const props = { setActive, user: authedUser, notify };
    return {
      dashboard: <Dashboard {...props} />,
      quizzes: <Quizzes {...props} />,
      resources: <Resources {...props} />,
      leaderboard: <Leaderboard {...props} />,
      performance: <Performance {...props} />,
      profile: <Profile {...props} />,
      admin: isAdmin ? <Admin {...props} /> : <Dashboard {...props} />,
    }[safeActive];
  }, [safeActive, authedUser, isAdmin]);

  if (!authedUser) {
    return (
      <Auth
        notify={notify}
        onDemoLogin={(role) => {
          setDemoRole(role);
          setDemo(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition dark:bg-slate-950 dark:text-slate-100">
      <TopBar dark={dark} onToggleDark={() => setDark((value) => !value)} onOpenNotifications={() => setDrawer(true)} />
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
      <Toast message={toast} />
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
              <div className="mt-4 space-y-3">
                {notifications.map((item) => (
                  <Card key={item.title} className="p-4">
                    <p className="font-black text-slate-950 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.body}</p>
                    <p className="mt-3 text-xs font-bold text-blue-600">{item.time}</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
