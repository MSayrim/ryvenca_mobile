import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { TOUCH_TARGET, colors, fonts, radius, spacing } from '../theme';
import { Typography } from './Typography';

interface BaseButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'sm';
  accessibilityHint?: string;
  fullWidth?: boolean;
}

function ButtonBase({
  label,
  onPress,
  disabled,
  loading,
  icon: Icon,
  iconRight: IconRight,
  style,
  size = 'md',
  accessibilityHint,
  fullWidth,
  background,
  foreground,
  borderColor,
}: BaseButtonProps & { background: string; foreground: string; borderColor?: string }) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: background },
        borderColor ? { borderWidth: 1, borderColor } : null,
        fullWidth && styles.fullWidth,
        disabled && !loading && styles.disabled,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon size={size === 'sm' ? 16 : 18} color={foreground} strokeWidth={1.5} /> : null}
          <Typography
            style={[styles.label, size === 'sm' && styles.labelSm, { color: foreground }]}
            numberOfLines={1}
          >
            {label}
          </Typography>
          {IconRight ? <IconRight size={size === 'sm' ? 16 : 18} color={foreground} strokeWidth={1.5} /> : null}
        </View>
      )}
    </Pressable>
  );
}

/** Ink pill — primary action. */
export function PrimaryButton(props: BaseButtonProps) {
  return <ButtonBase {...props} background={colors.ink} foreground={colors.surface} />;
}

/** surfaceAlt pill — secondary action. */
export function SecondaryButton(props: BaseButtonProps) {
  return <ButtonBase {...props} background={colors.surfaceAlt} foreground={colors.ink} />;
}

/** Hairline outlined pill — tertiary. */
export function OutlineButton(props: BaseButtonProps & { danger?: boolean }) {
  const fg = props.danger ? colors.danger : colors.ink;
  return <ButtonBase {...props} background="transparent" foreground={fg} borderColor={props.danger ? colors.danger : colors.border} />;
}

export interface IconButtonProps {
  icon?: LucideIcon;
  /** Custom content instead of a lucide icon (e.g. the hanger). */
  children?: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  color?: string;
  background?: string;
  size?: number;
  iconSize?: number;
  disabled?: boolean;
  fill?: string;
  style?: StyleProp<ViewStyle>;
  selected?: boolean;
}

/** 44×44 round icon button (always labelled for screen readers). */
export function IconButton({
  icon: Icon,
  children,
  onPress,
  accessibilityLabel,
  color = colors.ink,
  background = 'transparent',
  size = TOUCH_TARGET,
  iconSize = 22,
  disabled,
  fill,
  style,
  selected,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, selected }}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, backgroundColor: background },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {Icon ? <Icon size={iconSize} color={color} strokeWidth={1.5} fill={fill ?? 'none'} /> : children}
    </Pressable>
  );
}

/** Inline text action, e.g. "Tümünü Gör →". */
export function TextLink({
  label,
  onPress,
  color = colors.ink,
  style,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.link, pressed && styles.pressed, style]}
    >
      <Typography variant="smallMedium" color={color}>
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  md: { minHeight: 50 },
  sm: { minHeight: TOUCH_TARGET, paddingHorizontal: spacing.md },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20 },
  labelSm: { fontSize: 13, lineHeight: 18 },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  iconButton: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  link: { minHeight: TOUCH_TARGET, justifyContent: 'center' },
});
