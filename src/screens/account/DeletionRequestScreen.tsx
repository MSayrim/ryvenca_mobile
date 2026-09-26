import { CircleCheck, ExternalLink } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '../../api';
import { useAppConfig } from '../../appConfig/useAppConfig';
import { OutlineButton, PrimaryButton, ScreenHeader, TextField, Typography } from '../../components';
import { useDeletionRequest } from '../../hooks/mutations';
import { useTranslation } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, fonts, radius, spacing } from '../../theme';
import { openLink } from '../../utils/openLink';
import { EMAIL_RE, ErrorBox } from '../auth/EmailPasswordForm';

/**
 * "Can't access your account?" — public deletion request (`POST /api/account-deletion-requests`,
 * reviewed in the admin panel). Required by Google Play next to the in-app deletion.
 */
export function DeletionRequestScreen({ navigation, route }: RootScreenProps<'DeletionRequest'>) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { links } = useAppConfig();
  const mutation = useDeletionRequest();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const submit = () => {
    const address = email.trim();
    if (!EMAIL_RE.test(address)) {
      setEmailError(t('auth.validation.emailInvalid'));
      return;
    }
    setEmailError(null);
    mutation.mutate({ email: address, message: message.trim() || null });
  };

  const webPage = links.accountDeletion ? (
    <OutlineButton
      label={t('deletionRequest.webPage')}
      iconEnd={ExternalLink}
      onPress={() => links.accountDeletion && void openLink(links.accountDeletion)}
      fullWidth
    />
  ) : null;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={t('deletionRequest.title')} onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {mutation.isSuccess ? (
          <View style={[styles.card, styles.center]} accessibilityLiveRegion="polite">
            <CircleCheck size={36} color={colors.success} strokeWidth={1.5} />
            <Typography variant="h2" align="center">
              {t('deletionRequest.sentTitle')}
            </Typography>
            <Typography variant="body" align="center" color={colors.textSecondary}>
              {t('deletionRequest.sentMessage')}
            </Typography>
            <View
              style={styles.reference}
              accessible
              accessibilityLabel={t('deletionRequest.referenceA11y', { reference: mutation.data.reference })}
            >
              <Typography style={styles.referenceText} selectable>
                {mutation.data.reference}
              </Typography>
            </View>
            <PrimaryButton label={t('common.close')} onPress={() => navigation.goBack()} fullWidth />
          </View>
        ) : (
          <View style={styles.card}>
            <Typography variant="body" color={colors.textSecondary}>
              {t('deletionRequest.intro')}
            </Typography>
            <TextField
              label={t('auth.fields.emailLabel')}
              placeholder={t('auth.fields.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              error={emailError}
            />
            <TextField
              label={t('deletionRequest.messageLabel')}
              placeholder={t('deletionRequest.messagePlaceholder')}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
              style={styles.multiline}
            />
            {mutation.isError ? <ErrorBox message={errorMessage(mutation.error)} /> : null}
            <PrimaryButton label={t('deletionRequest.submit')} onPress={submit} loading={mutation.isPending} fullWidth />
          </View>
        )}
        {webPage}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, maxWidth: 560, width: '100%', alignSelf: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  center: { alignItems: 'center' },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  reference: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  referenceText: { fontFamily: fonts.bodySemiBold, fontSize: 22, lineHeight: 28, letterSpacing: 2, color: colors.ink },
});
