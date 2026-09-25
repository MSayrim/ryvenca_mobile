import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from '../theme';
import { IconButton } from './Buttons';
import { Typography } from './Typography';

/** Stack screen header: back · title · optional right actions. */
export function ScreenHeader({
  title,
  onBack,
  right,
  transparent = false,
}: {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 2 }, transparent && styles.transparent]}>
      <View style={styles.side}>
        {onBack ? <IconButton icon={ChevronLeft} iconSize={26} accessibilityLabel="Geri" onPress={onBack} /> : null}
      </View>
      <Typography style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title ?? ''}
      </Typography>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxs,
    paddingBottom: spacing.xxs,
    backgroundColor: colors.background,
  },
  transparent: { backgroundColor: 'transparent' },
  side: { minWidth: 92, flexDirection: 'row', alignItems: 'center' },
  right: { justifyContent: 'flex-end' },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.display, fontSize: 18, lineHeight: 23, color: colors.ink },
});
