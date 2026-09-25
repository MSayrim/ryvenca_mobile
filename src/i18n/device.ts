import { getLocales } from 'expo-localization';

/** Device/browser preferred language tags, most preferred first (e.g. ["de-AT", "en-US"]). */
export function getDeviceLanguageTags(): string[] {
  try {
    return getLocales()
      .map((l) => l.languageTag || l.languageCode || '')
      .filter(Boolean);
  } catch {
    return [];
  }
}
