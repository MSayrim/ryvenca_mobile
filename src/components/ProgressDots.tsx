import { StyleSheet, View } from 'react-native';

import { useTranslation } from '../i18n';
import { colors } from '../theme';

export function ProgressDots({ count, index }: { count: number; index: number }) {
  const { t } = useTranslation();
  return (
    <View
      style={styles.row}
      accessibilityLabel={t('onboarding.stepProgressA11y', { current: index + 1, total: count })}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, i === index && styles.active, i < index && styles.done]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.beige },
  active: { width: 24, backgroundColor: colors.ink },
  done: { backgroundColor: colors.softBrown },
});
