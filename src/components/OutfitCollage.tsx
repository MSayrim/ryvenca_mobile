import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import type { OutfitItem } from '../api/types';
import { colors, radius } from '../theme';
import { computeCollageLayout } from '../utils/collageLayout';
import { GarmentPhoto } from './GarmentPhoto';

export interface OutfitCollageProps {
  items: OutfitItem[];
  /** height / width of the whole collage (default 1.1 — slightly tall). */
  heightRatio?: number;
  gap?: number;
  onPressItem?: (item: OutfitItem) => void;
  style?: StyleProp<ViewStyle>;
  /** Use full-size images instead of thumbnails (detail screen). */
  highRes?: boolean;
  /** Show color dots on tiles. */
  showColorDots?: boolean;
}

/**
 * Editorial "mood board" of 1–7 outfit items: hero (OUTERWEAR › DRESS › TOP) on the left ~60%,
 * remaining pieces stacked on the right, and a second row under the hero block for 5+ items.
 * The frame reserves its height via aspectRatio, so there is no layout shift while measuring.
 */
export function OutfitCollage({
  items,
  heightRatio = 1.1,
  gap = 5,
  onPressItem,
  style,
  highRes = false,
  showColorDots = false,
}: OutfitCollageProps) {
  const [width, setWidth] = useState(0);
  const height = width * heightRatio;
  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  const rects = width > 0 ? computeCollageLayout(items.map((i) => i.role), { width, height, gap }) : [];

  return (
    <View
      onLayout={onLayout}
      style={[styles.frame, { aspectRatio: 1 / heightRatio }, style]}
      accessibilityLabel={`Kombin kolajı, ${items.length} parça`}
    >
      {rects.map((rect) => {
        const item = items[rect.index];
        if (!item) return null;
        const g = item.garment;
        const tile = (
          <GarmentPhoto
            uri={highRes || rect.isHero ? g.imageUrl : g.thumbnailUrl}
            fill
            radius={radius.sm}
            bordered={false}
            colorHex={showColorDots ? g.colorHex : undefined}
            placeholderIconSize={rect.isHero ? 30 : 20}
            priority={rect.isHero ? 'high' : 'normal'}
          />
        );
        const pos = { left: rect.x, top: rect.y, width: rect.width, height: rect.height };
        return onPressItem ? (
          <Pressable
            key={`${g.id}-${rect.index}`}
            style={({ pressed }) => [styles.tile, pos, pressed && styles.pressed]}
            onPress={() => onPressItem(item)}
            accessibilityRole="button"
            accessibilityLabel={g.displayName}
          >
            {tile}
          </Pressable>
        ) : (
          <View key={`${g.id}-${rect.index}`} style={[styles.tile, pos]} accessibilityLabel={g.displayName}>
            {tile}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tile: { position: 'absolute', borderRadius: radius.sm, overflow: 'hidden' },
  pressed: { opacity: 0.85 },
});
