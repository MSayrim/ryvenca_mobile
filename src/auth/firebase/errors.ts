import { ApiError } from '../../api/errors';
import { t } from '../../i18n/i18n';

/** Localized sign-in failure reasons (keys under `auth.errors.*`). */
export type AuthErrorReason =
  | 'invalidEmail'
  | 'userDisabled'
  | 'wrongCredentials'
  | 'emailInUse'
  | 'weakPassword'
  | 'tooManyRequests'
  | 'network'
  | 'providerDisabled'
  | 'accountExists'
  | 'recentLogin'
  | 'playServices'
  | 'appleFailed'
  | 'googleFailed'
  | 'generic';

const FIREBASE_CODES: Record<string, AuthErrorReason> = {
  'auth/invalid-email': 'invalidEmail',
  'auth/missing-email': 'invalidEmail',
  'auth/user-disabled': 'userDisabled',
  'auth/wrong-password': 'wrongCredentials',
  'auth/user-not-found': 'wrongCredentials',
  'auth/invalid-credential': 'wrongCredentials',
  'auth/invalid-login-credentials': 'wrongCredentials',
  'auth/invalid-password': 'wrongCredentials',
  'auth/missing-password': 'wrongCredentials',
  'auth/email-already-in-use': 'emailInUse',
  'auth/weak-password': 'weakPassword',
  'auth/password-does-not-meet-requirements': 'weakPassword',
  'auth/too-many-requests': 'tooManyRequests',
  'auth/network-request-failed': 'network',
  'auth/operation-not-allowed': 'providerDisabled',
  'auth/admin-restricted-operation': 'providerDisabled',
  'auth/account-exists-with-different-credential': 'accountExists',
  'auth/credential-already-in-use': 'accountExists',
  'auth/requires-recent-login': 'recentLogin',
  'auth/user-token-expired': 'recentLogin',
};

/** Firebase Auth error code (`auth/…`, with or without the prefix) → reason. Unknown codes → `generic`. */
export function firebaseErrorReason(code: string | null | undefined): AuthErrorReason {
  if (!code) return 'generic';
  const normalized = code.startsWith('auth/') ? code : `auth/${code}`;
  return FIREBASE_CODES[normalized] ?? 'generic';
}

export function authErrorText(reason: AuthErrorReason): string {
  switch (reason) {
    case 'invalidEmail':
      return t('auth.errors.invalidEmail');
    case 'userDisabled':
      return t('auth.errors.userDisabled');
    case 'wrongCredentials':
      return t('auth.errors.wrongCredentials');
    case 'emailInUse':
      return t('auth.errors.emailInUse');
    case 'weakPassword':
      return t('auth.errors.weakPassword');
    case 'tooManyRequests':
      return t('auth.errors.tooManyRequests');
    case 'network':
      return t('errors.network');
    case 'providerDisabled':
      return t('auth.errors.providerDisabled');
    case 'accountExists':
      return t('auth.errors.accountExists');
    case 'recentLogin':
      return t('auth.errors.recentLogin');
    case 'playServices':
      return t('auth.errors.playServices');
    case 'appleFailed':
      return t('auth.errors.appleFailed');
    case 'googleFailed':
      return t('auth.errors.googleFailed');
    case 'generic':
    default:
      return t('auth.errors.generic');
  }
}

/** A sign-in / account step failed with a known reason (message is localized when created). */
export class AuthFlowError extends Error {
  readonly reason: AuthErrorReason;

  constructor(reason: AuthErrorReason, message: string = authErrorText(reason)) {
    super(message);
    this.name = 'AuthFlowError';
    this.reason = reason;
  }
}

function codeOf(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

/** Converts anything thrown by the Firebase SDK into an AuthFlowError (keeps AuthFlowError/ApiError). */
export function toAuthFlowError(error: unknown, fallback: AuthErrorReason = 'generic'): AuthFlowError | ApiError {
  if (error instanceof AuthFlowError || error instanceof ApiError) return error;
  const code = codeOf(error);
  if (code && (code.startsWith('auth/') || code in FIREBASE_CODES)) return new AuthFlowError(firebaseErrorReason(code));
  return new AuthFlowError(fallback);
}

/** User-presentable text for any error thrown by a sign-in flow (server messages are already localized). */
export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthFlowError || error instanceof ApiError) return error.message;
  return toAuthFlowError(error).message;
}
