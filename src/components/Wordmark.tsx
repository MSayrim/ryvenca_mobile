import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../i18n';
import { colors, fonts } from '../theme';
import { Typography } from './Typography';

export interface WordmarkProps {
  size?: number;
  tagline?: boolean;
  color?: string;
  /** `start` = leading edge (left in LTR, right in RTL). */
  align?: 'center' | 'start';
}

/**
 * "RYVENCA" — Fraunces 500, letter-spacing ~0.28em. The logotype is Latin in every language, so it
 * renders with a plain Text (always Fraunces) instead of the language-aware Typography.
 */
export function Wordmark({ size = 20, tagline = false, color = colors.ink, align = 'center' }: WordmarkProps) {
  const { t } = useTranslation();
  return (
    <View style={[styles.wrap, align === 'start' && styles.start]} accessibilityRole="header" accessibilityLabel="RYVENCA">
      <Text
        maxFontSizeMultiplier={1.4}
        style={{
          fontFamily: fonts.display,
          fontSize: size,
          lineHeight: Math.round(size * 1.2),
          letterSpacing: size * 0.28,
          // Always laid out LTR; compensate the trailing tracking so the word stays optically centered.
          writingDirection: 'ltr',
          marginEnd: align === 'center' ? -size * 0.28 : 0,
          color,
        }}
      >
        RYVENCA
      </Text>
      {tagline ? (
        <Typography variant="caption" color={colors.textMuted} style={styles.tagline}>
          {t('brand.tagline')}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  start: { alignItems: 'flex-start' },
  tagline: { marginTop: 1, letterSpacing: 0.4 },
});
