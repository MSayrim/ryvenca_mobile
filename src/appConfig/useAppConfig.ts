import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { ApiError, api, queryKeys } from '../api';
import type { AppConfig } from '../api/types';
import { isAppleSignInAvailable, isFirebaseReady } from '../auth/firebase/firebaseAuth';
import { useLanguage } from '../i18n';
import { resolveAuthOptions, type AuthOptions } from './authMode';
import { googleSignInConfigured } from './buildInfo';
import { LEGACY_APP_CONFIG, normalizeAppConfig } from './normalize';

async function fetchAppConfig(): Promise<AppConfig> {
  try {
    return normalizeAppConfig(await api.getAppConfig());
  } catch (error) {
    // Older backend without /api/config → legacy local e-mail/password, no gates.
    if (error instanceof ApiError && error.status === 404) return LEGACY_APP_CONFIG;
    throw error;
  }
}

/**
 * `GET /api/config` (public). Refetched when the app returns to the foreground (focusManager is wired to
 * AppState in App.tsx) so maintenance / minimum version changes apply without a restart.
 */
export function useAppConfigQuery() {
  const { language } = useLanguage();
  return useQuery<AppConfig>({
    queryKey: queryKeys.appConfig(language),
    queryFn: fetchAppConfig,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  });
}

/** The loaded config (the root navigator only renders the app once it is available). */
export function useAppConfig(): AppConfig {
  return useAppConfigQuery().data ?? LEGACY_APP_CONFIG;
}

/** Which sign-in options to show on this device (see resolveAuthOptions). `null` while checking Apple. */
export function useAuthOptions(): AuthOptions | null {
  const config = useAppConfig();
  const [appleAvailable, setAppleAvailable] = useState<boolean | null>(Platform.OS === 'ios' ? null : false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let cancelled = false;
    isAppleSignInAvailable()
      .then((available) => !cancelled && setAppleAvailable(available))
      .catch(() => !cancelled && setAppleAvailable(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (appleAvailable === null) return null;
  return resolveAuthOptions({
    config,
    platform: Platform.OS,
    firebaseReady: isFirebaseReady(),
    appleAvailable,
    googleConfigured: googleSignInConfigured(),
  });
}
