import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { isRTLLanguage } from './languages';
import { useLanguage } from './LanguageProvider';

/**
 * Web preview: react-native-web resolves start/end styles (marginStart, `start` positions, …) from the
 * nearest `dir`/`lang` context, so the whole app is wrapped in a View carrying the UI language.
 * The document's `dir` attribute is switched too (see direction.web.ts) for portals and scrollbars.
 */
export function DirectionRoot({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const props = { dir: isRTLLanguage(language) ? 'rtl' : 'ltr', lang: language } as ViewProps;
  return (
    <View {...props} style={styles.root}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
