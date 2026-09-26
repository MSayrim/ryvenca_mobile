/**
 * Build-time helpers for the Firebase config files (used by app.config.ts).
 *
 * Plain CommonJS on purpose: Expo evaluates app.config.ts with a loader that can `require` local .js files
 * but not local .ts files. Pure functions (no Expo imports) so they are unit tested
 * (config/__tests__/firebaseFiles.test.ts).
 *
 * Resolution order per platform:
 *   Android: $GOOGLE_SERVICES_JSON       → ./firebase/google-services.json
 *   iOS:     $GOOGLE_SERVICE_INFO_PLIST  → ./firebase/GoogleService-Info.plist
 * The env vars are what EAS "file" secrets/environment variables provide (they hold an absolute path).
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_ANDROID_FILE = './firebase/google-services.json';
const DEFAULT_IOS_FILE = './firebase/GoogleService-Info.plist';

/** Returns the path to use (as given, so relative paths stay relative to the project) or null when missing. */
function resolveConfigFile(envValue, defaultPath, projectRoot) {
  const candidates = [];
  if (typeof envValue === 'string' && envValue.trim()) candidates.push(envValue.trim());
  candidates.push(defaultPath);
  for (const candidate of candidates) {
    const absolute = path.isAbsolute(candidate) ? candidate : path.resolve(projectRoot, candidate);
    try {
      if (fs.statSync(absolute).isFile()) return candidate;
    } catch {
      // not there → next candidate
    }
  }
  return null;
}

function readText(file, projectRoot) {
  const absolute = path.isAbsolute(file) ? file : path.resolve(projectRoot, file);
  return fs.readFileSync(absolute, 'utf8');
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Reads a top-level `<key>NAME</key><string>value</string>` pair from an XML plist. */
function plistString(xml, key) {
  if (typeof xml !== 'string') return null;
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`<key>\\s*${escaped}\\s*</key>\\s*<string>([^<]*)</string>`).exec(xml);
  const value = match ? decodeXml(match[1]).trim() : '';
  return value || null;
}

/** GoogleService-Info.plist → REVERSED_CLIENT_ID (the iOS URL scheme Google Sign-In redirects to). */
function reversedClientIdFromPlist(xml) {
  const value = plistString(xml, 'REVERSED_CLIENT_ID');
  return value && value.startsWith('com.googleusercontent.apps.') ? value : null;
}

/**
 * google-services.json → OAuth client of type 3 ("web client"), which Google Sign-In needs as
 * `webClientId` to return an ID token Firebase accepts. Prefers the client entry of `packageName`.
 */
function webClientIdFromGoogleServices(json, packageName) {
  let data = json;
  if (typeof json === 'string') {
    try {
      data = JSON.parse(json);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.client)) return null;

  const clients = data.client.filter((c) => c && typeof c === 'object');
  const packageOf = (c) => c.client_info?.android_client_info?.package_name;
  const ordered = [
    ...clients.filter((c) => packageOf(c) === packageName),
    ...clients.filter((c) => packageOf(c) !== packageName),
  ];

  const webClient = (list) =>
    Array.isArray(list)
      ? list.find((o) => o && Number(o.client_type) === 3 && typeof o.client_id === 'string' && o.client_id)
      : undefined;

  for (const client of ordered) {
    const direct = webClient(client.oauth_client);
    if (direct) return direct.client_id;
    const other = webClient(client.services?.appinvite_service?.other_platform_oauth_client);
    if (other) return other.client_id;
  }
  return null;
}

/**
 * Everything app.config.ts needs, in one call. Never throws: unreadable/invalid files are reported via
 * `warnings` and treated as missing so a build without Firebase still works (fallback mode).
 */
function resolveFirebaseSetup({ env = process.env, projectRoot = process.cwd(), packageName } = {}) {
  const warnings = [];
  const androidFile = resolveConfigFile(env.GOOGLE_SERVICES_JSON, DEFAULT_ANDROID_FILE, projectRoot);
  const iosFile = resolveConfigFile(env.GOOGLE_SERVICE_INFO_PLIST, DEFAULT_IOS_FILE, projectRoot);

  let webClientId = null;
  if (androidFile) {
    try {
      webClientId = webClientIdFromGoogleServices(readText(androidFile, projectRoot), packageName);
      if (!webClientId) {
        warnings.push(
          `${androidFile} has no web OAuth client (client_type 3). Enable Google sign-in in the Firebase console ` +
            'and download the file again, or set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.',
        );
      }
    } catch (error) {
      warnings.push(`Could not read ${androidFile}: ${error.message}`);
    }
  }

  let iosUrlScheme = null;
  if (iosFile) {
    try {
      iosUrlScheme = reversedClientIdFromPlist(readText(iosFile, projectRoot));
      if (!iosUrlScheme) {
        warnings.push(
          `${iosFile} has no REVERSED_CLIENT_ID. Enable Google sign-in in the Firebase console and download it again ` +
            '(Google sign-in is disabled on iOS until then).',
        );
      }
    } catch (error) {
      warnings.push(`Could not read ${iosFile}: ${error.message}`);
    }
  }

  const envWebClientId = typeof env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID === 'string' ? env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.trim() : '';

  return {
    androidFile,
    iosFile,
    iosUrlScheme,
    webClientId: envWebClientId || webClientId,
    warnings,
  };
}

module.exports = {
  DEFAULT_ANDROID_FILE,
  DEFAULT_IOS_FILE,
  resolveConfigFile,
  plistString,
  reversedClientIdFromPlist,
  webClientIdFromGoogleServices,
  resolveFirebaseSetup,
};
