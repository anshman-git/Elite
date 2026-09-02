import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmLeaveQuiz } from './utils';

// App route names (used across components) mapped to clean URL paths.
export const ROUTES = {
  dashboard: '/',
  quizzes: '/quizzes',
  performance: '/performance',
  leaderboard: '/leaderboard',
  community: '/community',
  profile: '/profile',
  admin: '/admin',
};

// Public (pre-auth) routes map.
export const PUBLIC_ROUTES = {
  landing: '/',
  auth: '/auth',
};

/**
 * Block navigation (browser back/forward and in-app) while a quiz is active.
 * Returns a navigate() wrapper that respects the quiz guard.
 */
export function useQuizGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = async (event) => {
      if (!confirmLeaveQuiz()) {
        // Block the browser popstate by restoring the previous entry.
        event.preventDefault();
        window.history.pushState(null, '', window.location.pathname);
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const guardedNavigate = (to, options) => {
    if (!confirmLeaveQuiz()) return;
    navigate(to, options);
  };

  return { navigate: guardedNavigate };
}
