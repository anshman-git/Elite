import { Suspense, lazy, useCallback, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav, Sidebar } from './components/navigation';
import { LoadingState, Toast, TopBar } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingTour } from './components/OnboardingTour';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { useQuizGuard } from './routing';
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

// Map clean URL paths to the components that live behind the authenticated shell.
const ROUTE_COMPONENTS = {
  '/': Dashboard,
  '/quizzes': Quizzes,
  '/performance': Performance,
  '/leaderboard': Leaderboard,
  '/community': Community,
  '/profile': Profile,
  '/admin': Admin,
};

// Bootstrap wrapper: providers first, then the router (hooks need both).
export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

function AppRoutes() {
  const { user, loading } = useApp();

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
        <Routes>
          <Route path="*" element={<PublicEntry />} />
        </Routes>
      </Suspense>
    );
  }

  return <AppShell />;
}

/** Unauthenticated entry: shows the landing page with an auth toggle. */
function PublicEntry() {
  const { notify } = useApp();
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return <Auth notify={notify} onBack={() => setShowAuth(false)} />;
  }
  return <LandingPage onGetStarted={() => setShowAuth(true)} />;
}

/** Authenticated app shell wiring the current URL to the rendered screen. */
function AppShell() {
  const {
    user, dark, toggleDark,
    notify, toasts, isAdmin,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('elitestudy-onboarding-seen') !== 'true';
  });

  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Block browser back/forward while a quiz is in progress.
  useQuizGuard();

  const guardedSetActive = useCallback((next) => {
    if (!confirmLeaveQuiz()) return;
    const target = ROUTE_COMPONENTS[next] ? next : '/';
    navigate(target);
    setSidebarOpen(false); // close mobile drawer on navigate
  }, [navigate]);

  const openProfile = useCallback((userId) => {
    if (!confirmLeaveQuiz()) return;
    navigate(userId ? `/profile/${userId}` : '/profile');
  }, [navigate]);

  const frameProps = { setActive: guardedSetActive, user, notify, openProfile };
  const activeKey = currentPath === '/' ? 'dashboard' : currentPath.slice(1);
  // Hide the bottom nav only on public profiles and the 404 page.
  const bottomNavVisible = !currentPath.startsWith('/profile/') && currentPath !== '*';

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
          active={activeKey}
          setActive={guardedSetActive}
          isAdmin={isAdmin}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          user={user}
        />

        <main
          className={`app-main min-w-0 flex-1 overflow-y-auto px-4 pb-8 pt-5 transition-[margin,padding] duration-150 sm:px-6 sm:pt-6 ${sidebarCollapsed ? 'md:ml-[var(--sidebar-collapsed-width)]' : 'md:ml-[var(--sidebar-expanded-width)]'}`}
        >
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPath}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
              >
                <Suspense fallback={<LoadingState />}>
                  <Routes>
                    {Object.entries(ROUTE_COMPONENTS).map(([path, Component]) => {
                      // Non-admins hitting /admin are redirected to the dashboard.
                      const Screen =
                        path === '/admin' && !isAdmin ? Dashboard : Component;
                      return (
                        <Route
                          key={path}
                          path={path}
                          element={
                            <Screen {...frameProps} isAdmin={isAdmin} />
                          }
                        />
                      );
                    })}
                    <Route
                      path="/profile/:userId"
                      element={<PublicProfile notify={notify} />}
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {bottomNavVisible ? (
        <BottomNav
          active={activeKey}
          setActive={guardedSetActive}
          onMore={() => setSidebarOpen(true)}
        />
      ) : null}

      <OnboardingTour open={currentPath !== '*' && showOnboarding} onDone={() => setShowOnboarding(false)} />

      <Toast toasts={toasts} />
    </div>
  );
}
