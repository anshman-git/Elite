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

  // Toast notification system
  const addToast = (message, type = 'info', duration = 3200) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return () => clearTimeout(timer);
  };

  // Watch auth state
  useEffect(() => {
    const unsubscribe = watchAuth((sessionUser) => {
      setUser(sessionUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Clear notifications when user logs out
  useEffect(() => {
    if (!user) {
      setNotifications([]);
    }
  }, [user]);

  // Watch announcements
  useEffect(() => {
    if (!user) {
      return () => {};
    }

    const unsubscribe = watchCollection('announcements', setNotifications, {
      take: 10,
      onError: (error) => {
        console.error('Failed to load announcements:', error);
        addToast('Could not load notifications', 'error');
      },
    });

    return unsubscribe;
  }, [user, addToast]);

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