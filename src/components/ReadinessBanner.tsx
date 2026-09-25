import { Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Readiness } from '../api/types';
import { useTranslation } from '../i18n';
import { colors, radius, spacing } from '../theme';
import { readinessProgress } from '../utils/labels';
import { PrimaryButton } from './Buttons';
import { HangerIcon } from './HangerIcon';
import { Typography } from './Typography';

/** Suggested wardrobe size shown in the default title ("Add 5–10 pieces…"). */
const SUGGESTED_RANGE = { min: 5, max: 10 } as const;

/** Friendly progress towards having enough pieces for suggestions. */
export function ReadinessBanner({ readiness, onAdd, title }: { readiness: Readiness; onAdd: () => void; title?: string }) {
  const { t } = useTranslation();
  const progress = readinessProgress(readiness.garmentCount, readiness.recommendedMinimum);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <HangerIcon size={20} color={colors.brown} />
        </View>
        <View style={styles.flex}>
          <Typography variant="bodySemiBold">
            {title ?? t('readiness.title', SUGGESTED_RANGE)}
            <Typography variant="body" color={colors.textSecondary}>
              {` · ${t('readiness.progress', { current: readiness.garmentCount, total: readiness.recommendedMinimum })}`}
            </Typography>
          </Typography>
          <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: readiness.recommendedMinimum, now: readiness.garmentCount }}>
            <View style={[styles.bar, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>
      </View>
      {readiness.missing.length > 0 ? (
        <View style={styles.list}>
          {readiness.missing.map((m) => (
            <View key={`${m.category}-${m.message}`} style={styles.item}>
              <View style={styles.bullet} />
              <Typography variant="small" color={colors.text} style={styles.flex}>
                {m.message}
              </Typography>
            </View>
          ))}
        </View>
      ) : null}
      <PrimaryButton label={t('common.addPiece')} icon={Plus} size="sm" onPress={onAdd} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  track: { height: 5, borderRadius: 999, backgroundColor: colors.cream, marginTop: 8, overflow: 'hidden' },
  bar: { height: 5, borderRadius: 999, backgroundColor: colors.softBrown },
  list: { gap: 6 },
  item: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' },
  bullet: { width: 5, height: 5, borderRadius: 999, backgroundColor: colors.sand, marginTop: 7 },
  button: { alignSelf: 'flex-start' },
});
