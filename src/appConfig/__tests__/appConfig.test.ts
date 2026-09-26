import type { AppConfig } from '../../api/types';
import { resolveAuthOptions } from '../authMode';
import { LEGACY_APP_CONFIG, normalizeAppConfig } from '../normalize';
import { compareVersions, isUpdateRequired, parseVersion } from '../version';

const DOCUMENTED = {
  auth: { firebase: true, local: false, providers: { apple: true, google: true, email: true } },
  firebaseWeb: {
    apiKey: 'AIza',
    authDomain: 'x.firebaseapp.com',
    projectId: 'ryvenca-prod',
    appId: '1:2:web:3',
    messagingSenderId: '2',
    storageBucket: 'x.appspot.com',
  },
  links: {
    privacyPolicy: 'https://ryvenca.com/privacy',
    terms: 'https://ryvenca.com/terms',
    support: null,
    supportEmail: 'help@ryvenca.com',
    accountDeletion: 'https://ryvenca.com/delete-account',
    appStore: 'https://apps.apple.com/app/id1',
    playStore: 'https://play.google.com/store/apps/details?id=com.ryvenca.app',
  },
  maintenance: { enabled: false, message: null },
  minVersion: { ios: '1.0.0', android: null },
};

describe('normalizeAppConfig', () => {
  it('keeps the documented payload as is', () => {
    expect(normalizeAppConfig(DOCUMENTED)).toEqual(DOCUMENTED);
  });

  it('falls back to safe defaults for missing / invalid values', () => {
    const config = normalizeAppConfig({
      auth: { firebase: 'yes', providers: null },
      links: { privacyPolicy: 'javascript:alert(1)', terms: 'ftp://x', supportEmail: 'not-an-email', support: ' https://s.io/help ' },
      maintenance: { enabled: 1, message: '   ' },
      minVersion: { ios: 42 },
    });
    expect(config.auth).toEqual({ firebase: false, local: true, providers: { apple: false, google: false, email: false } });
    expect(config.links.privacyPolicy).toBeNull();
    expect(config.links.terms).toBeNull();
    expect(config.links.supportEmail).toBeNull();
    expect(config.links.support).toBe('https://s.io/help');
    expect(config.maintenance).toEqual({ enabled: false, message: null });
    expect(config.minVersion).toEqual({ ios: null, android: null });
    expect(config.firebaseWeb).toBeNull();
  });

  it('treats null / garbage as the legacy configuration', () => {
    expect(normalizeAppConfig(null)).toEqual(LEGACY_APP_CONFIG);
    expect(normalizeAppConfig('oops')).toEqual(LEGACY_APP_CONFIG);
  });

  it('defaults local auth to the opposite of firebase and providers to firebase', () => {
    const config = normalizeAppConfig({ auth: { firebase: true } });
    expect(config.auth.local).toBe(false);
    expect(config.auth.providers).toEqual({ apple: true, google: true, email: true });
  });
});

describe('version comparison', () => {
  it('parses loose version strings', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
    expect(parseVersion('v2.0')).toEqual([2, 0]);
    expect(parseVersion('1.4.0-beta.2')).toEqual([1, 4, 0]);
    expect(parseVersion('3 (45)')).toEqual([3]);
    expect(parseVersion('beta')).toBeNull();
    expect(parseVersion(null)).toBeNull();
  });

  it('compares numerically, missing parts are zero', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.2.0', '1.10.0')).toBe(-1);
    expect(compareVersions('2.0.0', '1.99.99')).toBe(1);
    expect(compareVersions('1.0.1', '1.0')).toBe(1);
  });

  it('requires an update only when installed < minimum and both are valid', () => {
    expect(isUpdateRequired('1.0.0', '1.0.1')).toBe(true);
    expect(isUpdateRequired('1.9.9', '2.0.0')).toBe(true);
    expect(isUpdateRequired('1.0.0', '1.0.0')).toBe(false);
    expect(isUpdateRequired('1.2.0', '1.1.9')).toBe(false);
    expect(isUpdateRequired('1.0.0', null)).toBe(false);
    expect(isUpdateRequired(null, '9.9.9')).toBe(false);
    expect(isUpdateRequired('1.0.0', 'latest')).toBe(false);
  });
});

describe('resolveAuthOptions', () => {
  const firebaseConfig: AppConfig = normalizeAppConfig(DOCUMENTED);
  const base = { config: firebaseConfig, platform: 'ios', firebaseReady: true, appleAvailable: true, googleConfigured: true };

  it('shows all enabled providers on iOS', () => {
    expect(resolveAuthOptions(base)).toEqual({ mode: 'firebase', apple: true, google: true, email: true });
  });

  it('never shows Apple on Android', () => {
    expect(resolveAuthOptions({ ...base, platform: 'android', appleAvailable: false })).toEqual({
      mode: 'firebase',
      apple: false,
      google: true,
      email: true,
    });
  });

  it('hides providers the server disabled or the build cannot run', () => {
    const config = normalizeAppConfig({ ...DOCUMENTED, auth: { ...DOCUMENTED.auth, providers: { apple: false, google: true, email: true } } });
    expect(resolveAuthOptions({ ...base, config, googleConfigured: false })).toEqual({
      mode: 'firebase',
      apple: false,
      google: false,
      email: true,
    });
  });

  it('falls back to the local form without native Firebase (web, Expo Go, no config files)', () => {
    const config = normalizeAppConfig({ auth: { firebase: true, local: true } });
    expect(resolveAuthOptions({ ...base, config, firebaseReady: false }).mode).toBe('local');
    expect(resolveAuthOptions({ ...base, config, platform: 'web' }).mode).toBe('local');
  });

  it('falls back to local when the server cannot verify Firebase tokens', () => {
    expect(resolveAuthOptions({ ...base, config: LEGACY_APP_CONFIG }).mode).toBe('local');
  });

  it('is unavailable when neither Firebase nor local auth works', () => {
    expect(resolveAuthOptions({ ...base, firebaseReady: false })).toEqual({
      mode: 'unavailable',
      apple: false,
      google: false,
      email: false,
    });
  });
});
