import type { AuthProviderType } from '../../api/types';

export type FirebaseProvider = 'apple' | 'google' | 'password';

/** A completed Firebase sign-in, ready to be exchanged at `POST /api/auth/firebase`. */
export interface FirebaseSignInResult {
  /** Firebase ID token (fresh). */
  idToken: string;
  /** Name to send along (Apple only returns it on the very first sign-in). */
  displayName: string | null;
  email: string | null;
  provider: FirebaseProvider;
  /** A verification e-mail was sent (new e-mail/password account). */
  verificationSent?: boolean;
}

/**
 * Platform implementation contract (firebaseAuth.ts = iOS/Android, firebaseAuth.web.ts = web stub).
 * Sign-in functions resolve `null` when the user cancelled the system dialog.
 */
export interface FirebaseAuthApi {
  isFirebaseReady(): boolean;
  isAppleSignInAvailable(): Promise<boolean>;
  signInWithApple(): Promise<FirebaseSignInResult | null>;
  signInWithGoogle(): Promise<FirebaseSignInResult | null>;
  signInWithEmail(email: string, password: string): Promise<FirebaseSignInResult>;
  createAccountWithEmail(email: string, password: string, displayName: string): Promise<FirebaseSignInResult>;
  sendPasswordReset(email: string): Promise<void>;
  signOutFirebase(): Promise<void>;
  /**
   * Store-required cleanup before `DELETE /api/me`: Apple → re-auth + token revocation, Google → revoke
   * access. Resolves false when the user cancelled the Apple re-authentication (abort the deletion).
   */
  prepareAccountDeletion(provider: AuthProviderType | null | undefined): Promise<boolean>;
}
