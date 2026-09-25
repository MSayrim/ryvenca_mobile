import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Category, Garment } from '../../api/types';
import { ErrorState, Screen, ScreenHeader, Skeleton, Typography } from '../../components';
import { useGarments } from '../../hooks/queries';
import { useMeta } from '../../hooks/useMeta';
import type { RootScreenProps } from '../../navigation/types';
import { TOUCH_TARGET, colors, radius, spacing } from '../../theme';

const ALL = {} as const;

export function countByCategory(garments: readonly Garment[]): Partial<Record<Category, number>> {
  const counts: Partial<Record<Category, number>> = {};
  for (const g of garments) counts[g.category] = (counts[g.category] ?? 0) + 1;
  return counts;
}

/** "Dolap istatistikleri": counts per category (computed from GET /api/garments). */
export function WardrobeStatsScreen({ navigation }: RootScreenProps<'WardrobeStats'>) {
  const { meta } = useMeta();
  const garments = useGarments(ALL);
  const counts = useMemo(() => countByCategory(garments.data ?? []), [garments.data]);
  const total = garments.data?.length ?? 0;
  const max = Math.max(1, ...Object.values(counts).map((n) => n ?? 0));
  const favorites = (garments.data ?? []).filter((g) => g.favorite).length;

  return (
    <Screen>
      <ScreenHeader title="Dolap İstatistikleri" onBack={() => navigation.goBack()} />
      {garments.isLoading ? (
        <View style={styles.content}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={44} />
          ))}
        </View>
      ) : garments.isError ? (
        <ErrorState error={garments.error} onRetry={() => void garments.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.totals}>
            <View style={styles.total}>
              <Typography variant="display">{total}</Typography>
              <Typography variant="small">Toplam parça</Typography>
            </View>
            <View style={styles.total}>
              <Typography variant="display">{favorites}</Typography>
              <Typography variant="small">Favori parça</Typography>
            </View>
          </View>
          <View style={styles.card}>
            {(meta?.categories ?? []).map((c) => {
              const n = counts[c.code] ?? 0;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => navigation.navigate('Main', { screen: 'Wardrobe', params: { category: c.code, nonce: Date.now() } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.pluralLabel}: ${n}`}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                  <View style={styles.rowHead}>
                    <Typography variant="bodyMedium">{c.pluralLabel}</Typography>
                    <Typography variant="bodySemiBold" color={colors.ink}>
                      {n}
                    </Typography>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.bar, { width: `${(n / max) * 100}%` }]} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 720, width: '100%', alignSelf: 'center' },
  totals: { flexDirection: 'row', gap: spacing.sm },
  total: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  row: { minHeight: TOUCH_TARGET + 4, justifyContent: 'center', gap: 6 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 5, borderRadius: 999, backgroundColor: colors.cream, overflow: 'hidden' },
  bar: { height: 5, borderRadius: 999, backgroundColor: colors.softBrown },
  pressed: { opacity: 0.7 },
});
