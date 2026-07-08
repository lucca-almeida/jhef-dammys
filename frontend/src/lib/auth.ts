export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthSession = {
  token: string;
  user: AuthUser;
};

const TOKEN_KEY = 'jhefdammys.token';
const USER_KEY = 'jhefdammys.user';

export function getStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawUser = window.localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
