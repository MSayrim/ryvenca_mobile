import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFormatters, useTranslation } from '../i18n';
import { colors, radius, spacing } from '../theme';
import { Typography } from './Typography';

/** Stat card: icon, big Fraunces number, label. */
export function StatCard({ icon, value, label, onPress }: { icon: ReactNode; value: number; label: string; onPress: () => void }) {
  const { t } = useTranslation();
  const format = useFormatters();
  const display = format.number(value);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('home.stats.a11y', { label, value: display })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>{icon}</View>
      <Typography variant="number">{display}</Typography>
      <Typography variant="small" numberOfLines={1}>
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: 2,
    minHeight: 100,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
