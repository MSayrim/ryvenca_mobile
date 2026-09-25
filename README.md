# RYVENCA — mobile (iOS + Android)

Digital wardrobe + outfit suggestions built only from the user's own clothes.
Expo (SDK 57, managed) · TypeScript strict · React Navigation (native stack + bottom tabs) · TanStack Query.

Product/design spec: [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) · Backend contract: [`docs/API.md`](docs/API.md).

## Setup

```bash
npm install
cp .env.example .env        # then set EXPO_PUBLIC_API_BASE_URL
npm start                   # Expo dev server (QR code for Expo Go)
```

The backend (Spring Boot, `../ryvenca_backend`) should be running: `mvn spring-boot:run` → `http://localhost:8080`.

### Environment variables

| Variable | Default | Notes |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:8080` | Base URL of the backend, no trailing slash. |

Pick the host that the device can reach:

- iOS simulator / web: `http://localhost:8080`
- **Android emulator: `http://10.0.2.2:8080`** (the emulator's alias for the host machine)
- Physical device with Expo Go: `http://<your-computer-LAN-IP>:8080`

`EXPO_PUBLIC_*` values are inlined at bundle time. After changing one, restart with `npx expo start --clear`.
Plain HTTP is allowed in development (Android `usesCleartextTraffic`, iOS ATS exception). Build with
`APP_ENV=production` to turn that off (see `app.config.ts`). If the backend returns `localhost` image URLs,
the app points them at the configured API host so photos still load on the emulator (`src/utils/media.ts`).

## Running

```bash
npm run ios        # iOS simulator (macOS + Xcode) or Expo Go on an iPhone
npm run android    # Android emulator or Expo Go on a device
npm start          # then scan the QR code with Expo Go
npm run web        # browser preview only (tokens go to localStorage instead of SecureStore)
```

All native modules used (image picker/manipulator, secure store, expo-image, svg, fonts) ship with Expo Go,
so no development build is required. Camera and photo-library permission texts are set in `app.config.ts`.

## Scripts

| Script | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint flat config (`eslint-config-expo`) |
| `npm test` | Jest (`jest-expo`) unit tests for pure helpers |

## Structure

```
index.ts                  entry (registerRootComponent)
app.config.ts             app name/ids, permissions, splash, cleartext-in-dev
src/
  App.tsx                 providers: SafeArea, QueryClient, Session, Toast, Navigation; font loading
  config.ts               API base URL + timeouts (single place)
  api/                    types mirroring API.md, fetch client (JWT, 401 → logout), endpoints, error parsing, query keys
  auth/                   SessionProvider (restore/sign in/out), token storage (SecureStore; localStorage on web)
  hooks/                  useMeta (labels from /api/meta), queries, mutations (cache patch + invalidation)
  navigation/             RootNavigator (auth → onboarding → app), MainTabs, custom TabBar with raised "+"
  screens/                auth, onboarding, home, wardrobe (+filter sheet), garment, upload (create/edit),
                          suggestions, outfit, favorites, profile (+preferences, stats, how it works)
  components/             GarmentPhoto, GarmentCard, OutfitCollage, OutfitCard, ScoreRing, ScorePill, Chip,
                          ColorSwatch, BottomSheet, Toast, buttons, typography…
  theme/                  design tokens (colors, radius, spacing, fonts, type scale)
  utils/                  collage layout, resize math, label helpers, outfit/cache helpers, image prep
```

Photo harmonization (spec "heterogeneous real photos") lives in `GarmentPhoto`: fixed-ratio frame, cover crop,
hairline border, cream + hanger placeholder, warm-grade multiply overlay, color dot. The collage algorithm is in
`src/utils/collageLayout.ts` (pure, unit tested) and rendered by `OutfitCollage`.
