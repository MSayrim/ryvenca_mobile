import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius as radii, spacing } from '../theme';

/** Cream shimmer block used as a loading skeleton. */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = radii.sm,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [opacity] = useState(() => new Animated.Value(0.55));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.cream, opacity }, style]}
    />
  );
}

export function GarmentGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.cell}>
          <Skeleton height={undefined} style={styles.photo} radius={radii.md} />
          <Skeleton width="70%" height={14} style={styles.line} />
          <Skeleton width="45%" height={11} style={styles.line} />
        </View>
      ))}
    </View>
  );
}

export function OutfitCardSkeleton({ width }: { width?: number }) {
  return (
    <View style={[styles.outfit, width ? { width } : null]}>
      <Skeleton height={undefined} radius={radii.lg} style={styles.collage} />
      <Skeleton width="60%" height={18} style={styles.line} />
      <Skeleton width="90%" height={12} style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.md },
  cell: { width: '47%', flexGrow: 1 },
  photo: { aspectRatio: 4 / 5 },
  line: { marginTop: spacing.xs },
  outfit: { gap: 0 },
  collage: { aspectRatio: 1 },
});
