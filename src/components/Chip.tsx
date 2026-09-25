import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { TOUCH_TARGET, colors, fonts, radius, spacing } from '../theme';
import { Typography } from './Typography';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  /** Static (non-interactive) chip, e.g. attribute tags on detail screens. */
  static?: boolean;
  tone?: 'default' | 'outline' | 'success';
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

/** Filter / selection chip. Active = ink, inactive = surfaceAlt. */
export function Chip({
  label,
  selected = false,
  onPress,
  icon: Icon,
  static: isStatic,
  tone = 'default',
  size = 'md',
  style,
  accessibilityHint,
}: ChipProps) {
  const bg = selected ? colors.ink : tone === 'outline' ? colors.surface : tone === 'success' ? colors.successBg : colors.surfaceAlt;
  const fg = selected ? colors.surface : tone === 'success' ? colors.success : colors.text;
  const content = (
    <View style={styles.row}>
      {Icon ? <Icon size={14} color={fg} strokeWidth={1.5} /> : null}
      <Typography style={[styles.label, size === 'sm' && styles.labelSm, { color: fg }]} numberOfLines={1}>
        {label}
      </Typography>
    </View>
  );
  const chipStyle = [
    styles.chip,
    size === 'sm' ? styles.sm : styles.md,
    { backgroundColor: bg },
    tone === 'outline' && !selected && styles.outline,
    style,
  ];

  if (isStatic || !onPress) {
    return (
      <View style={chipStyle} accessibilityLabel={label}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={size === 'sm' ? 8 : 4}
      style={({ pressed }) => [...chipStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  md: { minHeight: 38 },
  sm: { minHeight: 30, paddingHorizontal: spacing.sm },
  outline: { borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 18 },
  labelSm: { fontSize: 12, lineHeight: 16 },
  pressed: { opacity: 0.8 },
});

export const CHIP_MIN_TOUCH = TOUCH_TARGET;
