/** Types for config/firebaseFiles.js (CommonJS, required by app.config.ts). */

export declare const DEFAULT_ANDROID_FILE: string;
export declare const DEFAULT_IOS_FILE: string;

export declare function resolveConfigFile(
  envValue: string | undefined | null,
  defaultPath: string,
  projectRoot: string,
): string | null;

export declare function plistString(xml: string, key: string): string | null;

export declare function reversedClientIdFromPlist(xml: string): string | null;

export declare function webClientIdFromGoogleServices(json: unknown, packageName?: string): string | null;

export interface FirebaseSetup {
  /** Path to google-services.json (as configured) or null. */
  androidFile: string | null;
  /** Path to GoogleService-Info.plist (as configured) or null. */
  iosFile: string | null;
  /** REVERSED_CLIENT_ID from the plist (Google Sign-In URL scheme on iOS). */
  iosUrlScheme: string | null;
  /** Web OAuth client id (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID wins over google-services.json). */
  webClientId: string | null;
  warnings: string[];
}

export declare function resolveFirebaseSetup(options?: {
  env?: Record<string, string | undefined>;
  projectRoot?: string;
  packageName?: string;
}): FirebaseSetup;
