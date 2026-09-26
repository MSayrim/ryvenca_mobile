import { Eye, EyeOff } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { ApiError } from '../../api';
import { authErrorMessage } from '../../auth/firebase/errors';
import { IconButton, PrimaryButton, Segmented, TextField, Typography } from '../../components';
import { t as translate, useTranslation } from '../../i18n';
import { colors, radius, spacing } from '../../theme';

export type EmailMode = 'login' | 'register';

export interface EmailFormValues {
  displayName: string;
  email: string;
  password: string;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

interface FormErrors {
  displayName?: string;
  email?: string;
  password?: string;
}

function validate(mode: EmailMode, { displayName, email, password }: EmailFormValues): FormErrors {
  const errors: FormErrors = {};
  if (mode === 'register' && !displayName.trim()) errors.displayName = translate('auth.validation.nameRequired');
  if (!EMAIL_RE.test(email.trim())) errors.email = translate('auth.validation.emailInvalid');
  if (mode === 'register' && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = translate('auth.validation.passwordTooShort', { min: MIN_PASSWORD_LENGTH });
  }
  if (mode === 'login' && !password) errors.password = translate('auth.validation.passwordRequired');
  return errors;
}

/**
 * Sign in / create account form (name, e-mail, password) shared by the Firebase e-mail screen and the
 * legacy local fallback. The parent performs the request; `error` may be an ApiError (field errors are
 * shown inline) or an AuthFlowError (Firebase, localized).
 */
export function EmailPasswordForm({
  onSubmit,
  submitting,
  error,
  onModeChange,
  onForgotPassword,
}: {
  onSubmit: (mode: EmailMode, values: EmailFormValues) => void;
  submitting: boolean;
  error: unknown;
  /** Called when the user switches between sign in / create account (reset the parent's mutation). */
  onModeChange?: () => void;
  /** Shows "Forgot password" (Firebase only); receives the e-mail typed so far. */
  onForgotPassword?: (email: string) => void;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<EmailMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // Server-side field errors (legacy endpoints) → inline, next to the client-side ones.
  const server = error instanceof ApiError ? error.fieldErrors : {};
  const fieldError = (key: keyof FormErrors) => errors[key] ?? server[key];

  const submit = () => {
    const values = { displayName, email: email.trim(), password };
    const nextErrors = validate(mode, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(mode, { ...values, displayName: displayName.trim() });
  };

  const switchMode = (next: EmailMode) => {
    setMode(next);
    setErrors({});
    onModeChange?.();
  };

  return (
    <View style={styles.wrap}>
      <Segmented<EmailMode>
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
            error={fieldError('displayName')}
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
          error={fieldError('email')}
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
          error={fieldError('password')}
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
        {mode === 'login' && onForgotPassword ? (
          <Typography
            variant="smallMedium"
            color={colors.ink}
            style={[styles.underline, styles.forgot]}
            accessibilityRole="link"
            onPress={() => onForgotPassword(email.trim())}
          >
            {t('auth.email.forgot')}
          </Typography>
        ) : null}
      </View>

      {error ? <ErrorBox message={authErrorMessage(error)} /> : null}

      <PrimaryButton
        label={mode === 'register' ? t('auth.submit.register') : t('auth.submit.login')}
        onPress={submit}
        loading={submitting}
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
  );
}

export function ErrorBox({ title, message }: { title?: string; message: string }) {
  return (
    <View style={styles.errorBox} accessibilityRole="alert">
      {title ? (
        <Typography variant="smallMedium" color={colors.danger}>
          {title}
        </Typography>
      ) : null}
      <Typography variant="small" color={colors.danger}>
        {message}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  fields: { gap: spacing.md },
  eye: { marginEnd: -spacing.xs },
  errorBox: { backgroundColor: '#F6E6E2', borderRadius: radius.sm, padding: spacing.sm, gap: 2 },
  underline: { textDecorationLine: 'underline' },
  forgot: { alignSelf: 'flex-end', paddingVertical: spacing.xxs },
});
