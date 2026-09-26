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
| `GOOGLE_SERVICES_JSON` | `./firebase/google-services.json` | Path of the Android Firebase config (EAS file variable). |
| `GOOGLE_SERVICE_INFO_PLIST` | `./firebase/GoogleService-Info.plist` | Path of the iOS Firebase config (EAS file variable). |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | from `google-services.json` | Optional override of the Google Sign-In web client id. |

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

**Expo Go** still runs the app, but only in *fallback mode* (legacy local e-mail/password against the backend):
React Native Firebase and Google Sign-In are native modules Expo Go does not contain. Sign in with Apple / Google /
Firebase e-mail need a **development build** (`expo-dev-client`, see *Firebase & giriş kurulumu* below).
Camera and photo-library permission texts are set in `app.config.ts` (English base) and localized per language in
`src/locales/native/<code>.json` (iOS `locales`).

## Firebase & giriş kurulumu

> **Tek sayfalık kurulum listesi (backend + web + mobil + mağazalar):** `ryvenca_backend/docs/KURULUM.md`

Giriş: **Sign in with Apple** (yalnız iOS), **Google** ve **e-posta + şifre** Firebase Authentication ile yapılır;
uygulama Firebase ID token'ını `POST /api/auth/firebase` ile RYVENCA token'ına çevirir (bkz. `docs/API.md`).
Kod ve yapılandırma hazır — ürün sahibinin yapması gereken yalnızca aşağıdaki kontrol listesi ve iki dosyayı
`firebase/` klasörüne koymak. Dosyalar yokken uygulama **fallback modunda** derlenir ve çalışır (sunucu
`config.auth.local = true` diyorsa eski yerel e-posta/şifre formu; web önizleme ve Expo Go da bu modu kullanır).

### Ürün sahibi kontrol listesi

1. **Firebase projesi** — [console.firebase.google.com](https://console.firebase.google.com) → proje oluştur.
2. **Android uygulaması** — Project settings → *Add app* → Android, paket adı **`com.ryvenca.app`**.
   Google ile giriş için imza parmak izlerini (**SHA-1 ve SHA-256**, ikisini de) *Add fingerprint* ile ekle:
   - **EAS keystore** (development/preview/production build'leri ve Play'e yüklenen *upload key*):
     `eas credentials --platform android` → profil seç → *Keystore* bölümünde `SHA1 Fingerprint` /
     `SHA256 Fingerprint` (ya da expo.dev → proje → *Credentials* → Android → `com.ryvenca.app`).
   - **Google Play App Signing** (Play'den indirilen sürüm bu anahtarla imzalanır): Play Console → uygulama →
     *Test ve yayınla → Kurulum → Uygulama imzalama* → *Uygulama imzalama anahtarı sertifikası* SHA-1 + SHA-256.
   - (Yalnız yerel `npx expo run:android` için) debug keystore: `cd android && ./gradlew signingReport`.
3. **iOS uygulaması** — *Add app* → iOS, bundle ID **`com.ryvenca.app`** (Team ID / App Store ID isteğe bağlı).
4. **Authentication → Sign-in method** — şunları etkinleştir:
   - **Google** (proje destek e-postası seç). Google Cloud → *OAuth consent screen*: uygulama adı, logo, gizlilik
     politikası URL'si, yetkili alan adları; yayın durumu *In production*.
   - **E-posta/Şifre** (*Email link* gerekmez). *Templates* bölümünden gönderen adını "RYVENCA" yap; uygulama
     e-postaları kullanıcının arayüz dilinde ister.
   - **Apple** — ayrıca Apple Developer'da (aşağıda 5) oluşturulan anahtarla *OAuth code flow configuration*
     alanlarını doldur: **Apple Team ID**, **Key ID**, **private key (.p8 içeriği)**. Bu, hesap silmede Apple
     token'ının iptali (`revokeToken`) için gereklidir. Web uygulaması Apple ile giriş de kullanacaksa bir
     **Services ID** oluşturup return URL olarak `https://<project-id>.firebaseapp.com/__/auth/handler` ekle.
5. **Apple Developer** → Certificates, Identifiers & Profiles:
   - *Identifiers* → `com.ryvenca.app` → **Sign in with Apple** yeteneğini aç (*Enable as a primary App ID*).
     Uygulama `ios.usesAppleSignIn: true` ile entitlement'ı zaten istiyor; kimlik bilgilerini EAS yönetiyorsa
     `eas build` bu yeteneği otomatik senkronlar.
   - *Keys* → **+** → *Sign in with Apple* → *Configure* (primary App ID `com.ryvenca.app`) → `.p8` dosyasını indir
     (tek sefer) → Key ID ve Team ID ile birlikte Firebase'e gir (madde 4).
6. **Dosyaları indir ve yerleştir** (madde 2–4 bittikten *sonra*; parmak izi/sağlayıcı ekledikçe yeniden indir):
   - `google-services.json` → **`firebase/google-services.json`**
   - `GoogleService-Info.plist` → **`firebase/GoogleService-Info.plist`**

   İkisi de git'e girmez (`.gitignore`), ama `.easignore` onları dışlamadığı için `eas build` yükler. Alternatif:
   EAS dosya değişkenleri `GOOGLE_SERVICES_JSON` / `GOOGLE_SERVICE_INFO_PLIST` (komutlar `firebase/README.md`'de).
   Kontrol: `npx expo config --type public` → `extra.firebaseConfigured: true`, `extra.googleWebClientId` dolu,
   `ios.googleServicesFile` / `android.googleServicesFile` ayarlı.
7. **Backend** — Firebase → Project settings → *Service accounts* → *Generate new private key* → JSON'u sunucuya
   koy (`RYVENCA_FIREBASE_CREDENTIALS`); üretimde `RYVENCA_LOCAL_AUTH=false`. Admin panelinde: sağlayıcılar
   (Apple/Google/E-posta), **linkler** (gizlilik politikası, kullanım koşulları, destek, destek e-postası, hesap silme
   sayfası, App Store / Play Store adresleri) ve gerekirse `minVersion`. `GET /api/config` → `auth.firebase: true`.
8. **Development build (dev client)** — Expo Go native Firebase çalıştıramaz; bir kez EAS ile dev client derle:

   ```bash
   npm i -g eas-cli && eas login
   eas init                     # EAS projesi; yazdırılan projectId'yi app.config.ts → extra.eas.projectId'ye ekle
   eas build --profile development --platform ios        # cihaz (simülatör: --profile development-simulator)
   eas build --profile development --platform android
   npx expo start --dev-client  # JS değişiklikleri bu build'e yüklenir; native değişiklikte yeniden derle
   ```

   Mağaza sürümü: `EXPO_PUBLIC_API_BASE_URL`'i EAS ortam değişkeni (production) olarak ekle, sonra
   `eas build --profile production --platform all` ve `eas submit`.

Sunucu `minVersion.ios|android` → daha eski sürümde kapatılamayan "Uygulamayı güncelle" ekranı (mağaza linki
`links.appStore|playStore`); `maintenance.enabled` → bakım ekranı. İkisi de uygulama öne geldiğinde yeniden kontrol edilir.

### Hesap silme (mağaza incelemesi notları)

- **Uygulama içinde (App Store 5.1.1(v), Google Play):** *Profil → Hesabı Sil* → silinecekler (fotoğraflar, dolaptaki
  parçalar, kayıtlı kombinler/favoriler, hesap ve giriş bilgileri) ve kalıcılık uyarısı → isteğe bağlı neden →
  "anlıyorum" onay kutusu → *Hesabımı Kalıcı Olarak Sil* → son onay diyaloğu. Apple hesaplarında Apple ile yeniden
  doğrulama istenir ve Apple token'ı iptal edilir (`revokeToken`); Google hesaplarında Google erişimi kaldırılır
  (`revokeAccess`). Ardından `DELETE /api/me { reason }` (başlık `X-Client: mobile/<sürüm>` → log'da `IN_APP`) hesabı,
  fotoğrafları, parçaları, kombinleri ve Firebase kullanıcısını **hemen** siler; oturum kapanır ve "Hesabın silindi"
  ekranı gösterilir.
- **Hesaba erişemeyenler:** giriş ekranı → *Hesabına erişemiyor musun? Hesap silme talebi gönder* (silme ekranında da
  var) → e-posta + not → `POST /api/account-deletion-requests` → referans (`DR-XXXXXX`); talepler admin panelinde
  onaylanır. `links.accountDeletion` ayarlıysa web'deki silme sayfası da açılabilir — Google Play Console
  *Veri güvenliği → Hesap silme URL'si* olarak bu sayfayı gir.
- **App Review notu:** inceleme için bir e-posta/şifre demo hesabı oluştur (Firebase → Authentication → Users) ve
  App Store Connect → *App Review Information*'a yaz; silme yolu: *Profil → Hesabı Sil*. Gizlilik politikası ve
  kullanım koşulları giriş ekranında ve *Profil → Yardım ve yasal* altında.

### Burada doğrulanamayanlar

Native Firebase (Apple/Google/e-posta akışları, Apple token iptali, Google revoke) simülatör/cihaz olmadan
çalıştırılamaz; dev client ile cihazda test et: ilk Apple girişinde ad aktarımı, Google girişi (Android'de SHA
parmak izleri), e-posta kaydı + doğrulama e-postası, şifre sıfırlama, her sağlayıcıyla hesap silme.

## Scripts

| Script | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint flat config (`eslint-config-expo`) |
| `npm test` | Jest (`jest-expo`) unit tests for pure helpers |

## Structure

```
index.ts                  entry (registerRootComponent)
app.config.ts             app name/ids, permissions, splash, cleartext-in-dev, Firebase files → plugins/extra
config/firebaseFiles.js   build-time Firebase file resolution/parsing (CommonJS, unit tested)
firebase/                 drop google-services.json + GoogleService-Info.plist here (git-ignored, see README there)
eas.json                  EAS Build profiles (development client, preview, production)
src/
  App.tsx                 providers: SafeArea, Language, QueryClient, Session, Toast, Navigation; font + language bootstrap
  config.ts               API base URL + timeouts (single place)
  i18n/                   i18next setup, language list/matching, persistence, RTL direction + reload, formatters
  locales/                <code>.json UI strings (tr = source of truth) + native/<code>.json iOS permission texts
  api/                    types mirroring API.md, fetch client (JWT, 401 → logout, 403 ACCOUNT_DISABLED → logout +
                          message, X-Client header), endpoints, error parsing, query keys
  appConfig/              GET /api/config (normalize, auth mode, version gate, build info from app.config extra)
  auth/                   SessionProvider (restore/sign in/out, notices), token storage (SecureStore; localStorage on
                          web), firebase/ (native Apple/Google/e-mail flows + web stub, nonce, error mapping)
  hooks/                  useMeta (labels from /api/meta), queries, mutations (cache patch + invalidation)
  navigation/             RootNavigator (auth → onboarding → app), MainTabs, custom TabBar with raised "+"
  screens/                auth (+e-mail, provider buttons), account (delete account, deletion request), gate
                          (maintenance, forced update, account deleted), onboarding, home, wardrobe (+filter sheet),
                          garment, upload (create/edit), suggestions, outfit, favorites, profile (+preferences, stats,
                          how it works)
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

> **Status:** all 16 languages are translated (UI strings and `src/locales/native/<code>.json`), **except** the
> keys added for Firebase sign-in, legal links, the maintenance/update gates and account deletion
> (`auth.intro`, `auth.providers.*`, `auth.unavailable.*`, `auth.disabledTitle`, `auth.agreement`, `auth.cantAccess*`,
> `auth.email.*`, `auth.errors.*`, `legal.*`, `gate.*`, `deleteAccount.*`, `deletionRequest.*`,
> `errors.accountDisabled`, `profile.help`, `profile.version`): in the 14 non-`tr`/`en` files these are **English
> copies** waiting for the translator (the parity test passes; the UI shows English for them until translated).

### Files & key conventions

- `src/locales/<code>.json` — one nested JSON object per language. **`tr.json` is the source of truth**; every
  file must have exactly the same keys and the same `{{placeholders}}` per key (enforced by
  `src/i18n/__tests__/locales.test.ts`). Keys are typed from `tr.json`, so `t('home.hero.title')` is checked by
  `npm run typecheck`.
- Keys are semantic and grouped by screen/feature: `common.*` (shared buttons/labels), `errors.*`, `language.*`,
  `tabs.*`, `auth.*`, `legal.*`, `gate.*`, `deleteAccount.*`, `deletionRequest.*`, `onboarding.*`, `preferences.*`, `howItWorks.*`, `home.*`, `readiness.*`, `wardrobe.*`,
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
