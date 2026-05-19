import { useCallback, useEffect, useState } from 'react';
import { markAllNotificationsRead, markNotificationRead, watchAuth, watchCollection, watchDocument, watchUserNotifications } from '../firebase';
import { AppContext } from './app-context';

const THEME_STORAGE_KEY = 'theme';
const LEGACY_THEME_STORAGE_KEY = 'elitestudy-theme';

function getStoredTheme() {
  if (typeof window === 'undefined') return false;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (savedTheme) return savedTheme === 'dark';

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(getStoredTheme);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toast notification system
  const addToast = useCallback((message, type = 'info', duration = 3200) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  // Watch auth state
  useEffect(() => {
    const unsubscribe = watchAuth((sessionUser) => {
      setUser(sessionUser);
      if (!sessionUser) {
        setNotifications([]);
        setAnnouncements([]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.uid) return () => {};

    const unsubscribe = watchDocument('users', user.uid, (userDoc) => {
      if (!userDoc) return;
      const { id, ...data } = userDoc;
      setUser((current) => ({ ...current, uid: id, ...data }));
    }, {
      onError: (error) => {
        console.error('Failed to sync user profile:', error);
      },
    });

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
    localStorage.setItem(LEGACY_THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    if (!user?.uid) {
      return () => {};
    }

    const unsubscribers = [
      watchUserNotifications(user.uid, setNotifications, {
        take: 20,
        onError: (error) => {
          console.error('Failed to load notifications:', error);
          addToast('Could not load notifications', 'error');
        },
      }),
      watchCollection('announcements', setAnnouncements, {
        take: 10,
        onError: (error) => {
          console.error('Failed to load announcements:', error);
        },
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
  }, [user?.uid, addToast]);

  // Alias for consistency
  const notify = addToast;

  const toggleDark = useCallback(() => {
    setDark((current) => !current);
  }, []);

  const value = {
    user,
    dark,
    toggleDark,
    notifications,
    announcements,
    unreadCount: notifications.filter((item) => !item.read).length,
    markNotificationRead,
    markAllNotificationsRead,
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

