import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, api, errorMessage } from '../../api';
import type { AuthResponse } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import {
  FannedStack,
  IconButton,
  LanguageButton,
  PrimaryButton,
  Segmented,
  TextField,
  Typography,
  Wordmark,
} from '../../components';
import { t as translate, useTranslation } from '../../i18n';
import { colors, radius, spacing } from '../../theme';

type Mode = 'login' | 'register';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

interface FormErrors {
  displayName?: string;
  email?: string;
  password?: string;
}

function validate(mode: Mode, displayName: string, email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (mode === 'register' && !displayName.trim()) errors.displayName = translate('auth.validation.nameRequired');
  if (!EMAIL_RE.test(email.trim())) errors.email = translate('auth.validation.emailInvalid');
  if (mode === 'register' && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = translate('auth.validation.passwordTooShort', { min: MIN_PASSWORD_LENGTH });
  }
  if (mode === 'login' && !password) errors.password = translate('auth.validation.passwordRequired');
  return errors;
}

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { signIn } = useSession();
  const [mode, setMode] = useState<Mode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const mutation = useMutation<AuthResponse, unknown, void>({
    mutationFn: () =>
      mode === 'register'
        ? api.register({ email: email.trim(), password, displayName: displayName.trim() })
        : api.login({ email: email.trim(), password }),
    onSuccess: (auth) => signIn(auth),
    onError: (error) => {
      if (error instanceof ApiError) {
        setErrors({
          displayName: error.fieldErrors.displayName,
          email: error.fieldErrors.email,
          password: error.fieldErrors.password,
        });
      }
    },
  });

  const submit = () => {
    const nextErrors = validate(mode, displayName, email, password);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) mutation.mutate();
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    mutation.reset();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
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

        <View style={styles.card}>
          <Segmented<Mode>
            options={[
              { value: 'login', label: t('auth.modes.login') },
              { value: 'register', label: t('auth.modes.register') },
            ]}
            value={mode}
            onChange={switchMode}
          />

          <View style={styles.fields}>
            {mode === 'register' ? (
              <TextField
                label={t('auth.fields.nameLabel')}
                placeholder={t('auth.fields.namePlaceholder')}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                error={errors.displayName}
              />
            ) : null}
            <TextField
              ref={emailRef}
              label={t('auth.fields.emailLabel')}
              placeholder={t('auth.fields.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.email}
            />
            <TextField
              ref={passwordRef}
              label={t('auth.fields.passwordLabel')}
              placeholder={
                mode === 'register'
                  ? t('auth.fields.passwordPlaceholderRegister', { min: MIN_PASSWORD_LENGTH })
                  : t('auth.fields.passwordPlaceholderLogin')
              }
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              textContentType={mode === 'register' ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={submit}
              error={errors.password}
              right={
                <IconButton
                  icon={showPassword ? EyeOff : Eye}
                  iconSize={20}
                  color={colors.textSecondary}
                  accessibilityLabel={showPassword ? t('auth.fields.hidePassword') : t('auth.fields.showPassword')}
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eye}
                />
              }
            />
          </View>

          {mutation.isError ? (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Typography variant="small" color={colors.danger}>
                {errorMessage(mutation.error)}
              </Typography>
            </View>
          ) : null}

          <PrimaryButton
            label={mode === 'register' ? t('auth.submit.register') : t('auth.submit.login')}
            onPress={submit}
            loading={mutation.isPending}
            fullWidth
          />
          <Typography variant="small" align="center">
            {mode === 'login' ? t('auth.switch.noAccount') : t('auth.switch.hasAccount')}{' '}
            <Typography
              variant="smallMedium"
              color={colors.ink}
              onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
              accessibilityRole="link"
              style={styles.underline}
            >
              {mode === 'login' ? t('auth.switch.toRegister') : t('auth.switch.toLogin')}
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl, flexGrow: 1, maxWidth: 520, width: '100%', alignSelf: 'center' },
  language: { marginBottom: -spacing.md },
  hero: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  heroText: { flex: 1, gap: spacing.xs },
  tagline: { marginTop: 2 },
  headline: { marginTop: spacing.md, fontSize: 30, lineHeight: 35 },
  heroArt: { marginTop: spacing.xxl, opacity: 0.95 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  fields: { gap: spacing.md },
  eye: { marginEnd: -spacing.xs },
  errorBox: { backgroundColor: '#F6E6E2', borderRadius: radius.sm, padding: spacing.sm },
  underline: { textDecorationLine: 'underline' },
  script: { marginTop: 'auto' },
});
