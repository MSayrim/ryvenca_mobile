import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Values baked into this build by app.config.ts (`extra`). See firebase/README.md.
 */
interface BuildExtra {
  firebaseConfigured?: boolean;
  firebasePlatforms?: { ios?: boolean; android?: boolean };
  googleWebClientId?: string;
  googleIosConfigured?: boolean;
}

function extra(): BuildExtra {
  return (Constants.expoConfig?.extra ?? {}) as BuildExtra;
}

/** A Firebase config file for THIS platform was bundled into the build. */
export function firebaseBundledForPlatform(): boolean {
  const e = extra();
  if (!e.firebaseConfigured) return false;
  if (Platform.OS === 'ios') return !!e.firebasePlatforms?.ios;
  if (Platform.OS === 'android') return !!e.firebasePlatforms?.android;
  return false;
}

/** Web OAuth client id for Google Sign-In (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID wins). */
export function googleWebClientId(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (fromEnv) return fromEnv;
  const fromBuild = extra().googleWebClientId?.trim();
  return fromBuild || null;
}

/** Google Sign-In can run on this platform (Android: web client id; iOS: URL scheme registered). */
export function googleSignInConfigured(): boolean {
  if (Platform.OS === 'android') return !!googleWebClientId();
  if (Platform.OS === 'ios') return !!extra().googleIosConfigured;
  return false;
}

/** Installed app version ("1.2.3"): native version on devices, the config version elsewhere. */
export function installedAppVersion(): string | null {
  return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? null;
}

/** Native build number (shown next to the version in Profile), null on web. */
export function installedBuildNumber(): string | null {
  return Application.nativeBuildVersion ?? null;
}
