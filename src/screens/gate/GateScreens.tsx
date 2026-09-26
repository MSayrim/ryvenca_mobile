import { CircleCheck, Download, Wrench, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppConfig } from '../../api/types';
import { LanguageButton, LegalLinks, PrimaryButton, SecondaryButton, Typography, Wordmark } from '../../components';
import { useTranslation } from '../../i18n';
import { colors, radius, spacing } from '../../theme';
import { openExternal, storeUrl } from '../../utils/openLink';

/** Full-screen blocking message in the editorial style (wordmark · icon · title · text · action). */
function GateLayout({
  icon: Icon,
  iconColor = colors.brown,
  title,
  children,
  footer,
}: {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <LanguageButton style={styles.language} />
      <View style={styles.center}>
        <Wordmark size={26} />
        <View style={styles.card} accessibilityRole="alert">
          <View style={styles.iconWrap}>
            <Icon size={28} color={iconColor} strokeWidth={1.5} />
          </View>
          <Typography variant="h2" align="center" accessibilityRole="header">
            {title}
          </Typography>
          {children}
        </View>
      </View>
      {footer}
    </ScrollView>
  );
}

/** `config.maintenance.enabled` → blocks the whole app until the flag is cleared. */
export function MaintenanceScreen({
  config,
  onRetry,
  retrying,
}: {
  config: AppConfig;
  onRetry: () => void;
  retrying: boolean;
}) {
  const { t } = useTranslation();
  return (
    <GateLayout
      icon={Wrench}
      title={t('gate.maintenance.title')}
      footer={<LegalLinks links={config.links} style={styles.footer} />}
    >
      <Typography variant="body" align="center" color={colors.textSecondary}>
        {config.maintenance.message ?? t('gate.maintenance.message')}
      </Typography>
      <SecondaryButton label={t('common.retry')} onPress={onRetry} loading={retrying} fullWidth />
    </GateLayout>
  );
}

/** Installed version < `config.minVersion.<platform>` → must update from the store. */
export function UpdateRequiredScreen({
  config,
  installed,
  required,
}: {
  config: AppConfig;
  installed: string;
  required: string;
}) {
  const { t } = useTranslation();
  const url = storeUrl(config.links, Platform.OS);
  return (
    <GateLayout icon={Download} title={t('gate.update.title')} footer={<LegalLinks links={config.links} style={styles.footer} />}>
      <Typography variant="body" align="center" color={colors.textSecondary}>
        {t('gate.update.message')}
      </Typography>
      <Typography variant="caption" align="center" color={colors.textMuted}>
        {t('gate.update.versions', { installed, required })}
      </Typography>
      {url ? (
        <PrimaryButton label={t('gate.update.action')} icon={Download} onPress={() => void openExternal(url)} fullWidth />
      ) : (
        <Typography variant="smallMedium" align="center">
          {t('gate.update.noStoreLink')}
        </Typography>
      )}
    </GateLayout>
  );
}

/** Shown once after an in-app deletion (DELETE /api/me succeeded). */
export function AccountDeletedScreen({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();
  return (
    <GateLayout icon={CircleCheck} iconColor={colors.success} title={t('deleteAccount.deleted.title')}>
      <Typography variant="body" align="center" color={colors.textSecondary}>
        {t('deleteAccount.deleted.message')}
      </Typography>
      <PrimaryButton label={t('deleteAccount.deleted.action')} onPress={onContinue} fullWidth />
    </GateLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  language: { alignSelf: 'flex-end' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'stretch', gap: spacing.xl, paddingVertical: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { marginTop: spacing.md },
});
