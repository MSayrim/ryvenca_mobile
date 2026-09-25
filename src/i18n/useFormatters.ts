import { useMemo } from 'react';

import { formatDate, formatNumber, formatPercent, toUpperLocale } from './format';
import { useLanguage } from './LanguageProvider';

/** Number/percent/date formatters bound to the current UI language. */
export function useFormatters() {
  const { language } = useLanguage();
  return useMemo(
    () => ({
      /** 0–100 → "%92" (tr) / "92%" (en) / "٩٢٪" (ar). */
      percent: (value: number) => formatPercent(value, language),
      number: (value: number) => formatNumber(value, language),
      date: (value: string | number | Date) => formatDate(value, language),
      upper: (text: string) => toUpperLocale(text, language),
    }),
    [language],
  );
}
