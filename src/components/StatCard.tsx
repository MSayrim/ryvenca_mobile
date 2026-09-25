import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { Typography } from './Typography';

/** Stat card: icon, big Fraunces number, label. */
export function StatCard({ icon, value, label, onPress }: { icon: ReactNode; value: number | string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>{icon}</View>
      <Typography variant="number">{value}</Typography>
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
