import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius } from '../theme';
import { Typography } from './Typography';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/** Small segmented control (e.g. season selector, favorites tabs). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
  size = 'md',
}: {
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'sm';
}) {
  return (
    <View style={[styles.wrap, style]} accessibilityRole="tablist">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            style={[styles.item, size === 'sm' && styles.itemSm, active && styles.active]}
          >
            <Typography
              numberOfLines={1}
              style={[styles.label, size === 'sm' && styles.labelSm, { color: active ? colors.ink : colors.textSecondary }, active && styles.labelActive]}
            >
              {opt.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 3,
  },
  item: { flex: 1, minHeight: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  itemSm: { minHeight: 34 },
  active: {
    backgroundColor: colors.surface,
    shadowColor: '#2A201B',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 17 },
  labelSm: { fontSize: 12 },
  labelActive: { fontFamily: fonts.bodySemiBold },
});
