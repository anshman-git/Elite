import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { BottomNav, Sidebar } from './components/navigation';
import { Button, Card, EmptyState, LoadingState, Toast, TopBar } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import Admin from './screens/Admin';
import Auth from './screens/Auth';
import Dashboard from './screens/Dashboard';
import Leaderboard from './screens/Leaderboard';
import Performance from './screens/Performance';
import Profile from './screens/Profile';
import Quizzes from './screens/Quizzes';
import Resources from './screens/Resources';

function AppContent() {
  const { user, dark, toggleDark, notifications, notify, toasts, isAdmin, loading } = useApp();
  const [active, setActive] = useState('dashboard');
  const [drawer, setDrawer] = useState(false);

  const safeActive = active === 'admin' && user?.role !== 'admin' ? 'dashboard' : active;

  const page = useMemo(() => {
    const props = { setActive, user, notify };
    return {
      dashboard: <Dashboard {...props} />,
      quizzes: <Quizzes {...props} />,
      resources: <Resources {...props} />,
      leaderboard: <Leaderboard {...props} />,
      performance: <Performance {...props} />,
      profile: <Profile {...props} />,
      admin: isAdmin ? <Admin {...props} /> : <Dashboard {...props} />,
    }[safeActive];
  }, [safeActive, user, isAdmin, notify]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 transition dark:bg-slate-950 dark:text-slate-100">
        <LoadingState />
      </div>
    );
  }

  if (!user) {
    return <Auth notify={notify} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition dark:bg-slate-950 dark:text-slate-100">
      <TopBar dark={dark} onToggleDark={toggleDark} onOpenNotifications={() => setDrawer(true)} isAdmin={isAdmin} user={user} />
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
      <Toast message={toasts.length > 0 ? toasts[0].message : ''} />
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
                  <EmptyState title="No notifications" body="Announcements will appear here when they are published." />
                </div>
              )}
            </motion.div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

function formatDate(value) {
  const date = value?.toDate?.() || null;
  return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'just now';
}
