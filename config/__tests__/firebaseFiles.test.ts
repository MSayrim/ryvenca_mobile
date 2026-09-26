import {
  plistString,
  resolveConfigFile,
  resolveFirebaseSetup,
  reversedClientIdFromPlist,
  webClientIdFromGoogleServices,
} from '../firebaseFiles';

// Node built-ins (the project does not ship @types/node; only what this test needs is typed).
declare const require: (id: string) => unknown;
const fs = require('fs') as {
  mkdtempSync(prefix: string): string;
  mkdirSync(dir: string, options: { recursive: boolean }): void;
  writeFileSync(file: string, data: string): void;
  rmSync(dir: string, options: { recursive: boolean; force: boolean }): void;
};
const os = require('os') as { tmpdir(): string };
const path = require('path') as { join(...parts: string[]): string };

const PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>CLIENT_ID</key>
  <string>1234-ios.apps.googleusercontent.com</string>
  <key>REVERSED_CLIENT_ID</key>
  <string>com.googleusercontent.apps.1234-ios</string>
  <key>BUNDLE_ID</key>
  <string>com.ryvenca.app</string>
</dict>
</plist>`;

const GOOGLE_SERVICES = {
  project_info: { project_id: 'ryvenca' },
  client: [
    {
      client_info: { android_client_info: { package_name: 'com.other.app' } },
      oauth_client: [{ client_id: 'other-web', client_type: 3 }],
    },
    {
      client_info: { android_client_info: { package_name: 'com.ryvenca.app' } },
      oauth_client: [
        { client_id: 'android-client', client_type: 1 },
        { client_id: 'ryvenca-web.apps.googleusercontent.com', client_type: 3 },
      ],
    },
  ],
};

describe('plist parsing', () => {
  it('reads string keys and the reversed client id', () => {
    expect(plistString(PLIST, 'BUNDLE_ID')).toBe('com.ryvenca.app');
    expect(plistString(PLIST, 'MISSING')).toBeNull();
    expect(reversedClientIdFromPlist(PLIST)).toBe('com.googleusercontent.apps.1234-ios');
  });

  it('rejects a plist without Google sign-in', () => {
    expect(reversedClientIdFromPlist('<plist><dict><key>API_KEY</key><string>x</string></dict></plist>')).toBeNull();
  });
});

describe('google-services.json parsing', () => {
  it('prefers the web client of the app package', () => {
    expect(webClientIdFromGoogleServices(GOOGLE_SERVICES, 'com.ryvenca.app')).toBe('ryvenca-web.apps.googleusercontent.com');
    expect(webClientIdFromGoogleServices(JSON.stringify(GOOGLE_SERVICES), 'com.ryvenca.app')).toBe(
      'ryvenca-web.apps.googleusercontent.com',
    );
  });

  it('falls back to other_platform_oauth_client and handles garbage', () => {
    const json = {
      client: [
        {
          client_info: { android_client_info: { package_name: 'com.ryvenca.app' } },
          oauth_client: [],
          services: { appinvite_service: { other_platform_oauth_client: [{ client_id: 'web-2', client_type: 3 }] } },
        },
      ],
    };
    expect(webClientIdFromGoogleServices(json, 'com.ryvenca.app')).toBe('web-2');
    expect(webClientIdFromGoogleServices('{not json', 'com.ryvenca.app')).toBeNull();
    expect(webClientIdFromGoogleServices({ client: [{ oauth_client: [{ client_type: 1, client_id: 'a' }] }] })).toBeNull();
  });
});

describe('resolveFirebaseSetup', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'ryvenca-fb-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('reports fallback mode when no files exist', () => {
    const setup = resolveFirebaseSetup({ env: {}, projectRoot: root, packageName: 'com.ryvenca.app' });
    expect(setup).toEqual({ androidFile: null, iosFile: null, iosUrlScheme: null, webClientId: null, warnings: [] });
  });

  it('finds the default files in ./firebase', () => {
    fs.mkdirSync(path.join(root, 'firebase'), { recursive: true });
    fs.writeFileSync(path.join(root, 'firebase', 'google-services.json'), JSON.stringify(GOOGLE_SERVICES));
    fs.writeFileSync(path.join(root, 'firebase', 'GoogleService-Info.plist'), PLIST);
    const setup = resolveFirebaseSetup({ env: {}, projectRoot: root, packageName: 'com.ryvenca.app' });
    expect(setup.androidFile).toBe('./firebase/google-services.json');
    expect(setup.iosFile).toBe('./firebase/GoogleService-Info.plist');
    expect(setup.iosUrlScheme).toBe('com.googleusercontent.apps.1234-ios');
    expect(setup.webClientId).toBe('ryvenca-web.apps.googleusercontent.com');
    expect(setup.warnings).toEqual([]);
  });

  it('prefers the env paths (EAS file variables) and the env web client id', () => {
    const json = path.join(root, 'secret-google-services.json');
    fs.writeFileSync(json, JSON.stringify(GOOGLE_SERVICES));
    const setup = resolveFirebaseSetup({
      env: { GOOGLE_SERVICES_JSON: json, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'override-web' },
      projectRoot: root,
      packageName: 'com.ryvenca.app',
    });
    expect(setup.androidFile).toBe(json);
    expect(setup.iosFile).toBeNull();
    expect(setup.webClientId).toBe('override-web');
  });

  it('warns (but does not fail) on files without Google sign-in', () => {
    fs.mkdirSync(path.join(root, 'firebase'), { recursive: true });
    fs.writeFileSync(path.join(root, 'firebase', 'google-services.json'), '{"client":[]}');
    const setup = resolveFirebaseSetup({ env: {}, projectRoot: root, packageName: 'com.ryvenca.app' });
    expect(setup.androidFile).toBe('./firebase/google-services.json');
    expect(setup.webClientId).toBeNull();
    expect(setup.warnings).toHaveLength(1);
  });

  it('ignores env paths that do not exist', () => {
    expect(resolveConfigFile('/nope/google-services.json', './firebase/google-services.json', root)).toBeNull();
  });
});
