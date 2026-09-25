/**
 * Web preview: direction is switched live through the document's `dir` attribute
 * (react-native-web maps start/end styles to CSS logical properties), so no reload is needed.
 */
export function applyLayoutDirection(rtl: boolean, lang: string): { needsReload: boolean } {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }
  return { needsReload: false };
}

export function layoutIsRTL(languageIsRTL: boolean): boolean {
  return languageIsRTL;
}

export async function reloadApp(): Promise<void> {
  // Not needed on web.
}
