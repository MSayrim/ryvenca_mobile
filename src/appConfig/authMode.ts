import type { AppConfig } from '../api/types';

export type AuthMode = 'firebase' | 'local' | 'unavailable';

export interface AuthOptions {
  /** `firebase`: provider buttons; `local`: legacy e-mail/password form; `unavailable`: nothing works. */
  mode: AuthMode;
  apple: boolean;
  google: boolean;
  email: boolean;
}

export interface AuthModeInput {
  config: AppConfig;
  platform: string;
  /** Native Firebase is bundled (config files present) and initialized on this device. */
  firebaseReady: boolean;
  /** Sign in with Apple is available (iOS 13+). */
  appleAvailable: boolean;
  /** Google Sign-In has what it needs on this platform (web client id / iOS URL scheme). */
  googleConfigured: boolean;
}

/**
 * Decides which sign-in UI to show:
 * Firebase flows when the build has native Firebase AND the server verifies Firebase tokens AND at least
 * one enabled provider works here; otherwise the legacy local form when the server allows it.
 */
export function resolveAuthOptions({
  config,
  platform,
  firebaseReady,
  appleAvailable,
  googleConfigured,
}: AuthModeInput): AuthOptions {
  const firebase = firebaseReady && config.auth.firebase && (platform === 'ios' || platform === 'android');
  const apple = firebase && config.auth.providers.apple && platform === 'ios' && appleAvailable;
  const google = firebase && config.auth.providers.google && googleConfigured;
  const email = firebase && config.auth.providers.email;

  if (apple || google || email) return { mode: 'firebase', apple, google, email };
  if (config.auth.local) return { mode: 'local', apple: false, google: false, email: false };
  return { mode: 'unavailable', apple: false, google: false, email: false };
}
