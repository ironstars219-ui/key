import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth.api.js';
import { tokenStore } from '../api/http.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  // при открытии страницы проверяем сохранённый токен
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi.me().then((r) => setUser(r.user)).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  // сервер ответил 401: возвращаем на вход
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const signIn = useCallback(async (login, password) => {
    const r = await authApi.login(login, password);
    tokenStore.set(r.token);
    setUser(r.user);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin: user?.role === 'ADMIN' }}>{children}</AuthContext.Provider>;
}
