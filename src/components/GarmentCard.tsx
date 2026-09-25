import { Heart } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Garment } from '../api/types';
import { useMeta } from '../hooks/useMeta';
import { useToggleGarmentFavorite } from '../hooks/mutations';
import { colors, radius, spacing } from '../theme';
import { GarmentPhoto } from './GarmentPhoto';
import { Typography } from './Typography';

/** Wardrobe grid card: 4:5 photo, color dot, favorite toggle, name, "subcategory · color". */
export function GarmentCard({
  garment,
  onPress,
  style,
}: {
  garment: Garment;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { labels } = useMeta();
  const favorite = useToggleGarmentFavorite();
  const subtitle = `${labels.subcategory(garment.subcategory, garment.category)} · ${labels.color(garment.color)}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${garment.displayName}, ${subtitle}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <View>
        <GarmentPhoto uri={garment.thumbnailUrl} colorHex={garment.colorHex} />
        <Pressable
          onPress={() => favorite.mutate(garment)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={garment.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          accessibilityState={{ selected: garment.favorite }}
          style={styles.heart}
        >
          <Heart
            size={18}
            strokeWidth={1.5}
            color={garment.favorite ? colors.danger : colors.ink}
            fill={garment.favorite ? colors.danger : 'none'}
          />
        </Pressable>
      </View>
      <Typography variant="bodyMedium" numberOfLines={1} style={styles.name}>
        {garment.displayName}
      </Typography>
      <Typography variant="small" numberOfLines={1}>
        {subtitle}
      </Typography>
    </Pressable>
  );
}

/** Small square-ish thumbnail used in horizontal rows. */
export function GarmentThumb({
  garment,
  onPress,
  width = 104,
  children,
  showName = true,
}: {
  garment: Garment;
  onPress: () => void;
  width?: number;
  children?: ReactNode;
  showName?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={garment.displayName}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
    >
      <View>
        <GarmentPhoto uri={garment.thumbnailUrl} colorHex={garment.colorHex} radius={radius.md} placeholderIconSize={22} />
        {children}
      </View>
      {showName ? (
        <Typography variant="small" color={colors.text} numberOfLines={1} style={styles.thumbName}>
          {garment.displayName}
        </Typography>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  pressed: { opacity: 0.88 },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(255,253,249,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginTop: spacing.xs },
  thumbName: { marginTop: 6 },
});
