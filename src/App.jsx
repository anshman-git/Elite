import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCheck, Megaphone, X } from 'lucide-react';
import { BottomNav, Sidebar } from './components/navigation';
import { Button, Card, EmptyState, LoadingState, Toast, TopBar } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingTour } from './components/OnboardingTour';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { navigateHome, navigateToProfile, parseRoute } from './routing';
import { confirmLeaveQuiz } from './utils';
import Admin from './screens/Admin';
import Auth from './screens/Auth';
import LandingPage from './screens/LandingPage';
import Dashboard from './screens/Dashboard';
import Community from './screens/Community';
import Leaderboard from './screens/Leaderboard';
import Performance from './screens/Performance';
import Profile from './screens/Profile';
import PublicProfile from './screens/PublicProfile';
import NotFound from './screens/NotFound';
import Quizzes from './screens/Quizzes';
import Resources from './screens/Resources';

function AppContent() {
  const {
    user, dark, toggleDark, notifications, announcements,
    unreadCount, markAllNotificationsRead, markNotificationRead,
    notify, toasts, isAdmin, loading,
  } = useApp();

  const [active, setActive] = useState('dashboard');
  const [drawer, setDrawer] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [route, setRoute] = useState(() => parseRoute());
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('elitestudy-onboarding-seen') !== 'true';
  });
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const syncRoute = () => setRoute(parseRoute());
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const guardedSetActive = useCallback((next) => {
    if (!confirmLeaveQuiz()) return;
    setActive(next);
    setSidebarOpen(false); // close mobile drawer on navigate
  }, []);

  const openProfile = useCallback((userId) => {
    if (!confirmLeaveQuiz()) return;
    navigateToProfile(userId);
    setRoute({ view: 'public-profile', profileUserId: userId });
  }, []);

  const closePublicProfile = () => {
    if (!confirmLeaveQuiz()) return;
    navigateHome();
    setRoute(parseRoute('/'));
  };

  const completeOnboarding = () => {
    localStorage.setItem('elitestudy-onboarding-seen', 'true');
    setShowOnboarding(false);
  };

  const safeActive = active === 'admin' && user?.role !== 'admin' ? 'dashboard' : active;
  const showingPublicProfile = Boolean(route.profileUserId);
  const showingNotFound = route.view === 'not-found';

  const page = useMemo(() => {
    const props = { setActive: guardedSetActive, user, notify, openProfile };
    return {
      dashboard:   <Dashboard {...props} />,
      quizzes:     <Quizzes {...props} />,
      resources:   <Resources {...props} />,
      community:   <Community {...props} />,
      leaderboard: <Leaderboard {...props} />,
      performance: <Performance {...props} />,
      profile:     <Profile {...props} />,
      admin:       isAdmin ? <Admin {...props} /> : <Dashboard {...props} />,
    }[safeActive];
  }, [safeActive, user, isAdmin, notify, openProfile, guardedSetActive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-bg-base))] text-ink-200">
        <LoadingState />
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <Auth notify={notify} onBack={() => setShowAuth(false)} />;
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg-base))] text-ink-200 transition-colors duration-300">
      <TopBar
        dark={dark}
        onToggleDark={toggleDark}
        onOpenNotifications={() => setDrawer(true)}
        isAdmin={isAdmin}
        user={user}
        unreadCount={unreadCount}
        onMenuToggle={() => setSidebarOpen((v) => !v)}
        menuOpen={sidebarOpen}
      />

      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar
          active={showingPublicProfile ? 'leaderboard' : safeActive}
          setActive={guardedSetActive}
          isAdmin={isAdmin}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />

        <main className="min-w-0 flex-1 px-4 pb-28 pt-4 sm:px-6 lg:pb-8 transition-all duration-300">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  showingNotFound
                    ? 'not-found'
                    : showingPublicProfile
                    ? `profile-${route.profileUserId}`
                    : safeActive
                }
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {showingNotFound ? (
                  <NotFound />
                ) : showingPublicProfile ? (
                  <PublicProfile
                    profileUserId={route.profileUserId}
                    onBack={closePublicProfile}
                    notify={notify}
                  />
                ) : (
                  page
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {!showingPublicProfile && !showingNotFound ? (
        <BottomNav active={safeActive} setActive={guardedSetActive} isAdmin={isAdmin} />
      ) : null}

      <OnboardingTour open={!showingNotFound && showOnboarding} onDone={completeOnboarding} />

      <Toast
        message={toasts.length > 0 ? toasts[0].message : ''}
        type={toasts.length > 0 ? toasts[0].type : 'info'}
      />

      {/* ── Notification drawer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {drawer ? (
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-100/20 p-4 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          >
            <motion.div
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ type: 'spring', damping: 30, stiffness: 260 }}
              className="ml-auto h-full w-full max-w-sm overflow-y-auto rounded-3xl border border-line p-4 shadow-xl"
              style={{ backgroundColor: 'rgb(var(--color-bg-surface))' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-ink-100">Notifications</h2>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 ? (
                    <Button variant="ghost" className="h-10 px-3" onClick={() => markAllNotificationsRead(user.uid)}>
                      <CheckCheck size={16} /> Read
                    </Button>
                  ) : null}
                  <Button variant="ghost" className="h-10 w-10 p-0" onClick={() => setDrawer(false)}>
                    <X size={18} />
                  </Button>
                </div>
              </div>

              {notifications.length ? (
                <div className="mt-4 space-y-3">
                  {notifications.map((item) => (
                    <Card
                      key={item.id}
                      className={`p-4 ${item.read ? 'opacity-70' : 'border-cyan-400/30'}`}
                      onClick={() => !item.read && markNotificationRead(item.id)}
                    >
                      <p className="font-black text-ink-100">{item.title}</p>
                      <p className="mt-1 text-sm text-ink-400">{item.body}</p>
                      <p className="mt-3 text-xs font-bold text-cyan-400">{formatDate(item.createdAt)}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState title="No notifications" body="Announcements will appear here when they are published." />
                </div>
              )}

              {announcements.length ? (
                <div className="mt-5">
                  <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                    <Megaphone size={14} /> Announcements
                  </p>
                  <div className="space-y-3">
                    {announcements.slice(0, 3).map((item) => (
                      <Card key={item.id} className="p-4">
                        <p className="font-black text-ink-100">{item.title}</p>
                        <p className="mt-1 text-sm text-ink-400">{item.body}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : null}
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
  return date
    ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'just now';
}