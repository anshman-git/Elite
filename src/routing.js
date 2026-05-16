export function parseRoute(pathname = window.location.pathname) {
  const profileMatch = pathname.match(/^\/profile\/([^/]+)\/?$/);
  if (profileMatch) {
    return { view: 'public-profile', profileUserId: profileMatch[1] };
  }
  return { view: 'app', profileUserId: null };
}

export function navigateToProfile(userId) {
  if (!userId) return;
  const nextPath = `/profile/${userId}`;
  if (window.location.pathname !== nextPath) {
    window.history.pushState({ profileUserId: userId }, '', nextPath);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function navigateHome() {
  if (window.location.pathname !== '/') {
    window.history.pushState({}, '', '/');
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}
