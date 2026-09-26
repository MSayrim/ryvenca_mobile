import { useMutation } from '@tanstack/react-query';
import { Mail, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '../../api';
import type { AuthResponse } from '../../api/types';
import { useAppConfig, useAuthOptions } from '../../appConfig/useAppConfig';
import { authErrorMessage } from '../../auth/firebase/errors';
import { signInWithApple, signInWithGoogle } from '../../auth/firebase/firebaseAuth';
import { useSession } from '../../auth/SessionProvider';
import { useFirebaseSignIn } from '../../auth/useFirebaseSignIn';
import {
  FannedStack,
  IconButton,
  LanguageButton,
  LegalLinks,
  OutlineButton,
  Typography,
  Wordmark,
} from '../../components';
import { useTranslation } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { AppleSignInButton } from './AppleSignInButton';
import { EmailPasswordForm, ErrorBox, type EmailFormValues, type EmailMode } from './EmailPasswordForm';
import { GoogleSignInButton } from './GoogleSignInButton';

type Pending = 'apple' | 'google' | null;

/**
 * Sign-in entry. Firebase builds show the enabled providers (Sign in with Apple on iOS, Google, e-mail);
 * builds/servers without Firebase fall back to the legacy local e-mail/password form (`config.auth.local`).
 */
export function AuthScreen({ navigation }: RootScreenProps<'Auth'>) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const config = useAppConfig();
  const options = useAuthOptions();
  const { notice, dismissNotice } = useSession();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <LanguageButton style={styles.language} />
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Wordmark size={26} align="start" />
            <Typography variant="eyebrow" style={styles.tagline}>
              {t('brand.tagline')}
            </Typography>
            <Typography variant="display" style={styles.headline}>
              {t('auth.headline')}
            </Typography>
          </View>
          <View style={styles.heroArt} pointerEvents="none">
            <FannedStack garments={[]} width={112} />
          </View>
        </View>

        {notice?.kind === 'disabled' ? (
          <View style={styles.notice}>
            <View style={styles.flex}>
              <ErrorBox title={t('auth.disabledTitle')} message={notice.message} />
            </View>
            <IconButton icon={X} iconSize={18} color={colors.danger} accessibilityLabel={t('common.close')} onPress={dismissNotice} />
          </View>
        ) : null}

        <View style={styles.card}>
          {options === null ? (
            <ActivityIndicator color={colors.ink} style={styles.loading} />
          ) : options.mode === 'firebase' ? (
            <ProviderButtons
              apple={options.apple}
              google={options.google}
              email={options.email}
              onEmail={() => navigation.navigate('EmailAuth')}
            />
          ) : options.mode === 'local' ? (
            <LocalSignIn />
          ) : (
            <View style={styles.unavailable} accessibilityRole="alert">
              <Typography variant="h3">{t('auth.unavailable.title')}</Typography>
              <Typography variant="small">{t('auth.unavailable.message')}</Typography>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {config.links.terms || config.links.privacyPolicy ? (
            <Typography variant="caption" align="center" color={colors.textMuted}>
              {t('auth.agreement')}
            </Typography>
          ) : null}
          <LegalLinks links={config.links} />
          <Typography variant="small" align="center" color={colors.textSecondary}>
            {t('auth.cantAccess')}{' '}
            <Typography
              variant="smallMedium"
              color={colors.ink}
              style={styles.underline}
              accessibilityRole="link"
              onPress={() => navigation.navigate('DeletionRequest')}
            >
              {t('auth.cantAccessAction')}
            </Typography>
          </Typography>
        </View>

        <Typography variant="script" align="center" style={styles.script}>
          {t('accents.sameYouBetterOutfits')}
        </Typography>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProviderButtons({
  apple,
  google,
  email,
  onEmail,
}: {
  apple: boolean;
  google: boolean;
  email: boolean;
  onEmail: () => void;
}) {
  const { t } = useTranslation();
  const signIn = useFirebaseSignIn();
  const [pending, setPending] = useState<Pending>(null);

  const run = (provider: Exclude<Pending, null>, flow: typeof signInWithApple) => {
    setPending(provider);
    signIn.mutate(flow, { onSettled: () => setPending(null) });
  };

  const busy = signIn.isPending;

  return (
    <View style={styles.providers}>
      <Typography variant="body" color={colors.textSecondary}>
        {t('auth.intro')}
      </Typography>
      {apple ? (
        <AppleSignInButton onPress={() => run('apple', signInWithApple)} loading={pending === 'apple'} disabled={busy} />
      ) : null}
      {google ? (
        <GoogleSignInButton
          label={t('auth.providers.google')}
          onPress={() => run('google', signInWithGoogle)}
          loading={pending === 'google'}
          disabled={busy}
        />
      ) : null}
      {email && (apple || google) ? (
        <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.rule} />
          <Typography variant="caption" color={colors.textMuted}>
            {t('auth.providers.or')}
          </Typography>
          <View style={styles.rule} />
        </View>
      ) : null}
      {email ? <OutlineButton label={t('auth.providers.email')} icon={Mail} onPress={onEmail} disabled={busy} fullWidth /> : null}
      {signIn.isError ? <ErrorBox message={authErrorMessage(signIn.error)} /> : null}
    </View>
  );
}

/** Legacy local e-mail/password (development / servers without Firebase). */
function LocalSignIn() {
  const { signIn } = useSession();
  const mutation = useMutation<AuthResponse, unknown, { mode: EmailMode; values: EmailFormValues }>({
    mutationFn: ({ mode, values }) =>
      mode === 'register'
        ? api.register({ email: values.email, password: values.password, displayName: values.displayName })
        : api.login({ email: values.email, password: values.password }),
    onSuccess: (auth) => signIn(auth),
  });

  return (
    <EmailPasswordForm
      onSubmit={(mode, values) => mutation.mutate({ mode, values })}
      submitting={mutation.isPending}
      error={mutation.error}
      onModeChange={() => mutation.reset()}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl, flexGrow: 1, maxWidth: 520, width: '100%', alignSelf: 'center' },
  language: { marginBottom: -spacing.md },
  hero: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  heroText: { flex: 1, gap: spacing.xs },
  tagline: { marginTop: 2 },
  headline: { marginTop: spacing.md, fontSize: 30, lineHeight: 35 },
  heroArt: { marginTop: spacing.xxl, opacity: 0.95 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xxs, marginBottom: -spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  loading: { paddingVertical: spacing.xl },
  providers: { gap: spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xxs },
  rule: { flex: 1, height: 1, backgroundColor: colors.divider },
  unavailable: { gap: spacing.xs },
  footer: { gap: spacing.sm, alignItems: 'center' },
  underline: { textDecorationLine: 'underline' },
  script: { marginTop: 'auto' },
});
