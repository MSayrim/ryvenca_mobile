import { StyleSheet, View } from 'react-native';

import { useFormatters, useTranslation } from '../i18n';
import { colors, fonts, radius } from '../theme';
import { clampScore } from '../utils/labels';
import { Typography } from './Typography';

/** "Uyum %92" (tr) / "Match 92%" (en): score clamped to 0–100, percent formatted for the language. */
function useScoreLabel(score: number): string {
  const { t } = useTranslation();
  const format = useFormatters();
  return t('outfit.scorePill', { percent: format.percent(clampScore(score)) });
}

/** Compact "✦ Match 92%" pill on successBg. */
export function ScorePill({ score, size = 'md' }: { score: number; size?: 'md' | 'sm' }) {
  const label = useScoreLabel(score);
  return (
    <View style={[styles.pill, size === 'sm' && styles.sm]} accessibilityLabel={label}>
      <Typography style={[styles.spark, size === 'sm' && styles.textSm]}>✦</Typography>
      <Typography style={[styles.text, size === 'sm' && styles.textSm]}>{label}</Typography>
    </View>
  );
}

/** Tiny numeric badge used on pairing thumbnails. */
export function ScoreBadge({ score }: { score: number }) {
  const label = useScoreLabel(score);
  const format = useFormatters();
  return (
    <View style={styles.badge} accessibilityLabel={label}>
      <Typography style={styles.badgeText}>{`✦ ${format.number(clampScore(score))}`}</Typography>
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
    end: 6,
    backgroundColor: colors.successBg,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: colors.success, fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 14 },
});
