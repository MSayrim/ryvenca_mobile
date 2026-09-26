import { useMutation } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authErrorMessage } from '../../auth/firebase/errors';
import { createAccountWithEmail, sendPasswordReset, signInWithEmail } from '../../auth/firebase/firebaseAuth';
import { useFirebaseSignIn } from '../../auth/useFirebaseSignIn';
import { PrimaryButton, ScreenHeader, TextField, Typography } from '../../components';
import { useTranslation } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { EMAIL_RE, EmailPasswordForm, ErrorBox } from './EmailPasswordForm';

/** Firebase e-mail + password: sign in, create account (+ verification e-mail), forgot password. */
export function EmailAuthScreen({ navigation }: RootScreenProps<'EmailAuth'>) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const signIn = useFirebaseSignIn();
  const [resetEmail, setResetEmail] = useState<string | null>(null);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        title={resetEmail !== null ? t('auth.email.resetTitle') : t('auth.email.title')}
        onBack={() => (resetEmail !== null ? setResetEmail(null) : navigation.goBack())}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {resetEmail !== null ? (
            <PasswordReset initialEmail={resetEmail} onDone={() => setResetEmail(null)} />
          ) : (
            <EmailPasswordForm
              onSubmit={(mode, values) =>
                signIn.mutate(() =>
                  mode === 'register'
                    ? createAccountWithEmail(values.email, values.password, values.displayName)
                    : signInWithEmail(values.email, values.password),
                )
              }
              submitting={signIn.isPending}
              error={signIn.error}
              onModeChange={() => signIn.reset()}
              onForgotPassword={(email) => {
                signIn.reset();
                setResetEmail(email);
              }}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordReset({ initialEmail, onDone }: { initialEmail: string; onDone: () => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: (address: string) => sendPasswordReset(address) });

  const submit = () => {
    const address = email.trim();
    if (!EMAIL_RE.test(address)) {
      setFieldError(t('auth.validation.emailInvalid'));
      return;
    }
    setFieldError(null);
    mutation.mutate(address);
  };

  if (mutation.isSuccess) {
    return (
      <View style={styles.sent} accessibilityLiveRegion="polite">
        <MailCheck size={32} color={colors.success} strokeWidth={1.5} />
        <Typography variant="body" align="center">
          {t('auth.email.resetSent', { email: mutation.variables })}
        </Typography>
        <PrimaryButton label={t('auth.email.backToSignIn')} onPress={onDone} fullWidth />
      </View>
    );
  }

  return (
    <View style={styles.reset}>
      <Typography variant="body" color={colors.textSecondary}>
        {t('auth.email.resetIntro')}
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
        returnKeyType="send"
        onSubmitEditing={submit}
        error={fieldError}
      />
      {mutation.isError ? <ErrorBox message={authErrorMessage(mutation.error)} /> : null}
      <PrimaryButton label={t('auth.email.resetSubmit')} onPress={submit} loading={mutation.isPending} fullWidth />
      <Typography
        variant="smallMedium"
        align="center"
        color={colors.ink}
        style={styles.underline}
        accessibilityRole="link"
        onPress={onDone}
      >
        {t('auth.email.backToSignIn')}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  reset: { gap: spacing.lg },
  sent: { gap: spacing.md, alignItems: 'center' },
  underline: { textDecorationLine: 'underline' },
});
