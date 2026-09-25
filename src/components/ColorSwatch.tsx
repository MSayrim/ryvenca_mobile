import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { Typography } from './Typography';

export interface ColorSwatchProps {
  hex: string;
  label: string;
  selected?: boolean;
  onPress?: () => void;
  size?: number;
  /** Always show the label (otherwise only under the selected swatch). */
  showLabel?: boolean;
  /** Small marker for detection candidates. */
  hinted?: boolean;
}

function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return true;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

/** Circular color swatch with a ring when selected; label under selected. */
export function ColorSwatch({ hex, label, selected = false, onPress, size = 34, showLabel = false, hinted = false }: ColorSwatchProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      hitSlop={4}
      style={styles.wrap}
    >
      <View
        style={[
          styles.ring,
          { width: size + 10, height: size + 10 },
          selected && styles.ringSelected,
        ]}
      >
        <View
          style={[
            styles.swatch,
            { width: size, height: size, backgroundColor: hex },
            isLight(hex) && styles.lightBorder,
          ]}
        >
          {selected ? <Check size={16} strokeWidth={2} color={isLight(hex) ? colors.ink : colors.white} /> : null}
        </View>
        {hinted && !selected ? <View style={styles.hint} /> : null}
      </View>
      {selected || showLabel ? (
        <Typography variant="caption" color={selected ? colors.ink : colors.textMuted} numberOfLines={1} style={styles.label}>
          {label}
        </Typography>
      ) : (
        <View style={styles.labelSpacer} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', minWidth: 48 },
  ring: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  ringSelected: { borderColor: colors.ink },
  swatch: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  lightBorder: { borderWidth: 1, borderColor: colors.border },
  hint: {
    position: 'absolute',
    top: 1,
    end: 1,
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.softBrown,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  label: { marginTop: 3, maxWidth: 64 },
  labelSpacer: { height: 17 },
});
