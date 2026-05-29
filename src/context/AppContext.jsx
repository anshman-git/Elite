import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  markAllNotificationsRead,
  markNotificationRead,
  watchAuth,
  watchCollection,
  watchDocument,
  watchUserNotifications,
} from '../firebase';
import { AppContext } from './app-context';

const THEME_STORAGE_KEY = 'theme';
const LEGACY_THEME_STORAGE_KEY = 'elitestudy-theme';

function getStoredTheme() {
  if (typeof window === 'undefined') return false;
  const saved =
    localStorage.getItem(THEME_STORAGE_KEY) ||
    localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (saved) return saved === 'dark';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function AppProvider({ children }) {
  const [user, setUser]                 = useState(null);
  const [dark, setDark]                 = useState(getStoredTheme);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [toasts, setToasts]             = useState([]);
  const [loading, setLoading]           = useState(true);

  // ── Toast system ─────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info', duration = 3200) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const clearToasts = useCallback(() => setToasts([]), []);

  // ── Theme sync ───────────────────────────────────────────────────────────
  const toggleDark = useCallback(() => setDark((v) => !v), []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
    localStorage.setItem(LEGACY_THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    return watchAuth((sessionUser) => {
      setUser(sessionUser);
      if (!sessionUser) {
        setNotifications([]);
        setAnnouncements([]);
      }
      setLoading(false);
    });
  }, []);

  // ── Live user profile sync ───────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return () => {};
    return watchDocument('users', user.uid, (userDoc) => {
      if (!userDoc) return;
      const { id, ...data } = userDoc;
      setUser((current) => ({ ...current, uid: id, ...data }));
    }, {
      onError: (err) => console.error('Failed to sync user profile:', err),
    });
  }, [user?.uid]);

  // ── Notifications + announcements ────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return () => {};
    const unsubs = [
      watchUserNotifications(user.uid, setNotifications, {
        take: 20,
        onError: (err) => {
          console.error('Failed to load notifications:', err);
          addToast('Could not load notifications', 'error');
        },
      }),
      watchCollection('announcements', setAnnouncements, {
        take: 10,
        onError: (err) => console.error('Failed to load announcements:', err),
      }),
    ];
    return () => unsubs.forEach((u) => u?.());
  }, [user?.uid, addToast]);

  // ── Derived values (stable references) ──────────────────────────────────
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);
  const isAuthenticated = useMemo(() => !!user, [user]);

  // ── Context value — memoised so consumers only re-render on real changes ─
  const value = useMemo(
    () => ({
      user,
      dark,
      toggleDark,
      notifications,
      announcements,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      notify: addToast,
      toasts,
      loading,
      isAdmin,
      isAuthenticated,
      clearToasts,
    }),
    [
      user, dark, toggleDark, notifications, announcements, unreadCount,
      addToast, toasts, loading, isAdmin, isAuthenticated, clearToasts,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
