// src/lib/auth.ts

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

const STORAGE_KEY = 'cf_logged_in_user';

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch (err) {
    console.error('Failed to parse auth user from localStorage:', err);
    return null;
  }
}

export function setCurrentUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to write auth user to localStorage:', err);
  }
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export function logOut() {
  setCurrentUser(null);
}
