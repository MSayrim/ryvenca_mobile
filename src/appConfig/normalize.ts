import type { AppConfig, AppLinks, FirebaseWebConfig } from '../api/types';

/**
 * Used when the server has no `/api/config` yet (404 from an older backend): the legacy local
 * e-mail/password flow, no Firebase, no links, no gates.
 */
export const LEGACY_APP_CONFIG: AppConfig = {
  auth: { firebase: false, local: true, providers: { apple: false, google: false, email: false } },
  firebaseWeb: null,
  links: {
    privacyPolicy: null,
    terms: null,
    support: null,
    supportEmail: null,
    accountDeletion: null,
    appStore: null,
    playStore: null,
  },
  maintenance: { enabled: false, message: null },
  minVersion: { ios: null, android: null },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Only http(s) URLs are opened (never javascript:, file:, …). */
function url(value: unknown): string | null {
  const v = text(value);
  return v && /^https?:\/\/\S+$/i.test(v) ? v : null;
}

function email(value: unknown): string | null {
  const v = text(value);
  return v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

const LINK_KEYS: (keyof AppLinks)[] = [
  'privacyPolicy',
  'terms',
  'support',
  'supportEmail',
  'accountDeletion',
  'appStore',
  'playStore',
];

function firebaseWeb(value: unknown): FirebaseWebConfig | null {
  if (!isRecord(value)) return null;
  const apiKey = text(value.apiKey);
  const projectId = text(value.projectId);
  if (!apiKey || !projectId) return null;
  return {
    apiKey,
    projectId,
    authDomain: text(value.authDomain) ?? '',
    appId: text(value.appId) ?? '',
    messagingSenderId: text(value.messagingSenderId) ?? '',
    storageBucket: text(value.storageBucket) ?? '',
  };
}

/**
 * Tolerant parser for `GET /api/config`: every field is optional and invalid values fall back to safe
 * defaults (Firebase off, local on unless the server says otherwise, providers on when Firebase is on,
 * no links, no maintenance, no minimum version).
 */
export function normalizeAppConfig(raw: unknown): AppConfig {
  const root = isRecord(raw) ? raw : {};
  const auth = isRecord(root.auth) ? root.auth : {};
  const providers = isRecord(auth.providers) ? auth.providers : {};
  const links = isRecord(root.links) ? root.links : {};
  const maintenance = isRecord(root.maintenance) ? root.maintenance : {};
  const minVersion = isRecord(root.minVersion) ? root.minVersion : {};

  const firebase = bool(auth.firebase, false);
  const normalizedLinks = Object.fromEntries(
    LINK_KEYS.map((key) => [key, key === 'supportEmail' ? email(links[key]) : url(links[key])]),
  ) as unknown as AppLinks;

  return {
    auth: {
      firebase,
      local: bool(auth.local, !firebase),
      providers: {
        apple: bool(providers.apple, firebase),
        google: bool(providers.google, firebase),
        email: bool(providers.email, firebase),
      },
    },
    firebaseWeb: firebaseWeb(root.firebaseWeb),
    links: normalizedLinks,
    maintenance: { enabled: bool(maintenance.enabled, false), message: text(maintenance.message) },
    minVersion: { ios: text(minVersion.ios), android: text(minVersion.android) },
  };
}
