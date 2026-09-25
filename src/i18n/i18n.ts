/**
 * i18next instance (no React Native imports here, so API helpers and unit tests can use `t` too).
 *
 * - `src/locales/tr.json` is the source of truth; every other file mirrors its keys.
 * - All 16 locale files are bundled (they are small) so switching languages is instant and offline.
 * - Missing keys fall back to English, then Turkish.
 */
import { createInstance, type FormatterModule } from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from '../locales/ar.json';
import bn from '../locales/bn.json';
import de from '../locales/de.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import hi from '../locales/hi.json';
import id from '../locales/id.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import pt from '../locales/pt.json';
import ru from '../locales/ru.json';
import tr from '../locales/tr.json';
import ur from '../locales/ur.json';
import vi from '../locales/vi.json';
import zh from '../locales/zh.json';
import { formatNumber } from './format';
import { FALLBACK_LANGUAGE, LANGUAGE_CODES, SOURCE_LANGUAGE, type LanguageCode } from './languages';
import { ensurePluralRules } from './pluralRules';

// Must run before i18next resolves the first plural (Hermes may lack Intl.PluralRules).
ensurePluralRules();

export const resources = {
  tr: { translation: tr },
  en: { translation: en },
  zh: { translation: zh },
  hi: { translation: hi },
  es: { translation: es },
  ar: { translation: ar },
  fr: { translation: fr },
  bn: { translation: bn },
  pt: { translation: pt },
  ru: { translation: ru },
  id: { translation: id },
  ur: { translation: ur },
  de: { translation: de },
  ja: { translation: ja },
  vi: { translation: vi },
  ko: { translation: ko },
} as const satisfies Record<LanguageCode, { translation: object }>;

/**
 * Interpolation formatter: numbers passed to t() ({{count}}, {{current}}/{{total}}, …) are rendered
 * with the language's digits and grouping (e.g. Arabic-Indic digits for `ar`). Other values pass through.
 */
const numberFormatter: FormatterModule = {
  type: 'formatter',
  init: () => undefined,
  add: () => undefined,
  addCached: () => undefined,
  format: (value, _format, lng) => (typeof value === 'number' && lng ? formatNumber(value, lng) : value),
};

export const i18n = createInstance();

void i18n
  .use(initReactI18next)
  .use(numberFormatter)
  .init({
    resources,
    lng: SOURCE_LANGUAGE,
    fallbackLng: [FALLBACK_LANGUAGE, SOURCE_LANGUAGE],
    supportedLngs: [...LANGUAGE_CODES],
    load: 'languageOnly',
    // Resources are bundled → initialise synchronously so the first render already has strings.
    initAsync: false,
    // Keys are nested objects ("home.hero.title"); ":" may appear in copy, so no namespace separator.
    nsSeparator: false,
    interpolation: { escapeValue: false, alwaysFormat: true },
    returnNull: false,
    react: { useSuspense: false },
  });

/** Current UI language (always one of the supported codes). */
export function currentLanguage(): LanguageCode {
  const lng = i18n.resolvedLanguage ?? i18n.language;
  return (LANGUAGE_CODES as readonly string[]).includes(lng) ? (lng as LanguageCode) : FALLBACK_LANGUAGE;
}

/** Translate outside React (API errors, confirm dialogs). Reads the language at call time. */
export const t = i18n.t.bind(i18n);
