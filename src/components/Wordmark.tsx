import { StyleSheet, View } from 'react-native';

import { colors, fonts } from '../theme';
import { Typography } from './Typography';

export interface WordmarkProps {
  size?: number;
  tagline?: boolean;
  color?: string;
  align?: 'center' | 'left';
}

/** "RYVENCA" — Fraunces 500, letter-spacing ~0.28em. */
export function Wordmark({ size = 20, tagline = false, color = colors.ink, align = 'center' }: WordmarkProps) {
  return (
    <View style={[styles.wrap, align === 'left' && styles.left]} accessibilityRole="header" accessibilityLabel="RYVENCA">
      <Typography
        style={{
          fontFamily: fonts.display,
          fontSize: size,
          lineHeight: Math.round(size * 1.2),
          letterSpacing: size * 0.28,
          // Compensate the trailing tracking so the word stays optically centered.
          marginRight: align === 'center' ? -size * 0.28 : 0,
          color,
        }}
      >
        RYVENCA
      </Typography>
      {tagline ? (
        <Typography variant="caption" color={colors.textMuted} style={styles.tagline}>
          Style what you already own
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  left: { alignItems: 'flex-start' },
  tagline: { marginTop: 1, letterSpacing: 0.4 },
});
