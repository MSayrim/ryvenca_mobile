import 'i18next';

import type tr from '../locales/tr.json';

// Type-safe keys: `t('home.hero.title')` is checked against the source locale (tr.json).
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof tr };
    returnNull: false;
  }
}
