import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api.auth.me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('cvb:unauthorized', onExpired);
    return () => window.removeEventListener('cvb:unauthorized', onExpired);
  }, []);

  const finish = useCallback((res) => {
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: (phone, password) => api.auth.login({ phone, password }).then(finish),
      register: (name, phone, password) => api.auth.register({ name, phone, password }).then(finish),
      logout: async () => {
        try { await api.auth.logout(); } catch { /* token may already be invalid */ }
        setToken(null);
        setUser(null);
      },
    }),
    [user, loading, finish]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
