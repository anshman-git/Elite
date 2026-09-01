import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav, Sidebar } from './components/navigation';
import { LoadingState, Toast, TopBar } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingTour } from './components/OnboardingTour';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { navigateHome, navigateToProfile, parseRoute } from './routing';
import { confirmLeaveQuiz } from './utils';

// Lazy-loaded screens — each is code-split into its own chunk and loaded on demand.
// Shared providers/layout (AppProvider, TopBar, Sidebar, BottomNav, ui) stay eager.
const LandingPage = lazy(() => import('./screens/LandingPage'));
const Auth = lazy(() => import('./screens/Auth'));
const Dashboard = lazy(() => import('./screens/Dashboard'));
const Quizzes = lazy(() => import('./screens/Quizzes'));
const Community = lazy(() => import('./screens/Community'));
const Leaderboard = lazy(() => import('./screens/Leaderboard'));
const Performance = lazy(() => import('./screens/Performance'));
const Profile = lazy(() => import('./screens/Profile'));
const Admin = lazy(() => import('./screens/Admin'));
const PublicProfile = lazy(() => import('./screens/PublicProfile'));
const NotFound = lazy(() => import('./screens/NotFound'));

function AppContent() {
  const {
    user, dark, toggleDark,
    notify, toasts, isAdmin, loading,
  } = useApp();

  const [active, setActive] = useState('dashboard');
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
    return (
      <Suspense fallback={<LoadingState />}>
        {showAuth ? (
          <Auth notify={notify} onBack={() => setShowAuth(false)} />
        ) : (
          <LandingPage onGetStarted={() => setShowAuth(true)} />
        )}
      </Suspense>
    );
  }

  return (
    <div className="app-shell h-screen overflow-hidden bg-[rgb(var(--color-bg-base))] text-ink-200 transition-colors duration-300 flex flex-col">
      <TopBar
        dark={dark}
        onToggleDark={toggleDark}
        isAdmin={isAdmin}
        user={user}
        onMenuToggle={() => setSidebarOpen((v) => !v)}
        menuOpen={sidebarOpen}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          active={showingPublicProfile ? 'leaderboard' : safeActive}
          setActive={guardedSetActive}
          isAdmin={isAdmin}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          user={user}
        />

        <main
          className="app-main flex-1 min-w-0 overflow-y-auto transition-all duration-300 px-3 pb-24 pt-3 sm:px-6 sm:pb-28 sm:pt-4 lg:pb-8 md:ml-64"
          style={{ marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed-width, 5rem)' : undefined }}
        >
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
                <Suspense fallback={<LoadingState />}>
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
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {!showingPublicProfile && !showingNotFound ? (
        <BottomNav active={safeActive} setActive={guardedSetActive} isAdmin={isAdmin} />
      ) : null}

      <OnboardingTour open={!showingNotFound && showOnboarding} onDone={completeOnboarding} />

      <Toast toasts={toasts} />
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
