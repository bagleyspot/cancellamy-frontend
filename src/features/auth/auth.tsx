import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/endpoints';
import { refreshAccessToken, setAccessToken, setSessionExpiredHandler } from '@/api/http';
import type { LoginRequest, RegisterRequest, UserDto } from '@/api/types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: UserDto | null;
  login: (body: LoginRequest) => Promise<UserDto>;
  register: (body: RegisterRequest) => Promise<UserDto>;
  logout: () => Promise<void>;
  /** Re-reads GET /me (e.g. after email verification). */
  refreshUser: () => Promise<void>;
  setUser: (user: UserDto) => void;
  /** Local sign-out without calling the API (e.g. after account deletion). */
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUserState] = useState<UserDto | null>(null);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUserState(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  // Restore the session on app load via the httpOnly refresh cookie.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await refreshAccessToken();
      if (!token) {
        if (!cancelled) setStatus('anonymous');
        return;
      }
      try {
        const me = await api.me.get();
        if (cancelled) return;
        setUserState(me);
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        setStatus('anonymous');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // A 401 that survived one refresh+retry means the session is gone: the router sends the user to /accedi.
  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  const establish = useCallback((response: { user: UserDto; accessToken: string }) => {
    setAccessToken(response.accessToken);
    setUserState(response.user);
    setStatus('authenticated');
    return response.user;
  }, []);

  const login = useCallback(async (body: LoginRequest) => establish(await api.auth.login(body)), [establish]);
  const register = useCallback(async (body: RegisterRequest) => establish(await api.auth.register(body)), [establish]);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    setUserState(await api.me.get());
  }, []);

  const setUser = useCallback((next: UserDto) => setUserState(next), []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout, refreshUser, setUser, clearSession }),
    [status, user, login, register, logout, refreshUser, setUser, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

/** For screens rendered only behind <ProtectedRoute>: the user is guaranteed to exist. */
export function useCurrentUser(): UserDto {
  const { user } = useAuth();
  if (!user) throw new Error('useCurrentUser requires an authenticated session');
  return user;
}
