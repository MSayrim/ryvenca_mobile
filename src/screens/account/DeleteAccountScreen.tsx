import { Check, Heart, Image as ImageIcon, Shirt, TriangleAlert, UserX, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '../../api';
import { useAppConfig } from '../../appConfig/useAppConfig';
import { AuthFlowError } from '../../auth/firebase/errors';
import { useCurrentUser } from '../../auth/SessionProvider';
import { ScreenHeader, TextField, TextLink, Typography } from '../../components';
import { useDeleteAccount } from '../../hooks/mutations';
import { useTranslation } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { TOUCH_TARGET, colors, fonts, radius, spacing } from '../../theme';
import { confirm } from '../../utils/confirm';
import { openLink } from '../../utils/openLink';
import { ErrorBox } from '../auth/EmailPasswordForm';

/**
 * In-app account deletion (App Store Review Guideline 5.1.1(v), Google Play account deletion policy):
 * explains what is deleted, optional reason, explicit confirmation (checkbox + final dialog), then
 * provider cleanup + `DELETE /api/me` + the "account deleted" screen.
 */
export function DeleteAccountScreen({ navigation }: RootScreenProps<'DeleteAccount'>) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { links } = useAppConfig();
  const deleteAccount = useDeleteAccount();
  const [reason, setReason] = useState('');
  const [understood, setUnderstood] = useState(false);

  const isApple = user.authProvider === 'APPLE';
  const isGoogle = user.authProvider === 'GOOGLE';

  const onDelete = async () => {
    const ok = await confirm({
      title: t('deleteAccount.confirmTitle'),
      message: t('deleteAccount.confirmMessage'),
      confirmText: t('deleteAccount.confirmAction'),
      destructive: true,
    });
    if (!ok) return;
    deleteAccount.mutate({ reason: reason.trim() || null });
  };

  const items: { icon: LucideIcon; label: string }[] = [
    { icon: ImageIcon, label: t('deleteAccount.items.photos') },
    { icon: Shirt, label: t('deleteAccount.items.garments') },
    { icon: Heart, label: t('deleteAccount.items.outfits') },
    { icon: UserX, label: t('deleteAccount.items.account') },
  ];

  const failure = deleteAccount.error;
  const failureMessage = failure instanceof AuthFlowError ? failure.message : failure ? errorMessage(failure) : null;
  const busy = deleteAccount.isPending;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={t('deleteAccount.title')} onBack={busy ? undefined : () => navigation.goBack()} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleBlock}>
          <Typography variant="h1">{t('deleteAccount.headline')}</Typography>
          <Typography variant="small" numberOfLines={1}>
            {user.email}
          </Typography>
        </View>

        <View style={styles.card}>
          <Typography variant="bodyMedium">{t('deleteAccount.intro')}</Typography>
          {items.map(({ icon: Icon, label }) => (
            <View key={label} style={styles.item}>
              <View style={styles.itemIcon}>
                <Icon size={18} color={colors.danger} strokeWidth={1.5} />
              </View>
              <Typography variant="body" style={styles.flexText}>
                {label}
              </Typography>
            </View>
          ))}
        </View>

        <View style={styles.warning} accessibilityRole="alert">
          <TriangleAlert size={20} color={colors.danger} strokeWidth={1.5} />
          <Typography variant="smallMedium" color={colors.danger} style={styles.flexText}>
            {t('deleteAccount.permanent')}
          </Typography>
        </View>

        {isApple || isGoogle ? (
          <Typography variant="small" color={colors.textSecondary}>
            {isApple ? t('deleteAccount.appleNote') : t('deleteAccount.googleNote')}
          </Typography>
        ) : null}

        <TextField
          label={t('deleteAccount.reasonLabel')}
          placeholder={t('deleteAccount.reasonPlaceholder')}
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={1000}
          editable={!busy}
          style={styles.multiline}
        />

        <Pressable
          onPress={() => setUnderstood((v) => !v)}
          disabled={busy}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: understood, disabled: busy }}
          accessibilityLabel={t('deleteAccount.confirmCheck')}
          style={({ pressed }) => [styles.check, pressed && styles.pressed]}
        >
          <View style={[styles.box, understood && styles.boxChecked]}>
            {understood ? <Check size={16} color={colors.surface} strokeWidth={2.5} /> : null}
          </View>
          <Typography variant="body" style={styles.flexText}>
            {t('deleteAccount.confirmCheck')}
          </Typography>
        </Pressable>

        {failureMessage ? <ErrorBox title={t('deleteAccount.failed')} message={failureMessage} /> : null}

        <DestructiveButton
          label={t('deleteAccount.action')}
          onPress={() => void onDelete()}
          disabled={!understood}
          loading={busy}
        />

        <View style={styles.other}>
          <Typography variant="small" color={colors.textSecondary} align="center">
            {t('deleteAccount.otherOptions')}
          </Typography>
          {links.accountDeletion ? (
            <TextLink
              label={t('deleteAccount.webPage')}
              onPress={() => links.accountDeletion && void openLink(links.accountDeletion)}
            />
          ) : null}
          <TextLink
            label={t('auth.cantAccessAction')}
            onPress={() => navigation.navigate('DeletionRequest', { email: user.email })}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Solid danger pill (the only destructive primary action in the app). */
function DestructiveButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.destructive,
        disabled && !loading && styles.destructiveDisabled,
        pressed && !inactive && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Typography style={styles.destructiveLabel} numberOfLines={2} align="center">
          {label}
        </Typography>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flexText: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, maxWidth: 620, width: '100%', alignSelf: 'center' },
  titleBlock: { gap: spacing.xxs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: '#F6E6E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F6E6E2',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, minHeight: TOUCH_TARGET },
  box: {
    width: 24,
    height: 24,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.softBrown,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  boxChecked: { backgroundColor: colors.danger, borderColor: colors.danger },
  destructive: {
    minHeight: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  destructiveDisabled: { opacity: 0.38 },
  destructiveLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20, color: colors.surface },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  other: { alignItems: 'center', gap: 0 },
});
