import { Image, type ImageStyle } from 'expo-image';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { API_BASE_URL } from '../config';
import { colors, radius as radii } from '../theme';
import { resolveMediaUrl } from '../utils/media';
import { ColorDot } from './ColorDot';
import { HangerIcon } from './HangerIcon';

export interface GarmentPhotoProps {
  uri: string | null | undefined;
  /** width / height. Default 4:5 (garment cards). Ignored when `fill` is true. */
  aspectRatio?: number;
  /** Stretch to the parent (for collage tiles with explicit sizes). */
  fill?: boolean;
  radius?: number;
  bordered?: boolean;
  /** Garment colorHex → small dot with a white ring in the corner. */
  colorHex?: string | null;
  dotPosition?: 'bottomStart' | 'topStart' | 'bottomEnd';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  priority?: 'low' | 'normal' | 'high';
  placeholderIconSize?: number;
}

/**
 * Harmonized garment photo (see spec "heterogeneous real photos"):
 * fixed-ratio frame, cover crop, hairline border, cream placeholder with hanger (no layout shift),
 * and a subtle unified warm grade so photos from different rooms read as one set.
 */
export function GarmentPhoto({
  uri,
  aspectRatio = 4 / 5,
  fill = false,
  radius = radii.md,
  bordered = true,
  colorHex,
  dotPosition = 'bottomStart',
  style,
  accessibilityLabel,
  priority = 'normal',
  placeholderIconSize,
}: GarmentPhotoProps) {
  const source = uri && (uri.startsWith('file:') || uri.startsWith('blob:') || uri.startsWith('data:'))
    ? uri
    : resolveMediaUrl(uri, API_BASE_URL);

  return (
    <View
      style={[
        styles.frame,
        fill ? StyleSheet.absoluteFill : { aspectRatio },
        { borderRadius: radius },
        bordered && styles.border,
        style,
      ]}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.placeholder} pointerEvents="none">
        <HangerIcon size={placeholderIconSize ?? 28} color={colors.sand} />
      </View>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[StyleSheet.absoluteFill, webGrade]}
          contentFit="cover"
          transition={220}
          priority={priority}
          cachePolicy="memory-disk"
          recyclingKey={source}
        />
      ) : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.warmGrade]} />
      {colorHex ? (
        <View style={[styles.dot, dotStyles[dotPosition]]} pointerEvents="none">
          <ColorDot hex={colorHex} size={12} />
        </View>
      ) : null}
    </View>
  );
}

// Web supports CSS filters; native relies on the multiply overlay only.
const webGrade: ImageStyle | null =
  Platform.OS === 'web' ? ({ filter: 'saturate(0.94) contrast(1.02)' } as unknown as ImageStyle) : null;

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.cream,
  },
  border: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  warmGrade: {
    backgroundColor: colors.warmGrade,
    mixBlendMode: 'multiply',
  },
  dot: { position: 'absolute' },
});

const dotStyles = StyleSheet.create({
  bottomStart: { start: 8, bottom: 8 },
  topStart: { start: 8, top: 8 },
  bottomEnd: { end: 8, bottom: 8 },
});
