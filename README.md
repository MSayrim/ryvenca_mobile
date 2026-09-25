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

All native modules used (image picker/manipulator, secure store, localization, updates, expo-image, svg, fonts)
ship with Expo Go, so no development build is required. Camera and photo-library permission texts are set in
`app.config.ts` (English base) and localized per language in `src/locales/native/<code>.json` (iOS `locales`).

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
  App.tsx                 providers: SafeArea, Language, QueryClient, Session, Toast, Navigation; font + language bootstrap
  config.ts               API base URL + timeouts (single place)
  i18n/                   i18next setup, language list/matching, persistence, RTL direction + reload, formatters
  locales/                <code>.json UI strings (tr = source of truth) + native/<code>.json iOS permission texts
  api/                    types mirroring API.md, fetch client (JWT, 401 → logout), endpoints, error parsing, query keys
  auth/                   SessionProvider (restore/sign in/out), token storage (SecureStore; localStorage on web)
  hooks/                  useMeta (labels from /api/meta), queries, mutations (cache patch + invalidation)
  navigation/             RootNavigator (auth → onboarding → app), MainTabs, custom TabBar with raised "+"
  screens/                auth, onboarding, home, wardrobe (+filter sheet), garment, upload (create/edit),
                          suggestions, outfit, favorites, profile (+preferences, stats, how it works)
  components/             GarmentPhoto, GarmentCard, OutfitCollage, OutfitCard, ScoreRing, ScorePill, Chip,
                          ColorSwatch, BottomSheet, Toast, buttons, typography…
  theme/                  design tokens (colors, radius, spacing, fonts, type scale), language-aware typography
  utils/                  collage layout, resize math, label helpers, outfit/cache helpers, image prep
```

Photo harmonization (spec "heterogeneous real photos") lives in `GarmentPhoto`: fixed-ratio frame, cover crop,
hairline border, cream + hanger placeholder, warm-grade multiply overlay, color dot. The collage algorithm is in
`src/utils/collageLayout.ts` (pure, unit tested) and rendered by `OutfitCollage`.

## Languages (i18n)

The app ships 16 UI languages: `tr` (source / product default), `en`, `zh` (Simplified Chinese), `hi`, `es`,
`ar` (RTL), `fr`, `bn`, `pt`, `ru`, `id`, `ur` (RTL), `de`, `ja`, `vi`, `ko`
(`i18next` + `react-i18next` + `expo-localization`, see `src/i18n/`).

> **Status:** `tr.json` and `en.json` are complete. The other 14 files (`zh`, `hi`, `es`, `ar`, `fr`, `bn`, `pt`,
> `ru`, `id`, `ur`, `de`, `ja`, `vi`, `ko`) are currently **copies of `en.json`** waiting for translation — the
> app already switches language, direction, fonts and server content for them, only the client copy is English.
> The same applies to `src/locales/native/<code>.json` (iOS permission texts).

### Files & key conventions

- `src/locales/<code>.json` — one nested JSON object per language. **`tr.json` is the source of truth**; every
  file must have exactly the same keys and the same `{{placeholders}}` per key (enforced by
  `src/i18n/__tests__/locales.test.ts`). Keys are typed from `tr.json`, so `t('home.hero.title')` is checked by
  `npm run typecheck`.
- Keys are semantic and grouped by screen/feature: `common.*` (shared buttons/labels), `errors.*`, `language.*`,
  `tabs.*`, `auth.*`, `onboarding.*`, `preferences.*`, `howItWorks.*`, `home.*`, `readiness.*`, `wardrobe.*`,
  `garment.*`, `upload.*`, `suggestions.*`, `outfit.*`, `favorites.*`, `profile.*`, `accents.*` (Caveat script
  accents), `brand.*`. `…A11y` keys are screen-reader labels, `…Hint` keys accessibility/helper hints.
- Interpolation uses `{{name}}`. Always translate whole sentences — word order lives in the translation (e.g.
  `upload.form.generatedName` = `"{{color}} {{subcategory}}"` may become `"{{subcategory}} {{color}}"`). Numbers
  passed to `t()` are formatted for the language automatically (digits, grouping); percentages arrive
  pre-formatted (`{{percent}}` → "%92" / "92%").
- Plurals use i18next suffixes: `_one`, `_other` in the source. Translators add the CLDR categories their
  language needs (`_zero`, `_two`, `_few`, `_many`), e.g. Russian `_one/_few/_many/_other`, Arabic all six;
  `_other` must always exist. Languages without plural forms (zh, ja, ko, vi, id) may keep only `_other`.
  Hermes may lack `Intl.PluralRules`; `src/i18n/pluralRules.ts` installs a small CLDR fallback for the 16
  languages only when needed (tested against Node's ICU).
- Keep `\n` line breaks and the `✦` / `♡` / `·` / `—` symbols where they appear. `RYVENCA` is never translated;
  `brand.tagline` ("Style what you already own") is English by design in `tr`/`en` but may be localized.

### Adding / translating a language

1. Translate `src/locales/<code>.json` (start from `tr.json` or `en.json`; keep keys and placeholders) and
   `src/locales/native/<code>.json`.
2. A **new** language additionally needs: its code in `LANGUAGE_CODES` + `LANGUAGES` (native name, `rtl`) in
   `src/i18n/languages.ts`, the import in `src/i18n/i18n.ts`, `LANGUAGES` in `app.config.ts`, a typography profile
   in `src/theme/typography.ts` if the brand fonts don't cover its script, and plural rules in
   `src/i18n/pluralRules.ts`.
3. Run `npm test` — the locale tests fail on missing/extra keys or placeholder mismatches.

### How the language is chosen

1. **Saved choice** on this device (SecureStore; `localStorage` on web).
2. After login / session restore: **`user.language`** from `/api/me` when set (adopted and saved). An explicit pick
   made on this device wins and is written back with `PUT /api/me { language }` on the next explicit login.
3. **Device locales** (`expo-localization`, first supported primary subtag: `de-AT` → `de`, `zh-Hant-TW` → `zh`,
   Android's legacy `in` → `id`).
4. Otherwise **English**.

The picker (bottom sheet with the 16 native names — a static list, so it works before `/api/meta` loads) is on the
auth screen and in Profile → Language. Choosing a language switches the UI immediately, persists it and, when
signed in, calls `PUT /api/me { language }`. Every request sends `Accept-Language: <code>` and every
server-rendered query key ends with the language, so switching refetches localized labels, names, outfit texts,
readiness messages and errors.

### Right-to-left (ar, ur)

React Native fixes the layout direction when the JS runtime starts. On a direction change (LTR ↔ RTL) the app
calls `I18nManager.allowRTL(isRTL)` + `I18nManager.forceRTL(isRTL)` and asks to restart
(“Restart now” / “Later”); the restart uses `expo-updates` `reloadAsync()` in production and `DevSettings.reload()`
in development (both guarded, `reloadAppAsync()` as last resort). Adopting an account language with the other
direction after login shows the same prompt. If the app starts with a direction that does not match the saved
language, it applies it and reloads once automatically before the first render (loop-guarded).
`allowRTL` mirrors the target so an LTR language on an RTL phone stays LTR. The expo-localization
`supportsRTL`/`forcesRTL` options are intentionally not set — they would re-apply the *device* direction on every
launch and fight the in-app choice. Styles use `start`/`end` (`marginStart`, `paddingEnd`, `start: 8`), directional
icons come from `useDirection()` (forward arrow, back/forward chevrons, “See All →/←”), and the collage, fanned
photo stack and shimmer are mirrored. The web preview switches live via `<html dir>` plus react-native-web's
direction context (no reload).

### Fonts

Fraunces (display) covers Latin + Vietnamese, Inter (body) Latin + Cyrillic + Vietnamese, Caveat (script accents)
Latin + Cyrillic. `src/theme/typography.ts` maps the brand families per language through `Typography`
(and the text inputs): `zh`, `ja`, `ko`, `hi`, `bn`, `ar`, `ur` use the platform system fonts with explicit
weights, `ru` keeps Inter/Caveat but uses the platform serif for display text, `vi` keeps Fraunces/Inter; Caveat
accents fall back to the body font where Caveat lacks the script. Tall scripts get minimum line heights
(CJK 1.4, Devanagari/Bengali/Arabic 1.55, Nastaliq Urdu 1.85; headlines slightly less) and letter-spacing is
removed for scripts where tracking breaks shaping. Latin languages render exactly as designed. The `RYVENCA`
logotype always uses Fraunces.
