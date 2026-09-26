/**
 * Native (iOS/Android) Firebase sign-in: Sign in with Apple, Google, e-mail + password.
 * The web preview resolves firebaseAuth.web.ts instead and never touches these modules.
 *
 * React Native Firebase and Google Sign-In are required lazily so that
 *  - builds without the Firebase config files (fallback mode) never initialize them, and
 *  - Expo Go (which does not contain these native modules) can still run the fallback flow.
 */
import type * as FirebaseAppModule from '@react-native-firebase/app';
import type * as FirebaseAuthModule from '@react-native-firebase/auth';
import type * as GoogleSignInModule from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import type { AuthProviderType } from '../../api/types';
import { firebaseBundledForPlatform, googleWebClientId } from '../../appConfig/buildInfo';
import { currentLanguage } from '../../i18n/i18n';
import { AuthFlowError, toAuthFlowError, type AuthErrorReason } from './errors';
import { createAppleNonce, displayNameFromParts, type AppleNonce } from './nonce';
import type { FirebaseProvider, FirebaseSignInResult } from './types';

type AuthModule = typeof FirebaseAuthModule;
type GoogleModule = typeof GoogleSignInModule;
type FirebaseUser = FirebaseAuthModule.User;

// ---------- lazy native modules ----------

let authModule: AuthModule | null | undefined;
let googleModule: GoogleModule | null | undefined;

function loadAuth(): AuthModule | null {
  if (authModule !== undefined) return authModule;
  authModule = null;
  if (!firebaseBundledForPlatform()) return null;
  // Expo Go ships neither React Native Firebase nor Google Sign-In.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const app = require('@react-native-firebase/app') as typeof FirebaseAppModule;
    // The default app is created natively from google-services.json / GoogleService-Info.plist.
    if (app.getApps().length === 0) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    authModule = require('@react-native-firebase/auth') as AuthModule;
  } catch {
    authModule = null;
  }
  return authModule;
}

function loadGoogle(): GoogleModule | null {
  if (googleModule !== undefined) return googleModule;
  googleModule = null;
  if (!loadAuth()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-google-signin/google-signin') as GoogleModule;
    // iOS reads its client id from GoogleService-Info.plist; the web client id makes Google return an
    // ID token Firebase accepts (required on Android).
    const webClientId = googleWebClientId();
    mod.GoogleSignin.configure(webClientId ? { webClientId } : {});
    googleModule = mod;
  } catch {
    googleModule = null;
  }
  return googleModule;
}

function requireAuth(): AuthModule {
  const mod = loadAuth();
  if (!mod) throw new AuthFlowError('generic');
  return mod;
}

/**
 * Runs a Firebase call and converts its error. For Apple/Google credentials a "wrong credentials" or unknown
 * error is reported as that provider's failure (never "wrong e-mail or password").
 */
async function firebaseCall<T>(fn: () => Promise<T>, providerFailure?: AuthErrorReason): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const converted = toAuthFlowError(error);
    if (
      providerFailure &&
      converted instanceof AuthFlowError &&
      (converted.reason === 'wrongCredentials' || converted.reason === 'generic')
    ) {
      throw new AuthFlowError(providerFailure);
    }
    throw converted;
  }
}

async function finish(
  mod: AuthModule,
  user: FirebaseUser,
  provider: FirebaseProvider,
  preferredName: string | null,
  extra: Partial<FirebaseSignInResult> = {},
): Promise<FirebaseSignInResult> {
  // Force refresh so a name set via updateProfile right before is inside the token.
  const idToken = await firebaseCall(() => mod.getIdToken(user, true));
  return {
    idToken,
    displayName: preferredName || user.displayName || null,
    email: user.email ?? null,
    provider,
    ...extra,
  };
}

/** Firebase e-mails (verification, password reset) in the UI language. */
async function applyUiLanguageToEmails(mod: AuthModule): Promise<void> {
  try {
    await mod.setLanguageCode(mod.getAuth(), currentLanguage());
  } catch {
    // non-fatal: Firebase falls back to the project's default template language
  }
}

// ---------- availability ----------

export function isFirebaseReady(): boolean {
  return loadAuth() !== null;
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

// ---------- Apple ----------

function newAppleNonce(): Promise<AppleNonce> {
  return createAppleNonce({
    randomBytes: (count) => Crypto.getRandomBytes(count),
    sha256Hex: (value) =>
      Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, { encoding: Crypto.CryptoEncoding.HEX }),
  });
}

function isAppleCancel(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code: unknown }).code : null;
  return code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED';
}

async function appleRequest(
  nonce: AppleNonce,
  scopes: AppleAuthentication.AppleAuthenticationScope[],
): Promise<AppleAuthentication.AppleAuthenticationCredential | null> {
  try {
    return await AppleAuthentication.signInAsync({ requestedScopes: scopes, nonce: nonce.hashed });
  } catch (error) {
    if (isAppleCancel(error)) return null;
    throw new AuthFlowError('appleFailed');
  }
}

function appleFirebaseCredential(
  mod: AuthModule,
  identityToken: string,
  nonce: AppleNonce,
  fullName?: AppleAuthentication.AppleAuthenticationFullName | null,
) {
  // Same as the deprecated AppleAuthProvider.credential(identityToken, rawNonce): the raw nonce lets
  // Firebase verify the SHA-256 nonce claim Apple put into the identity token.
  return new mod.OAuthProvider('apple.com').credential({
    idToken: identityToken,
    rawNonce: nonce.raw,
    ...(fullName ? { fullName } : {}),
  });
}

export async function signInWithApple(): Promise<FirebaseSignInResult | null> {
  const mod = requireAuth();
  const nonce = await newAppleNonce();
  const apple = await appleRequest(nonce, [
    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    AppleAuthentication.AppleAuthenticationScope.EMAIL,
  ]);
  if (!apple) return null;
  if (!apple.identityToken) throw new AuthFlowError('appleFailed');

  // Apple shares the name only on the very first authorization — keep it.
  const displayName = displayNameFromParts(apple.fullName);
  const credential = appleFirebaseCredential(mod, apple.identityToken, nonce, apple.fullName);
  const result = await firebaseCall(() => mod.signInWithCredential(mod.getAuth(), credential), 'appleFailed');
  if (displayName && !result.user.displayName) {
    await mod.updateProfile(result.user, { displayName }).catch(() => undefined);
  }
  return finish(mod, result.user, 'apple', displayName);
}

// ---------- Google ----------

export async function signInWithGoogle(): Promise<FirebaseSignInResult | null> {
  const mod = requireAuth();
  const google = loadGoogle();
  if (!google) throw new AuthFlowError('googleFailed');
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = google;

  let idToken: string | null = null;
  let name: string | null = null;
  try {
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null; // cancelled
    idToken = response.data.idToken;
    name = response.data.user.name ?? null;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) return null;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new AuthFlowError('playServices');
    }
    throw new AuthFlowError('googleFailed');
  }
  if (!idToken) throw new AuthFlowError('googleFailed');

  const credential = mod.GoogleAuthProvider.credential(idToken);
  const result = await firebaseCall(() => mod.signInWithCredential(mod.getAuth(), credential), 'googleFailed');
  return finish(mod, result.user, 'google', name);
}

// ---------- E-mail + password ----------

export async function signInWithEmail(email: string, password: string): Promise<FirebaseSignInResult> {
  const mod = requireAuth();
  const result = await firebaseCall(() => mod.signInWithEmailAndPassword(mod.getAuth(), email, password));
  return finish(mod, result.user, 'password', null);
}

export async function createAccountWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<FirebaseSignInResult> {
  const mod = requireAuth();
  const result = await firebaseCall(() => mod.createUserWithEmailAndPassword(mod.getAuth(), email, password));
  await mod.updateProfile(result.user, { displayName }).catch(() => undefined);

  let verificationSent = false;
  try {
    await applyUiLanguageToEmails(mod);
    await mod.sendEmailVerification(result.user);
    verificationSent = true;
  } catch {
    // non-fatal: the account works; verification can be re-sent later
  }
  return finish(mod, result.user, 'password', displayName, { verificationSent });
}

export async function sendPasswordReset(email: string): Promise<void> {
  const mod = requireAuth();
  await applyUiLanguageToEmails(mod);
  await firebaseCall(() => mod.sendPasswordResetEmail(mod.getAuth(), email));
}

// ---------- Sign-out & account deletion ----------

export async function signOutFirebase(): Promise<void> {
  const mod = loadAuth();
  if (!mod) return;
  try {
    const auth = mod.getAuth();
    if (auth.currentUser) await mod.signOut(auth);
  } catch {
    // ignore: the RYVENCA session is cleared regardless
  }
  const google = loadGoogle();
  if (google?.GoogleSignin.hasPreviousSignIn()) {
    await google.GoogleSignin.signOut().catch(() => null);
  }
}

function currentFirebaseProvider(mod: AuthModule): AuthProviderType | null {
  const user = mod.getAuth().currentUser;
  const ids = user?.providerData.map((p) => p.providerId) ?? [];
  if (ids.includes('apple.com')) return 'APPLE';
  if (ids.includes('google.com')) return 'GOOGLE';
  if (ids.includes('password')) return 'PASSWORD';
  return null;
}

/** Sign in with Apple: re-authenticate and revoke the Apple token (App Store guideline 5.1.1(v)). */
async function revokeApple(mod: AuthModule): Promise<boolean> {
  if (Platform.OS !== 'ios' || !(await isAppleSignInAvailable())) return true;
  const nonce = await newAppleNonce();
  const apple = await appleRequest(nonce, []);
  if (!apple) return false; // user cancelled → abort the deletion
  try {
    const auth = mod.getAuth();
    if (!auth.currentUser && apple.identityToken) {
      await mod.signInWithCredential(auth, appleFirebaseCredential(mod, apple.identityToken, nonce));
    }
    if (apple.authorizationCode) await mod.revokeToken(auth, apple.authorizationCode);
  } catch {
    // Non-fatal: the server still deletes the account and the Firebase user.
  }
  return true;
}

async function revokeGoogle(google: GoogleModule): Promise<void> {
  const { GoogleSignin } = google;
  try {
    if (!GoogleSignin.hasPreviousSignIn()) {
      // revokeAccess needs a signed-in Google user on this device.
      const silent = await GoogleSignin.signInSilently();
      if (silent.type !== 'success') return;
    }
    await GoogleSignin.revokeAccess();
  } catch {
    // Non-fatal (e.g. offline): access is also removed when the Firebase user is deleted.
  } finally {
    await GoogleSignin.signOut().catch(() => null);
  }
}

export async function prepareAccountDeletion(provider: AuthProviderType | null | undefined): Promise<boolean> {
  const mod = loadAuth();
  if (!mod) return true;
  const effective = provider ?? currentFirebaseProvider(mod);
  if (effective === 'APPLE') return revokeApple(mod);
  if (effective === 'GOOGLE') {
    const google = loadGoogle();
    if (google) await revokeGoogle(google);
  }
  return true;
}
