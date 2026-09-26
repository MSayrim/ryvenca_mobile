# Firebase config files

Drop the two files from the Firebase console **into this folder** — nothing else has to change:

| File | Platform | Where to get it |
|---|---|---|
| `firebase/google-services.json` | Android | Firebase console → Project settings → *Your apps* → Android app `com.ryvenca.app` → **google-services.json** |
| `firebase/GoogleService-Info.plist` | iOS | Firebase console → Project settings → *Your apps* → iOS app `com.ryvenca.app` → **GoogleService-Info.plist** |

Both files are git-ignored (see `.gitignore`); they are not secrets in the cryptographic sense, but they are
project specific and stay out of the repository.

Download them **after** enabling Google sign-in and adding the Android SHA-1/SHA-256 fingerprints (see the
README section *Firebase & giriş kurulumu*): only then do they contain the OAuth clients Google Sign-In needs
(`client_type: 3` web client in the JSON, `REVERSED_CLIENT_ID` in the plist). Re-download them whenever you
add fingerprints or providers.

## What `app.config.ts` does with them

- `$GOOGLE_SERVICES_JSON` (env) → else `./firebase/google-services.json` → `android.googleServicesFile`
- `$GOOGLE_SERVICE_INFO_PLIST` (env) → else `./firebase/GoogleService-Info.plist` → `ios.googleServicesFile`
- When at least one file exists: adds the `@react-native-firebase/app` and `@react-native-firebase/auth` config
  plugins; the plist's `REVERSED_CLIENT_ID` becomes the Google Sign-In URL scheme
  (`@react-native-google-signin/google-signin` plugin, `iosUrlScheme`); the JSON's web OAuth client becomes
  `extra.googleWebClientId` (override: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`).
- `extra.firebaseConfigured` / `extra.firebasePlatforms` tell the app at runtime whether native Firebase exists.
- Without the files the app builds in **fallback mode** (local e-mail/password against the backend while the
  server allows it with `config.auth.local`).

Check what was picked up: `npx expo config --type public` → `extra.firebaseConfigured`, `extra.firebasePlatforms`,
`extra.googleWebClientId`, `ios.googleServicesFile`, `android.googleServicesFile`.

> Put **both** files in place. With only one of them, build/prebuild only that platform
> (`eas build -p android`, `npx expo prebuild -p android`); the React Native Firebase plugin stops a prebuild of
> the other platform with "Path to GoogleService-Info.plist is not defined".

## EAS Build

Two options — pick one:

1. **Files in this folder (simplest).** `.easignore` (used by EAS instead of `.gitignore`) does *not* ignore
   them, so `eas build` uploads them together with the project even though git ignores them.
2. **EAS file environment variables** (CI, or when the files must not live on the build machine):

   ```bash
   eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./firebase/google-services.json \
     --visibility secret --environment development --environment preview --environment production
   eas env:create --name GOOGLE_SERVICE_INFO_PLIST --type file --value ./firebase/GoogleService-Info.plist \
     --visibility secret --environment development --environment preview --environment production
   ```

   On the build server the variables hold the path of the uploaded file; `app.config.ts` prefers them over the
   local folder.
