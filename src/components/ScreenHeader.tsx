import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '../i18n';
import { colors, fonts, spacing } from '../theme';
import { IconButton } from './Buttons';
import { Typography } from './Typography';
import { useDirection } from './useDirection';

/** Stack screen header: back (mirrored in RTL) · title · optional trailing actions. */
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
  const { t } = useTranslation();
  const { BackChevron } = useDirection();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 2 }, transparent && styles.transparent]}>
      <View style={styles.side}>
        {onBack ? <IconButton icon={BackChevron} iconSize={26} accessibilityLabel={t('common.back')} onPress={onBack} /> : null}
      </View>
      <Typography style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title ?? ''}
      </Typography>
      <View style={[styles.side, styles.end]}>{right}</View>
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
  end: { justifyContent: 'flex-end' },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.display, fontSize: 18, lineHeight: 23, color: colors.ink },
});
