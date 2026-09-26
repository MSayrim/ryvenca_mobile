/**
 * Web preview: native Firebase (React Native Firebase, Google Sign-In, Sign in with Apple) does not exist in
 * the browser and must never be imported here. The web preview always uses the local e-mail/password
 * fallback (when the server allows it); the separate web app signs in with the Firebase JS SDK.
 */
import type { AuthProviderType } from '../../api/types';
import { AuthFlowError } from './errors';
import type { FirebaseSignInResult } from './types';

export function isFirebaseReady(): boolean {
  return false;
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  return false;
}

export async function signInWithApple(): Promise<FirebaseSignInResult | null> {
  throw new AuthFlowError('generic');
}

export async function signInWithGoogle(): Promise<FirebaseSignInResult | null> {
  throw new AuthFlowError('generic');
}

export async function signInWithEmail(_email: string, _password: string): Promise<FirebaseSignInResult> {
  throw new AuthFlowError('generic');
}

export async function createAccountWithEmail(
  _email: string,
  _password: string,
  _displayName: string,
): Promise<FirebaseSignInResult> {
  throw new AuthFlowError('generic');
}

export async function sendPasswordReset(_email: string): Promise<void> {
  throw new AuthFlowError('generic');
}

export async function signOutFirebase(): Promise<void> {
  // nothing to do
}

export async function prepareAccountDeletion(_provider: AuthProviderType | null | undefined): Promise<boolean> {
  return true;
}
