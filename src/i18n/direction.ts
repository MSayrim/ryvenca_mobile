import { reloadAppAsync } from 'expo';
import * as Updates from 'expo-updates';
import { DevSettings, I18nManager } from 'react-native';

/**
 * Native layout direction (iOS / Android).
 *
 * React Native reads the direction once when the JS runtime starts, so switching between LTR and RTL
 * (ar / ur) needs `forceRTL` + an app reload. `allowRTL` mirrors the target so that an LTR language on
 * an RTL device (e.g. English UI on an Arabic phone) stays LTR instead of following the device.
 */
export function applyLayoutDirection(rtl: boolean, lang: string): { needsReload: boolean } {
  void lang;
  try {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    // left/right in legacy styles behave like start/end (default, made explicit).
    I18nManager.swapLeftAndRightInRTL(true);
  } catch {
    return { needsReload: false };
  }
  return { needsReload: I18nManager.isRTL !== rtl };
}

/** Actual layout direction of the running app (changes only after a reload on native). */
export function layoutIsRTL(_languageIsRTL: boolean): boolean {
  return I18nManager.isRTL;
}

/**
 * Restarts the JS app so a new layout direction takes effect.
 * Production: expo-updates `reloadAsync()`; development: `DevSettings.reload()`; both guarded, with
 * expo's `reloadAppAsync()` as the last resort.
 */
export async function reloadApp(): Promise<void> {
  if (!__DEV__) {
    try {
      await Updates.reloadAsync();
      return;
    } catch {
      // expo-updates unavailable/disabled → try the next strategy
    }
  }
  try {
    if (typeof DevSettings?.reload === 'function') {
      DevSettings.reload('Layout direction changed');
      if (__DEV__) return;
    }
  } catch {
    // ignore
  }
  try {
    await reloadAppAsync('Layout direction changed');
  } catch {
    // Give up: the new direction applies on the next cold start.
  }
}
