import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { typographyProfile, type TypographyProfile } from '../theme/typography';
import { confirm } from '../utils/confirm';
import { getDeviceLanguageTags } from './device';
import { applyLayoutDirection, layoutIsRTL, reloadApp } from './direction';
import { currentLanguage, i18n, t } from './i18n';
import { isRTLLanguage, matchLanguage, resolveLanguage, type LanguageCode } from './languages';
import { loadLastDirectionReload, loadStoredLanguage, saveLastDirectionReload, saveStoredLanguage } from './storage';

/** Minimum gap between two automatic direction reloads (protects against reload loops). */
const DIRECTION_RELOAD_GUARD_MS = 30_000;

/**
 * Resolves and applies the UI language before the first render:
 * saved choice → device locales → English (the account language is applied after login, see
 * `applyAccountLanguage`). Also applies the layout direction and, on native, reloads once if the
 * running direction does not match (e.g. the saved language is Arabic but the app started LTR).
 */
export async function bootstrapLanguage(): Promise<LanguageCode> {
  const stored = await loadStoredLanguage();
  const lang = resolveLanguage({ saved: stored?.code, device: getDeviceLanguageTags() });
  if (i18n.language !== lang) await i18n.changeLanguage(lang);
  const { needsReload } = applyLayoutDirection(isRTLLanguage(lang), lang);
  if (needsReload) {
    const last = await loadLastDirectionReload();
    if (Date.now() - last > DIRECTION_RELOAD_GUARD_MS) {
      await saveLastDirectionReload(Date.now());
      await reloadApp();
    }
  }
  return lang;
}

export interface LanguageContextValue {
  language: LanguageCode;
  /** Direction the UI is currently laid out in (on native it only changes after a reload). */
  isRTL: boolean;
  typography: TypographyProfile;
  /** Switch the UI language immediately and persist it. Resolves whether a reload is needed for RTL/LTR. */
  changeLanguage: (code: LanguageCode, source?: 'user' | 'account') => Promise<{ needsReload: boolean }>;
  /** Ask the user to restart so a new layout direction takes effect. */
  promptReload: () => Promise<void>;
  /**
   * Apply `user.language` after login/restore. Returns a language that should be written back to the
   * account (`PUT /api/me`) because the user explicitly picked it on this device, or null.
   */
  applyAccountLanguage: (user: { language?: string | null }, explicitLogin: boolean) => Promise<LanguageCode | null>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(currentLanguage);

  useEffect(() => {
    const onChange = () => setLanguage(currentLanguage());
    i18n.on('languageChanged', onChange);
    return () => i18n.off('languageChanged', onChange);
  }, []);

  const changeLanguage = useCallback(async (code: LanguageCode, source: 'user' | 'account' = 'user') => {
    // Switch the UI first (instant), then persist.
    if (currentLanguage() !== code) await i18n.changeLanguage(code);
    const direction = applyLayoutDirection(isRTLLanguage(code), code);
    await saveStoredLanguage({ code, source });
    return direction;
  }, []);

  const promptReload = useCallback(async () => {
    const ok = await confirm({
      title: t('language.restart.title'),
      message: t('language.restart.message'),
      confirmText: t('language.restart.confirm'),
      cancelText: t('common.later'),
    });
    if (ok) await reloadApp();
  }, []);

  const applyAccountLanguage = useCallback(
    async (user: { language?: string | null }, explicitLogin: boolean): Promise<LanguageCode | null> => {
      const stored = await loadStoredLanguage();
      const account = matchLanguage(user.language);
      // An explicit pick on this device wins; sync it to the account on an explicit login.
      if (stored?.source === 'user') {
        return explicitLogin && account !== stored.code ? stored.code : null;
      }
      if (account) {
        const { needsReload } = await changeLanguage(account, 'account');
        if (needsReload) await promptReload();
      }
      return null;
    },
    [changeLanguage, promptReload],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      isRTL: layoutIsRTL(isRTLLanguage(language)),
      typography: typographyProfile(language),
      changeLanguage,
      promptReload,
      applyAccountLanguage,
    }),
    [language, changeLanguage, promptReload, applyAccountLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

const FALLBACK: LanguageContextValue = {
  language: 'tr',
  isRTL: false,
  typography: typographyProfile('tr'),
  changeLanguage: async () => ({ needsReload: false }),
  promptReload: async () => undefined,
  applyAccountLanguage: async () => null,
};

/** Current language, layout direction and typography profile. */
export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext) ?? FALLBACK;
}
