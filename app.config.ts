import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * RYVENCA app config.
 *
 * - API base URL is read at runtime from `EXPO_PUBLIC_API_BASE_URL` (see src/config.ts).
 * - Cleartext HTTP (http://localhost:8080, http://10.0.2.2:8080, LAN IPs) is allowed unless
 *   `APP_ENV=production` so the app can talk to the local Spring Boot backend during development.
 */
const IS_PRODUCTION = process.env.APP_ENV === 'production';

const BRAND_BACKGROUND = '#FAF7F2';

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
  ios: {
    bundleIdentifier: 'com.ryvenca.app',
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription:
        'RYVENCA, kıyafetlerinin fotoğrafını çekip dolabına ekleyebilmen için kamerana erişir.',
      NSPhotoLibraryUsageDescription:
        'RYVENCA, galerindeki kıyafet fotoğraflarını seçip dolabına ekleyebilmen için fotoğraflarına erişir.',
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
        photosPermission:
          'RYVENCA, galerindeki kıyafet fotoğraflarını seçip dolabına ekleyebilmen için fotoğraflarına erişir.',
        cameraPermission:
          'RYVENCA, kıyafetlerinin fotoğrafını çekip dolabına ekleyebilmen için kamerana erişir.',
        microphonePermission: false,
      },
    ],
    'expo-secure-store',
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
