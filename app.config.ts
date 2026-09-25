import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * RYVENCA app config.
 *
 * - API base URL is read at runtime from `EXPO_PUBLIC_API_BASE_URL` (see src/config.ts).
 * - Cleartext HTTP (http://localhost:8080, http://10.0.2.2:8080, LAN IPs) is allowed unless
 *   `APP_ENV=production` so the app can talk to the local Spring Boot backend during development.
 * - 16 UI languages (see src/i18n/languages.ts). iOS permission texts are localized through
 *   `locales` (src/locales/native/<code>.json); the Info.plist base strings below are English.
 */
const IS_PRODUCTION = process.env.APP_ENV === 'production';

const BRAND_BACKGROUND = '#FAF7F2';

/** Keep in sync with LANGUAGE_CODES in src/i18n/languages.ts. */
const LANGUAGES = ['tr', 'en', 'zh', 'hi', 'es', 'ar', 'fr', 'bn', 'pt', 'ru', 'id', 'ur', 'de', 'ja', 'vi', 'ko'];

const CAMERA_PERMISSION = 'RYVENCA uses your camera so you can photograph your clothes and add them to your wardrobe.';
const PHOTOS_PERMISSION =
  'RYVENCA accesses your photos so you can choose pictures of your clothes and add them to your wardrobe.';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'RYVENCA',
  slug: 'ryvenca',
  scheme: 'ryvenca',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: BRAND_BACKGROUND,
  primaryColor: '#2A201B',
  // iOS: localized InfoPlist strings (permission texts) per language.
  locales: Object.fromEntries(LANGUAGES.map((code) => [code, `./src/locales/native/${code}.json`])),
  ios: {
    bundleIdentifier: 'com.ryvenca.app',
    supportsTablet: true,
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
    package: 'com.ryvenca.app',
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
    [
      'expo-build-properties',
      {
        android: { usesCleartextTraffic: !IS_PRODUCTION },
      },
    ],
  ],
  extra: {
    ...config.extra,
  },
});
