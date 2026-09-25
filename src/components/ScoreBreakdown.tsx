import { StyleSheet, View } from 'react-native';

import type { ScoreBreakdownItem } from '../api/types';
import { useFormatters, useTranslation } from '../i18n';
import { colors, spacing } from '../theme';
import { clampScore } from '../utils/labels';
import { Typography } from './Typography';

/** Thin bars: label · weight % · score. */
export function ScoreBreakdown({ items }: { items: ScoreBreakdownItem[] }) {
  const { t } = useTranslation();
  const format = useFormatters();
  return (
    <View style={styles.list}>
      {items.map((item) => {
        const value = clampScore(item.score);
        return (
          <View
            key={item.code}
            style={styles.row}
            accessibilityLabel={t('outfit.breakdownA11y', { label: item.label, weight: format.percent(item.weight), score: value })}
          >
            <View style={styles.labels}>
              <Typography variant="smallMedium">{item.label}</Typography>
              <Typography variant="caption" style={styles.weight}>
                {format.percent(item.weight)}
              </Typography>
              <View style={styles.flex} />
              <Typography variant="smallMedium" color={colors.ink}>
                {format.number(value)}
              </Typography>
            </View>
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${value}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { gap: 6 },
  labels: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  weight: { color: colors.textMuted },
  flex: { flex: 1 },
  track: { height: 4, borderRadius: 999, backgroundColor: colors.cream, overflow: 'hidden' },
  bar: { height: 4, borderRadius: 999, backgroundColor: colors.ink },
});
