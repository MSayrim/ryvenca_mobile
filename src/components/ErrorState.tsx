import { CloudOff } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { errorMessage } from '../api/errors';
import { useTranslation } from '../i18n';
import { colors, spacing } from '../theme';
import { SecondaryButton } from './Buttons';
import { Typography } from './Typography';

export function ErrorState({
  error,
  message,
  onRetry,
  title,
  compact = false,
  style,
}: {
  error: unknown;
  /** Overrides the message derived from `error`. */
  message?: string | null;
  onRetry?: () => void;
  title?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  return (
    <View style={[styles.wrap, compact && styles.compact, style]} accessibilityRole="alert">
      {!compact ? <CloudOff size={36} color={colors.softBrown} strokeWidth={1.5} /> : null}
      <Typography variant={compact ? 'bodySemiBold' : 'h3'} align="center" style={styles.title}>
        {title ?? t('errors.title')}
      </Typography>
      <Typography variant="small" align="center" style={styles.text}>
        {message ?? errorMessage(error)}
      </Typography>
      {onRetry ? <SecondaryButton label={t('common.retry')} size="sm" onPress={onRetry} style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.xl, gap: spacing.xs },
  compact: { padding: spacing.md },
  title: { marginTop: spacing.xs },
  text: { maxWidth: 300 },
  button: { marginTop: spacing.sm, minWidth: 140 },
});
