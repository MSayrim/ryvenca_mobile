import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { ApiError, api, errorMessage, queryKeys, setAuthToken, setUnauthorizedHandler } from '../api';
import type { AuthResponse, User } from '../api/types';
import { clearSession, loadSession, saveSession } from './tokenStorage';

export type SessionStatus = 'restoring' | 'signedOut' | 'signedIn' | 'error';

/** Tab to open right after onboarding ("İlk parçanı ekle" → Upload). */
export type LandingTab = 'Home' | 'Upload';

interface SessionContextValue {
  status: SessionStatus;
  user: User | null;
  restoreError: string | null;
  landingTab: LandingTab;
  signIn: (auth: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
  setLandingTab: (tab: LandingTab) => void;
  retryRestore: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const ts = Date.parse(expiresAt);
  return Number.isFinite(ts) && ts <= Date.now();
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('restoring');
  const [user, setUserState] = useState<User | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [landingTab, setLandingTab] = useState<LandingTab>('Home');
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const signingOut = useRef(false);

  const clearUserQueries = useCallback(() => {
    // Keep the public meta cache; drop everything user-specific.
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== queryKeys.meta[0] });
  }, [queryClient]);

  const signOut = useCallback(async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    try {
      setAuthToken(null);
      await clearSession();
      clearUserQueries();
      setUserState(null);
      setLandingTab('Home');
      setStatus('signedOut');
    } finally {
      signingOut.current = false;
    }
  }, [clearUserQueries]);

  const signIn = useCallback(
    async (auth: AuthResponse) => {
      setAuthToken(auth.token);
      await saveSession({ token: auth.token, expiresAt: auth.expiresAt ?? null });
      clearUserQueries();
      queryClient.setQueryData(queryKeys.me, auth.user);
      setUserState(auth.user);
      setRestoreError(null);
      setStatus('signedIn');
    },
    [clearUserQueries, queryClient],
  );

  const setUser = useCallback(
    (next: User) => {
      queryClient.setQueryData(queryKeys.me, next);
      setUserState(next);
    },
    [queryClient],
  );

  // Any 401 on an authenticated request → log out (navigation falls back to the auth screen).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // Restore a stored session on launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus('restoring');
      setRestoreError(null);
      const stored = await loadSession();
      if (!stored || isExpired(stored.expiresAt)) {
        await clearSession();
        if (!cancelled) setStatus('signedOut');
        return;
      }
      setAuthToken(stored.token);
      try {
        const me = await api.getMe();
        if (cancelled) return;
        queryClient.setQueryData(queryKeys.me, me);
        setUserState(me);
        setStatus('signedIn');
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) {
          setAuthToken(null);
          await clearSession();
          setStatus('signedOut');
        } else {
          setRestoreError(errorMessage(error));
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryClient, restoreAttempt]);

  const retryRestore = useCallback(() => setRestoreAttempt((n) => n + 1), []);

  const value = useMemo<SessionContextValue>(
    () => ({ status, user, restoreError, landingTab, signIn, signOut, setUser, setLandingTab, retryRestore }),
    [status, user, restoreError, landingTab, signIn, signOut, setUser, retryRestore],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

/** Signed-in user (throws if used outside the authenticated part of the app). */
export function useCurrentUser(): User {
  const { user } = useSession();
  if (!user) throw new Error('useCurrentUser requires a signed-in session');
  return user;
}
