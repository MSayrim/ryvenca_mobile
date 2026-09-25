import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing } from '../theme';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { HangerIllustration } from './HangerIllustration';
import { Typography } from './Typography';

export function EmptyState({
  title,
  text,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  illustration,
  style,
}: {
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  illustration?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.wrap, style]}>
      {illustration ?? <HangerIllustration size={128} />}
      <Typography variant="h2" align="center" style={styles.title}>
        {title}
      </Typography>
      {text ? (
        <Typography variant="body" color={colors.textSecondary} align="center" style={styles.text}>
          {text}
        </Typography>
      ) : null}
      {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} style={styles.button} /> : null}
      {secondaryLabel && onSecondary ? (
        <SecondaryButton label={secondaryLabel} onPress={onSecondary} style={styles.secondary} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  title: { marginTop: spacing.md },
  text: { marginTop: spacing.xs, maxWidth: 320 },
  button: { marginTop: spacing.xl, minWidth: 200 },
  secondary: { marginTop: spacing.sm, minWidth: 200 },
});
