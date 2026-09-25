import { StyleSheet, View } from 'react-native';

import { colors, fonts, radius } from '../theme';
import { scoreLabel } from '../utils/labels';
import { Typography } from './Typography';

/** Compact "✦ Uyum %92" pill on successBg. */
export function ScorePill({ score, size = 'md' }: { score: number; size?: 'md' | 'sm' }) {
  const label = scoreLabel(score);
  return (
    <View style={[styles.pill, size === 'sm' && styles.sm]} accessibilityLabel={label}>
      <Typography style={[styles.spark, size === 'sm' && styles.textSm]}>✦</Typography>
      <Typography style={[styles.text, size === 'sm' && styles.textSm]}>{label}</Typography>
    </View>
  );
}

/** Tiny numeric badge used on pairing thumbnails. */
export function ScoreBadge({ score }: { score: number }) {
  return (
    <View style={styles.badge} accessibilityLabel={scoreLabel(score)}>
      <Typography style={styles.badgeText}>✦ {Math.round(score)}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: colors.successBg,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  spark: { color: colors.success, fontSize: 12, lineHeight: 16 },
  text: { color: colors.success, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 16 },
  textSm: { fontSize: 11, lineHeight: 14 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.successBg,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: colors.success, fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 14 },
});
