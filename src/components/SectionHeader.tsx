import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '../theme';
import { TextLink } from './Buttons';
import { Typography } from './Typography';

export function SectionHeader({
  title,
  eyebrow,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titles}>
        {eyebrow ? <Typography variant="eyebrow">{eyebrow}</Typography> : null}
        <Typography variant="h2" accessibilityRole="header">
          {title}
        </Typography>
      </View>
      {actionLabel && onAction ? <TextLink label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  titles: { flexShrink: 1, gap: 2 },
});
