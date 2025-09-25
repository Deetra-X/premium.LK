// Simple in-code credentials and helpers for client-side auth (no database)

export const HARDCODED_CREDENTIALS = {
  // Change these values as needed
  email: 'admin@premium.lk',
  password: 'premium123',
};

export const SESSION_KEY = 'premiumlk_auth_session';
export const LOCK_KEY = 'premiumlk_lock_state';

// Toggle this to control whether login persists across reloads.
// false = always require login on initial load (no auto-login)
// true  = remember the session in localStorage
const PERSIST_SESSION = false;

export type AuthSession = {
  email: string;
};

export function verifyCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === HARDCODED_CREDENTIALS.email.toLowerCase() &&
    password === HARDCODED_CREDENTIALS.password
  );
}

export function getSavedSession(): AuthSession | null {
  if (!PERSIST_SESSION) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  if (!PERSIST_SESSION) return; // do not persist; in-memory only
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getLockState(): boolean {
  return localStorage.getItem(LOCK_KEY) === 'true';
}

export function setLockState(locked: boolean) {
  if (locked) {
    localStorage.setItem(LOCK_KEY, 'true');
  } else {
    localStorage.removeItem(LOCK_KEY);
  }
}
