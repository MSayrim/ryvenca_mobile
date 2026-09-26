import type { ConfigContext, ExpoConfig } from 'expo/config';

// Plain CommonJS helper (Expo's config loader cannot require local .ts files).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveFirebaseSetup } = require('./config/firebaseFiles') as typeof import('./config/firebaseFiles');

/**
 * RYVENCA app config.
 *
 * - API base URL is read at runtime from `EXPO_PUBLIC_API_BASE_URL` (see src/config.ts).
 * - Cleartext HTTP (http://localhost:8080, http://10.0.2.2:8080, LAN IPs) is allowed unless
 *   `APP_ENV=production` so the app can talk to the local Spring Boot backend during development.
 * - 16 UI languages (see src/i18n/languages.ts). iOS permission texts are localized through
 *   `locales` (src/locales/native/<code>.json); the Info.plist base strings below are English.
 * - Firebase (Sign in with Apple / Google / e-mail) is enabled only when the Firebase config files exist
 *   (see firebase/README.md): `$GOOGLE_SERVICES_JSON` or ./firebase/google-services.json (Android) and
 *   `$GOOGLE_SERVICE_INFO_PLIST` or ./firebase/GoogleService-Info.plist (iOS). Without them the app builds
 *   in fallback mode (local e-mail/password against the backend, when the server allows it).
 */
const IS_PRODUCTION = process.env.APP_ENV === 'production';

const APP_ID = 'com.ryvenca.app';
const VERSION = '1.0.0';

const BRAND_BACKGROUND = '#FAF7F2';

/** Keep in sync with LANGUAGE_CODES in src/i18n/languages.ts. */
const LANGUAGES = ['tr', 'en', 'zh', 'hi', 'es', 'ar', 'fr', 'bn', 'pt', 'ru', 'id', 'ur', 'de', 'ja', 'vi', 'ko'];

const CAMERA_PERMISSION = 'RYVENCA uses your camera so you can photograph your clothes and add them to your wardrobe.';
const PHOTOS_PERMISSION =
  'RYVENCA accesses your photos so you can choose pictures of your clothes and add them to your wardrobe.';

export default ({ config, projectRoot }: ConfigContext): ExpoConfig => {
  const firebase = resolveFirebaseSetup({ env: process.env, projectRoot, packageName: APP_ID });
  const FIREBASE_CONFIGURED = !!(firebase.androidFile || firebase.iosFile);

  if (firebase.warnings.length > 0 && !process.env.RYVENCA_SILENCE_FIREBASE_WARNINGS) {
    for (const warning of firebase.warnings) console.warn(`[RYVENCA firebase] ${warning}`);
  }

  /** Native Firebase plugins — only when at least one config file exists (they fail without one). */
  const firebasePlugins: NonNullable<ExpoConfig['plugins']> = FIREBASE_CONFIGURED
    ? [
        '@react-native-firebase/app',
        '@react-native-firebase/auth',
        // iOS: registers the REVERSED_CLIENT_ID URL scheme Google Sign-In redirects to.
        ...(firebase.iosUrlScheme
          ? [['@react-native-google-signin/google-signin', { iosUrlScheme: firebase.iosUrlScheme }] as [string, unknown]]
          : []),
      ]
    : [];

  return {
    ...config,
    name: 'RYVENCA',
    slug: 'ryvenca',
    scheme: 'ryvenca',
    version: VERSION,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    backgroundColor: BRAND_BACKGROUND,
    primaryColor: '#2A201B',
    // iOS: localized InfoPlist strings (permission texts) per language.
    locales: Object.fromEntries(LANGUAGES.map((code) => [code, `./src/locales/native/${code}.json`])),
    ios: {
      bundleIdentifier: APP_ID,
      supportsTablet: true,
      // Sign in with Apple entitlement (App Store guideline 4.8 — required next to Google sign-in).
      usesAppleSignIn: true,
      ...(firebase.iosFile ? { googleServicesFile: firebase.iosFile } : {}),
      infoPlist: {
        NSCameraUsageDescription: CAMERA_PERMISSION,
        NSPhotoLibraryUsageDescription: PHOTOS_PERMISSION,
        ...(IS_PRODUCTION
          ? {}
          : {
              // Development only: allow plain HTTP to the local backend.
              NSAppTransportSecurity: { NSAllowsArbitraryLoads: true, NSAllowsLocalNetworking: true },
            }),
      },
    },
    android: {
      package: APP_ID,
      ...(firebase.androidFile ? { googleServicesFile: firebase.androidFile } : {}),
      adaptiveIcon: {
        backgroundColor: BRAND_BACKGROUND,
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      blockedPermissions: ['android.permission.RECORD_AUDIO'],
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
      backgroundColor: BRAND_BACKGROUND,
      themeColor: BRAND_BACKGROUND,
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 220,
          resizeMode: 'contain',
          backgroundColor: BRAND_BACKGROUND,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: PHOTOS_PERMISSION,
          cameraPermission: CAMERA_PERMISSION,
          microphonePermission: false,
        },
      ],
      'expo-secure-store',
      [
        'expo-localization',
        {
          // Lists the app languages for the OS per-app language settings (iOS Settings, Android 13+).
          supportedLocales: { ios: LANGUAGES, android: LANGUAGES },
          // supportsRTL / forcesRTL are deliberately NOT set: those native options re-apply the *device*
          // direction on every launch (iOS: forceRTL(isRTLPreferredForCurrentLocale)), which would fight
          // the in-app language choice (e.g. Arabic UI on an English phone). The JS side sets
          // I18nManager.allowRTL/forceRTL from the chosen language and reloads when it changes
          // (src/i18n/direction.ts).
        },
      ],
      'expo-updates',
      'expo-image',
      'expo-font',
      'expo-web-browser',
      'expo-apple-authentication',
      ...firebasePlugins,
      [
        'expo-build-properties',
        {
          android: { usesCleartextTraffic: !IS_PRODUCTION },
          // React Native Firebase requires static frameworks on iOS (its pods are autolinked even in
          // fallback builds, so this is always on). RNFB pods themselves are linked statically.
          ios: { useFrameworks: 'static', forceStaticLinking: ['RNFBApp', 'RNFBAuth'] },
        },
      ],
    ],
    extra: {
      ...config.extra,
      /** True when a Firebase config file was bundled for at least one platform. */
      firebaseConfigured: FIREBASE_CONFIGURED,
      /** Per platform (a build only has native Firebase when its own file was present). */
      firebasePlatforms: { ios: !!firebase.iosFile, android: !!firebase.androidFile },
      /** Web OAuth client id for Google Sign-In (`webClientId`); '' when unknown (Google hidden on Android). */
      googleWebClientId: firebase.webClientId ?? '',
      /** iOS Google Sign-In needs the REVERSED_CLIENT_ID URL scheme from the plist. */
      googleIosConfigured: !!firebase.iosUrlScheme,
    },
  };
};
