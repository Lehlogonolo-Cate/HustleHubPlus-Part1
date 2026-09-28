import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, onUnauthorized, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // While a stored token is being checked, protected pages wait instead of redirecting
  const [checking, setChecking] = useState(() => Boolean(tokenStore.get()));

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    onUnauthorized(clearSession);
  }, [clearSession]);

  // The token is re-validated with the server on load rather than trusted blindly
  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then(({ user: profile }) => setUser(profile))
      .catch(clearSession)
      .finally(() => setChecking(false));
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const { token, user: profile } = await api.login(credentials);
    tokenStore.set(token);
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    try {
      // Revokes the token on the server so a copy of it cannot be reused
      await api.logout();
    } catch {
      /* the local session is cleared regardless */
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(() => ({ user, checking, login, logout }), [user, checking, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export const homePathFor = (role) => {
  if (role === 'freelancer') return '/dashboard';
  if (role === 'admin') return '/admin';
  return '/gigs';
};
